import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { LikeButton } from '@/components/LikeButton';
import { SaveButton } from '@/components/SaveButton';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useRecipeInteractions } from '@/hooks/useRecipeInteractions';
import { useTheme } from '@/hooks/use-theme';
import { RecipeWithAuthor } from '@/types/database';
import { formatCount } from '@/utils/format';

export function RecipeCard({ recipe }: { recipe: RecipeWithAuthor }) {
  const theme = useTheme();
  const { isLiked, likeCount, isSaved, toggleLike, toggleSave } = useRecipeInteractions(recipe);

  const authorName = recipe.author?.display_name || recipe.author?.username || 'Unbekannt';

  return (
    <Pressable onPress={() => router.push(`/recipe/${recipe.id}`)} style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: recipe.main_image_url }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder={{ blurhash: 'L5H2EC=PM+yV0g-mq.wG9c010J}I' }}
        />
        <View style={styles.saveOverlay}>
          <View style={[styles.iconBadge, { backgroundColor: theme.overlay }]}>
            <SaveButton isSaved={isSaved} onPress={toggleSave} />
          </View>
        </View>
        {(recipe.protein_g || recipe.calories) ? (
          <View style={[styles.nutritionPill, { backgroundColor: theme.overlay }]}>
            {recipe.protein_g ? <ThemedText type="smallBold" style={styles.pillText}>{Math.round(recipe.protein_g)} g Protein</ThemedText> : null}
            {recipe.protein_g && recipe.calories ? <ThemedText style={styles.pillDot}>·</ThemedText> : null}
            {recipe.calories ? <ThemedText type="smallBold" style={styles.pillText}>{recipe.calories} kcal</ThemedText> : null}
          </View>
        ) : null}
      </View>

      <View style={styles.meta}>
        <ThemedText type="subtitle" style={styles.title} numberOfLines={2}>
          {recipe.title}
        </ThemedText>

        <View style={styles.row}>
          <View style={styles.authorRow}>
            <Avatar uri={recipe.author?.avatar_url} size={22} />
            <ThemedText type="small" themeColor="textSecondary">
              @{recipe.author?.username ?? authorName}
            </ThemedText>
          </View>

          <View style={styles.likeRow}>
            <LikeButton isLiked={isLiked} onPress={toggleLike} size={20} />
            <ThemedText type="small" themeColor="textSecondary">
              {formatCount(likeCount)}
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  imageWrapper: {
    borderRadius: Radius.large,
    overflow: 'hidden',
    aspectRatio: 4 / 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  saveOverlay: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionPill: {
    position: 'absolute',
    left: Spacing.two,
    bottom: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  pillText: {
    color: '#FFFFFF',
  },
  pillDot: {
    color: '#FFFFFF',
  },
  meta: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.half,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.half,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
});
