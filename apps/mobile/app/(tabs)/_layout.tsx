import { Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabIconKind = 'home' | 'chatter' | 'schedules' | 'documents' | 'ai' | 'voice';

function TabIcon({
  color,
  kind,
}: {
  color: string;
  kind: TabIconKind;
}) {
  if (kind === 'home') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.homeRoof, { backgroundColor: color }]} />
        <View style={[styles.homeBody, { borderColor: color }]} />
      </View>
    );
  }

  if (kind === 'chatter') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.chatBubble, { borderColor: color }]}>
          <View style={[styles.chatLine, { backgroundColor: color }]} />
          <View style={[styles.chatLineShort, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  if (kind === 'schedules') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.calendarBox, { borderColor: color }]}>
          <View style={[styles.calendarBar, { backgroundColor: color }]} />
          <View style={styles.calendarDotsRow}>
            <View style={[styles.calendarDot, { backgroundColor: color }]} />
            <View style={[styles.calendarDot, { backgroundColor: color }]} />
          </View>
        </View>
      </View>
    );
  }

  if (kind === 'documents') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.documentBox, { borderColor: color }]}>
          <View style={[styles.documentLine, { backgroundColor: color }]} />
          <View style={[styles.documentLine, { backgroundColor: color }]} />
          <View style={[styles.documentLineShort, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  if (kind === 'ai') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.aiCenterDot, { backgroundColor: color }]} />
        <View style={[styles.aiTopDot, { backgroundColor: color }]} />
        <View style={[styles.aiRightDot, { backgroundColor: color }]} />
        <View style={[styles.aiBottomDot, { backgroundColor: color }]} />
        <View style={[styles.aiLeftDot, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.iconFrame}>
      <View style={styles.voiceBars}>
        <View style={[styles.voiceBarShort, { backgroundColor: color }]} />
        <View style={[styles.voiceBarTall, { backgroundColor: color }]} />
        <View style={[styles.voiceBarMid, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomSpacing = Math.max(insets.bottom, 6);
  const tabBarHeight = 58 + bottomSpacing;
  const sceneBottomInset = tabBarHeight + 10;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#64748b',
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarIconStyle: {
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarIcon: ({ color }) => {
          return <TabIcon color={color} kind="home" />;
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          lineHeight: 14,
          includeFontPadding: false,
          textAlign: 'center',
          textAlignVertical: 'center',
          marginTop: 0,
          marginBottom: 2,
          paddingVertical: 0,
        },
        tabBarItemStyle: {
          marginHorizontal: 0,
          marginVertical: 0,
          height: 44,
          paddingVertical: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 0,
          paddingBottom: bottomSpacing,
          paddingHorizontal: 8,
          backgroundColor: '#f8fafc',
          borderTopWidth: 0,
          borderRadius: 22,
          marginHorizontal: 12,
          marginBottom: 10,
          position: 'absolute',
          elevation: 10,
          shadowColor: '#0f172a',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: {
            width: 0,
            height: 6,
          },
        },
        sceneStyle: {
          backgroundColor: '#f4f7fb',
          paddingBottom: sceneBottomInset,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <TabIcon color={color} kind="home" />,
        }}
      />
      <Tabs.Screen
        name="chatter"
        options={{
          title: '메신저',
          tabBarIcon: ({ color }) => <TabIcon color={color} kind="chatter" />,
        }}
      />
      <Tabs.Screen
        name="schedules"
        options={{
          title: '일정',
          tabBarIcon: ({ color }) => <TabIcon color={color} kind="schedules" />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: '문서',
          tabBarIcon: ({ color }) => <TabIcon color={color} kind="documents" />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => <TabIcon color={color} kind="ai" />,
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: '음성',
          tabBarIcon: ({ color }) => <TabIcon color={color} kind="voice" />,
        }}
      />
    </Tabs>
  );
}

const styles = {
  iconFrame: {
    width: 18,
    height: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
  },
  homeRoof: {
    width: 10,
    height: 2,
    borderRadius: 999,
    marginBottom: 1,
  },
  homeBody: {
    width: 12,
    height: 8,
    borderWidth: 1.5,
    borderRadius: 3,
  },
  chatBubble: {
    width: 13,
    height: 10,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 2,
    justifyContent: 'center' as const,
    gap: 2,
  },
  chatLine: {
    width: 7,
    height: 1.5,
    borderRadius: 999,
  },
  chatLineShort: {
    width: 5,
    height: 1.5,
    borderRadius: 999,
  },
  calendarBox: {
    width: 13,
    height: 13,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center' as const,
    paddingTop: 2,
  },
  calendarBar: {
    width: 7,
    height: 1.5,
    borderRadius: 999,
    marginBottom: 2,
  },
  calendarDotsRow: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  calendarDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 999,
  },
  documentBox: {
    width: 11,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    paddingTop: 2,
    paddingHorizontal: 2,
    gap: 2,
  },
  documentLine: {
    width: 6,
    height: 1.5,
    borderRadius: 999,
  },
  documentLineShort: {
    width: 4,
    height: 1.5,
    borderRadius: 999,
  },
  aiCenterDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    position: 'absolute' as const,
  },
  aiTopDot: {
    width: 2,
    height: 2,
    borderRadius: 999,
    position: 'absolute' as const,
    top: 3,
  },
  aiRightDot: {
    width: 2,
    height: 2,
    borderRadius: 999,
    position: 'absolute' as const,
    right: 3,
  },
  aiBottomDot: {
    width: 2,
    height: 2,
    borderRadius: 999,
    position: 'absolute' as const,
    bottom: 3,
  },
  aiLeftDot: {
    width: 2,
    height: 2,
    borderRadius: 999,
    position: 'absolute' as const,
    left: 3,
  },
  voiceBars: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 2,
    height: 12,
  },
  voiceBarShort: {
    width: 2.5,
    height: 5,
    borderRadius: 999,
  },
  voiceBarTall: {
    width: 2.5,
    height: 10,
    borderRadius: 999,
  },
  voiceBarMid: {
    width: 2.5,
    height: 7,
    borderRadius: 999,
  },
};
