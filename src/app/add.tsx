import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { insertTransaction, getUserCategories, CategoryItem, defaultCategories } from '@/lib/database';
import { useAuth } from '@/context/AuthContext';
import { showTransactionSaveAd } from '@/lib/ads';
import { useTranslation } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import CategoryIcon from '@/components/CategoryIcon';
import * as ImagePicker from 'expo-image-picker';
import { safeGoBack } from '@/lib/navigation';
import { formatTime12Hour, getLocalDateString, getRelativeDateString } from '@/lib/dateUtils';
import Toast from 'react-native-toast-message';
import { playTransactionSuccessSound } from '@/lib/sound';

// High-res 3D Sugary / Fluent Animated Icons
const ICONS_3D = {
  expense: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Money%20with%20Wings.png',
  income: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Money%20Bag.png',
  checkmark: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Check%20Mark%20Button.png',
  upi: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/High%20Voltage.png',
  cash: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Dollar%20Banknote.png',
  card: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Credit%20Card.png',
  bank: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Bank.png',
  receipt: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Receipt.png',
  calendar: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Calendar.png',
  camera: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Camera.png',
  gallery: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Framed%20Picture.png',
  memo: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Memo.png',
  party: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Party%20Popper.png',
  sparkles: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png',
  fire: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fire.png',
};

const PAYMENT_MODES = [
  { id: 'UPI', label: 'UPI', icon3d: ICONS_3D.upi, color: '#7C3AED', tag: 'Fast' },
  { id: 'Cash', label: 'Cash', icon3d: ICONS_3D.cash, color: '#16A34A', tag: 'Paper' },
  { id: 'Card', label: 'Card', icon3d: ICONS_3D.card, color: '#2563EB', tag: 'Bank' },
  { id: 'Bank', label: 'Bank', icon3d: ICONS_3D.bank, color: '#D97706', tag: 'NEFT' },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

const EXPENSE_SUGGESTIONS = [
  {
    label: 'Chai & Snacks',
    category: 'Food',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Hot%20Beverage.png',
  },
  {
    label: 'Food & Dining',
    category: 'Food',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Pizza.png',
  },
  {
    label: 'Groceries / Mart',
    category: 'Groceries',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shopping%20Cart.png',
  },
  {
    label: 'Petrol & Fuel',
    category: 'Transport',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fuel%20Pump.png',
  },
  {
    label: 'Cab & Auto',
    category: 'Transport',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Taxi.png',
  },
  {
    label: 'Phone Recharge',
    category: 'Bills',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Mobile%20Phone.png',
  },
  {
    label: 'House Rent',
    category: 'Bills',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/House.png',
  },
  {
    label: 'Shopping',
    category: 'Shopping',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shopping%20Bags.png',
  },
  {
    label: 'Medicines',
    category: 'Health',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Pill.png',
  },
];

const INCOME_SUGGESTIONS = [
  {
    label: 'Salary Credit',
    category: 'Salary',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Briefcase.png',
  },
  {
    label: 'Freelance & Gig',
    category: 'Freelance',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png',
  },
  {
    label: 'Business Sales',
    category: 'Business',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Chart%20Increasing.png',
  },
  {
    label: 'Cashback / Bonus',
    category: 'Income',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Wrapped%20Gift.png',
  },
  {
    label: 'Dividends / Stock',
    category: 'Investments',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bar%20Chart.png',
  },
];

const INCOME_CATEGORY_ITEMS = [
  {
    name: 'Salary',
    color: '#10B981',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Briefcase.png',
  },
  {
    name: 'Business',
    color: '#059669',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Chart%20Increasing.png',
  },
  {
    name: 'Freelance',
    color: '#0EA5E9',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png',
  },
  {
    name: 'Investments',
    color: '#8B5CF6',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bar%20Chart.png',
  },
  {
    name: 'Cashback',
    color: '#F59E0B',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Wrapped%20Gift.png',
  },
  {
    name: 'Rental',
    color: '#EC4899',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/House.png',
  },
  {
    name: 'Bonus',
    color: '#FCD34D',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Trophy.png',
  },
  {
    name: 'Dividends',
    color: '#6366F1',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Coin.png',
  },
  {
    name: 'Income',
    color: '#10B981',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Money%20Bag.png',
  },
  {
    name: 'Other',
    color: '#64748B',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Package.png',
  },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user, settings, isPremium } = useAuth();
  const { t } = useTranslation();
  const curr = settings?.currency === 'INR' ? '₹' : (settings?.currency || '₹');

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [category, setCategory] = useState('Food');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Date management
  const todayStr = getLocalDateString();
  const yesterdayStr = getRelativeDateString(-1);
  const [date, setDate] = useState(todayStr);

  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Orchestrated Luxury Success animations
  const successScale = useRef(new Animated.Value(0.3)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successRingScale = useRef(new Animated.Value(0.6)).current;
  const successRingOpacity = useRef(new Animated.Value(1)).current;
  const successCheckScale = useRef(new Animated.Value(0.1)).current;
  const successCheckRotate = useRef(new Animated.Value(0)).current;
  const successBurst = useRef(new Animated.Value(0)).current;
  const successContentY = useRef(new Animated.Value(20)).current;
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (user?.uid) {
      getUserCategories(user.uid)
        .then((cats) => {
          if (cats && cats.length > 0) {
            setCategories(cats);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const handleAmountChange = (val: string) => {
    const filtered = val.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    if (parts.length > 2) {
      setAmount(parts[0] + '.' + parts.slice(1).join('').replace(/\./g, ''));
    } else {
      setAmount(filtered);
    }
  };

  const addQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const applyQuickSuggestion = (item: { label: string; category: string }) => {
    setMerchant(item.label);
    if (item.category) {
      setCategory(item.category);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Uri = result.assets[0].base64
          ? `data:image/jpeg;base64,${result.assets[0].base64}`
          : result.assets[0].uri;
        setReceiptImage(base64Uri);
      }
    } catch (err) {
      console.warn('Error picking image:', err);
      Toast.show({ type: 'error', text1: 'Photo Error', text2: 'Could not access photo library' });
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Required', text2: 'Camera permission is required' });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Uri = result.assets[0].base64
          ? `data:image/jpeg;base64,${result.assets[0].base64}`
          : result.assets[0].uri;
        setReceiptImage(base64Uri);
      }
    } catch (err) {
      console.warn('Error taking photo:', err);
      Toast.show({ type: 'error', text1: 'Camera Error', text2: 'Could not open camera' });
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Toast.show({ type: 'error', text1: 'Enter Amount', text2: 'Please enter a valid amount greater than 0' });
      return;
    }
    if (!merchant.trim()) {
      Toast.show({ type: 'error', text1: 'Enter Purpose', text2: 'Please enter what this transaction was for' });
      return;
    }

    try {
      setIsSaving(true);
      if (!user?.uid) throw new Error('Not logged in');

      const now = new Date();
      const timeStr = formatTime12Hour(now);

      await insertTransaction(user.uid, {
        date: date || todayStr,
        time: timeStr,
        amount: numAmount,
        type: type,
        merchant_name: merchant.trim(),
        description: description.trim() || undefined,
        category: type === 'credit' && category === 'Food' ? 'Income' : category,
        payment_mode: paymentMode,
        receipt_image: receiptImage || null,
      });

      if (type === 'debit') {
        const { getCategoryTotals } = await import('@/lib/database');
        const cats = await getCategoryTotals(user.uid);
        const thisMonthSpend = cats.reduce((sum: number, c: any) => sum + c.amount, 0);
        const budget = Number(settings?.monthlyBudget) || 0;

        if (budget > 0 && thisMonthSpend > budget) {
          const { sendBudgetAlert } = await import('@/lib/notifications');
          const over = Math.round(thisMonthSpend - budget);
          sendBudgetAlert(over, curr, thisMonthSpend, budget, undefined, user.uid).catch(console.error);
        }
      }

      Keyboard.dismiss();
      playTransactionSuccessSound().catch(() => {});
      setShowSaveSuccess(true);
      successScale.setValue(0.3);
      successOpacity.setValue(0);
      successRingScale.setValue(0.6);
      successRingOpacity.setValue(1);
      successCheckScale.setValue(0.1);
      successCheckRotate.setValue(0);
      successBurst.setValue(0);
      successContentY.setValue(20);

      Animated.parallel([
        // Card pop in
        Animated.spring(successScale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        
        // 3D Checkmark bounce & rotation
        Animated.spring(successCheckScale, { toValue: 1, friction: 3.8, tension: 120, delay: 60, useNativeDriver: true }),
        Animated.spring(successCheckRotate, { toValue: 1, friction: 5, tension: 80, delay: 60, useNativeDriver: true }),
        
        // Particle explosion burst
        Animated.timing(successBurst, { toValue: 1, duration: 650, delay: 80, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),

        // Expanding ambient aura rings
        Animated.timing(successRingScale, { toValue: 1.7, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(successRingOpacity, { toValue: 0, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),

        // Content reveal slide
        Animated.spring(successContentY, { toValue: 0, friction: 7, tension: 85, delay: 100, useNativeDriver: true }),
      ]).start();

      successTimer.current = setTimeout(() => {
        showTransactionSaveAd(isPremium).catch(() => {});
        safeGoBack(router);
      }, 1450);
    } catch (error: any) {
      console.error('Failed to add transaction', error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to save transaction' });
      setIsSaving(false);
    }
  };

  const isExpense = type === 'debit';
  const themeColor = isExpense ? '#EF4444' : '#10B981';
  const suggestions = isExpense ? EXPENSE_SUGGESTIONS : INCOME_SUGGESTIONS;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* TOP BAR */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => safeGoBack(router)}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <ExpoImage
              source={{ uri: isExpense ? ICONS_3D.expense : ICONS_3D.income }}
              style={{ width: 22, height: 22, marginRight: 6 }}
              contentFit="contain"
            />
            <Text style={styles.headerTitle}>
              {isExpense ? 'New Expense' : 'New Income'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/categories')}
            style={styles.catsHeaderBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="grid-outline" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 130 : 150 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 3D TACTILE EXPENSE / INCOME SWITCH */}
          <View style={styles.typeSwitchWrap}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                isExpense && styles.typeBtnExpenseActive,
              ]}
              onPress={() => {
                setType('debit');
                setCategory('Food');
              }}
              activeOpacity={0.85}
            >
              <ExpoImage
                source={{ uri: ICONS_3D.expense }}
                style={{ width: 22, height: 22, marginRight: 8 }}
                contentFit="contain"
              />
              <Text
                style={[
                  styles.typeBtnText,
                  isExpense && styles.typeBtnTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                !isExpense && styles.typeBtnIncomeActive,
              ]}
              onPress={() => {
                setType('credit');
                setCategory('Salary');
              }}
              activeOpacity={0.85}
            >
              <ExpoImage
                source={{ uri: ICONS_3D.income }}
                style={{ width: 22, height: 22, marginRight: 8 }}
                contentFit="contain"
              />
              <Text
                style={[
                  styles.typeBtnText,
                  !isExpense && styles.typeBtnTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* HERO AMOUNT CARD WITH 3D AMBIENT AURA */}
          <View style={styles.amountCard}>
            <View style={styles.amountHeaderRow}>
              <View
                style={[
                  styles.typeBadgePill,
                  { backgroundColor: isExpense ? '#FEF2F2' : '#ECFDF5', borderColor: isExpense ? '#FECACA' : '#A7F3D0' },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: isExpense ? '#DC2626' : '#059669' },
                  ]}
                >
                  {isExpense ? '💸 MONEY SPENT' : '💰 MONEY RECEIVED'}
                </Text>
              </View>
            </View>

            <View style={styles.amountInputRow}>
              <Text style={[styles.currencyPrefix, { color: themeColor }]}>{curr}</Text>
              <TextInput
                style={[styles.hugeAmountInput, { color: themeColor }]}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#CBD5E1"
                value={amount}
                onChangeText={handleAmountChange}
                maxLength={10}
                autoFocus
              />
            </View>

            {/* QUICK AMOUNT 3D CHIPS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickAmountsWrap}
            >
              {QUICK_AMOUNTS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.quickPill}
                  onPress={() => addQuickAmount(q)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickPillText}>+{curr}{q}</Text>
                </TouchableOpacity>
              ))}
              {amount !== '' && (
                <TouchableOpacity
                  style={styles.clearPill}
                  onPress={() => setAmount('')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="backspace-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.clearPillText}>Clear</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* 1-TAP 3D SUGARY SMART SUGGESTIONS */}
          <View style={styles.card}>
            <View style={styles.fieldHeader}>
              <ExpoImage
                source={{ uri: ICONS_3D.sparkles }}
                style={{ width: 18, height: 18, marginRight: 6 }}
                contentFit="contain"
              />
              <Text style={styles.fieldTitle}>1-Tap Quick Fill</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestions.map((item) => {
                const isMatch = merchant.toLowerCase() === item.label.toLowerCase();
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.suggestionPill,
                      isMatch && styles.suggestionPillActive,
                    ]}
                    onPress={() => applyQuickSuggestion(item)}
                    activeOpacity={0.75}
                  >
                    <ExpoImage
                      source={{ uri: item.iconUrl }}
                      style={{ width: 22, height: 22, marginRight: 6 }}
                      contentFit="contain"
                    />
                    <Text
                      style={[
                        styles.suggestionPillText,
                        isMatch && styles.suggestionPillTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Custom Merchant / Note Title Input */}
            <View style={styles.titleInputWrap}>
              <ExpoImage
                source={{ uri: ICONS_3D.receipt }}
                style={{ width: 20, height: 20, marginRight: 8 }}
                contentFit="contain"
              />
              <TextInput
                style={styles.mainTitleInput}
                placeholder={isExpense ? 'What did you spend on? (e.g. Swiggy, Fuel, Jio)' : 'Source of income? (e.g. Salary, Client project)'}
                placeholderTextColor="#94A3B8"
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>
          </View>

          {/* 3D PAYMENT MODES SELECTOR */}
          <View style={styles.card}>
            <View style={styles.fieldHeader}>
              <ExpoImage
                source={{ uri: ICONS_3D.card }}
                style={{ width: 18, height: 18, marginRight: 6 }}
                contentFit="contain"
              />
              <Text style={styles.fieldTitle}>Payment Mode</Text>
            </View>

            <View style={styles.paymentModesRow}>
              {PAYMENT_MODES.map((pm) => {
                const isSelected = paymentMode === pm.id;
                return (
                  <TouchableOpacity
                    key={pm.id}
                    style={[
                      styles.paymentModePill,
                      isSelected && styles.paymentModePillSelected,
                    ]}
                    onPress={() => setPaymentMode(pm.id)}
                    activeOpacity={0.75}
                  >
                    <ExpoImage
                      source={{ uri: pm.icon3d }}
                      style={{ width: 24, height: 24, marginBottom: 4 }}
                      contentFit="contain"
                    />
                    <Text
                      style={[
                        styles.paymentModeText,
                        isSelected && styles.paymentModeTextSelected,
                      ]}
                    >
                      {pm.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* CATEGORY SELECTOR */}
          <View style={styles.card}>
            <View style={styles.categoryHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ExpoImage
                  source={{ uri: ICONS_3D.fire }}
                  style={{ width: 18, height: 18, marginRight: 6 }}
                  contentFit="contain"
                />
                <Text style={styles.fieldTitle}>Category</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/categories')} activeOpacity={0.7}>
                <Text style={styles.addCategoryLink}>+ New Category</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {isExpense ? (
                categories.map((cat) => {
                  const isSelected = category.toLowerCase() === cat.name.toLowerCase();
                  const catColor = cat.color || '#3B82F6';
                  return (
                    <TouchableOpacity
                      key={cat.id || cat.name}
                      style={[
                        styles.categoryChip,
                        isSelected && {
                          borderColor: catColor,
                          backgroundColor: catColor + '18',
                          shadowColor: catColor,
                          shadowOpacity: 0.25,
                          shadowOffset: { width: 0, height: 2 },
                          shadowRadius: 6,
                          elevation: 2,
                        },
                      ]}
                      onPress={() => setCategory(cat.name)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.catIconWrap,
                          { backgroundColor: catColor + '20' },
                        ]}
                      >
                        <CategoryIcon
                          categoryName={cat.name}
                          iconName={cat.icon}
                          size={16}
                          color={catColor}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && { color: '#0F172A', fontWeight: '900' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                INCOME_CATEGORY_ITEMS.map((incItem) => {
                  const isSelected = category.toLowerCase() === incItem.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={incItem.name}
                      style={[
                        styles.categoryChip,
                        isSelected && {
                          borderColor: incItem.color,
                          backgroundColor: incItem.color + '18',
                          shadowColor: incItem.color,
                          shadowOpacity: 0.3,
                          shadowOffset: { width: 0, height: 2 },
                          shadowRadius: 6,
                          elevation: 3,
                        },
                      ]}
                      onPress={() => setCategory(incItem.name)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.catIconWrap, { backgroundColor: incItem.color + '20' }]}>
                        <ExpoImage
                          source={{ uri: incItem.iconUrl }}
                          style={{ width: 16, height: 16 }}
                          contentFit="contain"
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && { color: '#0F172A', fontWeight: '900' },
                        ]}
                      >
                        {incItem.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* OPTIONAL DETAILS (DATE, RECEIPT, NOTE) */}
          <TouchableOpacity
            style={styles.moreOptionsToggle}
            onPress={() => {
              const next = !showMoreOptions;
              setShowMoreOptions(next);
              if (next) {
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
              }
            }}
            activeOpacity={0.75}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ExpoImage
                source={{ uri: ICONS_3D.memo }}
                style={{ width: 18, height: 18, marginRight: 8 }}
                contentFit="contain"
              />
              <Text style={styles.moreOptionsText}>
                {showMoreOptions ? 'Hide Extra Details' : '+ Add Date, Screenshot or Note'}
              </Text>
            </View>
            <Ionicons
              name={showMoreOptions ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#94A3B8"
            />
          </TouchableOpacity>

          {showMoreOptions && (
            <View style={styles.card}>
              {/* Date */}
              <View style={styles.fieldHeader}>
                <ExpoImage
                  source={{ uri: ICONS_3D.calendar }}
                  style={{ width: 18, height: 18, marginRight: 6 }}
                  contentFit="contain"
                />
                <Text style={styles.fieldTitle}>Date</Text>
              </View>
              <View style={styles.datePillsRow}>
                <TouchableOpacity
                  style={[styles.datePill, date === todayStr && styles.datePillActive]}
                  onPress={() => setDate(todayStr)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.datePillText, date === todayStr && styles.datePillTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.datePill, date === yesterdayStr && styles.datePillActive]}
                  onPress={() => setDate(yesterdayStr)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.datePillText, date === yesterdayStr && styles.datePillTextActive]}>
                    Yesterday
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.customDateInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.innerDivider} />

              {/* Screenshot Proof */}
              <View style={styles.fieldHeader}>
                <ExpoImage
                  source={{ uri: ICONS_3D.camera }}
                  style={{ width: 18, height: 18, marginRight: 6 }}
                  contentFit="contain"
                />
                <Text style={styles.fieldTitle}>Payment Screenshot / Bill</Text>
              </View>

              {receiptImage ? (
                <View style={styles.proofPreviewCard}>
                  <TouchableOpacity
                    style={styles.proofThumbRow}
                    onPress={() => setPreviewModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <ExpoImage source={{ uri: receiptImage }} style={styles.proofThumbnail} contentFit="cover" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.proofAttachedText}>Screenshot Attached</Text>
                      <Text style={styles.proofSubText}>Tap to view full screen</Text>
                    </View>
                    <Ionicons name="eye-outline" size={18} color="#2563EB" />
                  </TouchableOpacity>

                  <View style={styles.proofActionRow}>
                    <TouchableOpacity style={styles.proofActionBtn} onPress={pickImage}>
                      <Ionicons name="swap-horizontal" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                      <Text style={styles.proofActionText}>Replace</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.proofActionBtn}
                      onPress={() => setReceiptImage(null)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={[styles.proofActionText, { color: '#EF4444' }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.attachButtonsRow}>
                  <TouchableOpacity style={styles.attachBtn} onPress={pickImage} activeOpacity={0.7}>
                    <ExpoImage
                      source={{ uri: ICONS_3D.gallery }}
                      style={{ width: 20, height: 20, marginRight: 6 }}
                      contentFit="contain"
                    />
                    <Text style={styles.attachBtnText}>Upload Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.attachBtn} onPress={takePhoto} activeOpacity={0.7}>
                    <ExpoImage
                      source={{ uri: ICONS_3D.camera }}
                      style={{ width: 20, height: 20, marginRight: 6 }}
                      contentFit="contain"
                    />
                    <Text style={styles.attachBtnText}>Take Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.innerDivider} />

              {/* Extra Note */}
              <View style={styles.fieldHeader}>
                <ExpoImage
                  source={{ uri: ICONS_3D.memo }}
                  style={{ width: 18, height: 18, marginRight: 6 }}
                  contentFit="contain"
                />
                <Text style={styles.fieldTitle}>Note / Tags</Text>
              </View>
              <TextInput
                style={styles.noteInput}
                placeholder="Add tags, splits, or remarks..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          )}
        </ScrollView>

        {/* BOTTOM SAVE BUTTON WITH GLOWING GRADIENT */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={
                isExpense
                  ? ['#EF4444', '#DC2626']
                  : ['#10B981', '#059669']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <ExpoImage
                source={{ uri: isExpense ? ICONS_3D.expense : ICONS_3D.income }}
                style={{ width: 24, height: 24, marginRight: 10 }}
                contentFit="contain"
              />
              <Text style={styles.saveBtnText}>
                {isSaving
                  ? 'Saving Transaction...'
                  : `Save ${isExpense ? 'Expense' : 'Income'} ${amount ? `• ${curr}${amount}` : ''}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 3D LUXURY TICK MARK SAVE SUCCESS MODAL WITH SOUND */}
      <Modal visible={showSaveSuccess} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
        <View style={styles.saveSuccessOverlay}>
          <Animated.View style={[styles.saveSuccessContent, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
            {/* Multi-layer expanding radial ripple rings */}
            <Animated.View
              style={[
                styles.saveSuccessRing,
                {
                  borderColor: isExpense ? '#EF4444' : '#10B981',
                  opacity: successRingOpacity,
                  transform: [{ scale: successRingScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.saveSuccessRingSecondary,
                {
                  borderColor: isExpense ? '#FCA5A5' : '#86EFAC',
                  opacity: successRingOpacity,
                  transform: [{ scale: successRingScale }],
                },
              ]}
            />

            {/* Floating 3D Celebration Burst Particles */}
            {[
              { uri: ICONS_3D.sparkles, dx: -55, dy: -55, size: 22 },
              { uri: ICONS_3D.party, dx: 55, dy: -50, size: 24 },
              { uri: ICONS_3D.fire, dx: -65, dy: 15, size: 20 },
              { uri: ICONS_3D.sparkles, dx: 65, dy: 20, size: 22 },
              { uri: ICONS_3D.party, dx: -45, dy: 60, size: 22 },
              { uri: ICONS_3D.sparkles, dx: 45, dy: 60, size: 20 },
            ].map((p, idx) => (
              <Animated.View
                key={idx}
                pointerEvents="none"
                style={[
                  styles.burstParticleWrap,
                  {
                    transform: [
                      {
                        translateX: successBurst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, p.dx],
                        }),
                      },
                      {
                        translateY: successBurst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, p.dy],
                        }),
                      },
                      {
                        scale: successBurst.interpolate({
                          inputRange: [0, 0.4, 1],
                          outputRange: [0, 1.2, 0.85],
                        }),
                      },
                    ],
                    opacity: successBurst.interpolate({
                      inputRange: [0, 0.2, 0.8, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                  },
                ]}
              >
                <ExpoImage
                  source={{ uri: p.uri }}
                  style={{ width: p.size, height: p.size }}
                  contentFit="contain"
                />
              </Animated.View>
            ))}

            {/* Glowing 3D Checkmark Icon Box with Spring & Rotation */}
            <Animated.View
              style={[
                styles.saveSuccessIconBox,
                {
                  backgroundColor: isExpense ? '#FEF2F2' : '#ECFDF5',
                  borderColor: isExpense ? '#EF4444' : '#10B981',
                  transform: [
                    { scale: successCheckScale },
                    {
                      rotate: successCheckRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-22deg', '0deg'],
                      }),
                    },
                  ],
                  shadowColor: isExpense ? '#EF4444' : '#10B981',
                },
              ]}
            >
              <ExpoImage
                source={{ uri: ICONS_3D.checkmark }}
                style={{ width: 56, height: 56 }}
                contentFit="contain"
              />
            </Animated.View>

            {/* Animated Content Container */}
            <Animated.View style={{ alignItems: 'center', width: '100%', transform: [{ translateY: successContentY }] }}>
              {/* Title & Micro badge */}
              <View style={styles.saveSuccessBadgeRow}>
                <ExpoImage
                  source={{ uri: ICONS_3D.sparkles }}
                  style={{ width: 16, height: 16, marginRight: 5 }}
                  contentFit="contain"
                />
                <Text style={[styles.saveSuccessBadgeText, { color: isExpense ? '#DC2626' : '#059669' }]}>
                  {isExpense ? 'EXPENSE RECORDED' : 'INCOME RECORDED'}
                </Text>
              </View>

              {/* Big Formatted Amount */}
              <Text style={[styles.saveSuccessAmount, { color: isExpense ? '#DC2626' : '#059669' }]}>
                {isExpense ? '-' : '+'}{curr}{Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>

              {/* Merchant & Payment Mode Chip */}
              <View style={styles.saveSuccessMetaRow}>
                <Text style={styles.saveSuccessMerchantText} numberOfLines={1}>
                  {merchant || 'Transaction'}
                </Text>
                <View style={styles.saveSuccessModePill}>
                  <Text style={styles.saveSuccessModeText}>{paymentMode} • {category}</Text>
                </View>
              </View>

              <View style={styles.saveSuccessFooterTag}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={styles.saveSuccessFooterText}>Synced to Google Cloud Vault</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>

      {/* FULLSCREEN RECEIPT PREVIEW MODAL */}
      <Modal visible={previewModalOpen} transparent animationType="fade" onRequestClose={() => setPreviewModalOpen(false)}>
        <View style={styles.previewModalBg}>
          <View style={styles.previewTopBar}>
            <Text style={styles.previewTitle}>Screenshot Attached</Text>
            <TouchableOpacity onPress={() => setPreviewModalOpen(false)} style={styles.previewCloseBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.previewImgContainer}>
            {receiptImage && (
              <ExpoImage source={{ uri: receiptImage }} style={styles.previewFullImg} contentFit="contain" />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  catsHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // 3D TACTILE TYPE SWITCH
  typeSwitchWrap: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 18,
    padding: 4,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  typeBtnExpenseActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  typeBtnIncomeActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // AMOUNT CARD
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  amountHeaderRow: {
    marginBottom: 6,
  },
  typeBadgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefix: {
    fontSize: 36,
    fontWeight: '900',
    marginRight: 6,
  },
  hugeAmountInput: {
    fontSize: 46,
    fontWeight: '900',
    minWidth: 90,
    textAlign: 'center',
    paddingVertical: 0,
  },
  quickAmountsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  quickPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
  },
  quickPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  clearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
  },
  clearPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },

  // COMMON CARD
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  suggestionsScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  suggestionPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  suggestionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  suggestionPillTextActive: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
  titleInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  mainTitleInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  // PAYMENT MODES
  paymentModesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentModePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 16,
  },
  paymentModePillSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  paymentModeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  paymentModeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // CATEGORIES
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCategoryLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  categoriesScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  catIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  // MORE OPTIONS TOGGLE
  moreOptionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  moreOptionsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  datePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  datePillActive: {
    backgroundColor: '#0F172A',
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  datePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  customDateInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  innerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  attachButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 14,
  },
  attachBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
  },
  proofPreviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  proofThumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proofThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  proofAttachedText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  proofSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  proofActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  proofActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proofActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 56,
    textAlignVertical: 'top',
  },

  // FOOTER SAVE BUTTON
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
    elevation: 8,
  },
  saveBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // LUXURY SUCCESS OVERLAY
  saveSuccessOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSuccessContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  saveSuccessRing: {
    position: 'absolute',
    top: 14,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  saveSuccessRingSecondary: {
    position: 'absolute',
    top: 6,
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1.5,
  },
  burstParticleWrap: {
    position: 'absolute',
    top: 38,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  saveSuccessIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  saveSuccessBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveSuccessBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  saveSuccessAmount: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  saveSuccessMetaRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  saveSuccessMerchantText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  saveSuccessModePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  saveSuccessModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  saveSuccessFooterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
    justifyContent: 'center',
  },
  saveSuccessFooterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  // PREVIEW MODAL
  previewModalBg: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 40,
  },
  previewTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  previewCloseBtn: {
    padding: 8,
  },
  previewImgContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFullImg: {
    width: '100%',
    height: '100%',
  },
});
