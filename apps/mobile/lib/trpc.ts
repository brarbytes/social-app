import { createTRPCReact } from "@trpc/react-query";
import * as SecureStore from "expo-secure-store";
import type { AppRouter } from "@social-app/api/trpc";

export const trpc = createTRPCReact<AppRouter>();

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("accessToken");
  } catch {
    return null;
  }
}
