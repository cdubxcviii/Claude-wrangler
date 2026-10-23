import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CatchCard } from '../../components/CatchCard';
import { StoryViewer } from '../../components/StoryViewer';
import { Bell, Fish, Plus, Users } from '../../components/icons';
import { Avatar, Button, Empty, IconButton, Logo } from '../../components/ui';
import { feedCatches, storyUsers } from '../../lib/selectors';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

export default function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { state, me } = useStore();
  const [story, setStory] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const feed = useMemo(() => feedCatches(state), [state]);
  const stories = useMemo(() => storyUsers(state), [state]);
  const myStoryIndex = stories.findIndex((s) => s.userId === me?.id);
  const others = stories.filter((s) => s.userId !== me?.id);
  const unread = state.notifications.filter((n) => !n.read).length;

  const openStory = (index: number) => {
    setStory(index);
    setSeen((s) => new Set(s).add(stories[index].userId));
  };

  const header = (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
        <Pressable
          style={styles.story}
          onPress={() => (myStoryIndex >= 0 ? openStory(myStoryIndex) : router.push('/catch/new'))}
        >
          <View>
            <Avatar user={me} size={62} ring={myStoryIndex >= 0} seen={seen.has(me?.id ?? '')} />
            {myStoryIndex < 0 && (
              <View style={[styles.plus, { backgroundColor: t.accent, borderColor: t.bg }]}>
                <Plus size={14} color="#FFF" strokeWidth={3} />
              </View>
            )}
          </View>
          <Text style={[styles.storyName, { color: t.textMuted }]} numberOfLines={1}>
            Your catch
          </Text>
        </Pressable>
        {others.map((s) => {
          const idx = stories.indexOf(s);
          return (
            <Pressable key={s.userId} style={styles.story} onPress={() => openStory(idx)}>
              <Avatar user={state.users[s.userId]} size={62} ring seen={seen.has(s.userId)} />
              <Text style={[styles.storyName, { color: t.text }]} numberOfLines={1}>
                {state.users[s.userId]?.handle}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.hairline, marginBottom: 4 }} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6, borderBottomColor: t.hairline }]}>
        <Logo size={32} />
        <View style={styles.topIcons}>
          <IconButton label="Friends" onPress={() => router.push('/friends')} badge={state.incomingRequests.length}>
            <Users size={25} color={t.text} />
          </IconButton>
          <IconButton label="Activity" onPress={() => router.push('/activity')} badge={unread}>
            <Bell size={25} color={t.text} />
          </IconButton>
        </View>
      </View>
      <FlatList
        data={feed}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <CatchCard c={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Empty
            icon={<Fish size={44} color={t.textMuted} />}
            title="No catches yet"
            body="Log your first fish, or add friends to see what they're catching."
            action={<Button title="Log a catch" onPress={() => router.push('/catch/new')} />}
          />
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
      {story != null && <StoryViewer groups={stories} startIndex={story} onClose={() => setStory(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  topIcons: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  stories: { paddingHorizontal: 10, paddingVertical: 10, gap: 14 },
  story: { alignItems: 'center', width: 72, gap: 5 },
  storyName: { fontSize: 11.5, maxWidth: 72 },
  plus: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
