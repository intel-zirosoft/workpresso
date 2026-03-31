import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomSpacing = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarIcon: () => null,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          borderRadius: 14,
          marginHorizontal: 2,
          marginVertical: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: bottomSpacing,
          height: 68 + bottomSpacing,
          paddingTop: 10,
          paddingBottom: bottomSpacing,
          paddingHorizontal: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          borderRadius: 22,
          elevation: 12,
          shadowColor: '#0f172a',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: {
            width: 0,
            height: 4,
          },
        },
        sceneStyle: {
          backgroundColor: '#ffffff',
          paddingBottom: 96 + bottomSpacing,
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
