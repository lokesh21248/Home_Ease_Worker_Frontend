import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../state/AppContext';
import { safeGoBack } from '../../utils/navigationHelper';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceSelection'>;

export const ServiceSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const isOnboarding = route.params?.isOnboarding ?? false;
  const { services, worker, toggleServiceSelection, updateWorkerProfile } = useApp();

  const handleContinue = () => {
    if (worker.selectedServices.length === 0) {
      Alert.alert('Selection Required', 'Please choose at least one service category to receive jobs.');
      return;
    }

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
      safeGoBack(navigation, 'MainTabs', { screen: 'ProfileTab' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Select Services"
        subtitle={
          isOnboarding
            ? 'Step 4 of 5 • Choose Your Trades'
            : 'Select categories to receive leads'
        }
        showBack
        onBack={() =>
          safeGoBack(
            navigation,
            isOnboarding ? 'DocumentUpload' : 'MainTabs',
            isOnboarding ? { isOnboarding: true } : { screen: 'ProfileTab' }
          )
        }
      />

      {isOnboarding ? (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressFill, { width: '80%' }]} />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerNotice}>
          <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
          <Text style={styles.headerNoticeText}>
            Select all skills you are certified to perform. You can add or update trades anytime.
          </Text>
        </View>

        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>Available Service Categories</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterBadgeText}>
              {worker.selectedServices.length} Selected
            </Text>
          </View>
        </View>

        {/* 2-Column Grid */}
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
                      name={(service.icon as any) || 'construct-outline'}
                      size={22}
                      color={isSelected ? '#FFFFFF' : colors.primary}
                    />
                  </View>

                  <View
                    style={[
                      styles.checkboxCircle,
                      isSelected && styles.checkboxCircleSelected,
                    ]}
                  >
                    {isSelected ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : null}
                  </View>
                </View>

                <Text
                  style={[styles.serviceName, isSelected && styles.serviceNameSelected]}
                  numberOfLines={1}
                >
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
        <PrimaryButton
          title={isOnboarding ? 'Continue to Availability' : 'Save Changes'}
          size="lg"
          fullWidth
          onPress={handleContinue}
          iconRight={<Ionicons name="arrow-forward-outline" size={18} color="#FFFFFF" />}
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
    height: 3,
    backgroundColor: colors.border,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerNoticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    lineHeight: 16,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  counterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  counterBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  serviceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  topCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    backgroundColor: colors.primary,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  serviceNameSelected: {
    color: colors.primary,
  },
  serviceDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    height: 30,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  startingFrom: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  perJob: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default ServiceSelectionScreen;
