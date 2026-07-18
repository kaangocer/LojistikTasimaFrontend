import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect
} from "@react-navigation/native";
import React, { useEffect, useState,useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Alert
} from "react-native";
import { socket } from "../services/socket";



export default function HomePage({ navigation }) {
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");

      if (userData) {
        const user = JSON.parse(userData);

        console.log("ROL:", user.role);

        setUserRole(user.role);
      }
    } catch (err) {
      console.log(err);
    }
  };

  loadUser();
}, []);
  const [scale] = useState(new Animated.Value(1));
  
  const [notificationCount, setNotificationCount] =
    useState(0);

    const loadUnreadCount = async () => {
  try {

    const token =
      await AsyncStorage.getItem("token");

    const response = await fetch(
      "http://10.0.2.2:5000/api/notifications/unread-count",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    console.log("UNREAD COUNT:", data);

    setNotificationCount(data.count);

  } catch (err) {
    console.log(err);
  }
};

  useEffect(() => {

  loadUnreadCount();

  socket.on("new_notification", (data) => {

    console.log("BİLDİRİM GELDİ:", data);

    setNotificationCount(prev => prev + 1);

  });

  return () => {
    socket.off("new_notification");
  };

}, []);
useFocusEffect(
  useCallback(() => {
    loadUnreadCount();
  }, [])
);
const logout = () => {
  Alert.alert(
    "Çıkış Yap",
    "Oturumu kapatmak istiyor musunuz?",
    [
      {
        text: "İptal",
        style: "cancel"
      },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {

          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");

          navigation.reset({
            index: 0,
            routes: [{ name: "Welcome" }]
          });
        }
      }
    ]
  );
};

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true
    }).start();
  };

  const Card = ({
    icon,
    title,
    color,
    onPress
  }) => (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: color,
          transform: [{ scale }]
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.cardContent}
      >
        <Text style={styles.cardIcon}>
          {icon}
        </Text>

        <Text style={styles.cardText}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View style={styles.header}>

  <View style={{ flex: 1 }}>
  <Text style={styles.logo}>
    🚛 YükBul
  </Text>

  <Text style={styles.subtitle}>
    Taşıma operasyonlarını tek noktadan yönetin
  </Text>
</View>

  <View style={styles.headerActions}>

    <TouchableOpacity
      style={styles.notificationButton}
      onPress={() => navigation.navigate("Notifications")}
    >
      <Text style={{ fontSize: 24 }}>🔔</Text>

      {notificationCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.badgeText}>
            {notificationCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.logoutButton}
      onPress={logout}
    >
      <Text style={{ fontSize: 22 }}>
  🚪
</Text>
    </TouchableOpacity>

  </View>

</View>

      {/* INFO CARD */}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          Hoş Geldiniz 👋
        </Text>

        <Text style={styles.infoText}>
          Yükler, teklifler, araçlar ve seferlerinizi
          kolayca yönetebilirsiniz.
        </Text>
      </View>

      {/* MENU */}

      <View style={styles.grid}>
        <Card
          icon="👤"
          title="Profil"
          color="#2563EB"
          onPress={() =>
            navigation.navigate("Profile")
          }
        />

        <Card
          icon="📦"
          title="Yükler"
          color="#16A34A"
          onPress={() =>
            navigation.navigate("Loads")
          }
        />

        <Card
          icon="🚚"
          title="Seferler"
          color="#EA580C"
          onPress={() =>
            navigation.navigate("Trips")
          }
        />

        <Card
          icon="🚗"
          title="Araçlar"
          color="#7C3AED"
          onPress={() =>
            navigation.navigate("Vehicle")
          }
        />

        <Card
          icon="💰"
          title="Teklifler"
          color="#0891B2"
          onPress={() =>
            navigation.navigate("Offers")
          }
        />

        {userRole === "admin" && (
  <Card
    icon="🛠️"
    title="Admin"
    color="#DC2626"
    onPress={() =>
      navigation.navigate("Admin")
    }
  />
)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },

  header: {
  paddingTop: 60,
  paddingHorizontal: 10,
  marginBottom: 20,

  flexDirection: "row",
  alignItems: "center",
},

  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A"
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#64748B"
  },

  infoCard: {
    marginHorizontal: 20,
    marginBottom: 24,

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    padding: 20,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3
    },

    elevation: 4
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A"
  },

  infoText: {
    marginTop: 8,
    color: "#64748B",
    lineHeight: 20
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 30
  },

  card: {
    width: "47%",
    height: 140,

    borderRadius: 22,

    marginBottom: 14,

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 5
    },

    elevation: 6
  },

  cardContent: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between"
  },

  cardIcon: {
    fontSize: 38
  },

  cardText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700"
  },
  notificationButton: {
  width: 48,
  height: 48,

  borderRadius: 24,
  backgroundColor: "#06616d",

  justifyContent: "center",
  alignItems: "center",

  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 8,

  elevation: 4
},

notificationBadge: {
  position: "absolute",

  top: 5,
  right: 5,

  width: 18,
  height: 18,

  borderRadius: 9,

  backgroundColor: "#EF4444",

  justifyContent: "center",
  alignItems: "center"
},

badgeText: {
  color: "#fff",
  fontSize: 10,
  fontWeight: "700"
},
headerActions: {
  flexDirection: "row",
  alignItems: "center"
},

logoutButton: {
  marginLeft: 10,

  width: 48,
  height: 48,

  borderRadius: 24,
  backgroundColor: "#06616d",

  justifyContent: "center",
  alignItems: "center",

  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 8,

  elevation: 4
},
});