import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { isBragWorthy, scoreCatch } from '../lib/points';
import { REGIONS } from '../lib/regions';
import { SPECIES_BY_ID, lengthFromWeight, weightFromLength } from '../lib/species';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Catch, CatchLocation, Conditions, RarityTier, Settings } from '../lib/types';
import { formatCoords } from '../lib/util';
import { ConditionsStrip, PointsTable } from './CatchBits';
import { ChevronRight, Lock, MapPin, Send } from './icons';
import { LocationEditor, SpeciesPicker } from './Pickers';
import { Card, RarityBadge, SectionTitle, Toggle } from './ui';

export interface CatchFormValue {
  speciesId: string;
  speciesName: string;
  customTrophyLb?: number;
  customRarity?: RarityTier;
  lengthIn: number;
  weightLb: number;
  location: CatchLocation | null;
  secretSpot: boolean;
  released: boolean;
  caption: string;
  notifiedFriends: boolean;
}

const toDisplayLength = (inches: number, u: Settings['units']) => (u === 'metric' ? inches * 2.54 : inches);
const toDisplayWeight = (lb: number, u: Settings['units']) => (u === 'metric' ? lb * 0.4536 : lb);
const fromDisplayLength = (v: number, u: Settings['units']) => (u === 'metric' ? v / 2.54 : v);
const fromDisplayWeight = (v: number, u: Settings['units']) => (u === 'metric' ? v / 0.4536 : v);
const fmt = (n: number, digits: number) => (n ? String(Math.round(n * 10 ** digits) / 10 ** digits) : '');

export function CatchForm({
  value,
  onChange,
  conditions,
  excludeCatch,
  showNotify = true,
}: {
  value: CatchFormValue;
  onChange: (v: CatchFormValue) => void;
  conditions?: Conditions | null;
  excludeCatch?: Catch;
  showNotify?: boolean;
}) {
  const t = useTheme();
  const { state } = useStore();
  const units = state.settings.units;
  const [speciesOpen, setSpeciesOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [lenText, setLenText] = useState(fmt(toDisplayLength(value.lengthIn, units), 1));
  const [wtText, setWtText] = useState(fmt(toDisplayWeight(value.weightLb, units), 2));

  // Keep the text boxes in sync when the value changes from outside (AI result, species switch),
  // but leave them alone while they already say the same number (e.g. "18." mid-typing).
  const [synced, setSynced] = useState({ lengthIn: value.lengthIn, weightLb: value.weightLb, units });
  if (synced.lengthIn !== value.lengthIn || synced.weightLb !== value.weightLb || synced.units !== units) {
    setSynced({ lengthIn: value.lengthIn, weightLb: value.weightLb, units });
    if (synced.units !== units || Math.abs(fromDisplayLength(parseFloat(lenText) || 0, units) - value.lengthIn) >= 0.01) {
      setLenText(fmt(toDisplayLength(value.lengthIn, units), 1));
    }
    if (synced.units !== units || Math.abs(fromDisplayWeight(parseFloat(wtText) || 0, units) - value.weightLb) >= 0.005) {
      setWtText(fmt(toDisplayWeight(value.weightLb, units), 2));
    }
  }

  const set = (patch: Partial<CatchFormValue>) => onChange({ ...value, ...patch });

  const points = useMemo(() => {
    const regionId = value.location?.regionId ?? 'intl';
    const history = excludeCatch ? state.catches.filter((c) => c.createdAt < excludeCatch.createdAt) : state.catches;
    return scoreCatch(
      {
        speciesId: value.speciesId,
        weightLb: value.weightLb,
        regionId,
        released: value.released,
        customTrophyLb: value.customTrophyLb,
        customRarity: value.customRarity,
      },
      history,
      state.meId ?? '',
      excludeCatch?.id,
    );
  }, [value, state.catches, state.meId, excludeCatch]);

  const brag = isBragWorthy(points);
  const species = SPECIES_BY_ID[value.speciesId];

  return (
    <View style={{ gap: 16 }}>
      <Pressable onPress={() => setSpeciesOpen(true)} style={[styles.row, { borderColor: t.border }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.label, { color: t.textMuted }]}>Species</Text>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{value.speciesName || 'Choose species'}</Text>
          {species && <Text style={{ color: t.textMuted, fontSize: 12, fontStyle: 'italic' }}>{species.scientific}</Text>}
        </View>
        <RarityBadge tier={points.rarity} />
        <ChevronRight size={20} color={t.textMuted} />
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[styles.label, { color: t.textMuted }]}>Length ({units === 'metric' ? 'cm' : 'in'})</Text>
          <TextInput
            value={lenText}
            onChangeText={(txt) => {
              setLenText(txt);
              const n = parseFloat(txt);
              if (!Number.isNaN(n)) set({ lengthIn: fromDisplayLength(n, units) });
            }}
            keyboardType="decimal-pad"
            style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surface }]}
            placeholder="0"
            placeholderTextColor={t.textMuted}
          />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[styles.label, { color: t.textMuted }]}>Weight ({units === 'metric' ? 'kg' : 'lb'})</Text>
          <TextInput
            value={wtText}
            onChangeText={(txt) => {
              setWtText(txt);
              const n = parseFloat(txt);
              if (!Number.isNaN(n)) set({ weightLb: fromDisplayWeight(n, units) });
            }}
            keyboardType="decimal-pad"
            style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surface }]}
            placeholder="0"
            placeholderTextColor={t.textMuted}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: -6 }}>
        <Pressable onPress={() => value.lengthIn && set({ weightLb: weightFromLength(value.speciesId, value.lengthIn) })}>
          <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600' }}>Estimate weight from length</Text>
        </Pressable>
        <Pressable onPress={() => value.weightLb && set({ lengthIn: lengthFromWeight(value.speciesId, value.weightLb) })}>
          <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600' }}>Length from weight</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => setLocOpen(true)} style={[styles.row, { borderColor: t.border }]}>
        <MapPin size={20} color={t.text} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{value.location?.name ?? 'Add location'}</Text>
          <Text style={{ color: t.textMuted, fontSize: 12 }}>
            {value.location
              ? [
                  REGIONS[value.location.regionId].name,
                  formatCoords(value.location.lat, value.location.lon),
                  value.location.source === 'photo' ? 'from photo' : value.location.source === 'manual' ? 'set by you' : value.location.source === 'demo' ? 'demo' : 'GPS',
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Needed to score rarity for your area'}
          </Text>
        </View>
        <ChevronRight size={20} color={t.textMuted} />
      </Pressable>

      <View>
        <Toggle
          value={value.secretSpot}
          onChange={(v) => set({ secretSpot: v })}
          label="Secret Spot"
          description="Friends see only the region, never the exact spot."
          icon={<Lock size={20} color={t.text} />}
        />
        <Toggle
          value={value.released}
          onChange={(v) => set({ released: v })}
          label="Catch & Release"
          description="Released it? Earn +10% points."
          icon={<Text style={{ fontSize: 18 }}>♻️</Text>}
        />
        {showNotify && (
          <Toggle
            value={value.notifiedFriends}
            onChange={(v) => set({ notifiedFriends: v })}
            label={brag ? 'Brag to friends 🔥' : 'Notify friends'}
            description={
              brag
                ? `This one's brag-worthy! Push it to all ${state.friends.length} friends.`
                : `Send a notification to your ${state.friends.length} friends.`
            }
            icon={<Send size={20} color={t.text} />}
          />
        )}
      </View>

      <TextInput
        value={value.caption}
        onChangeText={(caption) => set({ caption })}
        placeholder="Write a caption… (bait, technique, the fight)"
        placeholderTextColor={t.textMuted}
        multiline
        style={[styles.input, styles.caption, { color: t.text, borderColor: t.border, backgroundColor: t.surface }]}
      />

      {conditions && (
        <Card>
          <SectionTitle>Conditions (auto-logged)</SectionTitle>
          <ConditionsStrip c={conditions} />
        </Card>
      )}

      <Card>
        <SectionTitle>Points</SectionTitle>
        <PointsTable p={points} speciesName={value.speciesName} />
      </Card>

      <SpeciesPicker
        visible={speciesOpen}
        regionId={value.location?.regionId ?? 'intl'}
        onClose={() => setSpeciesOpen(false)}
        onPick={({ id, name }) => {
          setSpeciesOpen(false);
          set({
            speciesId: id,
            speciesName: name,
            customTrophyLb: id === 'other' ? value.customTrophyLb : undefined,
            customRarity: id === 'other' ? value.customRarity ?? 'uncommon' : undefined,
          });
        }}
      />
      <LocationEditor
        visible={locOpen}
        value={value.location}
        onClose={() => setLocOpen(false)}
        onSave={(location) => {
          setLocOpen(false);
          set({ location });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14 },
  label: { fontSize: 12, fontWeight: '600' },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 17, fontWeight: '600' },
  caption: { minHeight: 80, fontSize: 15, fontWeight: '400', textAlignVertical: 'top' },
});
