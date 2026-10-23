import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ProfileView } from '../../components/ProfileView';
import { useStore } from '../../lib/store';

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useStore();
  return (
    <>
      <Stack.Screen options={{ title: state.users[id]?.handle ?? '' }} />
      <ProfileView userId={id} />
    </>
  );
}
