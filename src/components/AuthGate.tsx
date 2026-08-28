import { router } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthProvider';

export function AuthGate({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();

  if (isLoading) return null;

  if (!session) {
    return (
      <EmptyState
        icon="person-circle-outline"
        title={title}
        message={message}
        actionLabel="Anmelden"
        onAction={() => router.push('/auth/login')}
      />
    );
  }

  return <>{children}</>;
}
