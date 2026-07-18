import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { socket } from "../services/socket";
import { useRef } from "react";

const API_URL = "http://10.0.2.2:5000";


export default function TripChatScreen({ route }) {
  const { tripId, title } = route.params;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
const flatListRef = useRef(null);

  useEffect(() => {
    init();

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/trips/${tripId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      const formattedMessages = data.map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: `${msg.name} ${msg.surname}`,
        message: msg.message,
        time: msg.created_at
      }));

      setMessages(formattedMessages);

    } catch (err) {
      console.log("MESAJLAR YÜKLENEMEDİ:", err);
    }
  };

  const init = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");

      if (userStr) {
        const userObj = JSON.parse(userStr);

        setUser(userObj);
        setUserId(userObj.id);
      }

      await loadMessages();

      socket.emit("join_trip", tripId);

      socket.on("receive_message", (data) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            ...data
          }
        ]);
      });

    } catch (err) {
      console.log(err);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send_message", {
      tripId,
      senderId: userId,
      senderName: `${user?.name || ""} ${user?.surname || ""}`,
      message
    });

    setMessage("");
  };

  const renderItem = ({ item }) => {
    const isMe = String(item.senderId) === String(userId);

    return (
      <View
        style={[
          styles.messageContainer,
          isMe
            ? styles.myMessageContainer
            : styles.otherMessageContainer
        ]}
      >
        <Text style={styles.senderName}>
          {isMe ? "Sen" : item.senderName}
        </Text>

        <Text
          style={[
            styles.messageText,
            isMe && { color: "#fff" }
          ]}
        >
          {item.message}
        </Text>

        <Text
          style={[
            styles.timeText,
            isMe && { color: "#dbeafe" }
          ]}
        >
          {item.time
            ? new Date(item.time).toLocaleTimeString(
  "tr-TR",
  {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul"
  }
)
            : ""}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          🚚 {title}
        </Text>
      </View>

      <FlatList
  ref={flatListRef}
  data={messages}
  renderItem={renderItem}
  keyExtractor={(item, index) =>
    item.id?.toString() || index.toString()
  }
  contentContainerStyle={{
    paddingVertical: 10
  }}
  onContentSizeChange={() =>
    flatListRef.current?.scrollToEnd({
      animated: true
    })
  }
/>

      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Mesaj yaz..."
          style={styles.input}
          multiline
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
        >
          <Text style={styles.sendButtonText}>
            Gönder
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
 container: {
  flex: 1,
  backgroundColor: "#eef2f7"
},

  header: {
    backgroundColor: "#111827",
    padding: 15
  },

  headerTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  },

  messageContainer: {
  maxWidth: "82%",
  padding: 12,

  borderRadius: 18,

  marginVertical: 6,
  marginHorizontal: 10
},

 myMessageContainer: {
  alignSelf: "flex-end",
  backgroundColor: "#2563eb",

  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.08,
  shadowRadius: 2,

  elevation: 2
},

  otherMessageContainer: {
  alignSelf: "flex-start",
  backgroundColor: "#ffffff",

  borderWidth: 1,
  borderColor: "#d1d5db",

  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.08,
  shadowRadius: 2,

  elevation: 2
},

  senderName: {
  fontSize: 12,
  color: "#374151",
  marginBottom: 4,
  fontWeight: "700"
},

  messageText: {
    fontSize: 15,
    color: "#111827"
  },

  timeText: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 5,
    textAlign: "right"
  },

  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb"
  },

  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 120
  },

  sendButton: {
    marginLeft: 10,
    backgroundColor: "#111827",
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 18
  },

  sendButtonText: {
    color: "#fff",
    fontWeight: "bold"
  }
});