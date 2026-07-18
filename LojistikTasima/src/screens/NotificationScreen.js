import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socket } from "../services/socket";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        "http://10.0.2.2:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      console.log("NOTIFICATIONS:", data);

      setNotifications(data);
    } catch (err) {
      console.log("ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
  try {

    const token =
      await AsyncStorage.getItem("token");

    const response = await fetch(
      "http://10.0.2.2:5000/api/notifications/mark-read",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    console.log("MARK READ:", data);

  } catch (err) {
    console.log(err);
  }
};

  useEffect(() => {
    loadNotifications();
     markAsRead();

    socket.on("new_notification", (data) => {
      setNotifications(prev => [
        {
          id: Date.now().toString(),
          title: "Yeni Mesaj",
          message: data.message,
          created_at: new Date()
        },
        ...prev
      ]);
    });

    return () => {
      socket.off("new_notification");
    };
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          Henüz bildiriminiz bulunmuyor.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.notificationCard}>
          <Text style={styles.title}>
            {item.title}
          </Text>

          <Text style={styles.message}>
            {item.message}
          </Text>

          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleString("tr-TR")}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 15,
    borderRadius: 10,
    elevation: 2
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6
  },
  message: {
    fontSize: 14,
    color: "#444"
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: "#888"
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16
  }
});