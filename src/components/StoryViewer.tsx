import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RARITY } from '../lib/points';
import { useStore } from '../lib/store';
import type { Catch } from '../lib/types';
import { formatLength, formatWeight, timeAgo } from '../lib/util';
import { CatchMedia, locationLabel } from './CatchBits';
import { X } from './icons';
import { Avatar, RarityBadge } from './ui';

const DURATION = 5000;

/** Instagram-style full-screen viewer for the last 24h of catches. */
export function StoryViewer({ groups, startIndex, onClose }: { groups: { userId: string; catches: Catch[] }[]; startIndex: number; onClose: () => void }) {
  const { state } = useStore();
  const insets = useSafeAreaInsets();
  const [g, setG] = useState(startIndex);
  const [i, setI] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));

  const group = groups[g];
  const c = group?.catches[i];

  const next = () => {
    if (!group) return onClose();
    if (i + 1 < group.catches.length) setI(i + 1);
    else if (g + 1 < groups.length) {
      setG(g + 1);
      setI(0);
    } else onClose();
  };
  const prev = () => {
    if (i > 0) setI(i - 1);
    else if (g > 0) {
      setG(g - 1);
      setI(0);
    }
  };

  useEffect(() => {
    if (!c) return;
    progress.setValue(0);
    const anim = Animated.timing(progress, { toValue: 1, duration: DURATION, easing: Easing.linear, useNativeDriver: false });
    anim.start(({ finished }) => finished && next());
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, i]);

  if (!c) return null;
  const user = state.users[c.userId];
  const units = state.settings.units;
  const loc = locationLabel(c, state.meId);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} transparent={false}>
      <View style={styles.root}>
        <CatchMedia c={c} />
        <View style={[styles.shade, { top: 0, height: 140 }]} />
        <View style={[styles.shade, { bottom: 0, height: 220 }]} />
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <View style={styles.bars}>
            {group.catches.map((x, j) => (
              <View key={x.id} style={styles.barTrack}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      width: j < i ? '100%' : j > i ? '0%' : progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.userRow}>
            <Avatar user={user} size={32} />
            <Text style={styles.handle}>{user?.handle}</Text>
            <Text style={styles.dim}>{timeAgo(c.createdAt)}</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <X size={28} color="#FFF" />
            </Pressable>
          </View>
        </View>
        <Pressable style={[styles.tapZone, { left: 0 }]} onPress={prev} />
        <Pressable style={[styles.tapZone, { right: 0 }]} onPress={next} />
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
          <RarityBadge tier={c.points.rarity} />
          <Text style={styles.species}>{c.speciesName}</Text>
          <Text style={styles.stats}>
            {formatLength(c.lengthIn, units)} · {formatWeight(c.weightLb, units)} · {loc.text}
          </Text>
          <Text style={[styles.points, { color: RARITY[c.points.rarity].color }]}>+{c.points.total} pts</Text>
          <Pressable
            onPress={() => {
              onClose();
              router.push(`/catch/${c.id}`);
            }}
            style={styles.reply}
          >
            <Text style={{ color: '#FFF', fontWeight: '600' }}>React or comment</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  shade: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 10, gap: 10, zIndex: 2 },
  bars: { flexDirection: 'row', gap: 4 },
  barTrack: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#FFF' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  handle: { color: '#FFF', fontWeight: '700' },
  dim: { color: 'rgba(255,255,255,0.75)' },
  tapZone: { position: 'absolute', top: 100, bottom: 160, width: '40%', zIndex: 1 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, gap: 6, zIndex: 2 },
  species: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  stats: { color: 'rgba(255,255,255,0.9)', fontSize: 15 },
  points: { fontSize: 22, fontWeight: '900' },
  reply: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
