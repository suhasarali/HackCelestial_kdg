import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Colors, BorderRadius, Shadows, Spacing, Layout } from "../../constants/design";

export default function TabLayout() {
  const { t } = useTranslation();
  
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: t('navigation.home'), 
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={24} 
                color={color} 
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="catch-log" 
        options={{ 
          title: t('navigation.catchLog'), 
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={focused ? "fish" : "fish-outline"} 
                size={24} 
                color={color} 
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="analytics" 
        options={{ 
          title: t('navigation.analytics'), 
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={focused ? "stats-chart" : "stats-chart-outline"} 
                size={24} 
                color={color} 
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{ 
          title: t('navigation.map'), 
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={focused ? "map" : "map-outline"} 
                size={24} 
                color={color} 
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="alerts" 
        options={{ 
          title: t('navigation.alerts'), 
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={focused ? "notifications" : "notifications-outline"} 
                size={24} 
                color={color} 
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          )
        }} 
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('navigation.community'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={focused ? "people" : "people-outline"} 
                size={24} 
                color={color} 
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 12,
    left: 16,
    right: 16,
    height: 70,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    borderTopWidth: 0,
    paddingBottom: 0,
    paddingHorizontal: 8,
    ...Shadows.lg,
    // Additional shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  tabBarItem: {
    paddingVertical: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  activeIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
});
