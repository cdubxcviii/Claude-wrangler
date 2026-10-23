import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CatchMedia } from '../../components/CatchBits';
import { FishArt } from '../../components/FishArt';
import { Avatar, Card, Empty, RarityBadge, SectionTitle } from '../../components/ui';
import { RARITY } from '../../lib/points';
import { REGIONS, REGION_IDS } from '../../lib/regions';
import { circleIds } from '../../lib/selectors';
import { SPECIES_BY_ID, lengthFromWeight, rarityFor } from '../../lib/species';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { formatLength, formatWeight, timeAgo } from '../../lib/util';

export default function SpeciesPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useStore();
  const sp = SPECIES_BY_ID[id];
  const units = state.settings.units;

  const { mine, circleBest } = useMemo(() => {
    const ids = new Set(circleIds(state));
    const all = state.catches.filter((c) => c.speciesId === id && ids.has(c.userId));
    return {
      mine: all.filter((c) => c.userId === state.meId).sort((a, b) => b.weightLb - a.weightLb),
      circleBest: [...all].sort((a, b) => b.weightLb - a.weightLb).slice(0, 5),
    };
  }, [state, id]);

  if (!sp) return <Empty title="Unknown species" />;
  const homeRegion = mine[0]?.location.regionId;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen options={{ title: sp.name }} />
      <View style={styles.hero}>
        <FishArt speciesId={sp.id} seed="species" />
      </View>
      <View style={{ padding: 16, gap: 16 }}>
        <View>
          <Text style={{ color: t.text, fontSize: 26, fontWeight: '800' }}>{sp.name}</Text>
          <Text style={{ color: t.textMuted, fontStyle: 'italic' }}>
            {sp.scientific} · {sp.water === 'salt' ? 'Saltwater' : 'Freshwater'}
          </Text>
        </View>

        <View style={styles.facts}>
          <Card style={styles.fact}>
            <Text style={[styles.factLabel, { color: t.textMuted }]}>Trophy size</Text>
            <Text style={[styles.factValue, { color: t.text }]}>{formatWeight(sp.trophyLb, units)}</Text>
            <Text style={{ color: t.textMuted, fontSize: 12 }}>≈ {formatLength(lengthFromWeight(sp.id, sp.trophyLb), units)}</Text>
          </Card>
          <Card style={styles.fact}>
            <Text style={[styles.factLabel, { color: t.textMuted }]}>Your best</Text>
            <Text style={[styles.factValue, { color: t.text }]}>{mine[0] ? formatWeight(mine[0].weightLb, units) : '—'}</Text>
            <Text style={{ color: t.textMuted, fontSize: 12 }}>{mine.length} caught</Text>
          </Card>
        </View>

        <View>
          <SectionTitle>Rarity by region</SectionTitle>
          <View style={{ gap: 6 }}>
            {REGION_IDS.map((r) => {
              const tier = rarityFor(sp.id, r);
              return (
                <View key={r} style={styles.regionRow}>
                  <Text style={{ color: t.text, flex: 1, fontWeight: r === homeRegion ? '700' : '400' }}>
                    {REGIONS[r].name}
                    {r === homeRegion ? ' (your catches)' : ''}
                  </Text>
                  <RarityBadge tier={tier} small />
                  <Text style={{ color: t.textMuted, width: 34, textAlign: 'right', fontSize: 12 }}>×{RARITY[tier].multiplier}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {circleBest.length > 0 && (
          <View>
            <SectionTitle>Biggest among friends</SectionTitle>
            {circleBest.map((c, i) => (
              <Pressable key={c.id} onPress={() => router.push(`/catch/${c.id}`)} style={styles.bestRow}>
                <Text style={{ color: t.textMuted, width: 18, fontWeight: '700' }}>{i + 1}</Text>
                <View style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden' }}>
                  <CatchMedia c={c} />
                </View>
                <Avatar user={state.users[c.userId]} size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '600' }}>{state.users[c.userId]?.handle}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 12 }}>{timeAgo(c.createdAt)} ago</Text>
                </View>
                <Text style={{ color: t.text, fontWeight: '800' }}>{formatWeight(c.weightLb, units)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', aspectRatio: 1.6 },
  facts: { flexDirection: 'row', gap: 12 },
  fact: { flex: 1, gap: 2 },
  factLabel: { fontSize: 12, fontWeight: '600' },
  factValue: { fontSize: 20, fontWeight: '800' },
  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
});
