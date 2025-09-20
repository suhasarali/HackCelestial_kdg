import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import LocationDisplay from '../../components/LocationDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

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

  const fetchWeatherData = async () => {
    try {
      // Get location object from AsyncStorage
      const locationStr = await AsyncStorage.getItem('app_location');
      if (!locationStr) {
        Alert.alert('Location not set', 'Please set your location first.');
        setWeather(null);
        return;
      }
      const location = JSON.parse(locationStr);
      const lat = location.latitude;
      const lon = location.longitude;

      if (!lat || !lon) {
        Alert.alert('Location not set', 'Please set your location first.');
        setWeather(null);
        return;
      }

      // Fetch weather from Open-Meteo
      const weatherUrl =  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height&timezone=auto`;

      const [weatherRes, marineRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(marineUrl),
      ]);

      if (!weatherRes.ok || !marineRes.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const weatherData = await weatherRes.json();
      const marineData = await marineRes.json();

      const current = weatherData.current_weather;
      let waveHeight = null;
      if (marineData.hourly && marineData.hourly.wave_height) {
        // Get wave height for the current hour
        const now = new Date().toISOString().slice(0, 13) + ":00";
        const idx = marineData.hourly.time.indexOf(now);
        waveHeight = idx !== -1 ? marineData.hourly.wave_height[idx] : marineData.hourly.wave_height[0];
      }

      setWeather({
        temperature: current?.temperature ?? 0,
        windSpeed: current?.windspeed ?? 0,
        waveHeight: waveHeight ?? 0,
        condition: 'N/A',
        advisory: 'Check local conditions',
      });
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeather(null);
    }
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleViewProfile} style={styles.headerButton}>
            <Icon name="account" size={28} color="#2c3e50" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/matsya-logo.svg')} 
              style={styles.logo} 
              contentFit="contain"
            />
          </View>
          
          <TouchableOpacity onPress={handleAlerts} style={styles.headerButton}>
            <Ionicons name="notifications" size={25} color={"#2c3e50"} />
            {alerts.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{alerts.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeSubtitle}>Ready for your next fishing trip?</Text>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current Location</Text>
            <Icon name="map-marker" size={24} color="#3498db" />
          </View>
          <LocationDisplay 
            showAddress={true}
            showCoordinates={true}
            showAccuracy={true}
            compact={false}
          />
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
                  <View style={[styles.weatherIconContainer, { backgroundColor: '#ffeded' }]}>
                    <Icon name="temperature-celsius" size={20} color="#e74c3c" />
                  </View>
                  <Text style={styles.weatherValue}>{weather.temperature}°C</Text>
                  <Text style={styles.weatherLabel}>Temperature</Text>
                </View>
                <View style={styles.weatherItem}>
                  <View style={[styles.weatherIconContainer, { backgroundColor: '#e8f4fd' }]}>
                    <Icon name="weather-windy" size={20} color="#3498db" />
                  </View>
                  <Text style={styles.weatherValue}>{weather.windSpeed} km/h</Text>
                  <Text style={styles.weatherLabel}>Wind Speed</Text>
                </View>
                <View style={styles.weatherItem}>
                  <View style={[styles.weatherIconContainer, { backgroundColor: '#e8f4fd' }]}>
                    <Icon name="waves" size={20} color="#3498db" />
                  </View>
                  <Text style={styles.weatherValue}>{weather.waveHeight} m</Text>
                  <Text style={styles.weatherLabel}>Wave Height</Text>
                </View>
              </View>
              <View style={styles.advisoryContainer}>
                <Icon name="information" size={16} color="#7f8c8d" />
                <Text style={styles.advisory}>{weather.advisory}</Text>
              </View>
            </View>
          ) : (
            <Text>{t('home.loading')}</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{('Quick Actions')}</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleStartTrip}>
              <View style={[styles.actionIcon, { backgroundColor: '#3498db' }]}>
                <Icon name="navigation" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>{('startTrip')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleLogCatch}>
              <View style={[styles.actionIcon, { backgroundColor: '#2ecc71' }]}>
                <Icon name="fish" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>{('logCatch')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleViewAnalytics}>
              <View style={[styles.actionIcon, { backgroundColor: '#9b59b6' }]}>
                <Icon name="chart-bar" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>{('analytics')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Fishing Zones */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('home.topFishingZones')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.viewAll}>{t('View All')}</Text>
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
                  <View style={styles.zoneDetails}>
                    <Icon name="map-marker-distance" size={14} color="#7f8c8d" />
                    <Text style={styles.zoneDistance}>{zone.distance} away</Text>
                  </View>
                  <Text style={styles.zoneReason}>{zone.reason}</Text>
                </View>
                <View style={styles.zoneRating}>
                  <View style={styles.ratingContainer}>
                    <Icon name="star" size={16} color="#f39c12" />
                    <Text style={styles.ratingText}>{zone.rating}</Text>
                  </View>
                  <View style={[styles.safetyBadge, 
                    { backgroundColor: zone.safety === 'Safe' ? '#2ecc71' : 
                      zone.safety === 'Moderate' ? '#f39c12' : '#e74c3c' }]}>
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
              <Text style={styles.cardTitle}>{('Alerts')}</Text>
              <TouchableOpacity onPress={handleViewAlerts}>
                <Text style={styles.viewAll}>{('View All')}</Text>
              </TouchableOpacity>
            </View>
            {alerts.slice(0, 2).map(alert => (
              <TouchableOpacity 
                key={alert.id} 
                style={[styles.alertItem, 
                  { 
                    borderLeftWidth: 4,
                    borderLeftColor: alert.priority === 'high' ? '#e74c3c' : 
                                    alert.priority === 'medium' ? '#f39c12' : '#3498db',
                    backgroundColor: alert.priority === 'high' ? '#fdedec' : 
                                    alert.priority === 'medium' ? '#fef9e7' : '#e8f4fd'
                  }]}
                onPress={handleViewAlerts}
              >
                <View style={styles.alertIconContainer}>
                  <Icon 
                    name={alert.type === 'weather' ? 'weather-windy' : 'alert-circle'} 
                    size={20} 
                    color={alert.priority === 'high' ? '#e74c3c' : 
                          alert.priority === 'medium' ? '#f39c12' : '#3498db'} 
                  />
                </View>
                <Text style={styles.alertText}>{alert.message}</Text>
                <Icon name="chevron-right" size={20} color="#bdc3c7" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 50,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  weatherLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  advisoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  advisory: {
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
    color: '#7f8c8d',
  },
  zoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
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
    marginBottom: 4,
  },
  zoneDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  zoneDistance: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  zoneReason: {
    fontSize: 14,
    color: '#34495e',
  },
  zoneRating: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#f39c12',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  safetyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  safetyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertIconContainer: {
    marginRight: 12,
  },
  alertText: {
    flex: 1,
    color: '#34495e',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    width: (width - 72) / 3, // Responsive width calculation
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  actionText: {
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
});