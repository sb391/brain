import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brain, TrendingUp, TrendingDown, Lightbulb, ChevronLeft, Sparkles, Zap } from 'lucide-react-native';
import { Colors, getTier, Tiers } from '@/constants/colors';
import { generateInsights } from '@/constants/insights';
import * as Haptics from 'expo-haptics';

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    total: string;
    reaction: string;
    memory: string;
    logic: string;
    reactionMs: string;
    memoryCorrect: string;
    memoryTotal: string;
    logicCorrect: string;
  }>();

  const total = Number(params.total) || 0;
  const tier = useMemo(() => getTier(total), [total]);
  const tierStyle = Tiers[tier];

  const insights = useMemo(() => generateInsights({
    total,
    reaction: Number(params.reaction) || 0,
    memory: Number(params.memory) || 0,
    logic: Number(params.logic) || 0,
    reactionMs: Number(params.reactionMs) || 500,
    memoryCorrect: Number(params.memoryCorrect) || 0,
    memoryTotal: Number(params.memoryTotal) || 5,
    logicCorrect: params.logicCorrect === 'true',
  }), [total, params.reaction, params.memory, params.logic, params.reactionMs, params.memoryCorrect, params.memoryTotal, params.logicCorrect]);

  const headerFade = useRef(new Animated.Value(0)).current;
  const brainTypeFade = useRef(new Animated.Value(0)).current;
  const brainTypeSlide = useRef(new Animated.Value(30)).current;
  const strengthsFade = useRef(new Animated.Value(0)).current;
  const strengthsSlide = useRef(new Animated.Value(30)).current;
  const weaknessesFade = useRef(new Animated.Value(0)).current;
  const weaknessesSlide = useRef(new Animated.Value(30)).current;
  const suggestionsFade = useRef(new Animated.Value(0)).current;
  const suggestionsSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(brainTypeFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(brainTypeSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(strengthsFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(strengthsSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 500);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(weaknessesFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(weaknessesSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 800);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(suggestionsFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(suggestionsSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 1100);
  }, [headerFade, brainTypeFade, brainTypeSlide, strengthsFade, strengthsSlide, weaknessesFade, weaknessesSlide, suggestionsFade, suggestionsSlide]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="insights-back"
        >
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Sparkles size={18} color={Colors.amber} />
          <Text style={styles.headerTitle}>Full Insights</Text>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.brainTypeCard, {
          opacity: brainTypeFade,
          transform: [{ translateY: brainTypeSlide }],
          borderColor: `${tierStyle.color}25`,
        }]}>
          <View style={styles.brainTypeHeader}>
            <View style={[styles.brainTypeIconWrap, { backgroundColor: `${tierStyle.color}15` }]}>
              <Brain size={28} color={tierStyle.color} />
            </View>
            <View style={styles.brainTypeLabelWrap}>
              <Text style={styles.brainTypeLabel}>YOUR BRAIN TYPE</Text>
              <Text style={[styles.brainTypeName, { color: tierStyle.color }]}>{insights.brainType}</Text>
            </View>
          </View>
          <Text style={styles.brainTypeDesc}>{insights.brainTypeDescription}</Text>
          <View style={[styles.scoreChip, { backgroundColor: `${tierStyle.color}12` }]}>
            <Zap size={14} color={tierStyle.color} />
            <Text style={[styles.scoreChipText, { color: tierStyle.color }]}>
              BrainScore: {total} — {tier}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, {
          opacity: strengthsFade,
          transform: [{ translateY: strengthsSlide }],
        }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: Colors.greenGlow }]}>
              <TrendingUp size={20} color={Colors.green} />
            </View>
            <Text style={styles.sectionTitle}>Strengths</Text>
          </View>
          {insights.strengths.map((s, i) => (
            <View key={i} style={styles.insightRow}>
              <View style={[styles.bulletDot, { backgroundColor: Colors.green }]} />
              <Text style={styles.insightText}>{s}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.section, {
          opacity: weaknessesFade,
          transform: [{ translateY: weaknessesSlide }],
        }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: Colors.amberGlow }]}>
              <TrendingDown size={20} color={Colors.amber} />
            </View>
            <Text style={styles.sectionTitle}>Growth Areas</Text>
          </View>
          {insights.weaknesses.map((w, i) => (
            <View key={i} style={styles.insightRow}>
              <View style={[styles.bulletDot, { backgroundColor: Colors.amber }]} />
              <Text style={styles.insightText}>{w}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.section, styles.lastSection, {
          opacity: suggestionsFade,
          transform: [{ translateY: suggestionsSlide }],
        }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
              <Lightbulb size={20} color="#A78BFA" />
            </View>
            <Text style={styles.sectionTitle}>How to Improve</Text>
          </View>
          {insights.suggestions.map((s, i) => (
            <View key={i} style={styles.suggestionCard}>
              <Text style={styles.suggestionNumber}>{i + 1}</Text>
              <Text style={styles.suggestionText}>{s}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  brainTypeCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
  },
  brainTypeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 16,
  },
  brainTypeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  brainTypeLabelWrap: {
    flex: 1,
  },
  brainTypeLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  brainTypeName: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  brainTypeDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  scoreChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreChipText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  section: {
    marginBottom: 20,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  insightRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginBottom: 12,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  suggestionCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    alignItems: 'flex-start' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionNumber: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#A78BFA',
    width: 24,
    textAlign: 'center' as const,
    marginTop: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
});
