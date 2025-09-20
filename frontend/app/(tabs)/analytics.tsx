import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../../constants/design';
import { fadeIn, scaleIn, bounce } from '../../utils/animations';

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
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

  // Start animations on mount
  useEffect(() => {
    Animated.parallel([
      fadeIn(fadeAnim, 800),
      scaleIn(scaleAnim, 600),
    ]).start();
    
    // Stagger chart animation
    setTimeout(() => {
      fadeIn(chartAnim, 400).start();
    }, 300);
  }, []);

  const chartConfig = {
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: Colors.textTertiary,
      strokeWidth: 1,
    },
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ 
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  })
                }],
              },
            ]}
          >
            <Text style={styles.title}>{t('analytics')}</Text>
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
          </Animated.View>

          {/* Summary Cards - CORRECTED */}
          <Animated.View 
            style={[
              styles.summaryRow,
              {
                opacity: chartAnim,
                transform: [{ 
                  translateY: chartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }],
              },
            ]}
          >
            <Animated.View 
              style={[
                styles.summaryCard,
                {
                  transform: [{ 
                    scale: chartAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    })
                  }]
                }
              ]}
            >
              <Icon name="weight" size={24} color={Colors.primary} />
              <Text style={styles.summaryValue}>100 kg</Text>
              <Text style={styles.summaryLabel}>{t('totalCatch')}</Text>
            </Animated.View>

            <Animated.View 
              style={[
                styles.summaryCard,
                {
                  transform: [{ 
                    scale: chartAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    })
                  }]
                }
              ]}
            >
              <Icon name="cash" size={24} color={Colors.secondary} />
              <Text style={styles.summaryValue}>₹40,000</Text>
              <Text style={styles.summaryLabel}>{t('totalValue')}</Text>
            </Animated.View>

            <Animated.View 
              style={[
                styles.summaryCard,
                {
                  transform: [{ 
                    scale: chartAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    })
                  }]
                }
              ]}
            >
              <Icon name="chart-line" size={24} color={Colors.accent} />
              <Text style={styles.summaryValue}>₹400/kg</Text>
              <Text style={styles.summaryLabel}>{t('avgPrice')}</Text>
            </Animated.View>
          </Animated.View>

          {/* Catch History Chart */}
          <Animated.View 
            style={[
              styles.chartContainer,
              {
                opacity: chartAnim,
                transform: [{ 
                  translateY: chartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }],
              },
            ]}
          >
            <Text style={styles.chartTitle}>{t('catchHistory')}</Text>
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
          </Animated.View>

          {/* Species Distribution */}
          <Animated.View 
            style={[
              styles.chartContainer,
              {
                opacity: chartAnim,
                transform: [{ 
                  translateY: chartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }],
              },
            ]}
          >
            <Text style={styles.chartTitle}>{t('speciesDistribution')}</Text>
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
          </Animated.View>

          {/* Best Fishing Hours */}
          <Animated.View 
            style={[
              styles.chartContainer,
              {
                opacity: chartAnim,
                transform: [{ 
                  translateY: chartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }],
              },
            ]}
          >
            <Text style={styles.chartTitle}>{t('bestFishingHours')}</Text>
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
          </Animated.View>

          {/* Insights */}
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>{t('fishingInsights')}</Text>
            <View style={styles.insightItem}>
              <Icon name="lightbulb-on" size={20} color="#f39c12" />
              <Text style={styles.insightText}>
                {t('bestTimeInsight')} <Text style={styles.highlight}>6-7 AM</Text> ({t('successRate')}: 85%)
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Icon name="lightbulb-on" size={20} color="#f39c12" />
              <Text style={styles.insightText}>
                {t('bestSpeciesInsight')} <Text style={styles.highlight}>Rohu</Text> (35% {t('ofCatches')})
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Icon name="lightbulb-on" size={20} color="#f39c12" />
              <Text style={styles.insightText}>
                {t('bestZoneInsight')} <Text style={styles.highlight}>North Bay</Text> ({t('avgCatch')}: 18kg/{t('trip')})
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Layout.container,
    backgroundColor: Colors.background,
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.tight * Typography.fontSize['3xl'],
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    ...Shadows.sm,
  },
  timeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  activeTimeButton: {
    backgroundColor: Colors.primary,
  },
  timeButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  activeTimeButtonText: {
    color: Colors.textInverse,
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