import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useApp } from '../../state/AppContext';
import { openTurnByTurnNavigation } from '../../utils/navigationHelper';
import { alertFeedbackService } from '../../services/alertFeedbackService';
import { resolveBookingUuid } from '../../utils/uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'NavigationTracking'>;

interface ChatMessage {
  id: string;
  sender: 'worker' | 'customer';
  text: string;
  time: string;
}

export const NavigationTrackingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { job } = route.params;
  const { updateJobStatus } = useApp();

  const [etaMins] = useState(8);
  const [distanceKm] = useState(job.location.distanceKm || 1.8);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'customer',
      text: 'Hi Raj! Please ring the doorbell twice when you arrive at Flat 402.',
      time: '11:15 AM',
    },
    {
      id: 'm2',
      sender: 'worker',
      text: 'Hello! Noted. I am on the bike and will reach in about 8 minutes.',
      time: '11:16 AM',
    },
  ]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'worker',
      text: chatInput.trim(),
      time: 'Just now',
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    // Simulate customer auto-reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-reply-${Date.now()}`,
          sender: 'customer',
          text: 'Great, thanks! Looking forward.',
          time: 'Just now',
        },
      ]);
    }, 1200);
  };

  const handleArrived = () => {
    alertFeedbackService.playSuccessFeedback();
    updateJobStatus('arrived');
    const bookingId = resolveBookingUuid(job.bookingId, job.id);
    navigation.navigate('ActiveJob', { job: { ...job, bookingId, status: 'arrived' }, bookingId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Live Turn-by-Turn GPS"
        subtitle={`To ${job.customer.name}'s Location`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Turn-by-Turn Instruction Banner */}
      <View style={styles.turnBanner}>
        <View style={styles.turnIconCircle}>
          <Ionicons name="arrow-up" size={26} color={colors.textInverse} />
        </View>
        <View style={styles.turnInfoCol}>
          <Text style={styles.turnDistance}>In 250 meters</Text>
          <Text style={styles.turnInstruction}>Turn left onto KPHB 7th Phase Main Rd</Text>
        </View>
        <View style={styles.speedPill}>
          <Text style={styles.speedText}>32</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
      </View>

      {/* Vector / Styled Map Simulation Area */}
      <View style={styles.mapArea}>
        {/* Decorative Grid Lines to simulate high-tech GIS map */}
        <View style={styles.mapGridHorizontal1} />
        <View style={styles.mapGridHorizontal2} />
        <View style={styles.mapGridVertical1} />
        <View style={styles.mapGridVertical2} />

        {/* Map Road Route SVG-like Styled Path */}
        <View style={styles.routeContainer}>
          {/* Worker Start Pin */}
          <View style={styles.workerPin}>
            <View style={styles.workerPulseCircle} />
            <Ionicons name="bicycle" size={20} color={colors.surface} />
          </View>

          {/* S-curve dashed route simulation */}
          <View style={styles.roadTrack}>
            <View style={styles.roadProgressTrack} />
          </View>

          {/* Destination Customer Pin */}
          <View style={styles.destinationPin}>
            <Ionicons name="location" size={28} color={colors.danger} />
            <View style={styles.destBadge}>
              <Text style={styles.destBadgeText}>Customer Flat 402</Text>
            </View>
          </View>
        </View>

        {/* Map Overlay Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapBtn}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Recenter', 'Map centered to worker GPS location.')}
          >
            <Ionicons name="locate" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapBtn}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Traffic Layer', 'Live traffic enabled (Green normal flow).')}
          >
            <Ionicons name="layers-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ETA & Distance Floating Bar */}
        <View style={styles.etaFloatingBar}>
          <View style={styles.etaCol}>
            <Text style={styles.etaValue}>{etaMins} mins</Text>
            <Text style={styles.etaLabel}>{distanceKm} km • Fastest Route</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.arrivalCol}>
            <Text style={styles.arrivalLabel}>Target Arrival</Text>
            <Text style={styles.arrivalValue}>{job.scheduledTime}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet Card: Customer Details & Actions */}
      <View style={styles.bottomCard}>
        <View style={styles.dragPill} />

        <View style={styles.customerRow}>
          <Image source={{ uri: job.customer.avatar }} style={styles.customerAvatar} />
          <View style={styles.customerMeta}>
            <Text style={styles.customerName}>{job.customer.name}</Text>
            <Text style={styles.jobType}>{job.serviceName}</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {job.location.address}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.circleActionButton}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Calling Customer', `Calling ${job.customer.phone}...`)}
          >
            <Ionicons name="call" size={20} color={colors.primary} />
            <Text style={styles.circleActionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleActionButton}
            activeOpacity={0.8}
            onPress={() => setIsChatOpen(true)}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.info} />
            <Text style={styles.circleActionText}>Chat</Text>
          </TouchableOpacity>

          {/* 1-Tap Launch Native Maps Navigation */}
          <TouchableOpacity
            style={styles.circleActionButton}
            activeOpacity={0.8}
            onPress={() =>
              openTurnByTurnNavigation({
                latitude: job.location.latitude,
                longitude: job.location.longitude,
                label: `${job.customer.name} - ${job.serviceName}`,
                address: job.location.address,
              })
            }
          >
            <Ionicons name="navigate-circle" size={22} color={colors.primary} />
            <Text style={styles.circleActionText}>Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleActionButton}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert('Safety SOS', 'Emergency alert sent to HomeEase Rapid Response Team.')
            }
          >
            <Ionicons name="shield-outline" size={20} color={colors.danger} />
            <Text style={[styles.circleActionText, { color: colors.danger }]}>SOS</Text>
          </TouchableOpacity>
        </View>

        <Button
          title="I Have Arrived at Location 📍"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleArrived}
          style={styles.arrivedBtn}
        />
      </View>

      {/* Customer In-App Chat Modal */}
      <Modal
        visible={isChatOpen}
        animationType="slide"
        onRequestClose={() => setIsChatOpen(false)}
      >
        <SafeAreaView style={styles.chatModalContainer}>
          <Header
            title={`Chat with ${job.customer.name}`}
            subtitle="Encrypted in-app partner messaging"
            showBack
            onBack={() => setIsChatOpen(false)}
          />

          <ScrollView style={styles.chatMessagesContainer}>
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.messageBubble,
                  m.sender === 'worker' ? styles.workerBubble : styles.customerBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    m.sender === 'worker' ? styles.workerMsgText : styles.customerMsgText,
                  ]}
                >
                  {m.text}
                </Text>
                <Text style={styles.msgTime}>{m.time}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Type message to customer..."
              placeholderTextColor={colors.textMuted}
              value={chatInput}
              onChangeText={setChatInput}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSendMessage}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  turnIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  turnInfoCol: {
    flex: 1,
  },
  turnDistance: {
    ...typography.caption,
    color: '#93C5FD',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  turnInstruction: {
    ...typography.subtitle1,
    color: colors.textInverse,
    fontWeight: '800',
  },
  speedPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  speedText: {
    ...typography.subtitle2,
    color: colors.textInverse,
    fontWeight: '800',
  },
  speedUnit: {
    ...typography.caption,
    color: '#94A3B8',
    fontSize: 9,
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#E0F2FE', // Soft map-like sky/water tint
    position: 'relative',
    overflow: 'hidden',
  },
  mapGridHorizontal1: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: '#F1F5F9',
    transform: [{ rotate: '-8deg' }],
  },
  mapGridHorizontal2: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '12deg' }],
  },
  mapGridVertical1: {
    position: 'absolute',
    left: '25%',
    top: 0,
    bottom: 0,
    width: 38,
    backgroundColor: '#FFFFFF',
  },
  mapGridVertical2: {
    position: 'absolute',
    left: '70%',
    top: 0,
    bottom: 0,
    width: 32,
    backgroundColor: '#F1F5F9',
  },
  routeContainer: {
    position: 'absolute',
    top: 40,
    bottom: 100,
    left: 40,
    right: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roadTrack: {
    width: 8,
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderRadius: 4,
    position: 'relative',
    marginVertical: 10,
  },
  roadProgressTrack: {
    width: 8,
    height: '60%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  workerPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.md,
  },
  workerPulseCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  destinationPin: {
    alignItems: 'center',
  },
  destBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  destBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 10,
  },
  mapControls: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
  },
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  etaFloatingBar: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
  },
  etaCol: {
    flex: 1,
  },
  etaValue: {
    ...typography.h3,
    color: colors.success,
    fontWeight: '800',
  },
  etaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  etaDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  arrivalCol: {
    alignItems: 'flex-end',
  },
  arrivalLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  arrivalValue: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  bottomCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.lg,
  },
  dragPill: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderDark,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceAlt,
  },
  customerMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerName: {
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
  jobType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  circleActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minWidth: 80,
  },
  circleActionText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 4,
  },
  arrivedBtn: {
    marginTop: spacing.xs,
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatMessagesContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  workerBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  messageText: {
    ...typography.body2,
    lineHeight: 18,
  },
  workerMsgText: {
    color: colors.textInverse,
  },
  customerMsgText: {
    color: colors.textPrimary,
  },
  msgTime: {
    ...typography.caption,
    fontSize: 10,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    ...typography.body2,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NavigationTrackingScreen;
