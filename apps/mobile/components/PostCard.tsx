import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

interface PostAuthor {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface PostData {
  id: string;
  content: string;
  imageUrl?: string | null;
  voteCount: number;
  commentCount: number;
  createdAt: string;
  userVote?: number | null;
  author: PostAuthor;
}

interface PostCardProps {
  post: PostData;
  onPress?: () => void;
}

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

export default function PostCard({ post, onPress }: PostCardProps) {
  return (
    <TouchableOpacity
      className="bg-white mx-4 my-1.5 rounded-2xl shadow-sm overflow-hidden"
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View className="p-4">
        <View className="flex-row items-center mb-3">
          {post.author?.avatarUrl ? (
            <Image
              source={{ uri: post.author.avatarUrl }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
              <Text className="text-primary font-bold">
                {post.author?.displayName?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <View className="flex-1 ml-3">
            <Text className="text-sm font-semibold text-dark-900">
              {post.author?.displayName}
            </Text>
            <Text className="text-xs text-gray-400">
              @{post.author?.username} · {formatTime(post.createdAt)}
            </Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <Text className="text-base text-dark-900 leading-6 mb-3" numberOfLines={6}>
          {post.content}
        </Text>
      </View>

      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          className="w-full h-52"
          contentFit="cover"
        />
      )}

      <View className="flex-row items-center px-4 py-3 border-t border-gray-50">
        <TouchableOpacity className="flex-row items-center mr-1">
          <Ionicons
            name={post.userVote === 1 ? "arrow-up-circle" : "arrow-up-circle-outline"}
            size={22}
            color={post.userVote === 1 ? "#6366f1" : "#9ca3af"}
          />
        </TouchableOpacity>

        <Text className="text-sm font-semibold text-dark-900 mx-1">
          {post.voteCount}
        </Text>

        <TouchableOpacity className="flex-row items-center mr-5">
          <Ionicons
            name={post.userVote === -1 ? "arrow-down-circle" : "arrow-down-circle-outline"}
            size={22}
            color={post.userVote === -1 ? "#ef4444" : "#9ca3af"}
          />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center mr-5" onPress={onPress}>
          <Ionicons name="chatbubble-outline" size={18} color="#9ca3af" />
          <Text className="text-sm text-gray-500 ml-1">{post.commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center ml-auto">
          <Ionicons name="share-outline" size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
