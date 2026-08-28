import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface NutritionGridProps {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
}

export function NutritionGrid({ calories, proteinG, carbsG, fatG, fiberG }: NutritionGridProps) {
  const theme = useTheme();

  const items = [
    { label: 'Kalorien', value: calories, unit: 'kcal' },
    { label: 'Protein', value: proteinG, unit: 'g' },
    { label: 'Kohlenhydrate', value: carbsG, unit: 'g' },
    { label: 'Fett', value: fatG, unit: 'g' },
    ...(fiberG !== null ? [{ label: 'Ballaststoffe', value: fiberG, unit: 'g' }] : []),
  ].filter((item) => item.value !== null);

  if (items.length === 0) return null;

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.label} style={[styles.cell, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="title" style={styles.value}>
            {item.value}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {item.unit} · {item.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    flexBasis: '31%',
    flexGrow: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 22,
    lineHeight: 26,
  },
});
