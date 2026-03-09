import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { trpc } from "@/lib/trpc";

interface ConnectionData {
  id: string;
  sender: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface ConnectionRequestCardProps {
  connection: ConnectionData;
  onRespond?: () => void;
}

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
  return `${days}d ago`;
}

export default function ConnectionRequestCard({
  connection,
  onRespond,
}: ConnectionRequestCardProps) {
  const respondMutation = trpc.connection.respond.useMutation({
    onSuccess: () => onRespond?.(),
  });

  const handleRespond = (accept: boolean) => {
    respondMutation.mutate({
      connectionId: connection.id,
      accept,
    });
  };

  return (
    <View className="bg-white mx-4 my-1.5 rounded-2xl shadow-sm p-4">
      <View className="flex-row items-center">
        {connection.sender.avatarUrl ? (
          <Image
            source={{ uri: connection.sender.avatarUrl }}
            style={{ width: 56, height: 56, borderRadius: 28 }}
          />
        ) : (
          <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center">
            <Text className="text-primary font-bold text-xl">
              {connection.sender.displayName?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}

        <View className="flex-1 ml-3">
          <Text className="text-base font-semibold text-dark-900">
            {connection.sender.displayName}
          </Text>
          <Text className="text-sm text-gray-500">
            @{connection.sender.username}
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            {formatTime(connection.createdAt)}
          </Text>
        </View>
      </View>

      <View className="flex-row mt-4 gap-3">
        <TouchableOpacity
          className="flex-1 py-3 rounded-xl bg-green-500 items-center"
          onPress={() => handleRespond(true)}
          disabled={respondMutation.isPending}
          activeOpacity={0.8}
        >
          {respondMutation.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="checkmark" size={18} color="#ffffff" />
              <Text className="text-white font-semibold ml-1">Accept</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 py-3 rounded-xl bg-red-50 items-center"
          onPress={() => handleRespond(false)}
          disabled={respondMutation.isPending}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center">
            <Ionicons name="close" size={18} color="#ef4444" />
            <Text className="text-red-500 font-semibold ml-1">Decline</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
