import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Shadows } from '../../constants/design';

const { width } = Dimensions.get('window');

// --- Interfaces ---
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

interface WeeklyData {
  day: string;
  weight: number;
}

// Fallback data prevents crashes if API is empty
const FALLBACK_WEEKLY_DATA: WeeklyData[] = [
  { day: 'Mon', weight: 0 },
  { day: 'Tue', weight: 0 },
  { day: 'Wed', weight: 0 },
  { day: 'Thu', weight: 0 },
  { day: 'Fri', weight: 0 },
  { day: 'Sat', weight: 0 },
  { day: 'Sun', weight: 0 },
];

const BEST_HOURS = [
  { hour: '5am', success: 85 },
  { hour: '6am', success: 92 },
  { hour: '7am', success: 78 },
  { hour: '5pm', success: 72 },
  { hour: '6pm', success: 68 },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // --- State ---
  const [summary, setSummary] = useState<SummaryData>({
    totalWeight: 0,
    totalValue: 0,
    averagePricePerKg: 0,
  });
  
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyData[]>([]);
  const [speciesData, setSpeciesData] = useState<SpeciesData[]>([]);
  
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);

  // --- Animations ---
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

  // --- Data Fetching ---
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      console.log('[DEBUG] Analytics Screen Focused');

      const fetchAll = async () => {
        setLoading(true);
        try {
          // 1. Get User ID
          const userId = await AsyncStorage.getItem('userId');
          
          if (!userId) {
            console.log("No User ID found");
            setLoading(false);
            return;
          }

          const cleanUserId = String(userId).replace(/['"]+/g, '');
          console.log("[DEBUG] Fetching for User:", cleanUserId);

          // 2. Fetch Summary
          try {
            const summaryUrl = `https://hackcelestial-kdg-1.onrender.com/api/catches/summary/${cleanUserId}`;
            const summaryResp = await fetch(summaryUrl);
            
            if (summaryResp.ok) {
              const data = await summaryResp.json();
              if (mounted) setSummary(data);
            }
          } catch (err) {
            console.error('[DEBUG] Summary Fetch Error:', err);
          }

          // 3. Fetch Weekly History (FIXED MAPPING HERE)
          try {
            const historyUrl = `https://hackcelestial-kdg-1.onrender.com/api/catches/weekly/${cleanUserId}`;
            const historyResp = await fetch(historyUrl);
            
            if (historyResp.ok) {
              const rawData = await historyResp.json();
              console.log("[DEBUG] History Raw Data:", JSON.stringify(rawData));

              if (Array.isArray(rawData) && rawData.length > 0) {
                // FIXED: Map 'quantity' to 'weight'
                const formattedHistory = rawData.map((item: any) => ({
                    day: item.day ? String(item.day).substring(0, 3) : '?', 
                    weight: Number(item.quantity) || 0  // <--- CHANGED FROM item.weight TO item.quantity
                }));
                
                console.log("[DEBUG] Formatted History:", JSON.stringify(formattedHistory));
                if (mounted) setWeeklyHistory(formattedHistory);
              } else {
                if (mounted) setWeeklyHistory(FALLBACK_WEEKLY_DATA);
              }
            } else {
              if (mounted) setWeeklyHistory(FALLBACK_WEEKLY_DATA);
            }
          } catch (err) {
            console.error('[DEBUG] History Exception:', err);
            if (mounted) setWeeklyHistory(FALLBACK_WEEKLY_DATA);
          }

          // 4. Fetch Species
          try {
            const speciesUrl = `https://hackcelestial-kdg-1.onrender.com/api/catches/species/${cleanUserId}`;
            const speciesResp = await fetch(speciesUrl);
            
            if (speciesResp.ok) {
              const data: any[] = await speciesResp.json();
              
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
            console.error('[DEBUG] Species Fetch Error:', err);
          }

        } finally {
          if (mounted) setLoading(false);
        }
      };

      fetchAll();
      return () => { mounted = false; };
    }, [])
  );

  // --- Chart Configuration ---
  const chartConfig = {
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    color: (opacity = 1) => `rgba(44, 122, 123, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: Colors.primary,
      fill: '#fff',
    },
    propsForBackgroundLines: {
      strokeDasharray: '4', 
      stroke: Colors.divider,
      strokeWidth: 1,
    },
  };

  const summaryCards = [
    { 
      icon: 'scale' as any, 
      label: t('analytics.totalCatch') || 'Total Catch', 
      value: `${summary.totalWeight || 0}kg`,
      change: '+12%',
      gradient: ['#2C7A7B', '#1D5A5B'],
    },
    { 
      icon: 'cash-multiple' as any, 
      label: t('analytics.revenue') || 'Revenue', 
      value: `₹${((summary.totalValue || 0)/1000).toFixed(1)}k`,
      change: '+8%',
      gradient: ['#38A169', '#2F855A'],
    },
    { 
      icon: 'trending-up' as any, 
      label: t('analytics.avgPrice') || 'Avg Price', 
      value: `₹${summary.averagePricePerKg || 0}`,
      change: '+5%',
      gradient: ['#3182CE', '#2B6CB0'],
    },
  ];

  // --- Safe Data Helper ---
  const getChartData = () => {
    if (!weeklyHistory || weeklyHistory.length === 0) {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
      };
    }

    const labels = weeklyHistory.map(item => item.day);
    const dataPoints = weeklyHistory.map(item => item.weight);

    return {
      labels: labels,
      datasets: [{ 
        data: dataPoints.length > 0 ? dataPoints : [0] 
      }]
    };
  };

  if (loading && !summary.totalWeight) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
              <Text style={styles.pageTitle}>{t('analytics.title') || 'Analytics'}</Text>
              <Text style={styles.pageSubtitle}>{t('analytics.subtitle') || 'Overview & Insights'}</Text>
            </View>
            
            <View style={styles.timeRangeContainer}>
              {['Day', 'Week', 'Month'].map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[styles.timeButton, timeRange === range.toLowerCase() && styles.activeTimeButton]}
                  onPress={() => setTimeRange(range.toLowerCase())}
                >
                  <Text style={[styles.timeButtonText, timeRange === range.toLowerCase() && styles.activeTimeButtonText]}>
                    {t(`analytics.${range.toLowerCase()}`) || range}
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
                <View>
                    <Text style={styles.summaryValue}>{card.value}</Text>
                    <Text style={styles.summaryLabel}>{card.label}</Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>

        {/* Catch Trend Chart (Dynamic) */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>{t('analytics.catchTrend') || 'Weekly Catch'}</Text>
              <Text style={styles.chartSubtitle}>{t('analytics.catchTrendSubtitle') || 'Weight (kg) over time'}</Text>
            </View>
            <TouchableOpacity style={styles.chartMenuBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <LineChart
            data={getChartData()}
            width={width - 56} 
            height={220}
            chartConfig={{
              ...chartConfig,
              fillShadowGradient: Colors.primary,
              fillShadowGradientOpacity: 0.1,
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            yAxisSuffix="kg"
            fromZero={true}
          />
        </View>

        {/* Best Fishing Hours */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>{t('analytics.bestHours') || 'Best Hours'}</Text>
              <Text style={styles.chartSubtitle}>{t('analytics.bestHoursSubtitle') || 'Based on success rate'}</Text>
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
              <Text style={styles.chartTitle}>{t('analytics.speciesCaught') || 'Species'}</Text>
              <Text style={styles.chartSubtitle}>{t('analytics.distribution') || 'Distribution'} {t(`analytics.${timeRange}`) || timeRange}</Text>
            </View>
          </View>
          
          {speciesData.length > 0 ? (
            <View style={styles.pieContainer}>
              <PieChart
                data={speciesData}
                width={width - 56}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[0, 0]}
                absolute
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Icon name="fish" size={32} color={Colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>{t('analytics.noCatches') || 'No Data'}</Text>
              <Text style={styles.emptyText}>{t('analytics.noCatchesSubtitle') || 'Start fishing to see stats'}</Text>
            </View>
          )}
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
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
    fontSize: 26, 
    fontWeight: '700', 
    color: '#fff',
    marginTop: 8,
  },
  summaryLabel: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.9)',
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
    marginLeft: -16, 
    marginTop: 10,
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
});