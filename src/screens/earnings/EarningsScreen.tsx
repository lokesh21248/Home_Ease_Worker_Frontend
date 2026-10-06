import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useApp } from '../../state/AppContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const EarningsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { earnings, wallet, fetchEarningsOverview } = useApp();

  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // End-to-end Backend Earnings Overview: GET /workers/earnings
  useEffect(() => {
    fetchEarningsOverview();
  }, []);

  const currentData =
    activeTab === 'Daily'
      ? earnings.daily
      : activeTab === 'Weekly'
      ? earnings.weekly
      : earnings.monthly;

  // Calculate highest bar value for proportional height
  const maxAmount = Math.max(...currentData.chartBars.map((b) => b.amount), 100);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Earnings & Analytics"
        subtitle="Manage Services • Grow Your Earnings"
        rightAction={
          <TouchableOpacity
            style={styles.walletHeaderBtn}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            <Text style={styles.walletHeaderBtnText}>₹{wallet.availableBalance.toLocaleString()}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Period Selector Tabs */}
        <View style={styles.tabBar}>
          {(['Daily', 'Weekly', 'Monthly'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hero Earnings Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSubText}>
            Net Payout ({activeTab})
          </Text>
          <Text style={styles.heroAmount}>
            ₹{currentData.netPayout.toLocaleString()}
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Gross Billings</Text>
              <Text style={styles.heroStatValue}>₹{currentData.totalGross.toLocaleString()}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Commission</Text>
              <Text style={[styles.heroStatValue, { color: '#F87171' }]}>
                - ₹{currentData.commission.toLocaleString()}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Incentives</Text>
              <Text style={[styles.heroStatValue, { color: '#34D399' }]}>
                + ₹{currentData.incentives.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* High-Fidelity Bar Chart Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Earnings Trend</Text>
              <Text style={styles.cardSubtitle}>
                {activeTab === 'Daily' ? 'Hourly Performance Today' : `${activeTab} Distribution`}
              </Text>
            </View>
            <View style={styles.legendDotWrap}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Take-home (₹)</Text>
            </View>
          </View>

          {/* Bar Chart Container */}
          <View style={styles.chartContainer}>
            <View style={styles.barsRow}>
              {currentData.chartBars.map((bar, index) => {
                const heightPercentage = Math.max(10, Math.round((bar.amount / maxAmount) * 100));

                return (
                  <View key={index} style={styles.barColumn}>
                    {bar.amount > 0 && (
                      <Text style={styles.barTopAmount}>₹{bar.amount}</Text>
                    )}
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${heightPercentage}%` },
                          bar.amount > 0 ? styles.barFillActive : styles.barFillZero,
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{bar.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Category Contribution (Pie / Breakdown Distribution) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trade Revenue Breakdown</Text>
          <Text style={styles.cardSubtitle}>Contribution across your service categories</Text>

          {/* Segmented Progress Bar */}
          <View style={styles.segmentedBar}>
            {currentData.breakdown.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.segmentPiece,
                  { width: `${item.percentage}%`, backgroundColor: item.color },
                ]}
              />
            ))}
          </View>

          {/* Category Rows */}
          <View style={styles.breakdownList}>
            {currentData.breakdown.map((item, i) => (
              <View key={i} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.colorPill, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryName}>{item.serviceCategory}</Text>
                </View>

                <View style={styles.breakdownRight}>
                  <Text style={styles.categoryAmount}>₹{item.amount.toLocaleString()}</Text>
                  <Text style={styles.categoryPercent}>{item.percentage}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Settled Orders */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Recent Orders in this Period</Text>
            <Text style={styles.orderCountBadge}>{currentData.recentOrders.length} Orders</Text>
          </View>

          {currentData.recentOrders.map((order) => (
            <View key={order.id} style={styles.orderRow}>
              <View style={styles.orderIconBox}>
                <Ionicons name="receipt-outline" size={20} color={colors.primary} />
              </View>

              <View style={styles.orderCenter}>
                <Text style={styles.orderJobId}>{order.jobId} • {order.customerName}</Text>
                <Text style={styles.orderServiceName}>{order.serviceName}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>

              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>+ ₹{order.amount}</Text>
                <View style={styles.settledBadge}>
                  <Text style={styles.settledText}>{order.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Wallet Withdraw Shortcut Footer */}
      <View style={styles.footer}>
        <Button
          title={`Open Wallet & Withdraw (₹${wallet.availableBalance.toLocaleString()})`}
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('Wallet')}
          icon={<Ionicons name="wallet" size={18} color={colors.textInverse} />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  walletHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  walletHeaderBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    marginLeft: 4,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabItemActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.primary,
  },
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  heroSubText: {
    ...typography.caption,
    color: '#93C5FD',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: spacing.xs,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatLabel: {
    ...typography.caption,
    color: '#94A3B8',
    fontSize: 10,
  },
  heroStatValue: {
    ...typography.subtitle2,
    color: '#F8FAFC',
    fontWeight: '800',
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  legendDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  chartContainer: {
    height: 180,
    justifyContent: 'flex-end',
    paddingTop: spacing.lg,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopAmount: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  barTrack: {
    width: 16,
    height: 100,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barFillActive: {
    backgroundColor: colors.primary,
  },
  barFillZero: {
    backgroundColor: colors.border,
  },
  barLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    marginVertical: spacing.md,
  },
  segmentPiece: {
    height: '100%',
  },
  breakdownList: {
    marginTop: spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  categoryName: {
    ...typography.body2,
    color: colors.textPrimary,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  categoryPercent: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  orderCountBadge: {
    ...typography.caption,
    backgroundColor: colors.primaryLighter,
    color: colors.primary,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  orderIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCenter: {
    flex: 1,
    marginLeft: spacing.md,
  },
  orderJobId: {
    ...typography.subtitle2,
    color: colors.textPrimary,
  },
  orderServiceName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  orderDate: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    ...typography.subtitle2,
    color: colors.success,
    fontWeight: '800',
  },
  settledBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
    marginTop: 2,
  },
  settledText: {
    ...typography.caption,
    color: colors.success,
    fontSize: 9,
    fontWeight: '800',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

export default EarningsScreen;
