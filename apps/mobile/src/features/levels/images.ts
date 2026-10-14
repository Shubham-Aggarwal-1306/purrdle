import type { ImageSourcePropType } from 'react-native';

/** Bundled placeholder art, referenced in level data as `placeholder:<key>`. */
const placeholders = {
  cream: require('../../../assets/levels/placeholder-cream.png') as ImageSourcePropType,
  peach: require('../../../assets/levels/placeholder-peach.png') as ImageSourcePropType,
  lavender: require('../../../assets/levels/placeholder-lavender.png') as ImageSourcePropType,
  mint: require('../../../assets/levels/placeholder-mint.png') as ImageSourcePropType,
  sky: require('../../../assets/levels/placeholder-sky.png') as ImageSourcePropType,
  rose: require('../../../assets/levels/placeholder-rose.png') as ImageSourcePropType,
};

export type PlaceholderKey = keyof typeof placeholders;

export const isPlaceholderKey = (key: string): key is PlaceholderKey => key in placeholders;

/** Resolves a level image URI: `placeholder:<key>` → bundled asset, http(s) → remote. */
export function resolveLevelImage(uri: string): ImageSourcePropType {
  if (uri.startsWith('placeholder:')) {
    const key = uri.slice('placeholder:'.length);
    return isPlaceholderKey(key) ? placeholders[key] : placeholders.cream;
  }
  if (uri.startsWith('https://') || uri.startsWith('http://')) return { uri };
  return placeholders.cream;
}
