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
import { Ionicons } from '@expo/vector-icons';

// --- HEATMAP CONSTANTS ---
// Backend server URL - update this to match your actual server
const BACKEND_API_URL = 'https://VolcanicBat64-fish3.hf.space/predict';

// Heatmap zone configuration
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
  probability: number; // 0 to 100
}

// --- GEMINI API SETUP ---
// TODO: Move this to environment variables for security
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyAW9z9aKdCi3ZqcgyHJs5BDlVc3w9nJGQc"; 
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// --- Gemini AI call ---
const fetchBestFishingPractices = async (fish: string, lat: number, lon: number) => {
try {
const prompt = `You are an expert fisheries advisor in India.
Suggest the best fishing practices, gear, seasons, and sustainability guidelines
for catching ${fish} found near coordinates latitude ${lat}, longitude ${lon}.
Keep answer short, practical, and easy for fishermen to understand.`;

const res = await fetch(`${GEMINI_API_BASE_URL}?key=${GEMINI_API_KEY}`, {
 method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
 contents: [{ parts: [{ text: prompt }] }],
 }),
});

if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
const data = await res.json();
console.log('Gemini response data:', data);
return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No advice found.';
 } catch (e) {
console.error('Gemini error:', e);
return 'Could not fetch best practices at this time.';
 }
};

// Helper function to convert a 0-100 probability to a heatmap color with transparency
const getHeatmapColor = (probability: number): string => {
  const p = Math.max(0, Math.min(100, probability));
  
  if (p < 20) {
    return 'rgba(76, 175, 80, 0.3)'; // Green for low probability
  } else if (p < 40) {
    return 'rgba(255, 235, 59, 0.4)'; // Yellow for medium-low probability
  } else if (p < 60) {
    return 'rgba(255, 152, 0, 0.5)'; // Orange for medium probability
  } else if (p < 80) {
    return 'rgba(255, 87, 34, 0.6)'; // Deep orange for high probability
  } else {
    return 'rgba(244, 67, 54, 0.7)'; // Red for very high probability
  }
};

// Helper function to get stroke color for the heatmap zones
const getStrokeColor = (probability: number): string => {
  const p = Math.max(0, Math.min(100, probability));
  
  if (p < 20) {
    return 'rgba(76, 175, 80, 0.8)'; // Green stroke
  } else if (p < 40) {
    return 'rgba(255, 235, 59, 0.8)'; // Yellow stroke
  } else if (p < 60) {
    return 'rgba(255, 152, 0, 0.8)'; // Orange stroke
  } else if (p < 80) {
    return 'rgba(255, 87, 34, 0.8)'; // Deep orange stroke
  } else {
    return 'rgba(244, 67, 54, 0.8)'; // Red stroke
  }
};

// --- API CALL FUNCTIONS ---
const fetchFishProbability = async (latitude: number, longitude: number): Promise<number | null> => {
  try {
      const response = await fetch(BACKEND_API_URL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              latitude: latitude,
              longitude: longitude,
          }),
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error fetching fish probability: HTTP status ${response.status}`, errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.status !== "success") {
        console.error('Error fetching fish probability: Backend returned an unsuccessful status', responseData);
        throw new Error('Backend returned an unsuccessful status');
      }

      console.log('Successfully fetched fish probability:', responseData);
      return responseData.fish_probability;

  } catch (error) {
      console.error('API call for fish probability failed:', error);
      return null;
  }
};

const fetchFishName = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
      const response = await fetch('https://VolcanicBat64-fish-name-predict.hf.space/predict_name', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              latitude: latitude,
              longitude: longitude,
          }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error fetching fish name: HTTP status ${response.status}`, errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      if (responseData.status !== "success") {
        console.error('Error fetching fish name: Backend returned an unsuccessful status', responseData);
        throw new Error('Backend returned an unsuccessful status');
      }

      console.log('Successfully fetched fish name:', responseData);
      // FIX: Correctly access the "predicted_fish_name" key from the API response
      return responseData.predicted_fish_name || null;

  } catch (error) {
      console.error('API call for fish name failed:', error);
      return null;
  }
};

export default function MapScreen() {
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

  // Gemini Handler
  const handleGeminiPress = async () => {
    if (!mostProbableFish || !userLocation) {
      Alert.alert('No Fish Data', 'Cannot fetch best practices without a predicted fish.');
      return;
    }
    setShowGeminiModal(true);
    setIsGeminiLoading(true);
    const advice = await fetchBestFishingPractices(mostProbableFish, userLocation.latitude, userLocation.longitude);
    setGeminiAdvice(advice);
    setIsGeminiLoading(false);
  };


  // Function to generate the heatmap zones
  const generateHeatmap = async (centerLat: number, centerLon: number) => {
    const newHeatmapZones: HeatmapZone[] = [];

    // Create 4 large heatmap zones around the user location
    for (const zoneConfig of HEATMAP_ZONES) {
      // FIX: Correctly calculate the zone coordinates
      const zoneLat = centerLat + zoneConfig.offset.lat;
      const zoneLng = centerLon + zoneConfig.offset.lng;
      
      // Get probability for the center of this zone
      const probability = await fetchFishProbability(zoneLat, zoneLng);
      
      if (probability !== null) {
        newHeatmapZones.push({
          id: zoneConfig.id,
          center: {
            latitude: zoneLat,
            longitude: zoneLng,
          },
          radius: zoneConfig.radius,
          probability: probability,
        });
      }
    }
    
    setHeatmapZones(newHeatmapZones);
    setIsLoading(false);
  };

  // Function to handle zone press
  const handleZonePress = (zone: HeatmapZone) => {
    setSelectedZone(zone);
    setShowProbabilityModal(true);
  };

  // Function to zoom in
  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: userLocation.latitudeDelta * 0.5,
        longitudeDelta: userLocation.longitudeDelta * 0.5,
      }, 1000);
    }
  };

  // Function to zoom out
  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: userLocation.latitudeDelta * 2,
        longitudeDelta: userLocation.longitudeDelta * 2,
      }, 1000);
    }
  };

  // Function to reset to default zoom
  const resetZoom = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  };
  
  // Single useEffect hook for initial data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your location.');
        setIsLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const newLat = location.coords.latitude;
        const newLon = location.coords.longitude;
        
        const newLocation = {
          latitude: newLat,
          longitude: newLon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setUserLocation(newLocation);

        // Fetch fish name
        const fishName = await fetchFishName(newLat, newLon);
        setMostProbableFish(fishName);

        // Generate heatmap
        generateHeatmap(newLat, newLon);
        
      } catch (error) {
        Alert.alert('Location Error', 'Could not fetch current location.');
        console.error('Failed to get location or fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); 

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>{('map.fetchingLocation')}</Text>
        </View>
      ) : (
        <>
          {/* Fish Name Display */}
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
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
          >
            {/* --- HEATMAP ZONES --- */}
            {heatmapZones.map(zone => (
              <Circle
                key={zone.id}
                center={zone.center}
                radius={zone.radius}
                fillColor={getHeatmapColor(zone.probability)}
                strokeColor={getStrokeColor(zone.probability)}
                strokeWidth={3}
              />
            ))}
            
            {/* --- ZONE CENTER MARKERS --- */}
            {heatmapZones.map(zone => (
              <Marker
                key={`marker-${zone.id}`}
                coordinate={zone.center}
                onPress={() => handleZonePress(zone)}
              >
                <View style={[
                  styles.zoneMarker,
                  {
                    backgroundColor: getStrokeColor(zone.probability),
                  }
                ]}>
                  <Text style={styles.zoneMarkerText}>
                    {Math.round(zone.probability)}%
                  </Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            {/* Floating Gemini Button */}
            <TouchableOpacity style={styles.geminiButton} onPress={handleGeminiPress}>
              <Ionicons name="help-circle" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
              <Ionicons name="remove" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={resetZoom}>
              <Ionicons name="locate" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Refresh Button */}
          <View style={styles.refreshContainer}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                if (userLocation) {
                  // Only re-generate heatmap, fish name is static for user location
                  setIsLoading(true);
                  generateHeatmap(userLocation.latitude, userLocation.longitude);
                }
              }}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>{('map.refreshHeatmap')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Probability Modal */}
      <Modal
        visible={showProbabilityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProbabilityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fish Probability</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowProbabilityModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedZone && (
              <View style={styles.probabilityInfo}>
                <View style={[
                  styles.probabilityIndicator,
                  { backgroundColor: getStrokeColor(selectedZone.probability) }
                ]}>
                  <Text style={styles.probabilityValue}>
                    {Math.round(selectedZone.probability)}%
                  </Text>
                </View>
                
                <Text style={styles.probabilityLabel}>
                  Fish Probability Zone
                </Text>
                
                <View style={styles.coordinatesInfo}>
                  <Text style={styles.coordinateText}>
                    Center: {selectedZone.center.latitude.toFixed(6)}, {selectedZone.center.longitude.toFixed(6)}
                  </Text>
                  <Text style={styles.coordinateText}>
                    Radius: {(selectedZone.radius / 1000).toFixed(1)} km
                  </Text>
                </View>

                <View style={styles.probabilityDescription}>
                  {/* Ensure all description text is wrapped in <Text> */}
                  <Text style={styles.descriptionText}>
                    {selectedZone.probability >= 80 ? 
                      "Excellent fishing zone! Very high probability of catching fish in this area." :
                      selectedZone.probability >= 60 ?
                      "Good fishing zone. High probability of success in this area." :
                      selectedZone.probability >= 40 ?
                      "Moderate fishing zone. Fair probability of success in this area." :
                      selectedZone.probability >= 20 ?
                      "Low activity zone. Limited fishing success expected." :
                      "Very low activity zone. Poor fishing conditions in this area."
                    }
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Gemini Modal */}
 <Modal visible={showGeminiModal} animationType="slide" transparent onRequestClose={() => setShowGeminiModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.geminiModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Best Fishing Practices</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowGeminiModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
 {isGeminiLoading ? (
 <ActivityIndicator size="large" color="#007BFF" />
 ) : (
<ScrollView style={styles.geminiScrollView}>
<Text style={styles.geminiText}>{geminiAdvice}</Text>
</ScrollView>
)}
 <TouchableOpacity style={styles.closeButtonLarge} onPress={() => setShowGeminiModal(false)}>
<Text style={styles.closeButtonText}>Close</Text>
 </TouchableOpacity> 
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#34495e',
  },

  // Fish Name Display Styles
  fishNameContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  fishNameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  fishNameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fishNameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  fishNameLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fishNameLoadingText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  fishNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  fishNameError: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Zone Marker Styles
  zoneMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fff',
  },
  zoneMarkerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Zoom Controls
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    flexDirection: 'column',
  },
  // Gemini Button Style
  geminiButton: {
    backgroundColor: '#1E90FF', 
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomButton: {
    backgroundColor: '#007BFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // Refresh Button
  refreshContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 100,
  },
  refreshButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 5,
  },
  // Gemini Modal Specific Styles 
  geminiModalContent: {
    maxHeight: '80%', 
    width: '90%',
  },
  geminiScrollView: {
    maxHeight: '80%',
    paddingRight: 10, 
  },
  geminiText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 10,
  },
  closeButtonLarge: {
    marginTop: 20,
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#007BFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Existing Probability Modal styles...
  probabilityInfo: {
    alignItems: 'center',
  },
  probabilityIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  probabilityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  probabilityLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  coordinatesInfo: {
    marginBottom: 15,
  },
  coordinateText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 2,
  },
  probabilityDescription: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 20,
  },
});