import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";
import QuestionCard from "@/components/QuestionCard";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"questions" | "members">("questions");

  const { data: group, isLoading } = trpc.group.byId.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const { data: questionsData } = trpc.question.feed.useQuery(
    { groupId: id!, limit: 20 },
    { enabled: !!id && activeTab === "questions" }
  );

  const joinMutation = trpc.group.join.useMutation({
    onSuccess: () => utils.group.byId.invalidate({ id: id! }),
  });

  const leaveMutation = trpc.group.leave.useMutation({
    onSuccess: () => utils.group.byId.invalidate({ id: id! }),
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!group) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#d1d5db" />
        <Text className="text-gray-400 mt-3">Group not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => utils.group.byId.invalidate({ id: id! })}
          tintColor="#6366f1"
        />
      }
    >
      <View className="bg-white px-4 py-5 mb-2">
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-2xl bg-primary-100 items-center justify-center">
            <Ionicons name="people" size={32} color="#6366f1" />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-xl font-bold text-dark-900">{group.name}</Text>
            <Text className="text-sm text-gray-500 mt-1">
              {group._count.members} members · {group._count.questions} questions
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-gray-600">{group.visibility}</Text>
              </View>
              {group.category && (
                <View className="bg-primary-50 px-2 py-0.5 rounded-full ml-2">
                  <Text className="text-xs text-primary-700">{group.category}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {group.description && (
          <Text className="text-base text-gray-700 mt-4">{group.description}</Text>
        )}

        <View className="mt-4">
          {group.isMember ? (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-primary items-center"
                onPress={() =>
                  router.push({
                    pathname: "/question/ask",
                    params: { groupId: id },
                  })
                }
              >
                <Text className="text-white font-semibold">Ask Question</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 px-4 rounded-xl bg-red-50 items-center"
                onPress={() => leaveMutation.mutate({ groupId: id! })}
              >
                <Text className="text-red-500 font-semibold">Leave</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="py-3 rounded-xl bg-primary items-center"
              onPress={() => joinMutation.mutate({ groupId: id! })}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold">Join Group</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-row px-4 py-2 bg-white mb-2">
        <TouchableOpacity
          className={`flex-1 py-2 items-center border-b-2 ${
            activeTab === "questions"
              ? "border-primary"
              : "border-transparent"
          }`}
          onPress={() => setActiveTab("questions")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "questions" ? "text-primary" : "text-gray-500"
            }`}
          >
            Questions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 items-center border-b-2 ${
            activeTab === "members"
              ? "border-primary"
              : "border-transparent"
          }`}
          onPress={() => setActiveTab("members")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "members" ? "text-primary" : "text-gray-500"
            }`}
          >
            Members
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "questions" && (
        <View>
          {(questionsData?.questions ?? []).map((q: any) => (
            <QuestionCard key={q.id} question={q} />
          ))}
          {(questionsData?.questions ?? []).length === 0 && (
            <View className="items-center mt-10">
              <Text className="text-gray-400">No questions yet</Text>
            </View>
          )}
        </View>
      )}

      {activeTab === "members" && (
        <View className="px-4">
          {(group.members ?? []).map((m: any) => (
            <View
              key={m.id}
              className="flex-row items-center py-3 border-b border-gray-50"
            >
              <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                <Text className="text-primary font-bold">
                  {m.user.displayName?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-dark-900">
                  {m.user.displayName}
                </Text>
                <Text className="text-sm text-gray-500">@{m.user.username}</Text>
              </View>
              <View className="bg-gray-100 px-2 py-1 rounded-full">
                <Text className="text-xs text-gray-600">{m.role}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
