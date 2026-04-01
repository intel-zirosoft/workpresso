import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOBILE_APP_SECTIONS } from '../../shared/app-sections';

type HomeAction = {
  description: string;
  eyebrow: string;
  href: Href;
  label: string;
};

const QUICK_BRIEFING_ITEMS: HomeAction[] = [
  {
    description: '승인 대기 문서와 결재 처리',
    eyebrow: '문서',
    href: MOBILE_APP_SECTIONS.documents.href,
    label: '승인 대기 확인',
  },
  {
    description: '읽지 않은 채널과 브리핑 확인',
    eyebrow: '채터',
    href: MOBILE_APP_SECTIONS.chatter.href,
    label: '읽지 않은 대화 보기',
  },
  {
    description: '오늘 일정과 회의 확인',
    eyebrow: '일정',
    href: MOBILE_APP_SECTIONS.schedules.href,
    label: '오늘 일정 보기',
  },
];

const PRIMARY_ACTIONS: HomeAction[] = [
  {
    description: '승인/반려가 필요한 문서를 바로 확인합니다.',
    eyebrow: '즉시 처리',
    href: MOBILE_APP_SECTIONS.documents.href,
    label: '문서 처리',
  },
  {
    description: '읽지 않은 채널과 최근 브리핑을 먼저 살펴봅니다.',
    eyebrow: '즉시 확인',
    href: MOBILE_APP_SECTIONS.chatter.href,
    label: '채터 확인',
  },
  {
    description: '업무 요약이나 빠른 질의를 바로 시작합니다.',
    eyebrow: '빠른 질의',
    href: MOBILE_APP_SECTIONS.chat.href,
    label: '도우미 열기',
  },
];

const QUICK_LINKS: HomeAction[] = [
  {
    description: '읽지 않은 채널과 팀 브리핑 확인',
    eyebrow: '채터',
    href: MOBILE_APP_SECTIONS.chatter.href,
    label: '채터',
  },
  {
    description: '오늘 일정과 다가오는 회의 확인',
    eyebrow: '일정',
    href: MOBILE_APP_SECTIONS.schedules.href,
    label: '일정',
  },
  {
    description: '승인 대기 문서와 결재 처리',
    eyebrow: '문서',
    href: MOBILE_APP_SECTIONS.documents.href,
    label: '문서',
  },
  {
    description: 'AI에게 지금 필요한 업무 질문하기',
    eyebrow: '도우미',
    href: MOBILE_APP_SECTIONS.chat.href,
    label: '도우미',
  },
  {
    description: '회의/음성 기록 화면으로 바로 이동',
    eyebrow: '음성',
    href: MOBILE_APP_SECTIONS.voice.href,
    label: '음성',
  },
];

export function MobileHomeHub() {
  const router = useRouter();
  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat('ko-KR', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    }).format(new Date());
  }, []);

  const navigateTo = (href: Href) => {
    router.navigate(href);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        bounces
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>오늘의 앱 홈</Text>
          <Text style={styles.heroTitle}>오늘 확인할 것부터 빠르게 시작하세요.</Text>
          <Text style={styles.heroDescription}>
            {todayLabel} · 승인 대기, 읽지 않은 채터, 오늘 일정을 먼저 확인하는
            모바일 브리핑 허브입니다.
          </Text>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>승인 대기</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>읽지 않은 채터</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>오늘 일정</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘 확인할 것</Text>
          <Text style={styles.sectionDescription}>
            먼저 살펴볼 핵심 업무를 한 화면에 모았습니다.
          </Text>
          <View style={styles.briefingList}>
            {QUICK_BRIEFING_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => navigateTo(item.href)}
                style={styles.briefingCard}
              >
                <Text style={styles.cardEyebrow}>{item.eyebrow}</Text>
                <Text style={styles.briefingTitle}>{item.label}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>바로 처리할 것</Text>
          <Text style={styles.sectionDescription}>
            지금 한 번 탭해서 바로 이어갈 수 있는 핵심 액션입니다.
          </Text>
          <View style={styles.primaryActionList}>
            {PRIMARY_ACTIONS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => navigateTo(item.href)}
                style={styles.primaryActionCard}
              >
                <Text style={styles.cardEyebrow}>{item.eyebrow}</Text>
                <Text style={styles.primaryActionTitle}>{item.label}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 이동</Text>
          <Text style={styles.sectionDescription}>
            문서, 채터, 일정, 도우미, 음성 탭으로 바로 이동할 수 있습니다.
          </Text>
          <View style={styles.quickLinkGrid}>
            {QUICK_LINKS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => navigateTo(item.href)}
                style={styles.quickLinkCard}
              >
                <Text style={styles.cardEyebrow}>{item.eyebrow}</Text>
                <Text style={styles.quickLinkTitle}>{item.label}</Text>
                <Text style={styles.quickLinkDescription}>{item.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 18,
  },
  heroCard: {
    borderRadius: 28,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 10,
  },
  heroEyebrow: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  heroDescription: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  heroBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionDescription: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
  },
  briefingList: {
    gap: 10,
  },
  briefingCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 6,
  },
  primaryActionList: {
    gap: 10,
  },
  primaryActionCard: {
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 6,
  },
  quickLinkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickLinkCard: {
    width: '48.5%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  cardEyebrow: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  briefingTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  primaryActionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  quickLinkTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  cardDescription: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
  },
  quickLinkDescription: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },
});
