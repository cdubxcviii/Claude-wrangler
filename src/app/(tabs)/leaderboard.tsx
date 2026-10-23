import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CatchMedia } from '../../components/CatchBits';
import { Crown, Gamepad, Info, Swords, UserPlus } from '../../components/icons';
import { Avatar, Button, Card, RarityBadge, Segmented, SectionTitle } from '../../components/ui';
import { FIRST_OF_SPECIES_BONUS, PERSONAL_BEST_BONUS, RARITY, RARITY_ORDER } from '../../lib/points';
import { leaderboard, type Period } from '../../lib/selectors';
import { useStore } from '../../lib/store';
import { BRAND_GRADIENT, useTheme } from '../../lib/theme';
import { formatPoints, formatWeight } from '../../lib/util';

const MEDALS = ['#E8B923', '#A8B0B8', '#C98A4B'];

export default function Leaderboard() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const [period, setPeriod] = useState<Period>('week');
  const [howOpen, setHowOpen] = useState(false);
  const rows = useMemo(() => leaderboard(state, period), [state, period]);
  const podium = rows.slice(0, 3);
  const best = rows.map((r) => r.best).filter(Boolean).sort((a, b) => b!.points.total - a!.points.total)[0];
  const myRank = rows.findIndex((r) => r.userId === state.meId) + 1;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 40, gap: 16 }}>
      <View style={styles.pad}>
        <Text style={[styles.h1, { color: t.text }]}>Leaderboard</Text>
        <Text style={{ color: t.textMuted, marginTop: 2 }}>
          You and your {state.friends.length} friends{myRank ? ` · you're #${myRank}` : ''}
        </Text>
      </View>
      <View style={styles.pad}>
        <Segmented
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: 'This week' },
            { value: 'month', label: '30 days' },
            { value: 'all', label: 'All time' },
          ]}
        />
      </View>

      <View style={[styles.podium, styles.pad]}>
        {[1, 0, 2].map((i) => {
          const r = podium[i];
          if (!r) return <View key={i} style={{ flex: 1 }} />;
          const u = state.users[r.userId];
          const first = i === 0;
          return (
            <Pressable key={r.userId} style={styles.podiumCol} onPress={() => router.push(`/user/${r.userId}`)}>
              {first && <Crown size={26} color={MEDALS[0]} fill={MEDALS[0]} />}
              <Avatar user={u} size={first ? 76 : 60} ring />
              <Text style={{ color: t.text, fontWeight: '700' }} numberOfLines={1}>
                {r.userId === state.meId ? 'You' : u?.handle}
              </Text>
              <Text style={{ color: MEDALS[i], fontWeight: '900', fontSize: first ? 20 : 16 }}>{formatPoints(r.points)}</Text>
              <View style={[styles.step, { height: [64, 44, 30][i], backgroundColor: MEDALS[i] }]}>
                <Text style={styles.stepText}>{i + 1}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.pad, { gap: 2 }]}>
        {rows.map((r, idx) => {
          const u = state.users[r.userId];
          const me = r.userId === state.meId;
          return (
            <Pressable
              key={r.userId}
              onPress={() => router.push(`/user/${r.userId}`)}
              style={[styles.row, { backgroundColor: me ? t.elevated : 'transparent' }]}
            >
              <Text style={[styles.rank, { color: idx < 3 ? MEDALS[idx] : t.textMuted }]}>{idx + 1}</Text>
              <Avatar user={u} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '700' }}>{me ? `${u?.handle} (you)` : u?.handle}</Text>
                <Text style={{ color: t.textMuted, fontSize: 12 }}>
                  {r.catches} catch{r.catches === 1 ? '' : 'es'}
                  {r.best ? ` · best ${r.best.speciesName}` : ''}
                </Text>
              </View>
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{formatPoints(r.points)}</Text>
            </Pressable>
          );
        })}
        <Button
          title="Invite friends to compete"
          variant="secondary"
          icon={<UserPlus size={18} color={t.text} />}
          onPress={() => router.push('/friends')}
          style={{ marginTop: 10 }}
        />
      </View>

      {best && (
        <View style={styles.pad}>
          <SectionTitle>Catch of the {period === 'week' ? 'week' : period === 'month' ? 'month' : 'year'}</SectionTitle>
          <Pressable onPress={() => router.push(`/catch/${best.id}`)} style={styles.cotw}>
            <CatchMedia c={best} rounded={16} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.cotwShade} />
            <View style={styles.cotwText}>
              <RarityBadge tier={best.points.rarity} />
              <Text style={styles.cotwTitle}>
                {best.speciesName} · {formatWeight(best.weightLb, state.settings.units)}
              </Text>
              <Text style={styles.cotwSub}>
                by {state.users[best.userId]?.handle} · {best.points.total} pts
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      <View style={[styles.pad, { gap: 12 }]}>
        <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promo}>
          <Swords size={28} color="#FFF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Tournaments · coming soon</Text>
            <Text style={styles.promoBody}>Weekend brackets, species-only events, and ranked seasons you can climb.</Text>
          </View>
        </LinearGradient>
        <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Gamepad size={28} color={t.text} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '700' }}>Mini-games · coming soon</Text>
            <Text style={{ color: t.textMuted, fontSize: 13 }}>Spend your Wrangler points on games with friends.</Text>
          </View>
        </Card>
      </View>

      <View style={styles.pad}>
        <Pressable onPress={() => setHowOpen((v) => !v)} style={styles.how}>
          <Info size={16} color={t.textMuted} />
          <Text style={{ color: t.textMuted, fontWeight: '600' }}>How points work {howOpen ? '▲' : '▼'}</Text>
        </Pressable>
        {howOpen && (
          <Card style={{ gap: 8, marginTop: 8 }}>
            <Text style={{ color: t.text, lineHeight: 20 }}>
              <Text style={{ fontWeight: '700' }}>Size points</Text> = 200 × (weight ÷ the species’ trophy weight), from 10 up to 400. A trophy-size fish scores 200.
            </Text>
            <Text style={{ color: t.text, lineHeight: 20 }}>
              <Text style={{ fontWeight: '700' }}>Rarity</Text> multiplies that by how unusual the species is where you caught it:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {RARITY_ORDER.map((r) => (
                <View key={r} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <RarityBadge tier={r} small />
                  <Text style={{ color: t.textMuted, fontSize: 12 }}>×{RARITY[r].multiplier}</Text>
                </View>
              ))}
            </View>
            <Text style={{ color: t.text, lineHeight: 20 }}>
              <Text style={{ fontWeight: '700' }}>Bonuses</Text>: +{FIRST_OF_SPECIES_BONUS} for a new Fishdex species, +{PERSONAL_BEST_BONUS} for a personal best, and +10% for catch & release.
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  h1: { fontSize: 26, fontWeight: '800' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  podiumCol: { flex: 1, alignItems: 'center', gap: 4 },
  step: { width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  stepText: { color: '#FFF', fontWeight: '900', fontSize: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12 },
  rank: { width: 22, textAlign: 'center', fontWeight: '800', fontSize: 15 },
  cotw: { width: '100%', aspectRatio: 1.4, borderRadius: 16, overflow: 'hidden' },
  cotwShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  cotwText: { position: 'absolute', left: 14, right: 14, bottom: 14, gap: 4 },
  cotwTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  cotwSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  promo: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  promoTitle: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  promoBody: { color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 2 },
  how: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
