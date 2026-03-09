import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

export default function InterestsScreen() {
  const router = useRouter();
  const { data: topics, isLoading } = trpc.interest.topics.useQuery();
  const { data: myInterests } = trpc.interest.myInterests.useQuery();
  const utils = trpc.useUtils();

  const [selected, setSelected] = useState<
    Map<string, { topicId: string; subTopicIds: string[] }>
  >(new Map());

  useEffect(() => {
    if (myInterests) {
      const map = new Map<string, { topicId: string; subTopicIds: string[] }>();
      for (const i of myInterests) {
        if (i.manual) {
          const existing = map.get(i.topicId) ?? {
            topicId: i.topicId,
            subTopicIds: [],
          };
          if (i.subTopic) {
            existing.subTopicIds.push(i.subTopic.id);
          }
          map.set(i.topicId, existing);
        }
      }
      setSelected(map);
    }
  }, [myInterests]);

  const saveMutation = trpc.interest.setInterests.useMutation({
    onSuccess: () => {
      utils.interest.myInterests.invalidate();
      router.back();
    },
  });

  const toggleTopic = (topicId: string) => {
    const newMap = new Map(selected);
    if (newMap.has(topicId)) {
      newMap.delete(topicId);
    } else {
      newMap.set(topicId, { topicId, subTopicIds: [] });
    }
    setSelected(newMap);
  };

  const toggleSubTopic = (topicId: string, subId: string) => {
    const newMap = new Map(selected);
    const entry = newMap.get(topicId);
    if (!entry) return;
    if (entry.subTopicIds.includes(subId)) {
      entry.subTopicIds = entry.subTopicIds.filter((id) => id !== subId);
    } else {
      entry.subTopicIds.push(subId);
    }
    newMap.set(topicId, entry);
    setSelected(newMap);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="bg-white px-4 py-5 mb-2">
          <Text className="text-2xl font-bold text-dark-900">Your Interests</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Select topics you're interested in. Questions matching your interests will
            be routed to you.
          </Text>
        </View>

        {(topics ?? []).map((topic: any) => {
          const isSelected = selected.has(topic.id);
          const entry = selected.get(topic.id);

          return (
            <View key={topic.id} className="bg-white mx-4 my-1.5 rounded-2xl p-4">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => toggleTopic(topic.id)}
              >
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center ${
                    isSelected ? "bg-primary" : "bg-gray-100"
                  }`}
                >
                  <Text className="text-lg">{topic.icon || "📚"}</Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base font-semibold text-dark-900">
                    {topic.name}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {topic._count?.questions ?? 0} questions ·{" "}
                    {topic._count?.userInterests ?? 0} interested
                  </Text>
                </View>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={isSelected ? "#6366f1" : "#d1d5db"}
                />
              </TouchableOpacity>

              {isSelected && (topic.subtopics ?? []).length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-3 ml-13">
                  {topic.subtopics.map((sub: any) => {
                    const subSelected = entry?.subTopicIds.includes(sub.id);
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        className={`px-3 py-1.5 rounded-full ${
                          subSelected
                            ? "bg-primary-100 border border-primary"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                        onPress={() => toggleSubTopic(topic.id, sub.id)}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            subSelected ? "text-primary" : "text-gray-600"
                          }`}
                        >
                          {sub.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <TouchableOpacity
          className="py-4 rounded-2xl bg-primary items-center"
          onPress={() => {
            saveMutation.mutate({
              interests: Array.from(selected.values()),
            });
          }}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-base">Save Interests</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
