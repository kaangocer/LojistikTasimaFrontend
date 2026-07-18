import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './src/screens/WelcomeScreen';
import HomePage from './src/screens/HomePage';
import LoadsScreen from './src/screens/LoadsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import VehicleScreen from './src/screens/VehicleScreen';
import OffersScreen from './src/screens/OffersScreen';
import TripsScreen from './src/screens/TripsScreen';
import TripChatScreen from "./src/screens/TripChatScreen";
import AdminScreen from "./src/screens/AdminScreen";
import NotificationScreen from "./src/screens/NotificationScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="HomePage"
          component={HomePage}
          options={{ title: 'AnaSayfa' }}
        />
        <Stack.Screen name="Loads" component={LoadsScreen} options={{ title: "Yükler" }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{title:"Profil"}} />
        <Stack.Screen name="Vehicle" component={VehicleScreen} options={{title:"Araçlar"}} />
        <Stack.Screen name="Offers" component={OffersScreen} options={{title:"Teklifler"}} />
        <Stack.Screen name="Trips" component={TripsScreen} options={{title:"Seferler"}} />
        <Stack.Screen name="TripChat" component={TripChatScreen} options={{title:"Sohbet"}} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{title:"Admin"}} />
        <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: "Bildirimler" }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
