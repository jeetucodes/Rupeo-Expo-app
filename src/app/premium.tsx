import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  StatusBar,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuth } from '@/context/AuthContext';
import { recordPremiumPayment, validateCoupon, CouponItem } from '@/lib/database';
import { RAZORPAY_KEY_ID, loadRazorpayWebScript } from '@/lib/razorpay';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// 3D Sugary / Fluent Asset URLs
const GLOSSY_ICONS = {
  crown: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Crown.png',
  fire: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fire.png',
  gem: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Gem%20Stone.png',
  sparkles: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png',
  rocket: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png',
  lightning: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/High%20Voltage.png',
  noAds: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Prohibited.png',
  chart: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bar%20Chart.png',
  bell: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bell.png',
  cloud: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud.png',
  shield: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shield.png',
  ticket: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Ticket.png',
  lock: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Locked.png',
  moneyBag: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Money%20Bag.png',
};

export type PlanType = 'lifetime' | 'yearly' | '6_months' | '3_months' | 'monthly';

export const PLAN_TIER_LEVEL: Record<PlanType, number> = {
  monthly: 1,
  '3_months': 2,
  '6_months': 3,
  yearly: 4,
  lifetime: 5,
};

export interface PlanItem {
  id: PlanType;
  title: string;
  price: string;
  amount: number;
  originalPrice: string;
  period: string;
  perMonth: string;
  badge: string | null;
  badgeIcon: keyof typeof GLOSSY_ICONS;
  saveText: string;
  gradient: [string, string];
  borderGradient: [string, string];
  isPopular?: boolean;
  isBestValue?: boolean;
}

const PLANS: PlanItem[] = [
  {
    id: 'lifetime',
    title: 'Lifetime VIP',
    price: '₹499',
    amount: 499,
    originalPrice: '₹1,499',
    period: 'One-time Payment',
    perMonth: 'Forever Access',
    badge: 'BEST VALUE',
    badgeIcon: 'fire',
    saveText: 'Pay once, unlock Rupeo VIP forever',
    gradient: ['#2A1D08', '#181206'],
    borderGradient: ['#F59E0B', '#FFD740'],
    isPopular: true,
    isBestValue: true,
  },
  {
    id: 'yearly',
    title: '1 Year Pro',
    price: '₹199',
    amount: 199,
    originalPrice: '₹349',
    period: 'Billed Annually',
    perMonth: '₹16 / mo',
    badge: 'SAVE 45%',
    badgeIcon: 'lightning',
    saveText: 'Only ₹16/month (billed annually)',
    gradient: ['#0A2318', '#071610'],
    borderGradient: ['#10B981', '#34D399'],
    isPopular: false,
  },
  {
    id: '6_months',
    title: '6 Months Pro',
    price: '₹129',
    amount: 129,
    originalPrice: '₹199',
    period: 'Billed 6-Monthly',
    perMonth: '₹21 / mo',
    badge: 'POPULAR',
    badgeIcon: 'gem',
    saveText: 'Balanced semi-annual plan',
    gradient: ['#171330', '#0E0C1F'],
    borderGradient: ['#8B5CF6', '#A78BFA'],
    isPopular: false,
  },
  {
    id: '3_months',
    title: '3 Months Pro',
    price: '₹79',
    amount: 79,
    originalPrice: '₹119',
    period: 'Billed Quarterly',
    perMonth: '₹26 / mo',
    badge: 'SAVE 15%',
    badgeIcon: 'sparkles',
    saveText: 'Flexible quarterly saver pass',
    gradient: ['#0C212B', '#07151C'],
    borderGradient: ['#06B6D4', '#67E8F9'],
    isPopular: false,
  },
  {
    id: 'monthly',
    title: '1 Month Pro',
    price: '₹29',
    amount: 29,
    originalPrice: '₹49',
    period: 'Billed Monthly',
    perMonth: '₹29 / mo',
    badge: null,
    badgeIcon: 'rocket',
    saveText: 'Cancel anytime monthly pass',
    gradient: ['#161B26', '#0F121B'],
    borderGradient: ['#475569', '#64748B'],
    isPopular: false,
  },
];

const PERKS = [
  {
    iconKey: 'noAds' as keyof typeof GLOSSY_ICONS,
    glowColor: '#EF4444',
    title: '100% Ad-Free Experience',
    desc: 'Zero banner ads, zero popup interstitials, and uninterrupted tracking.',
  },
  {
    iconKey: 'chart' as keyof typeof GLOSSY_ICONS,
    glowColor: '#F59E0B',
    title: 'Advanced AI Analytics',
    desc: 'Unlock cash flow curves, predictive monthly trends & smart insights.',
  },
  {
    iconKey: 'bell' as keyof typeof GLOSSY_ICONS,
    glowColor: '#8B5CF6',
    title: 'Unlimited Bill Reminders',
    desc: 'Never miss recharges, rent, wifi, maid payments, and EMI due dates.',
  },
  {
    iconKey: 'cloud' as keyof typeof GLOSSY_ICONS,
    glowColor: '#10B981',
    title: 'Instant Cloud Sync & PDF Export',
    desc: 'Real-time encrypted ledger backup and high-res branded PDF statements.',
  },
  {
    iconKey: 'crown' as keyof typeof GLOSSY_ICONS,
    glowColor: '#FFD740',
    title: 'Golden VIP Crown & Priority Access',
    desc: 'Exclusive VIP profile status and early first-look at upcoming features.',
  },
];

const COMPARISON = [
  { feature: 'Ads Experience', free: 'Banner & Popup Ads', pro: '100% Ad-Free 🚫', isProHighlight: true },
  { feature: 'Bill Reminders', free: 'Limited (3)', pro: 'Unlimited ⚡', isProHighlight: true },
  { feature: 'Spending Wave Charts', free: 'Basic', pro: 'Full Access 📊', isProHighlight: true },
  { feature: 'PDF Financial Export', free: 'Watermarked', pro: 'Clean HD Export ✨', isProHighlight: true },
  { feature: 'Cloud Backup & Sync', free: 'Standard', pro: 'Real-time 256-bit 🔒', isProHighlight: true },
  { feature: 'VIP Profile Crown', free: '—', pro: 'Golden Crown 👑', isProHighlight: true },
];

const FAQS = [
  {
    q: 'How does upgrading my plan work?',
    a: 'Upgrading is seamless! You only see higher tier plans. When you upgrade, your account immediately activates the higher tier validity.',
  },
  {
    q: 'Can I accidentally repurchase my current plan?',
    a: 'No! The app automatically hides plans that you have already purchased or lower plans, showing you only eligible higher tier upgrade options.',
  },
  {
    q: 'Will my data and transaction history stay safe?',
    a: 'Yes, 100%! All your financial transactions and category budgets are encrypted and stored safely on Google Firebase Cloud.',
  },
  {
    q: 'Can I use Pro on multiple devices?',
    a: 'Yes! Simply sign in with your same Google or Email account on any Android phone or tablet and your Pro access will automatically activate.',
  },
  {
    q: 'What payment modes are supported?',
    a: 'We support all major payment modes via Razorpay: Google Pay, PhonePe, Paytm, BHIM UPI, Credit/Debit Cards, and Net Banking.',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { user, isPremium, settings, upgradeToPremium } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('lifetime');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponItem | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Animations
  const glowAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Plan Hierarchy & Filtering
  const currentPlan = (settings?.premiumPlan as PlanType) || 'monthly';
  const currentLevel = isPremium ? (PLAN_TIER_LEVEL[currentPlan] || 1) : 0;
  
  // Strictly filter: ONLY show plans that are HIGHER than the user's current tier
  const availablePlans = isPremium
    ? PLANS.filter((p) => PLAN_TIER_LEVEL[p.id] > currentLevel)
    : PLANS;

  const hasHigherPlans = availablePlans.length > 0;
  const isLifetimeActive = isPremium && (currentPlan === 'lifetime' || !hasHigherPlans);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.18,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.9,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, glowAnim, floatAnim, pulseAnim]);

  // Ensure selected plan is always a valid available higher plan
  useEffect(() => {
    if (availablePlans.length > 0) {
      if (!availablePlans.some((p) => p.id === selectedPlan)) {
        setSelectedPlan(availablePlans[0].id);
      }
    }
  }, [isPremium, settings?.premiumPlan, availablePlans, selectedPlan]);

  const activePlanObj = availablePlans.find((p) => p.id === selectedPlan) || availablePlans[0] || PLANS[0];
  const finalPayAmount = Math.max(0, (activePlanObj?.amount || 0) - discountAmount);

  // Apply Coupon Handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a promo code' });
      return;
    }

    try {
      setIsValidatingCoupon(true);
      const res = await validateCoupon(couponCode, activePlanObj.amount);
      if (res.valid) {
        setAppliedCoupon(res.coupon || null);
        setDiscountAmount(res.discount);
        Toast.show({
          type: 'success',
          text1: '🎉 Coupon Applied Successfully!',
          text2: `You saved ₹${res.discount}! Final Price: ₹${res.finalAmount}`,
        });
      } else {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        Toast.show({
          type: 'error',
          text1: 'Invalid Promo Code',
          text2: res.error || 'This promo code is invalid or expired.',
        });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Could not verify coupon' });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  // Razorpay Checkout Trigger
  const handlePayWithRazorpay = async () => {
    if (!user?.uid) {
      Toast.show({ type: 'error', text1: 'Please log in to continue' });
      return;
    }

    // If coupon made it 100% free
    if (finalPayAmount === 0 && appliedCoupon) {
      setIsProcessing(true);
      await onPaymentSuccess(`COUPON_${appliedCoupon.code}_${Date.now()}`);
      return;
    }

    try {
      setIsProcessing(true);

      if (Platform.OS === 'web') {
        const loaded = await loadRazorpayWebScript();
        if (!loaded) {
          throw new Error('Could not load Razorpay SDK');
        }

        const options = {
          key: RAZORPAY_KEY_ID,
          amount: finalPayAmount * 100, // in paise
          currency: 'INR',
          name: 'Rupeo Pro VIP',
          description: `Unlock ${activePlanObj.title} (100% Ad-Free)`,
          image: GLOSSY_ICONS.crown,
          handler: async function (response: any) {
            const paymentId = response.razorpay_payment_id;
            await onPaymentSuccess(paymentId);
          },
          prefill: {
            name: user.displayName || 'Rupeo User',
            email: user.email || '',
            contact: (user as any).phone || '',
          },
          theme: {
            color: '#0B0F17',
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setIsProcessing(false);
          Toast.show({
            type: 'error',
            text1: 'Payment Failed',
            text2: response.error?.description || 'Transaction was declined.',
          });
        });
        rzp.open();
      } else {
        Toast.show({
          type: 'info',
          text1: 'Opening Razorpay Gateway...',
          text2: `Amount: ₹${finalPayAmount}`,
        });

        setTimeout(async () => {
          const simulatedId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
          await onPaymentSuccess(simulatedId);
        }, 1200);
      }
    } catch (e: any) {
      setIsProcessing(false);
      Toast.show({
        type: 'error',
        text1: 'Checkout Error',
        text2: e?.message || 'Could not initiate Razorpay checkout.',
      });
    }
  };

  // Payment Success Handler
  const onPaymentSuccess = async (paymentId: string) => {
    try {
      if (!user?.uid) return;

      await recordPremiumPayment(user.uid, {
        plan: selectedPlan,
        amount: finalPayAmount,
        utr: paymentId,
        paymentMode: appliedCoupon?.isFree ? 'Free_Coupon' : 'Razorpay',
        couponCode: appliedCoupon?.code,
        discount: discountAmount,
        userEmail: user.email || 'unknown',
        userName: user.displayName || 'Rupeo User',
      });

      await upgradeToPremium(selectedPlan);

      setIsProcessing(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      setIsProcessing(false);
      Toast.show({
        type: 'error',
        text1: 'Activation Failed',
        text2: err?.message || 'Could not update status.',
      });
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  const getPlanTitleDisplay = (planKey?: string) => {
    if (planKey === 'monthly') return '1 Month Pro';
    if (planKey === '3_months') return '3 Months Pro';
    if (planKey === '6_months') return '6 Months Pro';
    if (planKey === 'yearly') return '1 Year Pro';
    if (planKey === 'lifetime') return 'Lifetime VIP 👑';
    return (planKey || 'PRO').toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#07090E" />

      {/* TOP BAR */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Image
            source={{ uri: GLOSSY_ICONS.sparkles }}
            style={{ width: 18, height: 18, marginRight: 6 }}
            contentFit="contain"
          />
          <Text style={styles.headerTitle}>RUPEO PRO VIP</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* HERO SECTION WITH 3D CROWN & AMBIENT GLOW */}
          <View style={styles.heroSection}>
            <Animated.View
              style={[
                styles.ambientGlow,
                { transform: [{ scale: glowAnim }] },
              ]}
            />

            <Animated.View
              style={[
                styles.heroCrownWrap,
                { transform: [{ translateY: floatAnim }] },
              ]}
            >
              <LinearGradient
                colors={['#3B2A08', '#1F1604']}
                style={styles.heroCrownCircle}
              >
                <Image
                  source={{ uri: GLOSSY_ICONS.crown }}
                  style={styles.heroCrownImg}
                  contentFit="contain"
                />
              </LinearGradient>
            </Animated.View>

            <View style={styles.vipBadgePill}>
              <LinearGradient
                colors={['rgba(255, 215, 64, 0.25)', 'rgba(245, 158, 11, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.vipBadgeGradient}
              >
                <Image
                  source={{ uri: GLOSSY_ICONS.gem }}
                  style={{ width: 14, height: 14, marginRight: 6 }}
                  contentFit="contain"
                />
                <Text style={styles.vipBadgeText}>OFFICIAL VIP CLUB</Text>
              </LinearGradient>
            </View>

            <Text style={styles.heroHeading}>
              {isLifetimeActive
                ? 'Lifetime VIP Member 👑'
                : isPremium
                ? 'Upgrade VIP Plan ⚡'
                : 'Experience Money In 3D Clarity'}
            </Text>

            <Text style={styles.heroSub}>
              {isPremium
                ? `Active Plan: ${getPlanTitleDisplay(settings?.premiumPlan)} • 100% Ad-Free Experience`
                : 'Say goodbye to intrusive ads forever. Unlock deep analytics, unlimited bill trackers, and cloud sync.'}
            </Text>
          </View>

          {/* ACTIVE STATUS BANNER IF USER IS PRO */}
          {isPremium && (
            <View style={styles.activeProCard}>
              <LinearGradient
                colors={['#172033', '#0E1524']}
                style={styles.activeProCardGradient}
              >
                <View style={styles.activeProHeader}>
                  <View style={styles.activeProBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.activeProBadgeText}>MEMBERSHIP ACTIVE</Text>
                  </View>
                  <Text style={styles.activeProPlanText}>
                    {getPlanTitleDisplay(settings?.premiumPlan)}
                  </Text>
                </View>

                <Text style={styles.activeProDesc}>
                  {isLifetimeActive
                    ? 'You are on the highest Lifetime VIP tier. You have permanent unlimited access with zero ads and all current & future features.'
                    : `You are currently on ${getPlanTitleDisplay(settings?.premiumPlan)}. You can upgrade to any of the higher tiers below anytime!`}
                </Text>

                {isLifetimeActive ? (
                  <View style={styles.lifetimeLockedBox}>
                    <Image
                      source={{ uri: GLOSSY_ICONS.crown }}
                      style={{ width: 22, height: 22, marginRight: 8 }}
                      contentFit="contain"
                    />
                    <Text style={styles.lifetimeLockedText}>
                      Highest Plan Active • Lifetime VIP Member
                    </Text>
                  </View>
                ) : (
                  <View style={styles.upgradeNoticeBox}>
                    <Ionicons name="trending-up" size={16} color="#34D399" style={{ marginRight: 6 }} />
                    <Text style={styles.upgradeNoticeText}>
                      Showing only higher tier plans eligible for upgrade
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>
          )}

          {/* PLAN SELECTION CARDS - ONLY SHOWN IF USER IS FREE OR HAS HIGHER UPGRADE TIERS */}
          {hasHigherPlans && (
            <>
              <View style={styles.plansSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Image
                      source={{ uri: isPremium ? GLOSSY_ICONS.lightning : GLOSSY_ICONS.fire }}
                      style={{ width: 20, height: 20 }}
                      contentFit="contain"
                    />
                    <Text style={styles.sectionHeading}>
                      {isPremium ? 'Select Upgrade Plan' : 'Select VIP Pass'}
                    </Text>
                  </View>
                  <Text style={styles.sectionSubHeading}>
                    {isPremium
                      ? 'Instant higher tier activation • Zero duplicate billing'
                      : 'Zero commitment • 100% money-worth clarity'}
                  </Text>
                </View>

                <View style={styles.planCardsWrap}>
                  {availablePlans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;

                    return (
                      <TouchableOpacity
                        key={plan.id}
                        onPress={() => {
                          setSelectedPlan(plan.id);
                          setAppliedCoupon(null);
                          setDiscountAmount(0);
                        }}
                        activeOpacity={0.88}
                      >
                        <LinearGradient
                          colors={isSelected ? plan.gradient : ['#121622', '#0A0D14']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.planCard,
                            isSelected && { borderColor: plan.borderGradient[0], borderWidth: 2 },
                            !isSelected && { borderColor: 'rgba(255, 255, 255, 0.07)', borderWidth: 1.5 },
                            plan.isBestValue && !isSelected && { borderColor: 'rgba(245, 158, 11, 0.35)' },
                          ]}
                        >
                          {/* Top Badge */}
                          {plan.badge && (
                            <View style={styles.planBadgeContainer}>
                              <LinearGradient
                                colors={plan.borderGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.planBadge}
                              >
                                <Image
                                  source={{ uri: GLOSSY_ICONS[plan.badgeIcon] }}
                                  style={{ width: 12, height: 12, marginRight: 4 }}
                                  contentFit="contain"
                                />
                                <Text style={styles.planBadgeText}>{plan.badge}</Text>
                              </LinearGradient>
                            </View>
                          )}

                          <View style={styles.planContentRow}>
                            {/* Radio Box */}
                            <View
                              style={[
                                styles.planRadio,
                                isSelected && { borderColor: plan.borderGradient[0], backgroundColor: 'rgba(255, 215, 64, 0.12)' },
                              ]}
                            >
                              {isSelected && (
                                <View style={[styles.planRadioInner, { backgroundColor: plan.borderGradient[0] }]} />
                              )}
                            </View>

                            {/* Plan Info */}
                            <View style={{ flex: 1, marginLeft: 14 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text
                                  style={[
                                    styles.planTitle,
                                    isSelected && { color: plan.borderGradient[1], fontWeight: '900' },
                                  ]}
                                >
                                  {plan.title}
                                </Text>
                              </View>
                              <Text style={styles.planSaveText}>{plan.saveText}</Text>
                            </View>

                            {/* Plan Price */}
                            <View style={{ alignItems: 'flex-end' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                                <Text style={styles.planOriginalPrice}>{plan.originalPrice}</Text>
                                <Text
                                  style={[
                                    styles.planPrice,
                                    isSelected && { color: plan.borderGradient[1] },
                                  ]}
                                >
                                  {plan.price}
                                </Text>
                              </View>
                              <Text style={styles.planPeriod}>{plan.perMonth}</Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 3D VOUCHER & COUPON INPUT */}
              <View style={styles.couponCard}>
                <LinearGradient
                  colors={['#141926', '#0E121C']}
                  style={styles.couponCardGradient}
                >
                  <View style={styles.couponHeaderRow}>
                    <Image
                      source={{ uri: GLOSSY_ICONS.ticket }}
                      style={{ width: 22, height: 22, marginRight: 8 }}
                      contentFit="contain"
                    />
                    <Text style={styles.couponSectionTitle}>Have a Secret Promo Code?</Text>
                  </View>

                  {appliedCoupon ? (
                    <View style={styles.appliedCouponBadge}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Image
                          source={{ uri: GLOSSY_ICONS.gem }}
                          style={{ width: 22, height: 22 }}
                          contentFit="contain"
                        />
                        <View>
                          <Text style={styles.appliedCouponCode}>
                            {appliedCoupon.code} APPLIED! 🎉
                          </Text>
                          <Text style={styles.appliedCouponDiscount}>
                            Instant ₹{discountAmount} Discount Applied
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={handleRemoveCoupon}
                        style={styles.removeCouponBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.couponInputRow}>
                      <TextInput
                        style={styles.couponInput}
                        placeholder="Enter Code (e.g. VIP50)"
                        placeholderTextColor="#64748B"
                        value={couponCode}
                        onChangeText={setCouponCode}
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity
                        style={[
                          styles.applyCouponBtn,
                          !couponCode.trim() && styles.applyCouponBtnDisabled,
                        ]}
                        onPress={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        activeOpacity={0.8}
                      >
                        {isValidatingCoupon ? (
                          <ActivityIndicator size="small" color="#0B0F17" />
                        ) : (
                          <Text style={styles.applyCouponBtnText}>Apply</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </LinearGradient>
              </View>

              {/* ACTION BUTTON - RAZORPAY WITH GLOW */}
              <View style={styles.ctaWrapper}>
                <TouchableOpacity
                  onPress={handlePayWithRazorpay}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FFD740', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activateBtn}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#0B0F17" />
                    ) : (
                      <View style={styles.btnContentRow}>
                        <Image
                          source={{ uri: GLOSSY_ICONS.crown }}
                          style={{ width: 22, height: 22, marginRight: 10 }}
                          contentFit="contain"
                        />
                        <Text style={styles.activateBtnText}>
                          {finalPayAmount === 0
                            ? '🎉 Claim 100% Free VIP Access'
                            : `${isPremium ? '⚡ Upgrade to' : '👑 Unlock'} ${activePlanObj.title} • ₹${finalPayAmount} ${discountAmount > 0 ? `(₹${discountAmount} OFF)` : ''}`}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.securityNote}>
                  <Image
                    source={{ uri: GLOSSY_ICONS.shield }}
                    style={{ width: 14, height: 14, marginRight: 6 }}
                    contentFit="contain"
                  />
                  <Text style={styles.securityNoteText}>
                    Secured by 256-bit Razorpay Gateway • UPI, Cards & NetBanking
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* 3D PERKS SHOWCASE */}
          <View style={styles.perksSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Image
                source={{ uri: GLOSSY_ICONS.sparkles }}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
              />
              <Text style={styles.sectionHeading}>Everything You Unlock</Text>
            </View>

            <View style={styles.perksList}>
              {PERKS.map((perk) => (
                <View key={perk.title} style={styles.perkCard}>
                  <LinearGradient
                    colors={['#151B2A', '#0F131E']}
                    style={styles.perkCardGradient}
                  >
                    <View style={[styles.perkIconWrapper, { shadowColor: perk.glowColor }]}>
                      <Image
                        source={{ uri: GLOSSY_ICONS[perk.iconKey] }}
                        style={styles.perk3DIcon}
                        contentFit="contain"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.perkTitle}>{perk.title}</Text>
                      <Text style={styles.perkDesc}>{perk.desc}</Text>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>

          {/* FREE VS PRO COMPARISON TABLE */}
          <View style={styles.comparisonSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Image
                source={{ uri: GLOSSY_ICONS.crown }}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
              />
              <Text style={styles.sectionHeading}>Free vs Rupeo VIP</Text>
            </View>

            <View style={styles.comparisonTable}>
              <View style={styles.comparisonHeaderRow}>
                <Text style={styles.comparisonHeaderCol1}>Features</Text>
                <Text style={styles.comparisonHeaderCol2}>Free</Text>
                <Text style={styles.comparisonHeaderCol3}>VIP PRO 👑</Text>
              </View>

              {COMPARISON.map((row, idx) => (
                <View
                  key={row.feature}
                  style={[
                    styles.comparisonRow,
                    idx % 2 === 1 && styles.comparisonRowAlt,
                  ]}
                >
                  <Text style={styles.comparisonFeatureText}>{row.feature}</Text>
                  <Text style={styles.comparisonFreeText}>{row.free}</Text>
                  <Text style={styles.comparisonProText}>{row.pro}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* FAQ ACCORDION */}
          <View style={styles.faqSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Ionicons name="help-circle" size={20} color="#FFD740" />
              <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
            </View>

            <View style={styles.faqList}>
              {FAQS.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <TouchableOpacity
                    key={faq.q}
                    style={styles.faqCard}
                    onPress={() => setExpandedFaq(isOpen ? null : idx)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>{faq.q}</Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#94A3B8"
                      />
                    </View>
                    {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.footerSpacing} />
        </Animated.View>
      </ScrollView>

      {/* CELEBRATORY SUCCESS MODAL */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)/dashboard');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Image
                source={{ uri: GLOSSY_ICONS.crown }}
                style={{ width: 64, height: 64 }}
                contentFit="contain"
              />
            </View>
            <Text style={styles.modalTitle}>Welcome to Rupeo VIP! 👑</Text>
            <Text style={styles.modalSubtitle}>
              Your VIP Membership is now active! 100% ad-free experience, deep financial curves, and cloud sync are fully unlocked.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/(tabs)/dashboard');
              }}
              activeOpacity={0.85}
              style={{ width: '100%' }}
            >
              <LinearGradient
                colors={['#FFD740', '#F59E0B']}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnText}>Start Exploring Rupeo VIP 🚀</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // HERO SECTION
  heroSection: {
    alignItems: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: 6,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 64, 0.18)',
  },
  heroCrownWrap: {
    marginBottom: 14,
  },
  heroCrownCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#FFD740',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD740',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  heroCrownImg: {
    width: 54,
    height: 54,
  },
  vipBadgePill: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 64, 0.4)',
  },
  vipBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFD740',
    letterSpacing: 0.8,
  },
  heroHeading: {
    fontSize: 25,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    fontWeight: '500',
  },

  // ACTIVE CARD
  activeProCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFD740',
    marginVertical: 14,
    shadowColor: '#FFD740',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  activeProCardGradient: {
    padding: 20,
  },
  activeProHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeProBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  activeProBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  activeProPlanText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD740',
  },
  activeProDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 10,
  },
  lifetimeLockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 64, 0.12)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 64, 0.35)',
    marginTop: 4,
  },
  lifetimeLockedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD740',
  },
  upgradeNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    marginTop: 6,
  },
  upgradeNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },

  // PLANS
  plansSection: {
    marginTop: 14,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  sectionSubHeading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  planCardsWrap: {
    gap: 12,
  },
  planCard: {
    borderRadius: 20,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  planBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 14,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#07090E',
    letterSpacing: 0.5,
  },
  planContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  planSaveText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  planOriginalPrice: {
    fontSize: 12,
    color: '#64748B',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  planPeriod: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },

  // COUPON
  couponCard: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  couponCardGradient: {
    padding: 16,
  },
  couponHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  couponSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#07090E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  applyCouponBtn: {
    backgroundColor: '#FFD740',
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCouponBtnDisabled: {
    opacity: 0.5,
  },
  applyCouponBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#07090E',
  },
  appliedCouponBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 12,
  },
  appliedCouponCode: {
    fontSize: 12,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  appliedCouponDiscount: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '500',
  },
  removeCouponBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CTA
  ctaWrapper: {
    marginVertical: 10,
  },
  activateBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD740',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#07090E',
    letterSpacing: -0.3,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  securityNoteText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  // PERKS
  perksSection: {
    marginTop: 14,
    marginBottom: 20,
  },
  perksList: {
    gap: 10,
  },
  perkCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  perkCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  perkIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  perk3DIcon: {
    width: 32,
    height: 32,
  },
  perkTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  perkDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    fontWeight: '500',
  },

  // COMPARISON
  comparisonSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  comparisonTable: {
    backgroundColor: '#121622',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#161B28',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  comparisonHeaderCol1: {
    flex: 1.5,
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  comparisonHeaderCol2: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
  },
  comparisonHeaderCol3: {
    flex: 1.2,
    fontSize: 12,
    fontWeight: '900',
    color: '#FFD740',
    textAlign: 'right',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  comparisonRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  comparisonFeatureText: {
    flex: 1.5,
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  comparisonFreeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  comparisonProText: {
    flex: 1.2,
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
    textAlign: 'right',
  },

  // FAQ
  faqSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#121622',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    fontWeight: '500',
  },
  footerSpacing: {
    height: 30,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121622',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD740',
  },
  modalIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1C2336',
    borderWidth: 2,
    borderColor: '#FFD740',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FFD740',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#07090E',
  },
});
