import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setAuth(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      router.replace("/(tabs)/feed");
    },
    onError: (error) => {
      Alert.alert("Registration Failed", error.message);
    },
  });

  const handleRegister = () => {
    if (!username.trim() || !displayName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    registerMutation.mutate({
      username: username.trim(),
      displayName: displayName.trim(),
      email: email.trim(),
      password,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          className="px-8"
        >
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-4">
              <Ionicons name="person-add" size={36} color="#ffffff" />
            </View>
            <Text className="text-3xl font-bold text-dark-900">Create Account</Text>
            <Text className="text-base text-gray-500 mt-2">
              Join the community today
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Username</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
              <Ionicons name="at" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-4 px-3 text-base text-dark-900"
                placeholder="johndoe"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Display Name</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
              <Ionicons name="person-outline" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-4 px-3 text-base text-dark-900"
                placeholder="John Doe"
                placeholderTextColor="#9ca3af"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-4 px-3 text-base text-dark-900"
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-4 px-3 text-base text-dark-900"
                placeholder="Create a password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            className={`py-4 rounded-xl items-center ${
              registerMutation.isPending ? "bg-primary-600/70" : "bg-primary"
            }`}
            onPress={handleRegister}
            disabled={registerMutation.isPending}
            activeOpacity={0.8}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-semibold">Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-6 mb-8 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-gray-500">
              Already have an account?{" "}
              <Text className="text-primary font-semibold">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
