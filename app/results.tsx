import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Zap, Brain, Target, Eye, Globe, Heart, ChevronRight, Award, MessageCircle, Copy, Check as CheckIcon, Swords, Sparkles, Lock, Rocket, BarChart3, Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Tiers, getTier } from '@/constants/colors';
import type { TestResult, TestCategory } from '@/constants/gameData';
import * as Haptics from 'expo-haptics';
import * as ExpoLinking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { trackTestComplete, trackRetryClicked, trackShareClicked } from '@/lib/analytics';
import { saveScore } from '@/lib/scoreHistory';

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

const CATEGORY_META: Record<TestCategory, { label: string; color: string; icon: React.ReactNode }> = {
  reaction: { label: 'Reaction', color: Colors.amber, icon: <Zap size={18} color={Colors.amber} /> },
  memory: { label: 'Memory', color: Colors.teal, icon: <Brain size={18} color={Colors.teal} /> },
  focus: { label: 'Focus', color: '#60A5FA', icon: <Eye size={18} color="#60A5FA" /> },
  logic: { label: 'Logic', color: Colors.amber, icon: <Target size={18} color={Colors.amber} /> },
  awareness: { label: 'Awareness', color: Colors.green, icon: <Globe size={18} color={Colors.green} /> },
  behavioral: { label: 'Style', color: '#F472B6', icon: <Heart size={18} color="#F472B6" /> },
};

function getScoreMessage(score: number): string {
  if (score >= 850) return "Exceptional mind!";
  if (score >= 650) return "Impressive performance!";
  if (score >= 450) return "Solid thinking!";
  if (score >= 250) return "Room to grow!";
  return "Keep practicing!";
}

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data: string }>();

  const testResults = useMemo<TestResult[]>(() => {
    try {
      const parsed = JSON.parse(params.data || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      console.log('[Results] Failed to parse test data');
      return [];
    }
  }, [params.data]);

  const categoryScores = useMemo(() => {
    const cats: Record<string, { score: number; max: number; details: string[] }> = {};
    for (const r of testResults) {
      if (!cats[r.category]) cats[r.category] = { score: 0, max: 0, details: [] };
      cats[r.category].score += r.score;
      cats[r.category].max += r.maxScore;
      cats[r.category].details.push(r.detail);
    }
    return cats;
  }, [testResults]);

  const totalScore = useMemo(() => {
    return clamp(testResults.reduce((s, r) => s + r.score, 0), 0, 1000);
  }, [testResults]);

  const tier = useMemo(() => getTier(totalScore), [totalScore]);
  const tierStyle = Tiers[tier];

  const [displayedScore, setDisplayedScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [notifyModal, setNotifyModal] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastFade = useRef(new Animated.Value(0)).current;
  const toastSlide = useRef(new Animated.Value(-30)).current;

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.8)).current;
  const tierBadgeFade = useRef(new Animated.Value(0)).current;
  const tierBadgeScale = useRef(new Animated.Value(0.5)).current;
  const messageFade = useRef(new Animated.Value(0)).current;
  const breakdownFade = useRef(new Animated.Value(0)).current;
  const breakdownSlide = useRef(new Animated.Value(40)).current;
  const actionsFade = useRef(new Animated.Value(0)).current;
  const actionsSlide = useRef(new Animated.Value(30)).current;
  const shareFade = useRef(new Animated.Value(0)).current;
  const shareSlide = useRef(new Animated.Value(40)).current;
  const insightsFade = useRef(new Animated.Value(0)).current;
  const insightsSlide = useRef(new Animated.Value(40)).current;
  const comingSoonFade = useRef(new Animated.Value(0)).current;
  const comingSoonSlide = useRef(new Animated.Value(40)).current;
  const ringProgress = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const pendingTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const barAnims = useRef(
    (['reaction', 'memory', 'focus', 'logic', 'awareness', 'behavioral'] as const).map(() => new Animated.Value(0))
  ).current;

  const gameStartRef = useRef(Date.now());

  useEffect(() => {
    void trackTestComplete({
      totalScore,
      tier,
      durationSeconds: Math.round((Date.now() - gameStartRef.current) / 1000),
    });

    const catScores: Record<string, { score: number; max: number }> = {};
    for (const r of testResults) {
      if (!catScores[r.category]) catScores[r.category] = { score: 0, max: 0 };
      catScores[r.category].score += r.score;
      catScores[r.category].max += r.maxScore;
    }
    void saveScore({
      score: totalScore,
      tier,
      timestamp: Date.now(),
      categoryScores: catScores,
    });
  }, [totalScore, tier, testResults]);

  const estimatedPercentile = useMemo(() => {
    if (totalScore >= 900) return 1;
    if (totalScore >= 800) return 3;
    if (totalScore >= 700) return 8;
    if (totalScore >= 600) return 15;
    if (totalScore >= 500) return 25;
    if (totalScore >= 400) return 40;
    if (totalScore >= 300) return 55;
    if (totalScore >= 200) return 70;
    return 85;
  }, [totalScore]);

  const challengeUrl = useMemo(() => {
    const base = ExpoLinking.createURL('/challenge');
    return `${base}?score=${totalScore}&tier=${tier}`;
  }, [totalScore, tier]);

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);

    pendingTimeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const shareText = useMemo(() => {
    return `My BrainScore is ${totalScore}. I'm in the top ${estimatedPercentile}%. Can you beat me?`;
  }, [totalScore, estimatedPercentile]);

  const handleShareWhatsApp = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void trackShareClicked('whatsapp');
    const message = `${shareText}\n\nTake the challenge: ${challengeUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    try { await Linking.openURL(whatsappUrl); } catch (e) { console.log('Could not open WhatsApp:', e); }
  }, [shareText, challengeUrl]);

  const handleCopyLink = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void trackShareClicked('copy_link');
    const message = `${shareText}\n${challengeUrl}`;
    await Clipboard.setStringAsync(message);
    setCopied(true);
    scheduleTimeout(() => setCopied(false), 2500);
  }, [shareText, challengeUrl, scheduleTimeout]);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.timing(ringProgress, { toValue: totalScore / 1000, duration: 1800, useNativeDriver: false }).start();

    const startTime = Date.now();
    const duration = 1800;
    const countInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedScore(Math.round(eased * totalScore));
      if (progress >= 1) {
        clearInterval(countInterval);
        setDisplayedScore(totalScore);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, 16);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.spring(tierBadgeScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.timing(tierBadgeFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 800);

    scheduleTimeout(() => {
      Animated.timing(messageFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 1200);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(breakdownFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(breakdownSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();

      const categories: TestCategory[] = ['reaction', 'memory', 'focus', 'logic', 'awareness', 'behavioral'];
      Animated.stagger(100, categories.map((cat, i) => {
        const cs = categoryScores[cat];
        const pct = cs ? cs.score / cs.max : 0;
        return Animated.timing(barAnims[i], { toValue: pct, duration: 800, useNativeDriver: false });
      })).start();
    }, 1600);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(actionsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(actionsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2200);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(shareFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(shareSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 2600);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(insightsFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(insightsSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 2000);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(comingSoonFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(comingSoonSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 1400);

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    );
    glow.start();

    return () => {
      clearInterval(countInterval);
      pendingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      pendingTimeoutsRef.current = [];
      glow.stop();
    };
  }, [heroFade, heroScale, tierBadgeFade, tierBadgeScale, messageFade, breakdownFade, breakdownSlide, actionsFade, actionsSlide, ringProgress, barAnims, glowPulse, shareFade, shareSlide, insightsFade, insightsSlide, comingSoonFade, comingSoonSlide, totalScore, categoryScores, scheduleTimeout]);

  const handleViewInsights = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/insights',
      params: { data: params.data || '[]' },
    });
  }, [router, params.data]);

  const handleRetry = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void trackRetryClicked();
    router.replace('/game');
  };

  const handleHome = () => {
    router.replace('/');
  };

  const COMING_SOON_FEATURES = [
    {
      key: 'battle',
      icon: <Swords size={22} color="#FF6B6B" />,
      iconBg: 'rgba(255, 107, 107, 0.12)',
      borderAccent: 'rgba(255, 107, 107, 0.2)',
      title: 'Live Brain Battles',
      desc: 'Compete with friends in real-time',
      badge: 'MULTIPLAYER',
      badgeColor: '#FF6B6B',
    },
    {
      key: 'deep_insights',
      icon: <Brain size={22} color="#A78BFA" />,
      iconBg: 'rgba(167, 139, 250, 0.12)',
      borderAccent: 'rgba(167, 139, 250, 0.2)',
      title: 'Deep Cognitive Profile',
      desc: 'Unlock hidden traits and patterns',
      badge: 'ADVANCED',
      badgeColor: '#A78BFA',
    },
    {
      key: 'history',
      icon: <BarChart3 size={22} color="#60A5FA" />,
      iconBg: 'rgba(96, 165, 250, 0.12)',
      borderAccent: 'rgba(96, 165, 250, 0.2)',
      title: 'Progress Tracking',
      desc: 'See how your BrainScore evolves',
      badge: 'ANALYTICS',
      badgeColor: '#60A5FA',
    },
  ] as const;

  const handleFeatureCard = useCallback((title: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifyModal(title);
  }, []);

  const handleNotifyMe = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNotifyModal(null);
    setToastVisible(true);
    Animated.parallel([
      Animated.timing(toastFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(toastSlide, { toValue: 0, friction: 8, tension: 100, useNativeDriver: true }),
    ]).start();
    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(toastFade, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(toastSlide, { toValue: -30, duration: 400, useNativeDriver: true }),
      ]).start(() => setToastVisible(false));
    }, 2500);
  }, [toastFade, toastSlide, scheduleTimeout]);

  const scorePercentage = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const categories: TestCategory[] = ['reaction', 'memory', 'focus', 'logic', 'awareness', 'behavioral'];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <Animated.View style={[styles.heroSection, { opacity: heroFade, transform: [{ scale: heroScale }] }]}>
          <View style={styles.scoreRingOuter}>
            <Animated.View style={[styles.scoreGlow, { opacity: glowPulse, backgroundColor: tierStyle.color }]} />
            <View style={[styles.scoreRingTrack, { borderColor: Colors.border }]}>
              <Animated.View style={[styles.scoreRingFillBg, { width: scorePercentage, backgroundColor: tierStyle.color }]} />
            </View>
            <View style={[styles.scoreCircleInner, { borderColor: `${tierStyle.color}40` }]}>
              <Text style={[styles.scoreNumber, { color: tierStyle.color }]}>{displayedScore}</Text>
              <Text style={styles.scoreMax}>/1000</Text>
            </View>
          </View>

          <Animated.View style={[styles.tierBadge, { backgroundColor: tierStyle.bg, borderColor: `${tierStyle.color}30` }, { opacity: tierBadgeFade, transform: [{ scale: tierBadgeScale }] }]}>
            <Award size={16} color={tierStyle.color} />
            <Text style={[styles.tierText, { color: tierStyle.color }]}>{tier}</Text>
          </Animated.View>

          <Animated.Text style={[styles.scoreMessage, { opacity: messageFade }]}>
            {getScoreMessage(totalScore)}
          </Animated.Text>
        </Animated.View>

        <Animated.View style={[styles.breakdownSection, { opacity: breakdownFade, transform: [{ translateY: breakdownSlide }] }]}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownTitle}>Performance Breakdown</Text>
          </View>

          {categories.map((cat, catIdx) => {
            const cs = categoryScores[cat];
            const meta = CATEGORY_META[cat];
            if (!cs) return null;
            return (
              <View key={cat} style={styles.breakdownCard}>
                <View style={styles.breakdownCardTop}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownIconWrap, { backgroundColor: `${meta.color}15` }]}>
                      {meta.icon}
                    </View>
                    <View>
                      <Text style={styles.breakdownLabel}>{meta.label}</Text>
                      <Text style={styles.breakdownDetail}>{cs.details.join(' · ')}</Text>
                    </View>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={[styles.breakdownScore, { color: meta.color }]}>{cs.score}</Text>
                    <Text style={styles.breakdownMaxScore}>/{cs.max}</Text>
                  </View>
                </View>
                <View style={styles.breakdownBarTrack}>
                  <Animated.View style={[styles.breakdownBarFill, {
                    backgroundColor: meta.color,
                    width: barAnims[catIdx].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  }]} />
                </View>
              </View>
            );
          })}
        </Animated.View>

        <Animated.View style={[styles.comingSoonSection, { opacity: comingSoonFade, transform: [{ translateY: comingSoonSlide }] }]}>
          <View style={styles.comingSoonHeader}>
            <View style={styles.comingSoonHeaderLeft}>
              <Rocket size={18} color={Colors.amber} />
              <Text style={styles.comingSoonHeaderTitle}>Level Up Your Brain</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>COMING NEXT</Text>
            </View>
          </View>

          {COMING_SOON_FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.key}
              style={[styles.featureCard, { borderColor: feature.borderAccent }]}
              onPress={() => handleFeatureCard(feature.title)}
              activeOpacity={0.8}
              testID={`coming-soon-${feature.key}`}
            >
              <View style={styles.featureCardOverlay} />
              <View style={styles.featureCardContent}>
                <View style={[styles.featureIconWrap, { backgroundColor: feature.iconBg }]}>
                  {feature.icon}
                </View>
                <View style={styles.featureTextWrap}>
                  <View style={styles.featureTitleRow}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <View style={[styles.featureTypeBadge, { backgroundColor: `${feature.badgeColor}15` }]}>
                      <Text style={[styles.featureTypeBadgeText, { color: feature.badgeColor }]}>{feature.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
                <View style={styles.featureLockWrap}>
                  <Lock size={14} color={Colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: actionsFade, transform: [{ translateY: actionsSlide }] }]}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.85} testID="retry-button">
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={handleHome} activeOpacity={0.7} testID="home-button">
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.insightsSection, { opacity: insightsFade, transform: [{ translateY: insightsSlide }] }]}>
          <View style={styles.insightsDivider}>
            <View style={styles.insightsDividerLine} />
            <View style={styles.insightsDividerBadge}>
              <Sparkles size={14} color="#A78BFA" />
              <Text style={styles.insightsDividerText}>INSIGHTS</Text>
            </View>
            <View style={styles.insightsDividerLine} />
          </View>

          <TouchableOpacity style={styles.viewInsightsCard} onPress={handleViewInsights} activeOpacity={0.85} testID="view-insights">
            <View style={styles.viewInsightsLeft}>
              <View style={styles.viewInsightsIconWrap}>
                <Eye size={22} color={Colors.teal} />
              </View>
              <View style={styles.viewInsightsTextWrap}>
                <Text style={styles.viewInsightsTitle}>Full Brain Analysis</Text>
                <Text style={styles.viewInsightsSubtitle} numberOfLines={2}>Brain type, strengths, decision style & more</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.shareSection, { opacity: shareFade, transform: [{ translateY: shareSlide }] }]}>
          <View style={styles.shareDivider}>
            <View style={styles.shareDividerLine} />
            <View style={styles.shareDividerBadge}>
              <Swords size={14} color={Colors.amber} />
              <Text style={styles.shareDividerText}>CHALLENGE</Text>
            </View>
            <View style={styles.shareDividerLine} />
          </View>

          <View style={styles.shareCard}>
            <View style={styles.shareCardInner}>
              <Text style={styles.shareQuote}>
                {`"My BrainScore is `}
                <Text style={[styles.shareQuoteHighlight, { color: tierStyle.color }]}>{totalScore}</Text>
                {`.\nI'm in the top `}
                <Text style={[styles.shareQuoteHighlight, { color: Colors.amber }]}>{estimatedPercentile}%</Text>
                {`.\nCan you beat me?"`}
              </Text>
            </View>
            <View style={styles.shareButtons}>
              <TouchableOpacity style={styles.whatsappButton} onPress={handleShareWhatsApp} activeOpacity={0.8} testID="share-whatsapp">
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.whatsappButtonText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.copyButton, copied && styles.copyButtonCopied]} onPress={handleCopyLink} activeOpacity={0.8} testID="share-copy">
                {copied ? (
                  <>
                    <CheckIcon size={18} color={Colors.green} />
                    <Text style={[styles.copyButtonText, { color: Colors.green }]}>Copied!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={18} color={Colors.textPrimary} />
                    <Text style={styles.copyButtonText}>Copy Link</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {notifyModal && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotifyModal(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Rocket size={28} color={Colors.amber} />
            </View>
            <Text style={styles.modalTitle}>{notifyModal}</Text>
            <Text style={styles.modalDesc}>This feature is coming soon</Text>
            <TouchableOpacity
              style={styles.notifyButton}
              onPress={handleNotifyMe}
              activeOpacity={0.85}
              testID="notify-me-btn"
            >
              <Bell size={18} color={Colors.bg} />
              <Text style={styles.notifyButtonText}>Notify Me</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDismiss}
              onPress={() => setNotifyModal(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalDismissText}>Maybe later</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {toastVisible && (
        <Animated.View style={[styles.toast, { top: insets.top + 16, opacity: toastFade, transform: [{ translateY: toastSlide }] }]}>
          <CheckIcon size={16} color={Colors.green} />
          <Text style={styles.toastText}>We'll notify you when this launches</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  heroSection: { alignItems: 'center' as const, marginBottom: 36 },
  scoreRingOuter: { width: 200, height: 200, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 20 },
  scoreGlow: { position: 'absolute' as const, width: 160, height: 160, borderRadius: 80, opacity: 0.15 },
  scoreRingTrack: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: 4, borderRadius: 2, overflow: 'hidden' as const, borderWidth: 0 },
  scoreRingFillBg: { height: '100%', borderRadius: 2 },
  scoreCircleInner: { width: 180, height: 180, borderRadius: 90, borderWidth: 3, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: Colors.bgCard },
  scoreNumber: { fontSize: 64, fontWeight: '800' as const, lineHeight: 72 },
  scoreMax: { fontSize: 18, color: Colors.textMuted, fontWeight: '500' as const, marginTop: -4 },
  tierBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, borderWidth: 1, marginBottom: 12 },
  tierText: { fontSize: 16, fontWeight: '800' as const, letterSpacing: 2, textTransform: 'uppercase' as const },
  scoreMessage: { fontSize: 17, color: Colors.textSecondary, fontWeight: '500' as const },
  breakdownSection: { marginBottom: 32 },
  breakdownHeader: { marginBottom: 16 },
  breakdownTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.textPrimary },
  breakdownCard: { backgroundColor: Colors.bgCard, borderRadius: 18, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  breakdownCardTop: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 12 },
  breakdownLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, flex: 1 },
  breakdownIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const },
  breakdownLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.textPrimary, marginBottom: 2 },
  breakdownDetail: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' as const },
  breakdownRight: { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 2 },
  breakdownScore: { fontSize: 20, fontWeight: '800' as const },
  breakdownMaxScore: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' as const },
  breakdownBarTrack: { height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' as const },
  breakdownBarFill: { height: '100%', borderRadius: 3 },
  actions: { gap: 12 },
  retryButton: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: Colors.teal, height: 58, borderRadius: 18, gap: 10 },
  retryButtonText: { fontSize: 17, fontWeight: '700' as const, color: Colors.bg, textAlign: 'center' as const },
  homeButton: { alignItems: 'center' as const, justifyContent: 'center' as const, height: 50, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  homeButtonText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
  comingSoonSection: { marginBottom: 32 },
  comingSoonHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 14,
  },
  comingSoonHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  comingSoonHeaderTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255, 181, 71, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  comingSoonBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 1.5,
  },
  featureCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  featureCardOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  featureCardContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    gap: 14,
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureTextWrap: { flex: 1 },
  featureTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  featureTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featureTypeBadgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  featureLockWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.bgCardLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 32,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '85%' as const,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.amberGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  modalDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  notifyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.amber,
    height: 50,
    borderRadius: 16,
    gap: 8,
    width: '100%' as const,
    marginBottom: 12,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.bg,
  },
  modalDismiss: {
    paddingVertical: 8,
  },
  modalDismissText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  toast: {
    position: 'absolute' as const,
    left: 24,
    right: 24,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.green,
    zIndex: 200,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.green,
  },
  insightsSection: { marginTop: 28, paddingBottom: 8 },
  insightsDivider: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 20, gap: 12 },
  insightsDividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  insightsDividerBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 'rgba(167, 139, 250, 0.12)', borderRadius: 20 },
  insightsDividerText: { fontSize: 11, fontWeight: '800' as const, color: '#A78BFA', letterSpacing: 2 },
  viewInsightsCard: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, backgroundColor: Colors.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: `${Colors.teal}30` },
  viewInsightsLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14, flex: 1, marginRight: 8 },
  viewInsightsIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.tealGlow, alignItems: 'center' as const, justifyContent: 'center' as const },
  viewInsightsTextWrap: { flex: 1 },
  viewInsightsTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.textPrimary, marginBottom: 3 },
  viewInsightsSubtitle: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const, flexShrink: 1 },
  shareSection: { marginTop: 24, paddingBottom: 20 },
  shareDivider: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 20, gap: 12 },
  shareDividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  shareDividerBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.amberGlow, borderRadius: 20 },
  shareDividerText: { fontSize: 11, fontWeight: '800' as const, color: Colors.amber, letterSpacing: 2 },
  shareCard: { backgroundColor: Colors.bgCard, borderRadius: 22, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' as const },
  shareCardInner: { padding: 22, paddingBottom: 18 },
  shareQuote: { fontSize: 17, fontWeight: '500' as const, color: Colors.textSecondary, lineHeight: 26, textAlign: 'center' as const },
  shareQuoteHighlight: { fontWeight: '800' as const },
  shareButtons: { flexDirection: 'row' as const, gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  whatsappButton: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: '#25D366', height: 50, borderRadius: 14, gap: 8 },
  whatsappButtonText: { fontSize: 15, fontWeight: '700' as const, color: '#FFFFFF' },
  copyButton: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: Colors.bgCardLight, height: 50, borderRadius: 14, gap: 8, borderWidth: 1, borderColor: Colors.border },
  copyButtonCopied: { borderColor: Colors.green, backgroundColor: Colors.greenGlow },
  copyButtonText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textPrimary },
});
