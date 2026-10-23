import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChevronLeft } from '../components/icons';
import { useAppFonts } from '../lib/fonts';
import { StoreProvider, useStore } from '../lib/store';
import { useIsDark, useTheme } from '../lib/theme';

function Root() {
  const { ready } = useStore();
  const fontsReady = useAppFonts();
  const t = useTheme();
  const isDark = useIsDark();

  if (!ready || !fontsReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.textMuted} />
      </View>
    );
  }

  const navTheme = isDark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: t.bg, card: t.bg, border: t.hairline, text: t.text } }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerTintColor: t.text,
          headerBackVisible: false,
          // Our own back button: the stock one is an image file, which the single-file web build can't load.
          headerLeft: () => (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={10}
              accessibilityLabel="Back"
              style={{ marginLeft: -4, marginRight: 8 }}
            >
              <ChevronLeft size={28} color={t.text} />
            </Pressable>
          ),
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="catch/new" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="catch/[id]" options={{ title: 'Catch' }} />
        <Stack.Screen name="user/[id]" options={{ title: '' }} />
        <Stack.Screen name="species/[id]" options={{ title: 'Fishdex' }} />
        <Stack.Screen name="friends" options={{ title: 'Friends' }} />
        <Stack.Screen name="activity" options={{ title: 'Activity' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
