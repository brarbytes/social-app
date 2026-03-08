import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { trpc } from "@/lib/trpc";
import QuestionCard from "@/components/QuestionCard";

type TabType = "people" | "questions" | "posts";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("people");

  const usersQuery = trpc.user?.search?.useQuery(
    { query },
    { enabled: activeTab === "people" && query.length > 0 }
  );

  const questionsQuery = trpc.question.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: activeTab === "questions",
    }
  );

  const questions = questionsQuery.data?.pages.flatMap((p) => p.questions) ?? [];

  const tabs: { key: TabType; label: string }[] = [
    { key: "people", label: "People" },
    { key: "questions", label: "Questions" },
    { key: "posts", label: "Posts" },
  ];

  const handleQuestionsEndReached = useCallback(() => {
    if (questionsQuery.hasNextPage && !questionsQuery.isFetchingNextPage) {
      questionsQuery.fetchNextPage();
    }
  }, [questionsQuery]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-2 pb-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-3 text-base text-dark-900"
            placeholder="Search people, questions, posts..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row mt-3 gap-2">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === tab.key ? "bg-primary" : "bg-gray-100"
              }`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === tab.key ? "text-white" : "text-gray-600"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === "people" && (
        <FlatList
          data={usersQuery?.data?.users ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity className="flex-row items-center bg-white mx-4 my-1 p-4 rounded-xl">
              {item.avatarUrl ? (
                <Image
                  source={{ uri: item.avatarUrl }}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                  <Text className="text-primary font-bold text-lg">
                    {item.displayName?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-dark-900">
                  {item.displayName}
                </Text>
                <Text className="text-sm text-gray-500">@{item.username}</Text>
              </View>
              <TouchableOpacity className="bg-primary px-4 py-2 rounded-lg">
                <Text className="text-white text-sm font-semibold">Follow</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3">
                {query ? "No users found" : "Search for people"}
              </Text>
            </View>
          }
        />
      )}

      {activeTab === "questions" && (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <QuestionCard
              question={item}
              onPress={() => router.push(`/question/${item.id}`)}
            />
          )}
          onEndReached={handleQuestionsEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="items-center py-20">
              {questionsQuery.isLoading ? (
                <ActivityIndicator size="large" color="#6366f1" />
              ) : (
                <>
                  <Ionicons name="help-circle-outline" size={48} color="#d1d5db" />
                  <Text className="text-gray-400 mt-3">No questions yet</Text>
                </>
              )}
            </View>
          }
        />
      )}

      {activeTab === "posts" && (
        <View className="flex-1 items-center justify-center py-20">
          <Ionicons name="newspaper-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-400 mt-3">
            {query ? "Search for posts" : "Type to search posts"}
          </Text>
        </View>
      )}
    </View>
  );
}
