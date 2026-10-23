import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings } from '../../components/icons';
import { ProfileView } from '../../components/ProfileView';
import { IconButton } from '../../components/ui';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

export default function MyProfile() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { me } = useStore();
  if (!me) return null;
  return (
    <ProfileView
      userId={me.id}
      header={
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '800' }}>{me.handle}</Text>
          <IconButton label="Settings" onPress={() => router.push('/settings')}>
            <Settings size={24} color={t.text} />
          </IconButton>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
});
