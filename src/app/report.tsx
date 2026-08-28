import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createReport } from '@/api/reports';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/hooks/use-theme';
import { ReportReason } from '@/types/database';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Unangemessener Inhalt' },
  { value: 'misinformation', label: 'Falsche Informationen' },
  { value: 'offensive', label: 'Beleidigender Inhalt' },
  { value: 'other', label: 'Anderes' },
];

export default function ReportScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const { recipeId, commentId } = useLocalSearchParams<{ recipeId?: string; commentId?: string }>();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!profile) return;
    if (!reason) {
      Alert.alert('Grund auswählen', 'Bitte wähle einen Grund für die Meldung aus.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createReport({ reporterId: profile.id, recipeId, commentId, reason, details: details.trim() || undefined });
      Alert.alert('Danke!', 'Deine Meldung wurde übermittelt.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('Fehler', 'Die Meldung konnte nicht gesendet werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="close" size={26} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText type="title" style={styles.title}>
            Inhalt melden
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Warum möchtest du diesen Inhalt melden?
          </ThemedText>

          <View style={styles.reasonList}>
            {REASONS.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setReason(item.value)}
                style={[
                  styles.reasonRow,
                  { backgroundColor: theme.backgroundElement, borderColor: reason === item.value ? theme.accent : 'transparent' },
                ]}>
                <ThemedText>{item.label}</ThemedText>
                <Ionicons
                  name={reason === item.value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={reason === item.value ? theme.accent : theme.textTertiary}
                />
              </Pressable>
            ))}
          </View>

          <TextField
            label="Details (optional)"
            value={details}
            onChangeText={setDetails}
            placeholder="Beschreibe kurz das Problem…"
            multiline
            numberOfLines={3}
            style={styles.detailsInput}
          />

          <Button label="Meldung senden" onPress={handleSubmit} loading={isSubmitting} style={styles.submit} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four },
  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.three },
  title: { fontSize: 26, lineHeight: 32 },
  subtitle: { marginTop: Spacing.one, marginBottom: Spacing.four },
  reasonList: { gap: Spacing.two, marginBottom: Spacing.four },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  detailsInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.four,
  },
  submit: {},
});
