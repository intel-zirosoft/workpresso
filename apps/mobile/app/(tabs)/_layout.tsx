import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CompactTabBarButton({
  accessibilityState,
  children,
  onLongPress,
  onPress,
  style,
}: BottomTabBarButtonProps) {
  const isFocused = Boolean(accessibilityState?.selected);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      android_ripple={{ color: 'rgba(15, 23, 42, 0.06)', borderless: false }}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.tabButtonFocused,
        pressed && styles.tabButtonPressed,
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.tabButtonInner}>
        {children}
      </View>
      <View style={styles.divider} />
      {isFocused ? <View style={styles.activeIndicator} /> : null}
    </Pressable>
  );
}

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
        tabBarButton: (props) => <CompactTabBarButton {...props} />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          lineHeight: 14,
          textAlign: 'center',
          margin: 0,
          padding: 0,
        },
        tabBarItemStyle: {
          marginHorizontal: 0,
          marginVertical: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: bottomSpacing,
          height: 44 + bottomSpacing,
          paddingTop: 2,
          paddingBottom: bottomSpacing,
          paddingHorizontal: 4,
          backgroundColor: '#ffffff',
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
          paddingBottom: 70 + bottomSpacing,
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

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  tabButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tabButtonFocused: {
    backgroundColor: '#f8fafc',
  },
  tabButtonPressed: {
    opacity: 0.85,
  },
  divider: {
    position: 'absolute',
    right: 0,
    top: 10,
    bottom: 10,
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
  },
  activeIndicator: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 4,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#0f172a',
  },
});
