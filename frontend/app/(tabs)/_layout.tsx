import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: "Home", 
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="catch-log" 
        options={{ 
          title: "Catch Log", 
          tabBarIcon: ({ color, size }) => <Ionicons name="fish" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="analytics" 
        options={{ 
          title: "Analytics", 
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{ 
          title: "Map", 
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="alerts" 
        options={{ 
          title: "Alerts", 
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />
        }}
        />
    </Tabs>
  );
}
