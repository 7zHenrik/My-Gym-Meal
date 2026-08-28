import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function Avatar({ uri, size = 36 }: { uri?: string | null; size?: number }) {
  const theme = useTheme();
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (!uri) {
    return (
      <View style={[styles.placeholder, style, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="person" size={size * 0.5} color={theme.textTertiary} />
      </View>
    );
  }

  return <Image source={{ uri }} style={[style, { backgroundColor: theme.backgroundElement }]} contentFit="cover" transition={150} />;
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
