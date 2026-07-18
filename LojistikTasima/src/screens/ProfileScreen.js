import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.0.2.2:5000";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    tc_no: "",
    name: "",
    surname: "",
    birth: "",
    phone: "",
    email: "",
    password: "",
    oldPassword: "",
  });

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    return isoDate.split("T")[0];
  };

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  /*  PROFİL GETİR */
  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Hata", data.message || "Profil getirilemedi");
        return;
      }

      setForm((prev) => ({
        ...prev,
        tc_no: data.tc_no,
        name: data.name,
        surname: data.surname,
        birth: formatDate(data.birth),
        phone: data.phone,
        email: data.email || "",
      }));
    } catch (err) {
      Alert.alert("Hata", "Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  };

  /*  PROFİL GÜNCELLE */
  const handleSave = async () => {
  if (!form.oldPassword) {
    Alert.alert("Uyarı", "Mevcut şifrenizi girmeniz gerekiyor");
    return;
  }

  Alert.alert(
    "Profili Güncelle",
    "Bilgileriniz güncellensin mi?",
    [
      {
        text: "İptal",
        style: "cancel",
      },
      {
        text: "Evet",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");

            const body = {
              oldPassword: form.oldPassword,
            };

            if (form.phone) body.phone = form.phone;
            if (form.email) body.email = form.email;
            if (form.password) body.password = form.password;

            const res = await fetch(`${API_URL}/api/users/profile`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
              Alert.alert(
                "Hata",
                data.message || "Güncelleme başarısız"
              );
              return;
            }

            Alert.alert("Başarılı", "Profil güncellendi ✅");

            setForm({
              ...form,
              password: "",
              oldPassword: "",
            });
          } catch (err) {
            Alert.alert("Hata", "Sunucu hatası");
          }
        },
      },
    ]
  );
};

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return null;

  return (
    <ScrollView style={styles.container}>
      {/* ÜST PROFİL KARTI */}
      <View style={styles.profileCard}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.name}>
          {form.name} {form.surname}
        </Text>
        <Text style={styles.sub}>Kullanıcı Profili</Text>
      </View>

      {/* FORM */}
      <View style={styles.form}>
        <Input label="TC Kimlik No" value={form.tc_no} editable={false} />
        <Input label="Ad" value={form.name} editable={false} />
        <Input label="Soyad" value={form.surname} editable={false} />
        <Input label="Doğum Tarihi" value={form.birth} editable={false} />

        <Input
          label="Email"
          value={form.email}
          keyboardType="email-address"
          onChangeText={(t) => handleChange("email", t)}
        />

        <Input
          label="Telefon"
          value={form.phone}
          keyboardType="phone-pad"
          onChangeText={(t) => handleChange("phone", t)}
        />

        <Input
          label="Yeni Şifre"
          value={form.password}
          secureTextEntry
          placeholder="••••••••"
          onChangeText={(t) => handleChange("password", t)}
        />

        <Input
          label="Mevcut Şifre"
          value={form.oldPassword}
          secureTextEntry
          placeholder="Mevcut şifreniz"
          onChangeText={(t) => handleChange("oldPassword", t)}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* 🔹 INPUT */
const Input = ({ label, editable = true, ...props }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        !editable && { backgroundColor: "#E5E7EB", color: "#64748B" },
      ]}
      editable={editable}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  profileCard: {
    backgroundColor: "#0F172A",
    margin: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  avatar: {
    fontSize: 48,
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  sub: {
    fontSize: 14,
    color: "#CBD5E1",
    marginTop: 4,
  },
  form: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F8FAFC",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
