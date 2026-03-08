import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface QuestionData {
  id: string;
  title: string;
  body?: string;
  tags?: string[];
  answerCount: number;
  voteCount: number;
  solved?: boolean;
  createdAt: string;
  author?: {
    displayName: string;
    username: string;
  };
}

interface QuestionCardProps {
  question: QuestionData;
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

export default function QuestionCard({ question, onPress }: QuestionCardProps) {
  return (
    <TouchableOpacity
      className="bg-white mx-4 my-1.5 rounded-2xl shadow-sm overflow-hidden"
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View className="flex-row p-4">
        <View className="items-center mr-4 pt-1">
          <Ionicons name="caret-up-outline" size={20} color="#9ca3af" />
          <Text className="text-base font-bold text-dark-900">{question.voteCount}</Text>
          <Ionicons name="caret-down-outline" size={20} color="#9ca3af" />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-dark-900 leading-6" numberOfLines={2}>
            {question.title}
          </Text>

          {question.body && (
            <Text className="text-sm text-gray-500 mt-1 leading-5" numberOfLines={2}>
              {question.body}
            </Text>
          )}

          {question.tags && question.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5 mt-2">
              {question.tags.slice(0, 4).map((tag) => (
                <View key={tag} className="bg-primary-50 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[11px] text-primary-700 font-medium">{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View className="flex-row items-center mt-3">
            <View
              className={`flex-row items-center px-2 py-0.5 rounded-full mr-3 ${
                question.solved ? "bg-green-50" : "bg-gray-100"
              }`}
            >
              <Ionicons
                name={question.solved ? "checkmark-circle" : "chatbubbles-outline"}
                size={14}
                color={question.solved ? "#10b981" : "#9ca3af"}
              />
              <Text
                className={`text-xs ml-1 font-medium ${
                  question.solved ? "text-green-600" : "text-gray-500"
                }`}
              >
                {question.answerCount} {question.answerCount === 1 ? "answer" : "answers"}
              </Text>
            </View>

            {question.solved && (
              <View className="bg-green-50 px-2 py-0.5 rounded-full mr-3">
                <Text className="text-xs text-green-600 font-semibold">Solved</Text>
              </View>
            )}

            <Text className="text-xs text-gray-400 ml-auto">
              {question.author?.displayName} · {formatTime(question.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
