import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomSpacing = Math.max(insets.bottom, 6);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarIcon: () => null,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#64748b',
        tabBarActiveBackgroundColor: '#eef2ff',
        tabBarInactiveBackgroundColor: '#ffffff',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          lineHeight: 14,
          textAlign: 'center',
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 2,
          marginVertical: 3,
          borderWidth: 1,
          borderColor: '#e2e8f0',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: bottomSpacing,
          height: 50 + bottomSpacing,
          paddingTop: 4,
          paddingBottom: bottomSpacing,
          paddingHorizontal: 6,
          backgroundColor: '#f8fafc',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          borderRadius: 16,
          elevation: 8,
          shadowColor: '#0f172a',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: {
            width: 0,
            height: 2,
          },
        },
        sceneStyle: {
          backgroundColor: '#ffffff',
          paddingBottom: 74 + bottomSpacing,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="chatter" options={{ title: '채터' }} />
      <Tabs.Screen name="schedules" options={{ title: '일정' }} />
      <Tabs.Screen name="documents" options={{ title: '문서' }} />
      <Tabs.Screen name="chat" options={{ title: '도우미' }} />
      <Tabs.Screen name="voice" options={{ title: '음성' }} />
    </Tabs>
  );
}
