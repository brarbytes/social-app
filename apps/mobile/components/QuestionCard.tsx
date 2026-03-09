import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface QuestionCardProps {
  question: any;
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
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="bg-white mx-4 my-1.5 rounded-2xl shadow-sm p-4"
      onPress={() => router.push(`/question/${question.id}`)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        <View className="items-center mr-3 pt-1">
          <Ionicons name="caret-up-outline" size={20} color="#9ca3af" />
          <Text className="text-sm font-bold text-dark-900">
            {question.voteCount ?? question._count?.votes ?? 0}
          </Text>
          <Ionicons name="caret-down-outline" size={20} color="#9ca3af" />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-dark-900 leading-5" numberOfLines={2}>
            {question.title}
          </Text>

          {question.topics && question.topics.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5 mt-2">
              {question.topics.map((t: any) => (
                <View
                  key={t.id}
                  className="bg-primary-50 px-2 py-0.5 rounded-full"
                >
                  <Text className="text-[11px] text-primary-700 font-medium">
                    {t.topic?.icon ? `${t.topic.icon} ` : ""}
                    {t.topic?.name}
                    {t.subTopic ? ` › ${t.subTopic.name}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {question.tags && question.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5 mt-1.5">
              {question.tags.map((tag: string) => (
                <View key={tag} className="bg-gray-100 px-2 py-0.5 rounded-full">
                  <Text className="text-[11px] text-gray-600">{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View className="flex-row items-center mt-2.5">
            <Text className="text-xs text-gray-500">
              {question.author?.displayName}
            </Text>
            {(question.author?.helpfulnessScore ?? 0) > 0 && (
              <View className="flex-row items-center ml-1.5">
                <Ionicons name="star" size={10} color="#f59e0b" />
                <Text className="text-[10px] text-amber-600 ml-0.5 font-medium">
                  {question.author.helpfulnessScore}
                </Text>
              </View>
            )}
            <Text className="text-xs text-gray-400 ml-2">
              {formatTime(question.createdAt)}
            </Text>
            <View className="flex-1" />
            <View className="flex-row items-center">
              <Ionicons name="chatbubble-outline" size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-500 ml-1">
                {question._count?.answers ?? question.answers?.length ?? 0}
              </Text>
            </View>
            {question.solved && (
              <View className="flex-row items-center ml-3">
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text className="text-xs text-green-600 ml-0.5 font-medium">
                  Solved
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
