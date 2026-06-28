import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { FastingProvider } from '@/context/FastingContext';
import { WeightProvider } from '@/context/WeightContext';
import { useAuth } from '@/hooks/useAuth';
import AuthScreen from './auth';

export default function RootLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    // Blank white screen while AsyncStorage resolves the persisted session
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  if (!session) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen />
      </>
    );
  }

  return (
    <FastingProvider>
      <WeightProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </WeightProvider>
    </FastingProvider>
  );
}
