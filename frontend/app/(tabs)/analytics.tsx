// app/(tabs)/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';

// Mock data
const CATCH_HISTORY = [
  { day: 'Mon', weight: 12, value: 4800 },
  { day: 'Tue', weight: 18, value: 7200 },
  { day: 'Wed', weight: 8, value: 3200 },
  { day: 'Thu', weight: 22, value: 8800 },
  { day: 'Fri', weight: 15, value: 6000 },
  { day: 'Sat', weight: 25, value: 10000 },
  { day: 'Sun', weight: 0, value: 0 },
];

const SPECIES_DATA = [
  { name: 'Rohu', population: 35, color: '#3498db', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  { name: 'Catla', population: 25, color: '#2ecc71', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  { name: 'Mackerel', population: 20, color: '#f39c12', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  { name: 'Others', population: 20, color: '#e74c3c', legendFontColor: '#7F7F7F', legendFontSize: 15 },
];

const BEST_HOURS = [
  { hour: '5-6 AM', success: 80 },
  { hour: '6-7 AM', success: 85 },
  { hour: '7-8 AM', success: 75 },
  { hour: '4-5 PM', success: 70 },
  { hour: '5-6 PM', success: 65 },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('week');

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
      <View style={styles.header}>
        <Text style={styles.title}>{('analytics')}</Text>
        <View style={styles.timeRangeSelector}>
          <TouchableOpacity 
            style={[styles.timeButton, timeRange === 'day' && styles.activeTimeButton]}
            onPress={() => setTimeRange('day')}
          >
            <Text style={[styles.timeButtonText, timeRange === 'day' && styles.activeTimeButtonText]}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeButton, timeRange === 'week' && styles.activeTimeButton]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[styles.timeButtonText, timeRange === 'week' && styles.activeTimeButtonText]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeButton, timeRange === 'month' && styles.activeTimeButton]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[styles.timeButtonText, timeRange === 'month' && styles.activeTimeButtonText]}>Month</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Icon name="weight" size={24} color="#3498db" />
          <Text style={styles.summaryValue}>100 kg</Text>
          <Text style={styles.summaryLabel}>{('totalCatch')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="cash" size={24} color="#2ecc71" />
          <Text style={styles.summaryValue}>₹40,000</Text>
          <Text style={styles.summaryLabel}>{('totalValue')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="chart-line" size={24} color="#f39c12" />
          <Text style={styles.summaryValue}>₹400/kg</Text>
          <Text style={styles.summaryLabel}>{('avgPrice')}</Text>
        </View>
      </View>

      {/* Catch History Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{('catchHistory')}</Text>
        <LineChart
          data={{
            labels: CATCH_HISTORY.map(item => item.day),
            datasets: [
              {
                data: CATCH_HISTORY.map(item => item.weight),
              },
            ],
          }}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Species Distribution */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{('speciesDistribution')}</Text>
        <PieChart
          data={SPECIES_DATA}
          width={Dimensions.get('window').width - 32}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>

      {/* Best Fishing Hours */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{('bestFishingHours')}</Text>
        <BarChart
          data={{
            labels: BEST_HOURS.map(item => item.hour),
            datasets: [
              {
                data: BEST_HOURS.map(item => item.success),
              },
            ],
          }}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
          }}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix="%"
          showValuesOnTopOfBars
        />
      </View>

      {/* Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>{('fishingInsights')}</Text>
        <View style={styles.insightItem}>
          <Icon name="lightbulb-on" size={20} color="#f39c12" />
          <Text style={styles.insightText}>
            {('bestTimeInsight')} <Text style={styles.highlight}>6-7 AM</Text> ({('successRate')}: 85%)
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Icon name="lightbulb-on" size={20} color="#f39c12" />
          <Text style={styles.insightText}>
            {('bestSpeciesInsight')} <Text style={styles.highlight}>Rohu</Text> (35% {('ofCatches')})
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Icon name="lightbulb-on" size={20} color="#f39c12" />
          <Text style={styles.insightText}>
            {('bestZoneInsight')} <Text style={styles.highlight}>North Bay</Text> ({('avgCatch')}: 18kg/{('trip')})
          </Text>
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    elevation: 2,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeTimeButton: {
    backgroundColor: '#3498db',
  },
  timeButtonText: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeTimeButtonText: {
    color: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
  },
  insightsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#2ecc71',
  },
});