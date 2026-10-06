import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';

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
      'All completed jobs are credited instantly to your HomeEase Partner Wallet. You can trigger an instant IMPS withdrawal to your registered bank account at any time with zero fee.',
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
      'Wear standard uniform shoe covers and mask, reach 5 minutes before scheduled slot, maintain polite communication, and clean the work area thoroughly after finishing the job.',
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
      text: 'Hello Raj! HomeEase Partner Helpdesk here. How can we assist you with today’s bookings or wallet?',
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
          text: 'Thanks for reaching out! Our Partner Specialist is reviewing your profile and will update you shortly.',
          time: 'Just now',
        },
      ]);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Partner Help & Support" subtitle="24/7 dedicated pro assistance" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <View style={[styles.contactIconWrap, { backgroundColor: colors.primaryLighter }]}>
              <Ionicons name="call" size={24} color={colors.primary} />
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
            <View style={[styles.contactIconWrap, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="chatbubbles" size={24} color={colors.info} />
            </View>
            <Text style={styles.contactTitle}>Live Chat</Text>
            <Text style={styles.contactSub}>Instant messaging</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency SOS Banner */}
        <TouchableOpacity
          style={styles.sosCard}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              'Emergency SOS Alert',
              'Do you need immediate emergency or on-ground safety assistance?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Trigger SOS',
                  style: 'destructive',
                  onPress: () => Alert.alert('SOS Dispatched', 'Emergency responders & support alerted.'),
                },
              ]
            )
          }
        >
          <View style={styles.sosIconWrap}>
            <Ionicons name="shield-outline" size={22} color={colors.danger} />
          </View>
          <View style={styles.sosTextWrap}>
            <Text style={styles.sosTitle}>Partner Emergency SOS</Text>
            <Text style={styles.sosSub}>Immediate safety dispatch while on service duty</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.danger} />
        </TouchableOpacity>

        {/* FAQs Accordion */}
        <View style={styles.card}>
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

                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Live Chat Support Modal */}
      <Modal visible={isChatModalVisible} animationType="slide">
        <SafeAreaView style={styles.chatModalContainer}>
          <Header
            title="Partner Support Chat"
            subtitle="Priority Response Agent Online"
            showBack
            onBack={() => setIsChatModalVisible(false)}
          />

          <ScrollView style={styles.chatScroll} contentContainerStyle={{ padding: spacing.lg }}>
            {chatMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.chatBubble,
                  msg.sender === 'user' ? styles.chatBubbleUser : styles.chatBubbleAgent,
                ]}
              >
                <Text
                  style={[
                    styles.chatText,
                    msg.sender === 'user' ? styles.chatTextUser : styles.chatTextAgent,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text style={styles.chatTime}>{msg.time}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInputBar}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask support agent a question..."
              placeholderTextColor={colors.textMuted}
              value={inputMsg}
              onChangeText={setInputMsg}
            />
            <TouchableOpacity
              style={styles.chatSendBtn}
              onPress={handleSendSupportMsg}
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  contactIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  contactTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
  contactSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: spacing.md,
  },
  sosIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sosTextWrap: {
    flex: 1,
  },
  sosTitle: {
    ...typography.subtitle2,
    color: colors.danger,
    fontWeight: '800',
  },
  sosSub: {
    ...typography.caption,
    color: '#991B1B',
    fontSize: 11,
    marginTop: 1,
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
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.md,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  faqQuestionActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  faqBody: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  faqAnswer: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
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
  chatBubbleUser: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  chatBubbleAgent: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chatText: {
    ...typography.body2,
    lineHeight: 18,
  },
  chatTextUser: {
    color: colors.textInverse,
  },
  chatTextAgent: {
    color: colors.textPrimary,
  },
  chatTime: {
    ...typography.caption,
    fontSize: 9,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SupportScreen;
