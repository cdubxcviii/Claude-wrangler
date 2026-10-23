import { Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import { BookOpen, House, SquarePlus, Trophy } from '../../components/icons';
import { Avatar } from '../../components/ui';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

export default function TabsLayout() {
  const { me } = useStore();
  const t = useTheme();
  if (!me) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: t.text,
        tabBarInactiveTintColor: t.text,
        tabBarStyle: { backgroundColor: t.bg, borderTopColor: t.hairline },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <House size={26} color={color} strokeWidth={focused ? 2.6 : 1.8} /> }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ title: 'Leaderboard', tabBarIcon: ({ color, focused }) => <Trophy size={26} color={color} strokeWidth={focused ? 2.6 : 1.8} /> }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: 'Log a catch', tabBarIcon: ({ color }) => <SquarePlus size={27} color={color} strokeWidth={1.9} /> }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/catch/new');
          },
        }}
      />
      <Tabs.Screen
        name="fishdex"
        options={{ title: 'Fishdex', tabBarIcon: ({ color, focused }) => <BookOpen size={26} color={color} strokeWidth={focused ? 2.6 : 1.8} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Avatar user={me} size={focused ? 26 : 27} ring={focused} seen />
          ),
        }}
      />
    </Tabs>
  );
}
