import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { conditionInsights, userCatches, userStats } from '../lib/selectors';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { formatPoints, formatWeight } from '../lib/util';
import { CatchMedia } from './CatchBits';
import { Fish, Lock, MapPin } from './icons';
import { Avatar, Button, Card, Empty, Segmented } from './ui';

export function ProfileView({ userId, header }: { userId: string; header?: React.ReactNode }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { state, sendFriendRequest, acceptRequest, removeFriend } = useStore();
  const [tab, setTab] = useState<'grid' | 'insights'>('grid');
  const [now] = useState(Date.now);
  const user = state.users[userId];
  const catches = useMemo(() => userCatches(state, userId), [state, userId]);
  const stats = useMemo(() => userStats(state, userId), [state, userId]);
  const insights = useMemo(() => conditionInsights(catches), [catches]);
  const isMe = userId === state.meId;
  const isFriend = state.friends.includes(userId);
  const requested = state.outgoingRequests.includes(userId);
  const incoming = state.incomingRequests.includes(userId);
  const size = (Math.min(width, 900) - 4) / 3;
  const top = [...catches].sort((a, b) => b.points.total - a.points.total)[0];

  if (!user) return <Empty title="User not found" />;

  const statCell = (n: string | number, label: string, onPress?: () => void) => (
    <Pressable style={styles.stat} onPress={onPress} disabled={!onPress}>
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '800' }}>{n}</Text>
      <Text style={{ color: t.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {header}
      <View style={styles.top}>
        <Avatar user={user} size={86} ring={catches.some((c) => now - c.createdAt < 86400000)} />
        <View style={styles.stats}>
          {statCell(stats.catches, 'catches')}
          {statCell(formatPoints(stats.points), 'points', () => router.push('/leaderboard'))}
          {statCell(stats.species, 'species', isMe ? () => router.push('/fishdex') : undefined)}
        </View>
      </View>
      <View style={styles.bio}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{user.name}</Text>
        {!!user.bio && <Text style={{ color: t.text, fontSize: 14 }}>{user.bio}</Text>}
        {!!user.homeWater && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} color={t.textMuted} />
            <Text style={{ color: t.textMuted, fontSize: 13 }}>{user.homeWater}</Text>
          </View>
        )}
      </View>
      <View style={styles.buttons}>
        {isMe ? (
          <>
            <Button small title="Edit profile" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/settings')} />
            <Button small title={`Friends · ${state.friends.length}`} variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/friends')} />
          </>
        ) : isFriend ? (
          <Button small title="Friends ✓" variant="secondary" style={{ flex: 1 }} onPress={() => removeFriend(userId)} />
        ) : incoming ? (
          <Button small title="Accept friend request" style={{ flex: 1 }} onPress={() => acceptRequest(userId)} />
        ) : (
          <Button
            small
            title={requested ? 'Requested' : 'Add friend'}
            variant={requested ? 'secondary' : 'primary'}
            disabled={requested}
            style={{ flex: 1 }}
            onPress={() => sendFriendRequest(userId)}
          />
        )}
      </View>

      <View style={{ paddingHorizontal: 12, marginBottom: 2 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'grid', label: 'Catches' },
            { value: 'insights', label: 'Insights' },
          ]}
        />
      </View>

      {tab === 'grid' ? (
        catches.length === 0 ? (
          <Empty
            icon={<Fish size={40} color={t.textMuted} />}
            title={isMe ? 'Log your first catch' : 'No catches yet'}
            action={isMe ? <Button title="Log a catch" onPress={() => router.push('/catch/new')} /> : undefined}
          />
        ) : (
          <View style={styles.grid}>
            {catches.map((c) => (
              <Pressable key={c.id} onPress={() => router.push(`/catch/${c.id}`)} style={{ width: size, height: size }}>
                <CatchMedia c={c} />
                <View style={styles.gridBadge}>
                  <Text style={styles.gridBadgeText}>{c.points.total}</Text>
                </View>
                {c.secretSpot && (
                  <View style={styles.gridLock}>
                    <Lock size={12} color="#FFF" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )
      ) : (
        <View style={{ padding: 14, gap: 12 }}>
          {top && (
            <Card>
              <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700' }}>TOP CATCH</Text>
              <Pressable onPress={() => router.push(`/catch/${top.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <View style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden' }}>
                  <CatchMedia c={top} />
                </View>
                <View>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{top.speciesName}</Text>
                  <Text style={{ color: t.textMuted }}>
                    {formatWeight(top.weightLb, state.settings.units)} · {top.points.total} pts
                  </Text>
                </View>
              </Pressable>
            </Card>
          )}
          <Card>
            <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700' }}>WHEN {isMe ? 'YOU CATCH' : 'THEY CATCH'} THE MOST</Text>
            {insights.length === 0 ? (
              <Text style={{ color: t.textMuted, marginTop: 8 }}>Log a few more catches to see patterns in weather, pressure and moon phase.</Text>
            ) : (
              <View style={{ marginTop: 8, gap: 8 }}>
                {insights.map((i) => (
                  <View key={i.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: t.textMuted }}>{i.label}</Text>
                    <Text style={{ color: t.text, fontWeight: '600' }}>{i.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, gap: 16 },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  bio: { paddingHorizontal: 16, paddingTop: 10, gap: 3 },
  buttons: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: 2 },
  gridBadge: { position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  gridBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  gridLock: { position: 'absolute', right: 6, top: 6 },
});
