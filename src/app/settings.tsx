import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RotateCcw, Sparkles } from '../components/icons';
import { Avatar, Button, Card, Field, Segmented, SectionTitle } from '../components/ui';
import { aiMode } from '../lib/ai';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { AiSource } from '../lib/types';

const COLORS = ['#E1306C', '#F77737', '#FCAF45', '#27AE60', '#2F80ED', '#5851DB', '#9B51E0', '#333333'];

const AI_COPY: Record<AiSource, string> = {
  claude: 'Claude (through this page, using your Claude account). Photos are sent to Claude only when you log a catch.',
  server: 'Wrangler AI server (Claude via the Anthropic API).',
  demo: 'Demo mode: results are made up. Open Wrangler from its Claude link, or run the AI server, for real estimates.',
};

export default function SettingsScreen() {
  const t = useTheme();
  const { me, state, updateProfile, setUnits, resetAll } = useStore();
  const [name, setName] = useState(me?.name ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  const [homeWater, setHomeWater] = useState(me?.homeWater ?? '');
  const [mode, setMode] = useState<AiSource | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    aiMode().then(setMode);
  }, []);

  if (!me) return null;

  const save = () => {
    updateProfile({ name: name.trim() || me.name, bio: bio.trim() || undefined, homeWater: homeWater.trim() || undefined });
    router.back();
  };

  const reset = () => {
    setConfirmReset(false);
    resetAll();
    router.replace('/onboarding');
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 60 }}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Avatar user={me} size={84} />
        <View style={styles.colors}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => updateProfile({ avatarColor: c })}
              style={[styles.swatch, { backgroundColor: c, borderColor: me.avatarColor === c ? t.text : 'transparent' }]}
              accessibilityLabel={`Avatar color ${c}`}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 14 }}>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Bio" value={bio} onChangeText={setBio} placeholder="Bass junkie. Lake Fork or bust." />
        <Field label="Home water" value={homeWater} onChangeText={setHomeWater} placeholder="Lake Travis, TX" />
        <Text style={{ color: t.textMuted, fontSize: 12 }}>Username: @{me.handle}</Text>
        <Button title="Save profile" onPress={save} />
      </View>

      <View>
        <SectionTitle>Units</SectionTitle>
        <Segmented
          value={state.settings.units}
          onChange={setUnits}
          options={[
            { value: 'imperial', label: 'Inches & pounds' },
            { value: 'metric', label: 'cm & kg' },
          ]}
        />
      </View>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Sparkles size={18} color={t.accent} />
          <Text style={{ color: t.text, fontWeight: '700' }}>Fish AI</Text>
        </View>
        <Text style={{ color: t.textMuted, lineHeight: 19 }}>{mode ? AI_COPY[mode] : 'Checking…'}</Text>
      </Card>

      <Card>
        <Text style={{ color: t.text, fontWeight: '700', marginBottom: 6 }}>About this preview</Text>
        <Text style={{ color: t.textMuted, lineHeight: 19 }}>
          This is the browser test version of Wrangler. Your friends, their catches, reactions and friend requests are simulated, and all data
          stays in this browser. The phone app will add real accounts, a shared friend feed and push notifications.
        </Text>
      </Card>

      <Button title="Reset all data" variant="danger" icon={<RotateCcw size={18} color="#FFF" />} onPress={() => setConfirmReset(true)} />
      <ConfirmDialog
        visible={confirmReset}
        title="Reset Wrangler?"
        body="This deletes your profile and every catch you logged, and brings back the demo friends."
        confirmLabel="Reset everything"
        onConfirm={reset}
        onCancel={() => setConfirmReset(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  colors: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 3 },
});
