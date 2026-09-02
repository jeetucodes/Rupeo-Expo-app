import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CategoryIcon from '@/components/CategoryIcon';
import { useAuth } from '@/context/AuthContext';
import {
  getUserCategories,
  getCategoryTotals,
  getCategoryBudgets,
  saveCategoryBudget,
  saveUserSettings,
  CategoryItem,
} from '@/lib/database';
import { safeGoBack } from '@/lib/navigation';
import { useTranslation } from '@/lib/i18n';
import { getLocalMonthString } from '@/lib/dateUtils';
import Toast from 'react-native-toast-message';
import Skeleton from '@/components/Skeleton';

export default function BudgetScreen() {
  const router = useRouter();
  const { user, settings, refreshSettings } = useAuth();
  const { t } = useTranslation();
  const currency = settings?.currency === 'INR' ? '₹' : (settings?.currency || '₹');

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [totalSpent, setTotalSpent] = useState(0);

  // Overall Budget Modal
  const [showOverallModal, setShowOverallModal] = useState(false);
  const [overallBudgetInput, setOverallBudgetInput] = useState('');

  // Category Budget Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [categoryBudgetInput, setCategoryBudgetInput] = useState('');

  const fetchData = async () => {
    if (!user) return;
    try {
      const currentMonthYear = getLocalMonthString(); // YYYY-MM
      const [cats, totals, budgets] = await Promise.all([
        getUserCategories(user.uid),
        getCategoryTotals(user.uid, currentMonthYear),
        getCategoryBudgets(user.uid),
      ]);

      setCategories(cats);
      setCategoryBudgets(budgets);

      const totalsMap: Record<string, number> = {};
      let total = 0;
      totals.forEach(t => {
        totalsMap[t.name.toLowerCase()] = t.amount;
        total += t.amount;
      });
      setCategoryTotals(totalsMap);
      setTotalSpent(total);
    } catch (err) {
      console.error('Error fetching budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const monthlyBudget = settings?.monthlyBudget || 0;
  const overallPercentage = monthlyBudget > 0 ? Math.min(Math.round((totalSpent / monthlyBudget) * 100), 100) : 0;
  const isOverallOverBudget = monthlyBudget > 0 && totalSpent > monthlyBudget;

  const handleSaveOverallBudget = async () => {
    const val = parseFloat(overallBudgetInput);
    if (isNaN(val) || val < 0) {
      Toast.show({ type: 'error', text1: 'Invalid Amount', text2: 'Please enter a valid budget amount.' });
      return;
    }

    if (!user) return;
    try {
      const updated = { ...settings, monthlyBudget: val } as any;
      await saveUserSettings(user.uid, updated);
      await refreshSettings();
      setShowOverallModal(false);
      Toast.show({ type: 'success', text1: 'Budget Updated', text2: 'Monthly budget saved successfully.' });

      if (val > 0 && totalSpent > val) {
        import('@/lib/notifications').then(({ sendBudgetAlert }) => {
          sendBudgetAlert(Math.round(totalSpent - val), currency, totalSpent, val, undefined, user.uid).catch(() => {});
        }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save monthly budget.' });
    }
  };

  const handleSaveCategoryBudget = async () => {
    if (!selectedCategory) return;
    const val = parseFloat(categoryBudgetInput);
    if (isNaN(val) || val < 0) {
      Toast.show({ type: 'error', text1: 'Invalid Amount', text2: 'Please enter a valid budget amount.' });
      return;
    }

    if (!user) return;
    try {
      await saveCategoryBudget(user.uid, selectedCategory.name, val);
      setCategoryBudgets(prev => ({
        ...prev,
        [selectedCategory.name]: val,
      }));
      setShowCategoryModal(false);
      Toast.show({ type: 'success', text1: 'Category Budget Saved', text2: `${selectedCategory.name} budget updated.` });

      const catSpent = categoryTotals[selectedCategory.name.toLowerCase()] || 0;
      if (val > 0 && catSpent > val) {
        import('@/lib/notifications').then(({ sendBudgetAlert }) => {
          sendBudgetAlert(Math.round(catSpent - val), currency, catSpent, val, selectedCategory.name, user.uid).catch(() => {});
        }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save category budget.' });
    }
  };

  const openCategoryBudgetModal = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    const existing = categoryBudgets[cat.name] || 0;
    setCategoryBudgetInput(existing > 0 ? existing.toString() : '');
    setShowCategoryModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />
        <View style={styles.topBar}>
          <View style={styles.backButton}><Skeleton width={24} height={24} borderRadius={12} /></View>
          <Skeleton width={120} height={20} />
          <View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: '#F0EEE7', height: 160 }]}>
            <Skeleton width="100%" height="100%" borderRadius={24} color="rgba(15,23,42,0.06)" />
          </View>
          <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 8 }}>
            <Skeleton width={140} height={20} />
          </View>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 24, marginHorizontal: 20, paddingBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' }}>
                <Skeleton width={44} height={44} borderRadius={22} style={{ marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width="100%" height={8} borderRadius={4} style={{ marginBottom: 8 }} />
                  <Skeleton width={80} height={12} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => safeGoBack(router)}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('budget_goals')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <>
          {/* Overall Monthly Budget Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroSubtitle}>{t('overall_monthly_budget')}</Text>
                  <Text style={styles.heroAmount}>
                    {currency}
                    {monthlyBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editBudgetBtn}
                  onPress={() => {
                    setOverallBudgetInput(monthlyBudget > 0 ? monthlyBudget.toString() : '');
                    setShowOverallModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="pencil" size={16} color="#1C1C1E" />
                  <Text style={styles.editBudgetBtnText}>{t('edit')}</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Track */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${overallPercentage}%`,
                      backgroundColor: isOverallOverBudget ? '#EF4444' : '#FFD740',
                    },
                  ]}
                />
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>{t('spent')}</Text>
                  <Text style={[styles.statValue, isOverallOverBudget && { color: '#EF4444' }]}>
                    {currency}
                    {totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={[styles.statCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.statLabel}>{t('remaining')}</Text>
                  <Text style={styles.statValue}>
                    {currency}
                    {Math.max(0, monthlyBudget - totalSpent).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>

              {isOverallOverBudget && (
                <View style={styles.warningPill}>
                  <Ionicons name="warning" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.warningText}>{t('over_budget')}</Text>
                </View>
              )}
            </View>

            {/* Category Budgets Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('category_budgets')}</Text>
              <Text style={styles.sectionSubtitle}>
                Tap any category to set its monthly budget
              </Text>
            </View>

            {/* Category List */}
            <View style={styles.categoriesListCard}>
              {categories.map((cat, idx) => {
                const spent = categoryTotals[cat.name.toLowerCase()] || 0;
                const budget = categoryBudgets[cat.name] || 0;
                const percent = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
                const isOver = budget > 0 && spent > budget;
                const isLast = idx === categories.length - 1;

                return (
                  <TouchableOpacity
                    key={cat.id || cat.name}
                    style={[styles.categoryRow, !isLast && styles.rowBorder]}
                    onPress={() => openCategoryBudgetModal(cat)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.catIconWrap, { backgroundColor: cat.color + '20', overflow: 'hidden' }]}>
                      <CategoryIcon categoryName={cat.name} iconName={cat.icon} size={22} color={cat.color} />
                    </View>

                    <View style={styles.catInfoWrap}>
                      <View style={styles.catNameRow}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text style={[styles.catSpentText, isOver && { color: '#EF4444' }]}>
                          {currency}{spent.toLocaleString('en-IN')}
                          {budget > 0 ? ` / ${currency}${budget.toLocaleString('en-IN')}` : ''}
                        </Text>
                      </View>

                      {budget > 0 ? (
                        <View style={styles.catProgressTrack}>
                          <View
                            style={[
                              styles.catProgressBar,
                              {
                                width: `${percent}%`,
                                backgroundColor: isOver ? '#EF4444' : '#22C55E',
                              },
                            ]}
                          />
                        </View>
                      ) : (
                        <Text style={styles.noBudgetHint}>+ Set Budget</Text>
                      )}
                    </View>

                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
      </ScrollView>

      {/* Edit Overall Budget Modal */}
      <Modal visible={showOverallModal} transparent animationType="fade" onRequestClose={() => setShowOverallModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('overall_monthly_budget')}</Text>
              <TouchableOpacity onPress={() => setShowOverallModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Enter Monthly Limit ({currency})</Text>
            <TextInput
              style={[styles.modalInput, { color: '#1C1C1E' }]}
              keyboardType="decimal-pad"
              placeholder="e.g. 25000"
              placeholderTextColor="#9CA3AF"
              value={overallBudgetInput}
              onChangeText={setOverallBudgetInput}
              autoFocus
            />

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleSaveOverallBudget}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryBtnText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Category Budget Modal */}
      <Modal visible={showCategoryModal} transparent animationType="fade" onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCategory?.name} Budget
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Monthly Limit ({currency})</Text>
            <TextInput
              style={[styles.modalInput, { color: '#1C1C1E' }]}
              keyboardType="decimal-pad"
              placeholder="e.g. 5000"
              placeholderTextColor="#9CA3AF"
              value={categoryBudgetInput}
              onChangeText={setCategoryBudgetInput}
              autoFocus
            />

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleSaveCategoryBudget}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryBtnText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  loadingWrap: {
    marginTop: 60,
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: '#0F0F11',
    borderRadius: 28,
    padding: 24,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD740',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  editBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD740',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
  },
  editBudgetBtnText: {
    color: '#1C1C1E',
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#272A30',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {},
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#451A1A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 16,
  },
  warningText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  categoriesListCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  catInfoWrap: {
    flex: 1,
  },
  catNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  catSpentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  catProgressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  noBudgetHint: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    backgroundColor: '#FFD740',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  modalPrimaryBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1C1E',
  },
});
