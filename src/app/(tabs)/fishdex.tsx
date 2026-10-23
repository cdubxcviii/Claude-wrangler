import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishArt } from '../../components/FishArt';
import { Segmented } from '../../components/ui';
import { badges, fishdex } from '../../lib/selectors';
import { SPECIES_BY_ID } from '../../lib/species';
import { useStore } from '../../lib/store';
import { BRAND_GRADIENT, useTheme } from '../../lib/theme';
import { formatWeight } from '../../lib/util';
import { LinearGradient } from 'expo-linear-gradient';

type Filter = 'all' | 'caught' | 'fresh' | 'salt';

export default function Fishdex() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { state } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const meId = state.meId ?? '';
  const dex = useMemo(() => fishdex(state, meId), [state, meId]);
  const myBadges = useMemo(() => badges(state, meId), [state, meId]);
  const pct = Math.round((dex.caught / dex.total) * 100);

  const list = dex.entries.filter((e) => {
    const sp = SPECIES_BY_ID[e.speciesId];
    if (filter === 'caught') return e.count > 0;
    if (filter === 'fresh') return sp.water === 'fresh';
    if (filter === 'salt') return sp.water === 'salt';
    return true;
  });
  const cols = width > 700 ? 5 : 3;
  const cardW = (Math.min(width, 900) - 32 - (cols - 1) * 10) / cols;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 40, gap: 16 }}>
      <View style={styles.pad}>
        <Text style={[styles.h1, { color: t.text }]}>Fishdex</Text>
        <Text style={{ color: t.textMuted, marginTop: 2 }}>
          {dex.caught} of {dex.total} species caught{dex.others.length ? ` (+${dex.others.length} other)` : ''}
        </Text>
        <View style={[styles.track, { backgroundColor: t.elevated }]}>
          <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${Math.max(pct, 2)}%` }]} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {myBadges.map((b) => (
          <View key={b.id} style={[styles.badge, { backgroundColor: t.surface, borderColor: t.hairline, opacity: b.earned ? 1 : 0.45 }]}>
            <Text style={{ fontSize: 28 }}>{b.earned ? b.emoji : '🔒'}</Text>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 12, textAlign: 'center' }}>{b.title}</Text>
            <Text style={{ color: t.textMuted, fontSize: 10, textAlign: 'center' }}>{b.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pad}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'caught', label: 'Caught' },
            { value: 'fresh', label: 'Fresh' },
            { value: 'salt', label: 'Salt' },
          ]}
        />
      </View>

      <View style={[styles.grid, styles.pad]}>
        {list.map((e) => {
          const caught = e.count > 0;
          const num = String(dex.entries.indexOf(e) + 1).padStart(3, '0');
          return (
            <Pressable
              key={e.speciesId}
              onPress={() => router.push(`/species/${e.speciesId}`)}
              style={[styles.card, { width: cardW, backgroundColor: t.surface, borderColor: caught ? t.border : t.hairline }]}
            >
              <View style={[styles.art, { backgroundColor: caught ? undefined : t.elevated }]}>
                {caught ? (
                  <FishArt speciesId={e.speciesId} seed="dex" />
                ) : (
                  <View style={{ flex: 1, opacity: 0.12 }}>
                    <FishArt speciesId={e.speciesId} seed="dex" background={false} />
                  </View>
                )}
              </View>
              <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: '700' }}>#{num}</Text>
              <Text style={{ color: caught ? t.text : t.textMuted, fontWeight: '700', fontSize: 12 }} numberOfLines={2}>
                {caught ? e.name : '???'}
              </Text>
              {caught && (
                <Text style={{ color: t.textMuted, fontSize: 11 }}>
                  ×{e.count} · PB {formatWeight(e.bestLb, state.settings.units)}
                </Text>
              )}
            </Pressable>
          );
        })}
        {filter !== 'fresh' && filter !== 'salt' &&
          dex.others.map((e) => (
            <Pressable
              key={`other-${e.name}`}
              onPress={() => e.bestCatch && router.push(`/catch/${e.bestCatch.id}`)}
              style={[styles.card, { width: cardW, backgroundColor: t.surface, borderColor: t.border }]}
            >
              <View style={styles.art}>
                <FishArt speciesId="other" seed={e.name} />
              </View>
              <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: '700' }}>OTHER</Text>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 12 }} numberOfLines={2}>
                {e.name}
              </Text>
              <Text style={{ color: t.textMuted, fontSize: 11 }}>×{e.count}</Text>
            </Pressable>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  h1: { fontSize: 26, fontWeight: '800' },
  track: { height: 8, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  badge: { width: 104, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 10, alignItems: 'center', gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 6, gap: 2 },
  art: { width: '100%', aspectRatio: 1.3, borderRadius: 8, overflow: 'hidden', marginBottom: 4 },
});
