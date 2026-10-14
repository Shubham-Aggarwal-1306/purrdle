import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useProgressStore } from '@/features/progress/store';
import { colors, radii, spacing, touchTarget } from '@/theme';

import { useSettingsStore } from './store';

function ToggleRow(props: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  testID: string;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="bodyStrong">{props.label}</AppText>
      <Switch
        testID={props.testID}
        accessibilityLabel={props.label}
        value={props.value}
        onValueChange={props.onValueChange}
        trackColor={{ true: colors.success, false: colors.locked }}
      />
    </View>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const { soundEnabled, hapticsEnabled, setSoundEnabled, setHapticsEnabled } = useSettingsStore();
  const resetAll = useProgressStore((s) => s.resetAll);

  const confirmReset = () => {
    Alert.alert('Reset progress?', 'This clears all solved levels and paws on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <Screen>
      <TopBar title="Settings" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <ToggleRow
            testID="toggle-sound"
            label="Sound"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
          <ToggleRow
            testID="toggle-haptics"
            label="Haptics"
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
          />
        </View>

        <View style={styles.card}>
          {/* Phase 4: opens the Google UMP privacy options form when consent applies. */}
          <Button label="Privacy options" variant="ghost" disabled onPress={() => undefined} />
          {/* Later phase: "Remove ads" in-app purchase. */}
          <Button
            label="Remove ads (coming soon)"
            variant="ghost"
            disabled
            onPress={() => undefined}
          />
        </View>

        <Button label="Reset progress" variant="secondary" onPress={confirmReset} />

        <View style={styles.about}>
          <AppText variant="caption" color={colors.textMuted} align="center">
            Purrdle {Constants.expoConfig?.version ?? ''}
          </AppText>
          <AppText variant="caption" color={colors.textMuted} align="center">
            Fredoka font © The Fredoka Project Authors, SIL Open Font License 1.1
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingVertical: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  row: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  about: { gap: spacing.xs, marginTop: spacing.xl },
});
