import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CommentWithAuthor } from '@/types/database';
import { formatRelativeTime } from '@/utils/format';

export function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: CommentWithAuthor;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Avatar uri={comment.author?.avatar_url} size={32} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <ThemedText type="smallBold">@{comment.author?.username ?? 'user'}</ThemedText>
          <ThemedText type="small" themeColor="textTertiary">
            {formatRelativeTime(comment.created_at)}
          </ThemedText>
        </View>
        <ThemedText style={styles.text}>{comment.text}</ThemedText>
      </View>
      {canDelete ? (
        <Pressable onPress={onDelete} hitSlop={10}>
          <Ionicons name="trash-outline" size={18} color={theme.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
});
