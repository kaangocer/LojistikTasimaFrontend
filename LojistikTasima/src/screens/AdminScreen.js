import React, {
  useEffect,
  useState
} from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.0.2.2:5000";

export default function AdminScreen() {

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {

      const token =
        await AsyncStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/api/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      setUsers(data);

    } catch (err) {
      console.log(err);

      Alert.alert(
        "Hata",
        "Kullanıcılar alınamadı"
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id, fullName) => {

  Alert.alert(
    "Kullanıcı Sil",
    `${fullName} adlı kullanıcı kalıcı olarak silinecek.`,
    [
      {
        text: "İptal",
        style: "cancel"
      },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {

            const token =
              await AsyncStorage.getItem("token");

            const res = await fetch(
              `${API_URL}/api/admin/users/${id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.message);
            }

            Alert.alert(
              "Başarılı",
              "Kullanıcı silindi"
            );

            fetchUsers();

          } catch (err) {

            console.log(err);

            Alert.alert(
              "Hata",
              err.message
            );
          }
        }
      }
    ]
  );
};

  const updateRole = async (
    userId,
    role
  ) => {

    try {

      const token =
        await AsyncStorage.getItem(
          "token"
        );

      await fetch(
        `${API_URL}/api/admin/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`
          },
          body: JSON.stringify({
            role
          })
        }
      );

      fetchUsers();

    } catch (err) {
      console.log(err);
    }
  };

  const filteredUsers =
    users.filter(user => {

      const q =
        search.toLowerCase();

      return (
        user.name
          ?.toLowerCase()
          .includes(q) ||

        user.surname
          ?.toLowerCase()
          .includes(q) ||

        user.phone
          ?.includes(q)
      );
    });

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  return (
    
    <View style={styles.container}>
  <ScrollView
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{
    paddingBottom: 80
  }}
>
      
      <View style={styles.headerCard}>
  <Text style={styles.headerTitle}>
    👑 Admin Paneli
  </Text>

  <Text style={styles.headerSubtitle}>
    Kullanıcıları yönetebilir, rol atayabilir ve hesapları silebilirsiniz.
  </Text>
</View>

      {/* STATS */}

      <View style={styles.statsRow}>

        <View style={styles.statCard}>
  <Text style={{ fontSize: 28 }}>
    👥
  </Text>

  <Text style={styles.statNumber}>
    {users.length}
  </Text>

  <Text style={styles.statText}>
    Toplam Kullanıcı
  </Text>
</View>

        <View style={styles.statCard}>
  <Text style={{ fontSize: 28 }}>
    👑
  </Text>

  <Text style={styles.statNumber}>
    {
      users.filter(
        x => x.role_name === "admin"
      ).length
    }
  </Text>

  <Text style={styles.statText}>
    Admin
  </Text>
</View>

      </View>

      {/* SEARCH */}

      <TextInput
        placeholder="Kullanıcı ara..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {/* USERS */}



  {filteredUsers.map(item => (

    <View
      key={item.id}
      style={styles.userCard}
    >

      <View style={{ flex: 1 }}>

        <Text style={styles.userName}>
          {item.name} {item.surname}
        </Text>

        <Text style={styles.userInfo}>
          📞 {item.phone}
        </Text>
        <Text style={styles.dateText}>
  📅 {
    new Date(item.created_at)
      .toLocaleDateString("tr-TR")
  }
</Text>

        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor:
                item.role_name === "admin"
                  ? "#FDE68A"
                  : "#DBEAFE"
            }
          ]}
        >
          <Text>
            {item.role_name === "admin"
              ? "👑 Admin"
              : "👤 Kullanıcı"}
          </Text>
        </View>

      </View>

      <View style={styles.actionContainer}>

        <TouchableOpacity
          style={styles.roleBtn}
          onPress={() => {

            if (item.role_name === "admin") {

              Alert.alert(
                "Admin Yetkisini Kaldır",
                `${item.name} kullanıcısının admin yetkisi kaldırılacak.`,
                [
                  {
                    text: "Vazgeç",
                    style: "cancel"
                  },
                  {
                    text: "Kaldır",
                    style: "destructive",
                    onPress: () =>
                      updateRole(item.id, "user")
                  }
                ]
              );

            } else {

              Alert.alert(
                "Admin Yap",
                `${item.name} kullanıcısına admin yetkisi vermek istiyor musunuz?`,
                [
                  {
                    text: "Hayır",
                    style: "cancel"
                  },
                  {
                    text: "Evet",
                    onPress: () =>
                      updateRole(item.id, "admin")
                  }
                ]
              );

            }

          }}
        >
          <Text>👑</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() =>
            deleteUser(
              item.id,
              `${item.name} ${item.surname}`
            )
          }
        >
          <Text>🗑️</Text>
        </TouchableOpacity>

      </View>

    </View>

  ))}

</ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#0F172A"
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 3,
    alignItems: "center"
  },

  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2563EB"
  },

  statText: {
    marginTop: 4,
    color: "#64748B"
  },

  search: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 2
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#fff",
    borderRadius: 18,

    padding: 16,
    marginBottom: 12,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 2
  },

  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A"
  },

  userInfo: {
    marginTop: 4,
    color: "#64748B"
  },

  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8
  },

  actionContainer: {
    flexDirection: "row",
    gap: 8
  },

  roleBtn: {
    width: 42,
    height: 42,

    borderRadius: 12,
    backgroundColor: "#FEF3C7",

    justifyContent: "center",
    alignItems: "center"
  },

  deleteBtn: {
    width: 42,
    height: 42,

    borderRadius: 12,
    backgroundColor: "#FEE2E2",

    justifyContent: "center",
    alignItems: "center"
  },
  headerCard: {
  backgroundColor: "#0F172A",
  borderRadius: 20,
  padding: 20,
  marginBottom: 20
},

headerTitle: {
  color: "#fff",
  fontSize: 22,
  fontWeight: "700"
},

headerSubtitle: {
  color: "#CBD5E1",
  marginTop: 8
},

avatar: {
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: "#2563EB",
  justifyContent: "center",
  alignItems: "center"
},

avatarText: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "700"
},

dateText: {
  marginTop: 3,
  color: "#94A3B8",
  fontSize: 12
},

roleBtnText: {
  color: "#92400E",
  fontWeight: "700"
},

deleteText: {
  color: "#DC2626",
  fontWeight: "700"
}

});