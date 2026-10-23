import { GrandHotel_400Regular } from '@expo-google-fonts/grand-hotel/400Regular';
import { useFonts } from 'expo-font';
import { LOGO_FONT } from './theme';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ [LOGO_FONT]: GrandHotel_400Regular });
  return loaded || !!error;
}
