import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'f1',
    question: 'How and when do I receive job payouts?',
    answer:
      'All completed jobs are credited instantly to your partner wallet. You can trigger an instant IMPS withdrawal to your registered bank account at any time with zero fee.',
  },
  {
    id: 'f2',
    question: 'What happens if a customer cancels at the doorstep?',
    answer:
      'If a customer cancels after you have already marked "Arrived", you will be credited a minimum cancellation compensation of ₹200 to cover travel fuel and time.',
  },
  {
    id: 'f3',
    question: 'How can I maintain a high 4.9+ partner rating?',
    answer:
      'Wear standard uniform, arrive 5 minutes before scheduled slot, maintain polite communication, and verify the doorstep 4-digit PIN before starting work.',
  },
  {
    id: 'f4',
    question: 'How do I add or switch my registered service categories?',
    answer:
      'Navigate to Profile -> Service Categories & Skills to toggle any additional trades you are trained in (e.g. adding Electrical or AC Service to Home Cleaning).',
  },
];

export const SupportScreen: React.FC = () => {
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('f1');
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 's1',
      sender: 'agent',
      text: 'Hello Partner! HomeEase Helpdesk here. How can we assist you with today’s bookings or wallet?',
      time: 'Just now',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const toggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const handleSendSupportMsg = () => {
    if (!inputMsg.trim()) return;
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: inputMsg.trim(),
      time: 'Just now',
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputMsg('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'agent',
          text: 'Thanks for reaching out! Our Partner Specialist is reviewing your account and will update you shortly.',
          time: 'Just now',
        },
      ]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Partner Help & Support"
        subtitle="24/7 dedicated partner assistance"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Contact Cards */}
        <View style={styles.contactRow}>
          {/* Call Support */}
          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                'Calling Partner Toll-Free Helpline',
                'Connecting you to HomeEase Priority Desk: 1800-425-9900'
              )
            }
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="call-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.contactTitle}>Call Support</Text>
            <Text style={styles.contactSub}>Toll-free 24/7 hotline</Text>
          </TouchableOpacity>

          {/* Chat Support */}
          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.8}
            onPress={() => setIsChatModalVisible(true)}
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.contactTitle}>Live Chat</Text>
            <Text style={styles.contactSub}>Instant messaging</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Assistance Banner */}
        <TouchableOpacity
          style={styles.sosCard}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              'Partner Safety Alert',
              'Do you need immediate on-ground safety assistance?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Alert Support',
                  style: 'destructive',
                  onPress: () =>
                    Alert.alert('Support Alerted', 'Priority responders have been notified.'),
                },
              ]
            )
          }
        >
          <View style={styles.sosIconWrap}>
            <Ionicons name="shield-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.sosTextWrap}>
            <Text style={styles.sosTitle}>Partner Safety Desk</Text>
            <Text style={styles.sosSub}>Immediate safety assistance while on service duty</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* FAQs Accordion */}
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions (FAQ)</Text>
          <Text style={styles.sectionSub}>Quick answers to common partner questions</Text>

          {FAQS.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleFaq(faq.id)}
                >
                  <Text style={[styles.faqQuestion, isExpanded && styles.faqQuestionActive]}>
                    {faq.question}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={isExpanded ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>

                {isExpanded ? (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </PremiumCard>
      </ScrollView>

      {/* Live Chat Support Modal */}
      <Modal visible={isChatModalVisible} animationType="slide">
        <SafeAreaView style={styles.chatModalContainer} edges={['top']}>
          <CustomHeader
            title="Partner Live Support"
            subtitle="Typical reply within 2 minutes"
            showBack
            onBack={() => setIsChatModalVisible(false)}
          />

          <ScrollView style={styles.chatScroll} contentContainerStyle={{ padding: spacing.md }}>
            {chatMessages.map((msg) => {
              const isAgent = msg.sender === 'agent';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.chatBubble,
                    isAgent ? styles.chatBubbleAgent : styles.chatBubbleUser,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatBubbleText,
                      isAgent ? styles.chatBubbleTextAgent : styles.chatBubbleTextUser,
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <Text
                    style={[
                      styles.chatTime,
                      isAgent ? styles.chatTimeAgent : styles.chatTimeUser,
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type your message..."
              placeholderTextColor={colors.textSecondary}
              value={inputMsg}
              onChangeText={setInputMsg}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSendSupportMsg}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.sm,
  },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contactSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sosIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTextWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  sosTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sosSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm + 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingRight: spacing.sm,
  },
  faqQuestionActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  faqBody: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  faqAnswer: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatScroll: {
    flex: 1,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  chatBubbleAgent: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatBubbleTextAgent: {
    color: colors.textPrimary,
  },
  chatBubbleTextUser: {
    color: '#FFFFFF',
  },
  chatTime: {
    fontSize: 10,
    marginTop: 4,
  },
  chatTimeAgent: {
    color: colors.textSecondary,
  },
  chatTimeUser: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  chatInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
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

export default SupportScreen;
