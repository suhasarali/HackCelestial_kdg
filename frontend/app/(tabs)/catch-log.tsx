'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, Alert, ActivityIndicator, Dimensions,
  Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

const { width } = Dimensions.get('window');

const MARKET_SPIKES = [
  { id: 's1', species: 'Silver Pomfret', price: 850, status: 'High Demand', location: 'Kalyan Mandi' },
  { id: 's2', species: 'Kingfish (Surmai)', price: 720, status: 'Rising', location: 'Thane Market' },
  { id: 's3', species: 'Tuna', price: 400, status: 'Spiking', location: 'Navi Mumbai' },
];

export default function CatchLogScreen() {
  const { user } = useAuth();
  const { location, getCurrentLocation } = useLocation();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [haulItems, setHaulItems] = useState<any[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isProcessingHaul, setIsProcessingHaul] = useState(false);
  const [summaryReport, setSummaryReport] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    species: '', weight: '', qty: '', priceType: 'Retail'
  });

  const cameraRef = useRef<any>(null);

  // ✅ ALWAYS KEEP CHECKING LOCAL STORAGE
  useEffect(() => {
    const checkTrip = async () => {
      const tripData = await AsyncStorage.getItem('active_trip');
      if (tripData) {
        const parsed = JSON.parse(tripData);
        //console.log('Fetched active trip from storage:', parsed);
        // Only update state if data has changed to prevent re-renders
        if (JSON.stringify(parsed) !== JSON.stringify(activeTrip)) {
          setActiveTrip(parsed);
        }
      } else {
        if (activeTrip !== null) setActiveTrip(null);
      }
    };

    checkTrip(); // Initial check
    const interval = setInterval(checkTrip, 2000); // Check every 2 seconds for background changes
    return () => clearInterval(interval);
  }, [activeTrip]);

  // --- API FUNCTIONS ---
  const detectSpecies = async (imageUri: string) => {
    setIsDetecting(true);
    try {
      const form = new FormData();
      form.append('image', { uri: imageUri, type: 'image/jpeg', name: 'fish.jpg' } as any);
      const response = await fetch('https://mlservice-146a.onrender.com/detect', {
        method: 'POST',
        body: form,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Detection response status:', response);
      if (response.ok) {
        const result = await response.json();
        console.log('Detection result:', result);
        const species = result.roboflow_result || 'Unknown';
        setFormData(prev => ({ ...prev, species }));
      }
    } catch (error) {
      console.error('Detection error:', error);
    } finally { setIsDetecting(false); }
  };

  const processFullHaul = async () => {
    if (haulItems.length === 0) {
      Alert.alert("Empty Haul", "Add items to the haul list first.");
      return;
    }
    setIsProcessingHaul(true);
    let totalRevenue = 0;
    try {
      let currentLoc = location || await getCurrentLocation();
      for (const item of haulItems) {
        const priceParams = new URLSearchParams({
          user_id: user?.id || 'default_user',
          species: item.species || 'Unknown',
          qty_captured: item.qty || '1',
          weight_kg: item.weight,
          lat: (currentLoc?.latitude || 19.0760).toString(),
          lon: (currentLoc?.longitude || 72.8777).toString(),
          price_type: item.priceType
        });
        console.log('Fetching price with params:', priceParams.toString());
        const res = await fetch(`https://mlservice-146a.onrender.com/price?${priceParams}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          console.log('Price result:', data);
          totalRevenue += parseFloat(data.predicted_price || 0);
        }
      }
      const fuelCost = activeTrip ? (activeTrip.estimatedFuel * 105) : 0;
      const netProfit = totalRevenue - fuelCost;
      const targetDiff = activeTrip ? totalRevenue - activeTrip.estimatedRevenue : 0;

      setSummaryReport({ totalRevenue, fuelCost, netProfit, targetDiff, isAboveTarget: targetDiff >= 0 });
      Vibration.vibrate(200);
    } catch (error) {
      Alert.alert("Error", "Failed to process prices.");
    } finally { setIsProcessingHaul(false); }
  };

  const handleEndTrip = async () => {
    Alert.alert("End Trip", "Permanently remove active trip data?", [
        { text: "Cancel" },
        { text: "End Trip", style: "destructive", onPress: async () => {
            await AsyncStorage.removeItem('active_trip');
            setActiveTrip(null);
            setSummaryReport(null);
        }}
    ]);
  };

  const addToHaul = () => {
    if (!formData.weight) return;
    setHaulItems([...haulItems, { ...formData, id: Date.now().toString() }]);
    setFormData({ species: '', weight: '', qty: '', priceType: 'Retail' });
    setCapturedImage(null);
  };

  if (isCameraActive) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setIsCameraActive(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.captureButton} onPress={async () => {
              const photo = await cameraRef.current.takePictureAsync();
              setCapturedImage(photo.uri);
              setIsCameraActive(false);
              await detectSpecies(photo.uri);
            }}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Live Market Spikes */}
        <View style={styles.spikeHeaderContainer}>
          <Text style={styles.spikeTitle}>Thane Market Spikes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MARKET_SPIKES.map((spike) => (
              <View key={spike.id} style={styles.spikeCard}>
                <Text style={styles.spikeBadgeText}>{spike.status}</Text>
                <Text style={styles.spikeSpecies}>{spike.species}</Text>
                <Text style={styles.spikePrice}>₹{spike.price}/kg</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* --- 💰 ACTIVE TRIP INTELLIGENCE CARD --- */}
        {activeTrip && (
          <View style={styles.activeTripCard}>
            <View style={styles.rowBetween}>
              <View style={styles.bizHeader}>
                <View style={styles.statusDot} />
                <Text style={styles.bizTitle}>Active Trip: {activeTrip.targetSpecies}</Text>
              </View>
              {/* DELETE BUTTON FOR ACTIVE TRIP */}
              <TouchableOpacity onPress={handleEndTrip}>
                <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
              </TouchableOpacity>
            </View>
            <View style={styles.bizStatsRow}>
                <View>
                    <Text style={styles.bizLabel}>Pre-Trip Target</Text>
                    <Text style={styles.whiteText}>₹{activeTrip.estimatedRevenue}</Text>
                </View>
                <View>
                    <Text style={styles.bizLabel}>Est. Fuel</Text>
                    <Text style={styles.whiteText}>₹{(activeTrip.estimatedFuel * 105).toFixed(0)}</Text>
                </View>
            </View>
          </View>
        )}

        {/* Haul List */}
        {haulItems.length > 0 && (
          <View style={styles.haulSection}>
            <View style={styles.rowBetween}>
               <Text style={styles.haulTitle}>Trip Haul List</Text>
               <TouchableOpacity onPress={() => setHaulItems([])}><Ionicons name="trash" size={18} color="#e74c3c" /></TouchableOpacity>
            </View>
            {haulItems.map((item) => (
              <View key={item.id} style={styles.haulItem}>
                <Text style={styles.haulText}>{item.species || 'Unknown'} • {item.weight}kg</Text>
                <TouchableOpacity onPress={() => setHaulItems(haulItems.filter(i => i.id !== item.id))}>
                  <Ionicons name="remove-circle" size={20} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>Species Entry</Text>
          <Text style={styles.subtitle}>Snap fish to calculate value</Text>
        </View>

        <View style={styles.section}>
          {capturedImage ? (
            <Image source={{ uri: capturedImage }} style={styles.image} />
          ) : (
            <TouchableOpacity style={styles.captureButtonLarge} onPress={() => setIsCameraActive(true)}>
              {isDetecting ? <ActivityIndicator color="#3498db" /> : (
                <>
                  <MaterialCommunityIcons name="camera-plus" size={32} color="#3498db" />
                  <Text style={styles.captureText}>Identify Species (Optional)</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TextInput style={styles.input} value={formData.species} onChangeText={(t) => setFormData({...formData, species: t})} placeholder="Species Name"/>
          
          <View style={styles.inputRow}>
            <TextInput style={[styles.input, {flex: 1}]} value={formData.weight} onChangeText={(t) => setFormData({...formData, weight: t})} keyboardType="numeric" placeholder="Weight (kg)"/>
            <TextInput style={[styles.input, {flex: 1}]} value={formData.qty} onChangeText={(t) => setFormData({...formData, qty: t})} keyboardType="numeric" placeholder="Qty"/>
          </View>

          <TouchableOpacity style={styles.addToHaulBtn} onPress={addToHaul}>
            <Text style={styles.addToHaulText}>Add to Haul List</Text>
          </TouchableOpacity>
        </View>

        {/* Profit Comparison Report */}
        {summaryReport && (
          <View style={styles.resultSection}>
            <Text style={styles.reportTitle}>Trip Financial Report</Text>
            <View style={styles.reportRow}><Text>Actual Revenue</Text><Text style={styles.reportValue}>₹{summaryReport.totalRevenue}</Text></View>
            <View style={styles.reportRow}><Text>Fuel Deduction</Text><Text style={{color: '#e74c3c'}}>- ₹{summaryReport.fuelCost.toFixed(0)}</Text></View>
            <View style={styles.divider} />
            <View style={styles.reportRow}>
                <Text style={{fontWeight: 'bold'}}>Net Trip Profit</Text>
                <Text style={styles.profitFinal}>₹{summaryReport.netProfit.toFixed(0)}</Text>
            </View>
            {activeTrip && (
                <View style={[styles.targetBadge, {backgroundColor: summaryReport.isAboveTarget ? '#f0fdf4' : '#fef2f2'}]}>
                    <Text style={{color: summaryReport.isAboveTarget ? '#166534' : '#991b1b', fontSize: 12}}>
                        {summaryReport.isAboveTarget ? `🎉 ₹${summaryReport.targetDiff.toFixed(0)} above target!` : `⚠️ ₹${Math.abs(summaryReport.targetDiff).toFixed(0)} below pre-trip target.`}
                    </Text>
                </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={processFullHaul}>
          {isProcessingHaul ? <ActivityIndicator color="#fff" /> : (
            <>
               <MaterialCommunityIcons name="calculator" size={20} color="#fff" style={{marginRight: 10}} />
               <Text style={styles.saveButtonText}>Analyze Full Haul Profit</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  closeButton: { position: 'absolute', top: 50, left: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25 },
  cameraControls: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', padding: 5 },
  captureButtonInner: { flex: 1, borderRadius: 30, backgroundColor: '#3498db' },
  spikeHeaderContainer: { padding: 20 },
  spikeTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  spikeCard: { backgroundColor: '#fff', padding: 12, borderRadius: 15, marginRight: 12, width: 140, elevation: 2 },
  spikeBadgeText: { fontSize: 10, color: '#2ecc71', fontWeight: 'bold' },
  spikeSpecies: { fontWeight: 'bold', fontSize: 13, color: '#34495e' },
  spikePrice: { fontSize: 16, fontWeight: 'bold', color: '#2ecc71' },
  activeTripCard: { backgroundColor: '#1c2a38', margin: 16, borderRadius: 15, padding: 20 },
  bizHeader: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71', marginRight: 10 },
  bizTitle: { color: '#fff', fontWeight: 'bold' },
  bizStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  bizLabel: { color: '#94a3b8', fontSize: 10, textTransform: 'uppercase' },
  whiteText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  haulSection: { backgroundColor: '#1c2a38', margin: 16, borderRadius: 15, padding: 15 },
  haulTitle: { color: '#fff', fontWeight: 'bold' },
  haulItem: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8, marginBottom: 8, justifyContent: 'space-between', alignItems: 'center' },
  haulText: { color: '#fff', fontSize: 14 },
  header: { padding: 20, paddingTop: 0 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  subtitle: { color: '#7f8c8d' },
  section: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginHorizontal: 16, marginBottom: 16 },
  captureButtonLarge: { height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: '#3498db', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  captureText: { color: '#3498db', fontWeight: 'bold' },
  image: { width: '100%', height: 150, borderRadius: 12, marginBottom: 15 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10 },
  addToHaulBtn: { backgroundColor: '#3498db', padding: 15, borderRadius: 10, alignItems: 'center' },
  addToHaulText: { color: '#fff', fontWeight: 'bold' },
  resultSection: { backgroundColor: '#fff', borderRadius: 20, padding: 20, margin: 16, borderTopWidth: 5, borderTopColor: '#2ecc71' },
  reportTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  reportValue: { fontWeight: 'bold' },
  profitFinal: { fontSize: 22, fontWeight: 'bold', color: '#2ecc71' },
  targetBadge: { padding: 12, borderRadius: 10, marginTop: 15 },
  saveButton: { backgroundColor: '#2ecc71', margin: 16, padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 40, flexDirection: 'row', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 }
});