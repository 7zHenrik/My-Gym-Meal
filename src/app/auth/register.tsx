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

const USERNAME_REGEX = /^[a-z0-9_.]{3,30}$/;

export default function RegisterScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const usernameError = username.length > 0 && !USERNAME_REGEX.test(username.toLowerCase())
    ? 'Nur Kleinbuchstaben, Zahlen, _ und . (3–30 Zeichen)'
    : null;

  const handleSubmit = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('Bitte ausfüllen', 'Alle Felder werden benötigt.');
      return;
    }
    if (!USERNAME_REGEX.test(username.toLowerCase())) {
      Alert.alert('Ungültiger Benutzername', 'Nur Kleinbuchstaben, Zahlen, _ und . (3–30 Zeichen).');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Passwort zu kurz', 'Das Passwort muss mindestens 6 Zeichen haben.');
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(email.trim(), password, username);
    setIsLoading(false);
    if (error) {
      Alert.alert('Registrierung fehlgeschlagen', error);
      return;
    }
    Alert.alert('Willkommen!', 'Dein Konto wurde erstellt.', [{ text: 'OK', onPress: () => router.back() }]);
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
              Konto erstellen
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Werde Teil von {APP_NAME} und teile deine besten Fitness-Rezepte.
            </ThemedText>

            <View style={styles.form}>
              <TextField
                label="Benutzername"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="dein_username"
                error={usernameError}
              />
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
                placeholder="Mindestens 6 Zeichen"
              />
            </View>

            <Button label="Registrieren" onPress={handleSubmit} loading={isLoading} style={styles.submit} />

            <Pressable onPress={() => router.replace('/auth/login')} style={styles.switchLink}>
              <ThemedText themeColor="textSecondary">
                Schon ein Konto? <ThemedText type="linkPrimary">Jetzt anmelden</ThemedText>
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
