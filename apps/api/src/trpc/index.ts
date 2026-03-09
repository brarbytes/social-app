import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { prisma } from "@social-app/db";
import { verifyAccessToken } from "../middleware/auth.js";

export async function createContext({ req }: CreateFastifyContextOptions) {
  let user: Awaited<ReturnType<typeof prisma.user.findUnique>> | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const { userId } = verifyAccessToken(token);
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        prisma.user
          .update({ where: { id: userId }, data: { lastActiveAt: new Date() } })
          .catch(() => {});
      }
    } catch {
      // invalid token — user stays null
    }
  }

  return { user, prisma };
}

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
