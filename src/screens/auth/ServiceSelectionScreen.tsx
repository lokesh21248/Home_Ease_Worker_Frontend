import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { useApp } from '../../state/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceSelection'>;

export const ServiceSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const isOnboarding = route.params?.isOnboarding ?? false;
  const { services, worker, toggleServiceSelection, updateWorkerProfile } = useApp();

  const handleContinue = () => {
    if (worker.selectedServices.length === 0) {
      alert('Please choose at least one service category to receive jobs.');
      return;
    }

    // Gather all matching sub-service UUIDs for backend KYC registration
    const allSelectedSubServiceIds: string[] = [];
    services.forEach((s) => {
      if (worker.selectedServices.includes(s.id) && s.subServices) {
        s.subServices.forEach((sub) => allSelectedSubServiceIds.push(sub.id));
      }
    });

    updateWorkerProfile({
      subServiceIds:
        allSelectedSubServiceIds.length > 0
          ? allSelectedSubServiceIds
          : ['c34b4032-95ed-4ed5-b5e9-a7f5ab8cd4f7', '63fa806f-d1f3-4f92-aa7f-527c86c899ce'],
    });

    if (isOnboarding) {
      navigation.navigate('AvailabilitySetup', { isOnboarding: true });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Select Services"
        subtitle={
          isOnboarding
            ? 'Step 4 of 5 • Choose Your Trades'
            : 'Select categories to receive leads'
        }
        showBack
        onBack={() => navigation.goBack()}
      />

      {isOnboarding && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressFill, { width: '80%' }]} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerNotice}>
          <Ionicons name="sparkles" size={20} color={colors.accent} />
          <Text style={styles.headerNoticeText}>
            Select all skills you are certified to perform. You can add or remove trades anytime.
          </Text>
        </View>

        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>Available Service Categories</Text>
          <Text style={styles.counterBadge}>
            {worker.selectedServices.length} Selected
          </Text>
        </View>

        {/* 2-Column Grid or List of Services */}
        <View style={styles.grid}>
          {services.map((service) => {
            const isSelected = worker.selectedServices.includes(service.id);

            return (
              <TouchableOpacity
                key={service.id}
                onPress={() => toggleServiceSelection(service.id)}
                activeOpacity={0.8}
                style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
              >
                <View style={styles.topCardRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      isSelected && styles.iconCircleSelected,
                    ]}
                  >
                    <Ionicons
                      name={service.icon as any}
                      size={24}
                      color={isSelected ? colors.textInverse : colors.primary}
                    />
                  </View>

                  <View
                    style={[
                      styles.checkboxCircle,
                      isSelected && styles.checkboxCircleSelected,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                    )}
                  </View>
                </View>

                <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                  {service.name}
                </Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {service.description}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.startingFrom}>From </Text>
                  <Text style={styles.priceText}>₹{service.basePrice}</Text>
                  <Text style={styles.perJob}> / job</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isOnboarding ? 'Continue to Availability' : 'Save Changes'}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleContinue}
          icon={<Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
          iconPosition="right"
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
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.border,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerNoticeText: {
    ...typography.caption,
    color: '#92400E',
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 16,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  counterLabel: {
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
  counterBadge: {
    ...typography.caption,
    backgroundColor: colors.primaryLighter,
    color: colors.primary,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  serviceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter,
  },
  topCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    backgroundColor: colors.primary,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  serviceName: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  serviceNameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  serviceDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    height: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  startingFrom: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  priceText: {
    ...typography.subtitle2,
    color: colors.success,
    fontWeight: '800',
  },
  perJob: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

export default ServiceSelectionScreen;
