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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import CategoryIcon from '@/components/CategoryIcon';
import Skeleton from '@/components/Skeleton';
import { useAuth } from '@/context/AuthContext';
import {
  getUserCategories,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  CategoryItem,
} from '@/lib/database';
import { safeGoBack } from '@/lib/navigation';
import { useTranslation } from '@/lib/i18n';
import { ConfirmDialogModal } from '@/components/confirm-dialog-modal';
import {
  QuickPresetItem,
  PRESET_ICONS,
  DEFAULT_QUICK_COMBOS_EXPENSE,
  DEFAULT_QUICK_COMBOS_INCOME,
  fetchCustomPresets,
  saveCustomPresetItem,
  removeCustomPresetItem,
  fetchHiddenPresetIds,
  toggleHidePresetId,
} from '@/lib/quickPresets';

const AVAILABLE_ICONS = [
  'rose',
  'nurse',
  'heart-gift',
  'heart-shopping',
  'eggs',
  'smoking',
  'eating',
  'alcohol',
  'medicine',
  'pet',
  'baby',
  'beauty',
  'electronics',
  'internet',
  'parking',
  'sports',
  'cinema',
  'books',
  'charity',
  'laundry',
  'ice-cream',
  'cupcake',
  'donut',
  'cookie',
  'candy',
  'cake',
  'lollipop',
  'chocolate',
  'pancakes',
  'popcorn',
  'strawberry',
  'watermelon',
  'banana',
  'apple',
  'fast-food',
  'airplane',
  'cart',
  'home',
  'receipt',
  'card',
  'film',
  'play-circle',
  'medkit',
  'school',
  'car',
  'gift',
  'fitness',
  'cafe',
  'game-controller',
  'briefcase',
  'bus',
  'bicycle',
  'shirt',
  'musical-notes',
];

const AVAILABLE_COLORS = [
  '#FF6B6B',
  '#4D96FF',
  '#9D4EDD',
  '#6BCB77',
  '#FF9F1C',
  '#E63946',
  '#FFD166',
  '#118AB2',
  '#06D6A0',
  '#073B4C',
  '#F72585',
  '#7209B7',
  '#3A0CA3',
  '#4361EE',
  '#4CC9F0',
];

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'categories' | 'presets'>(
    params.tab === 'presets' ? 'presets' : 'categories'
  );

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Category Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catToDelete, setCatToDelete] = useState<CategoryItem | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('fast-food');
  const [selectedColor, setSelectedColor] = useState('#4D96FF');
  const [saving, setSaving] = useState(false);

  // Quick Presets State
  const [customPresets, setCustomPresets] = useState<QuickPresetItem[]>([]);
  const [hiddenPresetIds, setHiddenPresetIds] = useState<string[]>([]);
  const [presetFilter, setPresetFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [presetToDelete, setPresetToDelete] = useState<QuickPresetItem | null>(null);

  // Add Quick Preset Modal State
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetAmount, setNewPresetAmount] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState('Food');
  const [newPresetType, setNewPresetType] = useState<'debit' | 'credit'>('debit');
  const [newPresetIconUrl, setNewPresetIconUrl] = useState(PRESET_ICONS[0].url);

  const fetchCategories = async () => {
    if (!user) return;
    try {
      const list = await getUserCategories(user.uid);
      setCategories(list);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = async () => {
    try {
      const [custom, hidden] = await Promise.all([fetchCustomPresets(), fetchHiddenPresetIds()]);
      setCustomPresets(custom);
      setHiddenPresetIds(hidden);
    } catch (e) {
      console.error('Error loading presets in categories:', e);
    }
  };

  useEffect(() => {
    fetchCategories();
    loadPresets();
  }, [user]);

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setSelectedIcon(AVAILABLE_ICONS[0]);
    setSelectedColor(AVAILABLE_COLORS[0]);
    setShowModal(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    if (!cat.isCustom) return;
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    setShowModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert(t('category'), 'Please enter a category name.');
      return;
    }

    if (!user) return;
    setSaving(true);
    try {
      if (editingCategory && editingCategory.id) {
        await updateCustomCategory(user.uid, editingCategory.id, {
          name: categoryName.trim(),
          icon: selectedIcon,
          color: selectedColor,
        });
      } else {
        await addCustomCategory(user.uid, {
          name: categoryName.trim(),
          icon: selectedIcon,
          color: selectedColor,
        });
      }
      await fetchCategories();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const executeDeleteCat = async (catId: string) => {
    if (!user || !catId) return;
    try {
      await deleteCustomCategory(user.uid, catId);
      await fetchCategories();
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') {
        window.alert('Failed to delete category.');
      } else {
        Alert.alert('Error', 'Failed to delete category.');
      }
    }
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    if (!cat.isCustom || !cat.id) {
      if (Platform.OS === 'web') {
        window.alert('Default categories cannot be deleted.');
      } else {
        Alert.alert('Default Category', 'Default categories cannot be deleted.');
      }
      return;
    }
    setCatToDelete(cat);
  };

  // Preset Handlers
  const handleSaveQuickPreset = async () => {
    if (!newPresetLabel.trim()) {
      Alert.alert('Preset Name', 'Please enter a name for the quick preset.');
      return;
    }
    const cleanAmt = newPresetAmount.replace(/[^0-9.]/g, '');
    if (!cleanAmt || parseFloat(cleanAmt) <= 0) {
      Alert.alert('Preset Amount', 'Please enter a valid amount.');
      return;
    }

    const item: QuickPresetItem = {
      id: 'custom_' + Date.now(),
      label: newPresetLabel.trim(),
      amount: cleanAmt,
      category: newPresetCategory || (newPresetType === 'debit' ? 'Food' : 'Salary'),
      iconUrl: newPresetIconUrl,
      type: newPresetType,
      isCustom: true,
    };

    const updated = await saveCustomPresetItem(item);
    setCustomPresets(updated);
    setShowPresetModal(false);
    setNewPresetLabel('');
    setNewPresetAmount('');
    Toast.show({
      type: 'success',
      text1: 'Quick Preset Added!',
      text2: `"${item.label}" (₹${item.amount}) is now available in 1-Tap Presets`,
    });
  };

  const executeDeletePreset = async () => {
    if (!presetToDelete) return;
    const target = presetToDelete;
    setPresetToDelete(null);

    const updated = await removeCustomPresetItem(target.id, target.label, target.amount);
    setCustomPresets(updated);
    Toast.show({
      type: 'info',
      text1: 'Preset Removed',
      text2: `"${target.label}" has been removed`,
    });
  };

  const handleToggleHidePreset = async (preset: QuickPresetItem) => {
    const updated = await toggleHidePresetId(preset.id);
    setHiddenPresetIds(updated);
    const isNowHidden = updated.includes(preset.id);
    Toast.show({
      type: 'info',
      text1: isNowHidden ? 'Preset Hidden' : 'Preset Restored',
      text2: isNowHidden
        ? `"${preset.label}" will no longer appear on Add screen`
        : `"${preset.label}" is now visible on Add screen`,
    });
  };

  // Compile all presets for the presets tab
  const allPresets: QuickPresetItem[] = [
    ...customPresets,
    ...DEFAULT_QUICK_COMBOS_EXPENSE,
    ...DEFAULT_QUICK_COMBOS_INCOME,
  ];

  const filteredPresets = allPresets.filter((p) => {
    if (presetFilter === 'all') return true;
    if (presetFilter === 'debit') return p.type === 'debit' || !p.type;
    if (presetFilter === 'credit') return p.type === 'credit';
    return true;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />
        <View style={styles.topBar}>
          <View style={styles.backButton}><Skeleton width={24} height={24} borderRadius={12} /></View>
          <Skeleton width={140} height={20} />
          <View style={styles.addButton}><Skeleton width={24} height={24} borderRadius={12} /></View>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.listCard}>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <Skeleton width={44} height={44} borderRadius={22} style={{ marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width={120} height={16} />
                </View>
                <Skeleton width={24} height={24} borderRadius={12} />
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
        <Text style={styles.headerTitle}>
          {activeTab === 'categories' ? t('manage_categories') : '⚡ 1-Tap Presets'}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={activeTab === 'categories' ? openAddModal : () => setShowPresetModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      {/* SEGMENTED TAB BAR */}
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'categories' && styles.tabBtnActive]}
            onPress={() => setActiveTab('categories')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="grid-outline"
              size={15}
              color={activeTab === 'categories' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'categories' && styles.tabBtnTextActive]}>
              Categories
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'presets' && styles.tabBtnActive]}
            onPress={() => setActiveTab('presets')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="flash"
              size={15}
              color={activeTab === 'presets' ? '#D97706' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'presets' && styles.tabBtnTextActive]}>
              ⚡ 1-Tap Presets
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'categories' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.listCard}>
            {categories.map((cat, idx) => {
              const isLast = idx === categories.length - 1;

              return (
                <View
                  key={cat.id || cat.name}
                  style={[styles.categoryRow, !isLast && styles.rowBorder]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: cat.color + '20', overflow: 'hidden' }]}>
                    <CategoryIcon categoryName={cat.name} iconName={cat.icon} size={22} color={cat.color} />
                  </View>

                  <View style={styles.nameWrap}>
                    <Text style={styles.categoryNameText}>{cat.name}</Text>
                    <View
                      style={[
                        styles.badge,
                        cat.isCustom ? styles.badgeCustom : styles.badgeDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          cat.isCustom ? styles.badgeTextCustom : styles.badgeTextDefault,
                        ]}
                      >
                        {cat.isCustom ? t('custom_badge') : t('default_badge')}
                      </Text>
                    </View>
                  </View>

                  {cat.isCustom ? (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => openEditModal(cat)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil" size={18} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleDeleteCategory(cat)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Ionicons name="lock-closed" size={16} color="#D1D5DB" style={{ marginRight: 8 }} />
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Presets Header Card */}
          <View style={styles.presetsIntroCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ExpoImage
                  source={{ uri: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/High%20Voltage.png' }}
                  style={{ width: 22, height: 22, marginRight: 8 }}
                  contentFit="contain"
                />
                <Text style={styles.presetsIntroTitle}>1-Tap Quick Presets</Text>
              </View>

              <TouchableOpacity
                style={styles.addPresetPillBtn}
                onPress={() => setShowPresetModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={14} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.addPresetPillText}>+ New Preset</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.presetsIntroDesc}>
              These presets appear as 1-tap shortcuts at the top of the Add Transaction screen. You can add new presets, delete custom ones, or hide default ones here.
            </Text>

            {/* Filter Pills */}
            <View style={styles.presetFilterRow}>
              {(['all', 'debit', 'credit'] as const).map((filterKey) => (
                <TouchableOpacity
                  key={filterKey}
                  style={[
                    styles.presetFilterPill,
                    presetFilter === filterKey && styles.presetFilterPillActive,
                  ]}
                  onPress={() => setPresetFilter(filterKey)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetFilterText,
                      presetFilter === filterKey && styles.presetFilterTextActive,
                    ]}
                  >
                    {filterKey === 'all' ? 'All Presets' : filterKey === 'debit' ? 'Expenses' : 'Income'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* List Card */}
          <View style={styles.listCard}>
            {filteredPresets.map((preset, idx) => {
              const isLast = idx === filteredPresets.length - 1;
              const isHidden = hiddenPresetIds.includes(preset.id);

              return (
                <View
                  key={preset.id || preset.label + preset.amount}
                  style={[
                    styles.categoryRow,
                    !isLast && styles.rowBorder,
                    isHidden && styles.presetRowHidden,
                  ]}
                >
                  <View style={styles.presetIconWrap}>
                    <ExpoImage
                      source={{ uri: preset.iconUrl }}
                      style={{ width: 32, height: 32 }}
                      contentFit="contain"
                    />
                  </View>

                  <View style={styles.nameWrap}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.categoryNameText, isHidden && styles.presetTextHidden]}>
                        {preset.label}
                      </Text>
                      <Text style={styles.presetSubText}>
                        ₹{preset.amount} • {preset.category}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.badge,
                        preset.isCustom
                          ? styles.badgeCustom
                          : isHidden
                          ? styles.badgeHidden
                          : styles.badgeDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          preset.isCustom
                            ? styles.badgeTextCustom
                            : isHidden
                            ? styles.badgeTextHidden
                            : styles.badgeTextDefault,
                        ]}
                      >
                        {preset.isCustom ? 'Custom' : isHidden ? 'Hidden' : 'Default'}
                      </Text>
                    </View>
                  </View>

                  {preset.isCustom ? (
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => setPresetToDelete(preset)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={19} color="#EF4444" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.hideBtn, isHidden && styles.unhideBtn]}
                      onPress={() => handleToggleHidePreset(preset)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isHidden ? 'eye-outline' : 'eye-off-outline'}
                        size={14}
                        color={isHidden ? '#16A34A' : '#64748B'}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.hideBtnText, isHidden && styles.unhideBtnText]}>
                        {isHidden ? 'Restore' : 'Hide'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Add / Edit Category Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? t('edit_category') : t('add_new_category')}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Name */}
              <Text style={styles.formLabel}>{t('category_name')}</Text>
              <TextInput
                style={[styles.nameInput, { color: '#1C1C1E' }]}
                placeholder="e.g. Subscriptions, Gym..."
                placeholderTextColor="#9CA3AF"
                value={categoryName}
                onChangeText={setCategoryName}
              />

              {/* Icon Selector */}
              <Text style={styles.formLabel}>{t('category_icon')}</Text>
              <View style={styles.iconsGrid}>
                {AVAILABLE_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && styles.iconOptionActive,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                    activeOpacity={0.7}
                  >
                    <CategoryIcon
                      categoryName=""
                      iconName={icon}
                      size={28}
                      color={selectedIcon === icon ? '#1C1C1E' : '#6B7280'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color Selector */}
              <Text style={styles.formLabel}>{t('category_color')}</Text>
              <View style={styles.colorsGrid}>
                {AVAILABLE_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionActive,
                    ]}
                    onPress={() => setSelectedColor(color)}
                    activeOpacity={0.8}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveCategory}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#1C1C1E" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('save')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CREATE QUICK PRESET MODAL */}
      <Modal
        visible={showPresetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPresetModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ExpoImage
                  source={{ uri: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/High%20Voltage.png' }}
                  style={{ width: 22, height: 22, marginRight: 8 }}
                  contentFit="contain"
                />
                <Text style={styles.modalTitle}>New 1-Tap Preset</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPresetModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type Switcher */}
              <View style={styles.presetTypeSwitchRow}>
                <TouchableOpacity
                  style={[
                    styles.presetTypeBtn,
                    newPresetType === 'debit' && styles.presetTypeBtnExpense,
                  ]}
                  onPress={() => {
                    setNewPresetType('debit');
                    setNewPresetCategory('Food');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={16}
                    color={newPresetType === 'debit' ? '#EF4444' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.presetTypeBtnText,
                      newPresetType === 'debit' && styles.presetTypeBtnTextExpense,
                    ]}
                  >
                    Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetTypeBtn,
                    newPresetType === 'credit' && styles.presetTypeBtnIncome,
                  ]}
                  onPress={() => {
                    setNewPresetType('credit');
                    setNewPresetCategory('Salary');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={16}
                    color={newPresetType === 'credit' ? '#10B981' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.presetTypeBtnText,
                      newPresetType === 'credit' && styles.presetTypeBtnTextIncome,
                    ]}
                  >
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Preset Label */}
              <Text style={styles.formLabel}>Preset Name / Label</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="e.g. Chai, Lunch, Fuel, Gym..."
                placeholderTextColor="#9CA3AF"
                value={newPresetLabel}
                onChangeText={setNewPresetLabel}
              />

              {/* Amount */}
              <Text style={styles.formLabel}>Default Amount (₹)</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="e.g. 20, 100, 500..."
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={newPresetAmount}
                onChangeText={setNewPresetAmount}
              />

              {/* Category */}
              <Text style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {categories.map((c) => {
                  const isSelected = newPresetCategory === c.name;
                  return (
                    <TouchableOpacity
                      key={c.id || c.name}
                      style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                      onPress={() => setNewPresetCategory(c.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 3D Fluent Icon Picker */}
              <Text style={styles.formLabel}>Select 3D Icon</Text>
              <View style={styles.presetIconsGrid}>
                {PRESET_ICONS.map((item) => {
                  const isSelected = newPresetIconUrl === item.url;
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.presetIconTile, isSelected && styles.presetIconTileActive]}
                      onPress={() => setNewPresetIconUrl(item.url)}
                      activeOpacity={0.7}
                    >
                      <ExpoImage source={{ uri: item.url }} style={{ width: 34, height: 34 }} contentFit="contain" />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.savePresetBtn}
                onPress={handleSaveQuickPreset}
                activeOpacity={0.85}
              >
                <Text style={styles.savePresetBtnText}>Save Quick Preset</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CUSTOM DELETE CATEGORY CONFIRMATION MODAL */}
      <ConfirmDialogModal
        visible={!!catToDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${catToDelete?.name}"? All past transactions will remain safe.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={() => {
          if (catToDelete?.id) {
            executeDeleteCat(catToDelete.id);
            setCatToDelete(null);
          }
        }}
        onCancel={() => setCatToDelete(null)}
      />

      {/* CUSTOM DELETE PRESET CONFIRMATION MODAL */}
      <ConfirmDialogModal
        visible={!!presetToDelete}
        title="Delete Quick Preset"
        message={`Are you sure you want to remove "${presetToDelete?.label}" (₹${presetToDelete?.amount}) from 1-Tap Quick Presets?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={executeDeletePreset}
        onCancel={() => setPresetToDelete(null)}
      />
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD740',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },

  // SEGMENTED TAB BAR
  tabBarWrap: {
    paddingHorizontal: 20,
    marginBottom: 10,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 4,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  listCard: {
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
  presetRowHidden: {
    opacity: 0.55,
    backgroundColor: '#F8FAFC',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  presetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  nameWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  categoryNameText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  presetTextHidden: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  presetSubText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDefault: {
    backgroundColor: '#F3F4F6',
  },
  badgeCustom: {
    backgroundColor: '#FEF9E7',
  },
  badgeHidden: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextDefault: {
    color: '#9CA3AF',
  },
  badgeTextCustom: {
    color: '#B45309',
  },
  badgeTextHidden: {
    color: '#DC2626',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  hideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unhideBtn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  hideBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748B',
  },
  unhideBtnText: {
    color: '#16A34A',
  },

  // PRESETS INTRO CARD
  presetsIntroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  presetsIntroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  presetsIntroDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  addPresetPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  addPresetPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#D97706',
  },
  presetFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  presetFilterPillActive: {
    backgroundColor: '#0F172A',
  },
  presetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  presetFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '88%',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  formLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F7F8FC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconOptionActive: {
    backgroundColor: '#FFD740',
    borderColor: '#FFD740',
    transform: [{ scale: 1.1 }],
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: '#1C1C1E',
    transform: [{ scale: 1.15 }],
  },
  saveBtn: {
    backgroundColor: '#FFD740',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1C1E',
  },

  // PRESET MODAL SPECIFIC
  presetTypeSwitchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  presetTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  presetTypeBtnExpense: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  presetTypeBtnIncome: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  presetTypeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  presetTypeBtnTextExpense: {
    color: '#DC2626',
  },
  presetTypeBtnTextIncome: {
    color: '#059669',
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  categoryPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#92400E',
    fontWeight: '800',
  },
  presetIconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  presetIconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  presetIconTileActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF5',
    transform: [{ scale: 1.08 }],
  },
  savePresetBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  savePresetBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
