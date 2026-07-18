import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';

const API_URL = 'http://10.0.2.2:5000';

const WelcomeScreen = ({ navigation }) => {
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const handleNameChange = (text, field) => {
  const cleaned = text.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '');
  setForm({ ...form, [field]: cleaned });
};
  const handleTcChange = (text) => {
  const cleaned = text.replace(/\D/g, ''); 
  const limited = cleaned.slice(0, 11);    
  setForm({ ...form, tc_no: limited });
};
const handlePhoneChange = (text) => {
  const cleaned = text.replace(/\D/g, '').slice(0, 11);
  setForm({ ...form, phone: cleaned });
};
  const formatBirth = (text) => {
  
  const cleaned = text.replace(/\D/g, '');

  let formatted = cleaned;

  if (cleaned.length > 2 && cleaned.length <= 4) {
    formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  } 
  else if (cleaned.length > 4) {
    formatted =
      cleaned.slice(0, 2) + '/' +
      cleaned.slice(2, 4) + '/' +
      cleaned.slice(4, 8);
  }

  return formatted;
};
  
  const [form, setForm] = useState({
    name: '',
    surname: '',
    birth: '',
    tc_no: '',
    phone: '',
    password: '',
  });

  // 🔐 LOGIN FORM (phone + password)
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: '',
  });

  // 🟢 REGISTER
  const handleRegister = async () => {
    const { name, surname, birth, tc_no, phone, password } = form;

    if (!name || !surname || !birth || !tc_no || !phone || !password) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }

    if (password.length < 6) {
      alert('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          surname,
          birth,
          tc_no,
          phone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Kayıt başarısız');
        return;
      }

      alert('Kayıt başarılı! Giriş yapabilirsiniz.');
      setRegisterModalVisible(false);
      setForm({
        name: '',
        surname: '',
        birth: '',
        tc_no: '',
        phone: '',
        password: '',
      });

    } catch (err) {
      alert('Sunucuya bağlanılamadı');
    }
  };

  // 🔵 LOGIN
  const handleLogin = async () => {
  if (!loginForm.phone || !loginForm.password) {
    alert('Lütfen Telefon ve Şifre girin.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: loginForm.phone,
        password: loginForm.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Giriş başarısız');
      return;
    }

    // 🔐 TOKEN'I KAYDET
    await AsyncStorage.setItem('token', data.token);

    // (opsiyonel) kullanıcı bilgisi
    await AsyncStorage.setItem('user', JSON.stringify(data.user));

    alert(`Hoş geldin ${data.user.name}`);


    setLoginModalVisible(false);
    setLoginForm({ phone: '', password: '' });

    navigation.reset({
  index: 0,
  routes: [{ name: "HomePage" }],
});

  } catch (err) {
    alert('Sunucuya bağlanılamadı');
  }
};


  return (
    <ImageBackground
      source={require('../../assets/tir3.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>🚛 YükBul</Text>
          <Text style={styles.subtitle}>Taşımacılığın en kolay yolu</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => setLoginModalVisible(true)}
          >
            <Text style={styles.buttonText}>Giriş Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => setRegisterModalVisible(true)}
          >
            <Text style={styles.registerText}>Üye Ol</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* REGISTER MODAL */}
      <Modal transparent visible={registerModalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Üye Ol</Text>

            <TextInput
  placeholder="Ad"
  style={styles.input}
  value={form.name}
  onChangeText={(t) => handleNameChange(t, 'name')}
/>

<TextInput
  placeholder="Soyad"
  style={styles.input}
  value={form.surname}
  onChangeText={(t) => handleNameChange(t, 'surname')}
/>
            
            <TextInput
  placeholder="Doğum Tarihi (GG/AA/YYYY)"
  style={styles.input}
  value={form.birth}
  keyboardType="numeric"
  maxLength={10}
  onChangeText={(t) =>
    setForm({ ...form, birth: formatBirth(t) })
  }
/>
            <TextInput
  placeholder="TC Kimlik No"
  keyboardType="numeric"
  maxLength={11}
  style={styles.input}
  value={form.tc_no}
  onChangeText={handleTcChange}
/>
            <TextInput
  placeholder="Telefon"
  keyboardType="phone-pad"
  style={styles.input}
  value={form.phone}
  onChangeText={handlePhoneChange}
/>
            <TextInput placeholder="Şifre" secureTextEntry
              style={styles.input}
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
            />

            <Pressable style={styles.loginBtn} onPress={handleRegister}>
              <Text style={styles.loginBtnText}>Kaydol</Text>
            </Pressable>

            <Pressable onPress={() => setRegisterModalVisible(false)}>
              <Text style={styles.cancelText}>İptal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* LOGIN MODAL */}
      <Modal transparent visible={loginModalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Giriş Yap</Text>

            <TextInput
              placeholder="Telefon"
              keyboardType="phone-pad"
              style={styles.input}
              value={loginForm.phone}
              onChangeText={(t) => setLoginForm({ ...loginForm, phone: t })}
            />
            <TextInput
              placeholder="Şifre"
              secureTextEntry
              style={styles.input}
              value={loginForm.password}
              onChangeText={(t) => setLoginForm({ ...loginForm, password: t })}
            />

            <Pressable style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginBtnText}>Giriş Yap</Text>
            </Pressable>

            <Pressable onPress={() => setLoginModalVisible(false)}>
              <Text style={styles.cancelText}>İptal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
  },
  header: { alignItems: 'center' },
  title: { fontSize: 42, color: '#fff', fontWeight: 'bold' },
  subtitle: { fontSize: 18, color: '#ddd' },
  buttonContainer: { width: '100%', alignItems: 'center' },
  loginButton: {
    width: '80%', backgroundColor: '#000',
    padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 15,
  },
  registerButton: {
    width: '80%', backgroundColor: '#34C759',
    padding: 15, borderRadius: 12, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  registerText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  modalContainer: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '85%', backgroundColor: '#fff',
    borderRadius: 15, padding: 25, alignItems: 'center',
  },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 15 },
  input: {
    width: '100%', borderWidth: 1, borderColor: '#ccc',
    borderRadius: 8, padding: 10, marginBottom: 12,
  },
  loginBtn: {
    backgroundColor: '#000', padding: 12,
    borderRadius: 10, width: '100%', alignItems: 'center',
  },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cancelText: { color: '#007AFF', marginTop: 10 },
});

export default WelcomeScreen;
