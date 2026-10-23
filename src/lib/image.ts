import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export interface PickedPhoto {
  dataUri: string;
  base64: string;
  mimeType: string;
  exif?: Record<string, any> | null;
}

const MAX_WIDTH = 1080;

export async function pickPhoto(from: 'camera' | 'library'): Promise<PickedPhoto | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.9,
    exif: true,
    base64: true,
  };
  if (from === 'camera' && Platform.OS !== 'web') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Camera permission is needed to photograph your catch.');
  }
  const result =
    from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const shrunk = await shrink(asset.uri, asset.width);
  if (shrunk) return { ...shrunk, exif: asset.exif };
  if (asset.base64) {
    const mimeType = asset.mimeType ?? 'image/jpeg';
    return { dataUri: `data:${mimeType};base64,${asset.base64}`, base64: asset.base64, mimeType, exif: asset.exif };
  }
  return null;
}

/** Resizes to at most 1080px wide JPEG so photos stay small enough to store on the device. */
async function shrink(uri: string, width: number): Promise<PickedPhoto | null> {
  try {
    const ctx = ImageManipulator.manipulate(uri);
    if (width > MAX_WIDTH) ctx.resize({ width: MAX_WIDTH });
    const ref = await ctx.renderAsync();
    const out = await ref.saveAsync({ compress: 0.72, format: SaveFormat.JPEG, base64: true });
    if (!out.base64) return null;
    return { dataUri: `data:image/jpeg;base64,${out.base64}`, base64: out.base64, mimeType: 'image/jpeg' };
  } catch {
    return null;
  }
}
