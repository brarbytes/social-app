import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { trpc } from "@/lib/trpc";

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

export default function ChatListScreen() {
  const router = useRouter();
  const { data, isLoading } = trpc.chat.conversations.useQuery();

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={data?.conversations ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center px-4 py-3 border-b border-gray-50"
            onPress={() => router.push(`/chat/${item.id}`)}
            activeOpacity={0.7}
          >
            {item.avatarUrl ? (
              <Image
                source={{ uri: item.avatarUrl }}
                style={{ width: 56, height: 56, borderRadius: 28 }}
              />
            ) : (
              <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center">
                <Text className="text-primary font-bold text-xl">
                  {item.name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}

            <View className="flex-1 ml-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-dark-900" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.lastMessage && (
                  <Text className="text-xs text-gray-400">
                    {formatTime(item.lastMessage.createdAt)}
                  </Text>
                )}
              </View>
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-sm text-gray-500 flex-1 mr-2" numberOfLines={1}>
                  {item.lastMessage?.content || "No messages yet"}
                </Text>
                {item.unreadCount > 0 && (
                  <View className="bg-primary rounded-full min-w-[22px] h-[22px] items-center justify-center px-1.5">
                    <Text className="text-white text-xs font-bold">
                      {item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-400 text-lg mt-4">No conversations</Text>
            <Text className="text-gray-300 text-sm mt-1">Start chatting with someone!</Text>
          </View>
        }
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        onPress={() => {}}
        activeOpacity={0.8}
      >
        <Ionicons name="create-outline" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
