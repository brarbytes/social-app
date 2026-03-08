import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const initials = user?.displayName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white pb-6">
        <View className="h-32 bg-primary" />

        <View className="items-center -mt-16 px-6">
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              className="w-32 h-32 rounded-full border-4 border-white"
            />
          ) : (
            <View className="w-32 h-32 rounded-full border-4 border-white bg-primary-100 items-center justify-center">
              <Text className="text-primary text-4xl font-bold">{initials}</Text>
            </View>
          )}

          <Text className="text-2xl font-bold text-dark-900 mt-4">
            {user?.displayName}
          </Text>
          <Text className="text-base text-gray-500 mt-1">@{user?.username}</Text>
          {user?.bio && (
            <Text className="text-sm text-gray-600 text-center mt-3 px-4 leading-5">
              {user.bio}
            </Text>
          )}
        </View>

        <View className="flex-row justify-around mt-6 px-8">
          {[
            { label: "Posts", value: user?.postCount ?? 0 },
            { label: "Followers", value: user?.followerCount ?? 0 },
            { label: "Following", value: user?.followingCount ?? 0 },
            { label: "Connections", value: user?.connectionCount ?? 0 },
          ].map((stat) => (
            <View key={stat.label} className="items-center">
              <Text className="text-xl font-bold text-dark-900">{stat.value}</Text>
              <Text className="text-xs text-gray-500 mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

        <View className="px-6 mt-6">
          <TouchableOpacity className="py-3 rounded-xl border-2 border-primary items-center">
            <Text className="text-primary font-semibold text-base">Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-4 bg-white">
        <Text className="px-4 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
          Settings
        </Text>

        {[
          { icon: "settings-outline" as const, label: "Account Settings" },
          { icon: "shield-checkmark-outline" as const, label: "Privacy" },
          { icon: "help-circle-outline" as const, label: "Help & Support" },
          { icon: "information-circle-outline" as const, label: "About" },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            className="flex-row items-center px-4 py-4 border-b border-gray-50"
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon} size={22} color="#6b7280" />
            <Text className="flex-1 ml-3 text-base text-dark-900">{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        className="mx-4 mt-6 mb-10 py-4 rounded-xl bg-red-50 items-center"
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold text-base ml-2">Sign Out</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
