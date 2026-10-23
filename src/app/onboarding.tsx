import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishArt } from '../components/FishArt';
import { Button, Field, Logo } from '../components/ui';
import { useStore } from '../lib/store';
import { BRAND_GRADIENT, useTheme } from '../lib/theme';

const FEATURES: [string, string, string][] = [
  ['📸', 'Snap your catch', 'AI identifies the species and estimates length and weight.'],
  ['🏆', 'Earn points', 'Bigger and rarer fish for your area score more. Climb the leaderboard.'],
  ['👥', 'Fish with friends', 'Follow your crew, react to their catches, and brag about the big ones.'],
];

export default function Onboarding() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { me, createProfile } = useStore();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [homeWater, setHomeWater] = useState('');

  if (me) return <Redirect href="/" />;

  const cleanHandle = handle.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').toLowerCase();
  const valid = name.trim().length >= 2 && cleanHandle.length >= 3;

  const start = () => {
    createProfile({ name: name.trim(), handle: cleanHandle, homeWater: homeWater.trim() || undefined });
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.heroRing}>
            <View style={[styles.heroInner, { backgroundColor: t.bg }]}>
              <FishArt speciesId="largemouth_bass" seed="hero" />
            </View>
          </LinearGradient>
          <Logo size={52} />
          <Text style={[styles.tag, { color: t.textMuted }]}>Catch it. Snap it. Brag about it.</Text>
        </View>

        <View style={{ gap: 14 }}>
          {FEATURES.map(([emoji, title, body]) => (
            <View key={title} style={styles.feature}>
              <Text style={{ fontSize: 26 }}>{emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{title}</Text>
                <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 18 }}>{body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: 14 }}>
          <Field label="Your name" value={name} onChangeText={setName} placeholder="Chris Walker" autoComplete="name" />
          <Field
            label="Username"
            value={handle}
            onChangeText={setHandle}
            placeholder="@reelchris"
            autoCapitalize="none"
            autoCorrect={false}
            hint={cleanHandle ? `You'll show up as @${cleanHandle}` : 'Letters, numbers, dots and underscores'}
          />
          <Field label="Home water (optional)" value={homeWater} onChangeText={setHomeWater} placeholder="Lake Travis, TX" />
          <Button title="Start wrangling" variant="gradient" onPress={start} disabled={!valid} />
          <Text style={{ color: t.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 17 }}>
            Browser preview: your friends and their catches are simulated, and everything is saved only in this browser.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 22, gap: 28, maxWidth: 520, width: '100%', alignSelf: 'center' },
  hero: { alignItems: 'center', gap: 6 },
  heroRing: { padding: 4, borderRadius: 80, marginBottom: 8 },
  heroInner: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', padding: 0 },
  tag: { fontSize: 15 },
  feature: { flexDirection: 'row', gap: 14, alignItems: 'center' },
});
