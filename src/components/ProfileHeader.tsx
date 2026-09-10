import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Profile } from '@/types/database';

export function ProfileHeader({
  profile,
  recipeCount,
  primaryAction,
}: {
  profile: Profile;
  recipeCount: number;
  primaryAction?: { label: string; onPress: () => void; variant?: 'primary' | 'outline' };
}) {
  return (
    <View style={styles.container}>
      <Avatar uri={profile.avatar_url} size={84} ring />
      <ThemedText type="title" style={styles.username}>
        @{profile.username}
      </ThemedText>
      {profile.bio ? (
        <ThemedText themeColor="textSecondary" style={styles.bio}>
          {profile.bio}
        </ThemedText>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <ThemedText type="subtitle" style={styles.statValue}>
            {recipeCount}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Rezepte
          </ThemedText>
        </View>
      </View>

      {primaryAction ? (
        <Button label={primaryAction.label} onPress={primaryAction.onPress} variant={primaryAction.variant ?? 'outline'} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
  username: {
    fontSize: 22,
    lineHeight: 28,
    marginTop: Spacing.two,
  },
  bio: {
    textAlign: 'center',
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.five,
    marginTop: Spacing.three,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
  },
  action: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
});
