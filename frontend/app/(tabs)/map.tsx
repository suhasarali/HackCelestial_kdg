
import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
//import { useTranslation } from 'react-i18next';

// Mock data
const FISHING_ZONES = [
  {
    id: 1,
    name: 'North Bay',
    coordinates: [
      { latitude: 19.0760, longitude: 72.8777 },
      { latitude: 19.0760, longitude: 72.8877 },
      { latitude: 19.0660, longitude: 72.8877 },
      { latitude: 19.0660, longitude: 72.8777 },
    ],
    rating: 4.8,
    safety: 'Safe'
  },
  {
    id: 2,
    name: 'Coral Reef',
    coordinates: [
      { latitude: 19.0560, longitude: 72.8677 },
      { latitude: 19.0560, longitude: 72.8777 },
      { latitude: 19.0460, longitude: 72.8777 },
      { latitude: 19.0460, longitude: 72.8677 },
    ],
    rating: 4.5,
    safety: 'Moderate'
  }
];

const BOUNDARIES = [
  {
    id: 1,
    name: 'Maritime Boundary',
    coordinates: [
      { latitude: 19.1, longitude: 72.8 },
      { latitude: 19.1, longitude: 72.9 },
      { latitude: 19.0, longitude: 72.9 },
      { latitude: 19.0, longitude: 72.8 },
    ]
  }
];

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  //const { t } = useTranslation();
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [userLocation, setUserLocation] = useState({
    latitude: 19.0760,
    longitude: 72.8777,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (params.selectedZone) {
      const zone = JSON.parse(params.selectedZone as string);
      setSelectedZone(zone);
    }
  }, [params]);

  const handleStartTrip = () => {
    setIsTracking(true);
    // Start tracking logic here
  };

  const handleEndTrip = () => {
    setIsTracking(false);
    // End tracking logic here
  };

  const handleVoiceCommand = () => {
    // Voice command logic here
    alert('Voice command activated. Say "Start trip" or "Nearest safe zone"');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapView
        style={styles.map}
        region={userLocation}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {/* Fishing Zones */}
        {FISHING_ZONES.map(zone => (
          <Polygon
            key={zone.id}
            coordinates={zone.coordinates}
            strokeColor={zone.safety === 'Safe' ? '#2ecc71' : '#f39c12'}
            fillColor={zone.safety === 'Safe' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(243, 156, 18, 0.2)'}
            strokeWidth={2}
          />
        ))}

        {/* Boundaries */}
        {BOUNDARIES.map(boundary => (
          <Polygon
            key={boundary.id}
            coordinates={boundary.coordinates}
            strokeColor="#e74c3c"
            fillColor="rgba(231, 76, 60, 0.1)"
            strokeWidth={2}
          />
        ))}

        {/* Markers */}
        <Marker
          coordinate={{ latitude: 19.0760, longitude: 72.8777 }}
          title="Your Location"
          description="You are here"
        />
      </MapView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, isTracking ? styles.stopButton : styles.startButton]}
          onPress={isTracking ? handleEndTrip : handleStartTrip}
        >
          <Icon 
            name={isTracking ? 'stop' : 'navigation'} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.controlText}>
            {isTracking ? ('endTrip') : ('startTrip')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleVoiceCommand}
        >
          <Icon name="microphone" size={24} color="#fff" />
          <Text style={styles.controlText}>{('voiceCommand')}</Text>
        </TouchableOpacity>
      </View>

      {/* Info Panel */}
      {selectedZone && (
        <View style={styles.infoPanel}>
          <Text style={styles.zoneName}>{selectedZone.name}</Text>
          <Text style={styles.zoneDetails}>{selectedZone.distance} away • Rating: {selectedZone.rating}</Text>
          <Text style={styles.zoneReason}>{selectedZone.reason}</Text>
          <TouchableOpacity 
            style={styles.navigateButton}
            onPress={() => {
              // Navigation logic here
            }}
          >
            <Text style={styles.navigateText}>{('navigateToZone')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  controlButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    elevation: 3,
  },
  startButton: {
    backgroundColor: '#2ecc71',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  controlText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoPanel: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  zoneName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  zoneDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  zoneReason: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 8,
  },
  navigateButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  navigateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});