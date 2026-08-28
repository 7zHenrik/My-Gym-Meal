import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_NAME } from '@/constants/app';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Bitte ausfüllen', 'E-Mail und Passwort werden benötigt.');
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(email.trim(), password);
    setIsLoading(false);
    if (error) {
      Alert.alert('Anmeldung fehlgeschlagen', error);
      return;
    }
    router.back();
  };

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} hitSlop={10}>
                <Ionicons name="close" size={26} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="title" style={styles.title}>
              Willkommen zurück
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Melde dich bei {APP_NAME} an, um zu liken, zu speichern und eigene Rezepte zu teilen.
            </ThemedText>

            <View style={styles.form}>
              <TextField
                label="E-Mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholder="du@beispiel.de"
              />
              <TextField
                label="Passwort"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="••••••••"
              />
            </View>

            <Button label="Anmelden" onPress={handleSubmit} loading={isLoading} style={styles.submit} />

            <Pressable onPress={() => router.replace('/auth/register')} style={styles.switchLink}>
              <ThemedText themeColor="textSecondary">
                Noch kein Konto? <ThemedText type="linkPrimary">Jetzt registrieren</ThemedText>
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    marginBottom: Spacing.four,
  },
  form: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  submit: {
    marginBottom: Spacing.three,
  },
  switchLink: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
