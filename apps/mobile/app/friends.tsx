import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

export default function FriendsScreen() {
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const utils = trpc.useUtils();

  const { data: friends, isLoading: loadingFriends } = trpc.friend.list.useQuery(
    undefined,
    { enabled: tab === "friends" }
  );

  const { data: requests, isLoading: loadingRequests } =
    trpc.friend.pendingRequests.useQuery(undefined, {
      enabled: tab === "requests",
    });

  const respondMutation = trpc.friend.respond.useMutation({
    onSuccess: () => {
      utils.friend.pendingRequests.invalidate();
      utils.friend.list.invalidate();
    },
  });

  const removeMutation = trpc.friend.remove.useMutation({
    onSuccess: () => utils.friend.list.invalidate(),
  });

  const isLoading = tab === "friends" ? loadingFriends : loadingRequests;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row px-4 py-3 bg-white">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg items-center ${
            tab === "friends" ? "bg-primary" : "bg-gray-100"
          }`}
          onPress={() => setTab("friends")}
        >
          <Text
            className={`font-semibold ${
              tab === "friends" ? "text-white" : "text-gray-600"
            }`}
          >
            Friends
          </Text>
        </TouchableOpacity>
        <View className="w-2" />
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg items-center ${
            tab === "requests" ? "bg-primary" : "bg-gray-100"
          }`}
          onPress={() => setTab("requests")}
        >
          <Text
            className={`font-semibold ${
              tab === "requests" ? "text-white" : "text-gray-600"
            }`}
          >
            Requests {(requests?.length ?? 0) > 0 ? `(${requests?.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : tab === "friends" ? (
        <FlatList
          data={friends ?? []}
          keyExtractor={(item: any) => item.friendshipId}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3">No friends yet</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <View className="bg-white mx-4 my-1.5 rounded-2xl p-4 flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                <Text className="text-primary font-bold text-lg">
                  {item.displayName?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-dark-900">
                  {item.displayName}
                </Text>
                <Text className="text-sm text-gray-500">@{item.username}</Text>
                {item.helpfulnessScore > 0 && (
                  <Text className="text-xs text-primary mt-0.5">
                    {item.helpfulnessScore} expert points
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() =>
                  removeMutation.mutate({ friendshipId: item.friendshipId })
                }
              >
                <Ionicons name="person-remove-outline" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={requests ?? []}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="mail-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3">No pending requests</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <View className="bg-white mx-4 my-1.5 rounded-2xl p-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                  <Text className="text-primary font-bold text-lg">
                    {item.requester?.displayName?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base font-semibold text-dark-900">
                    {item.requester?.displayName}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    @{item.requester?.username}
                  </Text>
                </View>
              </View>
              <View className="flex-row mt-3 gap-3">
                <TouchableOpacity
                  className="flex-1 py-2.5 rounded-xl bg-primary items-center"
                  onPress={() =>
                    respondMutation.mutate({
                      friendshipId: item.id,
                      status: "ACCEPTED",
                    })
                  }
                >
                  <Text className="text-white font-semibold">Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-2.5 rounded-xl bg-red-50 items-center"
                  onPress={() =>
                    respondMutation.mutate({
                      friendshipId: item.id,
                      status: "REJECTED",
                    })
                  }
                >
                  <Text className="text-red-500 font-semibold">Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
