import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const theme = useTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[{ backgroundColor: theme.backgroundElement }, style, animatedStyle]} />;
}

export function RecipeCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock style={styles.image} />
      <View style={styles.meta}>
        <SkeletonBlock style={styles.titleLine} />
        <SkeletonBlock style={styles.subLine} />
      </View>
    </View>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.feed}>
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  feed: {
    gap: Spacing.four,
    padding: Spacing.three,
  },
  card: {
    gap: Spacing.two,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: Radius.large,
  },
  meta: {
    gap: Spacing.one,
  },
  titleLine: {
    height: 18,
    width: '70%',
    borderRadius: Radius.small,
  },
  subLine: {
    height: 14,
    width: '40%',
    borderRadius: Radius.small,
  },
});
