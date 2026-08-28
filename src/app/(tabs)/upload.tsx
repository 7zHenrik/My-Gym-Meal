import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { createRecipe } from '@/api/recipes';
import { MAX_VIDEO_SIZE_BYTES, uploadRecipeImage, uploadRecipeVideo } from '@/api/storage';
import { AuthGate } from '@/components/AuthGate';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/hooks/useCategories';
import { useTheme } from '@/hooks/use-theme';
import { Difficulty, Ingredient } from '@/types/database';

interface DraftIngredient {
  amount: string;
  unit: string;
  name: string;
}

interface DraftStep {
  text: string;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Einfach' },
  { value: 'medium', label: 'Mittel' },
  { value: 'hard', label: 'Anspruchsvoll' },
];

const emptyIngredient = (): DraftIngredient => ({ amount: '', unit: '', name: '' });
const emptyStep = (): DraftStep => ({ text: '' });

export default function UploadScreen() {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <AuthGate title="Melde dich an" message="Melde dich an, um ein eigenes Rezept hochzuladen.">
          <UploadForm />
        </AuthGate>
      </SafeAreaView>
    </ThemedView>
  );
}

function UploadForm() {
  const theme = useTheme();
  const { profile } = useAuth();
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [tagsInput, setTagsInput] = useState('');

  const [mainImageUri, setMainImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const [ingredients, setIngredients] = useState<DraftIngredient[]>([emptyIngredient()]);
  const [steps, setSteps] = useState<DraftStep[]>([emptyStep()]);

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  const [servings, setServings] = useState('2');
  const [prepTime, setPrepTime] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryId(undefined);
    setTagsInput('');
    setMainImageUri(null);
    setVideoUri(null);
    setIngredients([emptyIngredient()]);
    setSteps([emptyStep()]);
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
    setServings('2');
    setPrepTime('');
    setDifficulty(null);
  };

  const pickMainImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Zugriff benötigt', 'Bitte erlaube den Zugriff auf deine Fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsEditing: true, aspect: [4, 5] });
    if (!result.canceled) setMainImageUri(result.assets[0].uri);
  };

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Zugriff benötigt', 'Bitte erlaube den Zugriff auf deine Videos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE_BYTES) {
      Alert.alert('Video zu groß', 'Bitte wähle ein Video unter 80 MB.');
      return;
    }
    setVideoUri(asset.uri);
  };

  const updateIngredient = (index: number, patch: Partial<DraftIngredient>) => {
    setIngredients((current) => current.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  };
  const removeIngredient = (index: number) => setIngredients((current) => current.filter((_, i) => i !== index));

  const updateStep = (index: number, text: string) => {
    setSteps((current) => current.map((step, i) => (i === index ? { text } : step)));
  };
  const removeStep = (index: number) => setSteps((current) => current.filter((_, i) => i !== index));

  const validate = (): string | null => {
    if (title.trim().length < 2) return 'Bitte gib einen Rezeptnamen ein.';
    if (!mainImageUri) return 'Bitte wähle ein Hauptbild aus.';
    const validIngredients = ingredients.filter((i) => i.name.trim().length > 0);
    if (validIngredients.length === 0) return 'Bitte füge mindestens eine Zutat hinzu.';
    const validSteps = steps.filter((s) => s.text.trim().length > 0);
    if (validSteps.length === 0) return 'Bitte füge mindestens einen Zubereitungsschritt hinzu.';
    const servingsNum = Number(servings);
    if (!servingsNum || servingsNum < 1) return 'Bitte gib eine gültige Portionsanzahl ein.';
    return null;
  };

  const handlePublish = async () => {
    if (!profile) return;
    const validationError = validate();
    if (validationError) {
      Alert.alert('Fast fertig', validationError);
      return;
    }

    setIsPublishing(true);
    try {
      const mainImageUrl = await uploadRecipeImage(profile.id, mainImageUri!);
      const videoUrl = videoUri ? await uploadRecipeVideo(profile.id, videoUri) : null;

      const parsedIngredients: Ingredient[] = ingredients
        .filter((i) => i.name.trim().length > 0)
        .map((i) => ({ amount: i.amount.trim() ? Number(i.amount.replace(',', '.')) : null, unit: i.unit.trim(), name: i.name.trim() }));

      const parsedSteps = steps
        .filter((s) => s.text.trim().length > 0)
        .map((s, index) => ({ order: index + 1, text: s.text.trim() }));

      const tags = tagsInput
        .split(/[,#]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const recipe = await createRecipe({
        author_id: profile.id,
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId ?? null,
        tags,
        main_image_url: mainImageUrl,
        additional_image_urls: [],
        video_url: videoUrl,
        ingredients: parsedIngredients,
        steps: parsedSteps,
        calories: calories.trim() ? Math.round(Number(calories.replace(',', '.'))) : null,
        protein_g: protein.trim() ? Number(protein.replace(',', '.')) : null,
        carbohydrates_g: carbs.trim() ? Number(carbs.replace(',', '.')) : null,
        fat_g: fat.trim() ? Number(fat.replace(',', '.')) : null,
        fiber_g: fiber.trim() ? Number(fiber.replace(',', '.')) : null,
        servings: Math.round(Number(servings)),
        prep_time_minutes: prepTime.trim() ? Math.round(Number(prepTime)) : null,
        difficulty,
      });

      await queryClient.invalidateQueries({ queryKey: ['recipe-feed'] });
      await queryClient.invalidateQueries({ queryKey: ['user-recipes', profile.id] });

      resetForm();
      Alert.alert('Veröffentlicht!', 'Dein Rezept ist jetzt im Feed sichtbar.', [
        { text: 'Ansehen', onPress: () => router.push(`/recipe/${recipe.id}`) },
      ]);
    } catch (error) {
      Alert.alert('Fehler beim Veröffentlichen', error instanceof Error ? error.message : 'Bitte versuche es erneut.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={styles.title}>
          Rezept hochladen
        </ThemedText>

        <FormSection title="Grundinformationen">
          <TextField label="Rezeptname" value={title} onChangeText={setTitle} placeholder="z. B. High Protein Rice Pudding" />
          <TextField
            label="Beschreibung"
            value={description}
            onChangeText={setDescription}
            placeholder="Worum geht's bei diesem Rezept?"
            multiline
            numberOfLines={3}
            style={styles.multiline}
          />
          {categories && categories.length > 0 ? (
            <View style={styles.field}>
              <ThemedText type="smallBold">Kategorie</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    selected={categoryId === category.id}
                    onPress={() => setCategoryId((current) => (current === category.id ? undefined : category.id))}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
          <TextField label="Tags" value={tagsInput} onChangeText={setTagsInput} placeholder="highprotein, mealprep, gymfood" autoCapitalize="none" />
        </FormSection>

        <FormSection title="Medien">
          <Pressable onPress={pickMainImage} style={[styles.mediaPicker, { backgroundColor: theme.backgroundElement }]}>
            {mainImageUri ? (
              <Image source={{ uri: mainImageUri }} style={styles.mediaPreview} contentFit="cover" />
            ) : (
              <View style={styles.mediaPlaceholder}>
                <Ionicons name="image-outline" size={28} color={theme.textTertiary} />
                <ThemedText type="small" themeColor="textSecondary">
                  Hauptbild auswählen
                </ThemedText>
              </View>
            )}
          </Pressable>

          <Pressable onPress={pickVideo} style={[styles.videoPicker, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="videocam-outline" size={20} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary">{videoUri ? 'Video ausgewählt ✓' : 'Video hinzufügen (optional)'}</ThemedText>
          </Pressable>
        </FormSection>

        <FormSection title="Zutaten">
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <TextInput
                value={ingredient.amount}
                onChangeText={(v) => updateIngredient(index, { amount: v })}
                placeholder="100"
                keyboardType="decimal-pad"
                placeholderTextColor={theme.textTertiary}
                style={[styles.ingredientAmount, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
              <TextInput
                value={ingredient.unit}
                onChangeText={(v) => updateIngredient(index, { unit: v })}
                placeholder="g"
                placeholderTextColor={theme.textTertiary}
                style={[styles.ingredientUnit, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
              <TextInput
                value={ingredient.name}
                onChangeText={(v) => updateIngredient(index, { name: v })}
                placeholder="Zutat"
                placeholderTextColor={theme.textTertiary}
                style={[styles.ingredientName, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
              {ingredients.length > 1 ? (
                <Pressable onPress={() => removeIngredient(index)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={theme.textTertiary} />
                </Pressable>
              ) : null}
            </View>
          ))}
          <Pressable onPress={() => setIngredients((c) => [...c, emptyIngredient()])} style={styles.addRow}>
            <Ionicons name="add-circle-outline" size={20} color={theme.accent} />
            <ThemedText themeColor="accent" type="smallBold">
              Zutat hinzufügen
            </ThemedText>
          </Pressable>
        </FormSection>

        <FormSection title="Zubereitung">
          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <ThemedText type="smallBold" style={styles.stepIndex}>
                {String(index + 1).padStart(2, '0')}
              </ThemedText>
              <TextInput
                value={step.text}
                onChangeText={(v) => updateStep(index, v)}
                placeholder="Beschreibe diesen Schritt…"
                placeholderTextColor={theme.textTertiary}
                style={[styles.stepInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                multiline
              />
              {steps.length > 1 ? (
                <Pressable onPress={() => removeStep(index)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={theme.textTertiary} />
                </Pressable>
              ) : null}
            </View>
          ))}
          <Pressable onPress={() => setSteps((c) => [...c, emptyStep()])} style={styles.addRow}>
            <Ionicons name="add-circle-outline" size={20} color={theme.accent} />
            <ThemedText themeColor="accent" type="smallBold">
              Schritt hinzufügen
            </ThemedText>
          </Pressable>
        </FormSection>

        <FormSection title="Nährwerte" subtitle="Pro Portion">
          <View style={styles.nutritionGrid}>
            <TextField label="Kalorien (kcal)" value={calories} onChangeText={setCalories} keyboardType="decimal-pad" containerStyle={styles.nutritionField} />
            <TextField label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" containerStyle={styles.nutritionField} />
            <TextField label="Kohlenhydrate (g)" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" containerStyle={styles.nutritionField} />
            <TextField label="Fett (g)" value={fat} onChangeText={setFat} keyboardType="decimal-pad" containerStyle={styles.nutritionField} />
            <TextField label="Ballaststoffe (g)" value={fiber} onChangeText={setFiber} keyboardType="decimal-pad" containerStyle={styles.nutritionField} />
          </View>
        </FormSection>

        <FormSection title="Zusätzliche Informationen">
          <View style={styles.nutritionGrid}>
            <TextField label="Portionen" value={servings} onChangeText={setServings} keyboardType="number-pad" containerStyle={styles.nutritionField} />
            <TextField label="Zubereitungszeit (Min.)" value={prepTime} onChangeText={setPrepTime} keyboardType="number-pad" containerStyle={styles.nutritionField} />
          </View>
          <View style={styles.field}>
            <ThemedText type="smallBold">Schwierigkeitsgrad</ThemedText>
            <View style={styles.chipRow}>
              {DIFFICULTIES.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  selected={difficulty === item.value}
                  onPress={() => setDifficulty((current) => (current === item.value ? null : item.value))}
                />
              ))}
            </View>
          </View>
        </FormSection>

        <Button label={isPublishing ? 'Wird veröffentlicht…' : 'Rezept veröffentlichen'} onPress={handlePublish} disabled={isPublishing} style={styles.publish} />
        {isPublishing ? <ActivityIndicator style={styles.publishSpinner} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
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
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.five },
  title: { fontSize: 26, lineHeight: 32 },
  section: { gap: Spacing.three },
  sectionTitle: { fontSize: 18, lineHeight: 23 },
  field: { gap: Spacing.two },
  chipRow: { gap: Spacing.two, flexDirection: 'row', flexWrap: 'wrap' },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  mediaPicker: {
    borderRadius: Radius.large,
    aspectRatio: 4 / 3,
    overflow: 'hidden',
  },
  mediaPreview: { width: '100%', height: '100%' },
  mediaPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  videoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  ingredientAmount: {
    width: 56,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    fontSize: 15,
  },
  ingredientUnit: {
    width: 48,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    fontSize: 15,
  },
  ingredientName: {
    flex: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    fontSize: 15,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  stepIndex: {
    width: 24,
    paddingTop: 12,
  },
  stepInput: {
    flex: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 44,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  nutritionField: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  publish: {
    marginTop: Spacing.two,
  },
  publishSpinner: {
    marginTop: -Spacing.four,
  },
});
