import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { submitSupportMessage } from '@/lib/database';
import { useAuth } from '@/context/AuthContext';

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
  source?: 'maintenance' | 'settings';
  initialTopic?: string;
}

const SETTINGS_TOPICS = [
  'General Inquiry',
  'Account & Data',
  'Pro & Billing',
  'Bug Report',
  'Feature Idea',
];

const MAINTENANCE_TOPICS = [
  'Upgrade Status',
  'Account Access',
  'Data & Balance',
  'Urgent Inquiry',
];

export function HelpSupportModal({
  visible,
  onClose,
  source = 'settings',
  initialTopic,
}: HelpSupportModalProps) {
  const { user } = useAuth();
  const topics = source === 'maintenance' ? MAINTENANCE_TOPICS : SETTINGS_TOPICS;

  const [selectedTopic, setSelectedTopic] = useState(initialTopic || topics[0]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      if (user?.displayName && !name) setName(user.displayName);
      if (user?.email && !email) setEmail(user.email);
      if (initialTopic) setSelectedTopic(initialTopic);
      setSubmitted(false);
    }
  }, [visible, user]);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Required Field', 'Please enter a valid email address so we can reply.');
      return;
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      Alert.alert('Message Too Short', 'Please write a brief description (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      await submitSupportMessage({
        name: trimmedName,
        email: trimmedEmail,
        phone: phone.trim() || undefined,
        topic: selectedTopic,
        message: trimmedMessage,
        source,
        userId: user?.uid,
      });

      setSubmitted(true);
      Toast.show({
        type: 'success',
        text1: 'Support Request Received',
        text2: 'Our team will reach out to you shortly!',
      });
    } catch (err: any) {
      console.error('Support message submission failed:', err);
      Alert.alert('Submission Error', err?.message || 'Could not send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setMessage('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleResetAndClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={source === 'maintenance' ? 'construct-outline' : 'headset-outline'}
                  size={20}
                  color="#6366F1"
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {source === 'maintenance' ? 'Upgrade Support' : 'Help & Support'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {source === 'maintenance'
                    ? 'Our team is actively assisting users during upgrade'
                    : 'We are here to help with any question or issue'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleResetAndClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color="#71717A" />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={56} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Message Sent!</Text>
              <Text style={styles.successText}>
                Your inquiry regarding <Text style={{ fontWeight: '700', color: '#18181B' }}>"{selectedTopic}"</Text> has been received by our support team. We will reply via email ({email}) shortly.
              </Text>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleResetAndClose}
                activeOpacity={0.8}
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.bodyScroll}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Topic Selector */}
              <Text style={styles.fieldLabel}>Select Topic</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.topicsRow}
                contentContainerStyle={{ gap: 8, paddingRight: 16 }}
              >
                {topics.map((t) => {
                  const isSelected = selectedTopic === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.topicChip, isSelected && styles.topicChipSelected]}
                      onPress={() => setSelectedTopic(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.topicText, isSelected && styles.topicTextSelected]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Name */}
              <Text style={styles.fieldLabel}>Your Name *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#A1A1AA"
              />

              {/* Email */}
              <Text style={styles.fieldLabel}>Your Email Address *</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. rahul@gmail.com"
                placeholderTextColor="#A1A1AA"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Phone / WhatsApp */}
              <Text style={styles.fieldLabel}>Phone / WhatsApp (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor="#A1A1AA"
                keyboardType="phone-pad"
              />

              {/* Message */}
              <Text style={styles.fieldLabel}>How can we help? *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your question, feedback, or the issue you're experiencing..."
                placeholderTextColor="#A1A1AA"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Submit Message</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#18181B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyScroll: {
    marginTop: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3F3F46',
    marginBottom: 6,
    marginTop: 12,
  },
  topicsRow: {
    marginBottom: 4,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  topicChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  topicText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525B',
  },
  topicTextSelected: {
    color: '#4F46E5',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successIconCircle: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#52525B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  doneBtn: {
    backgroundColor: '#18181B',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
