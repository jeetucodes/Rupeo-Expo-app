import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const theme = useColorScheme();
  return Colors[theme === 'dark' ? 'dark' : 'light'];
}
