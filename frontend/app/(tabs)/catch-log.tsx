// app/(tabs)/catch-log/page.tsx
'use client';

import { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

const { width } = Dimensions.get('window');

// Mock data
const FISH_SPECIES = [
  { id: 1, name: 'Rohu', localName: 'रोहू' },
  { id: 2, name: 'Catla', localName: 'कतला' },
  { id: 3, name: 'Mackerel', localName: 'बंगड़ा' },
  { id: 4, name: 'Pomfret', localName: 'पापलेट' },
  { id: 5, name: 'Tuna', localName: 'टूना' },
];

export default function CatchLogScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { location, getCurrentLocation } = useLocation();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedSpecies, setDetectedSpecies] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    species: '',
    weight: '',
    qty: '',
    priceType: 'Retail'
  });

  const cameraRef = useRef<any>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
        setIsCameraActive(false);
        // Automatically detect species from image
        await detectSpecies(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const detectSpecies = async (imageUri: string) => {
    setIsDetecting(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'fish_image.jpg',
      } as any);

      const response = await fetch('https://mlservice-146a.onrender.com/detect', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const species = result.roboflow_result || 'Unknown' ;
        console.log('Detected species:', species);
        setDetectedSpecies(species);
        setFormData(prev => ({ ...prev, species }));
      } else {
        Alert.alert('Detection Failed', 'Could not detect fish species from image');
      }
    } catch (error) {
      console.error('Detection error:', error);
      Alert.alert('Error', 'Failed to detect fish species');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveCatch = async () => {
    if (!formData.qty || !formData.weight || !formData.species) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsPredicting(true);
    try {
      // Get current location or use fallback
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await getCurrentLocation();
      }

      const priceParams = new URLSearchParams({
        user_id: user?.id || 'default_user',
        species: formData.species,
        qty_captured: formData.qty,
        weight_kg: formData.weight,
        lat: (currentLocation?.latitude || 19.0760).toString(),
        lon: (currentLocation?.longitude || 72.8777).toString(),
        price_type: formData.priceType
      });

      const response = await fetch(`https://mlservice-146a.onrender.com/price?${priceParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setPredictionResult(result);
        Alert.alert('Success', 'Price prediction completed!');
      } else {
        Alert.alert('Error', 'Failed to get price prediction');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      Alert.alert('Error', 'Failed to get price prediction');
    } finally {
      setIsPredicting(false);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="camera-off" size={64} color="#bdc3c7" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            We need camera access to help you identify fish species and log your catch.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isCameraActive) {
    return (
      <SafeAreaView style={styles.cameraContainer} edges={['top']}>
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsCameraActive(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Log Your Catch</Text>
          <Text style={styles.subtitle}>Document your fishing success</Text>
        </View>

        {/* Image Capture */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="camera" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Capture Photo</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Take a photo of your catch to automatically detect the species
          </Text>
          
          {capturedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: capturedImage }} style={styles.image} />
              <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={styles.imageActionButton}
                  onPress={() => setIsCameraActive(true)}
                >
                  <Ionicons name="camera-reverse" size={20} color="#fff" />
                  <Text style={styles.imageActionText}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.captureButtonLarge}
              onPress={() => setIsCameraActive(true)}
            >
              <MaterialCommunityIcons name="camera-plus" size={40} color="#3498db" />
              <Text style={styles.captureText}>Take Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Detection Result */}
        {isDetecting && (
          <View style={styles.section}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Detecting fish species...</Text>
            </View>
          </View>
        )}

        {detectedSpecies && (
          <View style={[styles.section, styles.detectedSection]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="fish" size={20} color="#2ecc71" />
              <Text style={styles.sectionTitle}>Detected Species</Text>
            </View>
            <View style={styles.detectedContainer}>
              <Text style={styles.detectedText}>{detectedSpecies}</Text>
              <MaterialCommunityIcons name="check-circle" size={24} color="#2ecc71" />
            </View>
          </View>
        )}

        {/* Form */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clipboard-list" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Catch Details</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Species</Text>
            <Text style={styles.labelHint}>Auto-detected or enter manually</Text>
            <TextInput
              style={styles.input}
              value={formData.species}
              onChangeText={(text) => setFormData({...formData, species: text})}
              placeholder="Enter fish species"
              editable={true}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputGroupHalf]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.weight}
                onChangeText={(text) => setFormData({...formData, weight: text})}
                keyboardType="numeric"
                placeholder="0.0"
              />
            </View>

            <View style={[styles.inputGroup, styles.inputGroupHalf]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={formData.qty}
                onChangeText={(text) => setFormData({...formData, qty: text})}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price Type</Text>
            <View style={styles.priceTypeContainer}>
              {['Retail', 'FL', 'FH'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.priceTypeButton,
                    formData.priceType === type && styles.priceTypeButtonSelected
                  ]}
                  onPress={() => setFormData({...formData, priceType: type})}
                >
                  <Text style={[
                    styles.priceTypeText,
                    formData.priceType === type && styles.priceTypeTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Prediction Loading */}
        {isPredicting && (
          <View style={styles.section}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2ecc71" />
              <Text style={styles.loadingText}>Calculating price prediction...</Text>
              <Text style={styles.loadingSubtext}>This may take a few moments</Text>
            </View>
          </View>
        )}

        {/* Prediction Result */}
        {predictionResult && (
          <View style={[styles.section, styles.resultSection]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="currency-inr" size={20} color="#2ecc71" />
              <Text style={styles.sectionTitle}>Price Prediction</Text>
            </View>
            <View style={styles.resultContainer}>
              <View style={styles.resultRow}>
                <View style={styles.resultLabelContainer}>
                  <Text style={styles.resultLabel}>Species</Text>
                </View>
                <Text style={styles.resultValue}>{predictionResult.species || formData.species}</Text>
              </View>
              
              <View style={styles.resultDivider} />
              
              <View style={styles.resultRow}>
                <View style={styles.resultLabelContainer}>
                  <Text style={styles.resultLabel}>Quantity</Text>
                </View>
                <Text style={styles.resultValue}>{formData.qty} fish</Text>
              </View>
              
              <View style={styles.resultDivider} />
              
              <View style={styles.resultRow}>
                <View style={styles.resultLabelContainer}>
                  <Text style={styles.resultLabel}>Weight</Text>
                </View>
                <Text style={styles.resultValue}>{formData.weight} kg</Text>
              </View>
              
              <View style={styles.resultDivider} />
              
              <View style={styles.resultRow}>
                <View style={styles.resultLabelContainer}>
                  <Text style={styles.resultLabel}>Price Type</Text>
                </View>
                <Text style={styles.resultValue}>{formData.priceType}</Text>
              </View>
              
              <View style={styles.resultDivider} />
              
              {predictionResult.predicted_price && (
                <>
                  <View style={styles.resultRow}>
                    <View style={styles.resultLabelContainer}>
                      <Text style={styles.resultLabel}>Predicted Price</Text>
                    </View>
                    <Text style={[styles.resultValue, styles.priceValue]}>
                      ₹{predictionResult.predicted_price}
                    </Text>
                  </View>
                  
                  <View style={styles.resultDivider} />
                </>
              )}
              
              {predictionResult.price_per_kg && (
                <View style={styles.resultRow}>
                  <View style={styles.resultLabelContainer}>
                    <Text style={styles.resultLabel}>Price per kg</Text>
                  </View>
                  <Text style={[styles.resultValue, styles.priceValue]}>
                    ₹{predictionResult.price_per_kg}/kg
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, (isPredicting || isDetecting) && styles.saveButtonDisabled]} 
          onPress={handleSaveCatch}
          disabled={isPredicting || isDetecting}
        >
          {isPredicting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="calculator" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Calculate Price</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#3498db',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
    lineHeight: 20,
  },
  captureButtonLarge: {
    height: 160,
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  captureText: {
    marginTop: 12,
    color: '#3498db',
    fontWeight: '600',
    fontSize: 16,
  },
  imagePreview: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  imageActionText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#7f8c8d',
  },
  detectedSection: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  detectedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
  },
  detectedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  labelHint: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  priceTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priceTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceTypeButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  priceTypeText: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  priceTypeTextSelected: {
    color: '#fff',
  },
  resultSection: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  resultContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  resultLabelContainer: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  resultValue: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2ecc71',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 30,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
});