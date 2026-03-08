import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { loginSchema, registerSchema } from "@social-app/shared";
import { router, publicProcedure, protectedProcedure } from "../index.js";
import {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyRefreshToken,
} from "../../middleware/auth.js";

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already in use",
        });
      }

      const passwordHash = await hashPassword(input.password);
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          username: input.username,
          displayName: input.displayName,
          passwordHash,
        },
      });

      const tokens = generateTokens(user.id);
      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, ...tokens };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const valid = await comparePassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const tokens = generateTokens(user.id);
      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, ...tokens };
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { userId } = verifyRefreshToken(input.refreshToken);
        const tokens = generateTokens(userId);
        return tokens;
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid refresh token",
        });
      }
    }),

  me: protectedProcedure.query(({ ctx }) => {
    const { passwordHash: _, ...userWithoutPassword } = ctx.user;
    return userWithoutPassword;
  }),
});
