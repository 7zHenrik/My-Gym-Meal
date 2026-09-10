import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecipeFilters } from '@/api/recipes';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { FeedSkeleton } from '@/components/Skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CALORIE_FILTERS, PROTEIN_FILTERS } from '@/constants/filters';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/useCategories';
import { useRecipeFeed } from '@/hooks/useRecipeFeed';
import { useTheme } from '@/hooks/use-theme';

export default function ExploreScreen() {
  const theme = useTheme();
  const { data: categories } = useCategories();

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [minProtein, setMinProtein] = useState<number | undefined>();
  const [maxCalories, setMaxCalories] = useState<number | undefined>();

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filters = useMemo<RecipeFilters>(
    () => ({ query: query || undefined, categoryId, minProtein, maxCalories }),
    [query, categoryId, minProtein, maxCalories]
  );

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useRecipeFeed('newest', filters);
  const recipes = useMemo(() => data?.pages.flatMap((page) => page.recipes) ?? [], [data]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Entdecken
          </ThemedText>

          <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="search" size={18} color={theme.textTertiary} />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Rezepte, Tags…"
              placeholderTextColor={theme.textTertiary}
              style={[styles.searchInput, { color: theme.text }]}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchInput.length > 0 ? (
              <Ionicons name="close-circle" size={18} color={theme.textTertiary} onPress={() => setSearchInput('')} />
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Chip label="Alle" selected={!categoryId} onPress={() => setCategoryId(undefined)} />
            {categories?.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={categoryId === category.id}
                onPress={() => setCategoryId((current) => (current === category.id ? undefined : category.id))}
              />
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {PROTEIN_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                label={`Protein ${filter.label}`}
                selected={minProtein === filter.value}
                onPress={() => setMinProtein((current) => (current === filter.value ? undefined : filter.value))}
              />
            ))}
            {CALORIE_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                label={filter.label}
                selected={maxCalories === filter.value}
                onPress={() => setMaxCalories((current) => (current === filter.value ? undefined : filter.value))}
              />
            ))}
          </ScrollView>
        </View>

        {isLoading ? (
          <FeedSkeleton />
        ) : recipes.length === 0 ? (
          <EmptyState icon="search-outline" title="Keine Rezepte gefunden" message="Versuche einen anderen Suchbegriff oder andere Filter." />
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.column}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <RecipeCard recipe={item} />
              </View>
            )}
            contentContainerStyle={styles.listContent}
            onEndReachedThreshold={0.4}
            onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  title: { fontSize: 28, lineHeight: 34 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  chipRow: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  listContent: {
    padding: Spacing.three,
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
