import { useSyncExternalStore } from 'react';
import { Platform, useColorScheme } from 'react-native';

const light = {
  bg: '#FFFFFF',
  surface: '#FAFAFA',
  card: '#FFFFFF',
  elevated: '#EFEFEF',
  text: '#0F1419',
  textMuted: '#737373',
  border: '#DBDBDB',
  hairline: '#EFEFEF',
  accent: '#0095F6',
  accentText: '#FFFFFF',
  danger: '#ED4956',
  success: '#22A861',
  heart: '#FF3040',
  overlay: 'rgba(0,0,0,0.5)',
  water1: '#CFE8F3',
  water2: '#7FB8D6',
};

const dark: typeof light = {
  bg: '#000000',
  surface: '#121212',
  card: '#000000',
  elevated: '#262626',
  text: '#F5F5F5',
  textMuted: '#A8A8A8',
  border: '#363636',
  hairline: '#262626',
  accent: '#0095F6',
  accentText: '#FFFFFF',
  danger: '#ED4956',
  success: '#2ECC71',
  heart: '#FF3040',
  overlay: 'rgba(0,0,0,0.7)',
  water1: '#0E2A3A',
  water2: '#164B66',
};

export type Theme = typeof light;

// On the web the host page can force a theme with <html data-theme="dark|light">; honor it over the OS setting.
function subscribeDataTheme(cb: () => void): () => void {
  if (Platform.OS !== 'web' || typeof MutationObserver === 'undefined') return () => {};
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
}

function readDataTheme(): string | null {
  return Platform.OS === 'web' && typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null;
}

export function useIsDark(): boolean {
  const scheme = useColorScheme();
  const forced = useSyncExternalStore(subscribeDataTheme, readDataTheme, () => null);
  if (forced === 'dark') return true;
  if (forced === 'light') return false;
  return scheme === 'dark';
}

export function useTheme(): Theme {
  return useIsDark() ? dark : light;
}

/** The story-ring / brand gradient. */
export const BRAND_GRADIENT = ['#FFC94D', '#FF7A3D', '#E8336D', '#8A3FFC', '#2F80ED'] as const;

export const LOGO_FONT = 'Grand Hotel';
