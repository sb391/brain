import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ChevronLeft,
  Sparkles,
  Zap,
  Crosshair,
  Eye,
  Target,
  Trophy,
  Activity,
  Gauge,
  Shield,
  ArrowUpRight,
} from 'lucide-react-native';
import { Colors, getTier, Tiers } from '@/constants/colors';
import { generateInsights } from '@/constants/insights';
import type { TestResult } from '@/constants/gameData';
import type { ScoreEntry } from '@/lib/scoreHistory';
import { getScoreHistory } from '@/lib/scoreHistory';
import ScoreTrendChart from '@/components/ScoreTrendChart';
import RadarChart from '@/components/RadarChart';
import type { RadarDataPoint } from '@/components/RadarChart';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 72;
const CHART_HEIGHT = 180;
const RADAR_SIZE = Math.min(SCREEN_WIDTH - 80, 280);

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data: string }>();

  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);

  const testResults = useMemo<TestResult[]>(() => {
    try {
      const parsed = JSON.parse(params.data || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.data]);

  const totalScore = useMemo(() => testResults.reduce((s, r) => s + r.score, 0), [testResults]);
  const tier = useMemo(() => getTier(totalScore), [totalScore]);
  const tierStyle = Tiers[tier];

  const insights = useMemo(() => generateInsights(testResults), [testResults]);

  useEffect(() => {
    getScoreHistory().then(setScoreHistory).catch(() => setScoreHistory([]));
  }, []);

  const radarData = useMemo<RadarDataPoint[]>(() => [
    { label: 'Reaction', value: insights.skillLevels.reaction, color: Colors.amber },
    { label: 'Memory', value: insights.skillLevels.memory, color: Colors.teal },
    { label: 'Focus', value: insights.skillLevels.focus, color: '#60A5FA' },
    { label: 'Logic', value: insights.skillLevels.logic, color: Colors.amber },
    { label: 'Decision', value: insights.skillLevels.decision, color: '#F472B6' },
  ], [insights.skillLevels]);

  const headerFade = useRef(new Animated.Value(0)).current;
  const sectionAnims = useRef(
    Array.from({ length: 8 }, () => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(30),
    }))
  ).current;

  useEffect(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    sectionAnims.forEach(({ fade, slide }, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
      }, 200 + i * 250);
    });
  }, [headerFade, sectionAnims]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const ic = insights.identityCard;
  const ms = insights.milestone;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.7}
          testID="insights-back"
        >
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Sparkles size={18} color={Colors.amber} />
          <Text style={styles.headerTitle}>Brain Analysis</Text>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* BRAIN IDENTITY CARD */}
        <Animated.View style={[styles.identityCard, {
          opacity: sectionAnims[0].fade,
          transform: [{ translateY: sectionAnims[0].slide }],
          borderColor: `${tierStyle.color}25`,
        }]}>
          <View style={styles.identityHeader}>
            <View style={[styles.identityIconWrap, { backgroundColor: `${tierStyle.color}15` }]}>
              <Brain size={32} color={tierStyle.color} />
            </View>
            <View style={styles.identityTitleWrap}>
              <Text style={styles.identityLabel}>BRAIN TYPE</Text>
              <Text style={[styles.identityName, { color: tierStyle.color }]} numberOfLines={1}>
                {ic.brainType}
              </Text>
            </View>
          </View>

          <View style={styles.identityStats}>
            <View style={styles.identityStat}>
              <View style={styles.identityStatIcon}>
                <Zap size={14} color={Colors.amber} />
              </View>
              <Text style={styles.identityStatLabel}>Speed</Text>
              <View style={[styles.identityStatBadge, {
                backgroundColor: ic.speed === 'High' ? Colors.greenGlow : ic.speed === 'Medium' ? Colors.amberGlow : Colors.redGlow,
              }]}>
                <Text style={[styles.identityStatValue, {
                  color: ic.speed === 'High' ? Colors.green : ic.speed === 'Medium' ? Colors.amber : Colors.red,
                }]}>{ic.speed}</Text>
              </View>
            </View>

            <View style={styles.identityStat}>
              <View style={styles.identityStatIcon}>
                <Target size={14} color="#60A5FA" />
              </View>
              <Text style={styles.identityStatLabel}>Accuracy</Text>
              <View style={[styles.identityStatBadge, {
                backgroundColor: ic.accuracy === 'High' ? Colors.greenGlow : ic.accuracy === 'Medium' ? Colors.amberGlow : Colors.redGlow,
              }]}>
                <Text style={[styles.identityStatValue, {
                  color: ic.accuracy === 'High' ? Colors.green : ic.accuracy === 'Medium' ? Colors.amber : Colors.red,
                }]}>{ic.accuracy}</Text>
              </View>
            </View>

            <View style={styles.identityStat}>
              <View style={styles.identityStatIcon}>
                <Eye size={14} color={Colors.teal} />
              </View>
              <Text style={styles.identityStatLabel}>Focus</Text>
              <View style={[styles.identityStatBadge, {
                backgroundColor: ic.focus === 'Stable' ? Colors.greenGlow : Colors.amberGlow,
              }]}>
                <Text style={[styles.identityStatValue, {
                  color: ic.focus === 'Stable' ? Colors.green : Colors.amber,
                }]}>{ic.focus}</Text>
              </View>
            </View>

            <View style={styles.identityStat}>
              <View style={styles.identityStatIcon}>
                <Gauge size={14} color="#F472B6" />
              </View>
              <Text style={styles.identityStatLabel}>Decisions</Text>
              <View style={[styles.identityStatBadge, { backgroundColor: 'rgba(244,114,182,0.12)' }]}>
                <Text style={[styles.identityStatValue, { color: '#F472B6' }]}>
                  {ic.decisionStyle}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.scoreChip, { backgroundColor: `${tierStyle.color}12` }]}>
            <Zap size={14} color={tierStyle.color} />
            <Text style={[styles.scoreChipText, { color: tierStyle.color }]}>
              BrainScore: {totalScore} — {tier}
            </Text>
          </View>
        </Animated.View>

        {/* MILESTONE HOOK */}
        {ms.nextTier && ms.pointsAway > 0 && (
          <Animated.View style={[styles.milestoneCard, {
            opacity: sectionAnims[1].fade,
            transform: [{ translateY: sectionAnims[1].slide }],
          }]}>
            <View style={styles.milestoneLeft}>
              <Trophy size={20} color={Colors.amber} />
              <View style={styles.milestoneTextWrap}>
                <Text style={styles.milestoneTitle}>
                  <Text style={styles.milestonePoints}>{ms.pointsAway}</Text> points away from{' '}
                  <Text style={[styles.milestoneNextTier, { color: Tiers[ms.nextTier].color }]}>
                    {ms.nextTierLabel}
                  </Text>
                </Text>
              </View>
            </View>
            <View style={styles.milestoneBarTrack}>
              <View style={[styles.milestoneBarFill, {
                width: `${Math.min(100, Math.max(5, (totalScore / ms.nextThreshold) * 100))}%`,
                backgroundColor: Colors.amber,
              }]} />
            </View>
          </Animated.View>
        )}

        {/* QUICK INSIGHTS */}
        <Animated.View style={[styles.section, {
          opacity: sectionAnims[2].fade,
          transform: [{ translateY: sectionAnims[2].slide }],
        }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
              <Activity size={20} color="#60A5FA" />
            </View>
            <Text style={styles.sectionTitle}>Key Insights</Text>
          </View>
          {insights.quickInsights.map((insight, i) => (
            <View key={i} style={styles.quickInsightCard}>
              <View style={styles.quickInsightDot}>
                <ArrowUpRight size={12} color={Colors.teal} />
              </View>
              <Text style={styles.quickInsightText}>{insight}</Text>
            </View>
          ))}
        </Animated.View>

        {/* SKILL RADAR CHART */}
        <Animated.View style={[styles.section, {
          opacity: sectionAnims[3].fade,
          transform: [{ translateY: sectionAnims[3].slide }],
        }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: Colors.tealGlow }]}>
              <Shield size={20} color={Colors.teal} />
            </View>
            <Text style={styles.sectionTitle}>Skill Map</Text>
          </View>
          <View style={styles.radarContainer}>
            <RadarChart data={radarData} size={RADAR_SIZE} />
          </View>
        </Animated.View>

        {/* SCORE TREND GRAPH */}
        <Animated.View style={[styles.section, {
          opacity: sectionAnims[4].fade,
          transform: [{ translateY: sectionAnims[4].slide }],
        }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: Colors.amberGlow }]}>
              <TrendingUp size={20} color={Colors.amber} />
            </View>
            <Text style={styles.sectionTitle}>Score Trend</Text>
          </View>
          <View style={styles.chartContainer}>
            <ScoreTrendChart
              history={scoreHistory}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
            />
          </View>
        </Animated.View>

        {/* STRENGTHS */}
        <Animated.View style={[styles.section, {
          opacity: sectionAnims[5].fade,
          transform: [{ translateY: sectionAnims[5].slide }],
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

        {/* GROWTH AREAS */}
        <Animated.View style={[styles.section, {
          opacity: sectionAnims[6].fade,
          transform: [{ translateY: sectionAnims[6].slide }],
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

        {/* DECISION STYLE & FOCUS PATTERN */}
        <Animated.View style={[styles.section, {
          opacity: sectionAnims[7].fade,
          transform: [{ translateY: sectionAnims[7].slide }],
        }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
              <Crosshair size={20} color="#60A5FA" />
            </View>
            <Text style={styles.sectionTitle}>Decision Style</Text>
          </View>
          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>{insights.decisionStyle}</Text>
            <Text style={styles.profileDesc}>{insights.decisionStyleDescription}</Text>
          </View>

          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(244,114,182,0.15)' }]}>
              <Eye size={20} color="#F472B6" />
            </View>
            <Text style={styles.sectionTitle}>Focus Pattern</Text>
          </View>
          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>{insights.focusPattern}</Text>
            <Text style={styles.profileDesc}>{insights.focusPatternDescription}</Text>
          </View>
        </Animated.View>

        {/* IMPROVEMENT SUGGESTIONS */}
        <View style={styles.section}>
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
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
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
  headerCenter: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.textPrimary },
  headerSpacer: { width: 40 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  identityCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
  },
  identityHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 20,
  },
  identityIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  identityTitleWrap: { flex: 1 },
  identityLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  identityName: { fontSize: 22, fontWeight: '800' as const },
  identityStats: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 18,
  },
  identityStat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.bgCardLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  identityStatIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  identityStatLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  identityStatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  identityStatValue: {
    fontSize: 11,
    fontWeight: '700' as const,
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
  scoreChipText: { fontSize: 13, fontWeight: '700' as const },

  milestoneCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${Colors.amber}20`,
  },
  milestoneLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 14,
  },
  milestoneTextWrap: { flex: 1 },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  milestonePoints: {
    fontWeight: '800' as const,
    color: Colors.amber,
    fontSize: 16,
  },
  milestoneNextTier: {
    fontWeight: '800' as const,
  },
  milestoneBarTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  milestoneBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  section: { marginBottom: 24 },
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
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.textPrimary },

  quickInsightCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickInsightDot: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.tealGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 1,
  },
  quickInsightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontWeight: '500' as const,
  },

  radarContainer: {
    alignItems: 'center' as const,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  chartContainer: {
    alignItems: 'center' as const,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  insightRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginBottom: 12,
    paddingLeft: 4,
  },
  bulletDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  insightText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },

  profileCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  profileDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

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
  suggestionText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },


});
