import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { FeedSkeleton } from '@/components/Skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FeedSort } from '@/api/recipes';
import { APP_NAME } from '@/constants/app';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useRecipeFeed } from '@/hooks/useRecipeFeed';
import { RecipeWithAuthor } from '@/types/database';

const SORT_OPTIONS: { value: FeedSort; label: string }[] = [
  { value: 'newest', label: 'Neu' },
  { value: 'popular', label: 'Beliebt' },
];

export default function HomeScreen() {
  const [sort, setSort] = useState<FeedSort>('newest');
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useRecipeFeed(sort);

  const recipes = useMemo<RecipeWithAuthor[]>(() => data?.pages.flatMap((page) => page.recipes) ?? [], [data]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.brand}>
            {APP_NAME}
          </ThemedText>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((option) => (
              <Chip key={option.value} label={option.label} selected={sort === option.value} onPress={() => setSort(option.value)} />
            ))}
          </View>
        </View>

        {isLoading ? (
          <FeedSkeleton />
        ) : isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Rezepte konnten nicht geladen werden"
            message="Bitte prüfe deine Internetverbindung und versuche es erneut."
            actionLabel="Erneut versuchen"
            onAction={() => refetch()}
          />
        ) : recipes.length === 0 ? (
          <EmptyState icon="restaurant-outline" title="Noch keine Rezepte" message="Sei die erste Person, die ein Rezept teilt!" />
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.five }} />}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
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
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  brand: {
    fontSize: 28,
    lineHeight: 34,
  },
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
