import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Alert, ActivityIndicator, Modal, ScrollView, TextInput, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/design';

// --- CONSTANTS ---
const BACKEND_API_URL = 'https://VolcanicBat64-fish3.hf.space/predict';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
console.log("DEBUG: GEMINI_API_KEY loaded:", GEMINI_API_KEY ? "YES" : "NO");
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const BOAT_SPEED_KNOTS = 15; 
const FUEL_BURN_RATE = 0.5;
const FUEL_PRICE = 105;

const HEATMAP_ZONES = [
  { id: 'zone-1', radius: 2000, offset: { lat: 0.01, lng: 0.01 } },
  { id: 'zone-2', radius: 1500, offset: { lat: -0.008, lng: 0.012 } },
  { id: 'zone-3', radius: 1800, offset: { lat: 0.015, lng: -0.01 } },
  { id: 'zone-4', radius: 1200, offset: { lat: -0.012, lng: -0.008 } },
];

const { width, height } = Dimensions.get('window');

// --- NAVIGATION HELPERS ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateBearing = (startLat: number, startLng: number, destLat: number, destLng: number) => {
  const startLatRad = startLat * Math.PI / 180;
  const startLngRad = startLng * Math.PI / 180;
  const destLatRad = destLat * Math.PI / 180;
  const destLngRad = destLng * Math.PI / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
          Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
  const brng = Math.atan2(y, x);
  return ((brng * 180 / Math.PI) + 360) % 360; 
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  
  const [userLocation, setUserLocation] = useState<any>(null);
  const [heatmapZones, setHeatmapZones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [showProbabilityModal, setShowProbabilityModal] = useState(false);
  const [mostProbableFish, setMostProbableFish] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiAdvice, setGeminiAdvice] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  const [activeTarget, setActiveTarget] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [heading, setHeading] = useState(0);

  // --- API CALLS ---
  const fetchFishProbability = async (lat: number, lon: number) => {
    try {
      const res = await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lon }),
      });
      const data = await res.json();
      return data.status === "success" ? data.fish_probability : null;
    } catch (e) { return null; }
  };

  const fetchFishName = async (lat: number, lon: number) => {
    try {
      const res = await fetch('https://VolcanicBat64-fish-name-predict.hf.space/predict_name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lon }),
      });
      const data = await res.json();
      return data.status === "success" ? data.predicted_fish_name : null;
    } catch (e) { return null; }
  };

  const fetchBestFishingPractices = async (fish: string, lat: number, lon: number) => {
    try {
      const prompt = `You are an expert fisheries advisor in India. Suggest practices for ${fish} near ${lat}, ${lon}. Keep it short and practical.`;
      const res = await fetch(`${GEMINI_API_BASE_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      let rawText = data.candidates[0].content.parts[0].text.trim();
      return rawText.replace(/```(?:[a-z]+)?\n([\s\S]*?)\n```/g, '$1').trim();
    } catch (e) { return "Error fetching advice."; }
  };

  // --- ACTIONS ---
  const handleSearch = () => {
    if (searchTerm) {
      setMostProbableFish(searchTerm);
      Alert.alert("Target Locked", `Tracking ${searchTerm} in this region.`);
    }
  };

  const startNavigation = async () => {
    setActiveTarget(selectedZone);
    setIsNavigating(true);
    setShowProbabilityModal(false);

    const initialTripData = {
      startTime: new Date().toISOString(),
      startLat: userLocation.latitude,
      startLon: userLocation.longitude,
      targetZone: selectedZone.id,
      targetSpecies: mostProbableFish || "General Catch",
      estimatedRevenue: selectedZone.probability * 50,
      estimatedFuel: selectedZone.fuelReq
    };
    
    await AsyncStorage.setItem('active_trip', JSON.stringify(initialTripData));
    mapRef.current?.animateToRegion({ ...selectedZone.center, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 1000);
  };

  const generateHeatmap = async (centerLat: number, centerLon: number) => {
    const zones = [];
    for (const config of HEATMAP_ZONES) {
      const lat = centerLat + config.offset.lat;
      const lng = centerLon + config.offset.lng;
      const prob = await fetchFishProbability(lat, lng);
      const dist = calculateDistance(centerLat, centerLon, lat, lng);
      const fuel = dist * FUEL_BURN_RATE;

      if (prob !== null) {
        zones.push({
          id: config.id,
          center: { latitude: lat, longitude: lng },
          radius: config.radius,
          probability: prob,
          distance: dist,
          fuelReq: fuel,
        });
      }
    }
    setHeatmapZones(zones.sort((a, b) => b.probability - a.probability));
    setIsLoading(false);
  };

  // --- SENSORS EFFECT ---
  useEffect(() => {
    let locationSubscription: any;

    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (location) => {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      );
    };

    Magnetometer.setUpdateInterval(100);
    const sensorSubscription = Magnetometer.addListener((data) => {
      let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      setHeading(Math.round(angle));
    });

    startTracking();
    return () => {
      locationSubscription?.remove();
      sensorSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      const loc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setUserLocation(loc);
      const name = await fetchFishName(loc.latitude, loc.longitude);
      setMostProbableFish(name);
      generateHeatmap(loc.latitude, loc.longitude);
    })();
  }, []);

  const handleGeminiPress = async () => {
    if (!mostProbableFish || !userLocation) return;
    setShowGeminiModal(true);
    setIsGeminiLoading(true);
    const advice = await fetchBestFishingPractices(mostProbableFish, userLocation.latitude, userLocation.longitude);
    setGeminiAdvice(advice);
    setIsGeminiLoading(false);
  };

  const getArrowRotation = () => {
    if (!userLocation || !activeTarget) return 0;
    const bearing = calculateBearing(
      userLocation.latitude, userLocation.longitude,
      activeTarget.center.latitude, activeTarget.center.longitude
    );
    return Math.round(bearing - heading);
  };

  const getHeatmapColor = (p: number) => p > 70 ? 'rgba(56, 161, 105, 0.4)' : 'rgba(44, 122, 123, 0.4)';
  const getStrokeColor = (p: number) => p > 70 ? Colors.success : Colors.primary;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#0D4F4F', '#1A8585']}
            style={styles.loadingGradient}
          >
            <View style={styles.loadingContent}>
              <View style={styles.loadingIconCircle}>
                <Icon name="radar" size={40} color="#fff" />
              </View>
              <Text style={styles.loadingTitle}>Scanning Ocean</Text>
              <Text style={styles.loadingSubtitle}>Finding the best fishing spots...</Text>
              <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
            </View>
          </LinearGradient>
        </View>
      ) : (
        <>
          {/* Map */}
          <MapView ref={mapRef} style={styles.map} initialRegion={userLocation} showsUserLocation>
            {heatmapZones.map(zone => (
              <React.Fragment key={zone.id}>
                <Circle
                  center={zone.center}
                  radius={zone.radius}
                  fillColor={getHeatmapColor(zone.probability)}
                  strokeColor={getStrokeColor(zone.probability)}
                  strokeWidth={2}
                />
                <Marker coordinate={zone.center} onPress={() => { setSelectedZone(zone); setShowProbabilityModal(true); }}>
                  <View style={[styles.zoneMarker, { backgroundColor: getStrokeColor(zone.probability) }]}>
                    <Text style={styles.zoneMarkerText}>{Math.round(zone.probability)}%</Text>
                  </View>
                </Marker>
              </React.Fragment>
            ))}

            {isNavigating && activeTarget && userLocation && (
              <Polyline
                coordinates={[
                  { latitude: userLocation.latitude, longitude: userLocation.longitude },
                  { latitude: activeTarget.center.latitude, longitude: activeTarget.center.longitude }
                ]}
                strokeColor={Colors.primary}
                strokeWidth={3}
                lineDashPattern={[10, 5]}
              />
            )}
          </MapView>

          {/* Top Search Area */}
          <SafeAreaView style={styles.topOverlay} edges={['top']}>
            

            {/* Fish Target Card */}
            {mostProbableFish && (
              <View style={styles.targetCard}>
                <LinearGradient
                  colors={[Colors.primary, '#1D5A5B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.targetCardGradient}
                >
                  <View style={styles.targetIconCircle}>
                    <Icon name="fish" size={24} color="#fff" />
                  </View>
                  <View style={styles.targetInfo}>
                    <Text style={styles.targetLabel}>Target Species</Text>
                    <Text style={styles.targetName}>{mostProbableFish}</Text>
                  </View>
                  <TouchableOpacity style={styles.targetChangeBtn}>
                    <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </SafeAreaView>

          {/* Navigation Overlay */}
          {isNavigating && activeTarget && userLocation && (
            <View style={styles.navOverlay}>
              <LinearGradient
                colors={[Colors.primary, '#1D5A5B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.navCard}
              >
                <View style={styles.navLeft}>
                  <View style={styles.navCompass}>
                    <Ionicons 
                      name="navigate" 
                      size={32} 
                      color="#fff" 
                      style={{ transform: [{ rotate: `${getArrowRotation()}deg` }] }} 
                    />
                  </View>
                  <View>
                    <Text style={styles.navDistance}>
                      {calculateDistance(userLocation.latitude, userLocation.longitude, activeTarget.center.latitude, activeTarget.center.longitude).toFixed(1)} km
                    </Text>
                    <Text style={styles.navEta}>
                      ETA: {Math.round((calculateDistance(userLocation.latitude, userLocation.longitude, activeTarget.center.latitude, activeTarget.center.longitude) / (BOAT_SPEED_KNOTS * 1.85)) * 60)} min
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.endNavBtn} onPress={() => setIsNavigating(false)}>
                  <Ionicons name="close" size={24} color={Colors.error} />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Floating Action Buttons */}
          <View style={styles.fabContainer}>
            <TouchableOpacity style={styles.fabAI} onPress={handleGeminiPress}>
              <LinearGradient colors={['#9333EA', '#7C3AED']} style={styles.fabGradient}>
                <Icon name="robot" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.fabLocate} onPress={() => mapRef.current?.animateToRegion(userLocation)}>
              <View style={styles.fabSolid}>
                <Ionicons name="locate" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Zone List Preview */}
          <View style={styles.zonePreview}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zonePreviewScroll}>
              {heatmapZones.slice(0, 3).map((zone, index) => (
                <TouchableOpacity 
                  key={zone.id}
                  style={[styles.zonePreviewCard, index === 0 && styles.zonePreviewCardTop]}
                  onPress={() => { setSelectedZone(zone); setShowProbabilityModal(true); }}
                >
                  <View style={[styles.zonePreviewBadge, { backgroundColor: index === 0 ? Colors.success : Colors.primary }]}>
                    <Text style={styles.zonePreviewBadgeText}>{Math.round(zone.probability)}%</Text>
                  </View>
                  <View>
                    <Text style={styles.zonePreviewTitle}>Zone {index + 1}</Text>
                    <Text style={styles.zonePreviewMeta}>{zone.distance.toFixed(1)} km away</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {/* Zone Modal */}
      <Modal visible={showProbabilityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            {selectedZone && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalRankBadge, { backgroundColor: heatmapZones[0]?.id === selectedZone.id ? '#FEF3C7' : Colors.surfaceVariant }]}>
                    <Text style={styles.modalRankText}>
                      {heatmapZones[0]?.id === selectedZone.id ? '🏆 Best Spot' : 'Fishing Zone'}
                    </Text>
                  </View>
                </View>

                <View style={styles.probCircle}>
                  <Text style={styles.probValue}>{Math.round(selectedZone.probability)}</Text>
                  <Text style={styles.probUnit}>%</Text>
                </View>
                <Text style={styles.probLabel}>Catch Probability</Text>

                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Ionicons name="navigate-outline" size={24} color={Colors.primary} />
                    <Text style={styles.statCardValue}>{selectedZone.distance.toFixed(1)} km</Text>
                    <Text style={styles.statCardLabel}>Distance</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Icon name="gas-station" size={24} color={Colors.warning} />
                    <Text style={styles.statCardValue}>{selectedZone.fuelReq.toFixed(1)} L</Text>
                    <Text style={styles.statCardLabel}>Fuel Needed</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Icon name="cash" size={24} color={Colors.success} />
                    <Text style={styles.statCardValue}>₹{Math.round(selectedZone.fuelReq * FUEL_PRICE)}</Text>
                    <Text style={styles.statCardLabel}>Est. Cost</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.startNavBtn} onPress={startNavigation}>
                  <LinearGradient colors={[Colors.success, '#2F855A']} style={styles.startNavBtnGradient}>
                    <Ionicons name="navigate" size={22} color="#fff" />
                    <Text style={styles.startNavBtnText}>Start Navigation</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowProbabilityModal(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* AI Advice Modal */}
      <Modal visible={showGeminiModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '75%' }]}>
            <View style={styles.modalHandle} />
            
            <View style={styles.aiHeader}>
              <LinearGradient colors={['#9333EA', '#7C3AED']} style={styles.aiIconCircle}>
                <Icon name="robot" size={24} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={styles.aiTitle}>AI Fishing Tips</Text>
                <Text style={styles.aiSubtitle}>Powered by Gemini</Text>
              </View>
            </View>
            
            <ScrollView style={styles.aiAdviceScroll} showsVerticalScrollIndicator={false}>
              {isGeminiLoading ? (
                <View style={styles.aiLoading}>
                  <ActivityIndicator color="#9333EA" size="large" />
                  <Text style={styles.aiLoadingText}>Analyzing conditions...</Text>
                </View>
              ) : (
                <Text style={styles.aiAdviceText}>{geminiAdvice}</Text>
              )}
            </ScrollView>
            
            <TouchableOpacity style={styles.aiCloseBtn} onPress={() => setShowGeminiModal(false)}>
              <Text style={styles.aiCloseBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  map: { 
    width: '100%', 
    height: '100%' 
  },
  
  // Loading
  loadingContainer: { 
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },

  // Top Overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    ...Shadows.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  targetCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.md,
  },
  targetCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  targetIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetInfo: {
    flex: 1,
  },
  targetLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  targetChangeBtn: {
    padding: 8,
  },

  // Zone Markers
  zoneMarker: { 
    width: 52, 
    height: 52, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: '#fff',
    ...Shadows.lg,
  },
  zoneMarkerText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '700',
  },

  // FABs
  fabContainer: { 
    position: 'absolute', 
    right: 20, 
    bottom: 280,
    gap: 12,
  },
  fabAI: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  fabLocate: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabSolid: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Navigation Overlay
  navOverlay: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    ...Shadows.lg,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navCompass: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navDistance: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  navEta: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  endNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Zone Preview
  zonePreview: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
  },
  zonePreviewScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  zonePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    ...Shadows.md,
    marginRight: 12,
  },
  zonePreviewCardTop: {
    borderWidth: 2,
    borderColor: Colors.success,
  },
  zonePreviewBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zonePreviewBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  zonePreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  zonePreviewMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Modal
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  modalContent: { 
    backgroundColor: Colors.surface, 
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.divider,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalRankBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  probCircle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 8,
  },
  probValue: {
    fontSize: 64,
    fontWeight: '200',
    color: Colors.primary,
  },
  probUnit: {
    fontSize: 28,
    fontWeight: '400',
    color: Colors.primary,
    marginBottom: 12,
    marginLeft: 4,
  },
  probLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  statCardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  startNavBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  startNavBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  startNavBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 12,
  },
  cancelBtnText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },

  // AI Modal
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  aiIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  aiSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  aiAdviceScroll: {
    maxHeight: 280,
    marginBottom: 20,
  },
  aiLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  aiLoadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },
  aiAdviceText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  aiCloseBtn: {
    backgroundColor: '#9333EA',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  aiCloseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});