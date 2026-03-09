import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

export default function GroupsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"discover" | "mine">("mine");
  const [search, setSearch] = useState("");

  const myGroups = trpc.group.myGroups.useQuery(undefined, {
    enabled: tab === "mine",
  });

  const discover = trpc.group.list.useQuery(
    { search: search || undefined, limit: 20 },
    { enabled: tab === "discover" }
  );

  const data = tab === "mine" ? myGroups : discover;
  const groups = tab === "mine" ? myGroups.data : discover.data?.groups;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-3 pb-2 bg-white">
        <View className="flex-row mb-3">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${
              tab === "mine" ? "bg-primary" : "bg-gray-100"
            }`}
            onPress={() => setTab("mine")}
          >
            <Text
              className={`font-semibold ${
                tab === "mine" ? "text-white" : "text-gray-600"
              }`}
            >
              My Groups
            </Text>
          </TouchableOpacity>
          <View className="w-2" />
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${
              tab === "discover" ? "bg-primary" : "bg-gray-100"
            }`}
            onPress={() => setTab("discover")}
          >
            <Text
              className={`font-semibold ${
                tab === "discover" ? "text-white" : "text-gray-600"
              }`}
            >
              Discover
            </Text>
          </TouchableOpacity>
        </View>

        {tab === "discover" && (
          <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5">
            <Ionicons name="search" size={18} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 text-base text-dark-900"
              placeholder="Search groups..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        )}
      </View>

      {data.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={groups as any[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={data.isRefetching}
              onRefresh={() => data.refetch()}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-base">
                {tab === "mine" ? "Join a group to get started" : "No groups found"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white mx-4 my-1.5 rounded-2xl p-4 shadow-sm"
              onPress={() => router.push(`/group/${item.id}`)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-xl bg-primary-100 items-center justify-center">
                  <Ionicons name="people" size={24} color="#6366f1" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base font-semibold text-dark-900">
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                  <View className="flex-row items-center mt-1">
                    <Text className="text-xs text-gray-400">
                      {item._count?.members ?? 0} members
                    </Text>
                    <Text className="text-xs text-gray-300 mx-2">·</Text>
                    <Text className="text-xs text-gray-400">
                      {item._count?.questions ?? 0} questions
                    </Text>
                    {item.role && (
                      <>
                        <Text className="text-xs text-gray-300 mx-2">·</Text>
                        <Text className="text-xs text-primary font-medium">
                          {item.role}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        onPress={() => router.push("/group/create")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
