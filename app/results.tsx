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
import {
  Zap, Brain, Target, Eye, Globe, Heart, ChevronRight,
  MessageCircle, Copy, Check as CheckIcon, Swords, Sparkles,
  Lock, Rocket, BarChart3, Bell, TrendingUp, Layers, Home,
  RefreshCw, Crown, Shield, Flame, Trophy,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Tiers, getTier } from '@/constants/colors';
import type { TestResult, TestCategory } from '@/constants/gameData';
import { generateInsights } from '@/constants/insights';
import * as Haptics from 'expo-haptics';
import * as ExpoLinking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { trackTestComplete, trackRetryClicked, trackShareClicked } from '@/lib/analytics';
import { saveScore } from '@/lib/scoreHistory';

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

const THEME_META: Record<string, { emoji: string; title: string; accent: string }> = {
  'know-yourself': { emoji: '🪞', title: 'Know Yourself', accent: '#00E5CC' },
  'bollywood-buzz': { emoji: '💃', title: 'Bollywood Buzz', accent: '#FF6B9D' },
  'marvel-vs-dc': { emoji: '⚡', title: 'Marvel vs DC', accent: '#FF5A5A' },
  'curiosity-lab': { emoji: '🔬', title: 'Curiosity Lab', accent: '#A78BFA' },
  'game-day': { emoji: '🏆', title: 'Game Day', accent: '#4ADE80' },
  'math-blitz': { emoji: '➗', title: 'Math Blitz', accent: '#60A5FA' },
  'internet-culture': { emoji: '🔥', title: 'Internet Culture', accent: '#FB923C' },
  'mind-benders': { emoji: '🌀', title: 'Mind Benders', accent: '#F472B6' },
  'would-you-rather': { emoji: '⚖️', title: 'Would You Rather', accent: '#FBBF24' },
  'street-smart': { emoji: '🗺️', title: 'Street Smart', accent: '#34D399' },
};

const CATEGORY_META: Record<TestCategory, { label: string; color: string; icon: React.ReactNode }> = {
  reaction: { label: 'Reaction', color: Colors.amber, icon: <Zap size={16} color={Colors.amber} /> },
  memory: { label: 'Memory', color: Colors.teal, icon: <Brain size={16} color={Colors.teal} /> },
  focus: { label: 'Focus', color: '#60A5FA', icon: <Eye size={16} color="#60A5FA" /> },
  logic: { label: 'Logic', color: Colors.amber, icon: <Target size={16} color={Colors.amber} /> },
  awareness: { label: 'Awareness', color: Colors.green, icon: <Globe size={16} color={Colors.green} /> },
  behavioral: { label: 'Style', color: '#F472B6', icon: <Heart size={16} color="#F472B6" /> },
};

const DIFFICULTY_LEVELS = [
  { label: 'Easy', sublabel: 'Current', active: true, color: '#4ADE80' },
  { label: 'Medium', sublabel: 'Coming Soon', active: false, color: '#FBBF24' },
  { label: 'Hard', sublabel: 'Coming Soon', active: false, color: '#FF6B6B' },
  { label: 'Super Hard', sublabel: 'Coming Soon', active: false, color: '#A78BFA' },
];

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data: string; theme: string }>();

  const theme = params.theme || '';
  const themeMeta = THEME_META[theme];

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

  const insights = useMemo(() => generateInsights(testResults), [testResults]);

  const [displayedScore, setDisplayedScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [notifyModal, setNotifyModal] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastFade = useRef(new Animated.Value(0)).current;
  const toastSlide = useRef(new Animated.Value(-30)).current;

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.7)).current;
  const scoreFade = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0.5)).current;
  const tierBadgeFade = useRef(new Animated.Value(0)).current;
  const tierBadgeScale = useRef(new Animated.Value(0.5)).current;
  const messageFade = useRef(new Animated.Value(0)).current;
  const shareFade = useRef(new Animated.Value(0)).current;
  const shareSlide = useRef(new Animated.Value(50)).current;
  const insightTeaserFade = useRef(new Animated.Value(0)).current;
  const insightTeaserSlide = useRef(new Animated.Value(40)).current;
  const unlockFade = useRef(new Animated.Value(0)).current;
  const unlockSlide = useRef(new Animated.Value(50)).current;
  const breakdownFade = useRef(new Animated.Value(0)).current;
  const breakdownSlide = useRef(new Animated.Value(50)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(40)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const difficultyGlow = useRef(new Animated.Value(0.4)).current;
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

  const themeTitle = themeMeta?.title || 'BrainScore';
  const themeEmoji = themeMeta?.emoji || '🧠';
  const themeAccent = themeMeta?.accent || tierStyle.color;

  const challengeUrl = useMemo(() => {
    const base = ExpoLinking.createURL('/challenge');
    return `${base}?score=${totalScore}&tier=${tier}&theme=${theme}`;
  }, [totalScore, tier, theme]);

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);

    pendingTimeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const shareText = useMemo(() => {
    return `My BrainScore is ${totalScore} in ${themeTitle} ${themeEmoji}\nI'm in the top ${estimatedPercentile}%.\nCan you beat me?`;
  }, [totalScore, estimatedPercentile, themeTitle, themeEmoji]);

  const personalizedLine = useMemo(() => {
    if (insights.quickInsights.length > 0) return insights.quickInsights[0];
    if (totalScore >= 700) return "Your instincts are razor-sharp but you miss hidden patterns under pressure.";
    if (totalScore >= 500) return "You trust instinct more than verification — bold, but risky.";
    if (totalScore >= 300) return "You think before you leap — sometimes too long.";
    return "Your brain is warming up. Keep pushing.";
  }, [totalScore, insights.quickInsights]);

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
      Animated.spring(heroScale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(heroFade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.spring(scoreScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(scoreFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 300);

    const startTime = Date.now();
    const duration = 2000;
    const countInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayedScore(Math.round(eased * totalScore));
      if (progress >= 1) {
        clearInterval(countInterval);
        setDisplayedScore(totalScore);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, 16);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.spring(tierBadgeScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.timing(tierBadgeFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 1000);

    scheduleTimeout(() => {
      Animated.timing(messageFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1400);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(shareFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(shareSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
    }, 1700);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(insightTeaserFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(insightTeaserSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
    }, 2000);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(unlockFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(unlockSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    }, 2300);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(breakdownFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(breakdownSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();

      const categories: TestCategory[] = ['reaction', 'memory', 'focus', 'logic', 'awareness', 'behavioral'];
      Animated.stagger(80, categories.map((cat, i) => {
        const cs = categoryScores[cat];
        const pct = cs ? cs.score / cs.max : 0;
        return Animated.timing(barAnims[i], { toValue: pct, duration: 900, useNativeDriver: false });
      })).start();
    }, 2700);

    scheduleTimeout(() => {
      Animated.parallel([
        Animated.timing(ctaFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(ctaSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
    }, 3200);

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    );
    glow.start();

    const ring = Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(ringPulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    );
    ring.start();

    const diffGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(difficultyGlow, { toValue: 0.9, duration: 1600, useNativeDriver: true }),
        Animated.timing(difficultyGlow, { toValue: 0.4, duration: 1600, useNativeDriver: true }),
      ])
    );
    diffGlow.start();

    return () => {
      clearInterval(countInterval);
      pendingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      pendingTimeoutsRef.current = [];
      glow.stop();
      ring.stop();
      diffGlow.stop();
    };
  }, [heroFade, heroScale, scoreFade, scoreScale, tierBadgeFade, tierBadgeScale, messageFade, shareFade, shareSlide, insightTeaserFade, insightTeaserSlide, unlockFade, unlockSlide, breakdownFade, breakdownSlide, ctaFade, ctaSlide, barAnims, glowPulse, ringPulse, difficultyGlow, totalScore, categoryScores, scheduleTimeout]);

  const handleViewInsights = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/insights',
      params: { data: params.data || '[]' },
    });
  }, [router, params.data]);

  const handleRetry = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void trackRetryClicked();
    router.replace({ pathname: '/game', params: { theme } });
  }, [router, theme]);

  const handleHome = useCallback(() => {
    router.replace('/');
  }, [router]);

  const COMING_SOON_FEATURES = [
    {
      key: 'battle',
      icon: <Swords size={20} color="#FF6B6B" />,
      iconBg: 'rgba(255, 107, 107, 0.15)',
      glowColor: 'rgba(255, 107, 107, 0.06)',
      borderAccent: 'rgba(255, 107, 107, 0.18)',
      title: 'Live Brain Battles',
      desc: 'Beat your friends in real-time',
      badge: 'MULTIPLAYER',
      badgeColor: '#FF6B6B',
    },
    {
      key: 'deep_insights',
      icon: <Brain size={20} color="#A78BFA" />,
      iconBg: 'rgba(167, 139, 250, 0.15)',
      glowColor: 'rgba(167, 139, 250, 0.06)',
      borderAccent: 'rgba(167, 139, 250, 0.18)',
      title: 'Deep Cognitive Profile',
      desc: 'Discover how your brain really works',
      badge: 'ADVANCED',
      badgeColor: '#A78BFA',
    },
    {
      key: 'history',
      icon: <BarChart3 size={20} color="#60A5FA" />,
      iconBg: 'rgba(96, 165, 250, 0.15)',
      glowColor: 'rgba(96, 165, 250, 0.06)',
      borderAccent: 'rgba(96, 165, 250, 0.18)',
      title: 'Progress Tracking',
      desc: 'See how you evolve over time',
      badge: 'ANALYTICS',
      badgeColor: '#60A5FA',
    },
  ] as const;

  const handleLockedTap = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToastVisible(true);
    toastFade.setValue(0);
    toastSlide.setValue(-30);
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

  const categories: TestCategory[] = ['reaction', 'memory', 'focus', 'logic', 'awareness', 'behavioral'];

  const scorePercent = totalScore / 10;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.bgLayer}>
        <Animated.View style={[styles.bgGlowOrb, { backgroundColor: themeAccent, opacity: glowPulse, top: -100, right: -60 }]} />
        <View style={[styles.bgGlowOrb2, { backgroundColor: `${tierStyle.color}06`, bottom: 300, left: -80 }]} />
        <View style={[styles.bgGlowOrb3, { backgroundColor: `${themeAccent}05`, bottom: 100, right: -40 }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>

        {/* 1. SCORE + BRAIN IDENTITY */}
        <Animated.View style={[styles.heroSection, { opacity: heroFade, transform: [{ scale: heroScale }] }]}>
          {themeMeta && (
            <View style={[styles.themePill, { backgroundColor: `${themeAccent}18`, borderColor: `${themeAccent}30` }]}>
              <Text style={styles.themePillEmoji}>{themeEmoji}</Text>
              <Text style={[styles.themePillText, { color: themeAccent }]}>{themeTitle}</Text>
            </View>
          )}

          <Animated.View style={[styles.scoreContainer, { opacity: scoreFade, transform: [{ scale: scoreScale }] }]}>
            <Animated.View style={[styles.scoreOuterRing, { borderColor: `${tierStyle.color}25`, transform: [{ scale: ringPulse }] }]}>
              <View style={[styles.scoreInnerCircle, { borderColor: `${tierStyle.color}50` }]}>
                <Animated.View style={[styles.scoreGlowBg, { backgroundColor: tierStyle.color, opacity: glowPulse }]} />
                <Text style={[styles.scoreNumber, { color: tierStyle.color }]}>{displayedScore}</Text>
                <Text style={styles.scoreLabel}>BRAINSCORE</Text>
              </View>
            </Animated.View>
          </Animated.View>

          <View style={styles.scoreBarContainer}>
            <View style={styles.scoreBarTrack}>
              <View style={[styles.scoreBarFill, { width: `${scorePercent}%`, backgroundColor: tierStyle.color }]} />
            </View>
            <View style={styles.scoreBarLabels}>
              <Text style={styles.scoreBarMin}>0</Text>
              <Text style={[styles.scoreBarCurrent, { color: tierStyle.color }]}>{totalScore}</Text>
              <Text style={styles.scoreBarMax}>1000</Text>
            </View>
          </View>

          <Animated.View style={{ opacity: tierBadgeFade, transform: [{ scale: tierBadgeScale }] }}>
            <View style={styles.tierRow}>
              <View style={[styles.tierBadge, { backgroundColor: tierStyle.bg, borderColor: `${tierStyle.color}35` }]}>
                <Crown size={14} color={tierStyle.color} />
                <Text style={[styles.tierText, { color: tierStyle.color }]}>{tier}</Text>
              </View>
              <View style={[styles.percentileBadge, { borderColor: `${themeAccent}25` }]}>
                <Flame size={13} color={Colors.amber} />
                <Text style={styles.percentileText}>Top {estimatedPercentile}%</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: tierBadgeFade }}>
            <View style={styles.brainTypeChip}>
              <Sparkles size={13} color={themeAccent} />
              <Text style={[styles.brainTypeText, { color: themeAccent }]}>{insights.brainType}</Text>
            </View>
          </Animated.View>

          <Animated.Text style={[styles.personalizedLine, { opacity: messageFade }]}>
            {personalizedLine}
          </Animated.Text>
        </Animated.View>

        {/* 2. CHALLENGE FRIENDS */}
        <Animated.View style={[styles.challengeSection, { opacity: shareFade, transform: [{ translateY: shareSlide }] }]}>
          <View style={[styles.challengeCard, { borderColor: `${themeAccent}20` }]}>
            <View style={styles.challengeCardHeader}>
              <View style={[styles.challengeIconCircle, { backgroundColor: `${Colors.amber}15` }]}>
                <Trophy size={18} color={Colors.amber} />
              </View>
              <Text style={styles.challengeTitle}>Challenge Friends</Text>
              <View style={[styles.percentBadge, { backgroundColor: `${themeAccent}18`, borderColor: `${themeAccent}30` }]}>
                <Flame size={10} color={themeAccent} />
                <Text style={[styles.percentBadgeText, { color: themeAccent }]}>TOP {estimatedPercentile}%</Text>
              </View>
            </View>

            <View style={[styles.shareMessageBox, { borderColor: `${themeAccent}12` }]}>
              <Text style={styles.shareMessage}>
                {`"My BrainScore is `}
                <Text style={[styles.shareHighlight, { color: tierStyle.color }]}>{totalScore}</Text>
                {` in `}
                <Text style={[styles.shareHighlight, { color: themeAccent }]}>{themeTitle}</Text>
                {`.`}
                {`\nI'm in the `}
                <Text style={[styles.shareHighlight, { color: Colors.amber }]}>top {estimatedPercentile}%</Text>
                {`. Can you beat me?" 🧠`}
              </Text>
            </View>

            <View style={styles.shareButtons}>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={handleShareWhatsApp}
                activeOpacity={0.8}
                testID="share-whatsapp"
              >
                <MessageCircle size={17} color="#FFFFFF" />
                <Text style={styles.whatsappBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnActive]}
                onPress={handleCopyLink}
                activeOpacity={0.8}
                testID="share-copy"
              >
                {copied ? (
                  <>
                    <CheckIcon size={17} color={Colors.green} />
                    <Text style={[styles.copyBtnText, { color: Colors.green }]} numberOfLines={1}>Copied!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={17} color={Colors.textPrimary} />
                    <Text style={styles.copyBtnText} numberOfLines={1}>Copy Link</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* 3. QUICK INSIGHT */}
        <Animated.View style={[styles.insightTeaserWrap, { opacity: insightTeaserFade, transform: [{ translateY: insightTeaserSlide }] }]}>
          <TouchableOpacity
            style={[styles.insightTeaserCard, { borderColor: `${Colors.teal}18` }]}
            onPress={handleViewInsights}
            activeOpacity={0.85}
            testID="insight-teaser-tap"
          >
            <View style={styles.insightTeaserLeft}>
              <View style={styles.insightTeaserIconWrap}>
                <Eye size={17} color={Colors.teal} />
              </View>
              <View style={styles.insightTeaserContent}>
                <Text style={styles.insightTeaserLabel}>QUICK INSIGHT</Text>
                <Text style={styles.insightTeaserText} numberOfLines={1}>
                  {insights.quickInsights.length > 1 ? insights.quickInsights[1] : personalizedLine}
                </Text>
              </View>
            </View>
            <View style={styles.insightTeaserArrow}>
              <ChevronRight size={14} color={Colors.teal} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* 4. UNLOCK YOUR NEXT LEVEL */}
        <Animated.View style={[styles.unlockSection, { opacity: unlockFade, transform: [{ translateY: unlockSlide }] }]}>
          <View style={styles.sectionHeader}>
            <Rocket size={16} color={Colors.amber} />
            <Text style={styles.sectionHeaderText}>Unlock Your Next Level</Text>
          </View>

          {/* DIFFICULTY LEVELS — TOP */}
          <View style={[styles.difficultyCard, { borderColor: `${Colors.amber}18` }]}>
            <View style={styles.difficultyHeader}>
              <View style={styles.difficultyHeaderLeft}>
                <View style={[styles.difficultyIconWrap, { backgroundColor: `${Colors.amber}15` }]}>
                  <Layers size={15} color="#FBBF24" />
                </View>
                <View style={styles.difficultyHeaderTextWrap}>
                  <Text style={styles.difficultyTitle}>Difficulty Levels</Text>
                  <Text style={styles.difficultySubtitle}>Harder levels. Bigger scores. Coming soon.</Text>
                </View>
              </View>
              <View style={styles.comingSoonPill}>
                <Lock size={9} color={Colors.amber} />
                <Text style={styles.comingSoonPillText}>PREMIUM</Text>
              </View>
            </View>
            <View style={styles.difficultyTrack}>
              {DIFFICULTY_LEVELS.map((level, idx) => (
                <TouchableOpacity
                  key={level.label}
                  style={styles.difficultyItem}
                  onPress={level.active ? undefined : handleLockedTap}
                  activeOpacity={level.active ? 1 : 0.7}
                  disabled={level.active}
                >
                  <Animated.View style={[
                    styles.difficultyNode,
                    {
                      backgroundColor: level.active ? level.color : Colors.bgCardLight,
                      borderColor: level.active ? level.color : `${level.color}40`,
                    },
                    !level.active && { shadowColor: level.color, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
                  ]}>
                    {level.active ? <CheckIcon size={10} color={Colors.bg} /> : (
                      <Animated.View style={{ opacity: difficultyGlow }}>
                        <Lock size={9} color={level.color} />
                      </Animated.View>
                    )}
                  </Animated.View>
                  {idx < DIFFICULTY_LEVELS.length - 1 && (
                    <View style={[styles.difficultyConnector, {
                      backgroundColor: level.active ? `${level.color}60` : `${level.color}20`,
                    }]} />
                  )}
                  <Text style={[styles.difficultyLabel, { color: level.active ? level.color : `${level.color}CC` }]}>
                    {level.label}
                  </Text>
                  <Text style={[styles.difficultySublabel, {
                    color: level.active ? `${level.color}99` : Colors.textMuted,
                  }]}>
                    {level.sublabel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.premiumCTARow}>
              <Animated.View style={[styles.premiumGlowDot, { opacity: difficultyGlow }]} />
              <Lock size={12} color={Colors.amber} />
              <Text style={styles.premiumCTAText}>Premium difficulty levels coming soon</Text>
            </View>
          </View>

          {/* FEATURE CARDS */}
          <View style={styles.featureGrid}>
            {COMING_SOON_FEATURES.map((feature) => (
              <TouchableOpacity
                key={feature.key}
                style={[styles.featureCard, { borderColor: feature.borderAccent, backgroundColor: feature.glowColor }]}
                onPress={() => handleFeatureCard(feature.title)}
                activeOpacity={0.8}
                testID={`coming-soon-${feature.key}`}
              >
                <View style={[styles.featureIconBox, { backgroundColor: feature.iconBg }]}>
                  {feature.icon}
                </View>
                <View style={styles.featureBody}>
                  <View style={styles.featureTitleRow}>
                    <Text style={styles.featureTitle} numberOfLines={1}>{feature.title}</Text>
                    <Lock size={11} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.featureDesc} numberOfLines={1}>{feature.desc}</Text>
                  <View style={[styles.featureBadge, { backgroundColor: `${feature.badgeColor}15` }]}>
                    <Text style={[styles.featureBadgeText, { color: feature.badgeColor }]}>{feature.badge}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* 5. SCORE BREAKDOWN */}
        <Animated.View style={[styles.breakdownSection, { opacity: breakdownFade, transform: [{ translateY: breakdownSlide }] }]}>
          <View style={styles.breakdownDivider}>
            <View style={styles.breakdownDividerLine} />
            <View style={styles.breakdownDividerPill}>
              <Shield size={12} color="#A78BFA" />
              <Text style={styles.breakdownDividerText}>SCORE BREAKDOWN</Text>
            </View>
            <View style={styles.breakdownDividerLine} />
          </View>

          {categories.map((cat, catIdx) => {
            const cs = categoryScores[cat];
            const meta = CATEGORY_META[cat];
            if (!cs) return null;
            const pct = Math.round((cs.score / cs.max) * 100);
            return (
              <View key={cat} style={styles.breakdownRow}>
                <View style={styles.breakdownRowTop}>
                  <View style={styles.breakdownRowLeft}>
                    <View style={[styles.breakdownIcon, { backgroundColor: `${meta.color}15` }]}>
                      {meta.icon}
                    </View>
                    <View>
                      <Text style={styles.breakdownName}>{meta.label}</Text>
                      <Text style={styles.breakdownDetail} numberOfLines={1}>{cs.details.join(' · ')}</Text>
                    </View>
                  </View>
                  <View style={styles.breakdownRowRight}>
                    <Text style={[styles.breakdownPct, { color: meta.color }]}>{pct}%</Text>
                    <Text style={styles.breakdownScoreText}>{cs.score}/{cs.max}</Text>
                  </View>
                </View>
                <View style={styles.breakdownBar}>
                  <Animated.View style={[styles.breakdownBarFill, {
                    backgroundColor: meta.color,
                    width: barAnims[catIdx].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  }]} />
                </View>
              </View>
            );
          })}

          {/* 6. FULL BRAIN ANALYSIS */}
          <TouchableOpacity
            style={[styles.fullAnalysisBtn, { borderColor: `${Colors.teal}22` }]}
            onPress={handleViewInsights}
            activeOpacity={0.85}
            testID="view-insights"
          >
            <View style={styles.fullAnalysisBtnLeft}>
              <View style={styles.fullAnalysisIcon}>
                <TrendingUp size={18} color={Colors.teal} />
              </View>
              <View>
                <Text style={styles.fullAnalysisTitle}>Full Brain Analysis</Text>
                <Text style={styles.fullAnalysisSub}>Brain type, strengths & decision style</Text>
              </View>
            </View>
            <ChevronRight size={16} color={Colors.teal} />
          </TouchableOpacity>
        </Animated.View>

        {/* 7. FINAL CTA */}
        <Animated.View style={[styles.ctaSection, { opacity: ctaFade, transform: [{ translateY: ctaSlide }] }]}>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: themeAccent }]}
            onPress={handleRetry}
            activeOpacity={0.85}
            testID="retry-button"
          >
            <RefreshCw size={20} color={Colors.bg} />
            <Text style={styles.retryBtnText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={handleHome}
            activeOpacity={0.7}
            testID="home-button"
          >
            <Home size={16} color={Colors.textSecondary} />
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {notifyModal && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotifyModal(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View style={styles.modalGlow}>
              <Rocket size={30} color={Colors.amber} />
            </View>
            <Text style={styles.modalTitle}>{notifyModal}</Text>
            <Text style={styles.modalDesc}>This feature is coming soon. Be the first to know!</Text>
            <TouchableOpacity
              style={styles.notifyBtn}
              onPress={handleNotifyMe}
              activeOpacity={0.85}
              testID="notify-me-btn"
            >
              <Bell size={16} color={Colors.bg} />
              <Text style={styles.notifyBtnText}>Notify Me</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDismissBtn}
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
          <Rocket size={16} color={Colors.amber} />
          <Text style={styles.toastText}>Premium levels are coming soon 🚀</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden' as const,
  },
  bgGlowOrb: {
    position: 'absolute' as const,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.06,
  },
  bgGlowOrb2: {
    position: 'absolute' as const,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  bgGlowOrb3: {
    position: 'absolute' as const,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 56,
  },

  heroSection: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  themePill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  themePillEmoji: { fontSize: 16 },
  themePillText: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.8 },

  scoreContainer: {
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  scoreOuterRing: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scoreInnerCircle: {
    width: 166,
    height: 166,
    borderRadius: 83,
    borderWidth: 3,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden' as const,
  },
  scoreGlowBg: {
    position: 'absolute' as const,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.08,
  },
  scoreNumber: {
    fontSize: 58,
    fontWeight: '900' as const,
    lineHeight: 66,
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 3,
    marginTop: 2,
  },

  scoreBarContainer: {
    width: '100%' as const,
    maxWidth: 260,
    marginBottom: 18,
  },
  scoreBarTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  scoreBarFill: {
    height: '100%' as const,
    borderRadius: 2,
  },
  scoreBarLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 6,
  },
  scoreBarMin: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  scoreBarCurrent: {
    fontSize: 11,
    fontWeight: '800' as const,
  },
  scoreBarMax: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },

  tierRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 10,
  },
  tierBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  percentileBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,181,71,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,181,71,0.2)',
  },
  percentileText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 0.3,
  },

  brainTypeChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 10,
  },
  brainTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },

  personalizedLine: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    paddingHorizontal: 24,
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },

  challengeSection: {
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden' as const,
    padding: 18,
  },
  challengeCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 14,
  },
  challengeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    flex: 1,
  },
  percentBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  percentBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },

  shareMessageBox: {
    backgroundColor: `${Colors.bg}80`,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  shareMessage: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center' as const,
  },
  shareHighlight: {
    fontWeight: '800' as const,
  },

  shareButtons: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#25D366',
    height: 48,
    borderRadius: 14,
    gap: 8,
    paddingHorizontal: 12,
  },
  whatsappBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.bgCardLight,
    height: 48,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  copyBtnActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenGlow,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },

  insightTeaserWrap: {
    marginBottom: 20,
  },
  insightTeaserCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  insightTeaserLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 12,
  },
  insightTeaserIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.tealGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  insightTeaserContent: {
    flex: 1,
  },
  insightTeaserLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.teal,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  insightTeaserText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    lineHeight: 17,
  },
  insightTeaserArrow: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.tealGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },

  unlockSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },

  difficultyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  difficultyHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 18,
  },
  difficultyHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  difficultyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  difficultyTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  difficultySubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  difficultyTrack: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  difficultyItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  difficultyNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 7,
    zIndex: 2,
  },
  difficultyConnector: {
    position: 'absolute' as const,
    top: 13,
    left: '60%',
    right: '-40%',
    height: 2,
    zIndex: 1,
  },
  difficultyLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    marginBottom: 1,
  },
  difficultySublabel: {
    fontSize: 8,
    fontWeight: '500' as const,
  },
  difficultyHeaderTextWrap: {
    flex: 1,
  },
  comingSoonPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 181, 71, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 181, 71, 0.2)',
  },
  comingSoonPillText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 1.2,
  },
  premiumCTARow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 181, 71, 0.15)',
    backgroundColor: 'rgba(255, 181, 71, 0.04)',
  },
  premiumCTAText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.amber,
    letterSpacing: 0.2,
  },
  premiumGlowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
  },

  featureGrid: {
    gap: 8,
  },
  featureCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureBody: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 3,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  featureDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginBottom: 6,
  },
  featureBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featureBadgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },

  breakdownSection: {
    marginBottom: 24,
    marginTop: 4,
  },
  breakdownDivider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 10,
  },
  breakdownDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  breakdownDividerPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: 16,
  },
  breakdownDividerText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#A78BFA',
    letterSpacing: 1.5,
  },

  breakdownRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownRowTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  breakdownRowLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  breakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  breakdownName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  breakdownDetail: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    maxWidth: 140,
  },
  breakdownRowRight: {
    alignItems: 'flex-end' as const,
  },
  breakdownPct: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  breakdownScoreText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  breakdownBar: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  breakdownBarFill: {
    height: '100%' as const,
    borderRadius: 2,
  },

  fullAnalysisBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 10,
  },
  fullAnalysisBtnLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  fullAnalysisIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.tealGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fullAnalysisTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  fullAnalysisSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },

  ctaSection: {
    gap: 10,
    marginBottom: 8,
  },
  retryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: 56,
    borderRadius: 18,
    gap: 10,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  homeBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    gap: 8,
  },
  homeBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
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
  modalGlow: {
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
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 24,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  notifyBtn: {
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
  notifyBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.bg,
  },
  modalDismissBtn: {
    paddingVertical: 8,
  },
  modalDismissText: {
    fontSize: 13,
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
    borderColor: 'rgba(255, 181, 71, 0.3)',
    zIndex: 200,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.amber,
  },
});
