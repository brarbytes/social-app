import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { trpc } from "@/lib/trpc";

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

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [comment, setComment] = useState("");
  const utils = trpc.useUtils();

  const { data: post, isLoading } = trpc.post.byId.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const voteMutation = trpc.post.vote?.useMutation({
    onSuccess: () => utils.post.byId.invalidate({ id: id! }),
  });

  const commentMutation = trpc.post.comment?.useMutation({
    onSuccess: () => {
      setComment("");
      utils.post.byId.invalidate({ id: id! });
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#d1d5db" />
        <Text className="text-gray-400 mt-3">Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-4 pt-4">
          <View className="flex-row items-center mb-4">
            {post.author?.avatarUrl ? (
              <Image
                source={{ uri: post.author.avatarUrl }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            ) : (
              <View className="w-11 h-11 rounded-full bg-primary-100 items-center justify-center">
                <Text className="text-primary font-bold">
                  {post.author?.displayName?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View className="ml-3">
              <Text className="text-base font-semibold text-dark-900">
                {post.author?.displayName}
              </Text>
              <Text className="text-sm text-gray-500">
                @{post.author?.username} · {formatTime(post.createdAt)}
              </Text>
            </View>
          </View>

          <Text className="text-base text-dark-900 leading-6 mb-4">
            {post.content}
          </Text>

          {post.imageUrl && (
            <Image
              source={{ uri: post.imageUrl }}
              style={{ width: "100%", height: 288, borderRadius: 12, marginBottom: 16 }}
              resizeMode="cover"
            />
          )}

          <View className="flex-row items-center py-3 border-t border-b border-gray-100">
            <TouchableOpacity
              className="flex-row items-center mr-6"
              onPress={() => voteMutation?.mutate({ postId: id!, value: 1 })}
            >
              <Ionicons
                name={post.userVote === 1 ? "arrow-up-circle" : "arrow-up-circle-outline"}
                size={26}
                color={post.userVote === 1 ? "#6366f1" : "#9ca3af"}
              />
            </TouchableOpacity>

            <Text className="text-lg font-bold text-dark-900 mr-6">
              {post.voteCount ?? 0}
            </Text>

            <TouchableOpacity
              className="flex-row items-center mr-6"
              onPress={() => voteMutation?.mutate({ postId: id!, value: -1 })}
            >
              <Ionicons
                name={post.userVote === -1 ? "arrow-down-circle" : "arrow-down-circle-outline"}
                size={26}
                color={post.userVote === -1 ? "#ef4444" : "#9ca3af"}
              />
            </TouchableOpacity>

            <View className="flex-row items-center ml-auto">
              <Ionicons name="chatbubble-outline" size={20} color="#9ca3af" />
              <Text className="text-sm text-gray-500 ml-1">
                {post.comments?.length ?? post.commentCount ?? 0}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 mt-4">
          <Text className="text-lg font-bold text-dark-900 mb-4">Comments</Text>

          {(post.comments ?? []).map((c: any) => (
            <View key={c.id} className="mb-4 pb-4 border-b border-gray-50">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
                  <Text className="text-xs font-bold text-gray-600">
                    {c.author?.displayName?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>
                <Text className="ml-2 text-sm font-semibold text-dark-900">
                  {c.author?.displayName}
                </Text>
                <Text className="ml-2 text-xs text-gray-400">
                  {formatTime(c.createdAt)}
                </Text>
              </View>
              <Text className="text-sm text-gray-700 leading-5 ml-10">
                {c.content}
              </Text>
            </View>
          ))}

          {(post.comments ?? []).length === 0 && (
            <View className="items-center py-8">
              <Text className="text-gray-400">No comments yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <View className="flex-row items-end">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-base text-dark-900 max-h-24"
            placeholder="Add a comment..."
            placeholderTextColor="#9ca3af"
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity
            className={`ml-3 w-11 h-11 rounded-full items-center justify-center ${
              comment.trim() ? "bg-primary" : "bg-gray-200"
            }`}
            onPress={() => {
              if (comment.trim()) {
                commentMutation?.mutate({ postId: id!, content: comment.trim() });
              }
            }}
            disabled={!comment.trim()}
          >
            <Ionicons
              name="send"
              size={18}
              color={comment.trim() ? "#ffffff" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
