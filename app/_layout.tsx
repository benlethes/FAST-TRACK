import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { PermanentMarker_400Regular } from '@expo-google-fonts/permanent-marker';
import { FastingProvider } from '@/context/FastingContext';
import { WeightProvider } from '@/context/WeightContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { useAuth } from '@/hooks/useAuth';
import AuthScreen from './auth';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const [fontsLoaded] = useFonts({ PermanentMarker_400Regular });

  return (
    <SettingsProvider>
      <FastingProvider>
        <WeightProvider>
          <StatusBar style="dark" />
          {loading || !fontsLoaded ? (
            <View style={{ flex: 1, backgroundColor: '#F2EFE8' }} />
          ) : !session ? (
            <AuthScreen />
          ) : (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
          )}
        </WeightProvider>
      </FastingProvider>
    </SettingsProvider>
  );
}
