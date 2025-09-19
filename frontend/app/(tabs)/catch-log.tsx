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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';

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
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [formData, setFormData] = useState({
    species: '',
    weight: '',
    price: '',
    notes: ''
  });

  const cameraRef = useRef<any>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
        setIsCameraActive(false);
        // OCR processing would go here
        setOcrText('₹450/kg'); // Mock OCR result
        setFormData({...formData, price: '450'});
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const handleSaveCatch = () => {
    // Save logic here
    Alert.alert('Success', 'Catch logged successfully!');
    router.back();
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
              <Icon name="camera" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsCameraActive(false)}
            >
              <Icon name="close" size={32} color="#fff" />
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
            <Icon name="camera" size={48} color="#3498db" />
            <Text style={styles.captureText}>{('takePhoto')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* OCR Result */}
      {ocrText && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{('detectedPrice')}</Text>
          <Text style={styles.ocrText}>{ocrText}</Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{('catchDetails')}</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{('species')}</Text>
          <View style={styles.speciesGrid}>
            {FISH_SPECIES.map(species => (
              <TouchableOpacity
                key={species.id}
                style={[
                  styles.speciesButton,
                  formData.species === species.name && styles.speciesButtonSelected
                ]}
                onPress={() => setFormData({...formData, species: species.name})}
              >
                <Text style={styles.speciesText}>{species.name}</Text>
                <Text style={styles.speciesLocalText}>{species.localName}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
          <Text style={styles.label}>{('price')} (₹/kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({...formData, price: text})}
            keyboardType="numeric"
            placeholder="Enter price per kg"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{('notes')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({...formData, notes: text})}
            multiline
            numberOfLines={3}
            placeholder="Additional notes"
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveCatch}>
        <Text style={styles.saveButtonText}>{('saveCatch')}</Text>
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
});