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

type BriefingCard = {
  description: string;
  eyebrow: string;
  href: Href;
  label: string;
  meta: string;
  tone: 'amber' | 'blue' | 'mint';
};

const TODAY_BRIEFINGS: BriefingCard[] = [
  {
    description: '승인하거나 반려할 문서를 가장 먼저 확인합니다.',
    eyebrow: '문서',
    href: MOBILE_APP_SECTIONS.documents.href,
    label: '승인 대기 문서',
    meta: '지금 처리',
    tone: 'amber',
  },
  {
    description: '읽지 않은 메시지와 브리핑을 빠르게 확인합니다.',
    eyebrow: '채터',
    href: MOBILE_APP_SECTIONS.chatter.href,
    label: '읽지 않은 채터',
    meta: '먼저 확인',
    tone: 'blue',
  },
  {
    description: '오늘 예정된 일정과 회의를 한 번에 확인합니다.',
    eyebrow: '일정',
    href: MOBILE_APP_SECTIONS.schedules.href,
    label: '오늘 일정',
    meta: '오늘 기준',
    tone: 'mint',
  },
];

export function MobileHomeHub() {
  const router = useRouter();
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ko-KR', {
        day: 'numeric',
        month: 'long',
        weekday: 'short',
      }).format(new Date()),
    [],
  );

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
          <Text style={styles.heroEyebrow}>오늘의 브리핑</Text>
          <Text style={styles.heroTitle}>가장 중요한 일부터 빠르게 확인하세요.</Text>
          <Text style={styles.heroDescription}>
            {todayLabel} · 문서 승인, 읽지 않은 채터, 오늘 일정만 우선 보여주는
            모바일 업무 홈입니다.
          </Text>
          <View style={styles.heroSummaryRow}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipText}>승인 우선</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipText}>채터 확인</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipText}>일정 체크</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>오늘 바로 볼 것</Text>
          <Text style={styles.sectionDescription}>
            한 화면에서 세 가지 핵심 업무만 우선 확인합니다.
          </Text>
        </View>

        <View style={styles.briefingList}>
          {TODAY_BRIEFINGS.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => navigateTo(item.href)}
              style={({ pressed }) => [
                styles.briefingCard,
                styles[`briefingCard_${item.tone}`],
                pressed && styles.briefingCardPressed,
              ]}
            >
              <View style={styles.briefingTopRow}>
                <Text style={styles.cardEyebrow}>{item.eyebrow}</Text>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{item.meta}</Text>
                </View>
              </View>
              <Text style={styles.briefingTitle}>{item.label}</Text>
              <Text style={styles.briefingDescription}>{item.description}</Text>
              <View style={styles.cardCtaRow}>
                <Text style={styles.cardCtaText}>바로 보기</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroEyebrow: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 31,
  },
  heroDescription: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
  },
  heroSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  summaryChip: {
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    gap: 6,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 21,
    fontWeight: '800',
  },
  sectionDescription: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
  },
  briefingList: {
    gap: 12,
  },
  briefingCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 10,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  briefingCardPressed: {
    transform: [{ scale: 0.985 }],
  },
  briefingCard_amber: {
    backgroundColor: '#fffaf0',
    borderColor: '#fde7b0',
  },
  briefingCard_blue: {
    backgroundColor: '#f6f9ff',
    borderColor: '#d9e6ff',
  },
  briefingCard_mint: {
    backgroundColor: '#f2fbf8',
    borderColor: '#cfeee3',
  },
  briefingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardEyebrow: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metaBadge: {
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaBadgeText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  briefingTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  briefingDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  cardCtaRow: {
    marginTop: 2,
  },
  cardCtaText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '800',
  },
});
