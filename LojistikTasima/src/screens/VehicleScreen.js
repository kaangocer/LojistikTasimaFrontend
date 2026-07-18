import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
const vehicleTypeMap = {
  AUTOMOBILE: "Otomobil",
  TRUCK: "Kamyon",
  VAN: "Van",
  MINIBUS: "Minibüs",
  PICKUP: "Pickup",
};
const API_URL = "http://10.0.2.2:5000";



/* ======================
   DROPDOWN
====================== */
const Dropdown = ({ label, value, disabled, onPress }) => (
  <TouchableOpacity
    style={[
      styles.dropdown,
      disabled && { backgroundColor: "#E5E7EB" },
    ]}
    disabled={disabled}
    onPress={onPress}
  >
    <Text style={value ? styles.dropdownText : styles.placeholder}>
      {value || label}
    </Text>
  </TouchableOpacity>
);

/* ======================
   SELECTION MODAL
====================== */
const SelectionModal = ({ visible, title, data, onSelect, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.overlay}>
      <View style={styles.selectModal}>
        <Text style={styles.modalTitle}>{title}</Text>

        <FlatList
          data={data}
          keyExtractor={(item, i) =>
            (item.id || item.model_code || item.brand_code || i).toString()
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text>{item.name_tr || item.name || item}</Text>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancel}>İptal</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

/* ======================
   MAIN
====================== */
export default function VehicleScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [types, setTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);

  const [type, setType] = useState(null);
  const [brand, setBrand] = useState(null);
  const [model, setModel] = useState(null);
  const [year, setYear] = useState(null);

  const [showType, setShowType] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [showYear, setShowYear] = useState(false);

  const [plate, setPlate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [hasFuelCard, setHasFuelCard] = useState(false);

  /* ======================
     FETCH VEHICLES
  ====================== */
  const fetchVehicles = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVehicles(data);
    } catch {
      Alert.alert("Hata", "Araçlar alınamadı");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     VEHICLE DATA FLOW
  ====================== */

  const fetchTypes = async () => {
    const res = await fetch(`${API_URL}/api/vehicle-data/types`);
    setTypes(await res.json());
  };

  const fetchBrands = async (type) => {
    const res = await fetch(
      `${API_URL}/api/vehicle-data/brands?type=${type}`
    );
    setBrands(await res.json());
  };

  const fetchModels = async (brandCode) => {
  const res = await fetch(
    `${API_URL}/api/vehicle-data/models?brand_code=${brandCode}&type=${type.name}`
  );

  setModels(await res.json());
};

  const fetchYears = async (modelCode) => {
    const res = await fetch(
      `${API_URL}/api/vehicle-data/years?model_code=${modelCode}`
    );
    setYears(await res.json());
  };

  /* ======================
     CREATE VEHICLE
  ====================== */

  const createVehicle = async () => {
  if (!plate || !capacity || !year)
    return Alert.alert("Uyarı", "Tüm alanları doldur");

  try {
    const token = await AsyncStorage.getItem("token");

    const res = await fetch(`${API_URL}/api/vehicles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        plate_number: plate,
        capacity_ton: capacity,
        vehicle_type: type?.name,
        brand,
        model,
        year,
        has_fuel_card: hasFuelCard,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Araç eklenemedi");
    }

    // başarı
    Alert.alert("Başarılı", "Araç başarıyla eklendi 🚗");

    setModalVisible(false);
    setPlate("");
    setCapacity("");
    setHasFuelCard(false);
    setType(null);
    setBrand(null);
    setModel(null);
    setYear(null);

    fetchVehicles();
  } catch (error) {
    console.log(error);
    Alert.alert("Hata", "Araç eklenemedi, tekrar deneyin");
  }
};

  /* ======================
     DELETE VEHICLE
  ====================== */

  const deleteVehicle = (id) => {
    Alert.alert("Araç Sil", "Silinsin mi?", [
      { text: "İptal" },
      {
        text: "Sil",
        onPress: async () => {
          const token = await AsyncStorage.getItem("token");
          await fetch(`${API_URL}/api/vehicles/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchVehicles();
        },
      },
    ]);
  };

  useEffect(() => {
    fetchVehicles();
    fetchTypes();
  }, []);

  if (loading) return null;

  const filteredVehicles = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.plate_number.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q)
    );
  });

  /* ======================
     UI
  ====================== */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 Araçlarım</Text>

      <View style={styles.searchContainer}>
  <Text style={styles.searchIcon}>🔍</Text>

  <TextInput
    placeholder="Plaka, marka veya model ara..."
    style={styles.searchInput}
    value={search}
    onChangeText={setSearch}
  />
</View>

      <FlatList
        data={filteredVehicles}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ paddingBottom: 140 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
  <View style={{ flex: 1 }}>
    <View style={styles.plateBadge}>
      <Text style={styles.plate}>
        {item.plate_number}
      </Text>
    </View>

    <Text style={styles.sub}>
      {item.brand} {item.model} • {item.year}
    </Text>

    <Text style={styles.sub}>
  {vehicleTypeMap[item.vehicle_type] || item.vehicle_type}
  {" • "}
  {item.capacity_ton} ton
</Text>

    <View
      style={[
        styles.fuelBadge,
        {
          backgroundColor: item.has_fuel_card
            ? "#DCFCE7"
            : "#FEE2E2"
        }
      ]}
    >
      <Text
        style={{
          color: item.has_fuel_card
            ? "#166534"
            : "#991B1B"
        }}
      >
        {item.has_fuel_card
          ? "⛽ Yakıt Kartı Var"
          : "⛽ Yakıt Kartı Yok"}
      </Text>
    </View>
  </View>

  <TouchableOpacity
    style={styles.deleteBtn}
    onPress={() => deleteVehicle(item.id)}
  >
    <Text style={styles.deleteText}>🗑️</Text>
  </TouchableOpacity>
</View>
         
        )}
      />

      {/* ADD BUTTON */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addText}>＋ Araç Ekle</Text>
      </TouchableOpacity>

      {/* ADD MODAL */}
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modal}>
          <Text style={styles.modalTitle}>Araç Ekle</Text>

          <Dropdown
  label="Tip"
  value={type?.name_tr}
  onPress={()=>setShowType(true)}
/>
          <Dropdown label="Marka" value={brand} disabled={!type} onPress={()=>setShowBrand(true)}/>
          <Dropdown label="Model" value={model} disabled={!brand} onPress={()=>setShowModel(true)}/>
          <Dropdown label="Yıl" value={year} disabled={!model} onPress={()=>setShowYear(true)}/>

          <TextInput
            placeholder="Plaka"
            style={styles.input}
            value={plate}
            onChangeText={setPlate}
          />

          <TextInput
            placeholder="Kapasite Ton"
            style={styles.input}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <Text>Yakıt Kartı</Text>
            <Switch value={hasFuelCard} onValueChange={setHasFuelCard}/>
          </View>

          <TouchableOpacity
  style={styles.saveBtn}
  onPress={() =>
    Alert.alert(
      "Araç Ekle",
      `${plate || "Bu araç"} eklensin mi?`,
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Ekle",
          onPress: createVehicle
        }
      ]
    )
  }
>
  <Text style={{ color: "#fff" }}>Kaydet</Text>
</TouchableOpacity>

          <TouchableOpacity onPress={()=>setModalVisible(false)}>
            <Text style={styles.cancel}>İptal</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* SELECTION MODALS */}
      <SelectionModal visible={showType} title="Tip" data={types}
       onSelect={(t) => {
  setType(t);

  setBrand(null);
  setModel(null);
  setYear(null);

  setBrands([]);
  setModels([]);
  setYears([]);

  fetchBrands(t.name);
}}
        onClose={()=>setShowType(false)}
      />

      <SelectionModal visible={showBrand} title="Marka" data={brands}
        onSelect={(b) => {
  setBrand(b.name);

  setModel(null);
  setYear(null);

  setModels([]);
  setYears([]);

  fetchModels(b.brand_code);
}}
        onClose={()=>setShowBrand(false)}
      />

      <SelectionModal visible={showModel} title="Model" data={models}
        onSelect={(m) => {
  setModel(m.name);

  setYear(null);
  setYears([]);

  fetchYears(m.model_code);
}}
        onClose={()=>setShowModel(false)}
      />

      <SelectionModal visible={showYear} title="Yıl" data={years}
        onSelect={(y)=>setYear(y)}
        onClose={()=>setShowYear(false)}
      />

    </View>
  );
}

/* ======================
   STYLES
====================== */
const styles = StyleSheet.create({
  container:{flex:1,padding:20,backgroundColor:"#F8FAFC"},
  title:{fontSize:22,fontWeight:"700",marginBottom:12},
  search:{backgroundColor:"#fff",padding:12,borderRadius:12,marginBottom:10},

  card: {
  flexDirection: "row",
  backgroundColor: "#fff",
  padding: 18,
  borderRadius: 18,
  marginBottom: 12,
  
  

  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2
  },
  shadowOpacity: 0.08,
  shadowRadius: 8,

  elevation: 4
},
  plateBadge: {
  alignSelf: "flex-start",
  backgroundColor: "#DBEAFE",
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 8,
  marginBottom: 6
},

plate: {
  color: "#1D4ED8",
  fontWeight: "700"
},
  sub:{color:"#64748B",fontSize:13},

  
  deleteText:{color:"#DC2626",fontWeight:"700"},

  addBtn:{backgroundColor:"#2563EB",padding:14,borderRadius:16,alignItems:"center"},
  addText:{color:"#fff",fontWeight:"700"},

  modal:{flex:1,padding:20},
  modalTitle:{fontSize:20,fontWeight:"700",marginBottom:12},

  dropdown:{backgroundColor:"#fff",padding:14,borderRadius:12,marginBottom:10},
  dropdownText:{},
  placeholder:{color:"#94A3B8"},

  input:{backgroundColor:"#fff",padding:12,borderRadius:12,marginTop:10},

  saveBtn:{backgroundColor:"#16A34A",padding:14,borderRadius:12,marginTop:16,alignItems:"center"},
  cancel:{textAlign:"center",color:"#EF4444",marginTop:16},

  switchRow:{flexDirection:"row",justifyContent:"space-between",marginTop:14},

  overlay:{flex:1,backgroundColor:"rgba(0,0,0,0.4)",justifyContent:"flex-end"},
  selectModal:{backgroundColor:"#fff",padding:20,borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:"70%"},
  optionItem:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:"#E5E7EB"},
  searchContainer: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  borderRadius: 14,
  paddingHorizontal: 14,
  marginBottom: 16,
  elevation: 2
},

searchIcon: {
  fontSize: 18,
  marginRight: 8
},

searchInput: {
  flex: 1,
  height: 50
},
fuelBadge: {
  alignSelf: "flex-start",
  marginTop: 8,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 10
},


deleteBtn: {
  position: "absolute",
  top: 12,
  right: 12,

  width: 36,
  height: 36,

  borderRadius: 18,
  backgroundColor: "#FEE2E2",

  justifyContent: "center",
  alignItems: "center"
},
});
