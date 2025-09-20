import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../../constants/design';
import { fadeIn, scaleIn } from '../../utils/animations';

// Mock fallback data
const BEST_HOURS = [
  { hour: '5-6 AM', success: 80 },
  { hour: '6-7 AM', success: 85 },
  { hour: '7-8 AM', success: 75 },
  { hour: '4-5 PM', success: 70 },
  { hour: '5-6 PM', success: 65 },
];

export default function AnalyticsScreen() {
  const router = useRouter();

  const [summary, setSummary] = useState({
    totalWeight: 0,
    totalValue: 0,
    averagePricePerKg: 0,
  });
  const [timeRange, setTimeRange] = useState('week');
  const [dailyData, setDailyData] = useState([]);
  const [speciesData, setSpeciesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([fadeIn(fadeAnim, 800), scaleIn(scaleAnim, 600)]).start();
    setTimeout(() => {
      fadeIn(chartAnim, 400).start();
    }, 300);
  }, [fadeAnim, scaleAnim, chartAnim]);

  const getColorForIndex = (index) => {
    const palette = [
      Colors.primary ?? '#3498db',
      Colors.secondary ?? '#2ecc71',
      Colors.accent ?? '#f39c12',
      '#FF9800',
      '#4CAF50',
      '#9C27B0',
    ];
    return palette[index % palette.length];
  };

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          console.warn('No userId found in storage');
          setLoading(false);
          return;
        }

        // 1) Summary API
        try {
          const resp = await fetch(
            `https://hackcelestial-kdg-1.onrender.com/api/catches/summary/${userId}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }
          );
          if (resp.ok) {
            const data = await resp.json();
            console.log('Summary data:', data);
            if (mounted) setSummary(data);
          } else {
            console.warn('Summary fetch failed:', resp.status);
          }
        } catch (err) {
          console.error('Error fetching summary:', err);
        }

        // 2) Daily Catch API
        try {
          const resp = await fetch(
            `https://hackcelestial-kdg-1.onrender.com/api/catches/weekly/${userId}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }
          );
          if (resp.ok) {
            const data = await resp.json();
            console.log('Daily data:', data);
            const formatted = Array.isArray(data)
              ? data.map((item) => ({
                  day: typeof item.day === 'string' ? item.day.slice(0, 3) : item.day,
                  quantity: Number(item.quantity) || 0,
                }))
              : [];
            if (mounted) setDailyData(formatted);
          } else {
            console.warn('Daily fetch failed:', resp.status);
          }
        } catch (err) {
          console.error('Error fetching daily data:', err);
        }

        // 3) Species API
        try {
          const resp = await fetch(
            `https://hackcelestial-kdg-1.onrender.com/api/catches/species/${userId}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }
          );
          if (resp.ok) {
            const data = await resp.json();
            console.log('Species data:', data);
            const formatted = Array.isArray(data)
              ? data.map((item, index) => ({
                  name: item.species ?? `Species ${index + 1}`,
                  population: Number(item.quantity) || 0,
                  color: getColorForIndex(index),
                  legendFontColor: '#333',
                  legendFontSize: 14,
                }))
              : [];
            if (mounted) setSpeciesData(formatted);
          } else {
            console.warn('Species fetch failed:', resp.status);
          }
        } catch (err) {
          console.error('Error fetching species data:', err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  const chartLabels =
    dailyData.length > 0
      ? dailyData.map((i) => i.day)
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartQuantities =
    dailyData.length > 0 ? dailyData.map((i) => i.quantity) : [0, 0, 0, 0, 0, 0, 0];

  const chartConfig = {
    backgroundGradientFrom: Colors.surface ?? '#fff',
    backgroundGradientTo: Colors.surface ?? '#fff',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors.primary ?? '#0b84ff',
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: Colors.textTertiary ?? '#e6e6e6',
      strokeWidth: 1,
    },
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View
        style={[
          styles.animatedContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header */}
          <Animated.View style={styles.header}>
            <Text style={styles.title}>Analytics</Text>
            <View style={styles.timeRangeSelector}>
              {['day', 'week', 'month'].map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[styles.timeButton, timeRange === range && styles.activeTimeButton]}
                  onPress={() => setTimeRange(range)}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      timeRange === range && styles.activeTimeButtonText,
                    ]}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Summary Cards */}
          <Animated.View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Icon name="weight" size={24} color={Colors.primary} />
              <Text style={styles.summaryValue}>{summary.totalWeight} kg</Text>
              <Text style={styles.summaryLabel}>Total Catch</Text>
            </View>
            <View style={styles.summaryCard}>
              <Icon name="cash" size={24} color={Colors.secondary} />
              <Text style={styles.summaryValue}>₹{summary.totalValue}</Text>
              <Text style={styles.summaryLabel}>Total Value</Text>
            </View>
            <View style={styles.summaryCard}>
              <Icon name="chart-line" size={24} color={Colors.accent} />
              <Text style={styles.summaryValue}>₹{summary.averagePricePerKg}/kg</Text>
              <Text style={styles.summaryLabel}>Avg Price</Text>
            </View>
          </Animated.View>

          {/* Catch History */}
          <Animated.View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Catch History</Text>
            <LineChart
              data={{ labels: chartLabels, datasets: [{ data: chartQuantities }] }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Animated.View>

          {/* Species Distribution */}
          <Animated.View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Species Distribution</Text>
            {speciesData.length > 0 ? (
              <PieChart
                data={speciesData}
                width={Dimensions.get('window').width - 32}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            ) : (
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#777' }}>
                No species data available
              </Text>
            )}
          </Animated.View>

          {/* Best Fishing Hours */}
          <Animated.View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Best Fishing Hours</Text>
            <BarChart
              data={{
                labels: BEST_HOURS.map((item) => item.hour),
                datasets: [{ data: BEST_HOURS.map((item) => item.success) }],
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
              }}
              yAxisSuffix="%"
              showValuesOnTopOfBars
              style={styles.chart}
            />
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { ...Layout.container, backgroundColor: Colors.background ?? '#f5f6fa' },
  animatedContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md ?? 12,
    paddingHorizontal: Spacing.md ?? 16,
    paddingTop: Spacing.sm ?? 8,
  },
  title: {
    fontSize: Typography.fontSize?.['3xl'] ?? 24,
    fontWeight: Typography.fontWeight?.bold ?? '700',
    color: Colors.textPrimary ?? '#2c3e50',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface ?? '#fff',
    borderRadius: BorderRadius.lg ?? 12,
    padding: Spacing.xs ?? 6,
    ...Shadows.sm,
  },
  timeButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  activeTimeButton: { backgroundColor: Colors.primary ?? '#0b84ff' },
  timeButtonText: { fontSize: 12, color: '#7f8c8d', fontWeight: '500' },
  activeTimeButtonText: { color: '#fff' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    marginHorizontal: 4,
  },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginTop: 8 },
  summaryLabel: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    marginHorizontal: 16,
  },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#2c3e50' },
  chart: { borderRadius: 8 },
});
