import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarIcon: () => null,
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
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
