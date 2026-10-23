import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search } from '../components/icons';
import { Avatar, Button, Empty, Segmented } from '../components/ui';
import { userStats } from '../lib/selectors';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { formatPoints } from '../lib/util';

type Tab = 'friends' | 'requests' | 'find';

export default function Friends() {
  const t = useTheme();
  const { state, sendFriendRequest, acceptRequest, declineRequest, removeFriend } = useStore();
  const [tab, setTab] = useState<Tab>(state.incomingRequests.length ? 'requests' : 'friends');
  const [q, setQ] = useState('');

  const ids = useMemo(() => {
    const all = Object.keys(state.users).filter((id) => id !== state.meId);
    const base =
      tab === 'friends' ? state.friends : tab === 'requests' ? state.incomingRequests : all.filter((id) => !state.friends.includes(id));
    const needle = q.trim().toLowerCase().replace(/^@/, '');
    return base.filter((id) => {
      const u = state.users[id];
      return u && (!needle || u.name.toLowerCase().includes(needle) || u.handle.toLowerCase().includes(needle));
    });
  }, [state, tab, q]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'friends', label: `Friends ${state.friends.length}` },
            { value: 'requests', label: `Requests${state.incomingRequests.length ? ` ${state.incomingRequests.length}` : ''}` },
            { value: 'find', label: 'Find people' },
          ]}
        />
        <View style={[styles.search, { backgroundColor: t.elevated }]}>
          <Search size={16} color={t.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name or @username"
            placeholderTextColor={t.textMuted}
            autoCapitalize="none"
            style={{ flex: 1, color: t.text, fontSize: 15, paddingVertical: 9 }}
          />
        </View>
      </View>
      <FlatList
        data={ids}
        keyExtractor={(id) => id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
        ListEmptyComponent={
          <Empty
            title={tab === 'requests' ? 'No pending requests' : tab === 'friends' ? 'No friends yet' : 'Nobody found'}
            body={tab === 'friends' ? 'Find people to follow their catches and compete on the leaderboard.' : undefined}
            action={tab === 'friends' ? <Button title="Find people" onPress={() => setTab('find')} /> : undefined}
          />
        }
        renderItem={({ item: id }) => {
          const u = state.users[id];
          const s = userStats(state, id);
          const requested = state.outgoingRequests.includes(id);
          const incoming = state.incomingRequests.includes(id);
          return (
            <Pressable style={styles.row} onPress={() => router.push(`/user/${id}`)}>
              <Avatar user={u} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '700' }}>{u.handle}</Text>
                <Text style={{ color: t.textMuted, fontSize: 13 }} numberOfLines={1}>
                  {u.name} · {formatPoints(s.points)} pts
                </Text>
              </View>
              {tab === 'requests' || incoming ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Button small title="Accept" onPress={() => acceptRequest(id)} />
                  <Button small title="Decline" variant="secondary" onPress={() => declineRequest(id)} />
                </View>
              ) : tab === 'friends' ? (
                <Button small title="Remove" variant="secondary" onPress={() => removeFriend(id)} />
              ) : (
                <Button
                  small
                  title={requested ? 'Requested' : 'Add'}
                  variant={requested ? 'secondary' : 'primary'}
                  disabled={requested}
                  onPress={() => sendFriendRequest(id)}
                />
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
});
