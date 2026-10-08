import { normalizeGuess } from '@purrdle/shared';
import { StyleSheet, Text, View } from 'react-native';

// Phase 0 placeholder — replaced by the real Home screen in Phase 2.
export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Purrdle</Text>
      <Text testID="shared-check">{normalizeGuess('  Hello,   KITTY! ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF6EC',
  },
  title: { fontSize: 32, fontWeight: '700' },
});
