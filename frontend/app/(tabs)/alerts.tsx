import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { useAlerts } from '../../context/AlertContext'; // Context import kept but usage is modified

// --- DUMMY ALERT DATA ---
const DUMMY_ALERTS = [
  {
    id: 'd-1',
    title: 'Strong Winds Ahead',
    message: 'High wind advisory near the coast (Lat: 19.0, Lon: 72.8). Secure all gear.',
    type: 'weather',
    priority: 'high',
    read: false,
    timestamp: Date.now() - 3600000, // 1 hour ago
  },
  {
    id: 'd-2',
    title: 'New Regulation Update',
    message: 'New zone restrictions effective immediately for Catla fishing. Check map boundaries.',
    type: 'regulation',
    priority: 'medium',
    read: false,
    timestamp: Date.now() - 7200000, // 2 hours ago
  },
  {
    id: 'd-3',
    title: 'Peak Fishing Opportunity',
    message: 'Increased fish probability detected 5km East of your current location. Move fast!',
    type: 'opportunity',
    priority: 'low',
    read: true,
    timestamp: Date.now() - 10800000, // 3 hours ago
  },
];
// --- END DUMMY ALERT DATA ---

// Define a type for the alert for clarity and to satisfy TypeScript
interface AlertItem {
    id: string;
    title: string;
    message: string;
    type: string;
    priority: 'low' | 'medium' | 'high' | string;
    read: boolean;
    timestamp: number;
}


export default function AlertsScreen() {
  const router = useRouter();
  
  // 1. Initialize state with the DUMMY_ALERTS
  const [localAlerts, setLocalAlerts] = useState<AlertItem[]>(DUMMY_ALERTS); 
  const [refreshing, setRefreshing] = useState(false);

  // Note: The useAlerts context hook is temporarily ignored for rendering dummy data, 
  // but the logic relies on localAlerts state now.

  const onRefresh = async () => {
    setRefreshing(true);
    // In a real app, you would fetch new alerts here.
    // For this dummy example, we just wait and reset:
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsRead = (id: string) => {
    setLocalAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#3498db';
      default: return '#7f8c8d';
    }
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'weather': return 'weather-windy';
      case 'regulation': return 'alert-circle';
      case 'safety': return 'shield-alert';
      case 'opportunity': return 'fish';
      default: return 'bell';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <TouchableOpacity>
          <Icon name="filter" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 2. Render localAlerts */}
        {localAlerts.length > 0 ? (
          localAlerts.map(alert => (
            <TouchableOpacity 
              key={alert.id}
              style={[styles.alertCard, !alert.read && styles.unreadAlert]}
              onPress={() => markAsRead(alert.id)}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertTitleContainer}>
                  <Icon 
                    name={getIconName(alert.type)} 
                    size={20} 
                    color={getPriorityColor(alert.priority)} 
                  />
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(alert.priority) }]}>
                  <Text style={styles.priorityText}>{alert.priority}</Text>
                </View>
              </View>
              
              <Text style={styles.alertMessage}>{alert.message}</Text>
              
              <View style={styles.alertFooter}>
                <Text style={styles.timestamp}>
                  {new Date(alert.timestamp).toLocaleDateString()} • {new Date(alert.timestamp).toLocaleTimeString()}
                </Text>
                {!alert.read && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>New</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="bell-off" size={48} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>No alerts right now</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ecf0f1',
    elevation: 2,

  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  alertMessage: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 12,
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
    textAlign: 'center',
  },
});