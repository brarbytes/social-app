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
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";

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

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [answer, setAnswer] = useState("");
  const currentUser = useAuthStore((s) => s.user);
  const utils = trpc.useUtils();

  const { data: question, isLoading } = trpc.question.byId.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const voteMutation = trpc.question.vote?.useMutation({
    onSuccess: () => utils.question.byId.invalidate({ id: id! }),
  });

  const answerMutation = trpc.question.answer?.useMutation({
    onSuccess: () => {
      setAnswer("");
      utils.question.byId.invalidate({ id: id! });
    },
  });

  const acceptMutation = trpc.question.acceptAnswer?.useMutation({
    onSuccess: () => utils.question.byId.invalidate({ id: id! }),
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!question) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#d1d5db" />
        <Text className="text-gray-400 mt-3">Question not found</Text>
      </View>
    );
  }

  const isAuthor = currentUser?.id === question.authorId;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-4 pt-4">
          <View className="flex-row">
            <View className="items-center mr-4">
              <TouchableOpacity
                onPress={() => voteMutation?.mutate({ questionId: id!, value: 1 })}
              >
                <Ionicons
                  name={question.userVote === 1 ? "caret-up" : "caret-up-outline"}
                  size={32}
                  color={question.userVote === 1 ? "#6366f1" : "#9ca3af"}
                />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-dark-900 my-1">
                {question.voteCount ?? 0}
              </Text>
              <TouchableOpacity
                onPress={() => voteMutation?.mutate({ questionId: id!, value: -1 })}
              >
                <Ionicons
                  name={question.userVote === -1 ? "caret-down" : "caret-down-outline"}
                  size={32}
                  color={question.userVote === -1 ? "#ef4444" : "#9ca3af"}
                />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <Text className="text-xl font-bold text-dark-900 leading-7">
                {question.title}
              </Text>
              <Text className="text-base text-gray-700 mt-3 leading-6">
                {question.body}
              </Text>

              {question.tags && question.tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-4">
                  {question.tags.map((tag: string) => (
                    <View key={tag} className="bg-primary-50 px-3 py-1 rounded-full">
                      <Text className="text-xs text-primary-700 font-medium">{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View className="flex-row items-center mt-4">
                <Text className="text-sm text-gray-500">
                  Asked by{" "}
                  <Text className="font-semibold text-dark-900">
                    {question.author?.displayName}
                  </Text>
                </Text>
                <Text className="text-sm text-gray-400 ml-2">
                  {formatTime(question.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-6 border-t border-gray-100">
          <View className="px-4 py-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-dark-900">
              {question.answers?.length ?? 0} Answers
            </Text>
            {question.solved && (
              <View className="flex-row items-center bg-green-50 px-3 py-1 rounded-full">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-green-600 text-xs font-semibold ml-1">Solved</Text>
              </View>
            )}
          </View>

          {(question.answers ?? []).map((a: any) => (
            <View
              key={a.id}
              className={`px-4 py-4 border-b border-gray-50 ${
                a.accepted ? "bg-green-50/50" : ""
              }`}
            >
              <View className="flex-row">
                <View className="items-center mr-3">
                  <Ionicons name="caret-up-outline" size={24} color="#9ca3af" />
                  <Text className="text-sm font-bold text-dark-900">
                    {a.voteCount ?? 0}
                  </Text>
                  <Ionicons name="caret-down-outline" size={24} color="#9ca3af" />

                  {a.accepted && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#10b981"
                      style={{ marginTop: 8 }}
                    />
                  )}

                  {isAuthor && !a.accepted && !question.solved && (
                    <TouchableOpacity
                      className="mt-2"
                      onPress={() =>
                        acceptMutation?.mutate({ questionId: id!, answerId: a.id })
                      }
                    >
                      <Ionicons name="checkmark-circle-outline" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-base text-gray-700 leading-6">{a.body}</Text>
                  <View className="flex-row items-center mt-3">
                    <Text className="text-sm text-gray-500">
                      {a.author?.displayName}
                    </Text>
                    <Text className="text-sm text-gray-400 ml-2">
                      {formatTime(a.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {(question.answers ?? []).length === 0 && (
            <View className="items-center py-8">
              <Text className="text-gray-400">No answers yet. Be the first!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <View className="flex-row items-end">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-base text-dark-900 max-h-24"
            placeholder="Write your answer..."
            placeholderTextColor="#9ca3af"
            value={answer}
            onChangeText={setAnswer}
            multiline
          />
          <TouchableOpacity
            className={`ml-3 w-11 h-11 rounded-full items-center justify-center ${
              answer.trim() ? "bg-primary" : "bg-gray-200"
            }`}
            onPress={() => {
              if (answer.trim()) {
                answerMutation?.mutate({ questionId: id!, body: answer.trim() });
              }
            }}
            disabled={!answer.trim()}
          >
            <Ionicons
              name="send"
              size={18}
              color={answer.trim() ? "#ffffff" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
