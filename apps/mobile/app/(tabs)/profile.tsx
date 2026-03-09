import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data: expertise } = trpc.interest.myExpertise.useQuery();
  const { data: interests } = trpc.interest.myInterests.useQuery();
  const { data: friends } = trpc.friend.list.useQuery();

  if (!user) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="bg-white px-4 pt-6 pb-5">
        <View className="flex-row items-center">
          {user.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center">
              <Text className="text-primary font-bold text-3xl">
                {user.displayName?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
          )}

          <View className="flex-1 ml-4">
            <Text className="text-xl font-bold text-dark-900">
              {user.displayName}
            </Text>
            <Text className="text-sm text-gray-500">@{user.username}</Text>
            {user.bio && (
              <Text className="text-sm text-gray-700 mt-1">{user.bio}</Text>
            )}
          </View>
        </View>

        <View className="flex-row mt-5 gap-4">
          <View className="flex-1 bg-primary-50 rounded-xl py-3 items-center">
            <Text className="text-lg font-bold text-primary">
              {expertise?.reduce((sum: number, e: any) => sum + e.points, 0) ?? 0}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">Expert Points</Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-xl py-3 items-center">
            <Text className="text-lg font-bold text-green-600">
              {expertise?.reduce((sum: number, e: any) => sum + e.correctAnswers, 0) ?? 0}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">Accepted</Text>
          </View>
          <View className="flex-1 bg-blue-50 rounded-xl py-3 items-center">
            <Text className="text-lg font-bold text-blue-600">
              {friends?.length ?? 0}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">Friends</Text>
          </View>
        </View>
      </View>

      {(expertise ?? []).length > 0 && (
        <View className="bg-white mt-2 px-4 py-4">
          <Text className="text-base font-bold text-dark-900 mb-3">
            Expertise
          </Text>
          {(expertise ?? []).map((e: any) => (
            <View key={e.id} className="flex-row items-center py-2 border-b border-gray-50">
              <View className="w-8 h-8 rounded-lg bg-primary-100 items-center justify-center">
                <Text className="text-sm">{e.topic.icon || "📚"}</Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-dark-900">
                  {e.topic.name}
                  {e.subTopic ? ` › ${e.subTopic.name}` : ""}
                </Text>
                <Text className="text-xs text-gray-500">
                  {e.correctAnswers}/{e.totalAnswers} accepted
                </Text>
              </View>
              <View className="bg-primary-50 px-3 py-1 rounded-full">
                <Text className="text-sm font-bold text-primary">{e.points} pts</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {(interests ?? []).length > 0 && (
        <View className="bg-white mt-2 px-4 py-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-dark-900">Interests</Text>
            <TouchableOpacity onPress={() => router.push("/interests")}>
              <Text className="text-sm text-primary font-semibold">Edit</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {(interests ?? []).map((i: any) => (
              <View key={i.id} className="bg-gray-100 px-3 py-1.5 rounded-full">
                <Text className="text-sm text-gray-700">
                  {i.topic.icon || ""} {i.topic.name}
                  {i.subTopic ? ` › ${i.subTopic.name}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="bg-white mt-2 px-4 py-2">
        <TouchableOpacity
          className="flex-row items-center py-3.5 border-b border-gray-50"
          onPress={() => router.push("/friends")}
        >
          <Ionicons name="people-outline" size={22} color="#374151" />
          <Text className="flex-1 text-base text-dark-900 ml-3">Friends</Text>
          <Text className="text-sm text-gray-400 mr-2">{friends?.length ?? 0}</Text>
          <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-3.5 border-b border-gray-50"
          onPress={() => router.push("/interests")}
        >
          <Ionicons name="heart-outline" size={22} color="#374151" />
          <Text className="flex-1 text-base text-dark-900 ml-3">My Interests</Text>
          <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-3.5"
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text className="flex-1 text-base text-red-500 ml-3">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
