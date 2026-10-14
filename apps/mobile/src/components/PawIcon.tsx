import { StyleSheet, View } from 'react-native';

export interface PawIconProps {
  size: number;
  color: string;
}

/** Paw print built from views (one pad + four toes). Placeholder until final icon art. */
export function PawIcon({ size, color }: PawIconProps) {
  const toe = size * 0.22;
  const toes = [
    { left: size * 0.04, top: size * 0.3 },
    { left: size * 0.24, top: size * 0.08 },
    { left: size * 0.54, top: size * 0.08 },
    { left: size * 0.74, top: size * 0.3 },
  ];
  return (
    <View style={{ width: size, height: size }} importantForAccessibility="no-hide-descendants">
      {toes.map((pos, i) => (
        <View
          key={i}
          style={[
            styles.abs,
            { ...pos, width: toe, height: toe * 1.2, borderRadius: toe, backgroundColor: color },
          ]}
        />
      ))}
      <View
        style={[
          styles.abs,
          {
            left: size * 0.22,
            top: size * 0.5,
            width: size * 0.56,
            height: size * 0.44,
            borderRadius: size * 0.28,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({ abs: { position: 'absolute' } });
