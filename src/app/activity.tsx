import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { CatchMedia } from '../components/CatchBits';
import { Bell } from '../components/icons';
import { Avatar, Button, Empty } from '../components/ui';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { timeAgo } from '../lib/util';

export default function Activity() {
  const t = useTheme();
  const { state, markNotificationsRead, acceptRequest, declineRequest } = useStore();
  // Remember which items were unread when the screen opened so they stay highlighted.
  const unreadAtOpen = useRef(new Set(state.notifications.filter((n) => !n.read).map((n) => n.id)));

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(markNotificationsRead, 600);
      return () => clearTimeout(timer);
    }, [markNotificationsRead]),
  );

  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      data={state.notifications}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ paddingVertical: 8 }}
      ListEmptyComponent={<Empty icon={<Bell size={40} color={t.textMuted} />} title="No activity yet" body="Reactions, comments and friends' big catches show up here." />}
      renderItem={({ item: n }) => {
        const u = state.users[n.fromUserId];
        const c = n.catchId ? state.catches.find((x) => x.id === n.catchId) : undefined;
        const fresh = unreadAtOpen.current.has(n.id) || !n.read;
        const isRequest = n.type === 'friend_request' && state.incomingRequests.includes(n.fromUserId);
        return (
          <Pressable
            onPress={() => (c ? router.push(`/catch/${c.id}`) : router.push(`/user/${n.fromUserId}`))}
            style={[styles.row, fresh && { backgroundColor: t.surface }]}
          >
            <Avatar user={u} size={44} ring={n.type === 'big_catch'} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 14, lineHeight: 19 }}>
                <Text style={{ fontWeight: '700' }}>{u?.handle} </Text>
                {n.text} <Text style={{ color: t.textMuted }}>{timeAgo(n.createdAt)}</Text>
              </Text>
              {isRequest && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Button small title="Accept" onPress={() => acceptRequest(n.fromUserId)} />
                  <Button small title="Decline" variant="secondary" onPress={() => declineRequest(n.fromUserId)} />
                </View>
              )}
            </View>
            {c && (
              <View style={styles.thumb}>
                <CatchMedia c={c} rounded={6} />
              </View>
            )}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  thumb: { width: 46, height: 46, borderRadius: 6, overflow: 'hidden' },
});
