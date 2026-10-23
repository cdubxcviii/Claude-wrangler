import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEMO_LOCATION, locateMe, searchPlaces } from '../lib/location';
import { REGIONS, REGION_IDS } from '../lib/regions';
import { RARITY } from '../lib/points';
import { SPECIES, rarityFor } from '../lib/species';
import { useTheme } from '../lib/theme';
import type { CatchLocation, RegionId } from '../lib/types';
import { formatCoords } from '../lib/util';
import { FishArt } from './FishArt';
import { LocateFixed, MapPin, Search, X } from './icons';
import { Button, Chip, Field } from './ui';

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const t = useTheme();
  return (
    <View style={[styles.sheetHeader, { borderBottomColor: t.hairline }]}>
      <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{title}</Text>
      <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
        <X size={24} color={t.text} />
      </Pressable>
    </View>
  );
}

export function SpeciesPicker({
  visible,
  regionId,
  onClose,
  onPick,
}: {
  visible: boolean;
  regionId: RegionId;
  onClose: () => void;
  onPick: (s: { id: string; name: string }) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SPECIES.filter((s) => !needle || s.name.toLowerCase().includes(needle) || s.scientific.toLowerCase().includes(needle));
  }, [q]);
  const custom = q.trim() && !list.some((s) => s.name.toLowerCase() === q.trim().toLowerCase());

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: t.bg, paddingBottom: insets.bottom }}>
        <SheetHeader title="Choose species" onClose={onClose} />
        <View style={[styles.search, { backgroundColor: t.elevated }]}>
          <Search size={16} color={t.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search species"
            placeholderTextColor={t.textMuted}
            style={{ flex: 1, color: t.text, fontSize: 15, paddingVertical: 8 }}
            autoCorrect={false}
          />
        </View>
        <FlatList
          data={list}
          keyExtractor={(s) => s.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            custom ? (
              <Pressable style={styles.speciesRow} onPress={() => onPick({ id: 'other', name: q.trim() })}>
                <View style={[styles.thumb, { backgroundColor: t.elevated }]} />
                <Text style={{ color: t.accent, fontWeight: '600', fontSize: 15 }}>Use “{q.trim()}”</Text>
              </Pressable>
            ) : undefined
          }
          renderItem={({ item }) => {
            const tier = rarityFor(item.id, regionId);
            return (
              <Pressable style={styles.speciesRow} onPress={() => onPick({ id: item.id, name: item.name })}>
                <View style={[styles.thumb, { overflow: 'hidden' }]}>
                  <FishArt speciesId={item.id} seed="thumb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 12, fontStyle: 'italic' }}>{item.scientific}</Text>
                </View>
                <Text style={{ color: RARITY[tier].color, fontWeight: '700', fontSize: 12 }}>{RARITY[tier].label}</Text>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

interface LocationEditorProps {
  visible: boolean;
  value: CatchLocation | null;
  onClose: () => void;
  onSave: (loc: CatchLocation) => void;
}

export function LocationEditor(props: LocationEditorProps) {
  return (
    <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose} presentationStyle="pageSheet">
      {/* Mounted only while open so each opening starts from the current value. */}
      {props.visible && <LocationEditorBody {...props} />}
    </Modal>
  );
}

function LocationEditorBody({ value, onClose, onSave }: LocationEditorProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(value?.name ?? '');
  const [regionId, setRegionId] = useState<RegionId>(value?.regionId ?? 'intl');
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({ lat: value?.lat, lon: value?.lon });
  const [source, setSource] = useState<CatchLocation['source']>(value?.source ?? 'manual');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatchLocation[] | null>(null);
  const [busy, setBusy] = useState<'gps' | 'search' | null>(null);
  const [msg, setMsg] = useState('');

  const apply = (loc: CatchLocation) => {
    setName(loc.name);
    setRegionId(loc.regionId);
    setCoords({ lat: loc.lat, lon: loc.lon });
    setSource(loc.source);
    setResults(null);
  };

  const useGps = async () => {
    setBusy('gps');
    setMsg('');
    const r = await locateMe();
    setBusy(null);
    if (r.ok) apply(r.location);
    else setMsg(r.reason === 'denied' ? 'Location permission was denied. Enter the spot by hand below.' : "Couldn't get a GPS fix here. Enter the spot by hand below.");
  };

  const search = async () => {
    if (!query.trim()) return;
    setBusy('search');
    const found = await searchPlaces(query.trim());
    setBusy(null);
    setResults(found);
    if (!found.length) setMsg('Search is unavailable or found nothing. Type the name and pick a region instead.');
  };

  return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <SheetHeader title="Where did you catch it?" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              title="Use my location"
              variant="secondary"
              icon={<LocateFixed size={18} color={t.text} />}
              onPress={useGps}
              loading={busy === 'gps'}
              style={{ flex: 1 }}
            />
            <Button title="Demo spot" variant="secondary" onPress={() => apply(DEMO_LOCATION)} />
          </View>
          {!!msg && <Text style={{ color: t.textMuted, fontSize: 13 }}>{msg}</Text>}

          <View style={[styles.search, { backgroundColor: t.elevated, marginHorizontal: 0 }]}>
            <Search size={16} color={t.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              placeholder="Search a lake, river or town"
              placeholderTextColor={t.textMuted}
              style={{ flex: 1, color: t.text, fontSize: 15, paddingVertical: 8 }}
              returnKeyType="search"
            />
            {busy === 'search' ? <ActivityIndicator size="small" /> : null}
          </View>
          {results?.map((r) => (
            <Pressable key={`${r.lat},${r.lon}`} onPress={() => apply(r)} style={styles.result}>
              <MapPin size={16} color={t.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 15 }}>{r.name}</Text>
                <Text style={{ color: t.textMuted, fontSize: 12 }}>{REGIONS[r.regionId].name}</Text>
              </View>
            </Pressable>
          ))}

          <Field
            label="Spot name"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setSource('manual');
            }} placeholder="e.g. North cove, Lake Fork" />
          {coords.lat != null && (
            <Text style={{ color: t.textMuted, fontSize: 12 }}>GPS: {formatCoords(coords.lat, coords.lon)}</Text>
          )}
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600' }}>Region (sets how rare each species is)</Text>
            <View style={styles.chips}>
              {REGION_IDS.map((id) => (
                <Chip key={id} label={REGIONS[id].name} active={id === regionId} onPress={() => {
                    setRegionId(id);
                    setSource('manual');
                  }}
                />
              ))}
            </View>
          </View>
          <Button
            title="Save location"
            disabled={!name.trim()}
            onPress={() => onSave({ name: name.trim(), regionId, lat: coords.lat, lon: coords.lon, source })}
          />
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 12, margin: 12 },
  speciesRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 9 },
  thumb: { width: 54, height: 40, borderRadius: 8 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
