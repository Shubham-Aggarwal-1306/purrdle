import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radii, spacing, touchTarget, typography } from '@/theme';

import { Button } from './Button';

export interface GuessInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const GUESS_MAX_LENGTH = 40;

export function GuessInput({ value, onChangeText, onSubmit, disabled = false }: GuessInputProps) {
  return (
    <View style={styles.row}>
      <TextInput
        testID="guess-input"
        accessibilityLabel="Your guess"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        editable={!disabled}
        placeholder="Type your guess"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        maxLength={GUESS_MAX_LENGTH}
        returnKeyType="done"
        submitBehavior="submit"
        style={styles.input}
      />
      <Button
        testID="guess-submit"
        label="Guess"
        onPress={onSubmit}
        disabled={disabled || value.trim() === ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    ...typography.bodyStrong,
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    color: colors.text,
  },
});
