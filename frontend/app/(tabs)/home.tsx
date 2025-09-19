
import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { useTranslation } from 'react-i18next';

// Mock data types
interface WeatherData {
  temperature: number;
  windSpeed: number;
  waveHeight: number;
  condition: string;
  advisory: string;
}

interface FishingZone {
  id: number;
  name: string;
  distance: string;
  rating: number;
  reason: string;
  safety: string;
}

interface AlertItem {
  id: number;
  type: string;
  message: string;
  priority: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [zones, setZones] = useState<FishingZone[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    fetchWeatherData();
    fetchTopZones();
    fetchAlerts();
  }, []);

  const fetchWeatherData = () => {
    setWeather({
      temperature: 28,
      windSpeed: 12,
      waveHeight: 1.2,
      condition: 'Partly Cloudy',
      advisory: 'Good fishing conditions'
    });
  };

  const fetchTopZones = () => {
    setZones([
      {
        id: 1,
        name: 'North Bay',
        distance: '5.2 km',
        rating: 4.8,
        reason: 'High fish activity, calm waters',
        safety: 'Safe'
      },
      {
        id: 2,
        name: 'Coral Reef',
        distance: '8.7 km',
        rating: 4.5,
        reason: 'Tuna spotted, moderate currents',
        safety: 'Moderate'
      },
      {
        id: 3,
        name: 'Deep Trench',
        distance: '12.3 km',
        rating: 4.2,
        reason: 'Good catch reported yesterday',
        safety: 'Safe'
      }
    ]);
  };

  const fetchAlerts = () => {
    setAlerts([
      {
        id: 1,
        type: 'weather',
        message: 'High wind warning after 3 PM',
        priority: 'high'
      },
      {
        id: 2,
        type: 'regulation',
        message: 'Fishing restricted in Zone B until next week',
        priority: 'medium'
      }
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      fetchWeatherData();
      fetchTopZones();
      fetchAlerts();
      setRefreshing(false);
    }, 1500);
  };

  const handleStartTrip = () => {
    router.push('/(tabs)/map');
  };

  const handleLogCatch = () => {
    router.push('/(tabs)/catch-log');
  };

  const handleViewAlerts = () => {
    router.push('/(tabs)/alerts');
  };

  const handleViewAnalytics = () => {
    router.push('/(tabs)/analytics');
  };

  const handleViewProfile = () => {
    router.push('/profile');
  };

  const handleAlerts=() => {
    router.push('/(tabs)/alerts');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleViewProfile}>
            <Icon name="account" size={28} color="#2c3e50" />
          </TouchableOpacity>
          <Image source={require('../../assets/images/matsya-logo.svg')} style={{ width: 100, height: 50 }} />
          <TouchableOpacity onPress={handleAlerts}>
           <Ionicons name="notifications" size={25} color={"#2c3e50"} /> 
          </TouchableOpacity>
        </View>

        {/* Weather Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('home.weather')}</Text>
            <Icon name="weather-partly-cloudy" size={24} color="#3498db" />
          </View>
          {weather ? (
            <View>
              <View style={styles.weatherRow}>
                <View style={styles.weatherItem}>
                  <Icon name="temperature-celsius" size={20} color="#e74c3c" />
                  <Text style={styles.weatherText}>{weather.temperature}°C</Text>
                </View>
                <View style={styles.weatherItem}>
                  <Icon name="weather-windy" size={20} color="#3498db" />
                  <Text style={styles.weatherText}>{weather.windSpeed} km/h</Text>
                </View>
                <View style={styles.weatherItem}>
                  <Icon name="waves" size={20} color="#3498db" />
                  <Text style={styles.weatherText}>{weather.waveHeight} m</Text>
                </View>
              </View>
              <Text style={styles.advisory}>{weather.advisory}</Text>
            </View>
          ) : (
            <Text>{t('home.loading')}</Text>
          )}
        </View>

        {/* Top Fishing Zones */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('home.topFishingZones')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {zones.length > 0 ? (
            zones.map(zone => (
              <TouchableOpacity 
                key={zone.id} 
                style={styles.zoneItem}
                onPress={() => router.push({
                  pathname: '/(tabs)/map',
                  params: { selectedZone: JSON.stringify(zone) }
                })}
              >
                <View style={styles.zoneInfo}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <Text style={styles.zoneDistance}>{zone.distance} away</Text>
                  <Text style={styles.zoneReason}>{zone.reason}</Text>
                </View>
                <View style={styles.zoneRating}>
                  <Icon name="star" size={16} color="#f39c12" />
                  <Text style={styles.ratingText}>{zone.rating}</Text>
                  <View style={[styles.safetyBadge, 
                    { backgroundColor: zone.safety === 'Safe' ? '#2ecc71' : '#f39c12' }]}>
                    <Text style={styles.safetyText}>{zone.safety}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text>{('noZones')}</Text>
          )}
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{('alerts')}</Text>
              <TouchableOpacity onPress={handleViewAlerts}>
                <Text style={styles.viewAll}>{('viewAll')}</Text>
              </TouchableOpacity>
            </View>
            {alerts.slice(0, 2).map(alert => (
              <TouchableOpacity 
                key={alert.id} 
                style={[styles.alertItem, 
                  { borderLeftColor: alert.priority === 'high' ? '#e74c3c' : '#f39c12' }]}
                onPress={handleViewAlerts}
              >
                <Icon 
                  name={alert.type === 'weather' ? 'weather-windy' : 'alert-circle'} 
                  size={20} 
                  color={alert.priority === 'high' ? '#e74c3c' : '#f39c12'} 
                />
                <Text style={styles.alertText}>{alert.message}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{('quickActions')}</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleStartTrip}>
              <View style={styles.actionIcon}>
                <Icon name="navigation" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>{('startTrip')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleLogCatch}>
              <View style={styles.actionIcon}>
                <Icon name="fish" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>{('logCatch')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleViewAnalytics}>
              <View style={styles.actionIcon}>
                <Icon name="chart-bar" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>{('analytics')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 7,
    backgroundColor: '#ecf0f1',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  card: {
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  viewAll: {
    color: '#3498db',
    fontWeight: '500',
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weatherItem: {
    alignItems: 'center',
  },
  weatherText: {
    fontSize: 16,
    marginTop: 4,
  },
  advisory: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#7f8c8d',
    marginTop: 8,
  },
  zoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  zoneInfo: {
    flex: 2,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  zoneDistance: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  zoneReason: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 4,
  },
  zoneRating: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  ratingText: {
    fontSize: 14,
    color: '#f39c12',
    marginTop: 2,
  },
  safetyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  safetyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fef9e7',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertText: {
    marginLeft: 8,
    flex: 1,
    color: '#34495e',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
  },
});