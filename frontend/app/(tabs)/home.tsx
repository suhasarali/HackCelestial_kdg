import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Dimensions,
  ImageBackground,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import LocationDisplay from '../../components/LocationDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/design';
import { fetchNotifications, fetchPopularSpots, loadCachedAlerts, cacheAlerts, AlertData } from '../services/notifications';

const { width, height } = Dimensions.get('window');

// Mock data types
interface WeatherData {
  temperature: number;
  windSpeed: number;
  waveHeight: number;
  condition: string;
  advisory: string;
}

interface FishingZone {
  id: string;
  name: string;
  distance: string;
  rating: number;
  reason: string;
  safety: string;
  image: string;
  fishTypes: string[];
}

interface AlertItem {
  id: string | number;
  type: string;
  message: string;
  priority: string;
}

const STORAGE_KEY = '@popular_fishing_spots';

export interface SpotItem {
  id: string;
  name: string;
  type: string;
  distance: string; 
  rating: number;
  reason: string;
  safety: string;
  fishTypes: string[];
  image: any;
}

const saveSpotsToStorage = async (data: SpotItem[]) => {
  try {
    const jsonValue = JSON.stringify({
      lastUpdated: new Date().toISOString(),
      data: data
    });
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Error saving spots", e);
  }
};

const loadSpotsFromStorage = async (): Promise<SpotItem[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue).data : [];
  } catch (e) {
    console.error("Error loading spots", e);
    return [];
  }
};

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Get weather icon based on condition
const getWeatherIcon = (condition: string) => {
  switch (condition?.toLowerCase()) {
    case 'sunny': return 'weather-sunny';
    case 'cloudy': return 'weather-cloudy';
    case 'rainy': return 'weather-rainy';
    case 'stormy': return 'weather-lightning-rainy';
    default: return 'weather-partly-cloudy';
  }
};

// Fishing spot images (using Unsplash)
const SPOT_IMAGES = [
  'https://seawatersports.com/images/activies/slide/fishing-in-mumbai-in-maharashtra-package.jpg',
  'https://content.jdmagicbox.com/v2/comp/thane/y3/022pxx22.xx22.141218154425.u9y3/catalogue/talao-pali-lake-thane-west-thane-tourist-attraction-4hvqqim818-250.jpg',
  'https://content3.jdmagicbox.com/v2/comp/thane/c2/022pxx22.xx22.141212174352.z1c2/catalogue/yeoor-hills-thane-west-thane-tourist-attraction-17v6lrng7u.jpg',
  'https://thumbs.dreamstime.com/b/fishermen-marari-beach-kerala-india-26991542.jpg',
  'https://www.treksandtrails.org/system/images/000/718/717/b0531ae51809c6355d44a087120ea7b4/original/fishing_village_mumbai.jpg',
];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [zones, setZones] = useState<FishingZone[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const [userName, setUserName] = useState('Fisher');
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    fetchWeatherData();
    fetchTopZones();
    fetchAlerts();
    loadUserName();
  }, []);

useEffect(() => {
  // Load offline data immediately so the screen isn't empty
  const loadInitial = async () => {
    const cached = await loadSpotsFromStorage();
    if (cached) setZones(cached);
    
    // Then try to get fresh data
    fetchTopZones();
  };
  
  loadInitial();

  // Set interval to refresh every 5 minutes
  const interval = setInterval(fetchTopZones, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, []);

  const loadUserName = async () => {
    const name = await AsyncStorage.getItem('userName');
    if (name) setUserName(name);
  };

  const fetchWeatherData = async () => {
    try {
      const locationStr = await AsyncStorage.getItem('app_location');
      if (!locationStr) {
        setWeather({
          temperature: 28,
          windSpeed: 12,
          waveHeight: 1.2,
          condition: 'Sunny',
          advisory: 'Great conditions for fishing today!',
        });
        return;
      }
      const location = JSON.parse(locationStr);
      const lat = location.latitude;
      const lon = location.longitude;
      setCurrentLocation({ latitude: lat, longitude: lon });

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
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
      let waveHeight = 1.0;
      if (marineData.hourly && marineData.hourly.wave_height) {
        const now = new Date().toISOString().slice(0, 13) + ":00";
        const idx = marineData.hourly.time.indexOf(now);
        waveHeight = idx !== -1 ? marineData.hourly.wave_height[idx] : marineData.hourly.wave_height[0];
      }

      setWeather({
        temperature: current?.temperature ?? 28,
        windSpeed: current?.windspeed ?? 12,
        waveHeight: waveHeight ?? 1.0,
        condition: 'Sunny',
        advisory: 'Great conditions for fishing today!',
      });
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeather({
        temperature: 28,
        windSpeed: 12,
        waveHeight: 1.2,
        condition: 'Sunny',
        advisory: 'Great conditions for fishing!',
      });
    }
  };

// Main function to orchestrate state and storage
const DUMMY_DATA = [
  {
    id: 'dummy-1',
    name: 'Thane Creek (near Kopri Bridge)',
    distance: '10 km',
    rating: 4.2,
    reason: 'Mullet, Bream, Crabs',
    safety: 'Safe',
    fishTypes: ['Mullet', 'Bream', 'Crabs']
  },
  {
    id: 'dummy-2',
    name: 'Upvan Lake',
    distance: '12 km',
    rating: 4.5,
    reason: 'Tilapia, Catfish',
    safety: 'Safe',
    fishTypes: ['Tilapia', 'Catfish']
  },
  {
    id: 'dummy-3',
    name: 'Yeoor Hills Reservoir',
    distance: '15 km',
    rating: 4.0,
    reason: 'Rohu, Catla',
    safety: 'Moderate',
    fishTypes: ['Rohu', 'Catla']
  },
  {
    id: 'dummy-4',
    name: 'Ghodbunder Creek',
    distance: '18 km',
    rating: 3.8,
    reason: 'Mullet, Bombay Duck',
    safety: 'Moderate',
    fishTypes: ['Mullet', 'Bombay Duck']
  },
  {
    id: 'dummy-5',
    name: 'Kelva Beach',
    distance: '35 km',
    rating: 4.7,
    reason: 'Sardines, Pomfret, Flathead',
    safety: 'Moderate',
    fishTypes: ['Sardines', 'Pomfret', 'Flathead']
  }
];

const fetchTopZones = async () => {
  try {
    // 1. Get user location from storage
    const locationStr = await AsyncStorage.getItem('app_location');
    let lat = 19.0760, lon = 72.8777; 
    if (locationStr) {
      const { latitude, longitude } = JSON.parse(locationStr);
      lat = latitude; lon = longitude;
    }

    // 2. Try fetching live data from API
    const fetchedZones = await fetchPopularSpots(lat, lon);

    if (fetchedZones && fetchedZones.length > 0) {
      // 3. Map local images to the backend results
      const zonesWithImages = fetchedZones.map((zone, index) => ({
        ...zone,
        image: SPOT_IMAGES[index % SPOT_IMAGES.length]
      }));
      
      setZones(zonesWithImages);
      await saveSpotsToStorage(zonesWithImages);
      return; // Success, exit function
    }
    
    // If we reach here, API returned empty array. Throw to trigger catch block fallback.
    throw new Error('Empty data');

  } catch (error) {
    console.log('API failed or empty. Checking storage/dummy fallback...');
    
    // 4. Offline Fallback: Try local storage
    const offlineData = await loadSpotsFromStorage();
    
    if (offlineData && offlineData.length > 0) {
      setZones(offlineData);
    } else {
      // 5. Hard Fallback: Use Dummy Data if everything else fails
      console.log('Everything failed, showing dummy data');
      // Map images to dummy data so it doesn't look broken
      const dummyWithImages = DUMMY_DATA.map((item, index) => ({
        ...item,
        image: SPOT_IMAGES[index % SPOT_IMAGES.length]
      }));
      setZones(dummyWithImages);
    }
  }
};

  const fetchAlerts = async () => {
    try {
      // 1. Load cached alerts first for immediate display
      const cached = await loadCachedAlerts();
      if (cached && cached.length > 0) {
        const mappedCached: AlertItem[] = cached.map((alert: AlertData) => ({
          id: alert.id,
          type: alert.category, 
          message: alert.title, 
          priority: alert.priority
        }));
        setAlerts(mappedCached);
      }

      const locationStr = await AsyncStorage.getItem('app_location');
      let lat = 19.0760;
      let lon = 72.8777;

      if (locationStr) {
        const location = JSON.parse(locationStr);
        lat = location.latitude;
        lon = location.longitude;
      }

      console.log('Fetching active alerts for home...');
      const fetchedAlerts = await fetchNotifications(lat, lon);
      
      // 2. Update with fresh data
      if (fetchedAlerts.length > 0) {
        const mappedAlerts: AlertItem[] = fetchedAlerts.map(alert => ({
          id: alert.id,
          type: alert.category, // Map category to type
          message: alert.title, // Use title as the main message/headline
          priority: alert.priority
        }));

        setAlerts(mappedAlerts);
        
        // 3. Cache the new Top 5
        await cacheAlerts(fetchedAlerts);
      }
    } catch (error) {
      console.error('Error fetching home alerts:', error);
      // If network fails, we rely on whatever is in state (which might be cached data)
    }
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

  const getSafetyColor = (safety: string) => {
    switch (safety) {
      case 'Safe': return Colors.success;
      case 'Moderate': return Colors.warning;
      default: return Colors.error;
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 17) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Weather Section */}
        <LinearGradient
          colors={[Colors.primary, '#1A5F7A', '#134B5F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          {/* Header */}
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <View style={styles.headerCenter}>
                <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                <View>
                  <Text style={styles.locationText}>Mumbai, India</Text>
                  {currentLocation && (
                    <Text style={styles.latLongText}>
                      {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity 
                  style={styles.notificationButton}
                  onPress={() => router.push('/(tabs)/alerts')}
                >
                  <Ionicons name="notifications" size={22} color="#fff" />
                  {alerts.length > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>{alerts.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.notificationButton}
                  onPress={() => router.push('/profile')}
                >
                  <ImageBackground
                    source={{ uri: 'https://st.depositphotos.com/2218212/2938/i/950/depositphotos_29387653-stock-photo-facebook-profile.jpg' }}
                    style={{ width: 36, height: 36 }}
                    imageStyle={{ borderRadius: 18 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userName}! 👋</Text>
          </View>

          {/* Weather Card with Glassmorphism */}
          <View style={styles.weatherCard}>
            <View style={styles.weatherGlass}>
              {weather ? (
                <>
                  <View style={styles.weatherMain}>
                    <View style={styles.temperatureSection}>
                      <Text style={styles.temperatureValue}>{Math.round(weather.temperature)}°</Text>
                      <Text style={styles.temperatureUnit}>C</Text>
                    </View>
                    <View style={styles.weatherIconSection}>
                      <Icon name={getWeatherIcon(weather.condition)} size={80} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.conditionLabel}>{weather.condition}</Text>
                    </View>
                  </View>

                  <View style={styles.weatherStats}>
                    <View style={styles.weatherStatItem}>
                      <View style={styles.statIconCircle}>
                        <Icon name="weather-windy" size={18} color="#fff" />
                      </View>
                      <View>
                        <Text style={styles.statValue}>{weather.windSpeed} km/h</Text>
                        <Text style={styles.statLabel}>Wind</Text>
                      </View>
                    </View>

                    <View style={styles.weatherStatItem}>
                      <View style={styles.statIconCircle}>
                        <Icon name="waves" size={18} color="#fff" />
                      </View>
                      <View>
                        <Text style={styles.statValue}>{weather.waveHeight}m</Text>
                        <Text style={styles.statLabel}>Waves</Text>
                      </View>
                    </View>

                    <View style={styles.weatherStatItem}>
                      <View style={styles.statIconCircle}>
                        <Icon name="water-percent" size={18} color="#fff" />
                      </View>
                      <View>
                        <Text style={styles.statValue}>68%</Text>
                        <Text style={styles.statLabel}>Humidity</Text>
                      </View>
                    </View>
                  </View>

                  {/* Fishing Conditions Banner */}
                  <View style={styles.conditionsBanner}>
                    <Icon name="check-circle" size={18} color={Colors.success} />
                    <Text style={styles.conditionsText}>{t('home.perfectConditions')}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.weatherLoading}>
                  <Icon name="weather-cloudy" size={60} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.loadingText}>{t('home.loading')}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.primaryAction}
              onPress={() => router.push('/(tabs)/map')}
            >
              <LinearGradient
                colors={[Colors.primary, '#1D5A5B']}
                style={styles.primaryActionGradient}
              >
                <View style={styles.actionIconLarge}>
                  <Icon name="navigation" size={28} color="#fff" />
                </View>
                <View>
                  <Text style={styles.primaryActionTitle}>{t('home.startFishing')}</Text>
                  <Text style={styles.primaryActionSubtitle}>{t('home.findBestSpots')}</Text>
                </View>
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => router.push('/(tabs)/catch-log')}
              >
                <View style={[styles.secondaryIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Icon name="fish" size={22} color={Colors.success} />
                </View>
                <Text style={styles.secondaryActionText}>{t('home.logCatch')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => router.push('/(tabs)/analytics')}
              >
                <View style={[styles.secondaryIconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Icon name="chart-line" size={22} color={Colors.accent} />
                </View>
                <Text style={styles.secondaryActionText}>{t('home.analytics')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => router.push('/(tabs)/community')}
              >
                <View style={[styles.secondaryIconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Icon name="account-group" size={22} color="#9333EA" />
                </View>
                <Text style={styles.secondaryActionText}>{t('home.community')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Popular Fishing Spots */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.popularSpots')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.seeAllButton}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spotsScroll}
          >
            {zones.map((zone, index) => (
              <TouchableOpacity 
                key={zone.id}
                style={[styles.spotCard, index === 0 && styles.spotCardFirst]}
                onPress={() => router.push({
                  pathname: '/(tabs)/map',
                  params: { selectedZone: JSON.stringify(zone) }
                })}
              >
                <ImageBackground
                  source={{ uri: zone.image }}
                  style={styles.spotImage}
                  imageStyle={styles.spotImageStyle}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.spotOverlay}
                  >
                    {/* Safety Badge */}
                    <View style={[styles.safetyBadge, { backgroundColor: getSafetyColor(zone.safety) }]}>
                      <Text style={styles.safetyBadgeText}>{zone.safety}</Text>
                    </View>

                    {/* Spot Info */}
                    <View style={styles.spotInfo}>
                      <Text style={styles.spotName}>{zone.name}</Text>
                      <View style={styles.spotMeta}>
                        <View style={styles.spotMetaItem}>
                          <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.spotMetaText}>{zone.distance}</Text>
                        </View>
                        <View style={styles.spotMetaItem}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={styles.spotMetaText}>{zone.rating}</Text>
                        </View>
                      </View>

                      {/* Fish Types */}
                      <View style={styles.fishTypes}>
                        {zone.fishTypes.map((fish, i) => (
                          <View key={i} style={styles.fishTag}>
                            <Text style={styles.fishTagText}>{fish}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Active Alerts */}
          {alerts.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.activeAlerts')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')}>
                  <Text style={styles.seeAllButton}>{t('home.viewAll')}</Text>
                </TouchableOpacity>
              </View>

              {alerts.slice(0, 2).map(alert => (
                <TouchableOpacity 
                  key={alert.id}
                  style={[styles.alertCard, 
                    { backgroundColor: alert.priority === 'high' ? '#FEF2F2' : '#FEF3C7' }
                  ]}
                  onPress={() => router.push('/(tabs)/alerts')}
                >
                  <View style={[styles.alertIconCircle, 
                    { backgroundColor: alert.priority === 'high' ? Colors.error : Colors.warning }
                  ]}>
                    <Icon 
                      name={alert.type === 'weather' ? 'weather-windy' : 'alert-circle'} 
                      size={18} 
                      color="#fff" 
                    />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>
                      {alert.type === 'weather' ? t('home.weatherAlert') : t('home.regulationUpdate')}
                    </Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Hero Section
  heroSection: {
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  latLongText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Welcome
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '400',
  },
  userName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },

  // Weather Card
  weatherCard: {
    marginHorizontal: 20,
  },
  weatherGlass: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  weatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  temperatureSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  temperatureValue: {
    fontSize: 72,
    fontWeight: '200',
    color: '#fff',
    lineHeight: 80,
  },
  temperatureUnit: {
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
  },
  weatherIconSection: {
    alignItems: 'center',
  },
  conditionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  weatherStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conditionsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 161, 105, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  conditionsText: {
    color: '#86EFAC',
    fontSize: 14,
    fontWeight: '500',
  },
  weatherLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 12,
  },

  // Content Section
  contentSection: {
    marginTop: -15,
    paddingTop: 30,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // Quick Actions
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  primaryAction: {
    marginBottom: 16,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
  actionIconLarge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  primaryActionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    ...Shadows.md,
  },
  secondaryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryActionText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAllButton: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Spot Cards
  spotsScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingBottom: 4,
  },
  spotCard: {
    width: width * 0.7,
    height: 220,
    marginRight: 16,
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  spotCardFirst: {
    marginLeft: 0,
  },
  spotImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  spotImageStyle: {
    borderRadius: 24,
  },
  spotOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  safetyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  safetyBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  spotInfo: {
    gap: 8,
  },
  spotName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  spotMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  spotMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spotMetaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  fishTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  fishTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fishTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },

  // Alert Cards
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  alertIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertMessage: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
