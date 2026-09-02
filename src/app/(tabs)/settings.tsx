import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getCategoryTotals, deleteAllTransactions, saveStartingBalance, saveUserSettings, UserSettings } from '@/lib/database';
import { useTranslation } from '@/lib/i18n';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { promptGoogleSignIn } from '@/lib/google-auth';
import { exportTransactions, pickAndImportBackupFile, importTransactionsFromText, pickBackupFileContent } from '@/lib/backup';
import Toast from 'react-native-toast-message';
import { ConfirmDialogModal } from '@/components/confirm-dialog-modal';
import { ALL_CURRENCIES } from '@/lib/currencies';
import { CurrencySelectorModal } from '@/components/CurrencySelectorModal';
import { VipAvatar } from '@/components/VipAvatar';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Language = 'English' | 'Hindi' | 'Hinglish';

const LANGUAGES: Language[] = ['English', 'Hindi', 'Hinglish'];

// ---------------------------------------------------------------------------
// Reusable: Pill Selector (replaces 3x duplicated inline pill logic)
// ---------------------------------------------------------------------------

function PillSelector<T extends string>({
  options,
  activeValue,
  onSelect,
  accent = false,
  a11yLabel,
}: {
  options: T[];
  activeValue: T;
  onSelect: (value: T) => void;
  accent?: boolean;
  a11yLabel: string;
}) {
  return (
    <View style={styles.pillContainer} accessibilityRole="radiogroup" accessibilityLabel={a11yLabel}>
      {options.map(option => {
        const isActive = activeValue === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.pill, isActive && (accent ? styles.activePillAccent : styles.activePill)]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option}
          >
            <Text style={[styles.pillText, isActive && (accent ? styles.activePillTextAccent : styles.activePillText)]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Reusable: Bottom Sheet Modal (replaces 3x duplicated overlay/card structure)
// ---------------------------------------------------------------------------

function BottomSheetModal({
  visible,
  onClose,
  title,
  icon,
  iconBg,
  iconColor,
  autoHeight = false,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  autoHeight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalContent, autoHeight && styles.autoHeightModal]}
        >
          <View style={styles.modalDragHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              {icon && (
                <View style={[styles.infoIconBg, { backgroundColor: iconBg || '#F3F4F6' }]}>
                  <Ionicons name={icon} size={22} color={iconColor || '#1C1C1E'} />
                </View>
              )}
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Close ${title}`}
            >
              <Ionicons name="close" size={22} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalBodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Reusable: Info / Nav Row
// ---------------------------------------------------------------------------

function SettingsRow({
  icon,
  iconBg = '#ffffff',
  iconColor = '#1C1C1E',
  label,
  value,
  labelColor,
  onPress,
  loading = false,
  showChevron = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value?: string;
  labelColor?: string;
  onPress?: () => void;
  loading?: boolean;
  showChevron?: boolean;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={styles.infoRow}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
    >
      <View style={[styles.infoIconBg, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={[styles.infoLabel, labelColor && { color: labelColor }]}>{label}</Text>
        {!!value && (
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {value}
          </Text>
        )}
      </View>
      {onPress && (loading ? <ActivityIndicator size="small" color={iconColor} /> : showChevron && (
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      ))}
    </Wrapper>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, settings, setSettings, refreshUser, isPremium } = useAuth();
  const { t } = useTranslation();

  const [totalSpend, setTotalSpend] = useState<number>(0);
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [selectedImportFile, setSelectedImportFile] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showStartingBalanceModal, setShowStartingBalanceModal] = useState(false);
  const [startingBalanceInput, setStartingBalanceInput] = useState('');
  const [isSavingStartingBalance, setIsSavingStartingBalance] = useState(false);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteDataModalVisible, setDeleteDataModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const selectedCurrencyObj = ALL_CURRENCIES.find(c => c.symbol === settings?.currency || c.code === settings?.currency);

  const refreshData = () => {
    if (user?.uid) {
      getCategoryTotals(user.uid)
        .then(cats => setTotalSpend(cats.reduce((sum, c) => sum + c.amount, 0)))
        .catch(err => {
          console.error(err);
          Toast.show({ type: 'error', text1: 'Could not load totals', text2: 'Pull to refresh and try again.' });
        });
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---- Export -------------------------------------------------------------

  const handleExport = async (format: 'json' | 'csv' = exportFormat) => {
    if (!user?.uid) return;
    setIsExporting(true);
    try {
      const res = await exportTransactions(user.uid, format);
      setShowExportModal(false);
      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Backup Exported Successfully ✅',
          text2: `Saved ${res.count} transactions to ${res.filename}`,
          visibilityTime: 4000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Export Failed ❌',
          text2: res.error || 'No transactions found to export.',
          visibilityTime: 4000,
        });
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Export Failed ❌',
        text2: e?.message || 'An error occurred during export.',
        visibilityTime: 4000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ---- Import -------------------------------------------------------------

  const handlePickAndImportFile = async () => {
    try {
      const { rawText, filename } = await pickBackupFileContent();
      setImportText(rawText);
      setSelectedImportFile(filename);
    } catch (err: any) {
      if (err?.message !== 'CANCELED' && err?.message !== 'File selection was canceled.') {
        Toast.show({
          type: 'error',
          text1: 'File Selection Failed ❌',
          text2: err?.message || 'Failed to read file.',
          visibilityTime: 4000,
        });
      }
    }
  };

  const clearSelectedFile = () => {
    setImportText('');
    setSelectedImportFile(null);
  };

  const handleImportSubmit = async (textToImport?: string) => {
    const raw = textToImport || importText;
    if (!raw.trim()) {
      Toast.show({
        type: 'error',
        text1: 'No Data Provided',
        text2: 'Please paste JSON/CSV data or choose a backup file.',
      });
      return;
    }
    if (!user?.uid) return;
    setIsImporting(true);
    try {
      const result = await importTransactionsFromText(user.uid, raw);
      refreshData();
      setShowImportModal(false);
      setImportText('');
      setSelectedImportFile(null);
      Toast.show({
        type: 'success',
        text1: 'Backup Restored Successfully ✅',
        text2: `Imported ${result.imported} records (${result.skipped} skipped).`,
        visibilityTime: 4500,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Import Failed ❌',
        text2: err?.message || 'Invalid format. Please check your data.',
        visibilityTime: 4000,
      });
    } finally {
      setIsImporting(false);
    }
  };

  // ---- Danger zone ----------------------------------------------------------
  // NOTE: deleteAllTransactions runs BEFORE deleteUser() in both flows below.
  // If deleteUser() throws (commonly `auth/requires-recent-login`), the
  // Firestore data is already gone but the auth account survives — an
  // inconsistent state. We surface that specific case with actionable copy
  // instead of a silent console.error, and stop the "logout" cleanup so the
  // user isn't logged out of a still-existing account without knowing why.

  const executeDeleteAllData = async () => {
    if (!user?.uid) return;
    try {
      setIsDeletingData(true);
      await deleteAllTransactions(user.uid);
      setTotalSpend(0);
      setDeleteDataModalVisible(false);
      Toast.show({ type: 'success', text1: 'All transactions deleted' });
    } catch (e: any) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Could not delete transactions',
        text2: e?.message || 'Please try again.',
      });
    } finally {
      setIsDeletingData(false);
    }
  };

  const executeDeleteAccount = async () => {
    if (!user) return;
    try {
      setIsDeletingAccount(true);
      
      // Force a recent login before sensitive operations to prevent auth/requires-recent-login
      try {
        await promptGoogleSignIn();
      } catch (err: any) {
        // If the user cancels the re-authentication, abort the deletion process
        setIsDeletingAccount(false);
        return;
      }

      await deleteAllTransactions(user.uid);
      await deleteDoc(doc(db, `users/${user.uid}/settings/preferences`));
      await deleteDoc(doc(db, 'users', user.uid));
      if (!auth.currentUser) {
        throw new Error('No authenticated user found. Please sign in again.');
      }
      await deleteUser(auth.currentUser);
      setDeleteAccountModalVisible(false);
      logout();
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'auth/requires-recent-login') {
        Toast.show({
          type: 'error',
          text1: 'Please log in again first',
          text2: 'For your security, re-login before deleting your account.',
          visibilityTime: 5000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Account deletion failed',
          text2: e?.message || 'Your data may be partially deleted. Please contact support.',
          visibilityTime: 5000,
        });
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const updatePref = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!user?.uid || !settings) return;
    const newSettings: UserSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await saveUserSettings(user.uid, newSettings);
    } catch (e) {
      console.error(e);
      // Revert optimistic update on failure
      setSettings(settings);
      Toast.show({ type: 'error', text1: 'Could not save preference', text2: 'Please try again.' });
    }
  };

  const openStartingBalanceEditor = () => {
    setStartingBalanceInput(String(Number((user as any)?.startingBalance) || 0));
    setShowStartingBalanceModal(true);
  };

  const handleSaveStartingBalance = async () => {
    if (!user?.uid || isSavingStartingBalance) return;
    setIsSavingStartingBalance(true);
    try {
      await saveStartingBalance(user.uid, Number(startingBalanceInput) || 0);
      await refreshUser();
      setShowStartingBalanceModal(false);
      Toast.show({ type: 'success', text1: 'Starting balance updated' });
    } catch (error) {
      console.error('Could not update starting balance:', error);
      Toast.show({ type: 'error', text1: 'Could not update balance', text2: 'Please try again.' });
    } finally {
      setIsSavingStartingBalance(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const curr = useMemo(() => (settings?.currency === 'INR' ? '₹' : settings?.currency || '₹'), [settings?.currency]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Please log in to view settings.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getPlanNameDisplay = (planKey?: string) => {
    if (planKey === 'monthly') return '1 Month Pro';
    if (planKey === '3_months') return '3 Months Pro';
    if (planKey === '6_months') return '6 Months Pro';
    if (planKey === 'yearly') return '1 Year Pro';
    if (planKey === 'lifetime') return 'Lifetime VIP 👑';
    return (planKey || 'PRO').toUpperCase();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Top Banner */}
        <View style={styles.topHalf}>
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{t('profile')}</Text>
                <Text style={styles.subtitle}>Account & App Preferences</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.bottomHalf}>
          {/* Profile Card */}
          <TouchableOpacity
            style={styles.profileCardWrapper}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <View style={styles.profileCard}>
              <View style={{ marginBottom: 14 }}>
                <VipAvatar
                  photoURL={user.photoURL}
                  name={user.displayName}
                  email={user.email}
                  isPremium={isPremium}
                  size={96}
                  badgeType={isPremium ? undefined : 'edit'}
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{user.displayName || 'Rupeo User'}</Text>
                {isPremium && (
                  <View style={styles.vipPill}>
                    <Text style={styles.vipPillText}>VIP 👑</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {curr} {totalSpend.toFixed(0)}
                  </Text>
                  <Text style={styles.statLabel}>{t('total_spend')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isPremium && { color: '#F59E0B' }]}>
                    {isPremium ? 'PRO VIP 👑' : t('active')}
                  </Text>
                  <Text style={styles.statLabel}>{t('status')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* RUPEO PRO / VIP STATUS BANNER */}
          <TouchableOpacity
            style={styles.proBannerCardWrapper}
            onPress={() => router.push('/premium')}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={
                isPremium
                  ? ['#1A2438', '#0F1626']
                  : ['#2A1D08', '#141008']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.proBannerCard,
                isPremium ? styles.proBannerCardVip : styles.proBannerCardFree,
              ]}
            >
              <View style={styles.proBannerLeft}>
                <View
                  style={[
                    styles.proCrownCircle,
                    isPremium ? styles.proCrownCircleVip : styles.proCrownCircleFree,
                  ]}
                >
                  <ExpoImage
                    source={{
                      uri: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Crown.png',
                    }}
                    style={{ width: 28, height: 28 }}
                    contentFit="contain"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.proBannerTitle, isPremium && { color: '#FFD740' }]}>
                      {isPremium ? 'Rupeo VIP Active' : 'Rupeo Pro VIP'}
                    </Text>
                    {isPremium ? (
                      <View style={styles.proActiveBadge}>
                        <Ionicons name="checkmark-circle" size={11} color="#10B981" style={{ marginRight: 3 }} />
                        <Text style={styles.proActiveBadgeText}>
                          {settings?.premiumPlan === 'lifetime' ? 'LIFETIME' : 'ACTIVE'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.proAdFreeBadge}>
                        <Text style={styles.proAdFreeBadgeText}>100% AD-FREE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.proBannerSub}>
                    {isPremium
                      ? settings?.premiumPlan === 'lifetime'
                        ? 'Unlimited Lifetime VIP • Zero Ads Forever'
                        : `${getPlanNameDisplay(settings?.premiumPlan)} • Tap to Upgrade Plan ⚡`
                      : 'Remove all ads, unlock deep analytics & unlimited bills'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.proActionPill,
                  isPremium ? styles.proActionPillVip : styles.proActionPillFree,
                ]}
              >
                <Text
                  style={[
                    styles.proActionPillText,
                    isPremium ? styles.proActionPillTextVip : styles.proActionPillTextFree,
                  ]}
                >
                  {isPremium ? (settings?.premiumPlan === 'lifetime' ? 'VIP' : 'Upgrade') : 'Get Pro'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={isPremium ? '#FFD740' : '#07090E'}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Planning & Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Planning & Categories</Text>
            <View style={styles.infoCard}>
              <SettingsRow
                icon="pie-chart-outline"
                iconBg="#FEF9E7"
                iconColor="#B45309"
                label={t('budget_goals')}
                value={t('budget_goals_desc')}
                onPress={() => router.push('/budget')}
              />
              <View style={styles.infoDivider} />
              <SettingsRow
                icon="grid-outline"
                iconBg="#EFF6FF"
                iconColor="#3B82F6"
                label={t('manage_categories')}
                value={t('manage_categories_desc')}
                onPress={() => router.push('/categories')}
              />
              <View style={styles.infoDivider} />
              <SettingsRow
                icon="wallet-outline"
                iconBg="#FEF3C7"
                iconColor="#B45309"
                label="Update Total Balance"
                value={`Current: ${curr}${Number((user as any)?.startingBalance || 0).toLocaleString('en-IN')}`}
                onPress={openStartingBalanceEditor}
              />
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('preferences')}</Text>
            <View style={styles.infoCard}>
              <View style={styles.prefRow}>
                <Text style={styles.prefLabel}>{t('language')}</Text>
                <PillSelector
                  options={LANGUAGES}
                  activeValue={(settings?.language as Language) || 'English'}
                  onSelect={val => updatePref('language', val)}
                  a11yLabel="App language"
                />
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.prefRow}>
                <Text style={styles.prefLabel}>{t('currency')}</Text>
                <TouchableOpacity
                  style={styles.currencySelectorBtn}
                  onPress={() => setShowCurrencyModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.currencySymbolText}>{selectedCurrencyObj?.symbol || settings?.currency || '₹'}</Text>
                  <Ionicons name="chevron-down" size={14} color="#94A3B8" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('data_management')}</Text>
            <View style={styles.infoCard}>
              <View style={styles.backupActions}>
                <TouchableOpacity
                  style={styles.backupAction}
                  onPress={() => setShowExportModal(true)}
                  disabled={isExporting}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('export_data')}
                >
                  <View style={[styles.backupActionIcon, { backgroundColor: '#ECFDF5' }]}>
                    {isExporting ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <Ionicons name="cloud-download-outline" size={22} color="#10B981" />
                    )}
                  </View>
                  <Text style={[styles.backupActionLabel, { color: '#047857' }]}>{t('export_data')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backupAction}
                  onPress={() => setShowImportModal(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('import_data')}
                >
                  <View style={[styles.backupActionIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="cloud-upload-outline" size={22} color="#3B82F6" />
                  </View>
                  <Text style={[styles.backupActionLabel, { color: '#2563EB' }]}>{t('import_data')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.infoDivider} />
              <SettingsRow
                icon="layers-outline"
                iconBg="#FFF7ED"
                iconColor="#EA580C"
                label={t('delete_all_data')}
                labelColor="#EA580C"
                value={t('delete_all_desc')}
                onPress={() => setDeleteDataModalVisible(true)}
              />
            </View>
          </View>

          {/* Legal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('legal')}</Text>
            <View style={styles.infoCard}>
              <SettingsRow icon="document-text-outline" label={t('terms_conditions')} onPress={() => setLegalDoc('terms')} />
              <View style={styles.infoDivider} />
              <SettingsRow icon="shield-checkmark-outline" label={t('privacy_policy')} onPress={() => setLegalDoc('privacy')} />
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('danger_zone')}</Text>
            <View style={styles.dangerCard}>
              {/* Logout */}
              <TouchableOpacity
                style={styles.dangerRow}
                onPress={() => setLogoutModalVisible(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Log out"
              >
                <View style={styles.dangerIconWrap}>
                  <Ionicons name="log-out-outline" size={20} color="#64748B" />
                </View>
                <View style={styles.dangerTextWrap}>
                  <Text style={styles.dangerRowLabel}>{t('log_out')}</Text>
                  <Text style={styles.dangerRowSub}>Sign out of your account</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>

            </View>

            {/* Standalone Delete Account Button */}
            <TouchableOpacity
              style={styles.deleteAccountBtn}
              onPress={() => setDeleteAccountModalVisible(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('delete_my_account')}
            >
              <Ionicons name="warning-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.deleteAccountBtnText}>{t('delete_my_account')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>Rupeo {t('version')} 2.0.0</Text>
        </View>
      </ScrollView>

      <CurrencySelectorModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        selectedCurrency={settings?.currency || '₹'}
        onSelect={(val) => updatePref('currency', val)}
      />

      {/* Export Modal */}
      <BottomSheetModal
        visible={showStartingBalanceModal}
        onClose={() => setShowStartingBalanceModal(false)}
        title={t('update_starting_balance')}
        icon="wallet-outline"
        iconBg="#FEF3C7"
        iconColor="#B45309"
        autoHeight
      >
        <Text style={styles.modalIntroText}>
          {t('starting_balance_desc')}
        </Text>
        <View style={styles.startingBalanceInputRow}>
          <Text style={styles.startingBalanceCurrency}>{curr}</Text>
          <TextInput
            style={styles.startingBalanceInput}
            value={startingBalanceInput}
            onChangeText={setStartingBalanceInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94A3B8"
            editable={!isSavingStartingBalance}
          />
        </View>
        <TouchableOpacity
          style={[styles.primaryBtn, isSavingStartingBalance && styles.btnDisabled]}
          onPress={handleSaveStartingBalance}
          disabled={isSavingStartingBalance}
          activeOpacity={0.8}
        >
          {isSavingStartingBalance ? <ActivityIndicator size="small" color="#1C1C1E" /> : <Text style={styles.primaryBtnText}>{t('save')}</Text>}
        </TouchableOpacity>
      </BottomSheetModal>

      {/* Export Modal */}
      <BottomSheetModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={t('export_data')}
        icon="cloud-download"
        iconBg="#ECFDF5"
        iconColor="#10B981"
        autoHeight
      >
        <Text style={styles.modalIntroText}>
          {t('export_desc')}
        </Text>

        {(['json', 'csv'] as const).map(format => {
          const isActive = exportFormat === format;
          const meta =
            format === 'json'
              ? {
                icon: 'code-slash' as const,
                bg: '#FEF3C7',
                color: '#D97706',
                title: t('json_backup'),
                desc: t('json_desc'),
                recommended: true,
              }
              : {
                icon: 'grid-outline' as const,
                bg: '#EFF6FF',
                color: '#2563EB',
                title: t('csv_backup'),
                desc: t('csv_desc'),
                recommended: false,
              };
          return (
            <TouchableOpacity
              key={format}
              style={[styles.formatCard, isActive && styles.formatCardActive]}
              onPress={() => setExportFormat(format)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.formatCardLeft}>
                <View style={[styles.formatIconCircle, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={styles.formatTextWrap}>
                  <View style={styles.formatTitleRow}>
                    <Text style={styles.formatTitle}>{meta.title}</Text>
                    {meta.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>{t('recommended')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.formatDesc}>{meta.desc}</Text>
                </View>
              </View>
              <Ionicons
                name={isActive ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={isActive ? meta.color : '#CBD5E1'}
              />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.primaryBtn, isExporting && styles.btnDisabled]}
          onPress={() => handleExport(exportFormat)}
          disabled={isExporting}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#1C1C1E" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#1C1C1E" style={styles.btnIcon} />
              <Text style={styles.primaryBtnText}>{t('download_backup')} (.{exportFormat})</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowExportModal(false)} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </BottomSheetModal>

      {/* Import Modal */}
      <BottomSheetModal
        visible={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportText('');
        }}
        title={t('import_data')}
        icon="cloud-upload"
        iconBg="#EFF6FF"
        iconColor="#3B82F6"
        autoHeight
      >
        <Text style={styles.modalIntroText}>
          {t('import_desc')}
        </Text>

        {!selectedImportFile ? (
          <TouchableOpacity
            style={[styles.fileSelectBtn, isImporting && styles.btnDisabled]}
            onPress={handlePickAndImportFile}
            disabled={isImporting}
            activeOpacity={0.8}
          >
            <>
              <Ionicons name="document-attach-outline" size={22} color="#1C1C1E" style={styles.btnIcon} />
              <Text style={styles.fileSelectBtnText}>{t('choose_backup_file')}</Text>
            </>
          </TouchableOpacity>
        ) : (
          <View style={styles.selectedFileBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
              <Ionicons name="document-text" size={24} color="#3B82F6" style={{ marginRight: 10 }} />
              <Text style={styles.selectedFileName} numberOfLines={1}>{selectedImportFile}</Text>
            </View>
            <TouchableOpacity onPress={clearSelectedFile} style={styles.removeFileBtn}>
              <Ionicons name="close-circle" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.orDividerRow}>
          <View style={styles.orDividerLine} />
          <Text style={styles.orDividerText}>{t('or_paste_text')}</Text>
          <View style={styles.orDividerLine} />
        </View>

        <TextInput
          style={[styles.importInput, { color: '#1C1C1E' }]}
          multiline
          numberOfLines={6}
          placeholder={'[{"date":"2024-01-15","amount":250,"category":"Food","type":"debit"}]'}
          placeholderTextColor="#94A3B8"
          value={importText}
          onChangeText={setImportText}
          textAlignVertical="top"
          accessibilityLabel="Paste backup JSON or CSV text"
        />

        {importText.trim().length > 0 && (
          <TouchableOpacity
            style={[styles.primaryBtn, (isImporting || !importText.trim()) && styles.btnDisabled]}
            onPress={() => handleImportSubmit()}
            disabled={isImporting || !importText.trim()}
            activeOpacity={0.8}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#1C1C1E" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#1C1C1E" style={styles.btnIcon} />
                <Text style={styles.primaryBtnText}>Import Backup Data</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            setShowImportModal(false);
            setImportText('');
            setSelectedImportFile(null);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </BottomSheetModal>

      {/* Legal Modal */}
      <Modal visible={!!legalDoc} animationType="slide" onRequestClose={() => setLegalDoc(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={styles.fullPageHeader}>
            <TouchableOpacity onPress={() => setLegalDoc(null)} style={styles.fullPageBackBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.fullPageTitle}>
              {legalDoc === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
            </Text>
            <View style={{ width: 44 }} />
          </View>
          <ScrollView style={styles.fullPageContent} showsVerticalScrollIndicator={false}>
            {legalDoc === 'privacy' ? (
              <Text style={styles.legalText}>
                <Text style={styles.legalTextBold}>Rupeo Privacy Policy</Text>
                {'\n'}Last Updated: Aug 2026{'\n\n'}
                
                <Text style={styles.legalTextSemibold}>1. Information We Collect:</Text> When you register, we collect your email, display name, and profile picture provided by your authentication provider. We also securely store the financial data you input, including transaction amounts, categories, and payment modes.{'\n\n'}
                
                <Text style={styles.legalTextSemibold}>2. How We Use Your Data:</Text> Your data is used exclusively to provide the Rupeo service—syncing your finances across devices, generating analytics, and providing AI-driven insights. Rupeo does not sell, rent, or trade your personal or financial data to third parties.{'\n\n'}
                
                <Text style={styles.legalTextSemibold}>3. AI Features & Third-Party Processing:</Text> When you use Rupeo's AI features (e.g., smart categorization, financial chat), your input may be securely processed by our authorized LLM partners. Only the context necessary for the query is shared, and it is strictly isolated from model training.{'\n\n'}
                
                <Text style={styles.legalTextSemibold}>4. Data Security & Storage:</Text> All data is encrypted in transit and at rest using industry-standard protocols via Firebase Cloud Infrastructure. The app also caches data locally on your device for offline access.{'\n\n'}
                
                <Text style={styles.legalTextSemibold}>5. Data Retention & Your Rights:</Text> You own your data. You may export your data at any time via the Export Backup tool. You can also permanently delete your account and all associated data instantly using the "Delete My Account" button in the Settings menu. Upon deletion, data is irreversibly wiped from our active servers.
              </Text>
            ) : (
              <Text style={styles.legalText}>
                <Text style={styles.legalTextBold}>Rupeo Terms & Conditions</Text>
                {'\n'}Last Updated: Aug 2026{'\n\n'}

                <Text style={styles.legalTextSemibold}>1. Acceptance of Terms:</Text> By creating an account or using Rupeo, you agree to these terms. If you do not agree, please do not use the application.{'\n\n'}
                
                <Text style={styles.legalTextSemibold}>2. App Usage & Restrictions:</Text> Rupeo is intended for personal and non-commercial financial tracking. You agree not to misuse the app, attempt to breach our security, or use the service for fraudulent activities.{'\n\n'}
                
                <Text style={styles.legalTextSemibold}>3. Financial Disclaimer:</Text> Rupeo is a tracking tool, not a financial advisor. Any insights, AI summaries, or metrics provided by the app are for informational purposes only. We are not liable for any financial decisions, losses, or damages resulting from the use of this app.{'\n\n'}
                
                <Text style={styles.legalTextSemibold}>4. Service Availability & AI Limits:</Text> While we strive for 100% uptime, Rupeo is provided "as is". AI features may be subject to fair-use limits. We reserve the right to throttle or disable features to prevent abuse or service degradation.{'\n\n'}
                
                <Text style={styles.legalTextSemibold}>5. Account Termination:</Text> We reserve the right to suspend or terminate your account at any time without notice if we suspect a violation of these Terms.{'\n\n'}
                
                <Text style={styles.legalTextSemibold}>6. Modifications:</Text> We may update these Terms periodically. Continued use of the app constitutes acceptance of the new Terms.
              </Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ConfirmDialogModal
        visible={logoutModalVisible}
        title={t('log_out')}
        message={t('logout_msg')}
        confirmText={t('log_out')}
        cancelText={t('cancel')}
        type="warning"
        icon="log-out-outline"
        onConfirm={() => {
          setLogoutModalVisible(false);
          logout();
        }}
        onCancel={() => setLogoutModalVisible(false)}
      />

      <ConfirmDialogModal
        visible={deleteDataModalVisible}
        title={t('delete_all_transactions')}
        message={t('delete_all_transactions_msg')}
        confirmText={t('delete_all')}
        cancelText={t('cancel')}
        type="danger"
        icon="trash-bin-outline"
        loading={isDeletingData}
        onConfirm={executeDeleteAllData}
        onCancel={() => setDeleteDataModalVisible(false)}
      />

      <ConfirmDialogModal
        visible={deleteAccountModalVisible}
        title={t('delete_my_account')}
        message={t('delete_account_msg')}
        confirmText={t('delete_my_account')}
        cancelText={t('cancel')}
        type="danger"
        icon="person-remove-outline"
        loading={isDeletingAccount}
        onConfirm={executeDeleteAccount}
        onCancel={() => setDeleteAccountModalVisible(false)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const COLORS = {
  brand: '#FFD740',
  brandDark: '#F59E0B',
  ink: '#1C1C1E',
  navy: '#0F172A',
  navySoft: '#1E293B',
  navyBorder: '#334155',
  muted: '#9CA3AF',
  mutedSoft: '#94A3B8',
  border: '#E5E7EB',
  cardBg: '#F7F8FC',
  danger: '#E63946',
  success: '#10B981',
  info: '#3B82F6',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, maxWidth: 500, width: '100%', alignSelf: 'center', paddingBottom: 40 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 16, color: COLORS.muted, fontWeight: '800' },

  topHalf: { backgroundColor: '#F8FAFC', paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#64748B', marginTop: 4 },

  bottomHalf: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },

  profileCardWrapper: {
    marginBottom: 28,
    borderRadius: 24,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  profileCard: { padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarContainerVip: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: '#EFF6FF' },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#DBEAFE',
  },
  avatarPlaceholderVip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FFD740',
  },
  avatarLetter: { fontSize: 36, fontWeight: '900', color: '#3B82F6' },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  vipCrownBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD740',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  vipPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vipPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.4,
  },
  userName: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 4, letterSpacing: -0.5 },
  userEmail: { fontSize: 14, color: '#64748B', marginBottom: 24, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 30, backgroundColor: '#E2E8F0' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // RUPEO PRO BANNER STYLES
  proBannerCardWrapper: {
    marginBottom: 24,
    borderRadius: 22,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
  proBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  proBannerCardVip: {
    borderColor: '#FFD740',
  },
  proBannerCardFree: {
    borderColor: 'rgba(255, 215, 64, 0.4)',
  },
  proBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  proCrownCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  proCrownCircleVip: {
    backgroundColor: '#162032',
    borderColor: '#FFD740',
    shadowColor: '#FFD740',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  proCrownCircleFree: {
    backgroundColor: '#1C150A',
    borderColor: 'rgba(255, 215, 64, 0.5)',
  },
  proBannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  proActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  proActiveBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: 0.4,
  },
  proAdFreeBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
  },
  proAdFreeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#07090E',
    letterSpacing: 0.4,
  },
  proBannerSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  proActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 3,
  },
  proActionPillVip: {
    backgroundColor: 'rgba(255, 215, 64, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 64, 0.3)',
  },
  proActionPillFree: {
    backgroundColor: '#FFD740',
  },
  proActionPillText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  proActionPillTextVip: {
    color: '#FFD740',
  },
  proActionPillTextFree: {
    color: '#07090E',
  },

  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 16,
  },
  infoCard: { 
    backgroundColor: 'transparent', 
    gap: 8,
  },
  backupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  backupAction: {
    flex: 1,
    minHeight: 92,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  backupActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  backupActionLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 14, color: '#0F172A', marginBottom: 2, fontWeight: '700' },
  infoValue: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  infoDivider: { display: 'none' },

  prefRow: { 
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  prefLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  aiPrefRow: { 
    alignItems: 'flex-start', 
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  aiPrefLabelWrap: { flex: 1, marginRight: 8, marginBottom: 10 },
  aiPrefLabelRow: { flexDirection: 'row', alignItems: 'center' },
  aiSparkIcon: { marginRight: 4 },
  aiPrefLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  aiPrefSubLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },

  pillContainer: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activePill: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  activePillAccent: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  pillText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  activePillText: { color: '#FFFFFF' },
  activePillTextAccent: { color: '#92400E', fontWeight: '900' },

  currencySelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currencySymbolText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  versionText: { textAlign: 'center', color: '#94A3B8', fontSize: 12, fontWeight: '800', marginBottom: 40 },

  // Danger Zone Card
  dangerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dangerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dangerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dangerIconWrapRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  dangerTextWrap: {
    flex: 1,
  },
  dangerRowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  dangerRowSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },

  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: '#E63946',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  deleteAccountBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '82%',
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 0,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  autoHeightModal: {
    height: '100%',
    maxHeight: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  modalBodyContent: {
    paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.ink, letterSpacing: -0.5 },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: { flex: 1 },
  modalIntroText: { fontSize: 13.5, color: '#64748B', marginBottom: 18, lineHeight: 20, fontWeight: '600' },
  startingBalanceInputRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  startingBalanceCurrency: { color: '#B45309', fontSize: 22, fontWeight: '900', marginRight: 10 },
  startingBalanceInput: { flex: 1, color: '#1C1C1E', fontSize: 22, fontWeight: '800', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) } as any,

  legalText: { fontSize: 16, color: '#4B5563', lineHeight: 26, fontWeight: '500' },
  legalTextBold: { fontWeight: '900', color: '#0F172A' },
  legalTextSemibold: { fontWeight: '700', color: '#1E293B' },
  
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fullPageBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  fullPageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  fullPageContent: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 8,
  },

  fileSelectBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.brand,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.brandDark,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  fileSelectBtnText: { fontSize: 15, fontWeight: '900', color: COLORS.ink },

  selectedFileBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
    flexShrink: 1,
  },
  removeFileBtn: {
    padding: 4,
  },

  importInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    fontSize: 13,
    color: COLORS.ink,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 120,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  } as any,

  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.brand,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.brandDark,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '900', color: COLORS.ink },
  btnIcon: { marginRight: 8 },
  btnDisabled: { opacity: 0.65 },

  cancelBtn: { padding: 12, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.muted },

  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  formatCardActive: { backgroundColor: '#FFFBEB', borderColor: COLORS.brandDark },
  formatCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 },
  formatIconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  formatTextWrap: { flex: 1 },
  formatTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  formatTitle: { fontSize: 14.5, fontWeight: '900', color: COLORS.navy },
  formatDesc: { fontSize: 11.5, color: '#64748B', lineHeight: 16, fontWeight: '500' },
  recommendedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  recommendedBadgeText: { fontSize: 9.5, fontWeight: '900', color: '#B45309', textTransform: 'uppercase' },

  orDividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 10 },
  orDividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orDividerText: { fontSize: 11, fontWeight: '900', color: COLORS.mutedSoft, letterSpacing: 0.5 },
});