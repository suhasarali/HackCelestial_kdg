import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/design';

// Types
interface AlertItem {
  id: string;
  title: string;
  body: string;
  category: 'weather' | 'regulation' | 'market' | 'safety' | 'general';
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  isRead: boolean;
}

// Mock alerts
const MOCK_ALERTS: AlertItem[] = [
  {
    id: '1',
    title: 'High Wind Warning',
    body: 'Wind speeds expected to reach 45 km/h after 3 PM. Consider returning to shore early.',
    category: 'weather',
    priority: 'high',
    timestamp: '2h ago',
    isRead: false,
  },
  {
    id: '2',
    title: 'Zone B Restricted',
    body: 'Fishing is temporarily restricted in Zone B due to spawning season. Effective until next week.',
    category: 'regulation',
    priority: 'high',
    timestamp: '4h ago',
    isRead: false,
  },
  {
    id: '3',
    title: 'Pomfret Prices Up',
    body: 'Silver pomfret prices have increased by 18% at Mumbai market. Good time to sell!',
    category: 'market',
    priority: 'medium',
    timestamp: '6h ago',
    isRead: true,
  },
  {
    id: '4',
    title: 'Coast Guard Advisory',
    body: 'Regular patrols scheduled in sectors 4-7 today. Ensure all documentation is on board.',
    category: 'safety',
    priority: 'medium',
    timestamp: '8h ago',
    isRead: true,
  },
  {
    id: '5',
    title: 'Favorable Conditions Tomorrow',
    body: 'Clear skies and calm waters expected tomorrow. Perfect fishing conditions forecast.',
    category: 'weather',
    priority: 'low',
    timestamp: '12h ago',
    isRead: true,
  },
];



export default function AlertsScreen() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_ALERTS);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'weather':
        return { 
          icon: 'weather-windy', 
          color: '#3B82F6', 
          bgColor: '#DBEAFE',
          label: t('alerts.catWeather')
        } as const;
      case 'regulation':
        return { 
          icon: 'file-document', 
          color: '#9333EA', 
          bgColor: '#F3E8FF',
          label: t('alerts.catRegulation')
        } as const;
      case 'market':
        return { 
          icon: 'trending-up', 
          color: '#16A34A', 
          bgColor: '#DCFCE7',
          label: t('alerts.catMarket')
        } as const;
      case 'safety':
        return { 
          icon: 'shield-check', 
          color: '#EA580C', 
          bgColor: '#FFEDD5',
          label: t('alerts.catSafety')
        } as const;
      default:
        return { 
          icon: 'bell', 
          color: Colors.primary, 
          bgColor: Colors.primary + '15',
          label: t('alerts.catGeneral')
        } as const;
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { color: Colors.error, bg: '#FEE2E2', label: t('alerts.prioUrgent') };
      case 'medium':
        return { color: Colors.warning, bg: '#FEF3C7', label: t('alerts.prioImportant') };
      default:
        return { color: Colors.success, bg: '#DCFCE7', label: t('alerts.prioInfo') };
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : filter === 'unread'
      ? alerts.filter(a => !a.isRead)
      : alerts.filter(a => a.category === filter);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, isRead: true })));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>{t('alerts.title')}</Text>
            <Text style={styles.pageSubtitle}>
              {unreadCount > 0 ? `${unreadCount} ${t('alerts.unreadNotifications')}` : t('alerts.allCaughtUp')}
            </Text>
          </View>
          
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markReadBtn} onPress={markAllAsRead}>
              <Ionicons name="checkmark-done" size={18} color={Colors.primary} />
              <Text style={styles.markReadText}>{t('alerts.markAllRead')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {[
            { key: 'all', label: t('alerts.filterAll'), count: alerts.length },
            { key: 'unread', label: t('alerts.filterUnread'), count: unreadCount },
            { key: 'weather', label: t('alerts.filterWeather') },
            { key: 'regulation', label: t('alerts.filterRegulation') },
            { key: 'market', label: t('alerts.filterMarket') },
            { key: 'safety', label: t('alerts.filterSafety') },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterPill, filter === item.key && styles.filterPillActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterPillText, filter === item.key && styles.filterPillTextActive]}>
                {item.label}
              </Text>
              {item.count !== undefined && item.count > 0 && (
                <View style={[styles.filterBadge, filter === item.key && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, filter === item.key && styles.filterBadgeTextActive]}>
                    {item.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={40} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>{t('alerts.noAlerts')}</Text>
            <Text style={styles.emptyText}>{t('alerts.noAlertsMsg')}</Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => {
            const categoryConfig = getCategoryConfig(alert.category);
            const priorityConfig = getPriorityConfig(alert.priority);

            return (
              <TouchableOpacity
                key={alert.id}
                style={[styles.alertCard, !alert.isRead && styles.alertCardUnread]}
                onPress={() => markAsRead(alert.id)}
                activeOpacity={0.7}
              >
                {/* Unread indicator */}
                {!alert.isRead && <View style={styles.unreadDot} />}
                
                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.bgColor }]}>
                      <Icon name={categoryConfig.icon} size={14} color={categoryConfig.color} />
                      <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
                        {categoryConfig.label}
                      </Text>
                    </View>
                    
                    {alert.priority !== 'low' && (
                      <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
                        <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                          {priorityConfig.label}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertBody}>{alert.body}</Text>
                  
                  <View style={styles.alertFooter}>
                    <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
                    <TouchableOpacity style={styles.alertAction}>
                      <Text style={styles.alertActionText}>{t('alerts.viewDetails')}</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Filters
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    gap: 6,
    ...Shadows.sm,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterBadgeTextActive: {
    color: '#fff',
  },

  // Alert Cards
  alertCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
    ...Shadows.md,
  },
  alertCardUnread: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  unreadDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  alertContent: {},
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  alertBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  alertTimestamp: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  alertAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
});