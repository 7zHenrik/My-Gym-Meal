import { FlatList, StyleSheet, View } from 'react-native';

import { RecipeCard } from '@/components/RecipeCard';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { RecipeWithAuthor } from '@/types/database';

export function RecipeGrid({
  recipes,
  ListHeaderComponent,
  ListEmptyComponent,
}: {
  recipes: RecipeWithAuthor[];
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}) {
  return (
    <FlatList
      data={recipes}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={recipes.length > 0 ? styles.column : undefined}
      renderItem={({ item }) => (
        <View style={styles.gridItem}>
          <RecipeCard recipe={item} />
        </View>
      )}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset,
  },
  column: {
    gap: Spacing.three,
  },
  gridItem: {
    flex: 1,
    marginBottom: Spacing.four,
  },
});
