import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { ColorValue, Platform, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, color, size = 24 }: { name: IconName; color: ColorValue; size?: number }) {
  return <Ionicons name={name} size={size} color={color as string} />;
}

export default function TabsLayout() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle:
          Platform.OS === 'ios'
            ? styles.tabBarFloating
            : [styles.tabBar, { backgroundColor: theme.background, borderTopColor: theme.border }],
        tabBarBackground:
          Platform.OS === 'ios'
            ? () => <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            : undefined,
        tabBarLabelStyle: styles.label,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Entdecken',
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'compass' : 'compass-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Hochladen',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'add-circle' : 'add-circle-outline'} color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Gespeichert',
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'bookmark' : 'bookmark-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarFloating: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
