import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Alert, ActivityIndicator, Modal, ScrollView, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added for Business Brain
import { Ionicons } from '@expo/vector-icons';

// --- CONSTANTS ---
const BACKEND_API_URL = 'https://VolcanicBat64-fish3.hf.space/predict';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const BOAT_SPEED_KNOTS = 15; 
const FUEL_BURN_RATE = 0.5; // Liters per KM
const FUEL_PRICE = 105; // INR per Liter

const HEATMAP_ZONES = [
  { id: 'zone-1', radius: 2000, offset: { lat: 0.01, lng: 0.01 } },
  { id: 'zone-2', radius: 1500, offset: { lat: -0.008, lng: 0.012 } },
  { id: 'zone-3', radius: 1800, offset: { lat: 0.015, lng: -0.01 } },
  { id: 'zone-4', radius: 1200, offset: { lat: -0.012, lng: -0.008 } },
];

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

  // --- MAGNETOMETER STATE ---
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
      const cleanedText = rawText.replace(/```(?:[a-z]+)?\n([\s\S]*?)\n```/g, '$1').trim();
      return cleanedText;
    } catch (e) { return "Error fetching advice."; }
  };

  // --- ACTIONS ---
  const handleSearch = () => {
    if (searchTerm) {
      setMostProbableFish(searchTerm);
      Alert.alert("Target Locked", `Tracking ${searchTerm} in this region.`);
    }
  };

  // ✅ UPDATED ACTION: START NAVIGATION & LOG TRIP AUTOMATICALLY
  const startNavigation = async () => {
    setActiveTarget(selectedZone);
    setIsNavigating(true);
    setShowProbabilityModal(false);

    // Business Brain: Automated Trip Logging
    const initialTripData = {
      startTime: new Date().toISOString(),
      startLat: userLocation.latitude,
      startLon: userLocation.longitude,
      targetZone: selectedZone.id,
      targetSpecies: mostProbableFish || "General Catch",
      estimatedRevenue: selectedZone.probability * 50, // Mock calculation
      estimatedFuel: selectedZone.fuelReq
    };
    
    await AsyncStorage.setItem('active_trip', JSON.stringify(initialTripData));

    mapRef.current?.animateToRegion({
      ...selectedZone.center,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    }, 1000);
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
          const newLoc = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setUserLocation(newLoc);
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

  const getHeatmapColor = (p: number) => p > 70 ? 'rgba(244, 67, 54, 0.4)' : 'rgba(76, 175, 80, 0.4)';
  const getStrokeColor = (p: number) => p > 70 ? '#f44336' : '#4caf50';

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Calibrating Ocean Data...</Text>
        </View>
      ) : (
        <>
          <View style={styles.searchBox}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search Fish Type..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <TouchableOpacity onPress={handleSearch}>
              <Ionicons name="search" size={24} color="#007BFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.fishNameContainer}>
            <View style={styles.fishNameCard}>
              <View style={styles.fishNameHeader}>
                <Ionicons name="fish" size={20} color="#007BFF" />
                <Text style={styles.fishNameTitle}>Current Target</Text>
              </View>
              <Text style={styles.fishNameText}>{mostProbableFish || "Scanning..."}</Text>
            </View>
          </View>

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
                strokeColor="#007BFF"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>

          {isNavigating && activeTarget && userLocation && (
            <View style={styles.navOverlay}>
              <View>
                <Text style={styles.navText}>
                  ETA: {Math.round((calculateDistance(userLocation.latitude, userLocation.longitude, activeTarget.center.latitude, activeTarget.center.longitude) / (BOAT_SPEED_KNOTS * 1.85)) * 60)}m
                </Text>
                <Text style={styles.navSubText}>
                  {calculateDistance(userLocation.latitude, userLocation.longitude, activeTarget.center.latitude, activeTarget.center.longitude).toFixed(2)} km
                </Text>
              </View>

              <View style={styles.steeringContainer}>
                 <Ionicons 
                    name="navigate" 
                    size={28} 
                    color="#fff" 
                    style={{ transform: [{ rotate: `${getArrowRotation()}deg` }] }} 
                 />
                 <Text style={styles.steeringText}>{Math.round(getArrowRotation())}°</Text>
              </View>

              <TouchableOpacity style={styles.stopBtn} onPress={() => setIsNavigating(false)}>
                <Text style={styles.stopText}>END</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.geminiButton} onPress={handleGeminiPress}>
              <Ionicons name="sparkles" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={() => mapRef.current?.animateToRegion(userLocation)}>
              <Ionicons name="locate" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal visible={showProbabilityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Zone Intelligence</Text>
            {selectedZone && (
              <View style={styles.probabilityInfo}>
                <Text style={styles.rankBadge}>{heatmapZones[0].id === selectedZone.id ? "🏆 TOP RANKED ZONE" : "Fishing Zone"}</Text>
                <Text style={styles.probabilityValue}>{Math.round(selectedZone.probability)}% Catch Rate</Text>
                <View style={styles.navStatsRow}>
                  <View style={styles.statBox}><Ionicons name="speedometer-outline" size={20} color="#666" /><Text>{selectedZone.distance.toFixed(1)} km</Text></View>
                  <View style={styles.statBox}><Ionicons name="water-outline" size={20} color="#666" /><Text>{selectedZone.fuelReq.toFixed(1)} L</Text></View>
                  <View style={styles.statBox}><Ionicons name="cash-outline" size={20} color="#666" /><Text>₹{Math.round(selectedZone.fuelReq * FUEL_PRICE)}</Text></View>
                </View>
                <TouchableOpacity style={styles.startNavBtn} onPress={startNavigation}><Text style={styles.startNavText}>Start Boat Navigation</Text></TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => setShowProbabilityModal(false)} style={styles.closeBtnSmall}><Text>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showGeminiModal} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <Text style={styles.modalTitle}>Best Practices</Text>
              <ScrollView>{isGeminiLoading ? <ActivityIndicator /> : <Text>{geminiAdvice}</Text>}</ScrollView>
              <TouchableOpacity style={styles.closeButtonLarge} onPress={() => setShowGeminiModal(false)}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity>
           </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#34495e' },
  searchBox: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 1001, backgroundColor: '#fff', borderRadius: 25, flexDirection: 'row', paddingHorizontal: 20, alignItems: 'center', height: 50, elevation: 5 },
  searchInput: { flex: 1 },
  fishNameContainer: { position: 'absolute', top: 110, left: 20, right: 20, zIndex: 1000 },
  fishNameCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 4, borderLeftWidth: 4, borderLeftColor: '#007BFF' },
  fishNameHeader: { flexDirection: 'row', alignItems: 'center' },
  fishNameTitle: { fontSize: 14, color: '#666', marginLeft: 8 },
  fishNameText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center' },
  zoneMarker: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  zoneMarkerText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  zoomControls: { position: 'absolute', right: 20, bottom: 40 },
  geminiButton: { backgroundColor: '#8e44ad', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 },
  zoomButton: { backgroundColor: '#007BFF', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  navOverlay: { position: 'absolute', bottom: 120, left: 20, right: 20, backgroundColor: '#007BFF', borderRadius: 15, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  navSubText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  steeringContainer: { alignItems: 'center', justifyContent: 'center' },
  steeringText: { color: '#fff', fontWeight: 'bold', marginTop: 2 },
  stopBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  stopText: { color: '#ff3b30', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '85%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  probabilityValue: { fontSize: 28, fontWeight: 'bold', color: '#007BFF', textAlign: 'center', marginVertical: 10 },
  navStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  statBox: { alignItems: 'center' },
  probabilityInfo: { marginVertical: 10 },
  rankBadge: { alignSelf: 'center', backgroundColor: '#FFD700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontSize: 12, fontWeight: 'bold' },
  startNavBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  startNavText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeBtnSmall: { alignSelf: 'center', marginTop: 15 },
  closeButtonLarge: { backgroundColor: '#007BFF', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontWeight: 'bold' }
});