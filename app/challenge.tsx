import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Zap, Trophy, Swords } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Tiers, getTier } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ChallengeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ score: string; tier: string }>();

  const friendScore = Number(params.score) || 0;
  const friendTier = (params.tier as keyof typeof Tiers) || getTier(friendScore);
  const tierStyle = Tiers[friendTier] || Tiers.Rookie;

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const scoreScale = useRef(new Animated.Value(0.6)).current;
  const scoreFade = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(scoreScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(scoreFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ctaFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(ctaSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    );
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [fadeIn, slideUp, scoreScale, scoreFade, ctaFade, ctaSlide, pulseAnim, glowPulse]);

  const handleStart = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace('/game');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.bgPattern}>
        <View style={[styles.bgOrb, styles.bgOrb1, { backgroundColor: tierStyle.color }]} />
        <View style={[styles.bgOrb, styles.bgOrb2, { backgroundColor: Colors.teal }]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <View style={styles.challengeHeader}>
          <View style={styles.swordsWrap}>
            <Swords size={32} color={Colors.amber} />
          </View>
          <Text style={styles.challengeLabel}>CHALLENGE</Text>
        </View>

        <Text style={styles.friendText}>Your friend scored</Text>

        <Animated.View style={[styles.scoreContainer, {
          opacity: scoreFade,
          transform: [{ scale: scoreScale }],
        }]}>
          <Animated.View style={[styles.scoreGlow, { opacity: glowPulse, backgroundColor: tierStyle.color }]} />
          <View style={[styles.scoreCircle, { borderColor: `${tierStyle.color}50` }]}>
            <Text style={[styles.scoreNumber, { color: tierStyle.color }]}>{friendScore}</Text>
            <Text style={styles.scoreMax}>/1000</Text>
          </View>
        </Animated.View>

        <View style={[styles.tierBadge, { backgroundColor: tierStyle.bg, borderColor: `${tierStyle.color}30` }]}>
          <Trophy size={14} color={tierStyle.color} />
          <Text style={[styles.tierText, { color: tierStyle.color }]}>{friendTier}</Text>
        </View>

        <Text style={styles.beatItText}>Can you beat it?</Text>
      </Animated.View>

      <Animated.View style={[styles.ctaContainer, {
        opacity: ctaFade,
        transform: [{ translateY: ctaSlide }],
        paddingBottom: Math.max(insets.bottom, 20) + 20,
      }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            activeOpacity={0.85}
            testID="challenge-start-button"
          >
            <Zap size={22} color={Colors.bg} />
            <Text style={styles.startButtonText}>Accept Challenge</Text>
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/')}
          activeOpacity={0.7}
          testID="challenge-skip-button"
        >
          <Text style={styles.skipText}>Go to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden' as const,
  },
  bgOrb: {
    position: 'absolute' as const,
    borderRadius: 999,
    opacity: 0.06,
  },
  bgOrb1: {
    width: 300,
    height: 300,
    top: '10%',
    right: -80,
  },
  bgOrb2: {
    width: 250,
    height: 250,
    bottom: '15%',
    left: -60,
  },
  content: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
  },
  challengeHeader: {
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  swordsWrap: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: Colors.amberGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  challengeLabel: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 4,
  },
  friendText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 20,
  },
  scoreContainer: {
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
  },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.bgCard,
  },
  scoreNumber: {
    fontSize: 60,
    fontWeight: '800' as const,
    lineHeight: 68,
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
    marginBottom: 24,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  beatItText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  ctaContainer: {
    alignItems: 'center' as const,
    paddingHorizontal: 32,
  },
  startButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.amber,
    width: width - 64,
    height: 60,
    borderRadius: 18,
    gap: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
