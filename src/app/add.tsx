import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { insertTransaction, getUserCategories, CategoryItem, defaultCategories } from '@/lib/database';
import { useAuth } from '@/context/AuthContext';
import { showTransactionSaveAd, preloadTransactionSaveAd } from '@/lib/ads';
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

import {
  QuickPresetItem,
  PRESET_ICONS,
  DEFAULT_QUICK_COMBOS_EXPENSE,
  DEFAULT_QUICK_COMBOS_INCOME,
  fetchCustomPresets,
  saveCustomPresetItem,
  removeCustomPresetItem,
  fetchHiddenPresetIds,
} from '@/lib/quickPresets';

const QUICK_TILES_EXPENSE = [
  {
    id: 'chai',
    label: 'Chai & Snacks',
    category: 'Food',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Hot%20Beverage.png',
    color: '#D97706',
  },
  {
    id: 'food',
    label: 'Food & Dining',
    category: 'Food',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Pizza.png',
    color: '#EA580C',
  },
  {
    id: 'groceries',
    label: 'Groceries',
    category: 'Groceries',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shopping%20Cart.png',
    color: '#16A34A',
  },
  {
    id: 'petrol',
    label: 'Petrol & Fuel',
    category: 'Transport',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fuel%20Pump.png',
    color: '#DC2626',
  },
  {
    id: 'cab',
    label: 'Cab & Auto',
    category: 'Transport',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Taxi.png',
    color: '#CA8A04',
  },
  {
    id: 'recharge',
    label: 'Recharge / Bills',
    category: 'Bills',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Mobile%20Phone.png',
    color: '#2563EB',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    category: 'Shopping',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shopping%20Bags.png',
    color: '#9333EA',
  },
  {
    id: 'medicines',
    label: 'Medicines',
    category: 'Health',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Pill.png',
    color: '#059669',
  },
];

const QUICK_TILES_INCOME = [
  {
    id: 'salary',
    label: 'Salary Credit',
    category: 'Salary',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Briefcase.png',
    color: '#10B981',
  },
  {
    id: 'business',
    label: 'Business Sales',
    category: 'Business',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Chart%20Increasing.png',
    color: '#059669',
  },
  {
    id: 'freelance',
    label: 'Freelance / Gig',
    category: 'Freelance',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png',
    color: '#0EA5E9',
  },
  {
    id: 'cashback',
    label: 'Cashback / Gift',
    category: 'Cashback',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Wrapped%20Gift.png',
    color: '#F59E0B',
  },
  {
    id: 'investments',
    label: 'Dividends / Stock',
    category: 'Investments',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bar%20Chart.png',
    color: '#8B5CF6',
  },
  {
    id: 'other_income',
    label: 'Other Income',
    category: 'Income',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Money%20Bag.png',
    color: '#64748B',
  },
];


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
  const [entryMode, setEntryMode] = useState<'quick' | 'detailed'>('quick');
  const [selectedTileId, setSelectedTileId] = useState<string>('chai');
  const [savedMerchant, setSavedMerchant] = useState<string>('');
  const [customPresets, setCustomPresets] = useState<QuickPresetItem[]>([]);
  const [hiddenPresetIds, setHiddenPresetIds] = useState<string[]>([]);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetAmount, setNewPresetAmount] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState('Food');
  const [newPresetType, setNewPresetType] = useState<'debit' | 'credit'>('debit');
  const [newPresetIconUrl, setNewPresetIconUrl] = useState(PRESET_ICONS[0].url);
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

  // Preload full-screen interstitial ad early so it is ready immediately on save
  useEffect(() => {
    if (!isPremium) {
      preloadTransactionSaveAd();
    }
  }, [isPremium]);

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

  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchCustomPresets(), fetchHiddenPresetIds()]).then(([custom, hidden]) => {
        setCustomPresets(custom);
        setHiddenPresetIds(hidden);
      });
      if (user?.uid) {
        getUserCategories(user.uid)
          .then((cats) => {
            if (cats && cats.length > 0) {
              setCategories(cats);
            }
          })
          .catch(console.error);
      }
    }, [user?.uid])
  );

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

  const handleQuickTileSelect = (item: { id: string; label: string; category: string }) => {
    setSelectedTileId(item.id);
    setCategory(item.category);
    setMerchant(item.label);
  };

  const handleQuickComboSelect = (combo: QuickPresetItem) => {
    setAmount(combo.amount);
    setCategory(combo.category);
    setMerchant(combo.label);
    if (combo.tileId) {
      setSelectedTileId(combo.tileId);
    } else {
      const match = (isExpense ? QUICK_TILES_EXPENSE : QUICK_TILES_INCOME).find(
        (t) => t.category.toLowerCase() === combo.category.toLowerCase()
      );
      if (match) setSelectedTileId(match.id);
    }
  };

  const handleSaveNewPreset = async () => {
    if (!newPresetLabel.trim()) {
      Toast.show({ type: 'error', text1: 'Name Required', text2: 'Please enter preset name (e.g. Chai, Gym)' });
      return;
    }
    const pAmt = parseFloat(newPresetAmount);
    if (!newPresetAmount || isNaN(pAmt) || pAmt <= 0) {
      Toast.show({ type: 'error', text1: 'Amount Required', text2: 'Please enter a valid amount' });
      return;
    }

    const newPreset: QuickPresetItem = {
      id: 'custom_' + Date.now(),
      label: newPresetLabel.trim(),
      amount: newPresetAmount.trim(),
      category: newPresetCategory || (newPresetType === 'debit' ? 'Food' : 'Salary'),
      iconUrl: newPresetIconUrl,
      type: newPresetType,
      isCustom: true,
    };

    const updated = await saveCustomPresetItem(newPreset);
    setCustomPresets(updated);
    setPresetModalOpen(false);
    setNewPresetLabel('');
    setNewPresetAmount('');
    Toast.show({
      type: 'success',
      text1: 'Preset Added!',
      text2: `${newPreset.label} (${curr}${newPreset.amount}) added to 1-Tap Presets`,
    });
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

    const defaultMerchant = isExpense
      ? (QUICK_TILES_EXPENSE.find((t) => t.id === selectedTileId)?.label || category || 'Expense')
      : (QUICK_TILES_INCOME.find((t) => t.id === selectedTileId)?.label || category || 'Income');

    const finalMerchant = merchant.trim() || defaultMerchant;

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
        merchant_name: finalMerchant,
        description: description.trim() || undefined,
        category: type === 'credit' && category === 'Food' ? 'Income' : category,
        payment_mode: paymentMode,
        receipt_image: receiptImage || null,
      });

      setSavedMerchant(finalMerchant);

      Keyboard.dismiss();
      playTransactionSuccessSound().catch(() => {});
      setShowSaveSuccess(true);
      successScale.setValue(0);
      successOpacity.setValue(0);
      successRingScale.setValue(0.7);
      successRingOpacity.setValue(0.7);
      successCheckScale.setValue(0);
      successContentY.setValue(20);

      Animated.parallel([
        // Emerald circle spring pop
        Animated.spring(successScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),

        // Soft ambient halo ring expansion
        Animated.timing(successRingScale, { toValue: 1.6, duration: 750, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(successRingOpacity, { toValue: 0, duration: 750, easing: Easing.out(Easing.ease), useNativeDriver: true }),

        // White tick mark pop & lock
        Animated.spring(successCheckScale, { toValue: 1, friction: 3.5, tension: 130, delay: 60, useNativeDriver: true }),

        // Content reveal slide
        Animated.spring(successContentY, { toValue: 0, friction: 7, tension: 85, delay: 100, useNativeDriver: true }),
      ]).start();

      successTimer.current = setTimeout(() => {
        showTransactionSaveAd(isPremium, () => {
          safeGoBack(router);
        }).catch(() => {
          safeGoBack(router);
        });
      }, 950);
    } catch (error: any) {
      console.error('Failed to add transaction', error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to save transaction' });
      setIsSaving(false);
    }
  };

  const isExpense = type === 'debit';
  const themeColor = isExpense ? '#EF4444' : '#10B981';
  const suggestions = isExpense ? EXPENSE_SUGGESTIONS : INCOME_SUGGESTIONS;
  const activePresets = (
    isExpense
      ? [
          ...customPresets.filter((p) => p.type === 'debit' || !p.type),
          ...DEFAULT_QUICK_COMBOS_EXPENSE,
        ]
      : [
          ...customPresets.filter((p) => p.type === 'credit'),
          ...DEFAULT_QUICK_COMBOS_INCOME,
        ]
  ).filter((p) => !hiddenPresetIds.includes(p.id));

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

          {/* SEGMENTED SWITCH: QUICK vs DETAILED */}
          <View style={styles.modeSegment}>
            <TouchableOpacity
              style={[styles.modeTab, entryMode === 'quick' && styles.modeTabActive]}
              onPress={() => setEntryMode('quick')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="flash"
                size={13}
                color={entryMode === 'quick' ? '#D97706' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.modeTabText, entryMode === 'quick' && styles.modeTabTextActive]}>
                Quick Add
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, entryMode === 'detailed' && styles.modeTabActive]}
              onPress={() => setEntryMode('detailed')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="options-outline"
                size={13}
                color={entryMode === 'detailed' ? '#2563EB' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.modeTabText, entryMode === 'detailed' && styles.modeTabTextActive]}>
                Detailed
              </Text>
            </TouchableOpacity>
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
                setSelectedTileId('chai');
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
                setSelectedTileId('salary');
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

          {entryMode === 'quick' ? (
            <>
              {/* ⚡ 1-TAP QUICK COMBOS */}
              <View style={styles.quickCombosCard}>
                <View style={styles.combosHeaderRow}>
                  <View style={styles.fieldHeader}>
                    <ExpoImage
                      source={{ uri: ICONS_3D.sparkles }}
                      style={{ width: 18, height: 18, marginRight: 6 }}
                      contentFit="contain"
                    />
                    <Text style={styles.fieldTitle}>⚡ 1-Tap Quick Presets</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addPresetHeaderBtn}
                    onPress={() => {
                      setNewPresetType(type);
                      setNewPresetCategory(category || (isExpense ? 'Food' : 'Salary'));
                      setPresetModalOpen(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="add" size={15} color="#B45309" style={{ marginRight: 2 }} />
                    <Text style={styles.addPresetHeaderText}>Add</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.combosScroll}
                >
                  {activePresets.map((combo) => (
                    <TouchableOpacity
                      key={combo.id || combo.label + combo.amount}
                      style={[
                        styles.comboChip,
                        combo.isCustom && styles.comboChipCustom,
                      ]}
                      onPress={() => handleQuickComboSelect(combo)}
                      activeOpacity={0.75}
                    >
                      <ExpoImage
                        source={{ uri: combo.iconUrl }}
                        style={{ width: 24, height: 24, marginRight: 6 }}
                        contentFit="contain"
                      />
                      <View>
                        <Text style={styles.comboLabel} numberOfLines={1}>{combo.label}</Text>
                        <Text style={styles.comboAmount}>{curr}{combo.amount}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* QUICK CATEGORY 1-TAP GRID */}
              <View style={styles.card}>
                <View style={styles.fieldHeader}>
                  <ExpoImage
                    source={{ uri: ICONS_3D.fire }}
                    style={{ width: 18, height: 18, marginRight: 6 }}
                    contentFit="contain"
                  />
                  <Text style={styles.fieldTitle}>
                    {isExpense ? 'Select What You Spent On' : 'Select Income Source'}
                  </Text>
                </View>

                <View style={styles.quickGrid}>
                  {(isExpense ? QUICK_TILES_EXPENSE : QUICK_TILES_INCOME).map((tile) => {
                    const isSelected = selectedTileId === tile.id;
                    return (
                      <TouchableOpacity
                        key={tile.id}
                        style={[
                          styles.quickGridTile,
                          isSelected && [
                            styles.quickGridTileSelected,
                            { borderColor: tile.color },
                          ],
                        ]}
                        onPress={() => handleQuickTileSelect(tile)}
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            styles.quickTileIconWrap,
                            { backgroundColor: tile.color + '18' },
                            isSelected && { backgroundColor: tile.color + '35' },
                          ]}
                        >
                          <ExpoImage
                            source={{ uri: tile.iconUrl }}
                            style={{ width: 28, height: 28 }}
                            contentFit="contain"
                          />
                        </View>
                        <Text
                          style={[
                            styles.quickTileLabel,
                            isSelected && { color: '#0F172A', fontWeight: '900' },
                          ]}
                          numberOfLines={1}
                        >
                          {tile.label}
                        </Text>
                        {isSelected && (
                          <View style={[styles.tileCheckDot, { backgroundColor: tile.color }]}>
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* COMPACT PAYMENT VIA ROW */}
              <View style={styles.card}>
                <View style={styles.fieldHeader}>
                  <ExpoImage
                    source={{ uri: ICONS_3D.card }}
                    style={{ width: 18, height: 18, marginRight: 6 }}
                    contentFit="contain"
                  />
                  <Text style={styles.fieldTitle}>Payment Via</Text>
                </View>
                <View style={styles.compactPaymentRow}>
                  {PAYMENT_MODES.map((pm) => {
                    const isSelected = paymentMode === pm.id;
                    return (
                      <TouchableOpacity
                        key={pm.id}
                        style={[
                          styles.compactPaymentPill,
                          isSelected && styles.compactPaymentPillSelected,
                        ]}
                        onPress={() => setPaymentMode(pm.id)}
                        activeOpacity={0.75}
                      >
                        <ExpoImage
                          source={{ uri: pm.icon3d }}
                          style={{ width: 18, height: 18, marginRight: 6 }}
                          contentFit="contain"
                        />
                        <Text
                          style={[
                            styles.compactPaymentText,
                            isSelected && styles.compactPaymentTextSelected,
                          ]}
                        >
                          {pm.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* PURPOSE / NOTE (AUTO-FILLED, EDITABLE) */}
              <View style={styles.card}>
                <View style={styles.fieldHeader}>
                  <ExpoImage
                    source={{ uri: ICONS_3D.receipt }}
                    style={{ width: 18, height: 18, marginRight: 6 }}
                    contentFit="contain"
                  />
                  <Text style={styles.fieldTitle}>Purpose / Note (Auto-Filled)</Text>
                </View>
                <View style={styles.quickPurposeInputRow}>
                  <TextInput
                    style={styles.quickPurposeInput}
                    value={merchant}
                    onChangeText={setMerchant}
                    placeholder={category || 'e.g. Chai, Petrol, Groceries'}
                    placeholderTextColor="#94A3B8"
                  />
                  {merchant !== '' && (
                    <TouchableOpacity onPress={() => setMerchant('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* SWITCH TO DETAILED HINT */}
              <TouchableOpacity
                style={styles.switchToDetailedHint}
                onPress={() => setEntryMode('detailed')}
                activeOpacity={0.75}
              >
                <Ionicons name="options-outline" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
                <Text style={styles.switchToDetailedText}>
                  Need receipt photos, dates or notes? <Text style={styles.switchToDetailedLink}>Switch to Detailed →</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
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

              {/* SWITCH TO QUICK HINT */}
              <TouchableOpacity
                style={styles.switchToDetailedHint}
                onPress={() => setEntryMode('quick')}
                activeOpacity={0.75}
              >
                <Ionicons name="flash" size={16} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.switchToDetailedText}>
                  Want faster 2-tap adding? <Text style={[styles.switchToDetailedLink, { color: '#B45309' }]}>Switch to Quick Add ⚡</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* BOTTOM SAVE BUTTON WITH GLOWING GRADIENT */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.saveBtn, (!amount || parseFloat(amount) <= 0) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving || !amount || parseFloat(amount) <= 0}
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
                  : `${entryMode === 'quick' ? '⚡ Quick Save' : 'Save'} ${isExpense ? 'Expense' : 'Income'} ${amount ? `• ${curr}${amount}` : ''}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* MINIMALISTIC FULLSCREEN SUCCESS TICK ANIMATION */}
      <Modal visible={showSaveSuccess} transparent={false} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
        <SafeAreaView style={styles.fullscreenSuccessContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          
          <View style={styles.fullscreenSuccessCenter}>
            {/* Soft Ambient Halo */}
            <Animated.View
              style={[
                styles.fullscreenSuccessRing,
                {
                  opacity: successRingOpacity,
                  transform: [{ scale: successRingScale }],
                },
              ]}
            />

            {/* Solid Emerald Checkmark Circle */}
            <Animated.View
              style={[
                styles.fullscreenCheckCircle,
                {
                  opacity: successOpacity,
                  transform: [{ scale: successScale }],
                },
              ]}
            >
              <Animated.View style={{ transform: [{ scale: successCheckScale }] }}>
                <Ionicons name="checkmark" size={54} color="#FFFFFF" />
              </Animated.View>
            </Animated.View>

            {/* Minimalist Details Below */}
            <Animated.View
              style={[
                styles.fullscreenContentWrap,
                {
                  opacity: successOpacity,
                  transform: [{ translateY: successContentY }],
                },
              ]}
            >
              <Text style={styles.fullscreenSuccessTitle}>
                {isExpense ? 'Paid Successfully' : 'Received Successfully'}
              </Text>

              <Text style={styles.fullscreenSuccessAmount}>
                {curr}{Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>

              <Text style={styles.fullscreenSuccessMerchant} numberOfLines={1}>
                {savedMerchant || merchant || 'Transaction'}
              </Text>

              <View style={styles.fullscreenSuccessBadge}>
                <Text style={styles.fullscreenSuccessBadgeText}>
                  {paymentMode} • {category}
                </Text>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
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

      {/* ADD CUSTOM PRESET MODAL */}
      <Modal
        visible={presetModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPresetModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.presetModalCard}>
            {/* Modal Header */}
            <View style={styles.presetModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ExpoImage
                  source={{ uri: ICONS_3D.sparkles }}
                  style={{ width: 22, height: 22, marginRight: 8 }}
                  contentFit="contain"
                />
                <Text style={styles.presetModalTitle}>New 1-Tap Preset</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPresetModalOpen(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Type Toggle: Expense / Income */}
              <View style={styles.presetTypeRow}>
                <TouchableOpacity
                  style={[styles.presetTypeBtn, newPresetType === 'debit' && styles.presetTypeBtnActiveExpense]}
                  onPress={() => {
                    setNewPresetType('debit');
                    setNewPresetCategory('Food');
                  }}
                >
                  <Text style={[styles.presetTypeBtnText, newPresetType === 'debit' && styles.presetTypeBtnTextActive]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetTypeBtn, newPresetType === 'credit' && styles.presetTypeBtnActiveIncome]}
                  onPress={() => {
                    setNewPresetType('credit');
                    setNewPresetCategory('Salary');
                  }}
                >
                  <Text style={[styles.presetTypeBtnText, newPresetType === 'credit' && styles.presetTypeBtnTextActive]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Preset Label Input */}
              <Text style={styles.modalInputLabel}>Preset Name / Item</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Chai, Cold Coffee, Gym, Metro, Milk"
                placeholderTextColor="#94A3B8"
                value={newPresetLabel}
                onChangeText={setNewPresetLabel}
              />

              {/* Preset Amount Input */}
              <Text style={styles.modalInputLabel}>Fixed Amount ({curr})</Text>
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalCurrPrefix}>{curr}</Text>
                <TextInput
                  style={styles.modalAmountInput}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  value={newPresetAmount}
                  onChangeText={(v) => setNewPresetAmount(v.replace(/[^0-9.]/g, ''))}
                />
              </View>

              {/* Category Selection */}
              <Text style={styles.modalInputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalCatsScroll}>
                {(newPresetType === 'debit'
                  ? categories.map((c) => c.name)
                  : ['Salary', 'Business', 'Freelance', 'Cashback', 'Investments', 'Rental', 'Other']
                ).map((catName) => {
                  const isSel = newPresetCategory.toLowerCase() === catName.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={catName}
                      style={[styles.modalCatChip, isSel && styles.modalCatChipActive]}
                      onPress={() => setNewPresetCategory(catName)}
                    >
                      <Text style={[styles.modalCatChipText, isSel && styles.modalCatChipTextActive]}>
                        {catName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 3D Icon Picker */}
              <Text style={styles.modalInputLabel}>Choose 3D Icon</Text>
              <View style={styles.presetIconGrid}>
                {PRESET_ICONS.map((ico) => {
                  const isSel = newPresetIconUrl === ico.url;
                  return (
                    <TouchableOpacity
                      key={ico.name + ico.url}
                      style={[styles.presetIconCell, isSel && styles.presetIconCellActive]}
                      onPress={() => setNewPresetIconUrl(ico.url)}
                    >
                      <ExpoImage source={{ uri: ico.url }} style={{ width: 28, height: 28 }} contentFit="contain" />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Create Button */}
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveNewPreset}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={newPresetType === 'debit' ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
                  style={styles.modalSaveGradient}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.modalSaveText}>Save Preset</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalManageLinkBtn}
                onPress={() => {
                  setPresetModalOpen(false);
                  router.push('/categories?tab=presets' as any);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="options-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.modalManageLinkText}>Manage / Delete Presets in Categories</Text>
                <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catsHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // MODE SEGMENTED CONTROL
  modeSegment: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 13,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },

  // QUICK COMBOS
  quickCombosCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  combosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addPresetHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  addPresetHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  combosScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  comboChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  comboChipCustom: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  comboEmoji: {
    fontSize: 20,
  },
  comboLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  comboAmount: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0F172A',
  },

  // QUICK GRID
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
    justifyContent: 'space-between',
  },
  quickGridTile: {
    width: '22.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  quickGridTileSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  quickTileIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  quickTileLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  tileCheckDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // COMPACT PAYMENT MODES
  compactPaymentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compactPaymentPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    borderRadius: 14,
  },
  compactPaymentPillSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  compactPaymentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  compactPaymentTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // QUICK PURPOSE INPUT
  quickPurposeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  quickPurposeInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 6,
  },

  // SWITCH TO DETAILED HINT
  switchToDetailedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  switchToDetailedText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '600',
  },
  switchToDetailedLink: {
    fontWeight: '900',
    color: '#3730A3',
  },
  saveBtnDisabled: {
    opacity: 0.55,
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
  fullscreenSuccessContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenSuccessCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  fullscreenSuccessRing: {
    position: 'absolute',
    top: -12,
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#D1FAE5',
  },
  fullscreenCheckCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  fullscreenContentWrap: {
    alignItems: 'center',
    marginTop: 28,
  },
  fullscreenSuccessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  fullscreenSuccessAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  fullscreenSuccessMerchant: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    textAlign: 'center',
  },
  fullscreenSuccessBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fullscreenSuccessBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
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

  // PRESET MODAL
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  presetModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  presetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  presetModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetTypeRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
  },
  presetTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  presetTypeBtnActiveExpense: {
    backgroundColor: '#EF4444',
  },
  presetTypeBtnActiveIncome: {
    backgroundColor: '#10B981',
  },
  presetTypeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  presetTypeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    marginTop: 4,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  modalCurrPrefix: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D97706',
    marginRight: 6,
  },
  modalAmountInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalCatsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  modalCatChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCatChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  modalCatChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalCatChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  presetIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
    marginTop: 4,
  },
  presetIconCell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetIconCellActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
    borderWidth: 2,
    transform: [{ scale: 1.08 }],
  },
  modalSaveBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 10,
  },
  modalSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // MANAGE ADDED PRESETS IN MODAL
  managePresetsSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  managePresetsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  managePresetsSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  customPresetRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customPresetItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  customPresetItemSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  modalManageLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  modalManageLinkText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
});
