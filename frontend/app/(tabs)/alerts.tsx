// app/(tabs)/alerts/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
//import { useTranslation } from 'react-i18next';

// Mock data
const ALERTS = [
  {
    id: 1,
    type: 'weather',
    title: 'High Wind Warning',
    message: 'Wind speeds expected to exceed 40 km/h after 3 PM. Return to shore by 2 PM.',
    priority: 'high',
    timestamp: '2023-10-15T10:30:00Z',
    read: false
  },
  {
    id: 2,
    type: 'regulation',
    title: 'Fishing Restrictions',
    message: 'Fishing restricted in Zone B until next week due to breeding season.',
    priority: 'medium',
    timestamp: '2023-10-14T16:45:00Z',
    read: true
  },
  {
    id: 3,
    type: 'safety',
    title: 'Boundary Alert',
    message: 'You are approaching maritime boundary. Turn back to avoid legal issues.',
    priority: 'high',
    timestamp: '2023-10-13T09:15:00Z',
    read: true
  },
  {
    id: 4,
    type: 'opportunity',
    title: 'Good Fishing Conditions',
    message: 'Ideal conditions reported in North Bay. High probability of tuna catch.',
    priority: 'low',
    timestamp: '2023-10-12T07:00:00Z',
    read: true
  }
];

export default function AlertsScreen() {
  const router = useRouter();
  //const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const markAsRead = (id: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
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
        <Text style={styles.title}>{('alerts')}</Text>
        <TouchableOpacity>
          <Icon name="filter" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {alerts.length > 0 ? (
          alerts.map(alert => (
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
            <Text style={styles.emptyStateText}>{('noAlerts')}</Text>
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
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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