import { useEffect } from 'react';

// On the web the logo font comes from Google Fonts, so no font file is bundled.
export function useAppFonts(): boolean {
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById('wrangler-fonts')) return;
    const link = document.createElement('link');
    link.id = 'wrangler-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap';
    document.head.appendChild(link);
  }, []);
  return true;
}
