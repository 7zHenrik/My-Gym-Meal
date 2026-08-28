import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

export function SaveButton({ isSaved, onPress, size = 22 }: { isSaved: boolean; onPress: () => void; size?: number }) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSequence(withTiming(1.25, { duration: 100 }), withTiming(1, { duration: 120 }));
    onPress();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={10} style={styles.button}>
      <Animated.View style={animatedStyle}>
        <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={size} color={theme.text} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
