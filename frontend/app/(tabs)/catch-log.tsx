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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

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
        const species = result.class || result.species || 'Unknown';
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
        <Text style={styles.message}>{('cameraPermission')}</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{('grantPermission')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isCameraActive) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <Ionicons name="camera" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsCameraActive(false)}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
      <Text style={styles.title}>{('logCatch')}</Text>

      {/* Image Capture */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{('capturePhoto')}</Text>
        {capturedImage ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: capturedImage }} style={styles.image} />
            <TouchableOpacity 
              style={styles.retakeButton}
              onPress={() => setIsCameraActive(true)}
            >
              <Text style={styles.retakeText}>{('retakePhoto')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.captureButtonLarge}
            onPress={() => setIsCameraActive(true)}
          >
            <Ionicons name="camera" size={48} color="#3498db" />
            <Text style={styles.captureText}>{('takePhoto')}</Text>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Species</Text>
          <Text style={styles.detectedText}>{detectedSpecies}</Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{('Catch Details')}</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Species (Auto-detected or manual)</Text>
          <TextInput
            style={styles.input}
            value={formData.species}
            onChangeText={(text) => setFormData({...formData, species: text})}
            placeholder="Fish species"
            editable={true}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{('weight')} (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.weight}
            onChangeText={(text) => setFormData({...formData, weight: text})}
            keyboardType="numeric"
            placeholder="Enter weight"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{('Qty.')} (numeric)</Text>
          <TextInput
            style={styles.input}
            value={formData.qty}
            onChangeText={(text) => setFormData({...formData, qty: text})}
            keyboardType="numeric"
            placeholder="Enter qty. of fishes caught"
          />
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
          </View>
        </View>
      )}

      {/* Prediction Result */}
      {predictionResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Prediction Result</Text>
          <View style={styles.resultContainer}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Species:</Text>
              <Text style={styles.resultValue}>{predictionResult.species || formData.species}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Quantity:</Text>
              <Text style={styles.resultValue}>{formData.qty} fish</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Weight:</Text>
              <Text style={styles.resultValue}>{formData.weight} kg</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Price Type:</Text>
              <Text style={styles.resultValue}>{formData.priceType}</Text>
            </View>
            {predictionResult.predicted_price && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Predicted Price:</Text>
                <Text style={[styles.resultValue, styles.priceValue]}>
                  ₹{predictionResult.predicted_price}
                </Text>
              </View>
            )}
            {predictionResult.price_per_kg && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Price per kg:</Text>
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
          <Text style={styles.saveButtonText}>Calculate Price</Text>
        )}
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: 16,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#3498db',
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonLarge: {
    height: 200,
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  captureText: {
    marginTop: 12,
    color: '#3498db',
    fontWeight: 'bold',
  },
  imagePreview: {
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 6,
  },
  retakeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ocrText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesButton: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    minWidth: 80,
  },
  speciesButtonSelected: {
    backgroundColor: '#3498db',
  },
  speciesText: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  speciesLocalText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  detectedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
  },
  priceTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priceTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  priceTypeButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  priceTypeText: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  priceTypeTextSelected: {
    color: '#fff',
  },
  resultContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  resultValue: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
});