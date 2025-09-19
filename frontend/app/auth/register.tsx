// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Link, router } from 'expo-router';
// import { useAuth } from '../context/AuthContext';

// export default function RegisterScreen() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { register } = useAuth();

//   const handleRegister = async () => {
//     // Validation
//     if (!name || !email || !password || !confirmPassword) {
//       Alert.alert('Error', 'Please fill in all fields');
//       return;
//     }

//     // Email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       Alert.alert('Error', 'Please enter a valid email address');
//       return;
//     }

//     // Password validation
//     if (password.length < 6) {
//       Alert.alert('Error', 'Password should be at least 6 characters');
//       return;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert('Error', 'Passwords do not match');
//       return;
//     }

//     setLoading(true);
    
//     const success = await register(name, email, password);
//     setLoading(false);
    
//     if (success) {
//       router.replace('/(tabs)/home' as any);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <KeyboardAvoidingView 
//         style={styles.keyboardContainer}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <Text style={styles.title}>Create Account</Text>
//         <Text style={styles.subtitle}>Sign up to get started</Text>

//         <View style={styles.form}>
//           <TextInput
//             style={styles.input}
//             placeholder="Full Name"
//             value={name}
//             onChangeText={setName}
//             autoCapitalize="words"
//             editable={!loading}
//           />
//           <TextInput
//             style={styles.input}
//             placeholder="Email"
//             value={email}
//             onChangeText={setEmail}
//             autoCapitalize="none"
//             keyboardType="email-address"
//             editable={!loading}
//           />
//           <TextInput
//             style={styles.input}
//             placeholder="Password"
//             value={password}
//             onChangeText={setPassword}
//             secureTextEntry
//             editable={!loading}
//           />
//           <TextInput
//             style={styles.input}
//             placeholder="Confirm Password"
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//             secureTextEntry
//             editable={!loading}
//           />

//           <TouchableOpacity 
//             style={[styles.button, loading && styles.buttonDisabled]} 
//             onPress={handleRegister}
//             disabled={loading}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.buttonText}>Create Account</Text>
//             )}
//           </TouchableOpacity>

//           <View style={styles.footer}>
//             <Text style={styles.footerText}>Already have an account? </Text>
//             <Link href="/auth/login" asChild>
//               <TouchableOpacity disabled={loading}>
//                 <Text style={styles.link}>Sign In</Text>
//               </TouchableOpacity>
//             </Link>
//           </View>
//         </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   keyboardContainer: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     padding: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   subtitle: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 30,
//     color: '#666',
//   },
//   form: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   input: {
//     height: 50,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     fontSize: 16,
//   },
//   button: {
//     backgroundColor: '#007AFF',
//     height: 50,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   buttonDisabled: {
//     opacity: 0.7,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   footer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 20,
//   },
//   footerText: {
//     color: '#666',
//   },
//   link: {
//     color: '#007AFF',
//     fontWeight: 'bold',
//   },
// });


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground, // Import ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons'; // Import icons

// A placeholder ocean image. Replace with your own!
const oceanImage = { uri: 'https://unsplash.com/photos/a-group-of-fish-swimming-in-an-aquarium-sInnJmPJfCw' };

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // New fields
  const [boatLicenseId, setBoatLicenseId] = useState('');
  const [experience, setExperience] = useState('');
  const [port, setPort] = useState('');

  const [loading, setLoading] = useState(false);
  
  // State for the information tooltip
  const [tooltip, setTooltip] = useState({ visible: false, message: '' });

  const { register } = useAuth();
  
  // Effect to hide the tooltip after 5 seconds
  useEffect(() => {
    if (tooltip.visible) {
      const timer = setTimeout(() => {
        setTooltip({ visible: false, message: '' });
      }, 5000);
      return () => clearTimeout(timer); // Cleanup timer on component unmount or if tooltip changes
    }
  }, [tooltip]);


  const showTooltip = (message: string) => {
    setTooltip({ visible: true, message });
  };

  const handleRegister = async () => {
    // Updated validation to include new fields
    if (!name || !email || !password || !confirmPassword || !boatLicenseId || !experience || !port) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    // IMPORTANT: You'll need to update your `register` function in `AuthContext`
    // to accept these new fields (boatLicenseId, experience, port).
    const success = await register(name, email, password, {
      boatLicenseId,
      experience,
      port,
    });

    setLoading(false);

    if (success) {
      router.replace('/(tabs)/home' as any);
    }
  };

  return (
    <ImageBackground source={oceanImage} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <Text style={styles.title}>Create an Account</Text>
              <Text style={styles.subtitle}>Join our fishing community</Text>

              {/* Tooltip Display Area */}
              {tooltip.visible && (
                <View style={styles.tooltipContainer}>
                  <Text style={styles.tooltipText}>{tooltip.message}</Text>
                </View>
              )}

              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!loading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Boat License ID"
                  placeholderTextColor="#999"
                  value={boatLicenseId}
                  onChangeText={setBoatLicenseId}
                  autoCapitalize="none"
                  editable={!loading}
                />
                
                {/* Experience Field with Info Icon */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Experience (in years)"
                    placeholderTextColor="#999"
                    value={experience}
                    onChangeText={setExperience}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => showTooltip('Enter the number of years you have been a fisherman.')}>
                    <Ionicons name="information-circle-outline" size={24} color="#007AFF" style={styles.infoIcon} />
                  </TouchableOpacity>
                </View>

                {/* Port Field with Info Icon */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Port / Region"
                    placeholderTextColor="#999"
                    value={port}
                    onChangeText={setPort}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => showTooltip('Enter the port or region where you primarily fish.')}>
                    <Ionicons name="information-circle-outline" size={24} color="#007AFF" style={styles.infoIcon} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!loading}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <Link href="/auth/login" asChild>
                    <TouchableOpacity disabled={loading}>
                      <Text style={styles.link}>Sign In</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 20, 40, 0.75)', // Dark blue overlay
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Container should be transparent
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#fff', // White text
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#ddd', // Light grey text
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white form
    padding: 25,
    borderRadius: 15,
  },
  input: {
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  inputWithIcon: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  infoIcon: {
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#007AFF', // A nice blue
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
    backgroundColor: '#0056b3'
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#333',
    fontSize: 15,
  },
  link: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tooltipContainer: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: 'center',
    elevation: 5,
  },
  tooltipText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});