import "../global.css";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc, API_URL } from "@/lib/trpc";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth";
import { useSocket } from "@/hooks/useSocket";

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useSocket();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/feed");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/trpc`,
          async headers() {
            const token = useAuthStore.getState().accessToken;
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  useEffect(() => {
    async function init() {
      await useAuthStore.getState().loadTokens();
      await SplashScreen.hideAsync();
    }
    init();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthGate>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#ffffff" },
              headerTintColor: "#0f172a",
              headerTitleStyle: { fontWeight: "600" },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="chat/[id]"
              options={{ title: "Chat", headerBackTitle: "Back" }}
            />
            <Stack.Screen
              name="post/[id]"
              options={{ title: "Post", headerBackTitle: "Back" }}
            />
            <Stack.Screen
              name="question/[id]"
              options={{ title: "Question", headerBackTitle: "Back" }}
            />
          </Stack>
          <StatusBar style="auto" />
        </AuthGate>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
