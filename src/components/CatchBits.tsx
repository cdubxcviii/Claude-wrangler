import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moonEmoji } from '../lib/conditions';
import { REGIONS } from '../lib/regions';
import { RARITY } from '../lib/points';
import { useTheme } from '../lib/theme';
import type { Catch, Conditions, PointsBreakdown } from '../lib/types';
import { formatPoints } from '../lib/util';
import { FishArt } from './FishArt';
import { Gauge, Thermometer, Wind } from './icons';

export function CatchMedia({ c, rounded = 0 }: { c: Pick<Catch, 'photo' | 'speciesId' | 'id'>; rounded?: number }) {
  if (c.photo) {
    return <Image source={{ uri: c.photo }} style={[StyleSheet.absoluteFill, { borderRadius: rounded }]} contentFit="cover" />;
  }
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: rounded, overflow: 'hidden' }]}>
      <FishArt speciesId={c.speciesId} seed={c.id} />
    </View>
  );
}

/** The location line, honoring Secret Spot: friends only see the region. */
export function locationLabel(c: Catch, viewerId: string | null): { text: string; hidden: boolean } {
  if (c.secretSpot && c.userId !== viewerId) {
    return { text: `Secret spot · ${REGIONS[c.location.regionId].name}`, hidden: true };
  }
  return { text: c.location.name, hidden: c.secretSpot };
}

export function PointsPill({ total }: { total: number }) {
  const t = useTheme();
  return (
    <View style={[styles.pointsPill, { backgroundColor: t.elevated }]}>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 12 }}>+{formatPoints(total)} pts</Text>
    </View>
  );
}

export function PointsTable({ p, speciesName }: { p: PointsBreakdown; speciesName: string }) {
  const t = useTheme();
  const rows: [string, string][] = [
    ['Size', `${p.size}`],
    [`${RARITY[p.rarity].label} here`, `× ${p.multiplier}`],
  ];
  if (p.firstOfSpecies) rows.push([`First ${speciesName}!`, `+${p.firstOfSpecies}`]);
  if (p.personalBest) rows.push(['New personal best', `+${p.personalBest}`]);
  if (p.releaseBonus) rows.push(['Catch & release (+10%)', `+${p.releaseBonus}`]);
  return (
    <View style={{ gap: 6 }}>
      {rows.map(([k, v]) => (
        <View key={k} style={styles.row}>
          <Text style={{ color: t.textMuted, fontSize: 14 }}>{k}</Text>
          <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>{v}</Text>
        </View>
      ))}
      <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, paddingTop: 8, marginTop: 2 }]}>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '800' }}>Total</Text>
        <Text style={{ color: t.text, fontSize: 18, fontWeight: '900' }}>{formatPoints(p.total)} pts</Text>
      </View>
    </View>
  );
}

export function ConditionsStrip({ c, compact }: { c: Conditions; compact?: boolean }) {
  const t = useTheme();
  const trend = c.pressureTrend === 'rising' ? '↑' : c.pressureTrend === 'falling' ? '↓' : '→';
  const items: [React.ReactNode, string][] = [
    [<Thermometer key="t" size={14} color={t.textMuted} />, `${c.tempF}°F ${c.sky.toLowerCase()}`],
    [<Gauge key="g" size={14} color={t.textMuted} />, `${c.pressureInHg.toFixed(2)} inHg ${trend}`],
    [<Wind key="w" size={14} color={t.textMuted} />, `${c.windMph} mph`],
    [<Text key="m" style={{ fontSize: 13 }}>{moonEmoji(c.moonPhase)}</Text>, compact ? '' : c.moonPhase],
  ];
  return (
    <View style={styles.strip}>
      {items.map(([icon, label], i) => (
        <View key={i} style={styles.stripItem}>
          {icon}
          {label ? <Text style={{ color: t.textMuted, fontSize: 12 }}>{label}</Text> : null}
        </View>
      ))}
      {c.source === 'simulated' && !compact && <Text style={{ color: t.textMuted, fontSize: 11, fontStyle: 'italic' }}>weather simulated</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pointsPill: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strip: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4 },
  stripItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
