import axios from 'axios';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
// Replace with your machine's IP address if testing on a physical device
const BASE_URL = 'https://hackcelestial-kdg.onrender.com';

export const uploadImage = async (imageUri: string): Promise<string | null> => {
  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // @ts-ignore: FormData expects specific structure in React Native
    formData.append('image', { uri: imageUri, name: filename, type });

    const response = await axios.post(`${BASE_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.success) {
      return response.data.imageUrl;
    }
    return null;
  } catch (error) {
    console.error("Image upload error:", error);
    return null;
  }
};
