import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

export interface TopBarProps {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function TopBar({ title, onBack, right }: TopBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? <IconButton glyph="‹" accessibilityLabel="Back" onPress={onBack} /> : null}
      </View>
      <AppText variant="heading" align="center" style={styles.title} accessibilityRole="header">
        {title}
      </AppText>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  side: { width: 56 },
  right: { alignItems: 'flex-end' },
  title: { flex: 1 },
});
