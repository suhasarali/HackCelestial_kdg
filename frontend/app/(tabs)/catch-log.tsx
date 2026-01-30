'use client';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, Alert, ActivityIndicator, Dimensions,
  Vibration, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/design';

const { width } = Dimensions.get('window');

const MARKET_SPIKES = [
  { id: 's1', species: 'Silver Pomfret', price: 850, change: '+18%', trend: 'up', location: 'Mumbai' },
  { id: 's2', species: 'Kingfish', price: 720, change: '+12%', trend: 'up', location: 'Thane' },
  { id: 's3', species: 'Tuna', price: 400, change: '+8%', trend: 'up', location: 'Ratnagiri' },
];

export default function CatchLogScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
    species: '', weight: '', qty: '1', priceType: 'Retail'
  });

  const cameraRef = useRef<any>(null);

  useEffect(() => {
    const checkTrip = async () => {
      const tripData = await AsyncStorage.getItem('active_trip');
      if (tripData) {
        const parsed = JSON.parse(tripData);
        if (JSON.stringify(parsed) !== JSON.stringify(activeTrip)) {
          setActiveTrip(parsed);
        }
      } else {
        if (activeTrip !== null) setActiveTrip(null);
      }
    };

    checkTrip();
    const interval = setInterval(checkTrip, 2000);
    return () => clearInterval(interval);
  }, [activeTrip]);

  const detectSpecies = async (imageUri: string) => {
    setIsDetecting(true);
    try {
      const form = new FormData();
      form.append('image', { uri: imageUri, type: 'image/jpeg', name: 'fish.jpg' } as any);
      
      const response = await fetch('https://mlservice-146a.onrender.com/detect', {
        method: 'POST',
        body: form,
      });

      if (response.ok) {
        const result = await response.json();
        const species = result.roboflow_result || 'Unknown Fish';
        // Populates form but DOES NOT add to list yet
        setFormData(prev => ({ ...prev, species }));
      }
    } catch (error) {
      console.error('Detection error:', error);
      Alert.alert("Error", "Could not identify fish.");
    } finally { 
      setIsDetecting(false); 
    }
  };

  const fetchSingleItemPrice = async (item: any, id: string) => {
    try {
      let currentLoc = location || await getCurrentLocation();
      const priceParams = new URLSearchParams({
        user_id: user?.id || 'default_user',
        species: item.species,
        qty_captured: item.qty,
        weight_kg: item.weight,
        lat: (currentLoc?.latitude || 19.0760).toString(),
        lon: (currentLoc?.longitude || 72.8777).toString(),
        price_type: item.priceType
      });

      const res = await fetch(`https://mlservice-146a.onrender.com/price?${priceParams}`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setHaulItems(prev => prev.map(i => 
          i.id === id ? { ...i, predictedPrice: data.predicted_price, loadingPrice: false } : i
        ));
      }
    } catch (e) {
      setHaulItems(prev => prev.map(i => 
        i.id === id ? { ...i, predictedPrice: 'Error', loadingPrice: false } : i
      ));
    }
  };

  const addToHaul = () => {
    if (!formData.species || !formData.weight || !formData.qty ) {
        Alert.alert("Missing Info", "Please ensure species and weight are set.");
        return;
    }
    const tempId = Date.now().toString();
    const newItem = { ...formData, id: tempId, predictedPrice: null, loadingPrice: true };
    setHaulItems(prev => [...prev, newItem]);
    fetchSingleItemPrice(newItem, tempId);
    
    // Reset state for next entry
    setFormData({ species: '', weight: '', qty: '1', priceType: 'Retail' });
    setCapturedImage(null);
  };

  const processFullHaul = async () => {
    if (haulItems.length === 0) {
      Alert.alert(t('common.error'), t('catchLog.noCatches'));
      return;
    }
    setIsProcessingHaul(true);
    let totalRevenue = 0;
    try {
      let currentLoc = location || await getCurrentLocation();
      for (const item of haulItems) {
        if (item.predictedPrice && item.predictedPrice !== 'Error') {
          totalRevenue += parseFloat(item.predictedPrice);
        } else {
          const priceParams = new URLSearchParams({
            user_id: user?.id || 'default_user',
            species: item.species || 'Unknown',
            qty_captured: item.qty || '1',
            weight_kg: item.weight,
            lat: (currentLoc?.latitude || 19.0760).toString(),
            lon: (currentLoc?.longitude || 72.8777).toString(),
            price_type: item.priceType
          });
          const res = await fetch(`https://mlservice-146a.onrender.com/price?${priceParams}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            totalRevenue += parseFloat(data.predicted_price || 0);
          }
        }
      }
      const fuelCost = activeTrip ? (activeTrip.estimatedFuel * 105) : 0;
      const netProfit = totalRevenue - fuelCost;
      const targetDiff = activeTrip ? totalRevenue - activeTrip.estimatedRevenue : 0;

      setSummaryReport({ totalRevenue, fuelCost, netProfit, targetDiff, isAboveTarget: targetDiff >= 0 });
      Vibration.vibrate(200);
    } catch (error) {
      Alert.alert(t('common.error'), t('catchLog.noCatches'));
    } finally { setIsProcessingHaul(false); }
  };

  const handleEndTrip = async () => {
    Alert.alert(t('catchLog.endTrip'), "Permanently remove active trip data?", [
        { text: t('common.cancel') },
        { text: t('catchLog.endTrip'), style: "destructive", onPress: async () => {
            await AsyncStorage.removeItem('active_trip');
            setActiveTrip(null);
            setSummaryReport(null);
        }}
    ]);
  };

  if (isCameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar barStyle="light-content" />
        <CameraView style={styles.camera} ref={cameraRef}>
          <SafeAreaView style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.cameraCloseBtn} onPress={() => setIsCameraActive(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.cameraGuide}>
              <View style={styles.cameraFrame} />
              <Text style={styles.cameraHint}>{t('catchLog.positionFish')}</Text>
            </View>
            <TouchableOpacity style={styles.cameraCaptureBtn} onPress={async () => {
              const photo = await cameraRef.current.takePictureAsync();
              setCapturedImage(photo.uri);
              setIsCameraActive(false);
              await detectSpecies(photo.uri);
            }}>
              <View style={styles.cameraCaptureInner} />
            </TouchableOpacity>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>{t('catchLog.title')}</Text>
              <Text style={styles.pageSubtitle}>{t('catchLog.subtitle')}</Text>
            </View>
            <TouchableOpacity style={styles.historyBtn}>
              <Ionicons name="time-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Market Spikes */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="trending-up" size={20} color={Colors.success} />
            <Text style={styles.sectionTitle}>{t('catchLog.marketSpikes')}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{t('catchLog.livePrices')}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spikesScroll}>
          {MARKET_SPIKES.map((spike, index) => (
            <View key={spike.id} style={styles.spikeCard}>
              <LinearGradient
                colors={index === 0 ? ['#38A169', '#2F855A'] : [Colors.surface, Colors.surface]}
                style={styles.spikeCardGradient}
              >
                <View style={styles.spikeHeader}>
                  <View style={[styles.spikeTrendBadge, { backgroundColor: index === 0 ? 'rgba(255,255,255,0.2)' : '#DCFCE7' }]}>
                    <Ionicons name="trending-up" size={12} color={index === 0 ? '#fff' : Colors.success} />
                    <Text style={[styles.spikeTrendText, { color: index === 0 ? '#fff' : Colors.success }]}>{spike.change}</Text>
                  </View>
                </View>
                <Text style={[styles.spikeSpecies, { color: index === 0 ? '#fff' : Colors.textPrimary }]}>{spike.species}</Text>
                <Text style={[styles.spikePrice, { color: index === 0 ? '#fff' : Colors.success }]}>₹{spike.price}<Text style={styles.spikePriceUnit}>/kg</Text></Text>
                <Text style={[styles.spikeLocation, { color: index === 0 ? 'rgba(255,255,255,0.7)' : Colors.textSecondary }]}>{spike.location}</Text>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>

        {/* Active Trip Card */}
        {activeTrip && (
          <View style={styles.tripCard}>
            <LinearGradient colors={['#1A202C', '#2D3748']} style={styles.tripCardGradient}>
              <View style={styles.tripHeader}>
                <View style={styles.tripHeaderLeft}>
                  <View style={styles.tripStatusDot} />
                  <Text style={styles.tripStatusText}>Active Trip</Text>
                </View>
                <TouchableOpacity onPress={handleEndTrip} style={styles.tripEndBtn}>
                  <Ionicons name="close-circle" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={styles.tripTarget}>{activeTrip.targetSpecies}</Text>
              <View style={styles.tripStats}>
                <View style={styles.tripStatItem}>
                  <Icon name="target" size={18} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.tripStatValue}>₹{activeTrip.estimatedRevenue}</Text>
                  <Text style={styles.tripStatLabel}>Target</Text>
                </View>
                <View style={styles.tripStatDivider} />
                <View style={styles.tripStatItem}>
                  <Icon name="gas-station" size={18} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.tripStatValue}>₹{(activeTrip.estimatedFuel * 105).toFixed(0)}</Text>
                  <Text style={styles.tripStatLabel}>{t('catchLog.fuelCost')}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Species Entry Form */}
        <View style={styles.formCard}>
          {/* LOADER OVERLAY */}
          {isDetecting && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 24 }]}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={{ marginTop: 12, color: Colors.primary, fontWeight: '700' }}>Analyzing Catch...</Text>
            </View>
          )}

          <View style={styles.formHeader}>
            <View style={styles.formIconCircle}>
              <Icon name="fish" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.formTitle}>{t('catchLog.addCatch')}</Text>
              <Text style={styles.formSubtitle}>{t('catchLog.snapToIdentify')}</Text>
            </View>
          </View>

          {capturedImage ? (
            <View style={styles.capturedImageContainer}>
              <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
              <TouchableOpacity style={styles.retakeBtn} onPress={() => {setCapturedImage(null); setFormData(prev => ({...prev, species: ''}))}}>
                <Ionicons name="refresh" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.captureArea} onPress={() => setIsCameraActive(true)}>
              <View style={styles.captureIconCircle}>
                <Icon name="camera-plus" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.captureTitle}>{t('catchLog.identifyFish')}</Text>
              <Text style={styles.captureSubtitle}>{t('catchLog.takePhoto')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.formInputs}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('catchLog.speciesName')}</Text>
              <TextInput 
                style={styles.input} 
                value={formData.species} 
                onChangeText={(t) => setFormData({...formData, species: t})} 
                placeholder={t('catchLog.speciesName')}
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>{t('catchLog.weight')}</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.weight} 
                  onChangeText={(t) => setFormData({...formData, weight: t})} 
                  keyboardType="numeric" 
                  placeholder="0.0"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>{t('catchLog.quantity')}</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.qty} 
                  onChangeText={(t) => setFormData({...formData, qty: t})} 
                  keyboardType="numeric" 
                  placeholder="1"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.addBtn, !formData.species && { opacity: 0.6 }]} onPress={addToHaul} disabled={!formData.species}>
            <LinearGradient colors={[Colors.primary, '#1D5A5B']} style={styles.addBtnGradient}>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.addBtnText}>{t('catchLog.addToHaul')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Haul List */}
        {haulItems.length > 0 && (
          <View style={styles.haulCard}>
            <View style={styles.haulHeader}>
              <Text style={styles.haulTitle}>{t('catchLog.currentHaul')} ({haulItems.length})</Text>
              <TouchableOpacity onPress={() => setHaulItems([])}>
                <Text style={styles.haulClearText}>{t('catchLog.clearAll')}</Text>
              </TouchableOpacity>
            </View>
            {haulItems.map((item) => (
              <View key={item.id} style={styles.haulItem}>
                <View style={styles.haulItemIcon}><Icon name="fish" size={18} color={Colors.primary} /></View>
                <View style={styles.haulItemInfo}>
                  <Text style={styles.haulItemName}>{item.species || 'Unknown Fish'}</Text>
                  <Text style={styles.haulItemMeta}>{item.weight}kg × {item.qty}</Text>
                </View>
                <View style={{ marginRight: 10 }}>
                   {item.loadingPrice ? <ActivityIndicator size="small" color={Colors.primary} /> : <Text style={{ fontWeight: '600', color: Colors.success }}>₹{item.predictedPrice}</Text>}
                </View>
                <TouchableOpacity onPress={() => setHaulItems(haulItems.filter(i => i.id !== item.id))}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Summary & Analyze Section */}
        {summaryReport && (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Icon name="receipt" size={24} color={Colors.success} /><Text style={styles.reportTitle}>{t('catchLog.tripSummary')}</Text>
            </View>
            <View style={styles.reportBody}>
              <View style={styles.reportRow}><Text style={styles.reportLabel}>{t('catchLog.totalRevenue')}</Text><Text style={styles.reportValue}>₹{summaryReport.totalRevenue.toFixed(0)}</Text></View>
              <View style={styles.reportRow}><Text style={styles.reportLabel}>{t('catchLog.fuelCost')}</Text><Text style={styles.reportValueRed}>-₹{summaryReport.fuelCost.toFixed(0)}</Text></View>
              <View style={styles.reportDivider} />
              <View style={styles.reportRow}><Text style={styles.reportLabelBold}>{t('catchLog.netProfit')}</Text><Text style={styles.reportValueBig}>₹{summaryReport.netProfit.toFixed(0)}</Text></View>
            </View>
            {activeTrip && (
              <View style={[styles.targetResult, { backgroundColor: summaryReport.isAboveTarget ? '#DCFCE7' : '#FEE2E2' }]}>
                <Ionicons name={summaryReport.isAboveTarget ? 'checkmark-circle' : 'alert-circle'} size={20} color={summaryReport.isAboveTarget ? Colors.success : Colors.error} />
                <Text style={[styles.targetResultText, { color: summaryReport.isAboveTarget ? Colors.success : Colors.error }]}>
                  {summaryReport.isAboveTarget ? `₹${summaryReport.targetDiff.toFixed(0)} ${t('catchLog.aboveTarget')}` : `₹${Math.abs(summaryReport.targetDiff).toFixed(0)} ${t('catchLog.belowTarget')}`}
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.analyzeBtn} onPress={processFullHaul}>
          <LinearGradient colors={[Colors.success, '#2F855A']} style={styles.analyzeBtnGradient}>
            {isProcessingHaul ? <ActivityIndicator color="#fff" size="small" /> : <><Icon name="calculator-variant" size={24} color="#fff" /><Text style={styles.analyzeBtnText}>{t('catchLog.calculateProfit')}</Text></>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 20 },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
  cameraCloseBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  cameraGuide: { alignItems: 'center' },
  cameraFrame: { width: 280, height: 200, borderWidth: 3, borderColor: '#fff', borderRadius: 20, marginBottom: 16 },
  cameraHint: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  cameraCaptureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', padding: 6, alignSelf: 'center' },
  cameraCaptureInner: { flex: 1, borderRadius: 34, backgroundColor: Colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  pageSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  historyBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary },
  spikesScroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  spikeCard: { width: 150, marginRight: 12, borderRadius: 20, overflow: 'hidden', ...Shadows.md },
  spikeCardGradient: { padding: 16 },
  spikeHeader: { marginBottom: 12 },
  spikeTrendBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  spikeTrendText: { fontSize: 11, fontWeight: '600' },
  spikeSpecies: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  spikePrice: { fontSize: 22, fontWeight: '700' },
  spikePriceUnit: { fontSize: 12, fontWeight: '400' },
  spikeLocation: { fontSize: 12, marginTop: 4 },
  tripCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 24, overflow: 'hidden', ...Shadows.lg },
  tripCardGradient: { padding: 20 },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tripHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tripStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  tripStatusText: { color: Colors.success, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  tripEndBtn: {},
  tripTarget: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  tripStats: { flexDirection: 'row', alignItems: 'center' },
  tripStatItem: { flex: 1, alignItems: 'center', gap: 6 },
  tripStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  tripStatValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tripStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  formCard: { backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 20, borderRadius: 24, padding: 20, ...Shadows.md, position: 'relative' },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  formIconCircle: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  formTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  formSubtitle: { fontSize: 13, color: Colors.textSecondary },
  captureArea: { height: 140, borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary + '08', marginBottom: 20 },
  captureIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  captureTitle: { fontSize: 16, fontWeight: '600', color: Colors.primary, marginBottom: 4 },
  captureSubtitle: { fontSize: 13, color: Colors.textSecondary },
  capturedImageContainer: { position: 'relative', marginBottom: 20 },
  capturedImage: { width: '100%', height: 180, borderRadius: 20 },
  retakeBtn: { position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  formInputs: { gap: 14, marginBottom: 16 },
  inputContainer: {},
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.surfaceVariant, borderRadius: 14, padding: 16, fontSize: 16, color: Colors.textPrimary },
  inputRow: { flexDirection: 'row', gap: 12 },
  addBtn: { borderRadius: 16, overflow: 'hidden' },
  addBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 10 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  haulCard: { backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 20, borderRadius: 24, padding: 20, ...Shadows.md },
  haulHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  haulTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  haulClearText: { fontSize: 14, color: Colors.error, fontWeight: '500' },
  haulItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceVariant, padding: 14, borderRadius: 14, marginBottom: 10, gap: 12 },
  haulItemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  haulItemInfo: { flex: 1 },
  haulItemName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  haulItemMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  reportCard: { backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 20, borderRadius: 24, padding: 20, borderTopWidth: 4, borderTopColor: Colors.success, ...Shadows.md },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  reportTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  reportLabel: { fontSize: 15, color: Colors.textSecondary },
  reportValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  reportValueRed: { fontSize: 15, fontWeight: '600', color: Colors.error },
  reportDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 12 },
  reportLabelBold: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  reportValueBig: { fontSize: 24, fontWeight: '700', color: Colors.success },
  targetResult: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, marginTop: 8, gap: 8 },
  targetResultText: { fontSize: 15, fontWeight: '600' },
  analyzeBtn: { marginHorizontal: 20, marginTop: 20, borderRadius: 20, overflow: 'hidden', ...Shadows.md },
  analyzeBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  analyzeBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});