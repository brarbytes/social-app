import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

export default function AskQuestionScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSubTopics, setSelectedSubTopics] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const { data: topics } = trpc.interest.topics.useQuery();

  const createMutation = trpc.question.create.useMutation({
    onSuccess: (question) => {
      router.replace(`/question/${question.id}`);
    },
  });

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : prev.length < 3
        ? [...prev, topicId]
        : prev
    );
  };

  const toggleSubTopic = (subId: string) => {
    setSelectedSubTopics((prev) =>
      prev.includes(subId)
        ? prev.filter((id) => id !== subId)
        : prev.length < 5
        ? [...prev, subId]
        : prev
    );
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const canSubmit =
    title.trim().length >= 5 &&
    body.trim().length >= 20 &&
    selectedTopics.length >= 1;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="bg-white px-4 py-5 mb-2">
        <Text className="text-2xl font-bold text-dark-900">Ask a Question</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Your question will be routed to experts or community members
        </Text>
      </View>

      <View className="bg-white px-4 py-4 mb-2">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Title *</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base text-dark-900"
          placeholder="What's your question?"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View className="bg-white px-4 py-4 mb-2">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Details *</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base text-dark-900"
          placeholder="Provide context so people can help you better..."
          placeholderTextColor="#9ca3af"
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={5}
          style={{ minHeight: 120, textAlignVertical: "top" }}
        />
      </View>

      <View className="bg-white px-4 py-4 mb-2">
        <Text className="text-sm font-semibold text-gray-700 mb-1">
          Topics * (select 1-3)
        </Text>
        <Text className="text-xs text-gray-400 mb-3">
          Questions are routed to experts in these topics
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(topics ?? []).map((t: any) => (
            <TouchableOpacity
              key={t.id}
              className={`px-4 py-2 rounded-full ${
                selectedTopics.includes(t.id)
                  ? "bg-primary"
                  : "bg-gray-100"
              }`}
              onPress={() => toggleTopic(t.id)}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedTopics.includes(t.id)
                    ? "text-white"
                    : "text-gray-600"
                }`}
              >
                {t.icon ? `${t.icon} ` : ""}{t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedTopics.length > 0 && (
          <View className="mt-4">
            <Text className="text-xs text-gray-500 mb-2">Subtopics (optional)</Text>
            <View className="flex-row flex-wrap gap-2">
              {(topics ?? [])
                .filter((t: any) => selectedTopics.includes(t.id))
                .flatMap((t: any) => t.subtopics ?? [])
                .map((sub: any) => (
                  <TouchableOpacity
                    key={sub.id}
                    className={`px-3 py-1.5 rounded-full ${
                      selectedSubTopics.includes(sub.id)
                        ? "bg-primary-100 border border-primary"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                    onPress={() => toggleSubTopic(sub.id)}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedSubTopics.includes(sub.id)
                          ? "text-primary"
                          : "text-gray-600"
                      }`}
                    >
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}
      </View>

      <View className="bg-white px-4 py-4 mb-2">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Tags (optional)
        </Text>
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-base text-dark-900"
            placeholder="Add a tag..."
            placeholderTextColor="#9ca3af"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
          />
          <TouchableOpacity
            className="ml-2 bg-gray-200 p-2.5 rounded-xl"
            onPress={addTag}
          >
            <Ionicons name="add" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
        {tags.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <View
                key={tag}
                className="flex-row items-center bg-primary-50 px-3 py-1 rounded-full"
              >
                <Text className="text-xs text-primary-700 font-medium">{tag}</Text>
                <TouchableOpacity
                  className="ml-1"
                  onPress={() => setTags(tags.filter((t) => t !== tag))}
                >
                  <Ionicons name="close" size={14} color="#6366f1" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="px-4 mt-4">
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${
            canSubmit ? "bg-primary" : "bg-gray-300"
          }`}
          onPress={() => {
            if (canSubmit) {
              createMutation.mutate({
                title: title.trim(),
                body: body.trim(),
                tags,
                topicIds: selectedTopics,
                subTopicIds: selectedSubTopics,
                groupId,
              });
            }
          }}
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-base">
              Post Question
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
