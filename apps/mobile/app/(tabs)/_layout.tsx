import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomSpacing = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarIcon: () => null,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#64748b',
        tabBarActiveBackgroundColor: '#e2e8f0',
        tabBarInactiveBackgroundColor: '#f8fafc',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 3,
          marginVertical: 3,
          borderWidth: 1,
          borderColor: '#e2e8f0',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: bottomSpacing,
          height: 56 + bottomSpacing,
          paddingTop: 6,
          paddingBottom: bottomSpacing,
          paddingHorizontal: 6,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          borderRadius: 18,
          elevation: 10,
          shadowColor: '#0f172a',
          shadowOpacity: 0.1,
          shadowRadius: 10,
          shadowOffset: {
            width: 0,
            height: 3,
          },
        },
        sceneStyle: {
          backgroundColor: '#ffffff',
          paddingBottom: 82 + bottomSpacing,
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
