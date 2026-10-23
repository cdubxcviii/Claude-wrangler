import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/theme';

/** In-app confirmation (browser confirm() is unavailable inside the preview's frame). */
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.backdrop, { backgroundColor: t.overlay }]} onPress={onCancel}>
        <Pressable style={[styles.box, { backgroundColor: t.bg }]} onPress={() => {}}>
          <View style={styles.text}>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
            <Text style={{ color: t.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>{body}</Text>
          </View>
          <Pressable onPress={onConfirm} style={[styles.action, { borderTopColor: t.hairline }]}>
            <Text style={{ color: t.danger, fontWeight: '700', fontSize: 15 }}>{confirmLabel}</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={[styles.action, { borderTopColor: t.hairline }]}>
            <Text style={{ color: t.text, fontSize: 15 }}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  box: { width: '100%', maxWidth: 320, borderRadius: 14, overflow: 'hidden' },
  text: { padding: 22, gap: 8 },
  action: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 14, alignItems: 'center' },
});
