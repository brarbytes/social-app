import { View, Text } from "react-native";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderName?: string;
  type?: "text" | "image" | "system";
}

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
}

function formatTime(date: string) {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBubble({ message, isOwn, showSender = false }: ChatBubbleProps) {
  if (message.type === "system") {
    return (
      <View className="items-center my-3">
        <Text className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </Text>
      </View>
    );
  }

  return (
    <View className={`mb-2 max-w-[80%] ${isOwn ? "self-end" : "self-start"}`}>
      {showSender && !isOwn && message.senderName && (
        <Text className="text-xs text-gray-500 font-medium mb-1 ml-3">
          {message.senderName}
        </Text>
      )}

      <View
        className={`px-4 py-3 ${
          isOwn
            ? "bg-primary rounded-2xl rounded-br-md"
            : "bg-gray-100 rounded-2xl rounded-bl-md"
        }`}
      >
        <Text className={`text-base leading-5 ${isOwn ? "text-white" : "text-dark-900"}`}>
          {message.content}
        </Text>
      </View>

      <Text
        className={`text-[10px] text-gray-400 mt-1 ${isOwn ? "text-right mr-1" : "ml-1"}`}
      >
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
}
