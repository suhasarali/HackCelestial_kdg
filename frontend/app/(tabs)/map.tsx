import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

// --- HEATMAP CONSTANTS ---
const BACKEND_API_URL = 'https://VolcanicBat64-fish3.hf.space/predict';

const HEATMAP_ZONES = [
  { id: 'zone-1', radius: 2000, offset: { lat: 0.01, lng: 0.01 } },
  { id: 'zone-2', radius: 1500, offset: { lat: -0.008, lng: 0.012 } },
  { id: 'zone-3', radius: 1800, offset: { lat: 0.015, lng: -0.01 } },
  { id: 'zone-4', radius: 1200, offset: { lat: -0.012, lng: -0.008 } },
];

interface HeatmapZone {
  id: string;
  center: { latitude: number; longitude: number };
  radius: number;
  probability: number;
}

const getHeatmapColor = (p: number) => {
  if (p < 20) return 'rgba(76, 175, 80, 0.3)';
  if (p < 40) return 'rgba(255, 235, 59, 0.4)';
  if (p < 60) return 'rgba(255, 152, 0, 0.5)';
  if (p < 80) return 'rgba(255, 87, 34, 0.6)';
  return 'rgba(244, 67, 54, 0.7)';
};
const getStrokeColor = (p: number) => {
  if (p < 20) return 'rgba(76, 175, 80, 0.8)';
  if (p < 40) return 'rgba(255, 235, 59, 0.8)';
  if (p < 60) return 'rgba(255, 152, 0, 0.8)';
  if (p < 80) return 'rgba(255, 87, 34, 0.8)';
  return 'rgba(244, 67, 54, 0.8)';
};

// --- API CALL FUNCTIONS ---
const fetchFishProbability = async (lat: number, lon: number) => {
  try {
    const res = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lon }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.status === 'success' ? data.fish_probability : null;
  } catch (e) {
    console.error('Fish probability error:', e);
    return null;
  }
};

const fetchFishName = async (lat: number, lon: number) => {
  try {
    const res = await fetch('https://VolcanicBat64-fish-name-predict.hf.space/predict_name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lon }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.status === 'success' ? data.predicted_fish_name : null;
  } catch (e) {
    console.error('Fish name error:', e);
    return null;
  }
};

// --- Gemini AI call ---
const fetchBestFishingPractices = async (fish: string, lat: number, lon: number) => {
  try {
    const prompt = `You are an expert fisheries advisor in India.
Suggest the best fishing practices, gear, seasons, and sustainability guidelines
for catching ${fish} found near coordinates latitude ${lat}, longitude ${lon}.
Keep answer short, practical, and easy for fishermen to understand.`;

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDXfPvzApUIJZHi3WP5Af68R2p2DYRrZxc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No advice found.';
  } catch (e) {
    console.error('Gemini error:', e);
    return 'Could not fetch best practices at this time.';
  }
};

export default function MapScreen() {
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [heatmapZones, setHeatmapZones] = useState<HeatmapZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<HeatmapZone | null>(null);
  const [showProbabilityModal, setShowProbabilityModal] = useState(false);
  const [mostProbableFish, setMostProbableFish] = useState<string | null>(null);

  // --- Gemini Modal States ---
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiAdvice, setGeminiAdvice] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  const generateHeatmap = async (lat: number, lon: number) => {
    const newZones: HeatmapZone[] = [];
    for (const z of HEATMAP_ZONES) {
      const p = await fetchFishProbability(lat + z.offset.lat, lon + z.offset.lng);
      if (p !== null) {
        newZones.push({ id: z.id, center: { latitude: lat + z.offset.lat, longitude: lon + z.offset.lng }, radius: z.radius, probability: p });
      }
    }
    setHeatmapZones(newZones);
  };

  const handleGeminiPress = async () => {
    if (!mostProbableFish || !userLocation) {
      Alert.alert('No Fish Data', 'Cannot fetch best practices without fish prediction.');
      return;
    }
    setShowGeminiModal(true);
    setIsGeminiLoading(true);
    const advice = await fetchBestFishingPractices(mostProbableFish, userLocation.latitude, userLocation.longitude);
    setGeminiAdvice(advice);
    setIsGeminiLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        setIsLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const newLoc = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setUserLocation(newLoc);
        const fishName = await fetchFishName(loc.coords.latitude, loc.coords.longitude);
        setMostProbableFish(fishName);
        generateHeatmap(loc.coords.latitude, loc.coords.longitude);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>{t('map.fetchingLocation')}</Text>
        </View>
      ) : (
        <>
          {/* --- Fish Card --- */}
          <View style={styles.fishNameContainer}>
            <View style={styles.fishNameCard}>
              <View style={styles.fishNameHeader}>
                <Ionicons name="fish" size={20} color="#007BFF" />
                <Text style={styles.fishNameTitle}>Most Probable Fish</Text>
              </View>
              {mostProbableFish ? (
                <Text style={styles.fishNameText}>{mostProbableFish}</Text>
              ) : (
                <Text style={styles.fishNameError}>Unable to predict fish</Text>
              )}
            </View>
          </View>

          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={userLocation}
            showsUserLocation
          >
            {heatmapZones.map(z => (
              <Circle key={z.id} center={z.center} radius={z.radius} fillColor={getHeatmapColor(z.probability)} strokeColor={getStrokeColor(z.probability)} strokeWidth={3} />
            ))}
          </MapView>

          {/* Floating Gemini Button */}
          <TouchableOpacity style={styles.geminiButton} onPress={handleGeminiPress}>
            <Ionicons name="help-circle" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Gemini Modal */}
      <Modal visible={showGeminiModal} animationType="slide" transparent onRequestClose={() => setShowGeminiModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Best Fishing Practices</Text>
            {isGeminiLoading ? (
              <ActivityIndicator size="large" color="#007BFF" />
            ) : (
              <ScrollView>
                <Text style={styles.geminiText}>{geminiAdvice}</Text>
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowGeminiModal(false)}>
              <Text style={{ color: '#007BFF', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },
  fishNameContainer: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 10 },
  fishNameCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#007BFF' },
  fishNameHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  fishNameTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  fishNameText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  fishNameError: { fontSize: 14, color: '#e74c3c', textAlign: 'center' },
  geminiButton: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    backgroundColor: '#007BFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  geminiText: { fontSize: 15, lineHeight: 20, color: '#2c3e50' },
  closeButton: { marginTop: 15, alignSelf: 'center' },
});
