import { useAuth } from '@/context/AuthContext';
import OnboardingScreen from './onboarding';
import { Redirect } from 'expo-router';
import AppLoadingSkeleton from '@/components/app-loading-skeleton';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <AppLoadingSkeleton />;
  }
  
  if (user) {
    return <Redirect href="/(tabs)/dashboard" />;
  }
  
  return <OnboardingScreen />;
}
