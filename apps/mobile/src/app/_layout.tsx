import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors, fonts } from '@/theme';

// Keep the native splash up until fonts are ready (progress/settings hydrate synchronously from MMKV).
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fonts.regular]: require('../../assets/fonts/Fredoka_400Regular.ttf') as number,
    [fonts.medium]: require('../../assets/fonts/Fredoka_500Medium.ttf') as number,
    [fonts.semibold]: require('../../assets/fonts/Fredoka_600SemiBold.ttf') as number,
    [fonts.bold]: require('../../assets/fonts/Fredoka_700Bold.ttf') as number,
  });
  const ready = loaded || error !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background } });
