import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, Brain, Target, Eye, Heart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BUILD_LABEL } from '@/constants/buildInfo';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { trackLandingView, trackStartTest } from '@/lib/analytics';

const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const iconFloat1 = useRef(new Animated.Value(0)).current;
  const iconFloat2 = useRef(new Animated.Value(0)).current;
  const iconFloat3 = useRef(new Animated.Value(0)).current;
  const iconFloat4 = useRef(new Animated.Value(0)).current;
  const iconFloat5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -8,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 8,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

    const floatingLoops = [
      float(iconFloat1, 0),
      float(iconFloat2, 400),
      float(iconFloat3, 800),
      float(iconFloat4, 200),
      float(iconFloat5, 600),
    ];

    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    floatingLoops.forEach((loop) => loop.start());

    return () => {
      pulse.stop();
      floatingLoops.forEach((loop) => loop.stop());
    };
  }, [fadeIn, slideUp, pulseAnim, iconFloat1, iconFloat2, iconFloat3, iconFloat4, iconFloat5]);

  useEffect(() => {
    console.log('[Route] Landing render success', BUILD_LABEL);
    void trackLandingView();
  }, []);

  const handleStart = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void trackStartTest();
    router.push('/game');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.bgPattern}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.bgCircle,
              {
                top: `${15 + i * 15}%` as unknown as number,
                left: `${(i % 2 === 0 ? 10 : 60) + (i * 5)}%` as unknown as number,
                width: 100 + i * 30,
                height: 100 + i * 30,
                opacity: 0.03 + i * 0.005,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <View style={styles.iconRow}>
          <Animated.View style={[styles.featureIcon, styles.featureIconReaction, { transform: [{ translateY: iconFloat1 }] }]}>
            <Zap size={20} color={Colors.amber} />
          </Animated.View>
          <Animated.View style={[styles.featureIcon, { backgroundColor: 'rgba(96,165,250,0.15)' }, { transform: [{ translateY: iconFloat4 }] }]}>
            <Eye size={20} color="#60A5FA" />
          </Animated.View>
          <Animated.View style={[styles.featureIcon, styles.featureIconMemory, { transform: [{ translateY: iconFloat2 }] }]}>
            <Brain size={26} color={Colors.teal} />
          </Animated.View>
          <Animated.View style={[styles.featureIcon, styles.featureIconLogic, { transform: [{ translateY: iconFloat3 }] }]}>
            <Target size={20} color={Colors.amber} />
          </Animated.View>
          <Animated.View style={[styles.featureIcon, { backgroundColor: 'rgba(244,114,182,0.12)' }, { transform: [{ translateY: iconFloat5 }] }]}>
            <Heart size={20} color="#F472B6" />
          </Animated.View>
        </View>

        <Text style={styles.title}>BrainScore</Text>
        <Text style={styles.titleAccent}>Arena</Text>
        <Text style={styles.subtitle}>
          10 dynamic tests across reaction, memory,{'\n'}focus, logic & more — under 75 seconds
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>10</Text>
            <Text style={styles.statLabel}>Tests</Text>
          </View>
          <View style={[styles.statBadge, styles.statBadgeCenter]}>
            <Text style={styles.statNumber}>75s</Text>
            <Text style={styles.statLabel}>Max Time</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>1000</Text>
            <Text style={styles.statLabel}>Max Score</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: fadeIn,
            transform: [{ scale: pulseAnim }],
            paddingBottom: Math.max(insets.bottom, 20) + 20,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStart}
          activeOpacity={0.85}
          testID="start-test-button"
        >
          <Zap size={20} color={Colors.bg} />
          <Text style={styles.startButtonText}>Start Test</Text>
        </TouchableOpacity>
        <Text style={styles.tapHint}>Tap to begin</Text>
        <Text style={styles.buildMarker}>{BUILD_LABEL}</Text>
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
  },
  bgCircle: {
    position: 'absolute' as const,
    borderRadius: 999,
    backgroundColor: Colors.teal,
  },
  content: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
  },
  iconRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 32,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureIconReaction: {
    backgroundColor: Colors.amberGlow,
  },
  featureIconMemory: {
    backgroundColor: Colors.tealGlow,
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  featureIconLogic: {
    backgroundColor: Colors.amberGlow,
  },
  title: {
    fontSize: 42,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 48,
  },
  titleAccent: {
    fontSize: 42,
    fontWeight: '800' as const,
    color: Colors.teal,
    letterSpacing: -1,
    marginBottom: 16,
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 1,
    backgroundColor: Colors.border,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  statBadge: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center' as const,
  },
  statBadgeCenter: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.teal,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  buttonContainer: {
    alignItems: 'center' as const,
    paddingHorizontal: 32,
  },
  startButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.teal,
    width: width - 64,
    height: 58,
    borderRadius: 16,
    gap: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  tapHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 12,
  },
  buildMarker: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
    opacity: 0.8,
    textAlign: 'center' as const,
  },
});
