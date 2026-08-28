import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchProfile } from '@/api/profiles';
import { EmptyState } from '@/components/EmptyState';
import { ProfileHeader } from '@/components/ProfileHeader';
import { RecipeGrid } from '@/components/RecipeGrid';
import { FeedSkeleton } from '@/components/Skeleton';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useUserRecipes } from '@/hooks/useUserRecipes';
import { useTheme } from '@/hooks/use-theme';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => fetchProfile(id as string),
    enabled: !!id,
  });
  const { data: recipes, isLoading: recipesLoading } = useUserRecipes(id);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
        </View>

        {profileLoading ? (
          <FeedSkeleton />
        ) : !profile ? (
          <EmptyState icon="person-circle-outline" title="Profil nicht gefunden" />
        ) : (
          <RecipeGrid
            recipes={recipes ?? []}
            ListHeaderComponent={<ProfileHeader profile={profile} recipeCount={recipes?.length ?? 0} />}
            ListEmptyComponent={recipesLoading ? <FeedSkeleton /> : <EmptyState icon="restaurant-outline" title="Noch keine Rezepte" />}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth },
  headerRow: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
