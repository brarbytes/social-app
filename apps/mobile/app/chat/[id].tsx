import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";
import { socket } from "@/lib/socket";
import ChatBubble from "@/components/ChatBubble";

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const flatListRef = useRef<FlatList>(null);
  const [message, setMessage] = useState("");
  const currentUser = useAuthStore((s) => s.user);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const conversationTyping = typingUsers.get(id!) ?? [];

  useEffect(() => {
    setActiveConversation(id!);
    return () => setActiveConversation(null);
  }, [id, setActiveConversation]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = trpc.chat.messages.useInfiniteQuery(
    { conversationId: id!, limit: 30 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!id,
    }
  );

  const sendMutation = trpc.chat.sendMessage.useMutation();

  const messages = data?.pages.flatMap((page) => page.messages) ?? [];

  const handleSend = useCallback(() => {
    const text = message.trim();
    if (!text || !id) return;

    sendMutation.mutate({ conversationId: id, content: text });

    socket?.emit("chat:message", {
      conversationId: id,
      content: text,
    });

    setMessage("");
  }, [message, id, sendMutation]);

  const handleTyping = useCallback(
    (text: string) => {
      setMessage(text);
      if (text.length > 0) {
        socket?.emit("chat:typing:start", { conversationId: id });
      } else {
        socket?.emit("chat:typing:stop", { conversationId: id });
      }
    },
    [id]
  );

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
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen options={{ title: "Chat" }} />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isOwn={item.senderId === currentUser?.id}
          />
        )}
        ListHeaderComponent={
          conversationTyping.length > 0 ? (
            <View className="px-4 py-2">
              <Text className="text-xs text-gray-400 italic">
                Someone is typing...
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20 rotate-180">
            <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-3">No messages yet</Text>
            <Text className="text-gray-300 text-sm mt-1">Say hello!</Text>
          </View>
        }
      />

      <View className="bg-white border-t border-gray-100 px-4 py-3">
        <View className="flex-row items-end">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-base text-dark-900 max-h-24"
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={message}
            onChangeText={handleTyping}
            multiline
          />
          <TouchableOpacity
            className={`ml-3 w-11 h-11 rounded-full items-center justify-center ${
              message.trim() ? "bg-primary" : "bg-gray-200"
            }`}
            onPress={handleSend}
            disabled={!message.trim()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={18}
              color={message.trim() ? "#ffffff" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
