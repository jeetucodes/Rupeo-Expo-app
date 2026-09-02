import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
  Platform,
  Animated,
  Easing,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Rect,
  G,
  Text as SvgText,
  Line,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { getAllTransactions, getUserCategories, CategoryItem, defaultCategories } from '@/lib/database';
import CategoryIcon from '@/components/CategoryIcon';
import PaymentModeIcon from '@/components/PaymentModeIcon';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;

type PeriodType = 'this_month' | 'last_month' | '3_months' | 'this_year' | 'all';
type ChartViewType = 'curve' | 'bars' | 'donut';

export interface TransactionItem {
  id?: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  merchant_name?: string;
  title?: string;
  payment_mode?: string;
}

interface CategorySpend {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
  count: number;
}

interface TrendPoint {
  label: string;
  fullDate?: string;
  income: number;
  expense: number;
  net: number;
}

const PALETTE = [
  '#F59E0B', '#6366F1', '#10B981', '#EC4899', '#3B82F6',
  '#8B5CF6', '#14B8A6', '#F97316', '#EF4444', '#06B6D4',
  '#64748B', '#84CC16',
];

// Helper to generate ultra-smooth Bezier curve path
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function ReportsScreen() {
  const { user, settings, isPremium } = useAuth();
  const curr = settings?.currency === 'INR' ? '₹' : (settings?.currency || '₹');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [chartView, setChartView] = useState<ChartViewType>('donut');
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Smooth Multi-Phase Pastel Color Flow & Soft Light Gleam for Net Savings Card
  const colorAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Smooth, continuous multi-phase color transition (60s)
    const colorLoop = Animated.loop(
      Animated.timing(colorAnim, {
        toValue: 5,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    // 2. Elegant diagonal light gleam / sheen wave that glides across every 5s
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2800,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: false,
        }),
        Animated.delay(2200),
      ])
    );

    colorLoop.start();
    shimmerLoop.start();

    return () => {
      colorLoop.stop();
      shimmerLoop.stop();
    };
  }, [colorAnim, shimmerAnim]);

  // Card Background Color Interpolation (Unique Royal Periwinkle / Berry / Amber / Aqua / Lavender flow)
  const animatedCardBg = colorAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5],
    outputRange: [
      '#E0E7FF', // Royal Periwinkle / Soft Indigo
      '#FCE7F3', // Sweet Berry Pink / Soft Magenta
      '#FEF3C7', // Warm Golden Amber / Honey
      '#CCFBF1', // Bright Aqua Teal / Ocean Foam
      '#DDD6FE', // Vibrant Lavender Violet
      '#E0E7FF', // Loop back to Periwinkle
    ],
  });

  // Smooth diagonal light sheen sweep
  const shimmerStyle = {
    transform: [
      {
        translateX: shimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-240, 480],
        }),
      },
      {
        rotate: '25deg',
      },
    ],
  };

  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const [txList, catList] = await Promise.all([
        getAllTransactions(user.uid),
        getUserCategories(user.uid),
      ]);
      const normalizedTx: TransactionItem[] = (txList || []).map((t: any) => ({
        id: t.id,
        date: t.date,
        amount: Number(t.amount) || 0,
        type: (t.type === 'credit' || t.type === 'income') ? 'income' : 'expense',
        category: t.category || 'Others',
        description: t.description || t.merchant_name || '',
        title: t.title || t.merchant_name || t.description || t.category || 'Expense',
        payment_mode: t.payment_mode || t.paymentMode || 'UPI',
      }));
      setTransactions(normalizedTx);
      setCategories(catList && catList.length > 0 ? catList : defaultCategories);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.warn('Failed to load report data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid, fadeAnim]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter(tx => {
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return false;

      if (period === 'this_month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (period === 'last_month') {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        return (
          d.getFullYear() === lastMonthDate.getFullYear() &&
          d.getMonth() === lastMonthDate.getMonth()
        );
      }
      if (period === '3_months') {
        const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
        return d >= threeMonthsAgo && d <= now;
      }
      if (period === 'this_year') {
        return d.getFullYear() === currentYear;
      }
      return true; // all
    });
  }, [transactions, period]);

  // Key Financial Metrics
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach(tx => {
      const val = Math.abs(tx.amount);
      if (tx.type === 'income') {
        income += val;
      } else {
        expense += val;
      }
    });

    const net = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;
    const count = filteredTransactions.length;
    const avgTxn = count > 0 ? Math.round((income + expense) / count) : 0;

    let daySpan = 30;
    if (period === 'this_month') {
      daySpan = Math.max(1, new Date().getDate());
    } else if (period === '3_months') {
      daySpan = 90;
    } else if (period === 'this_year') {
      const start = new Date(new Date().getFullYear(), 0, 1);
      daySpan = Math.max(1, Math.round((new Date().getTime() - start.getTime()) / 86400000));
    }
    const dailyAvg = expense > 0 ? Math.round(expense / daySpan) : 0;

    return {
      income,
      expense,
      net,
      savingsRate,
      count,
      dailyAvg,
      avgTxn,
    };
  }, [filteredTransactions, period]);

  // Category Breakdown (Expense or Income)
  const categoryBreakdown = useMemo<CategorySpend[]>(() => {
    const targetTx = filteredTransactions.filter(t => t.type === categoryType);
    const totalAmount = targetTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const map: { [cat: string]: { amount: number; count: number } } = {};
    targetTx.forEach(t => {
      const cat = t.category || 'Others';
      if (!map[cat]) map[cat] = { amount: 0, count: 0 };
      map[cat].amount += Math.abs(t.amount);
      map[cat].count += 1;
    });

    const list: CategorySpend[] = Object.keys(map).map((catName, idx) => {
      const matchedCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      const amount = map[catName].amount;
      const percentage = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
      return {
        name: catName,
        amount,
        percentage,
        color: matchedCat?.color || PALETTE[idx % PALETTE.length],
        icon: matchedCat?.icon || (categoryType === 'income' ? 'wallet' : 'receipt'),
        count: map[catName].count,
      };
    });

    return list.sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories, categoryType]);

  // Payment Modes Split
  const paymentModesSplit = useMemo(() => {
    const expenseTx = filteredTransactions.filter(t => t.type === 'expense');
    const total = expenseTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const modeMap: { [key: string]: number } = { UPI: 0, Cash: 0, Card: 0, Bank: 0 };

    expenseTx.forEach(t => {
      const m = (t.payment_mode || 'UPI').toUpperCase();
      if (m.includes('UPI')) modeMap.UPI += Math.abs(t.amount);
      else if (m.includes('CASH')) modeMap.Cash += Math.abs(t.amount);
      else if (m.includes('CARD')) modeMap.Card += Math.abs(t.amount);
      else modeMap.Bank += Math.abs(t.amount);
    });

    return Object.keys(modeMap).map(mode => ({
      mode,
      amount: modeMap[mode],
      percentage: total > 0 ? Math.round((modeMap[mode] / total) * 100) : 0,
    })).filter(m => m.amount > 0);
  }, [filteredTransactions]);

  // Smart Financial Health Score & Dynamic AI Insights
  const financialHealth = useMemo(() => {
    const { income, expense, savingsRate, count } = metrics;
    if (count === 0 || (income === 0 && expense === 0)) {
      return {
        score: 75,
        rating: 'Balanced',
        color: '#6366F1',
        insights: [
          'Add your daily transactions to generate personalized financial health insights.',
          'Following the 50/30/20 budget rule helps build long-term wealth.',
        ],
      };
    }

    let score = 50;
    if (savingsRate >= 40) score += 35;
    else if (savingsRate >= 25) score += 25;
    else if (savingsRate >= 10) score += 15;
    else if (savingsRate > 0) score += 5;
    else score -= 15;

    if (income > 0) {
      const ratio = expense / income;
      if (ratio <= 0.5) score += 15;
      else if (ratio <= 0.75) score += 10;
      else if (ratio > 1) score -= 10;
    }

    score = Math.min(99, Math.max(25, score));

    let rating = 'Healthy';
    let color = '#10B981';
    if (score >= 85) {
      rating = 'Excellent';
      color = '#10B981';
    } else if (score >= 70) {
      rating = 'Good';
      color = '#6366F1';
    } else if (score >= 50) {
      rating = 'Fair';
      color = '#F59E0B';
    } else {
      rating = 'Needs Care';
      color = '#EF4444';
    }

    const insights: string[] = [];

    if (savingsRate >= 25) {
      insights.push(`🎯 Great job! You are saving ${savingsRate}% of your income, comfortably beating the standard 20% benchmark.`);
    } else if (income > 0 && savingsRate < 10) {
      insights.push(`⚠️ Your current savings rate is ${savingsRate}%. Try trimming non-essential spends to build a safety fund.`);
    } else if (income === 0 && expense > 0) {
      insights.push(`💡 You have ${curr}${expense.toLocaleString('en-IN')} in expenses recorded with no registered income for this period.`);
    }

    if (categoryBreakdown.length > 0) {
      const top = categoryBreakdown[0];
      insights.push(`🏷️ "${top.name}" is your highest ${categoryType} category at ${curr}${top.amount.toLocaleString('en-IN')} (${top.percentage}% share).`);
    }

    if (paymentModesSplit.length > 0) {
      const primaryMode = paymentModesSplit[0];
      insights.push(`💳 ${primaryMode.mode} is your most active payment method (${primaryMode.percentage}% of all expenses).`);
    }

    return { score, rating, color, insights };
  }, [metrics, categoryBreakdown, paymentModesSplit, categoryType, curr]);

  // Daily Spending Points for the Smooth Curve
  const dailyTrendPoints = useMemo<TrendPoint[]>(() => {
    const now = new Date();
    const map: { [dayKey: string]: { label: string; fullDate: string; income: number; expense: number } } = {};

    // 7 recent data bins
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      map[key] = {
        label: `${d.getDate()} ${months[d.getMonth()]}`,
        fullDate: key,
        income: 0,
        expense: 0,
      };
    }

    filteredTransactions.forEach(t => {
      const key = t.date;
      if (map[key]) {
        const val = Math.abs(t.amount);
        if (t.type === 'income') map[key].income += val;
        else map[key].expense += val;
      }
    });

    return Object.keys(map).map(k => ({
      label: map[k].label,
      fullDate: map[k].fullDate,
      income: map[k].income,
      expense: map[k].expense,
      net: map[k].income - map[k].expense,
    }));
  }, [filteredTransactions]);

  // 6-Month Macro Trends
  const monthlyTrends = useMemo<TrendPoint[]>(() => {
    const monthsMap: { [key: string]: { label: string; income: number; expense: number } } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsMap[key] = {
        label: `${monthNames[d.getMonth()]}`,
        income: 0,
        expense: 0,
      };
    }

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap[key]) {
        const val = Math.abs(t.amount);
        if (t.type === 'income') {
          monthsMap[key].income += val;
        } else {
          monthsMap[key].expense += val;
        }
      }
    });

    return Object.keys(monthsMap).map(k => ({
      label: monthsMap[k].label,
      income: monthsMap[k].income,
      expense: monthsMap[k].expense,
      net: monthsMap[k].income - monthsMap[k].expense,
    }));
  }, [transactions]);

  // Day of Week Distribution
  const dayOfWeekSpend = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sums = [0, 0, 0, 0, 0, 0, 0];

    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const d = new Date(t.date);
        if (!isNaN(d.getTime())) {
          sums[d.getDay()] += Math.abs(t.amount);
        }
      });

    const maxSpend = Math.max(...sums, 1);
    return days.map((day, idx) => ({
      day,
      amount: sums[idx],
      percentOfMax: Math.round((sums[idx] / maxSpend) * 100),
    }));
  }, [filteredTransactions]);

  // Top 5 Largest Expenses
  const topExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5);
  }, [filteredTransactions]);

  // Share Financial Summary
  const handleShareReport = async () => {
    try {
      const periodTitle =
        period === 'this_month' ? 'This Month' :
        period === 'last_month' ? 'Last Month' :
        period === '3_months' ? 'Last 3 Months' :
        period === 'this_year' ? 'This Year' : 'All Time';

      let text = `📊 *Rupeo Financial Report (${periodTitle})*\n\n`;
      text += `💰 *Total Income:* ${curr}${metrics.income.toLocaleString('en-IN')}\n`;
      text += `💸 *Total Expense:* ${curr}${metrics.expense.toLocaleString('en-IN')}\n`;
      text += `📈 *Net Savings:* ${curr}${metrics.net.toLocaleString('en-IN')} (${metrics.savingsRate}% Savings Rate)\n`;
      text += `⚡ *Daily Avg Spend:* ${curr}${metrics.dailyAvg.toLocaleString('en-IN')}/day\n\n`;

      if (categoryBreakdown.length > 0) {
        text += `🏷️ *Top Spending Categories:*\n`;
        categoryBreakdown.slice(0, 4).forEach(c => {
          text += `• ${c.name}: ${curr}${c.amount.toLocaleString('en-IN')} (${c.percentage}%)\n`;
        });
      }

      if (isPremium) {
        text += `\n👑 *Rupeo VIP Pro Financial Ledger* (Official HD Report)\nhttps://rupeo.app`;
      } else {
        text += `\n— Generated via Rupeo (Free Edition). Upgrade to Rupeo Pro for Clean HD Reports & Cloud Sync.\nhttps://rupeo.app`;
      }

      await Share.share({ message: text });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not share report' });
    }
  };

  // Render SVG Smooth Bezier Line & Area Graph
  const renderSmoothLineGraph = () => {
    const dataPoints = dailyTrendPoints;
    const maxVal = Math.max(...dataPoints.map(p => p.expense), 500);
    const chartHeight = 150;
    const paddingX = 22;
    const usableWidth = CHART_WIDTH - paddingX * 2;
    const step = usableWidth / Math.max(dataPoints.length - 1, 1);

    const coords = dataPoints.map((p, idx) => ({
      x: paddingX + idx * step,
      y: chartHeight - (p.expense / maxVal) * (chartHeight - 30) - 10,
    }));

    const smoothLineD = buildSmoothPath(coords);
    const smoothAreaD = `${smoothLineD} L ${coords[coords.length - 1].x} ${chartHeight} L ${coords[0].x} ${chartHeight} Z`;

    const activePoint = selectedPointIndex !== null ? dataPoints[selectedPointIndex] : null;
    const activeCoord = selectedPointIndex !== null ? coords[selectedPointIndex] : null;

    return (
      <View style={styles.chartWrapperCard}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={styles.themeCardTitle}>Spending Wave</Text>
            <Text style={styles.themeCardSub}>Daily trend & peak spending days</Text>
          </View>
          {activePoint && (
            <View style={styles.activePointPill}>
              <Text style={styles.activePointPillDate}>{activePoint.label}:</Text>
              <Text style={styles.activePointPillAmount}>{curr}{activePoint.expense.toLocaleString('en-IN')}</Text>
            </View>
          )}
        </View>

        <Svg width={CHART_WIDTH} height={chartHeight + 35} style={{ alignSelf: 'center' }}>
          <Defs>
            <LinearGradient id="smoothAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFD740" stopOpacity="0.45" />
              <Stop offset="0.7" stopColor="#FFD740" stopOpacity="0.1" />
              <Stop offset="1" stopColor="#FFD740" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#F59E0B" />
              <Stop offset="0.5" stopColor="#D97706" />
              <Stop offset="1" stopColor="#B45309" />
            </LinearGradient>
          </Defs>

          {/* Grid Guideline Lines */}
          <Line x1={paddingX} y1={chartHeight * 0.25} x2={CHART_WIDTH - paddingX} y2={chartHeight * 0.25} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1={paddingX} y1={chartHeight * 0.5} x2={CHART_WIDTH - paddingX} y2={chartHeight * 0.5} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1={paddingX} y1={chartHeight * 0.75} x2={CHART_WIDTH - paddingX} y2={chartHeight * 0.75} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1={paddingX} y1={chartHeight} x2={CHART_WIDTH - paddingX} y2={chartHeight} stroke="#E2E8F0" strokeWidth="1" />

          {/* Glowing Area Fill Under Curve */}
          <Path d={smoothAreaD} fill="url(#smoothAreaGrad)" />

          {/* Smooth Bezier Line */}
          <Path d={smoothLineD} stroke="url(#lineGrad)" strokeWidth="3" fill="transparent" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Data Dots */}
          {coords.map((c, idx) => {
            const isSelected = selectedPointIndex === idx;
            return (
              <G key={`dot-${idx}`}>
                <Circle
                  cx={c.x}
                  cy={c.y}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#1C1C1E' : '#FFFFFF'}
                  stroke={isSelected ? '#FFD740' : '#F59E0B'}
                  strokeWidth={isSelected ? 3 : 2}
                  {...(Platform.OS === 'web'
                    ? { onClick: () => setSelectedPointIndex(idx) }
                    : { onPress: () => setSelectedPointIndex(idx) })}
                />
                {/* X Axis Date Label */}
                <SvgText
                  x={c.x}
                  y={chartHeight + 20}
                  fontSize="10"
                  fontWeight="700"
                  fill={isSelected ? '#1C1C1E' : '#94A3B8'}
                  textAnchor="middle"
                >
                  {dataPoints[idx].label.split(' ')[0]}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  // Render Bar Chart for Monthly Income vs Expense
  const renderMonthlyBarChart = () => {
    const maxVal = Math.max(
      ...monthlyTrends.map(m => Math.max(m.income, m.expense)),
      1000
    );
    const chartHeight = 150;
    const barWidth = 14;
    const gap = (CHART_WIDTH - 30) / monthlyTrends.length;

    return (
      <View style={styles.chartWrapperCard}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={styles.themeCardTitle}>Cash Flow Trends</Text>
            <Text style={styles.themeCardSub}>Income vs Expense comparison</Text>
          </View>
          <View style={styles.barLegendRow}>
            <View style={styles.legendDotItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>In</Text>
            </View>
            <View style={styles.legendDotItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Out</Text>
            </View>
          </View>
        </View>

        <Svg width={CHART_WIDTH} height={chartHeight + 35}>
          <Defs>
            <LinearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#10B981" stopOpacity="1" />
              <Stop offset="1" stopColor="#059669" stopOpacity="0.85" />
            </LinearGradient>
            <LinearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#EF4444" stopOpacity="1" />
              <Stop offset="1" stopColor="#DC2626" stopOpacity="0.85" />
            </LinearGradient>
          </Defs>

          <Line x1="10" y1={chartHeight * 0.25} x2={CHART_WIDTH - 10} y2={chartHeight * 0.25} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="10" y1={chartHeight * 0.5} x2={CHART_WIDTH - 10} y2={chartHeight * 0.5} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="10" y1={chartHeight * 0.75} x2={CHART_WIDTH - 10} y2={chartHeight * 0.75} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="10" y1={chartHeight} x2={CHART_WIDTH - 10} y2={chartHeight} stroke="#E2E8F0" strokeWidth="1" />

          {monthlyTrends.map((item, idx) => {
            const xCenter = idx * gap + gap / 2;
            const incH = (item.income / maxVal) * (chartHeight - 15);
            const expH = (item.expense / maxVal) * (chartHeight - 15);

            return (
              <G key={item.label}>
                {/* Income Bar */}
                <Rect
                  x={xCenter - barWidth - 2}
                  y={chartHeight - incH}
                  width={barWidth}
                  height={Math.max(incH, 3)}
                  rx={4}
                  fill="url(#incomeGrad)"
                />
                {/* Expense Bar */}
                <Rect
                  x={xCenter + 2}
                  y={chartHeight - expH}
                  width={barWidth}
                  height={Math.max(expH, 3)}
                  rx={4}
                  fill="url(#expenseGrad)"
                />
                {/* Month Label */}
                <SvgText
                  x={xCenter}
                  y={chartHeight + 20}
                  fontSize="11"
                  fontWeight="700"
                  fill="#64748B"
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  // Render SVG Donut Chart for Categories
  const renderCategoryDonut = () => {
    if (categoryBreakdown.length === 0) return null;

    const size = 190;
    const strokeWidth = 22;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    const activeCat = selectedCategory ? categoryBreakdown.find(c => c.name === selectedCategory) : null;
    const totalAmount = categoryType === 'expense' ? metrics.expense : metrics.income;

    return (
      <View style={styles.donutCardInner}>
        <View style={styles.donutContainer}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
              {categoryBreakdown.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                const strokeLength = (circumference * cat.percentage) / 100;
                const currentOffset = accumulatedOffset;
                accumulatedOffset += strokeLength;

                return (
                  <Circle
                    key={cat.name}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={cat.color}
                    strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${Math.max(strokeLength, 0.1)} ${circumference}`}
                    strokeDashoffset={-currentOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    opacity={selectedCategory && !isSelected ? 0.3 : 1}
                    {...(Platform.OS === 'web'
                      ? { onClick: () => setSelectedCategory(isSelected ? null : cat.name) }
                      : { onPress: () => setSelectedCategory(isSelected ? null : cat.name) })}
                  />
                );
              })}
            </G>
          </Svg>

          <TouchableOpacity
            style={styles.donutCenterContent}
            onPress={() => setSelectedCategory(null)}
            activeOpacity={0.7}
          >
            {activeCat ? (
              <>
                <View style={[styles.donutActiveCatIcon, { backgroundColor: activeCat.color + '20' }]}>
                  <CategoryIcon categoryName={activeCat.name} iconName={activeCat.icon} color={activeCat.color} size={18} />
                </View>
                <Text style={styles.donutActiveCatName} numberOfLines={1}>
                  {activeCat.name}
                </Text>
                <Text style={styles.donutActiveCatAmount} numberOfLines={1}>
                  {curr}{activeCat.amount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.donutActiveCatPercent}>
                  {activeCat.percentage}% of total
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.donutCenterLabel}>
                  {categoryType === 'expense' ? 'Total Spent' : 'Total Income'}
                </Text>
                <Text style={styles.donutCenterAmount} numberOfLines={1}>
                  {curr}{totalAmount > 99999 ? (totalAmount / 1000).toFixed(1) + 'k' : totalAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.donutTapHint}>Tap slice to inspect</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Category Chips */}
        <View style={styles.donutChipsWrap}>
          {categoryBreakdown.slice(0, 6).map(c => {
            const isSel = selectedCategory === c.name;
            return (
              <TouchableOpacity
                key={c.name}
                style={[
                  styles.donutChip,
                  isSel && { borderColor: c.color, backgroundColor: c.color + '18' },
                ]}
                onPress={() => setSelectedCategory(isSel ? null : c.name)}
                activeOpacity={0.7}
              >
                <View style={[styles.donutChipDot, { backgroundColor: c.color }]} />
                <Text style={[styles.donutChipText, isSel && { fontWeight: '800', color: '#0F172A' }]}>
                  {c.name} ({c.percentage}%)
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1C1C1E" />
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER WITH THEMED BRAND ACCENT */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Financial Reports</Text>
          <Text style={styles.screenSubtitle}>Income, expense & spending analytics</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareReport} activeOpacity={0.75}>
          <Ionicons name="share-outline" size={18} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1C1C1E" />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* COMPACT PERIOD FILTER BAR (FITS FULL SCREEN) */}
          <View style={styles.periodSegmentContainer}>
            {[
              { key: 'this_month', label: 'Month' },
              { key: 'last_month', label: 'Last Mo' },
              { key: '3_months', label: '3 Mo' },
              { key: 'this_year', label: 'Year' },
              { key: 'all', label: 'All' },
            ].map(p => {
              const isSel = period === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.periodSegmentBtn, isSel && styles.periodSegmentBtnActive]}
                  onPress={() => {
                    setPeriod(p.key as PeriodType);
                    setSelectedPointIndex(null);
                    setSelectedCategory(null);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.periodSegmentText, isSel && styles.periodSegmentTextActive]}
                    numberOfLines={1}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* HERO NET SAVINGS CARD */}
          <Animated.View style={[styles.heroOverviewCard, { backgroundColor: animatedCardBg }]}>
            {/* Smooth Diagonal Shimmer Gleam */}
            <Animated.View style={[styles.shimmerBeam, shimmerStyle]} pointerEvents="none" />

            {/* Header Row: Label Pill (✦ NET SAVINGS) & Savings Rate Badge */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroNetLabelWrap}>
                <Ionicons name="sparkles" size={12} color="#0F172A" style={{ marginRight: 4 }} />
                <Text style={styles.heroNetLabel}>NET SAVINGS</Text>
              </View>

              <View style={styles.heroSavingsBadge}>
                <Ionicons name="trending-up" size={13} color="#0F172A" style={{ marginRight: 4 }} />
                <Text style={styles.heroSavingsBadgeText}>{metrics.savingsRate}% Saved</Text>
              </View>
            </View>

            {/* Main Net Savings Display */}
            <View style={styles.heroAmountWrap}>
              <Text style={styles.heroNetValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                {metrics.net >= 0 ? '+' : ''}{curr}{metrics.net.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Income, Expense & Daily Average Split 3-Card Grid */}
            <View style={styles.heroCashflowRow}>
              <View style={styles.heroIncomeCard}>
                <View style={styles.heroIncomeIconCircle}>
                  <Ionicons name="arrow-up" size={12} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroInnerCardLabel}>Income</Text>
                  <Text style={styles.heroIncomeAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                    +{curr}{metrics.income.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.heroExpenseCard}>
                <View style={styles.heroExpenseIconCircle}>
                  <Ionicons name="arrow-down" size={12} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroInnerCardLabel}>Expense</Text>
                  <Text style={styles.heroExpenseAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                    -{curr}{metrics.expense.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.heroDailyCard}>
                <View style={styles.heroDailyIconCircle}>
                  <Ionicons name="calendar-outline" size={12} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroInnerCardLabel}>Daily Avg</Text>
                  <Text style={styles.heroDailyAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                    {curr}{metrics.dailyAvg.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* SMART AI FINANCIAL HEALTH & ADVISOR CARD */}
          <View style={styles.aiHealthCard}>
            <View style={styles.aiHealthHeader}>
              <View style={styles.aiHealthTitleWrap}>
                <View style={[styles.aiSparkleIconWrap, { backgroundColor: financialHealth.color + '20' }]}>
                  <Ionicons name="sparkles" size={15} color={financialHealth.color} />
                </View>
                <View>
                  <Text style={styles.aiHealthTitle}>Financial Vitality</Text>
                  <Text style={styles.aiHealthSub}>AI Budget & Habits Analysis</Text>
                </View>
              </View>
              <View style={[styles.healthScoreBadge, { backgroundColor: financialHealth.color + '15', borderColor: financialHealth.color + '40' }]}>
                <Text style={[styles.healthScoreText, { color: financialHealth.color }]}>
                  {financialHealth.score}/100 • {financialHealth.rating}
                </Text>
              </View>
            </View>

            {/* Health Score Gauge Bar */}
            <View style={styles.healthScoreTrack}>
              <View style={[styles.healthScoreFill, { width: `${financialHealth.score}%`, backgroundColor: financialHealth.color }]} />
            </View>

            {/* Dynamic AI Insights Bullet Points */}
            <View style={styles.aiInsightsList}>
              {financialHealth.insights.map((insight, idx) => (
                <View key={idx} style={styles.aiInsightRow}>
                  <View style={styles.aiInsightBullet}>
                    <Ionicons name="checkmark-circle" size={14} color={financialHealth.color} />
                  </View>
                  <Text style={styles.aiInsightText}>{insight}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CHART VIEW SWITCHER TABS */}
          <View style={styles.chartViewSwitcher}>
            <TouchableOpacity
              style={[styles.chartViewBtn, chartView === 'donut' && styles.chartViewBtnActive]}
              onPress={() => setChartView('donut')}
              activeOpacity={0.8}
            >
              <Ionicons name="pie-chart" size={14} color={chartView === 'donut' ? '#1C1C1E' : '#64748B'} style={{ marginRight: 5 }} />
              <Text style={[styles.chartViewText, chartView === 'donut' && styles.chartViewTextActive]}>
                Categories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chartViewBtn, chartView === 'curve' && styles.chartViewBtnActive]}
              onPress={() => setChartView('curve')}
              activeOpacity={0.8}
            >
              <Ionicons name="analytics" size={14} color={chartView === 'curve' ? '#1C1C1E' : '#64748B'} style={{ marginRight: 5 }} />
              <Text style={[styles.chartViewText, chartView === 'curve' && styles.chartViewTextActive]}>
                Trend Curve
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chartViewBtn, chartView === 'bars' && styles.chartViewBtnActive]}
              onPress={() => setChartView('bars')}
              activeOpacity={0.8}
            >
              <Ionicons name="bar-chart" size={14} color={chartView === 'bars' ? '#1C1C1E' : '#64748B'} style={{ marginRight: 5 }} />
              <Text style={[styles.chartViewText, chartView === 'bars' && styles.chartViewTextActive]}>
                Monthly Bars
              </Text>
            </TouchableOpacity>
          </View>

          {/* ACTIVE CHART DISPLAY */}
          {chartView === 'curve' && renderSmoothLineGraph()}
          {chartView === 'bars' && renderMonthlyBarChart()}
          {chartView === 'donut' && (
            <View style={styles.chartWrapperCard}>
              <View style={styles.categoryChartHeader}>
                <View>
                  <Text style={styles.themeCardTitle}>
                    {categoryType === 'expense' ? 'Expense Distribution' : 'Income Distribution'}
                  </Text>
                  <Text style={styles.themeCardSub}>
                    {selectedCategory ? `Viewing "${selectedCategory}" details` : 'Tap on any slice to inspect category share'}
                  </Text>
                </View>
                {selectedCategory && (
                  <TouchableOpacity
                    style={styles.resetCatBtn}
                    onPress={() => setSelectedCategory(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={13} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.resetCatText}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>

              {categoryBreakdown.length > 0 ? (
                renderCategoryDonut()
              ) : (
                <View style={styles.emptyCardBox}>
                  <Ionicons name="pie-chart-outline" size={36} color="#CBD5E1" />
                  <Text style={styles.emptyCardText}>No transactions recorded for this period</Text>
                </View>
              )}
            </View>
          )}

          {/* CATEGORY BREAKDOWN LIST WITH EXPENSE / INCOME TOGGLE */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderBetween}>
              <View>
                <Text style={styles.cardHeading}>Category Breakdown</Text>
                <Text style={styles.cardSub}>Detailed spend by category</Text>
              </View>

              {/* Expense vs Income Switcher Pills */}
              <View style={styles.catTypeToggleRow}>
                <TouchableOpacity
                  style={[styles.catTypeBtn, categoryType === 'expense' && styles.catTypeBtnActiveExpense]}
                  onPress={() => {
                    setCategoryType('expense');
                    setSelectedCategory(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catTypeText, categoryType === 'expense' && styles.catTypeTextActiveExpense]}>
                    Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.catTypeBtn, categoryType === 'income' && styles.catTypeBtnActiveIncome]}
                  onPress={() => {
                    setCategoryType('income');
                    setSelectedCategory(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catTypeText, categoryType === 'income' && styles.catTypeTextActiveIncome]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {categoryBreakdown.length === 0 ? (
              <View style={styles.emptyCardBox}>
                <Ionicons name="receipt-outline" size={36} color="#CBD5E1" />
                <Text style={styles.emptyCardText}>No {categoryType} transactions in this period</Text>
              </View>
            ) : (
              <View style={styles.categoryListWrap}>
                {categoryBreakdown.map(cat => {
                  const isSel = selectedCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[styles.categoryRow, isSel && styles.categoryRowSelected]}
                      onPress={() => {
                        setSelectedCategory(isSel ? null : cat.name);
                        setChartView('donut');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.categoryIconCircle, { backgroundColor: cat.color + '18' }]}>
                        <CategoryIcon categoryName={cat.name} iconName={cat.icon} color={cat.color} size={20} />
                      </View>
                      <View style={styles.categoryDetailsCol}>
                        <View style={styles.categoryTopRow}>
                          <Text style={[styles.categoryName, isSel && { fontWeight: '900', color: '#0F172A' }]} numberOfLines={1}>
                            {cat.name}
                          </Text>
                          <Text style={styles.categoryAmount}>{curr}{cat.amount.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.progressBarTrack}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: cat.color },
                            ]}
                          />
                        </View>
                        <View style={styles.categoryBottomRow}>
                          <Text style={styles.categoryPercentText}>{cat.percentage}% of total {categoryType}</Text>
                          <Text style={styles.categoryTxnCount}>{cat.count} txns</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* PAYMENT MODES SPLIT */}
          {paymentModesSplit.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeading}>Payment Methods</Text>
              <Text style={styles.cardSub}>Mode of payment used for expenses</Text>

              {/* Segmented Bar */}
              <View style={styles.paymentBarContainer}>
                {paymentModesSplit.map((pm, idx) => {
                  const colors = ['#1C1C1E', '#FFD740', '#10B981', '#6366F1'];
                  const c = colors[idx % colors.length];
                  return (
                    <View
                      key={pm.mode}
                      style={{
                        flex: pm.percentage || 1,
                        height: 12,
                        backgroundColor: c,
                        marginHorizontal: 1.5,
                        borderRadius: 4,
                      }}
                    />
                  );
                })}
              </View>

              <View style={styles.paymentPillsRow}>
                {paymentModesSplit.map((pm, idx) => {
                  const colors = ['#1C1C1E', '#FFD740', '#10B981', '#6366F1'];
                  const c = colors[idx % colors.length];
                  return (
                    <View key={pm.mode} style={styles.paymentPillBadge}>
                      <View style={[styles.paymentDot, { backgroundColor: c }]} />
                      <PaymentModeIcon mode={pm.mode} size={14} style={{ marginRight: 4 }} />
                      <Text style={styles.paymentModeLabel}>{pm.mode}: </Text>
                      <Text style={styles.paymentModeValue}>{pm.percentage}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* DAY-OF-WEEK SPENDING WAVE */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeading}>Day-of-Week Spending</Text>
            <Text style={styles.cardSub}>Pattern of your spending across days</Text>

            <View style={styles.dayOfWeekRow}>
              {dayOfWeekSpend.map(d => (
                <View key={d.day} style={styles.dayCol}>
                  <View style={styles.dayBarTrack}>
                    <View
                      style={[
                        styles.dayBarFill,
                        { height: `${Math.max(d.percentOfMax, 8)}%` },
                        d.percentOfMax >= 80 && styles.dayBarFillHigh,
                      ]}
                    />
                  </View>
                  <Text style={[styles.dayNameText, d.percentOfMax >= 80 && { color: '#1C1C1E', fontWeight: '900' }]}>
                    {d.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* LARGEST EXPENSES */}
          {topExpenses.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeading}>Largest Expenses</Text>
              <Text style={styles.cardSub}>Top transactions during this period</Text>

              <View style={styles.topExpenseList}>
                {topExpenses.map((tx, idx) => (
                  <View key={tx.id || String(idx)} style={styles.topExpenseItem}>
                    <View style={styles.topExpenseRank}>
                      <Text style={styles.topExpenseRankText}>#{idx + 1}</Text>
                    </View>
                    <View style={styles.topExpenseDetails}>
                      <Text style={styles.topExpenseTitle} numberOfLines={1}>
                        {tx.title || tx.category}
                      </Text>
                      <Text style={styles.topExpenseDate}>
                        {tx.date} • {tx.category}
                      </Text>
                    </View>
                    <Text style={styles.topExpenseAmount}>
                      -{curr}{Math.abs(tx.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 110 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  periodSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 3,
  },
  periodSegmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  periodSegmentBtnActive: {
    backgroundColor: '#1C1C1E',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  periodSegmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  periodSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // HERO NET SAVINGS CARD - ANIMATED PASTEL THEME
  heroOverviewCard: {
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#4338CA',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerBeam: {
    position: 'absolute',
    top: -70,
    bottom: -70,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroNetLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  heroNetLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.6,
  },
  heroSavingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  heroSavingsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroAmountWrap: {
    marginBottom: 16,
  },
  heroNetValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  heroCashflowRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroIncomeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  heroIncomeIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  heroExpenseCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  heroExpenseIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  heroDailyCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  heroDailyIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  heroInnerCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  heroIncomeAmount: {
    fontSize: 11,
    fontWeight: '900',
    color: '#16A34A',
  },
  heroExpenseAmount: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626',
  },
  heroDailyAmount: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
  },

  // CHART VIEW SWITCHER
  chartViewSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
  },
  chartViewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11,
  },
  chartViewBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  chartViewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  chartViewTextActive: {
    color: '#1C1C1E',
    fontWeight: '800',
  },

  // CHART CARDS
  chartWrapperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  themeCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  themeCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activePointPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9E7',
    borderWidth: 1,
    borderColor: '#FFD740',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePointPillDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  activePointPillAmount: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  barLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },

  // SMART AI FINANCIAL HEALTH CARD
  aiHealthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  aiHealthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiHealthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiSparkleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHealthTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  aiHealthSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  healthScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  healthScoreText: {
    fontSize: 11,
    fontWeight: '900',
  },
  healthScoreTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  healthScoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiInsightsList: {
    gap: 8,
  },
  aiInsightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  aiInsightBullet: {
    marginTop: 2,
  },
  aiInsightText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 17,
  },

  // SECTION CARDS
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  categoryChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resetCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  resetCatText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  catTypeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  catTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9,
  },
  catTypeBtnActiveExpense: {
    backgroundColor: '#DC2626',
  },
  catTypeBtnActiveIncome: {
    backgroundColor: '#16A34A',
  },
  catTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  catTypeTextActiveExpense: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  catTypeTextActiveIncome: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  categoryCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  emptyCardBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // DONUT
  donutCardInner: {
    alignItems: 'center',
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  donutCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
  },
  donutActiveCatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  donutActiveCatName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
    textAlign: 'center',
  },
  donutActiveCatAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  donutActiveCatPercent: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 1,
  },
  donutCenterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  donutCenterAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1C1C1E',
    marginTop: 1,
  },
  donutTapHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  donutChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  donutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  donutChipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  donutChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  // CATEGORY LIST
  categoryListWrap: {
    gap: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 14,
  },
  categoryRowSelected: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDetailsCol: {
    flex: 1,
  },
  categoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryPercentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTxnCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // PAYMENT BAR
  paymentBarContainer: {
    flexDirection: 'row',
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  paymentPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  paymentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  paymentModeLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  paymentModeValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1C1C1E',
  },

  // DAY OF WEEK
  dayOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
    paddingTop: 10,
    paddingHorizontal: 6,
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayBarTrack: {
    width: 14,
    height: 75,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  dayBarFill: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 7,
  },
  dayBarFillHigh: {
    backgroundColor: '#FFD740',
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },

  // TOP EXPENSES
  topExpenseList: {
    gap: 10,
  },
  topExpenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topExpenseRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topExpenseRankText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
  },
  topExpenseDetails: {
    flex: 1,
    marginRight: 8,
  },
  topExpenseTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  topExpenseDate: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  topExpenseAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#EF4444',
  },
});
