import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

type NotificationType = "like" | "comment" | "follow" | "mention" | "connection" | "answer";

const notificationIcons: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  like: "heart",
  comment: "chatbubble",
  follow: "person-add",
  mention: "at",
  connection: "people",
  answer: "checkmark-circle",
};

const notificationColors: Record<NotificationType, string> = {
  like: "#ef4444",
  comment: "#3b82f6",
  follow: "#6366f1",
  mention: "#f59e0b",
  connection: "#10b981",
  answer: "#8b5cf6",
};

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationsScreen() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = trpc.notification.list.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const markAllReadMutation = trpc.notification.markAllRead?.useMutation({
    onSuccess: () => refetch(),
  });

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {notifications.length > 0 && (
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <TouchableOpacity
            className="self-end"
            onPress={() => markAllReadMutation?.mutate()}
          >
            <Text className="text-primary font-semibold text-sm">Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
        renderItem={({ item }) => {
          const type = (item.type as NotificationType) || "like";
          const iconName = notificationIcons[type] || "notifications";
          const iconColor = notificationColors[type] || "#6366f1";

          return (
            <TouchableOpacity
              className={`flex-row items-start px-4 py-4 border-b border-gray-50 ${
                !item.read ? "bg-primary-50/50" : "bg-white"
              }`}
              activeOpacity={0.7}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${iconColor}20` }}
              >
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>

              <View className="flex-1">
                <Text className="text-sm text-dark-900 leading-5">
                  <Text className="font-semibold">{item.title}</Text>
                </Text>
                {item.body && (
                  <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={2}>
                    {item.body}
                  </Text>
                )}
                <Text className="text-xs text-gray-400 mt-1">
                  {formatTime(item.createdAt)}
                </Text>
              </View>

              {!item.read && (
                <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
              )}
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-400 text-lg mt-4">No notifications</Text>
            <Text className="text-gray-300 text-sm mt-1">
              You're all caught up!
            </Text>
          </View>
        }
      />
    </View>
  );
}
