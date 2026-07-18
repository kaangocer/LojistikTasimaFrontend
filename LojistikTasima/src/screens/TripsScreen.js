import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { socket } from "../services/socket";
import { Alert } from "react-native";
import { ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";


const API_URL = "http://10.0.2.2:5000";

export default function TripsScreen({ navigation }) {

  const [tab, setTab] = useState("carrier"); 
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
useEffect(() => {
  setPage(1);
}, [statusFilter, tab]);
const ITEMS_PER_PAGE = 2;

const confirmStatusChange = (tripId, status, text) => {
  Alert.alert(
    "Durum Güncelle",
    text,
    [
      {
        text: "Vazgeç",
        style: "cancel"
      },
      {
        text: "Evet",
        onPress: () => updateStatus(tripId, status)
      }
    ]
  );
};


  useEffect(() => {
    fetchTrips();
  }, [tab]);

 useEffect(() => {
  console.log("TripsScreen açıldı");

  socket.connect();

  socket.on("connect", () => {
    console.log("🟢 SOCKET BAĞLANDI SCREEN");
  });

  return () => {
    socket.off("connect");
  };
}, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const endpoint =
        tab === "carrier"
          ? "/api/trips/carrier"
          : "/api/trips/owner";

      const res = await fetch(API_URL + endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setTrips(data);

    } catch (err) {
      console.log(err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (tripId, status) => {
    try {
      const token = await AsyncStorage.getItem("token");

      await fetch(`${API_URL}/api/trips/${tripId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      fetchTrips();

    } catch (err) {
      console.log(err);
    }
  };

  const getStatusColor = (status) => {
  switch (status) {
    case "accepted":
      return "#f59e0b";

    case "loading":
      return "#3b82f6";

    case "on_route":
      return "#8b5cf6";

    case "delivered":
      return "#22c55e";

    case "cancelled":
      return "#dc2626";

    default:
      return "#999";
  }
};

  const getStatusText = (status) => {
  switch (status) {
    case "accepted":
      return "Teklif Kabul Edildi";

    case "loading":
      return "Yükleniyor";

    case "on_route":
      return "Yolda";

    case "delivered":
      return "Teslim Edildi";

    case "cancelled":
      return "İptal Edildi";

    case "ongoing":
      return "Devam Ediyor";

    default:
      return status;
  }
};
const statusOptions = [
  { value: "all", label: "Tümü" },
  { value: "accepted", label: "Kabul" },
  { value: "loading", label: "Yükleniyor" },
  { value: "on_route", label: "Yolda" },
  { value: "delivered", label: "Teslim" },
  { value: "cancelled", label: "İptal" }
];

  const renderTrip = ({ item }) => (
    <View style={styles.card}>

      <Text style={styles.route}>
        {item.origin_city} → {item.destination_city}
      </Text>
      <Text style={styles.address}>
  📍 Çıkış: {item.origin_address}
</Text>

<Text style={styles.address}>
  🎯 Varış: {item.destination_address}
</Text>

      {/* ROLE BASED INFO */}
      {tab === "carrier" ? (
        <Text style={styles.subText}>
          👤 Yük Sahibi: {item.owner_name} {item.owner_surname}
        </Text>
      ) : (
        <Text style={styles.subText}>
          🚚 Taşıyıcı: {item.carrier_name} {item.carrier_surname}
        </Text>
      )}

      {/* Status */}
      <View style={[
        styles.badge,
        { backgroundColor: getStatusColor(item.status) }
      ]}>
        <Text style={styles.badgeText}>
          {getStatusText(item.status)}
        </Text>
      </View>

      {/* Times */}
      <Text style={styles.time}>
  🕒 Başlangıç: {item.start_time
    ? new Date(item.start_time).toLocaleString(
        "tr-TR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      )
    : "-"}
</Text>

<Text style={styles.time}>
  📦 Tahmini: {item.end_time
    ? new Date(item.end_time).toLocaleString(
        "tr-TR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      )
    : "-"}
</Text>

      {/* ACTIONS (sadece carrier için) */}
      {tab === "carrier" && (
  <View style={styles.actions}>

   {item.status === "accepted" && (
  <TouchableOpacity
    style={[styles.btn, { backgroundColor: "#3b82f6" }]}
    onPress={() =>
      confirmStatusChange(
        item.id,
        "loading",
        "Yükleme işlemini başlatmak istiyor musunuz?"
      )
    }
  >
    <Text style={styles.btnText}>
      📦 Yükleme Başlat
    </Text>
  </TouchableOpacity>
)}

{item.status === "accepted" && (
  <TouchableOpacity
    style={[
      styles.btn,
      {
        backgroundColor: "#dc2626",
        marginTop: 10
      }
    ]}
    onPress={() =>
      confirmStatusChange(
        item.id,
        "cancelled",
        "Bu seferi iptal etmek istiyor musunuz?"
      )
    }
  >
    <Text style={styles.btnText}>
      ❌ Seferi İptal Et
    </Text>
  </TouchableOpacity>
)}

   {item.status === "loading" && (
  <TouchableOpacity
    style={[styles.btn, { backgroundColor: "#8b5cf6" }]}
    onPress={() =>
      confirmStatusChange(
        item.id,
        "on_route",
        "Yola çıkıldığını onaylıyor musunuz?"
      )
    }
  >
    <Text style={styles.btnText}>🚚 Yola Çık</Text>
  </TouchableOpacity>
)}

    {item.status === "on_route" && (
  <TouchableOpacity
    style={[styles.btn, { backgroundColor: "#22c55e" }]}
    onPress={() =>
      confirmStatusChange(
        item.id,
        "delivered",
        "Yük teslim edildi mi?"
      )
    }
  >
    <Text style={styles.btnText}>✅ Teslim Et</Text>
  </TouchableOpacity>
)}

  </View>
)}
<TouchableOpacity
  disabled={
    item.status === "delivered" ||
    item.status === "cancelled"
  }
  style={[
    styles.btn,
    {
      marginTop: 10,
      backgroundColor:
        item.status === "delivered" ||
        item.status === "cancelled"
          ? "#9ca3af"
          : "#111827"
    }
  ]}
  onPress={() =>
    navigation.navigate("TripChat", {
      tripId: item.id,
      title: `${item.origin_city} → ${item.destination_city}`
    })
  }
>
  <Text style={styles.btnText}>
    {item.status === "delivered"
      ? "🔒 Sohbet Kapatıldı"
      : item.status === "cancelled"
      ? "❌ Sefer İptal"
      : "💬 Sohbet"}
  </Text>
</TouchableOpacity>

    </View>
  );
const filteredTrips =
  statusFilter === "all"
    ? trips
    : trips.filter(
        trip => trip.status === statusFilter
      );
const paginatedTrips = filteredTrips.slice(
  (page - 1) * ITEMS_PER_PAGE,
  page * ITEMS_PER_PAGE
);

const totalPages = Math.ceil(
  filteredTrips.length / ITEMS_PER_PAGE
);

  return (
    <View style={styles.container}>

      {/* HEADER TABS */}
      <View style={styles.tabs}>

        <TouchableOpacity
          style={[
            styles.tab,
            tab === "carrier" && styles.activeTab
          ]}
          onPress={() => setTab("carrier")}
        >
          <Text>🚚 Taşıdığım</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            tab === "owner" && styles.activeTab
          ]}
          onPress={() => setTab("owner")}
        >
          <Text>📦 Bana Ait</Text>
        </TouchableOpacity>

      </View>
      <View style={styles.filtersContainer}>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
  >
    {statusOptions.map(item => (
      <TouchableOpacity
        key={item.value}
        onPress={() => setStatusFilter(item.value)}
        style={[
          styles.filterChip,
          statusFilter === item.value &&
            styles.filterChipActive
        ]}
      >
        <Text
          style={[
            styles.filterText,
            statusFilter === item.value &&
              styles.filterTextActive
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={paginatedTrips}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Sefer bulunamadı
            </Text>
          }
        />
      )}
      {totalPages > 1 && (
  <View style={styles.pagination}>

    <TouchableOpacity
      disabled={page === 1}
      style={[
        styles.navButton,
        page === 1 && styles.disabledBtn
      ]}
      onPress={() => setPage(page - 1)}
    >
      <Text>←</Text>
    </TouchableOpacity>

    {[...Array(totalPages)].map((_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setPage(index + 1)}
        style={[
          styles.pageNumber,
          page === index + 1 &&
            styles.activePage
        ]}
      >
        <Text
          style={{
            color:
              page === index + 1
                ? "#fff"
                : "#374151",
            fontWeight: "600"
          }}
        >
          {index + 1}
        </Text>
      </TouchableOpacity>
    ))}

    <TouchableOpacity
      disabled={page === totalPages}
      style={[
        styles.navButton,
        page === totalPages &&
          styles.disabledBtn
      ]}
      onPress={() => setPage(page + 1)}
    >
      <Text>→</Text>
    </TouchableOpacity>

  </View>
)}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f6f7fb"
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3
  },

  route: {
    fontSize: 16,
    fontWeight: "bold"
  },

  subText: {
    fontSize: 13,
    color: "#555",
    marginTop: 2
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold"
  },

  time: {
    fontSize: 12,
    marginTop: 6,
    color: "#444"
  },

  actions: {
    marginTop: 12
  },

  btn: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center"
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold"
  },

  empty: {
    textAlign: "center",
    marginTop: 50,
    color: "#777"
  },
tabs: {
  flexDirection: "row",
  marginBottom: 12,
  gap: 10
},

tab: {
  flex: 1,
  padding: 12,
  alignItems: "center",
  backgroundColor: "#eee",
  borderRadius: 10
},

activeTab: {
  backgroundColor: "#c7d2fe"
},
filterChip: {
  height: 36,
  paddingHorizontal: 14,
  borderRadius: 18,
  backgroundColor: "#e5e7eb",
  marginRight: 8,
  justifyContent: "center",
  alignItems: "center",
  alignSelf: "flex-start"
},

filterChipActive: {
  backgroundColor: "#2563eb"
},

filterText: {
  color: "#374151",
  fontWeight: "600"
},

filterTextActive: {
  color: "#fff"
},
filtersContainer: {
  height: 50,
  marginBottom: 10
},
pagination: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: 15
},

pageNumber: {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: "center",
  alignItems: "center",
  marginHorizontal: 4,
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#d1d5db"
},

activePage: {
  backgroundColor: "#2563eb",
  borderColor: "#2563eb"
},

navButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f3f4f6",
  marginHorizontal: 6
},

disabledBtn: {
  opacity: 0.4
},

});