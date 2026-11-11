import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation as useNavigation } from '../../navigation/useAppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../state/AppContext';

export const EarningsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { earnings, wallet, fetchEarningsOverview } = useApp();

  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  useEffect(() => {
    fetchEarningsOverview();
  }, []);

  const currentData =
    activeTab === 'Daily'
      ? earnings.daily
      : activeTab === 'Weekly'
      ? earnings.weekly
      : earnings.monthly;

  const maxAmount = Math.max(...currentData.chartBars.map((b) => b.amount), 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <CustomHeader
        title="Earnings & Analytics"
        subtitle="Manage Services • Grow Your Earnings"
        rightAction={
          <TouchableOpacity
            style={styles.walletHeaderBtn}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet-outline" size={16} color={colors.primary} />
            <Text style={styles.walletHeaderBtnText}>₹{wallet.availableBalance.toLocaleString()}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector Tabs */}
        <View style={styles.tabBar}>
          {(['Daily', 'Weekly', 'Monthly'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hero Earnings Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSubText}>Net Payout ({activeTab})</Text>
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
              <Text style={styles.heroStatValueDanger}>
                - ₹{currentData.commission.toLocaleString()}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Incentives</Text>
              <Text style={styles.heroStatValueSuccess}>
                + ₹{currentData.incentives.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Earnings Trend Bar Chart Card */}
        <PremiumCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Earnings Trend</Text>
              <Text style={styles.cardSubtitle}>
                {activeTab === 'Daily' ? 'Hourly Performance Today' : `${activeTab} Distribution`}
              </Text>
            </View>
            <View style={styles.legendDotWrap}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Take-Home (₹)</Text>
            </View>
          </View>

          {/* Bar Chart Container */}
          <View style={styles.chartContainer}>
            <View style={styles.barsRow}>
              {currentData.chartBars.map((bar, index) => {
                const heightPercentage = Math.max(12, Math.round((bar.amount / maxAmount) * 100));

                return (
                  <View key={index} style={styles.barColumn}>
                    {bar.amount > 0 ? (
                      <Text style={styles.barTopAmount}>₹{bar.amount}</Text>
                    ) : null}
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
        </PremiumCard>

        {/* Service Category Breakdown Card */}
        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Trade Revenue Breakdown</Text>
          <Text style={styles.cardSubtitle}>Contribution across your service categories</Text>

          {/* Segmented Progress Bar */}
          <View style={styles.segmentedBar}>
            {currentData.breakdown.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.segmentPiece,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor: i === 0 ? colors.primary : i === 1 ? colors.secondary : '#93C5FD',
                  },
                ]}
              />
            ))}
          </View>

          {/* Category Rows */}
          <View style={styles.breakdownList}>
            {currentData.breakdown.map((item, i) => {
              const segColor = i === 0 ? colors.primary : i === 1 ? colors.secondary : '#93C5FD';
              return (
                <View key={i} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.colorPill, { backgroundColor: segColor }]} />
                    <Text style={styles.categoryName}>{item.serviceCategory}</Text>
                  </View>

                  <View style={styles.breakdownRight}>
                    <Text style={styles.categoryAmount}>₹{item.amount.toLocaleString()}</Text>
                    <Text style={styles.categoryPercent}>{item.percentage}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </PremiumCard>

        {/* Recent Settled Orders */}
        <PremiumCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Recent Settled Orders</Text>
            <View style={styles.orderCountBadge}>
              <Text style={styles.orderCountBadgeText}>
                {currentData.recentOrders.length} Orders
              </Text>
            </View>
          </View>

          {currentData.recentOrders.length > 0 ? (
            currentData.recentOrders.map((order) => (
              <View key={order.id} style={styles.orderRow}>
                <View style={styles.orderIconBox}>
                  <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.orderCategory}>{order.serviceName}</Text>
                  <Text style={styles.orderTime}>{order.date} • Order #{order.jobId || order.id}</Text>
                </View>
                <Text style={styles.orderAmount}>+₹{order.amount}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyOrdersText}>No settled orders in this period.</Text>
          )}
        </PremiumCard>

        {/* Quick Bank & Wallet CTA */}
        <PrimaryButton
          title="Manage Wallet & Withdrawals"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('Wallet')}
          icon={<Ionicons name="wallet-outline" size={20} color="#FFFFFF" />}
          style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  walletHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  walletHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  heroSubText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroStatValueDanger: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FCA5A5',
    marginTop: 2,
  },
  heroStatValueSuccess: {
    fontSize: 14,
    fontWeight: '700',
    color: '#86EFAC',
    marginTop: 2,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  legendDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  chartContainer: {
    marginTop: spacing.sm,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopAmount: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  barTrack: {
    width: 16,
    height: 100,
    backgroundColor: colors.background,
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
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.background,
    marginVertical: spacing.md,
  },
  segmentPiece: {
    height: '100%',
  },
  breakdownList: {
    gap: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorPill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryPercent: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  orderCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  orderCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  orderTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyOrdersText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});

export default EarningsScreen;
