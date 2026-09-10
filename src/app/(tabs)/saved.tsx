import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { FeedSkeleton } from '@/components/Skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSavedRecipes } from '@/hooks/useSavedRecipes';

export default function SavedScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.header}>
          Gespeichert
        </ThemedText>
        <AuthGate title="Melde dich an" message="Melde dich an, um deine gespeicherten Rezepte zu sehen.">
          <SavedList />
        </AuthGate>
      </SafeAreaView>
    </ThemedView>
  );
}

function SavedList() {
  const { data: recipes, isLoading } = useSavedRecipes();

  if (isLoading) return <FeedSkeleton />;

  if (!recipes || recipes.length === 0) {
    return <EmptyState icon="bookmark-outline" title="Noch keine gespeicherten Rezepte" message="Tippe beim Stöbern auf das Lesezeichen-Symbol, um Rezepte zu sammeln." />;
  }

  return (
    <FlatList
      data={recipes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <RecipeCard recipe={item} />}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ height: Spacing.five }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth },
  header: { fontSize: 28, lineHeight: 34, paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: BottomTabInset },
});
