import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC" as const, label: "Public", icon: "globe-outline" as const, desc: "Anyone can find and join" },
  { value: "PRIVATE" as const, label: "Private", icon: "lock-closed-outline" as const, desc: "Visible but requires approval" },
  { value: "INVITE_ONLY" as const, label: "Invite Only", icon: "mail-outline" as const, desc: "Only invited members" },
];

export default function CreateGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE" | "INVITE_ONLY">("PUBLIC");
  const [category, setCategory] = useState("");

  const createMutation = trpc.group.create.useMutation({
    onSuccess: (group) => {
      router.replace(`/group/${group.id}`);
    },
  });

  const canSubmit = name.trim().length >= 2;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="bg-white px-4 py-5 mb-2">
        <Text className="text-2xl font-bold text-dark-900 mb-1">Create Group</Text>
        <Text className="text-sm text-gray-500">
          Build a community around shared interests
        </Text>
      </View>

      <View className="bg-white px-4 py-4 mb-2">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Group Name *</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base text-dark-900"
          placeholder="e.g. Health & Wellness Experts"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View className="bg-white px-4 py-4 mb-2">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base text-dark-900"
          placeholder="What's this group about?"
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />
      </View>

      <View className="bg-white px-4 py-4 mb-2">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Category</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base text-dark-900"
          placeholder="e.g. Health, Tech, Fitness..."
          placeholderTextColor="#9ca3af"
          value={category}
          onChangeText={setCategory}
        />
      </View>

      <View className="bg-white px-4 py-4 mb-2">
        <Text className="text-sm font-semibold text-gray-700 mb-3">Visibility</Text>
        {VISIBILITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            className={`flex-row items-center p-3 rounded-xl mb-2 ${
              visibility === opt.value ? "bg-primary-50 border border-primary" : "bg-gray-50"
            }`}
            onPress={() => setVisibility(opt.value)}
          >
            <Ionicons
              name={opt.icon}
              size={22}
              color={visibility === opt.value ? "#6366f1" : "#9ca3af"}
            />
            <View className="ml-3 flex-1">
              <Text
                className={`font-semibold ${
                  visibility === opt.value ? "text-primary" : "text-dark-900"
                }`}
              >
                {opt.label}
              </Text>
              <Text className="text-xs text-gray-500">{opt.desc}</Text>
            </View>
            {visibility === opt.value && (
              <Ionicons name="checkmark-circle" size={22} color="#6366f1" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View className="px-4 mt-4">
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${
            canSubmit ? "bg-primary" : "bg-gray-300"
          }`}
          onPress={() => {
            if (canSubmit) {
              createMutation.mutate({
                name: name.trim(),
                description: description.trim() || undefined,
                visibility,
                category: category.trim() || undefined,
              });
            }
          }}
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-base">Create Group</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
