import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { RARITY } from '../lib/points';
import { BRAND_GRADIENT, LOGO_FONT, useTheme } from '../lib/theme';
import type { RarityTier, User } from '../lib/types';

export function Avatar({ user, size = 32, ring = false, seen = false }: { user?: User | null; size?: number; ring?: boolean; seen?: boolean }) {
  const t = useTheme();
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const inner = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: user?.avatarColor ?? t.elevated,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
  if (!ring) return inner;
  const pad = Math.max(2, size * 0.05);
  return (
    <LinearGradient
      colors={seen ? [t.border, t.border] : [...BRAND_GRADIENT]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{ padding: pad, borderRadius: size }}
    >
      <View style={{ padding: pad, borderRadius: size, backgroundColor: t.bg }}>{inner}</View>
    </LinearGradient>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  const t = useTheme();
  return <Text style={{ fontFamily: LOGO_FONT, fontSize: size, color: t.text, lineHeight: size * 1.2 }}>Wrangler</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const t = useTheme();
  const bg =
    variant === 'primary' ? t.accent : variant === 'secondary' ? t.elevated : variant === 'danger' ? t.danger : 'transparent';
  const fg = variant === 'secondary' || variant === 'ghost' ? t.text : '#FFFFFF';
  const content = (
    <View style={[styles.btnInner, small && { paddingVertical: 7, paddingHorizontal: 12 }]}>
      {loading ? <ActivityIndicator color={fg} size="small" /> : icon}
      <Text style={[styles.btnText, { color: fg }, small && { fontSize: 13 }]}>{title}</Text>
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: variant === 'gradient' ? undefined : bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {variant === 'gradient' ? (
        <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGradient}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

export function IconButton({ onPress, children, label, badge }: { onPress?: () => void; children: React.ReactNode; label: string; badge?: number }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={8} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
      {children}
      {!!badge && (
        <View style={[styles.badge, { backgroundColor: t.heart, borderColor: t.bg }]}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function RarityBadge({ tier, small }: { tier: RarityTier; small?: boolean }) {
  const r = RARITY[tier];
  return (
    <View style={[styles.rarity, { backgroundColor: r.color }, small && { paddingHorizontal: 6, paddingVertical: 2 }]}>
      <Text style={[styles.rarityText, small && { fontSize: 10 }]}>
        {tier === 'legendary' ? '★ ' : ''}
        {r.label.toUpperCase()}
      </Text>
    </View>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: React.ReactNode }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? t.text : t.elevated },
      ]}
    >
      {icon}
      <Text style={{ color: active ? t.bg : t.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const t = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: t.elevated }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, active && { backgroundColor: t.bg, shadowOpacity: 0.12 }]}
          >
            <Text style={{ color: active ? t.text : t.textMuted, fontWeight: active ? '700' : '500', fontSize: 13 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, hint, style, ...props }: TextInputProps & { label: string; hint?: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <TextInput
        placeholderTextColor={t.textMuted}
        style={[styles.input, { color: t.text, backgroundColor: t.surface, borderColor: t.border }, style]}
        {...props}
      />
      {hint ? <Text style={{ color: t.textMuted, fontSize: 12 }}>{hint}</Text> : null}
    </View>
  );
}

export function Toggle({ value, onChange, label, description, icon }: { value: boolean; onChange: (v: boolean) => void; label: string; description?: string; icon?: React.ReactNode }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggleRow} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
        {description ? <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>{description}</Text> : null}
      </View>
      <View style={[styles.switch, { backgroundColor: value ? t.accent : t.border }]}>
        <View style={[styles.knob, { transform: [{ translateX: value ? 20 : 0 }] }]} />
      </View>
    </Pressable>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{children}</Text>
      {right}
    </View>
  );
}

export function Empty({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      {icon}
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      {body ? <Text style={{ color: t.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>{body}</Text> : null}
      {action}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.hairline }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  btn: { borderRadius: 10, overflow: 'hidden' },
  btnGradient: { borderRadius: 10 },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16 },
  btnText: { fontWeight: '700', fontSize: 15 },
  iconBtn: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  rarity: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  rarityText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11, letterSpacing: 0.6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    shadowOpacity: 0,
  },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  switch: { width: 46, height: 26, borderRadius: 13, padding: 3 },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  empty: { alignItems: 'center', gap: 10, padding: 32 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
});
