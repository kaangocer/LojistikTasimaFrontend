import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Switch
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

const API_URL = "http://10.0.2.2:5000";

/* ================= VEHICLE TYPES ================= */

const VEHICLE_TYPES = [
  { label: "Otomobil", value: "AUTOMOBILE" },
  { label: "Kamyon", value: "TRUCK" },
  { label: "Van", value: "VAN" },
  { label: "Minibüs", value: "MINIBUS" },
  { label: "Pickup", value: "PICKUP" }
];

const QUANTITY_UNITS = [
  { label: "Adet", value: "adet" },
  { label: "Palet", value: "palet" },
  { label: "Koli", value: "koli" },
  { label: "Varil", value: "varil" }
];

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const removeMilliseconds = (date) => {
  if (!date) return null;
  const d = new Date(date);
  d.setMilliseconds(0);
  return d.toISOString();
};

export default function LoadsScreen() {

  const [loads, setLoads] = useState([]);
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState(null);
const [currentUser, setCurrentUser] = useState(null);
const [filter, setFilter] = useState("all");
const [search, setSearch] = useState("");
const filteredLoads = loads.filter((load) => {
  const ownerMatch =
  filter === "mine"
    ? currentUser && load.owner_id === currentUser.id
    : filter === "others"
    ? currentUser &&
      load.owner_id !== currentUser.id &&
      !load.has_offered
    : filter === "offered"
    ? load.has_offered
    : true;

const q = search.toLowerCase();

const searchMatch =
  search === "" ||
  (load.origin_city || "").toLowerCase().includes(q) ||
  (load.destination_city || "").toLowerCase().includes(q) ||
  (load.origin_address || "").toLowerCase().includes(q) ||
  (load.destination_address || "").toLowerCase().includes(q) ||
  (load.required_vehicle_type || "").toLowerCase().includes(q);
  return ownerMatch && searchMatch;
});
const [page, setPage] = useState(1); // mevcut sayfa
const [itemsPerPage] = useState(10); // sayfa başına yük
const paginatedLoads = filteredLoads.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);


/* ================= TEKLİF VER KISMI ================= */

const [offerModal, setOfferModal] = useState(false);
const [myVehicles, setMyVehicles] = useState([]);
const [selectedVehicle, setSelectedVehicle] = useState(null);
const [offerPrice, setOfferPrice] = useState("");
const [offerMessage, setOfferMessage] = useState("");
const fetchMyVehicles = async () => {
  const token = await AsyncStorage.getItem("token");

  const res = await fetch(`${API_URL}/api/vehicles`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  setMyVehicles(data);
};

  /* DATE STATES */

  const [pickupDate, setPickupDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(new Date());

  const [showPickupDate, setShowPickupDate] = useState(false);
  const [showPickupTime, setShowPickupTime] = useState(false);
  const [showDeliveryDate, setShowDeliveryDate] = useState(false);
  const [showDeliveryTime, setShowDeliveryTime] = useState(false);

 
  const [fuelIncluded, setFuelIncluded] = useState(false);

  const [form, setForm] = useState({
    origin_city: "",
    origin_address: "",
    destination_city: "",
    destination_address: "",
    price: "",
    tonnage: "",
    quantity: "",
    quantity_unit: "",
    volume_m3: "",
    required_vehicle_type: "",
    description: ""
  });



  const resetForm = () => {
    setForm({
      origin_city: "",
      origin_address: "",
      destination_city: "",
      destination_address: "",
      price: "",
      tonnage: "",
      quantity: "",
      quantity_unit: "",
      volume_m3: "",
      required_vehicle_type: "",
      description: ""
    });

    setPickupDate(new Date());
    setDeliveryDate(new Date());
    setFuelIncluded(false);
    
  };

  const submitLoad = async () => {
    const token = await AsyncStorage.getItem("token");

    const payload = {
      ...form,
      price: parseFloat(form.price),
      tonnage: parseFloat(form.tonnage.replace(",", ".")),
      quantity: parseFloat(form.quantity),
      volume_m3: parseFloat(form.volume_m3),
      pickup_time: removeMilliseconds(pickupDate),
      delivery_time: removeMilliseconds(deliveryDate),
      fuel_included: fuelIncluded
    };


    

    const res = await fetch(`${API_URL}/api/loads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json();
      Alert.alert("Hata", data.message);
      return;
    }

    Alert.alert("Başarılı", "Yük oluşturuldu");
    resetForm();
    setCreateModal(false);
    fetchLoads();
  };




  /* ================= FETCH ================= */
const fetchMe = async () => {
  const token = await AsyncStorage.getItem("token");

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  setCurrentUser(data);
};


  const fetchLoads = async () => {
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/loads`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setLoads(data);
  };

  useEffect(() => {
  fetchLoads();
  fetchMe();
  fetchMyVehicles();
}, []);

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    const requiredFields = [
      "origin_city",
      "origin_address",
      "destination_city",
      "destination_address",
      "price",
      "tonnage",
      "quantity",
      "quantity_unit",
      "volume_m3",
      "required_vehicle_type",
      "description"
    ];

    for (let field of requiredFields) {
      if (!form[field] || form[field].toString().trim() === "") {
        Alert.alert("Eksik Alan", "Lütfen tüm alanları doldurun.");
        return false;
      }
    }

    if (isNaN(parseFloat(form.price)) ||
      isNaN(parseFloat(form.tonnage.replace(",", "."))) ||
      isNaN(parseFloat(form.quantity)) ||
      isNaN(parseFloat(form.volume_m3))) {
      Alert.alert("Hatalı Veri", "Sayısal alanlara geçerli değer giriniz.");
      return false;
    }

    if (deliveryDate <= pickupDate) {
      Alert.alert("Tarih Hatası", "Teslim tarihi yükleme tarihinden sonra olmalıdır.");
      return false;
    }

    return true;
  };

  /* ================= CREATE ================= */

  const createLoad = async () => {

    if (!validateForm()) return;

    Alert.alert(
      "Yük Oluştur",
      "Bu yükü oluşturmak istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Evet", onPress: submitLoad }
      ]
    );
  };
/* ================= DELETE ================= */
  const handleDelete = async (loadId) => {
  const token = await AsyncStorage.getItem("token");

  Alert.alert(
    "Yükü Sil",
    "Bu yükü silmek istediğinize emin misiniz?",
    [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {

          const res = await fetch(`${API_URL}/api/loads/${loadId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          const data = await res.json();

          if (!res.ok) {
            Alert.alert("Hata", data.message);
            return;
          }

          Alert.alert("Başarılı", "Yük silindi");

          setDetailModal(false);
          fetchLoads();
        }
      }
    ]
  );
};



const submitOffer = async () => {

  if (!selectedVehicle) {
    Alert.alert("Uyarı", "Araç seçmelisiniz");
    return;
  }

  if (!offerPrice) {
    Alert.alert("Uyarı", "Fiyat giriniz");
    return;
  }

  const token = await AsyncStorage.getItem("token");

  const res = await fetch(`${API_URL}/api/offers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      loadId: selectedLoad.id,
      vehicleId: selectedVehicle.id,
      offerPrice: parseFloat(offerPrice),
      estimatedPickup: selectedLoad.pickup_time,
      estimatedDelivery: selectedLoad.delivery_time,
      message: offerMessage
    })
  });

  const data = await res.json();

  if (!res.ok) {
    Alert.alert("Hata", data.message);
    return;
  }

  Alert.alert("Başarılı", "Teklif gönderildi");

  setOfferModal(false);
  setSelectedVehicle(null);
  setOfferPrice("");
  setOfferMessage("");

  await fetchLoads();
};




  /* ================= CARD ================= */

  const renderItem = ({ item }) => {
  const isMine = currentUser && item.owner_id === currentUser.id;

  return (
    
    <TouchableOpacity
      style={[
        styles.card,
        isMine && { backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#F59E0B" } // kendi yükleri için sarı vurgulu
      ]}
      onPress={() => {
        setSelectedLoad(item);
        setDetailModal(true);
      }}
    >
      {/* İkon ile vurgulamak */}
      {isMine && (
        <View style={styles.mineBadge}>
          <Text style={{ color: "#B45309", fontWeight: "700", fontSize: 12 }}>BENİM</Text>
          
        </View>
        
        
      )}
      

      <Text style={styles.route}>
        {item.origin_city} → {item.destination_city}
      </Text>

      <Text style={styles.time}>🕓 {formatDate(item.pickup_time)}</Text>
      <Text style={styles.time}>🏁 {formatDate(item.delivery_time)}</Text>

      <View style={styles.row}>
        <Text>⚖ {item.tonnage || "-"} ton</Text>
        <Text>📦 {item.quantity || "-"} {item.quantity_unit || ""}</Text>
        <Text>🧊 {item.volume_m3 || "-"} m³</Text>
      </View>

      <View style={styles.badge}>
        <Text>
  🚚 {VEHICLE_TYPES.find(v => v.value === item.required_vehicle_type)?.label || "-"}
</Text>
      </View>

      {item.fuel_included && (
        <Text style={{ marginTop: 6 }}>⛽ Yakıt Dahil</Text>
      )}

      {item.has_offered && (
  <View
    style={{
      backgroundColor: "#DCFCE7",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 8,
      alignSelf: "flex-start"
    }}
  >
    <Text
      style={{
        color: "#166534",
        fontWeight: "700"
      }}
    >
      ✅ Teklif Verdiniz
    </Text>
  </View>
)}
    </TouchableOpacity>
  );
};

  /* ================= UI ================= */

  return (
    <View style={styles.container}>


      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setCreateModal(true)}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>+ Yük Ekle</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: "row", marginBottom: 12, justifyContent: "space-around" }}>
  <TouchableOpacity onPress={() => { setFilter("all"); setPage(1); }}>
    <Text style={{ fontWeight: filter === "all" ? "700" : "400" }}>Tümü</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={() => { setFilter("mine"); setPage(1); }}>
    <Text style={{ fontWeight: filter === "mine" ? "700" : "400" }}>Benim</Text>
  </TouchableOpacity>
  <TouchableOpacity
  onPress={() => {
    setFilter("offered");
    setPage(1);
  }}
>
  <Text
    style={{
      fontWeight: filter === "offered" ? "700" : "400"
    }}
  >
    Teklif Verdiklerim
  </Text>
</TouchableOpacity>
  <TouchableOpacity onPress={() => { setFilter("others"); setPage(1); }}>
    <Text style={{ fontWeight: filter === "others" ? "700" : "400" }}>Diğer</Text>
  </TouchableOpacity>
  
</View>
<View><TextInput
  placeholder="Şehir, araç tipi, adres ara..."
  value={search}
  onChangeText={setSearch}
  style={styles.input}
/></View>
<FlatList
  data={paginatedLoads}
  keyExtractor={(i) => i.id}
  renderItem={renderItem}
/>
{/* ================= PAGINATION ================= */}
<View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: 10, flexWrap: "wrap" }}>

  {/* Önceki Butonu */}
  <TouchableOpacity
    disabled={page === 1}
    onPress={() => setPage(prev => Math.max(prev - 1, 1))}
    style={{ marginHorizontal: 5, marginVertical: 3, padding: 8 }}
  >
    <Text style={{ fontSize: 16, color: page === 1 ? "#aaa" : "#2563EB" }}>◀ Önceki</Text>
  </TouchableOpacity>

  {/* Sayfa Numaraları */}
  {Array.from({ length: Math.ceil(filteredLoads.length / itemsPerPage) }, (_, i) => i + 1).map((p) => (
    <TouchableOpacity
      key={p}
      onPress={() => setPage(p)}
      style={{
        marginHorizontal: 3,
        marginVertical: 3,
        padding: 8,
        borderRadius: 6,
        backgroundColor: p === page ? "#2563EB" : "#E5E7EB"
      }}
    >
      <Text style={{ color: p === page ? "#fff" : "#000", fontWeight: p === page ? "700" : "400" }}>{p}</Text>
    </TouchableOpacity>
  ))}

  {/* Sonraki Butonu */}
  <TouchableOpacity
    disabled={page === Math.ceil(filteredLoads.length / itemsPerPage)}
    onPress={() => setPage(prev => Math.min(prev + 1, Math.ceil(filteredLoads.length / itemsPerPage)))}
    style={{ marginHorizontal: 5, marginVertical: 3, padding: 8 }}
  >
    <Text style={{ fontSize: 16, color: page === Math.ceil(filteredLoads.length / itemsPerPage) ? "#aaa" : "#2563EB" }}>Sonraki ▶</Text>
  </TouchableOpacity>

</View>

      {/* ================= CREATE MODAL ================= */}

      <Modal visible={createModal} animationType="slide">
        <ScrollView
          style={{ padding: 20 }}
          contentContainerStyle={{ paddingBottom: 80 }}
        >

          <Text style={styles.modalTitle}>Yeni Yük</Text>

          <TextInput placeholder="Başlangıç Şehri"
            style={styles.input}
            onChangeText={(t) => setForm({ ...form, origin_city: t })}
          />

          <TextInput placeholder="Başlangıç Adresi"
            style={styles.input}
            onChangeText={(t) => setForm({ ...form, origin_address: t })}
          />

          <TextInput placeholder="Varış Şehri"
            style={styles.input}
            onChangeText={(t) => setForm({ ...form, destination_city: t })}
          />

          <TextInput placeholder="Varış Adresi"
            style={styles.input}
            onChangeText={(t) => setForm({ ...form, destination_address: t })}
          />

          <TextInput placeholder="Fiyat (₺)"
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(t) => setForm({ ...form, price: t })}
          />

          <TextInput placeholder="Tonaj (örn: 2,5)"
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(t) => setForm({ ...form, tonnage: t })}
          />

          <TextInput placeholder="Miktar"
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(t) => setForm({ ...form, quantity: t })}
          />

          {/* Miktar Birimi */}
          
         <View style={styles.pickerContainer}>
 <Text style={{ marginBottom: 6 }}>
  Miktar Birimi
</Text>

<View style={styles.pickerContainer}>
  <Picker
    selectedValue={form.quantity_unit}
    onValueChange={(value) =>
      setForm({ ...form, quantity_unit: value })
    }
  >
    {QUANTITY_UNITS.map((u) => (
      <Picker.Item
        key={u.value}
        label={u.label}
        value={u.value}
      />
    ))}
  </Picker>
</View>
</View>

          <TextInput placeholder="Hacim (m³)"
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(t) => setForm({ ...form, volume_m3: t })}
          />

          {/* Araç Tipi */}
          <View style={styles.pickerContainer}>
  <Text style={{ marginBottom: 6 }}>
  Araç Tipi
</Text>

<View style={styles.pickerContainer}>
  <Picker
    selectedValue={form.required_vehicle_type}
    onValueChange={(value) =>
      setForm({ ...form, required_vehicle_type: value })
    }
  >
    {VEHICLE_TYPES.map((v) => (
      <Picker.Item
        key={v.value}
        label={v.label}
        value={v.value}
      />
    ))}
  </Picker>
</View>
</View>

          <TextInput placeholder="Yük Açıklaması"
            style={styles.input}
            onChangeText={(t) => setForm({ ...form, description: t })}
          />

          {/* YAKIT */}
          <View style={styles.switchRow}>
            <Text>Yakıt Dahil</Text>
            <Switch
              value={fuelIncluded}
              onValueChange={setFuelIncluded}
            />
          </View>

          {/* TARİH SEÇİMİ */}
          <Text style={styles.label}>Yükleme Tarihi</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowPickupDate(true)}>
            <Text>{pickupDate.toLocaleString("tr-TR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })}</Text>
          </TouchableOpacity>

          {showPickupDate && (
            <DateTimePicker
              value={pickupDate}
              mode="date"
              onChange={(e, d) => {
                setShowPickupDate(false);
                if (e.type === "set" && d) {
                  const updated = new Date(pickupDate);
                  updated.setFullYear(d.getFullYear());
                  updated.setMonth(d.getMonth());
                  updated.setDate(d.getDate());
                  setPickupDate(updated);
                  setShowPickupTime(true);
                }
              }}
            />
          )}

          {showPickupTime && (
            <DateTimePicker
              value={pickupDate}
              mode="time"
              onChange={(e, t) => {
                setShowPickupTime(false);
                if (e.type === "set" && t) {
                  const updated = new Date(pickupDate);
                  updated.setHours(t.getHours());
                  updated.setMinutes(t.getMinutes());
                  setPickupDate(updated);
                }
              }}
            />
          )}

          <Text style={styles.label}>Teslim Tarihi</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDeliveryDate(true)}>
            <Text>{deliveryDate.toLocaleString("tr-TR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })}</Text>
          </TouchableOpacity>

          {showDeliveryDate && (
            <DateTimePicker
              value={deliveryDate}
              mode="date"
              onChange={(e, d) => {
                setShowDeliveryDate(false);
                if (e.type === "set" && d) {
                  const updated = new Date(deliveryDate);
                  updated.setFullYear(d.getFullYear());
                  updated.setMonth(d.getMonth());
                  updated.setDate(d.getDate());
                  setDeliveryDate(updated);
                  setShowDeliveryTime(true);
                }
              }}
            />
          )}

          {showDeliveryTime && (
            <DateTimePicker
              value={deliveryDate}
              mode="time"
              onChange={(e, t) => {
                setShowDeliveryTime(false);
                if (e.type === "set" && t) {
                  const updated = new Date(deliveryDate);
                  updated.setHours(t.getHours());
                  updated.setMinutes(t.getMinutes());
                  setDeliveryDate(updated);
                }
              }}
            />
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={createLoad}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Kaydet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: "#DC2626",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 10
            }}
            onPress={() => {
              Alert.alert(
                "Vazgeç",
                "Girilen bilgiler silinecek. Emin misiniz?",
                [
                  { text: "Hayır" },
                  {
                    text: "Evet",
                    onPress: () => {
                      resetForm();
                      setCreateModal(false);
                    }
                  }
                ]
              );
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Vazgeç</Text>
          </TouchableOpacity>

        </ScrollView>
      </Modal>
      {/* ================= DETAIL MODAL ================= */}

      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={styles.detailOverlay}>
          <View style={styles.detailContainer}>

            {selectedLoad && (
              <>
                <Text style={styles.detailTitle}>
                  📍 {selectedLoad.origin_city} → {selectedLoad.destination_city}
                </Text>

                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Yükleme Adresi</Text>
                  <Text style={styles.detailText}>
                    {selectedLoad.origin_address}
                  </Text>
                </View>

                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Teslim Adresi</Text>
                  <Text style={styles.detailText}>
                    {selectedLoad.destination_address}
                  </Text>
                </View>

                <View style={{ marginTop: 15 }}>
                  <Text>🕓 {formatDate(selectedLoad.pickup_time)}</Text>
                  <Text>🏁 {formatDate(selectedLoad.delivery_time)}</Text>
                </View>
                {/* SAHİPSE YÜKÜ SİL */}
{currentUser && selectedLoad?.owner_id === currentUser.id && (
  <TouchableOpacity
    style={{
      backgroundColor: "#DC2626",
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 15
    }}
    onPress={() => handleDelete(selectedLoad.id)}
  >
    <Text style={{ color: "#fff", fontWeight: "700" }}>
      Yükü Sil
    </Text>
  </TouchableOpacity>
)}

{/* BAŞKASI İSE TEKLİF VER */}
{currentUser && selectedLoad?.owner_id !== currentUser.id && (
  <TouchableOpacity
    style={{
      backgroundColor: "#16A34A",
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 15
    }}
    onPress={() => {
  setOfferModal(true);
}}
  >
    <Text style={{ color: "#fff", fontWeight: "700" }}>
      Teklif Ver
    </Text>
  </TouchableOpacity>
)}

{/* KAPAT */}
<TouchableOpacity
  style={styles.closeBtn}
  onPress={() => setDetailModal(false)}
>
  <Text style={{ color: "#fff", fontWeight: "700" }}>
    Kapat
  </Text>
</TouchableOpacity>
                
              </>
            )}

          </View>
        </View>
      </Modal>

      {/* ================= OFFER MODAL ================= */}
<Modal visible={offerModal} animationType="slide">
  <ScrollView style={{ padding: 20 }}>

    <Text style={styles.modalTitle}>Teklif Ver</Text>

    {/* Araç Seç */}
    <Text style={{ marginBottom: 6 }}>Araç Seç</Text>

    <View style={styles.pickerContainer}>
  <Picker
    selectedValue={selectedVehicle?.id || ""}
    onValueChange={(value) => {
      const vehicle = myVehicles.find(v => v.id === value);
      setSelectedVehicle(vehicle);
    }}
  >
    <Picker.Item
      label="Araç Seçiniz"
      value=""
    />

    {myVehicles.map(vehicle => (
      <Picker.Item
        key={vehicle.id}
        label={`${vehicle.plate_number} - ${vehicle.brand} ${vehicle.model}`}
        value={vehicle.id}
      />
    ))}
  </Picker>
</View>
{selectedVehicle && (
  <View
    style={{
      backgroundColor: "#F1F5F9",
      padding: 12,
      borderRadius: 12,
      marginBottom: 12
    }}
  >
    <Text style={{ fontWeight: "700" }}>
      {selectedVehicle.plate_number}
    </Text>

    <Text>
      {selectedVehicle.brand} {selectedVehicle.model}
    </Text>

    <Text>
      {selectedVehicle.year}
    </Text>
  </View>
)}

    {/* Fiyat */}
    <TextInput
  placeholder="Teklif Fiyatı"
  keyboardType="numeric"
  style={styles.input}
  value={offerPrice}
  onChangeText={(text) => {
    const onlyNumbers = text.replace(/[^0-9]/g, "");
    setOfferPrice(onlyNumbers);
  }}
/>
    <TextInput
  placeholder="Mesaj (opsiyonel)"
  style={styles.input}
  value={offerMessage}
  onChangeText={setOfferMessage}
  multiline
/>

    {/* Gönder */}
    <TouchableOpacity
      style={{
        backgroundColor: "#16A34A",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10
      }}
      onPress={submitOffer}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>
        Teklifi Gönder
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.closeBtn}
      onPress={() => {
        setOfferModal(false);
        setSelectedVehicle(null);
        setOfferPrice("");
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>
        İptal
      </Text>
    </TouchableOpacity>

  </ScrollView>
</Modal>

    </View>
  );
}

/* ================= STYLES ================= */



const styles = StyleSheet.create({
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end"
  },

  detailContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%"
  },

  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15
  },

  detailBox: {
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10
  },

  detailLabel: {
    fontWeight: "600",
    marginBottom: 4
  },

  detailText: {
    color: "#475569"
  },
  pickerContainer: {
  backgroundColor: "#fff",
  borderRadius: 12,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  overflow: "hidden"
},

  closeBtn: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20
  },
  mineBadge: {
  position: "absolute",
  top: 8,
  right: 8,
  backgroundColor: "#FCD34D",
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 6,
  zIndex: 10
},


  container: { flex: 1, backgroundColor: "#F1F5F9", padding: 16 },
  addBtn: { backgroundColor: "#16A34A", padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12, elevation: 3 },
  route: { fontSize: 18, fontWeight: "700" },
  time: { color: "#64748B" },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8 },
  badge: { backgroundColor: "#E0F2FE", padding: 6, borderRadius: 8, marginTop: 6 },
  price: { fontSize: 16, fontWeight: "700", marginTop: 6 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 12 },
  dropdown: { backgroundColor: "#E2E8F0", padding: 12, borderRadius: 12, marginBottom: 6 },
  dropdownItem: { backgroundColor: "#fff", padding: 12, borderBottomWidth: 1, borderColor: "#E5E7EB" },
  label: { marginTop: 10, fontWeight: "600" },
  saveBtn: { backgroundColor: "#2563EB", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }
});
