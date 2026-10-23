import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CatchCard } from '../../components/CatchCard';
import { ConditionsStrip, PointsTable } from '../../components/CatchBits';
import { CatchForm, type CatchFormValue } from '../../components/CatchForm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pencil, Sparkles, Trash, X } from '../../components/icons';
import { Avatar, Button, Card, Empty, SectionTitle } from '../../components/ui';
import { RARITY } from '../../lib/points';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { formatLength, formatWeight, timeAgo } from '../../lib/util';

export default function CatchDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id, celebrate } = useLocalSearchParams<{ id: string; celebrate?: string }>();
  const { state, addComment, updateCatch, deleteCatch } = useStore();
  const c = state.catches.find((x) => x.id === id);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CatchFormValue | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(celebrate === '1');
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!showCelebrate) return;
    Animated.spring(pop, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 6 }).start();
    const timer = setTimeout(() => setShowCelebrate(false), 6000);
    return () => clearTimeout(timer);
  }, [showCelebrate, pop]);

  if (!c) {
    return <Empty title="Catch not found" body="It may have been deleted." action={<Button title="Go home" onPress={() => router.replace('/')} />} />;
  }

  const isMine = c.userId === state.meId;
  const units = state.settings.units;

  const startEdit = () => {
    setDraft({
      speciesId: c.speciesId,
      speciesName: c.speciesName,
      customTrophyLb: c.customTrophyLb,
      customRarity: c.customRarity,
      lengthIn: c.lengthIn,
      weightLb: c.weightLb,
      location: c.location,
      secretSpot: c.secretSpot,
      released: c.released,
      caption: c.caption,
      notifiedFriends: c.notifiedFriends,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    if (!draft?.location) return;
    updateCatch(c.id, { ...draft, location: draft.location });
    setEditing(false);
  };

  const remove = () => {
    setConfirmDelete(false);
    deleteCatch(c.id);
    router.replace('/');
  };

  const send = () => {
    if (!comment.trim()) return;
    addComment(c.id, comment);
    setComment('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen
        options={{
          title: c.speciesName,
          headerRight: isMine
            ? () => (
                <View style={{ flexDirection: 'row', gap: 18, paddingRight: 6 }}>
                  <Pressable onPress={startEdit} hitSlop={8} accessibilityLabel="Edit catch">
                    <Pencil size={21} color={t.text} />
                  </Pressable>
                  <Pressable onPress={() => setConfirmDelete(true)} hitSlop={8} accessibilityLabel="Delete catch">
                    <Trash size={21} color={t.danger} />
                  </Pressable>
                </View>
              )
            : undefined,
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {showCelebrate && (
          <Animated.View style={[styles.celebrate, { backgroundColor: RARITY[c.points.rarity].color, opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
            <Text style={styles.celebrateBig}>+{c.points.total} points!</Text>
            <Text style={styles.celebrateSmall}>
              {c.notifiedFriends ? `🔔 Your ${state.friends.length} friends were notified` : 'Posted to your feed'}
              {c.points.firstOfSpecies ? ' · New Fishdex entry 📖' : ''}
            </Text>
          </Animated.View>
        )}

        <CatchCard c={c} />

        <View style={{ paddingHorizontal: 14, gap: 14 }}>
          <Card>
            <SectionTitle>Score</SectionTitle>
            <PointsTable p={c.points} speciesName={c.speciesName} />
          </Card>

          {c.ai && (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Sparkles size={16} color={t.accent} />
                <Text style={{ color: t.text, fontWeight: '700' }}>
                  {c.ai.source === 'demo' ? 'Demo AI estimate' : 'AI estimate'} · {Math.round(c.ai.confidence * 100)}% sure
                </Text>
              </View>
              <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 19 }}>
                {c.ai.speciesName}, {formatLength(c.ai.lengthIn, units)}, {formatWeight(c.ai.weightLb, units)}
                {c.edited ? ` → adjusted by ${state.users[c.userId]?.handle} to ${formatLength(c.lengthIn, units)}, ${formatWeight(c.weightLb, units)}` : ''}
              </Text>
              {c.ai.funFact ? <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 6, lineHeight: 19 }}>💡 {c.ai.funFact}</Text> : null}
            </Card>
          )}

          {c.conditions && (
            <Card>
              <SectionTitle>Conditions</SectionTitle>
              <ConditionsStrip c={c.conditions} />
            </Card>
          )}

          <SectionTitle>Comments</SectionTitle>
          {c.comments.length === 0 && <Text style={{ color: t.textMuted }}>No comments yet. Say something nice.</Text>}
          {c.comments.map((cm) => {
            const u = state.users[cm.userId];
            return (
              <View key={cm.id} style={styles.comment}>
                <Avatar user={u} size={30} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 14, lineHeight: 19 }}>
                    <Text style={{ fontWeight: '700' }}>{u?.handle} </Text>
                    {cm.text}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>{timeAgo(cm.createdAt)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.composer, { borderTopColor: t.hairline, paddingBottom: insets.bottom + 8, backgroundColor: t.bg }]}>
        <Avatar user={state.meId ? state.users[state.meId] : null} size={30} />
        <TextInput
          value={comment}
          onChangeText={setComment}
          onSubmitEditing={send}
          placeholder={`Comment as ${state.meId ? state.users[state.meId]?.handle : ''}…`}
          placeholderTextColor={t.textMuted}
          style={{ flex: 1, color: t.text, fontSize: 15, paddingVertical: 8 }}
          returnKeyType="send"
        />
        <Pressable onPress={send} disabled={!comment.trim()}>
          <Text style={{ color: comment.trim() ? t.accent : t.textMuted, fontWeight: '700' }}>Post</Text>
        </Pressable>
      </View>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this catch?"
        body={`Its ${c.points.total} points come off the leaderboard. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
      <Modal visible={editing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(false)}>
        <View style={{ flex: 1, backgroundColor: t.bg }}>
          <View style={[styles.editHeader, { borderBottomColor: t.hairline }]}>
            <Pressable onPress={() => setEditing(false)} hitSlop={10} accessibilityLabel="Cancel">
              <X size={24} color={t.text} />
            </Pressable>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>Edit catch</Text>
            <Pressable onPress={saveEdit} hitSlop={10}>
              <Text style={{ color: t.accent, fontWeight: '700', fontSize: 16 }}>Save</Text>
            </Pressable>
          </View>
          {draft && (
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
              <CatchForm value={draft} onChange={setDraft} excludeCatch={c} showNotify={false} />
              {c.ai && c.ai.source !== 'demo' && (
                <Text style={{ color: t.textMuted, fontSize: 12, textAlign: 'center', marginTop: 14 }}>
                  Changing the species or size from the AI’s estimate marks this catch “Edited” for your friends.
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  celebrate: { margin: 14, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 },
  celebrateBig: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  celebrateSmall: { color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  comment: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
