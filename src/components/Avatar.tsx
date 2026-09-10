import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function Avatar({ uri, size = 36, ring = false }: { uri?: string | null; size?: number; ring?: boolean }) {
  const theme = useTheme();
  const style = { width: size, height: size, borderRadius: size / 2 };
  const ringStyle = ring
    ? { borderWidth: Math.max(2, size * 0.035), borderColor: theme.accent, padding: Math.max(2, size * 0.035) }
    : null;

  const content = !uri ? (
    <View style={[styles.placeholder, style, { backgroundColor: theme.backgroundElement }]}>
      <Ionicons name="person" size={size * 0.5} color={theme.textTertiary} />
    </View>
  ) : (
    <Image source={{ uri }} style={[style, { backgroundColor: theme.backgroundElement }]} contentFit="cover" transition={150} />
  );

  if (!ring) return content;

  return <View style={[{ borderRadius: (size + size * 0.14) / 2 }, ringStyle]}>{content}</View>;
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
