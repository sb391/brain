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
import { RotateCcw, Zap, Brain, Target, ChevronRight, Award, MessageCircle, Copy, Check as CheckIcon, Swords, Lock, Sparkles, Eye } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Tiers, getTier } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import * as ExpoLinking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentModal from '@/components/PaymentModal';


function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function calculateScores(params: {
  reactionMs: number;
  memoryCorrect: number;
  memoryTotal: number;
  logicCorrect: boolean;
  logicTimeMs: number;
}) {
  let reactionScore: number;
  if (params.reactionMs <= 200) reactionScore = 333;
  else if (params.reactionMs >= 800) reactionScore = 30;
  else reactionScore = Math.round(333 - ((params.reactionMs - 200) / 600) * 303);
  reactionScore = clamp(reactionScore, 30, 333);

  const memoryScore = Math.round((params.memoryCorrect / params.memoryTotal) * 333);

  let logicScore = 0;
  if (params.logicCorrect) {
    if (params.logicTimeMs <= 3000) logicScore = 334;
    else if (params.logicTimeMs >= 15000) logicScore = 170;
    else logicScore = Math.round(334 - ((params.logicTimeMs - 3000) / 12000) * 164);
  } else {
    logicScore = 33;
  }
  logicScore = clamp(logicScore, 0, 334);

  const total = reactionScore + memoryScore + logicScore;

  return {
    total,
    reaction: reactionScore,
    memory: memoryScore,
    logic: logicScore,
  };
}

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
  const params = useLocalSearchParams<{
    reactionMs: string;
    memoryCorrect: string;
    memoryTotal: string;
    logicCorrect: string;
    logicTimeMs: string;
  }>();

  const scores = useMemo(() => calculateScores({
    reactionMs: Number(params.reactionMs) || 500,
    memoryCorrect: Number(params.memoryCorrect) || 0,
    memoryTotal: Number(params.memoryTotal) || 5,
    logicCorrect: params.logicCorrect === 'true',
    logicTimeMs: Number(params.logicTimeMs) || 10000,
  }), [params.reactionMs, params.memoryCorrect, params.memoryTotal, params.logicCorrect, params.logicTimeMs]);

  const tier = useMemo(() => getTier(scores.total), [scores.total]);
  const tierStyle = Tiers[tier];

  const [displayedScore, setDisplayedScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [insightsUnlocked, setInsightsUnlocked] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const insightsFade = useRef(new Animated.Value(0)).current;
  const insightsSlide = useRef(new Animated.Value(40)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const shareFade = useRef(new Animated.Value(0)).current;
  const shareSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    void AsyncStorage.getItem('brainscore_insights_unlocked').then((val) => {
      if (val === 'true') {
        console.log('Insights already unlocked');
        setInsightsUnlocked(true);
      }
    });
  }, []);

  const estimatedPercentile = useMemo(() => {
    if (scores.total >= 900) return 1;
    if (scores.total >= 800) return 3;
    if (scores.total >= 700) return 8;
    if (scores.total >= 600) return 15;
    if (scores.total >= 500) return 25;
    if (scores.total >= 400) return 40;
    if (scores.total >= 300) return 55;
    if (scores.total >= 200) return 70;
    return 85;
  }, [scores.total]);

  const challengeUrl = useMemo(() => {
    const base = ExpoLinking.createURL('/challenge');
    return `${base}?score=${scores.total}&tier=${tier}`;
  }, [scores.total, tier]);

  const shareText = useMemo(() => {
    return `My BrainScore is ${scores.total}. I'm in the top ${estimatedPercentile}%. Can you beat me?`;
  }, [scores.total, estimatedPercentile]);

  const handleShareWhatsApp = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = `${shareText}\n\nTake the challenge: ${challengeUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(whatsappUrl);
    } catch (e) {
      console.log('Could not open WhatsApp:', e);
    }
  }, [shareText, challengeUrl]);

  const handleCopyLink = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = `${shareText}\n${challengeUrl}`;
    await Clipboard.setStringAsync(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [shareText, challengeUrl]);

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.8)).current;
  const tierBadgeFade = useRef(new Animated.Value(0)).current;
  const tierBadgeScale = useRef(new Animated.Value(0.5)).current;
  const messageFade = useRef(new Animated.Value(0)).current;
  const breakdownFade = useRef(new Animated.Value(0)).current;
  const breakdownSlide = useRef(new Animated.Value(40)).current;
  const actionsFade = useRef(new Animated.Value(0)).current;
  const actionsSlide = useRef(new Animated.Value(30)).current;
  const ringProgress = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  const barAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.timing(ringProgress, {
      toValue: scores.total / 1000,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    const startTime = Date.now();
    const duration = 1800;
    const countInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * scores.total);
      setDisplayedScore(current);

      if (progress >= 1) {
        clearInterval(countInterval);
        setDisplayedScore(scores.total);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, 16);

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(tierBadgeScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.timing(tierBadgeFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 800);

    setTimeout(() => {
      Animated.timing(messageFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 1200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(breakdownFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(breakdownSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();

      Animated.stagger(120, [
        Animated.timing(cardAnims[0], { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardAnims[1], { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardAnims[2], { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      Animated.stagger(200, [
        Animated.timing(barAnims[0], { toValue: scores.reaction / 333, duration: 900, useNativeDriver: false }),
        Animated.timing(barAnims[1], { toValue: scores.memory / 333, duration: 900, useNativeDriver: false }),
        Animated.timing(barAnims[2], { toValue: scores.logic / 334, duration: 900, useNativeDriver: false }),
      ]).start();
    }, 1600);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(actionsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(actionsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(shareFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(shareSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 2600);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(insightsFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(insightsSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 2000);

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    );
    glow.start();

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    shimmer.start();

    return () => {
      clearInterval(countInterval);
      glow.stop();
      shimmer.stop();
    };
  }, [heroFade, heroScale, tierBadgeFade, tierBadgeScale, messageFade, breakdownFade, breakdownSlide, actionsFade, actionsSlide, ringProgress, barAnims, cardAnims, glowPulse, shareFade, shareSlide, insightsFade, insightsSlide, shimmerAnim, scores]);

  const insightsParams = useMemo(() => ({
    total: String(scores.total),
    reaction: String(scores.reaction),
    memory: String(scores.memory),
    logic: String(scores.logic),
    reactionMs: params.reactionMs || '500',
    memoryCorrect: params.memoryCorrect || '0',
    memoryTotal: params.memoryTotal || '5',
    logicCorrect: params.logicCorrect || 'false',
  }), [scores, params.reactionMs, params.memoryCorrect, params.memoryTotal, params.logicCorrect]);

  const handleUnlockInsights = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPaymentModalVisible(true);
  }, []);

  const handlePaymentSuccess = useCallback(async () => {
    setPaymentModalVisible(false);
    setInsightsUnlocked(true);
    await AsyncStorage.setItem('brainscore_insights_unlocked', 'true');
    console.log('Insights unlocked and saved');
    setTimeout(() => {
      router.push({ pathname: '/insights', params: insightsParams });
    }, 300);
  }, [router, insightsParams]);

  const handleViewInsights = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/insights', params: insightsParams });
  }, [router, insightsParams]);

  const handleRetry = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/game');
  };

  const handleHome = () => {
    router.replace('/');
  };

  const breakdownItems = [
    {
      label: 'Reaction',
      score: scores.reaction,
      max: 333,
      icon: <Zap size={20} color={Colors.amber} />,
      color: Colors.amber,
      detail: `${params.reactionMs}ms`,
      barAnim: barAnims[0],
      cardAnim: cardAnims[0],
    },
    {
      label: 'Memory',
      score: scores.memory,
      max: 333,
      icon: <Brain size={20} color={Colors.teal} />,
      color: Colors.teal,
      detail: `${params.memoryCorrect}/${params.memoryTotal}`,
      barAnim: barAnims[1],
      cardAnim: cardAnims[1],
    },
    {
      label: 'Logic',
      score: scores.logic,
      max: 334,
      icon: <Target size={20} color={params.logicCorrect === 'true' ? Colors.green : Colors.red} />,
      color: params.logicCorrect === 'true' ? Colors.green : Colors.red,
      detail: params.logicCorrect === 'true' ? 'Correct' : 'Incorrect',
      barAnim: barAnims[2],
      cardAnim: cardAnims[2],
    },
  ];

  const scorePercentage = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.heroSection, {
          opacity: heroFade,
          transform: [{ scale: heroScale }],
        }]}>
          <View style={styles.scoreRingOuter}>
            <Animated.View style={[styles.scoreGlow, { opacity: glowPulse, backgroundColor: tierStyle.color }]} />
            <View style={[styles.scoreRingTrack, { borderColor: Colors.border }]}>
              <Animated.View style={[styles.scoreRingFillBg, {
                width: scorePercentage,
                backgroundColor: tierStyle.color,
              }]} />
            </View>
            <View style={[styles.scoreCircleInner, { borderColor: `${tierStyle.color}40` }]}>
              <Text style={[styles.scoreNumber, { color: tierStyle.color }]}>
                {displayedScore}
              </Text>
              <Text style={styles.scoreMax}>/1000</Text>
            </View>
          </View>

          <Animated.View style={[
            styles.tierBadge,
            { backgroundColor: tierStyle.bg, borderColor: `${tierStyle.color}30` },
            { opacity: tierBadgeFade, transform: [{ scale: tierBadgeScale }] },
          ]}>
            <Award size={16} color={tierStyle.color} />
            <Text style={[styles.tierText, { color: tierStyle.color }]}>{tier}</Text>
          </Animated.View>

          <Animated.Text style={[styles.scoreMessage, { opacity: messageFade }]}>
            {getScoreMessage(scores.total)}
          </Animated.Text>
        </Animated.View>

        <Animated.View style={[styles.breakdownSection, {
          opacity: breakdownFade,
          transform: [{ translateY: breakdownSlide }],
        }]}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownTitle}>Performance Breakdown</Text>
          </View>

          {breakdownItems.map((item) => (
            <Animated.View
              key={item.label}
              style={[styles.breakdownCard, { opacity: item.cardAnim }]}
            >
              <View style={styles.breakdownCardTop}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.breakdownIconWrap, { backgroundColor: `${item.color}15` }]}>
                    {item.icon}
                  </View>
                  <View>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={styles.breakdownDetail}>{item.detail}</Text>
                  </View>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={[styles.breakdownScore, { color: item.color }]}>{item.score}</Text>
                  <Text style={styles.breakdownMaxScore}>/{item.max}</Text>
                </View>
              </View>
              <View style={styles.breakdownBarTrack}>
                <Animated.View
                  style={[
                    styles.breakdownBarFill,
                    {
                      backgroundColor: item.color,
                      width: item.barAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.actions, {
          opacity: actionsFade,
          transform: [{ translateY: actionsSlide }],
        }]}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.85}
            testID="retry-button"
          >
            <RotateCcw size={20} color={Colors.bg} />
            <Text style={styles.retryButtonText}>Try Again</Text>
            <ChevronRight size={18} color={Colors.bg} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleHome}
            activeOpacity={0.7}
            testID="home-button"
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.shareSection, {
          opacity: shareFade,
          transform: [{ translateY: shareSlide }],
        }]}>
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
                <Text style={[styles.shareQuoteHighlight, { color: tierStyle.color }]}>{scores.total}</Text>
                {`.\nI'm in the top `}
                <Text style={[styles.shareQuoteHighlight, { color: Colors.amber }]}>{estimatedPercentile}%</Text>
                {`.\nCan you beat me?"`}
              </Text>
            </View>

            <View style={styles.shareButtons}>
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={handleShareWhatsApp}
                activeOpacity={0.8}
                testID="share-whatsapp"
              >
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.whatsappButtonText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.copyButton,
                  copied && styles.copyButtonCopied,
                ]}
                onPress={handleCopyLink}
                activeOpacity={0.8}
                testID="share-copy"
              >
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

        <Animated.View style={[styles.insightsSection, {
          opacity: insightsFade,
          transform: [{ translateY: insightsSlide }],
        }]}>
          <View style={styles.insightsDivider}>
            <View style={styles.insightsDividerLine} />
            <View style={styles.insightsDividerBadge}>
              <Sparkles size={14} color="#A78BFA" />
              <Text style={styles.insightsDividerText}>INSIGHTS</Text>
            </View>
            <View style={styles.insightsDividerLine} />
          </View>

          {insightsUnlocked ? (
            <TouchableOpacity
              style={styles.viewInsightsCard}
              onPress={handleViewInsights}
              activeOpacity={0.85}
              testID="view-insights"
            >
              <View style={styles.viewInsightsLeft}>
                <View style={styles.viewInsightsIconWrap}>
                  <Eye size={22} color={Colors.teal} />
                </View>
                <View>
                  <Text style={styles.viewInsightsTitle}>Full Insights Ready</Text>
                  <Text style={styles.viewInsightsSubtitle}>View your brain type & analysis</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <View style={styles.lockedInsightsCard}>
              <View style={styles.lockedPreviewWrap}>
                <View style={styles.lockedPreviewRow}>
                  <View style={styles.lockedPreviewIcon}>
                    <Brain size={16} color={Colors.textMuted} />
                  </View>
                  <View style={styles.lockedPreviewTextBlock}>
                    <View style={[styles.blurredLine, { width: '70%' }]} />
                    <View style={[styles.blurredLine, { width: '50%', marginTop: 6 }]} />
                  </View>
                </View>
                <View style={styles.lockedPreviewRow}>
                  <View style={styles.lockedPreviewIcon}>
                    <Sparkles size={16} color={Colors.textMuted} />
                  </View>
                  <View style={styles.lockedPreviewTextBlock}>
                    <View style={[styles.blurredLine, { width: '85%' }]} />
                    <View style={[styles.blurredLine, { width: '60%', marginTop: 6 }]} />
                  </View>
                </View>
                <View style={styles.lockedPreviewRow}>
                  <View style={styles.lockedPreviewIcon}>
                    <Target size={16} color={Colors.textMuted} />
                  </View>
                  <View style={styles.lockedPreviewTextBlock}>
                    <View style={[styles.blurredLine, { width: '75%' }]} />
                    <View style={[styles.blurredLine, { width: '45%', marginTop: 6 }]} />
                  </View>
                </View>

                <View style={styles.lockedOverlay}>
                  <Animated.View style={[styles.lockPulseRing, { opacity: shimmerAnim }]} />
                  <View style={styles.lockCircle}>
                    <Lock size={22} color={Colors.amber} />
                  </View>
                </View>
              </View>

              <View style={styles.lockedBottomSection}>
                <Text style={styles.lockedTitle}>Detailed Insights</Text>
                <Text style={styles.lockedSubtitle}>
                  Your brain type, strengths, weaknesses & personalized tips
                </Text>
                <TouchableOpacity
                  style={styles.unlockButton}
                  onPress={handleUnlockInsights}
                  activeOpacity={0.85}
                  testID="unlock-insights"
                >
                  <Lock size={16} color="#1A1A2E" />
                  <Text style={styles.unlockButtonText}>Unlock Full Insights — ₹49</Text>
                </TouchableOpacity>
                <Text style={styles.unlockNote}>One-time payment · Instant access</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={handlePaymentSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center' as const,
    marginBottom: 36,
  },
  scoreRingOuter: {
    width: 200,
    height: 200,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  scoreGlow: {
    position: 'absolute' as const,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.15,
  },
  scoreRingTrack: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden' as const,
    borderWidth: 0,
  },
  scoreRingFillBg: {
    height: '100%',
    borderRadius: 2,
  },
  scoreCircleInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.bgCard,
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: '800' as const,
    lineHeight: 72,
  },
  scoreMax: {
    fontSize: 18,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: -4,
  },
  tierBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  tierText: {
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  scoreMessage: {
    fontSize: 17,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  breakdownSection: {
    marginBottom: 32,
  },
  breakdownHeader: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  breakdownCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownCardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  breakdownLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  breakdownIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  breakdownDetail: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  breakdownRight: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 2,
  },
  breakdownScore: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  breakdownMaxScore: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  breakdownBarTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actions: {
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.teal,
    height: 58,
    borderRadius: 18,
    gap: 10,
  },
  retryButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.bg,
    flex: 1,
    textAlign: 'center' as const,
    marginLeft: 28,
  },
  homeButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  shareSection: {
    marginTop: 32,
    paddingBottom: 20,
  },
  shareDivider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    gap: 12,
  },
  shareDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  shareDividerBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.amberGlow,
    borderRadius: 20,
  },
  shareDividerText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 2,
  },
  shareCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden' as const,
  },
  shareCardInner: {
    padding: 22,
    paddingBottom: 18,
  },
  shareQuote: {
    fontSize: 17,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 26,
    textAlign: 'center' as const,
  },
  shareQuoteHighlight: {
    fontWeight: '800' as const,
  },
  shareButtons: {
    flexDirection: 'row' as const,
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#25D366',
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  whatsappButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.bgCardLight,
    height: 50,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copyButtonCopied: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenGlow,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  insightsSection: {
    marginTop: 28,
    paddingBottom: 20,
  },
  insightsDivider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    gap: 12,
  },
  insightsDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  insightsDividerBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderRadius: 20,
  },
  insightsDividerText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#A78BFA',
    letterSpacing: 2,
  },
  viewInsightsCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: `${Colors.teal}30`,
  },
  viewInsightsLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    flex: 1,
  },
  viewInsightsIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.tealGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  viewInsightsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  viewInsightsSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  lockedInsightsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden' as const,
  },
  lockedPreviewWrap: {
    padding: 20,
    gap: 14,
  },
  lockedPreviewRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  lockedPreviewIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.bgCardLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  lockedPreviewTextBlock: {
    flex: 1,
  },
  blurredLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.bgCardLight,
  },
  lockedOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(20, 30, 48, 0.75)',
  },
  lockPulseRing: {
    position: 'absolute' as const,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.amberGlow,
  },
  lockCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.amberGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  lockedBottomSection: {
    padding: 20,
    paddingTop: 4,
    alignItems: 'center' as const,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  lockedSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 19,
    marginBottom: 18,
  },
  unlockButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.amber,
    height: 52,
    borderRadius: 16,
    gap: 10,
    width: '100%',
    marginBottom: 10,
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#1A1A2E',
  },
  unlockNote: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
