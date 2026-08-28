import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { ProfileHeader } from '@/components/ProfileHeader';
import { RecipeGrid } from '@/components/RecipeGrid';
import { FeedSkeleton } from '@/components/Skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { useUserRecipes } from '@/hooks/useUserRecipes';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.title}>
            Profil
          </ThemedText>
          <Pressable
            onPress={() =>
              Alert.alert('Abmelden?', undefined, [
                { text: 'Abbrechen', style: 'cancel' },
                { text: 'Abmelden', style: 'destructive', onPress: signOut },
              ])
            }
            hitSlop={10}>
            <Ionicons name="log-out-outline" size={24} color={theme.text} />
          </Pressable>
        </View>

        <AuthGate title="Melde dich an" message="Melde dich an, um dein Profil und deine Rezepte zu sehen.">
          <OwnProfile />
        </AuthGate>
      </SafeAreaView>
    </ThemedView>
  );
}

function OwnProfile() {
  const { profile } = useAuth();
  const { data: recipes, isLoading } = useUserRecipes(profile?.id);

  if (!profile) return null;

  return (
    <RecipeGrid
      recipes={recipes ?? []}
      ListHeaderComponent={
        <ProfileHeader
          profile={profile}
          recipeCount={recipes?.length ?? 0}
          primaryAction={{ label: 'Profil bearbeiten', onPress: () => router.push('/edit-profile') }}
        />
      }
      ListEmptyComponent={
        isLoading ? (
          <FeedSkeleton />
        ) : (
          <EmptyState
            icon="restaurant-outline"
            title="Noch keine eigenen Rezepte"
            message="Teile dein erstes Rezept über den Hochladen-Tab."
            actionLabel="Rezept hochladen"
            onAction={() => router.push('/(tabs)/upload')}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  title: { fontSize: 28, lineHeight: 34 },
});
