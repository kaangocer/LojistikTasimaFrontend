import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.0.2.2:5000";

export default function OffersScreen() {

  const [tab, setTab] = useState("given");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
const [page, setPage] = useState(1);


useEffect(() => {
  setPage(1);
}, [statusFilter, tab]);
 

  const statusOptions = [
  { value: "all", label: "📋 Tümü" },
  { value: "pending", label: "⏳ Bekliyor" },
  { value: "accepted", label: "✅ Kabul" },
  { value: "rejected", label: "❌ Red" }
];

  const acceptOffer = async (offerId) => {

  try {

    const token = await AsyncStorage.getItem("token");

    const res = await fetch(
      `${API_URL}/api/offers/${offerId}/accept`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      Alert.alert("Hata", data.message || "Teklif kabul edilemedi");
      return;
    }

    Alert.alert("Başarılı", "Teklif kabul edildi");

    fetchOffers();

  } catch (err) {
    console.log(err);
    Alert.alert("Hata", "Sunucu hatası");
  }
};

const rejectOffer = async (offerId) => {
  try {
    const token = await AsyncStorage.getItem("token");

    const res = await fetch(
      `${API_URL}/api/offers/${offerId}/reject`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      Alert.alert(
        "Hata",
        data.message || "Teklif reddedilemedi"
      );
      return;
    }

    Alert.alert("Başarılı", "Teklif reddedildi");

    fetchOffers();

  } catch (err) {
    console.log(err);
    Alert.alert("Hata", "Sunucu hatası");
  }
};


  const fetchOffers = async () => {

    try {

      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const endpoint =
        tab === "given"
          ? "/api/offers/given"
          : "/api/offers/received";

      const res = await fetch(API_URL + endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const text = await res.text();

      if (!text) {
        setOffers([]);
        return;
      }

      const data = JSON.parse(text);

      setOffers(data);

    } catch (err) {
      console.log("Offer fetch error:", err);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [tab]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("tr-TR");
  };

  const renderOffer = ({ item }) => {

  const statusColor =
    item.status === "accepted"
      ? "#22c55e"
      : item.status === "rejected"
      ? "#ef4444"
      : "#f59e0b";

  const statusText =
    item.status === "accepted"
      ? "Kabul edildi"
      : item.status === "rejected"
      ? "Reddedildi"
      : "Bekliyor";

  return (
    <View style={styles.card}>

      {/* Route */}
      <Text style={styles.route}>
        {item.origin_city} → {item.destination_city}
      </Text>

      {/* Addresses */}
      <Text style={styles.address}>{item.origin_address}</Text>
      <Text style={styles.address}>{item.destination_address}</Text>

      {/* Dates */}
      <Text style={styles.date}>
        Yükleme: {formatDate(item.pickup_time)}
      </Text>

      <Text style={styles.date}>
        Teslim: {formatDate(item.delivery_time)}
      </Text>

      {/* Cargo Info */}
      <View style={styles.cargoBox}>
        <Text style={styles.cargo}>
          ⚖ {item.tonnage} ton
        </Text>

        <Text style={styles.cargo}>
          📦 {item.quantity} {item.quantity_unit}
        </Text>

        <Text style={styles.cargo}>
          📏 {item.volume_m3} m³
        </Text>

        {item.fuel_included && (
          <Text style={styles.cargo}>
            ⛽ Yakıt Dahil
          </Text>
        )}
      </View>

      {/* Description */}
      {item.description && (
        <Text style={styles.desc}>
          {item.description}
        </Text>
      )}

      {/* Vehicle */}
      <Text style={styles.vehicle}>
        🚚 {item.brand} {item.model} {item.year}
      </Text>

      {/* Carrier */}
      {tab === "received" && (
        <Text style={styles.carrier}>
          👤 {item.name} {item.surname}
        </Text>
      )}

      {/* Price */}
      <Text style={styles.price}>
        {item.offer_price} ₺
      </Text>

      {/* Status */}
      <Text style={[styles.status, { color: statusColor }]}>
        {statusText}
      </Text>
{tab === "received" && item.status === "pending" && (
  <View style={styles.offerActions}>

    <TouchableOpacity
      style={styles.acceptButton}
      onPress={() =>
        Alert.alert(
          "Teklifi Kabul Et",
          "Bu teklifi kabul etmek istediğinize emin misiniz?",
          [
            { text: "İptal", style: "cancel" },
            {
              text: "Kabul Et",
              onPress: () => acceptOffer(item.id)
            }
          ]
        )
      }
    >
      <Text style={styles.acceptButtonText}>
        Kabul Et
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.rejectButton}
      onPress={() =>
        Alert.alert(
          "Teklifi Reddet",
          "Bu teklifi reddetmek istediğinize emin misiniz?",
          [
            { text: "İptal", style: "cancel" },
            {
              text: "Reddet",
              onPress: () => rejectOffer(item.id)
            }
          ]
        )
      }
    >
      <Text style={styles.acceptButtonText}>
        Reddet
      </Text>
    </TouchableOpacity>

  </View>
)}
    </View>

  );
};
const filteredOffers =
  statusFilter === "all"
    ? offers
    : offers.filter(
        offer => offer.status === statusFilter
      );
 

const ITEMS_PER_PAGE = 2;

const totalPages = Math.ceil(
  filteredOffers.length / ITEMS_PER_PAGE
);

const paginatedOffers = filteredOffers.slice(
  (page - 1) * ITEMS_PER_PAGE,
  page * ITEMS_PER_PAGE
);

  return (
    <View style={styles.container}>

      {/* Tabs */}

      <View style={styles.tabs}>

        <TouchableOpacity
          style={[
            styles.tab,
            tab === "given" && styles.activeTab
          ]}
          onPress={() => setTab("given")}
        >
          <Text
  style={{
    fontWeight: tab === "given" ? "700" : "500",
    color: tab === "given"
      ? "#111827"
      : "#6b7280"
  }}
>
  Verdiğim Teklifler
</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            tab === "received" && styles.activeTab
          ]}
          onPress={() => setTab("received")}
        >
         <Text
  style={{
    fontWeight: tab === "received" ? "700" : "500",
    color: tab === "received"
      ? "#111827"
      : "#6b7280"
  }}
>
  Gelen Teklifler
</Text>
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
<Text
  style={{
    marginBottom: 10,
    color: "#6b7280"
  }}
>
  {filteredOffers.length} teklif bulundu
</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={paginatedOffers}
          keyExtractor={(item) => item.id}
          renderItem={renderOffer}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Teklif bulunamadı
            </Text>
          }
        />
      )}
      {totalPages > 1 && (
  <View style={styles.pagination}>

    <TouchableOpacity
      disabled={page === 1}
      onPress={() => setPage(page - 1)}
      style={[
        styles.navButton,
        page === 1 && styles.disabledButton
      ]}
    >
      <Text>←</Text>
    </TouchableOpacity>

    <View style={styles.pageNumbersContainer}>
      {[...Array(totalPages)].map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => setPage(index + 1)}
          style={[
            styles.pageNumber,
            page === index + 1 &&
              styles.activePageNumber
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
    </View>

    <TouchableOpacity
      disabled={page === totalPages}
      onPress={() => setPage(page + 1)}
      style={[
        styles.navButton,
        page === totalPages &&
          styles.disabledButton
      ]}
    >
      <Text>→</Text>
    </TouchableOpacity>

  </View>
)}
      

    </View>
    
  );
  
}

const styles = StyleSheet.create({
  offerActions: {
  flexDirection: "row",
  gap: 10,
  marginTop: 12
},

acceptButton: {
  flex: 1,
  backgroundColor: "#22c55e",
  padding: 10,
  borderRadius: 6,
  alignItems: "center"
},

rejectButton: {
  flex: 1,
  backgroundColor: "#ef4444",
  padding: 10,
  borderRadius: 6,
  alignItems: "center"
},

acceptButtonText: {
  color: "white",
  fontWeight: "bold"
},


  cargoBox: {
  marginTop: 8
},

cargo: {
  fontSize: 13
},

desc: {
  marginTop: 6,
  fontSize: 13,
  color: "#444"
},

vehicle: {
  marginTop: 8,
  fontWeight: "600"
},

carrier: {
  marginTop: 4,
  fontSize: 13
},

  container: {
  flex: 1,
  padding: 16,
  backgroundColor: "#f6f7fb"
},

  tabs: {
  flexDirection: "row",
  marginBottom: 12,
  backgroundColor: "#e5e7eb",
  borderRadius: 14,
  padding: 4
},

tab: {
  flex: 1,
  paddingVertical: 12,
  alignItems: "center",
  borderRadius: 10
},

activeTab: {
  backgroundColor: "#ffffff",
  elevation: 3
},

  card: {
  backgroundColor: "#fff",
  padding: 18,
  borderRadius: 18,
  marginBottom: 14,

  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 3
  },
  shadowOpacity: 0.08,
  shadowRadius: 8,

  elevation: 4
},

  route: {
    fontSize: 16,
    fontWeight: "bold"
  },

  address: {
    fontSize: 12,
    marginTop: 3,
    color: "#555"
  },

  price: {
  fontSize: 22,
  fontWeight: "700",
  color: "#2563eb",
  marginTop: 10
},

  date: {
    fontSize: 13,
    marginTop: 4
  },

  status: {
    marginTop: 8,
    fontWeight: "bold"
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16
  },
  filterChip: {
  paddingHorizontal: 18,
  height: 38,
  borderRadius: 20,
  marginRight: 10,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#d1d5db"
},

filterChipActive: {
  backgroundColor: "#2563eb",
  borderColor: "#2563eb"
},

filterText: {
  color: "#374151",
  fontWeight: "600"
},

filterTextActive: {
  color: "#fff"
},

filtersContainer: {
  marginBottom: 12
},
pageNumbersContainer: {
  flexDirection: "row",
  alignItems: "center"
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

activePageNumber: {
  backgroundColor: "#2563eb",
  borderColor: "#2563eb"
},

pagination: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginVertical: 15
},

navButton: {
  backgroundColor: "#fff",
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#d1d5db"
},

disabledButton: {
  opacity: 0.4
},

pageInfo: {
  fontWeight: "700",
  fontSize: 15
},





});