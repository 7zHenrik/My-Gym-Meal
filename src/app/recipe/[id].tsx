import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteRecipe } from '@/api/recipes';
import { Avatar } from '@/components/Avatar';
import { CommentItem } from '@/components/CommentItem';
import { EmptyState } from '@/components/EmptyState';
import { LikeButton } from '@/components/LikeButton';
import { NutritionGrid } from '@/components/NutritionGrid';
import { SaveButton } from '@/components/SaveButton';
import { FeedSkeleton } from '@/components/Skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { useComments } from '@/hooks/useComments';
import { useRecipe } from '@/hooks/useRecipe';
import { useRecipeInteractions } from '@/hooks/useRecipeInteractions';
import { useTheme } from '@/hooks/use-theme';
import { formatAmount, formatCount, formatDifficulty, formatDuration, formatRelativeTime, scaleAmount } from '@/utils/format';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { session, profile } = useAuth();
  const { data: recipe, isLoading, isError } = useRecipe(id);

  if (isLoading) {
    return (
      <ThemedView style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <FeedSkeleton count={1} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (isError || !recipe) {
    return (
      <ThemedView style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <EmptyState
            icon="alert-circle-outline"
            title="Rezept nicht gefunden"
            message="Dieses Rezept existiert nicht mehr oder konnte nicht geladen werden."
            actionLabel="Zurück"
            onAction={() => router.back()}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const isOwner = profile?.id === recipe.author_id;

  const handleMorePress = () => {
    if (isOwner) {
      Alert.alert('Rezept verwalten', undefined, [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Rezept löschen',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Rezept löschen?', 'Das kann nicht rückgängig gemacht werden.', [
              { text: 'Abbrechen', style: 'cancel' },
              {
                text: 'Löschen',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteRecipe(recipe.id);
                    router.back();
                  } catch {
                    Alert.alert('Fehler', 'Das Rezept konnte nicht gelöscht werden.');
                  }
                },
              },
            ]),
        },
      ]);
    } else if (session) {
      router.push({ pathname: '/report', params: { recipeId: recipe.id } });
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <RecipeMedia videoUrl={recipe.video_url} imageUrl={recipe.main_image_url} />

        <SafeAreaView edges={['top']} style={styles.floatingHeader} pointerEvents="box-none">
          <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: theme.overlay }]}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={handleMorePress} style={[styles.iconButton, { backgroundColor: theme.overlay }]}>
            <Ionicons name={isOwner ? 'ellipsis-horizontal' : 'flag-outline'} size={20} color="#FFFFFF" />
          </Pressable>
        </SafeAreaView>

        <View style={styles.content}>
          <RecipeBody recipeId={recipe.id} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function RecipeMedia({ videoUrl, imageUrl }: { videoUrl: string | null; imageUrl: string }) {
  if (videoUrl) {
    return <RecipeVideo uri={videoUrl} />;
  }
  return <Image source={{ uri: imageUrl }} style={styles.media} contentFit="cover" transition={200} />;
}

function RecipeVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });
  return (
    <VideoView
      player={player}
      style={styles.media}
      contentFit="cover"
      nativeControls
      fullscreenOptions={{ enable: true }}
    />
  );
}

function RecipeBody({ recipeId }: { recipeId: string }) {
  const { data: recipe } = useRecipe(recipeId);
  const { session } = useAuth();
  const [servings, setServings] = useState(recipe?.servings ?? 1);
  const { isLiked, likeCount, isSaved, toggleLike, toggleSave } = useRecipeInteractions(recipe!);
  const { data: comments, isLoading: commentsLoading, addComment, removeComment } = useComments(recipeId);
  const [commentText, setCommentText] = useState('');
  const theme = useTheme();

  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) => ({
      ...ing,
      amount: scaleAmount(ing.amount, recipe.servings, servings),
    }));
  }, [recipe, servings]);

  if (!recipe) return null;

  const authorName = recipe.author?.display_name || recipe.author?.username;
  const difficultyLabel = formatDifficulty(recipe.difficulty);
  const durationLabel = formatDuration(recipe.prep_time_minutes);

  const handleSendComment = () => {
    const text = commentText.trim();
    if (!text) return;
    if (!session) {
      router.push('/auth/login');
      return;
    }
    addComment.mutate(text, { onSuccess: () => setCommentText('') });
  };

  return (
    <View style={styles.body}>
      <ThemedText type="title" style={styles.title}>
        {recipe.title}
      </ThemedText>

      <View style={styles.rowBetween}>
        <Pressable style={styles.authorRow} onPress={() => router.push(`/user/${recipe.author_id}`)}>
          <Avatar uri={recipe.author?.avatar_url} size={36} />
          <View>
            <ThemedText type="smallBold">@{recipe.author?.username ?? authorName}</ThemedText>
            <ThemedText type="small" themeColor="textTertiary">
              {formatRelativeTime(recipe.created_at)}
            </ThemedText>
          </View>
        </Pressable>

        <View style={styles.actionsRow}>
          <View style={styles.actionItem}>
            <LikeButton isLiked={isLiked} onPress={toggleLike} />
            <ThemedText type="small" themeColor="textSecondary">
              {formatCount(likeCount)}
            </ThemedText>
          </View>
          <SaveButton isSaved={isSaved} onPress={toggleSave} />
        </View>
      </View>

      {(durationLabel || difficultyLabel) ? (
        <View style={styles.badgeRow}>
          {durationLabel ? <Badge icon="time-outline" label={durationLabel} /> : null}
          {difficultyLabel ? <Badge icon="speedometer-outline" label={difficultyLabel} /> : null}
        </View>
      ) : null}

      {recipe.description ? <ThemedText style={styles.description}>{recipe.description}</ThemedText> : null}

      <Section title="Nährwerte" subtitle={`Pro Portion (${recipe.servings} Portionen gesamt)`}>
        <NutritionGrid calories={recipe.calories} proteinG={recipe.protein_g} carbsG={recipe.carbohydrates_g} fatG={recipe.fat_g} fiberG={recipe.fiber_g} />
      </Section>

      <Section
        title="Zutaten"
        headerRight={
          <View style={[styles.servingsStepper, { backgroundColor: theme.backgroundElement }]}>
            <Pressable onPress={() => setServings((s) => Math.max(1, s - 1))} hitSlop={8} style={styles.stepperButton}>
              <Ionicons name="remove" size={16} color={theme.text} />
            </Pressable>
            <ThemedText type="smallBold">{servings} Portion{servings === 1 ? '' : 'en'}</ThemedText>
            <Pressable onPress={() => setServings((s) => Math.min(50, s + 1))} hitSlop={8} style={styles.stepperButton}>
              <Ionicons name="add" size={16} color={theme.text} />
            </Pressable>
          </View>
        }>
        <View style={styles.ingredientList}>
          {scaledIngredients.map((ing, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={[styles.bullet, { backgroundColor: theme.accent }]} />
              <ThemedText style={styles.ingredientText}>
                {ing.amount !== null ? `${formatAmount(ing.amount)} ${ing.unit} ` : ''}
                {ing.name}
              </ThemedText>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Zubereitung">
        <View style={styles.stepList}>
          {recipe.steps
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <View key={step.order} style={styles.stepRow}>
                <ThemedText type="title" themeColor="accent" style={styles.stepNumber}>
                  {String(step.order).padStart(2, '0')}
                </ThemedText>
                <ThemedText style={styles.stepText}>{step.text}</ThemedText>
              </View>
            ))}
        </View>
      </Section>

      {recipe.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {recipe.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="textSecondary">
                #{tag}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      <Section title={`Kommentare (${recipe.comment_count})`}>
        <View style={styles.commentInputRow}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Schreib einen Kommentar…"
            placeholderTextColor={theme.textTertiary}
            style={[styles.commentInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            multiline
          />
          <Pressable onPress={handleSendComment} disabled={addComment.isPending} style={[styles.sendButton, { backgroundColor: theme.accent }]}>
            {addComment.isPending ? <ActivityIndicator color={theme.accentText} size="small" /> : <Ionicons name="arrow-up" size={18} color={theme.accentText} />}
          </Pressable>
        </View>

        {commentsLoading ? (
          <ActivityIndicator style={{ marginTop: Spacing.three }} />
        ) : !comments || comments.length === 0 ? (
          <ThemedText themeColor="textTertiary" style={styles.noComments}>
            Noch keine Kommentare. Sei die erste Person!
          </ThemedText>
        ) : (
          <View style={styles.commentList}>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                canDelete={comment.user_id === session?.user.id}
                onDelete={() => removeComment.mutate(comment.id)}
              />
            ))}
          </View>
        )}
      </Section>
    </View>
  );
}

function Section({
  title,
  subtitle,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textTertiary">
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        {headerRight}
      </View>
      {children}
    </View>
  );
}

function Badge({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
      <Ionicons name={icon} size={14} color={theme.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.six },
  media: { width: '100%', aspectRatio: 4 / 3.4, backgroundColor: '#000' },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 24,
  },
  servingsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  stepperButton: {
    padding: 2,
  },
  ingredientList: {
    gap: Spacing.two,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ingredientText: {
    fontSize: 15,
    flexShrink: 1,
  },
  stepList: {
    gap: Spacing.four,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stepNumber: {
    fontSize: 22,
    width: 36,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noComments: {
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  commentList: {
    gap: Spacing.three,
  },
});
