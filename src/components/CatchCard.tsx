import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Catch } from '../lib/types';
import { formatLength, formatWeight, timeAgo } from '../lib/util';
import { REACTION_EMOJI } from '../lib/seed';
import { CatchMedia, ConditionsStrip, PointsPill, locationLabel } from './CatchBits';
import { Lock, MapPin, MessageCircle, Pencil, Send, Sparkles } from './icons';
import { Avatar, RarityBadge } from './ui';

export function CatchCard({ c }: { c: Catch }) {
  const t = useTheme();
  const { state, toggleReaction } = useStore();
  const author = state.users[c.userId];
  const meId = state.meId;
  const loc = locationLabel(c, meId);
  const units = state.settings.units;
  const lastTap = useRef(0);
  const [burst] = useState(() => new Animated.Value(0));
  const [mountedAt] = useState(Date.now);

  const totalReactions = Object.values(c.reactions).reduce((n, l) => n + l.length, 0);
  const mineReacted = (e: string) => !!meId && (c.reactions[e] ?? []).includes(meId);

  const onMediaPress = (e: GestureResponderEvent) => {
    const now = e.timeStamp;
    if (now - lastTap.current < 300) {
      if (!mineReacted('🔥')) toggleReaction(c.id, '🔥');
      burst.setValue(0);
      Animated.sequence([
        Animated.spring(burst, { toValue: 1, useNativeDriver: true, friction: 4 }),
        Animated.timing(burst, { toValue: 0, duration: 250, delay: 300, useNativeDriver: true }),
      ]).start();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const openDetail = () => router.push(`/catch/${c.id}`);
  const reactorName = (() => {
    for (const e of REACTION_EMOJI) {
      const other = (c.reactions[e] ?? []).find((u) => u !== meId);
      if (other) return state.users[other]?.handle;
    }
    return undefined;
  })();

  return (
    <View style={{ backgroundColor: t.bg, marginBottom: 14 }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push(`/user/${c.userId}`)} style={styles.headerLeft}>
          <Avatar user={author} size={34} ring={mountedAt - c.createdAt < 86400000} />
          <View style={{ flexShrink: 1 }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
              {author?.handle ?? 'angler'}
            </Text>
            <View style={styles.locRow}>
              {loc.hidden ? <Lock size={11} color={t.textMuted} /> : <MapPin size={11} color={t.textMuted} />}
              <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={1}>
                {loc.text}
              </Text>
            </View>
          </View>
        </Pressable>
        <PointsPill total={c.points.total} />
      </View>

      <Pressable onPress={onMediaPress} onLongPress={openDetail}>
        <View style={{ width: '100%', aspectRatio: 1, backgroundColor: t.elevated }}>
          <CatchMedia c={c} />
          <View style={styles.mediaBottom}>
            <View style={styles.speciesTag}>
              <Text style={styles.speciesText}>{c.speciesName}</Text>
              <RarityBadge tier={c.points.rarity} small />
            </View>
          </View>
          {(c.ai || c.edited) && (
            <View style={styles.mediaTop}>
              <View style={styles.aiTag}>
                {c.edited ? <Pencil size={11} color="#FFF" /> : <Sparkles size={11} color="#FFF" />}
                <Text style={styles.aiText}>{c.edited ? 'Edited' : c.ai?.source === 'demo' ? 'Demo AI' : 'AI measured'}</Text>
              </View>
            </View>
          )}
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.burst,
              { opacity: burst, transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] }) }] },
            ]}
          >
            🔥
          </Animated.Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          {REACTION_EMOJI.map((e) => {
            const n = c.reactions[e]?.length ?? 0;
            const on = mineReacted(e);
            return (
              <Pressable
                key={e}
                onPress={() => toggleReaction(c.id, e)}
                style={[styles.reaction, { backgroundColor: on ? t.elevated : 'transparent', borderColor: on ? t.border : 'transparent' }]}
                accessibilityLabel={`React ${e}`}
              >
                <Text style={{ fontSize: 18, opacity: on || n ? 1 : 0.55 }}>{e}</Text>
                {n > 0 && <Text style={{ color: t.text, fontSize: 12, fontWeight: '600' }}>{n}</Text>}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.actionsLeft}>
          <Pressable onPress={openDetail} hitSlop={6} accessibilityLabel="Comments">
            <MessageCircle size={24} color={t.text} />
          </Pressable>
          <Pressable onPress={openDetail} hitSlop={6} accessibilityLabel="Details">
            <Send size={22} color={t.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {totalReactions > 0 && (
          <Text style={{ color: t.text, fontSize: 13 }}>
            {reactorName ? (
              <>
                Reacted by <Text style={{ fontWeight: '700' }}>{reactorName}</Text>
                {totalReactions > 1 ? ` and ${totalReactions - 1} other${totalReactions > 2 ? 's' : ''}` : ''}
              </>
            ) : (
              `${totalReactions} reaction${totalReactions > 1 ? 's' : ''}`
            )}
          </Text>
        )}
        <Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>
          {formatLength(c.lengthIn, units)} · {formatWeight(c.weightLb, units)}
          {c.released ? <Text style={{ color: t.success, fontWeight: '600' }}> · Released ♻️</Text> : null}
        </Text>
        {!!c.caption && (
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 19 }}>
            <Text style={{ fontWeight: '700' }}>{author?.handle} </Text>
            {c.caption}
          </Text>
        )}
        {c.conditions && <ConditionsStrip c={c.conditions} compact />}
        {c.comments.length > 0 && (
          <Pressable onPress={openDetail}>
            <Text style={{ color: t.textMuted, fontSize: 14 }}>
              {c.comments.length === 1 ? 'View 1 comment' : `View all ${c.comments.length} comments`}
            </Text>
          </Pressable>
        )}
        {c.comments.slice(-1).map((cm) => (
          <Text key={cm.id} style={{ color: t.text, fontSize: 14 }} numberOfLines={2}>
            <Text style={{ fontWeight: '700' }}>{state.users[cm.userId]?.handle} </Text>
            {cm.text}
          </Text>
        ))}
        <Text style={{ color: t.textMuted, fontSize: 11, letterSpacing: 0.3 }}>{timeAgo(c.createdAt).toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mediaBottom: { position: 'absolute', left: 10, bottom: 10, right: 10, flexDirection: 'row' },
  speciesTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
  },
  speciesText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  mediaTop: { position: 'absolute', top: 10, right: 10 },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  burst: { position: 'absolute', alignSelf: 'center', top: '35%', fontSize: 96 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 6 },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reaction: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 14, borderWidth: 1 },
  body: { paddingHorizontal: 12, gap: 5, paddingTop: 4 },
});
