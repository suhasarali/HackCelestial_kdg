import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import React from "react";

export default function TabLayout() {
  const { t } = useTranslation();
  
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: ('home'), 
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="catch-log" 
        options={{ 
          title: ('catchLog'), 
          tabBarIcon: ({ color, size }) => <Ionicons name="fish" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="analytics" 
        options={{ 
          title: ('analytics'), 
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{ 
          title: ('map'), 
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="alerts" 
        options={{ 
          title: ('alerts'), 
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen
        name="community"
        options={{
          title: ('community'),
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />
        }}
        />
    </Tabs>
  );
}
