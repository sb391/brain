import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { Shuffle } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 40 - CARD_GAP) / 2;

interface ThemeItem {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
  accentGlow: string;
}

const THEMES: ThemeItem[] = [
  { id: 'know-yourself', emoji: '🪞', title: 'Know Yourself', subtitle: 'Real-life decisions reveal your instincts', accent: '#00E5CC', accentGlow: 'rgba(0,229,204,0.12)' },
  { id: 'bollywood-buzz', emoji: '💃', title: 'Bollywood Buzz', subtitle: 'Gossip, drama, and fun choices', accent: '#FF6B9D', accentGlow: 'rgba(255,107,157,0.12)' },
  { id: 'marvel-vs-dc', emoji: '⚡', title: 'Marvel vs DC', subtitle: 'Heroes, power, and moral choices', accent: '#FF5A5A', accentGlow: 'rgba(255,90,90,0.12)' },
  { id: 'curiosity-lab', emoji: '🔬', title: 'Curiosity Lab', subtitle: 'Patterns, logic, and observation', accent: '#A78BFA', accentGlow: 'rgba(167,139,250,0.12)' },
  { id: 'game-day', emoji: '🏆', title: 'Game Day', subtitle: 'Fast decisions under pressure', accent: '#4ADE80', accentGlow: 'rgba(74,222,128,0.12)' },
  { id: 'math-blitz', emoji: '➗', title: 'Math Blitz', subtitle: 'Quick calculations and patterns', accent: '#60A5FA', accentGlow: 'rgba(96,165,250,0.12)' },
  { id: 'internet-culture', emoji: '🔥', title: 'Internet Culture', subtitle: 'Memes, trends, and viral instincts', accent: '#FB923C', accentGlow: 'rgba(251,146,60,0.12)' },
  { id: 'mind-benders', emoji: '🌀', title: 'Mind Benders', subtitle: 'Tricks, illusions, and surprises', accent: '#F472B6', accentGlow: 'rgba(244,114,182,0.12)' },
  { id: 'would-you-rather', emoji: '⚖️', title: 'Would You Rather', subtitle: 'Tough choices, no easy answers', accent: '#FBBF24', accentGlow: 'rgba(251,191,36,0.12)' },
  { id: 'street-smart', emoji: '🗺️', title: 'Street Smart', subtitle: 'Real-world situations and decisions', accent: '#34D399', accentGlow: 'rgba(52,211,153,0.12)' },
];

const RANDOM_THEME: ThemeItem = {
  id: 'choose-for-me',
  emoji: '🎰',
  title: 'Choose For Me',
  subtitle: 'Let the game surprise you',
  accent: Colors.teal,
  accentGlow: Colors.tealGlow,
};

function ThemeCard({ theme, onPress, index }: { theme: ThemeItem; onPress: () => void; index: number }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const isRandom = theme.id === 'choose-for-me';

  return (
    <Animated.View style={[
      isRandom ? styles.randomCardWrapper : styles.cardWrapper,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      },
    ]}>
      <TouchableOpacity
        style={[
          isRandom ? styles.randomCard : styles.card,
          { borderColor: theme.accent + '25' },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={`theme-${theme.id}`}
      >
        <View style={[
          styles.emojiContainer,
          { backgroundColor: theme.accentGlow },
          isRandom && styles.randomEmojiContainer,
        ]}>
          <Text style={[styles.emoji, isRandom && styles.randomEmoji]}>{theme.emoji}</Text>
        </View>
        <View style={isRandom ? styles.randomTextContainer : styles.textContainer}>
          <Text style={[styles.cardTitle, isRandom && styles.randomCardTitle]} numberOfLines={1}>
            {theme.title}
          </Text>
          <Text style={[styles.cardSubtitle, isRandom && styles.randomCardSubtitle]} numberOfLines={2}>
            {theme.subtitle}
          </Text>
        </View>
        {isRandom && (
          <View style={[styles.randomArrow, { backgroundColor: theme.accent + '20' }]}>
            <Shuffle size={18} color={theme.accent} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ThemesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerFade, headerSlide]);

  const handleThemeSelect = useCallback((theme: ThemeItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let selectedId = theme.id;
    if (theme.id === 'choose-for-me') {
      const randomIndex = Math.floor(Math.random() * THEMES.length);
      selectedId = THEMES[randomIndex].id;
      console.log(`[Themes] Random pick: ${selectedId}`);
    } else {
      console.log(`[Themes] Selected: ${selectedId}`);
    }

    router.push({ pathname: '/game', params: { theme: selectedId } });
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bgPattern}>
        <View style={[styles.bgOrb, styles.bgOrb1]} />
        <View style={[styles.bgOrb, styles.bgOrb2]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <Text style={styles.headerTitle}>Pick a Theme</Text>
          <Text style={styles.headerSubtitle}>Choose your arena, test your brain</Text>
        </Animated.View>

        <ThemeCard
          theme={RANDOM_THEME}
          onPress={() => handleThemeSelect(RANDOM_THEME)}
          index={0}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or pick one</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.grid}>
          {THEMES.map((theme, index) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onPress={() => handleThemeSelect(theme)}
              index={index + 1}
            />
          ))}
        </View>
      </ScrollView>
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
  },
  bgOrb1: {
    width: 300,
    height: 300,
    top: -80,
    right: -100,
    backgroundColor: 'rgba(0,229,204,0.03)',
  },
  bgOrb2: {
    width: 250,
    height: 250,
    bottom: 100,
    left: -80,
    backgroundColor: 'rgba(255,181,71,0.025)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    minHeight: 150,
  },
  randomCardWrapper: {
    width: '100%' as const,
  },
  randomCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  randomEmojiContainer: {
    marginBottom: 0,
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  emoji: {
    fontSize: 24,
  },
  randomEmoji: {
    fontSize: 26,
  },
  textContainer: {
    flex: 1,
  },
  randomTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  randomCardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  randomCardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  randomArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
