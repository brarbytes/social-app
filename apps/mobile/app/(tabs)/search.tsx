import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";
import QuestionCard from "@/components/QuestionCard";

export default function QAScreen() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>();

  const { data: topics } = trpc.interest.topics.useQuery();

  const {
    data: questionsData,
    isLoading,
    isRefetching,
    refetch,
  } = trpc.question.feed.useQuery({
    limit: 20,
    topicId: selectedTopic,
  });

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <TouchableOpacity
            className={`px-4 py-2 rounded-full mr-2 ${
              !selectedTopic ? "bg-primary" : "bg-gray-100"
            }`}
            onPress={() => setSelectedTopic(undefined)}
          >
            <Text
              className={`text-sm font-semibold ${
                !selectedTopic ? "text-white" : "text-gray-600"
              }`}
            >
              All
            </Text>
          </TouchableOpacity>
          {(topics ?? []).map((t: any) => (
            <TouchableOpacity
              key={t.id}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedTopic === t.id ? "bg-primary" : "bg-gray-100"
              }`}
              onPress={() =>
                setSelectedTopic(selectedTopic === t.id ? undefined : t.id)
              }
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedTopic === t.id ? "text-white" : "text-gray-600"
                }`}
              >
                {t.icon ? `${t.icon} ` : ""}{t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={questionsData?.questions ?? []}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="help-circle-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-base">
                No questions yet. Be the first to ask!
              </Text>
            </View>
          }
          renderItem={({ item }) => <QuestionCard question={item} />}
        />
      )}

      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        onPress={() => router.push("/question/ask")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
