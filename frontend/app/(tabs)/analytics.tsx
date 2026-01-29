import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/design';
import { fadeIn, scaleIn } from '../../utils/animations';

const { width } = Dimensions.get('window');

const CATCH_HISTORY = [
  { day: 'Mon', weight: 12, value: 4800 },
  { day: 'Tue', weight: 18, value: 7200 },
  { day: 'Wed', weight: 8, value: 3200 },
  { day: 'Thu', weight: 22, value: 8800 },
  { day: 'Fri', weight: 15, value: 6000 },
  { day: 'Sat', weight: 25, value: 10000 },
  { day: 'Sun', weight: 20, value: 8000 },
];

const BEST_HOURS = [
  { hour: '5am', success: 85 },
  { hour: '6am', success: 92 },
  { hour: '7am', success: 78 },
  { hour: '5pm', success: 72 },
  { hour: '6pm', success: 68 },
];

interface SummaryData {
  totalWeight: number;
  totalValue: number;
  averagePricePerKg: number;
}

interface SpeciesData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [summary, setSummary] = useState<SummaryData>({
    totalWeight: 120,
    totalValue: 48000,
    averagePricePerKg: 400,
  });
  const [timeRange, setTimeRange] = useState('week');
  const [speciesData, setSpeciesData] = useState<SpeciesData[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const getColorForIndex = (index: number): string => {
    const palette = ['#2C7A7B', '#38A169', '#3182CE', '#D69E2E', '#9333EA', '#E53E3E'];
    return palette[index % palette.length];
  };

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          setLoading(false);
          return;
        }

        try {
          const cleanUserId = String(userId).replace(/['"]+/g, '');
          const resp = await fetch(
            `https://hackcelestial-kdg-1.onrender.com/api/catches/summary/${cleanUserId}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
          );
          if (resp.ok) {
            const data: SummaryData = await resp.json();
            if (mounted) setSummary(data);
          }
        } catch (err) {
          console.error('Error fetching summary:', err);
        }

        try {
          const cleanUserId = String(userId).replace(/['"]+/g, '');
          const resp = await fetch(
            `https://hackcelestial-kdg-1.onrender.com/api/catches/species/${cleanUserId}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
          );
          if (resp.ok) {
            const data: any[] = await resp.json();
            const formatted: SpeciesData[] = Array.isArray(data)
              ? data.map((item, index) => ({
                  name: item.species ?? `Species ${index + 1}`,
                  population: Number(item.quantity) || 0,
                  color: getColorForIndex(index),
                  legendFontColor: Colors.textSecondary,
                  legendFontSize: 12,
                }))
              : [];
            if (mounted) setSpeciesData(formatted);
          }
        } catch (err) {
          console.error('Error fetching species data:', err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { mounted = false; };
  }, []);

  const chartConfig = {
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    color: (opacity = 1) => `rgba(44, 122, 123, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: '6',
      strokeWidth: '3',
      stroke: Colors.primary,
      fill: '#fff',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: Colors.divider,
      strokeWidth: 1,
    },
  };

  const summaryCards = [
    { 
      icon: 'scale' as any, 
      label: t('analytics.totalCatch'), 
      value: `${summary.totalWeight}kg`,
      change: '+12%',
      gradient: ['#2C7A7B', '#1D5A5B'],
    },
    { 
      icon: 'cash-multiple' as any, 
      label: t('analytics.revenue'), 
      value: `₹${(summary.totalValue/1000).toFixed(1)}k`,
      change: '+8%',
      gradient: ['#38A169', '#2F855A'],
    },
    { 
      icon: 'trending-up' as any, 
      label: t('analytics.avgPrice'), 
      value: `₹${summary.averagePricePerKg}`,
      change: '+5%',
      gradient: ['#3182CE', '#2B6CB0'],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>{t('analytics.title')}</Text>
              <Text style={styles.pageSubtitle}>{t('analytics.subtitle')}</Text>
            </View>
            
            <View style={styles.timeRangeContainer}>
              {['Day', 'Week', 'Month'].map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[styles.timeButton, timeRange === range.toLowerCase() && styles.activeTimeButton]}
                  onPress={() => setTimeRange(range.toLowerCase())}
                >
                  <Text style={[styles.timeButtonText, timeRange === range.toLowerCase() && styles.activeTimeButtonText]}>
                    {t(`analytics.${range.toLowerCase()}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>

        {/* Summary Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryScroll}
        >
          {summaryCards.map((card, index) => (
            <View key={index} style={styles.summaryCard}>
              <LinearGradient
                colors={card.gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCardGradient}
              >
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryIconCircle}>
                    <Icon name={card.icon} size={22} color="#fff" />
                  </View>
                  <View style={styles.changeBadge}>
                    <Ionicons name="trending-up" size={12} color="#fff" />
                    <Text style={styles.changeText}>{card.change}</Text>
                  </View>
                </View>
                <Text style={styles.summaryValue}>{card.value}</Text>
                <Text style={styles.summaryLabel}>{card.label}</Text>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>

        {/* Catch Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>{t('analytics.catchTrend')}</Text>
              <Text style={styles.chartSubtitle}>{t('analytics.catchTrendSubtitle')}</Text>
            </View>
            <TouchableOpacity style={styles.chartMenuBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <LineChart
            data={{
              labels: CATCH_HISTORY.map(item => item.day),
              datasets: [{ data: CATCH_HISTORY.map(item => item.weight) }],
            }}
            width={width - 72}
            height={200}
            chartConfig={{
              ...chartConfig,
              fillShadowGradient: Colors.primary,
              fillShadowGradientOpacity: 0.15,
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withHorizontalLabels={true}
            withVerticalLabels={true}
          />
        </View>

        {/* Best Fishing Hours */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>{t('analytics.bestHours')}</Text>
              <Text style={styles.chartSubtitle}>{t('analytics.bestHoursSubtitle')}</Text>
            </View>
          </View>
          
          <View style={styles.hoursGrid}>
            {BEST_HOURS.map((item, index) => (
              <View key={index} style={styles.hourItem}>
                <View style={styles.hourBar}>
                  <LinearGradient
                    colors={[Colors.success, '#2F855A']}
                    style={[styles.hourBarFill, { height: `${item.success}%` }]}
                  />
                </View>
                <Text style={styles.hourValue}>{item.success}%</Text>
                <Text style={styles.hourLabel}>{item.hour}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Species Distribution */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>{t('analytics.speciesCaught')}</Text>
              <Text style={styles.chartSubtitle}>{t('analytics.distribution')} {t(`analytics.${timeRange}`)}</Text>
            </View>
          </View>
          
          {speciesData.length > 0 ? (
            <View style={styles.pieContainer}>
              <PieChart
                data={speciesData}
                width={width - 72}
                height={180}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Icon name="fish" size={32} color={Colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>{t('analytics.noCatches')}</Text>
              <Text style={styles.emptyText}>{t('analytics.noCatchesSubtitle')}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#E0E7FF' }]}>
              <Icon name="calendar-check" size={20} color="#4F46E5" />
            </View>
            <View>
              <Text style={styles.quickStatValue}>23</Text>
              <Text style={styles.quickStatLabel}>{t('analytics.trips')}</Text>
            </View>
          </View>
          
          <View style={styles.quickStatCard}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="star" size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.quickStatValue}>4.8</Text>
              <Text style={styles.quickStatLabel}>{t('analytics.avgRating')}</Text>
            </View>
          </View>
          
          <View style={styles.quickStatCard}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#DCFCE7' }]}>
              <Icon name="trophy" size={20} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.quickStatValue}>#12</Text>
              <Text style={styles.quickStatLabel}>{t('analytics.rank')}</Text>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
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
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    ...Shadows.sm,
  },
  timeButton: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 8,
  },
  activeTimeButton: { 
    backgroundColor: Colors.primary,
  },
  timeButtonText: { 
    fontSize: 13, 
    color: Colors.textSecondary, 
    fontWeight: '600',
  },
  activeTimeButtonText: { 
    color: '#fff',
  },

  // Summary Cards
  summaryScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingBottom: 8,
  },
  summaryCard: {
    width: 160,
    height: 160,
    marginRight: 14,
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  summaryCardGradient: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  summaryValue: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#fff',
  },
  summaryLabel: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Chart Cards
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    ...Shadows.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: Colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chartMenuBtn: {
    padding: 8,
  },
  chart: { 
    borderRadius: 16,
    marginLeft: -12,
  },

  // Hours Grid
  hoursGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 10,
  },
  hourItem: {
    flex: 1,
    alignItems: 'center',
  },
  hourBar: {
    width: 32,
    height: 100,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 16,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  hourBarFill: {
    width: '100%',
    borderRadius: 16,
  },
  hourValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  hourLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Pie Container
  pieContainer: {
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 220,
  },

  // Quick Stats
  quickStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.sm,
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quickStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});