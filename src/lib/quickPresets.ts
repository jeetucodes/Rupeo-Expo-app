import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuickPresetItem {
  id: string;
  label: string;
  amount: string;
  category: string;
  iconUrl: string;
  tileId?: string;
  type?: 'debit' | 'credit';
  isCustom?: boolean;
}

export const PRESET_ICONS = [
  { name: 'Chai', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Hot%20Beverage.png' },
  { name: 'Food', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Pizza.png' },
  { name: 'Burger', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Hamburger.png' },
  { name: 'Samosa/Snacks', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Dumpling.png' },
  { name: 'Thali/Meal', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Bento%20Box.png' },
  { name: 'Groceries', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shopping%20Cart.png' },
  { name: 'Milk', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Glass%20of%20Milk.png' },
  { name: 'Fuel', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fuel%20Pump.png' },
  { name: 'Taxi/Auto', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Taxi.png' },
  { name: 'Phone', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Mobile%20Phone.png' },
  { name: 'Shopping', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shopping%20Bags.png' },
  { name: 'Medicine', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Pill.png' },
  { name: 'Cigarette', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Cigarette.png' },
  { name: 'Beer/Drink', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Beer%20Mug.png' },
  { name: 'Gym', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Person%20Lifting%20Weights.png' },
  { name: 'Movie', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Clapper%20Board.png' },
  { name: 'Gaming', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Video%20Game.png' },
  { name: 'Gift', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Wrapped%20Gift.png' },
  { name: 'Money', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Money%20Bag.png' },
  { name: 'Salary', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Briefcase.png' },
];

export const DEFAULT_QUICK_COMBOS_EXPENSE: QuickPresetItem[] = [
  {
    id: 'def_chai_20',
    label: 'Chai',
    amount: '20',
    category: 'Food',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Hot%20Beverage.png',
    tileId: 'chai',
    type: 'debit',
  },
  {
    id: 'def_snacks_50',
    label: 'Tea & Snacks',
    amount: '50',
    category: 'Food',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Dumpling.png',
    tileId: 'chai',
    type: 'debit',
  },
  {
    id: 'def_petrol_100',
    label: 'Petrol',
    amount: '100',
    category: 'Transport',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fuel%20Pump.png',
    tileId: 'petrol',
    type: 'debit',
  },
  {
    id: 'def_lunch_150',
    label: 'Lunch / Meal',
    amount: '150',
    category: 'Food',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Bento%20Box.png',
    tileId: 'food',
    type: 'debit',
  },
  {
    id: 'def_petrol_500',
    label: 'Petrol Full',
    amount: '500',
    category: 'Transport',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fuel%20Pump.png',
    tileId: 'petrol',
    type: 'debit',
  },
  {
    id: 'def_auto_80',
    label: 'Auto / Cab',
    amount: '80',
    category: 'Transport',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Taxi.png',
    tileId: 'cab',
    type: 'debit',
  },
  {
    id: 'def_milk_60',
    label: 'Milk & Groceries',
    amount: '60',
    category: 'Groceries',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Glass%20of%20Milk.png',
    tileId: 'groceries',
    type: 'debit',
  },
  {
    id: 'def_recharge_299',
    label: 'Mobile Recharge',
    amount: '299',
    category: 'Bills',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Mobile%20Phone.png',
    tileId: 'recharge',
    type: 'debit',
  },
];

export const DEFAULT_QUICK_COMBOS_INCOME: QuickPresetItem[] = [
  {
    id: 'def_cashback_50',
    label: 'Cashback',
    amount: '50',
    category: 'Cashback',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Wrapped%20Gift.png',
    tileId: 'cashback',
    type: 'credit',
  },
  {
    id: 'def_freelance_5000',
    label: 'Client Payment',
    amount: '5000',
    category: 'Freelance',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png',
    tileId: 'freelance',
    type: 'credit',
  },
  {
    id: 'def_business_1000',
    label: 'Business Sale',
    amount: '1000',
    category: 'Business',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Chart%20Increasing.png',
    tileId: 'business',
    type: 'credit',
  },
  {
    id: 'def_dividends_250',
    label: 'Dividends',
    amount: '250',
    category: 'Investments',
    iconUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Coin.png',
    tileId: 'investments',
    type: 'credit',
  },
];

const STORAGE_CUSTOM_KEY = '@rupeo_custom_quick_presets_v1';
const STORAGE_HIDDEN_KEY = '@rupeo_hidden_presets_v1';

export async function fetchCustomPresets(): Promise<QuickPresetItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_CUSTOM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export async function saveCustomPresetItem(preset: QuickPresetItem): Promise<QuickPresetItem[]> {
  const current = await fetchCustomPresets();
  const updated = [preset, ...current];
  await AsyncStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeCustomPresetItem(targetId: string, label?: string, amount?: string): Promise<QuickPresetItem[]> {
  const current = await fetchCustomPresets();
  const updated = current.filter(
    (p) => p.id !== targetId && !(label && amount && p.label === label && p.amount === amount)
  );
  await AsyncStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(updated));
  return updated;
}

export async function fetchHiddenPresetIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_HIDDEN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export async function toggleHidePresetId(id: string): Promise<string[]> {
  const current = await fetchHiddenPresetIds();
  let updated: string[];
  if (current.includes(id)) {
    updated = current.filter((x) => x !== id);
  } else {
    updated = [...current, id];
  }
  await AsyncStorage.setItem(STORAGE_HIDDEN_KEY, JSON.stringify(updated));
  return updated;
}
