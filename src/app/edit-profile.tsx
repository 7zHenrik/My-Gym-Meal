import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { updateProfile } from '@/api/profiles';
import { uploadAvatar } from '@/api/storage';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/hooks/use-theme';

export default function EditProfileScreen() {
  const theme = useTheme();
  const { profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!profile) return null;

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Zugriff benötigt', 'Bitte erlaube den Zugriff auf deine Fotos, um ein Profilbild zu wählen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    setIsUploadingAvatar(true);
    try {
      const url = await uploadAvatar(profile.id, result.assets[0].uri);
      setAvatarUrl(url);
    } catch {
      Alert.alert('Fehler', 'Das Profilbild konnte nicht hochgeladen werden.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Benutzername fehlt', 'Bitte gib einen Benutzernamen ein.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile(profile.id, {
        username: username.trim().toLowerCase(),
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      });
      await refreshProfile();
      router.back();
    } catch (error) {
      const message = error instanceof Error && error.message.toLowerCase().includes('duplicate')
        ? 'Dieser Benutzername ist bereits vergeben.'
        : 'Profil konnte nicht gespeichert werden.';
      Alert.alert('Fehler', message);
    } finally {
      setIsSaving(false);
    }
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
              <ThemedText type="smallBold">Profil bearbeiten</ThemedText>
              <View style={{ width: 26 }} />
            </View>

            <Pressable onPress={pickAvatar} style={styles.avatarWrapper} disabled={isUploadingAvatar}>
              <Avatar uri={avatarUrl} size={96} />
              <View style={[styles.avatarBadge, { backgroundColor: theme.accent }]}>
                <Ionicons name="camera" size={16} color={theme.accentText} />
              </View>
            </Pressable>

            <View style={styles.form}>
              <TextField label="Benutzername" value={username} onChangeText={setUsername} autoCapitalize="none" />
              <TextField label="Anzeigename" value={displayName} onChangeText={setDisplayName} placeholder="Optional" />
              <TextField
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Erzähl kurz etwas über dich…"
                multiline
                numberOfLines={3}
                style={styles.bioInput}
              />
            </View>

            <Button label="Speichern" onPress={handleSave} loading={isSaving} style={styles.save} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.two },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: Spacing.four,
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  save: {
    marginBottom: Spacing.three,
  },
});
