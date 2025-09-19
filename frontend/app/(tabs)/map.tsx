import { useState, useEffect } from 'react';
import {
 View,
 Text,
 StyleSheet,
 TouchableOpacity,
 Dimensions,
 Alert,
 ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import React from 'react';


// --- HEATMAP CONSTANTS ---
// Backend server URL - update this to match your actual server
const BACKEND_API_URL = 'https://VolcanicBat64-fish3.hf.space/predict';


const GRID_DELTA = 0.005; // Defines the size of each grid cell (in degrees)


interface HeatmapCell {
 id: string;
 coordinates: { latitude: number; longitude: number }[];
 probability: number; // 0 to 100
}


// Helper function to convert a 0-100 probability to an RGBA color
const getHeatmapColor = (probability: number): string => {
 const p = Math.max(0, Math.min(100, probability));
 let r, g, b;
 if (p < 50) {
     r = 0;
     g = Math.round(255 * (p / 50));
     b = Math.round(255 * (1 - (p / 50)));
 } else {
     r = Math.round(255 * ((p - 50) / 50));
     g = Math.round(255 * (1 - ((p - 50) / 50)));
     b = 0;
 }
 const alpha = 0.4;
 return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


// --- API CALL FUNCTION ---
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
         throw new Error(`HTTP error! status: ${response.status}`);
     }


     const responseData = await response.json();
    
     if (responseData.status !== "success") {
         throw new Error('Backend returned an unsuccessful status');
     }


     return responseData.fish_probability;


 } catch (error) {
     console.error('Error fetching fish probability:', error);
     return null;
 }
};


export default function MapScreen() {
 const [userLocation, setUserLocation] = useState<any>(null);
 const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
 const [isLoading, setIsLoading] = useState(true);


 // Function to generate the heatmap grid
 const generateHeatmap = async (centerLat: number, centerLon: number) => {
   const gridRange = 3; // Number of cells around the center
   const newHeatmapData: HeatmapCell[] = [];
   let cellId = 0;


   for (let i = -gridRange; i <= gridRange; i++) {
     for (let j = -gridRange; j <= gridRange; j++) {
       const lat = centerLat + i * GRID_DELTA;
       const lon = centerLon + j * GRID_DELTA;


       const probability = await fetchFishProbability(lat, lon);
      
       if (probability !== null) {
         newHeatmapData.push({
           id: `cell-${cellId++}`,
           coordinates: [
             { latitude: lat, longitude: lon },
             { latitude: lat + GRID_DELTA, longitude: lon },
             { latitude: lat + GRID_DELTA, longitude: lon + GRID_DELTA },
             { latitude: lat, longitude: lon + GRID_DELTA },
           ],
           probability: probability,
         });
       }
     }
   }
   setHeatmapData(newHeatmapData);
   setIsLoading(false);
 };


 // Get user location and generate heatmap on app load
 useEffect(() => {
   const getUserLocation = async () => {
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
      
       setUserLocation({
         latitude: newLat,
         longitude: newLon,
         latitudeDelta: 0.02,
         longitudeDelta: 0.02,
       });


       generateHeatmap(newLat, newLon);


     } catch (error) {
       Alert.alert('Location Error', 'Could not fetch current location.');
       setIsLoading(false);
     }
   };


   getUserLocation();
 }, []);


 return (
   <SafeAreaView style={styles.container}>
     {isLoading ? (
       <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color="#007BFF" />
         <Text style={styles.loadingText}>Fetching location and generating heatmap...</Text>
       </View>
     ) : (
       <MapView
         style={styles.map}
         initialRegion={userLocation}
         showsUserLocation={true}
       >
         {/* --- HEATMAP LAYER --- */}
         {heatmapData.map(cell => (
           <Polygon
             key={cell.id}
             coordinates={cell.coordinates}
             strokeWidth={0}
             fillColor={getHeatmapColor(cell.probability)}
           />
         ))}
       </MapView>
     )}


     {/* Control button for demonstration */}
     {!isLoading && (
       <View style={styles.buttonContainer}>
         <TouchableOpacity
           style={styles.refreshButton}
           onPress={() => {
             if (userLocation) {
               setIsLoading(true);
               generateHeatmap(userLocation.latitude, userLocation.longitude);
             }
           }}
         >
           <Text style={styles.buttonText}>Refresh Heatmap</Text>
         </TouchableOpacity>
       </View>
     )}
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
 buttonContainer: {
   position: 'absolute',
   bottom: 40,
   alignSelf: 'center',
 },
 refreshButton: {
   backgroundColor: '#007BFF',
   paddingVertical: 12,
   paddingHorizontal: 20,
   borderRadius: 8,
   elevation: 3,
 },
 buttonText: {
   color: '#fff',
   fontWeight: 'bold',
 },
});

