import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createGroupSchema,
  updateGroupSchema,
  joinGroupSchema,
  groupMemberActionSchema,
} from "@social-app/shared";
import { router, publicProcedure, protectedProcedure } from "../index.js";

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const groupRouter = router({
  list: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        category: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const groups = await ctx.prisma.group.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where: {
          ...(input.category ? { category: input.category } : {}),
          ...(input.search
            ? {
                OR: [
                  { name: { contains: input.search, mode: "insensitive" as const } },
                  { description: { contains: input.search, mode: "insensitive" as const } },
                ],
              }
            : {}),
          visibility: { not: "INVITE_ONLY" },
        },
        include: {
          _count: { select: { members: true, posts: true, questions: true } },
        },
      });

      let nextCursor: string | undefined;
      if (groups.length > input.limit) {
        const next = groups.pop();
        nextCursor = next?.id;
      }

      return { groups, nextCursor };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const group = await ctx.prisma.group.findUnique({
        where: { id: input.id },
        include: {
          members: {
            include: { user: { select: userSelect } },
            orderBy: { joinedAt: "asc" },
            take: 20,
          },
          _count: { select: { members: true, posts: true, questions: true } },
        },
      });
      if (!group) throw new TRPCError({ code: "NOT_FOUND" });

      let isMember = false;
      let userRole: string | null = null;
      if (ctx.user) {
        const membership = await ctx.prisma.groupMember.findUnique({
          where: { userId_groupId: { userId: ctx.user.id, groupId: input.id } },
        });
        isMember = !!membership;
        userRole = membership?.role ?? null;
      }

      return { ...group, isMember, userRole };
    }),

  myGroups: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.prisma.groupMember.findMany({
      where: { userId: ctx.user.id },
      include: {
        group: {
          include: {
            _count: { select: { members: true, posts: true, questions: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    return memberships.map((m) => ({ ...m.group, role: m.role }));
  }),

  create: protectedProcedure
    .input(createGroupSchema)
    .mutation(async ({ input, ctx }) => {
      const baseSlug = slugify(input.name);
      let slug = baseSlug;
      let attempt = 0;
      while (await ctx.prisma.group.findUnique({ where: { slug } })) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }

      const group = await ctx.prisma.group.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          visibility: input.visibility,
          category: input.category,
          members: {
            create: { userId: ctx.user.id, role: "ADMIN" },
          },
        },
      });

      return group;
    }),

  update: protectedProcedure
    .input(updateGroupSchema)
    .mutation(async ({ input, ctx }) => {
      const membership = await ctx.prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId: ctx.user.id, groupId: input.groupId },
        },
      });
      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { groupId, ...data } = input;
      return ctx.prisma.group.update({
        where: { id: groupId },
        data,
      });
    }),

  join: protectedProcedure
    .input(joinGroupSchema)
    .mutation(async ({ input, ctx }) => {
      const group = await ctx.prisma.group.findUnique({
        where: { id: input.groupId },
      });
      if (!group) throw new TRPCError({ code: "NOT_FOUND" });
      if (group.visibility === "INVITE_ONLY") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invite-only group" });
      }

      return ctx.prisma.groupMember.create({
        data: { userId: ctx.user.id, groupId: input.groupId },
      });
    }),

  leave: protectedProcedure
    .input(joinGroupSchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.groupMember.delete({
        where: {
          userId_groupId: { userId: ctx.user.id, groupId: input.groupId },
        },
      });
      return { success: true };
    }),

  setRole: protectedProcedure
    .input(groupMemberActionSchema)
    .mutation(async ({ input, ctx }) => {
      const myMembership = await ctx.prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId: ctx.user.id, groupId: input.groupId },
        },
      });
      if (!myMembership || myMembership.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.prisma.groupMember.update({
        where: {
          userId_groupId: { userId: input.userId, groupId: input.groupId },
        },
        data: { role: input.role ?? "CONTRIBUTOR" },
      });
    }),

  removeMember: protectedProcedure
    .input(z.object({ groupId: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const myMembership = await ctx.prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId: ctx.user.id, groupId: input.groupId },
        },
      });
      if (!myMembership || !["ADMIN", "MODERATOR"].includes(myMembership.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.prisma.groupMember.delete({
        where: {
          userId_groupId: { userId: input.userId, groupId: input.groupId },
        },
      });
      return { success: true };
    }),
});
