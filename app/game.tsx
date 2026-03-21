import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, Brain, Target, Eye, Globe, Heart, Check, X, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import {
  generateTestQueue,
  scoreReaction,
  scoreMemoryNumbers,
  scoreMemoryPattern,
  scoreMCQ,
  scoreBehavioral,
} from '@/constants/gameData';
import type { GeneratedTest, TestResult, TestCategory } from '@/constants/gameData';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const TOTAL_TESTS = 10;
const MCQ_TIME_LIMIT = 6000;
const MEMORY_SHOW_DURATION = 2500;
const MEMORY_INPUT_TIMEOUT = 8000;
const PATTERN_SHOW_DURATION = 2000;
const PATTERN_INPUT_TIMEOUT = 6000;
const BEHAVIORAL_TIMEOUT = 10000;

type Phase = 'countdown' | 'transition' | 'test';
type SubPhase = 'wait' | 'early' | 'go' | 'show' | 'input' | 'active' | 'done';

const ICON_MAP: Record<string, React.ReactNode> = {
  zap: <Zap size={32} color={Colors.amber} />,
  brain: <Brain size={32} color={Colors.teal} />,
  eye: <Eye size={32} color="#60A5FA" />,
  target: <Target size={32} color={Colors.amber} />,
  globe: <Globe size={32} color={Colors.green} />,
  heart: <Heart size={32} color="#F472B6" />,
};

const CATEGORY_COLORS: Record<TestCategory, string> = {
  reaction: Colors.amber,
  memory: Colors.teal,
  focus: '#60A5FA',
  logic: Colors.amber,
  awareness: Colors.green,
  behavioral: '#F472B6',
};

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [testQueue] = useState<GeneratedTest[]>(() => generateTestQueue());
  const [phase, setPhase] = useState<Phase>('countdown');
  const [subPhase, setSubPhase] = useState<SubPhase>('wait');
  const [countdown, setCountdown] = useState(3);
  const [testIdx, setTestIdx] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);

  const [reactionStart, setReactionStart] = useState(0);
  const [reactionMs, setReactionMs] = useState(0);
  const [earlyTap, setEarlyTap] = useState(false);
  const [earlyTapCount, setEarlyTapCount] = useState(0);

  const [memoryInput, setMemoryInput] = useState<string[]>([]);
  const [memoryCorrect, setMemoryCorrect] = useState(0);

  const [patternSelected, setPatternSelected] = useState<number[]>([]);
  const [patternResult, setPatternResult] = useState<{ correct: number; wrong: number } | null>(null);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [behavioralChoice, setBehavioralChoice] = useState<'A' | 'B' | null>(null);
  const [testStartTime, setTestStartTime] = useState(0);
  const [timerProgress, setTimerProgress] = useState(1);
  const [lastScore, setLastScore] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const countdownScale = useRef(new Animated.Value(0.5)).current;
  const countdownOpacity = useRef(new Animated.Value(1)).current;
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionSlide = useRef(new Animated.Value(50)).current;
  const feedbackScale = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transientTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const transitionStartedRef = useRef(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const initTestRef = useRef<() => void>(() => {});
  const advanceToNextRef = useRef<() => void>(() => {});
  const completeTestRef = useRef<(correct: boolean, timeMs: number) => void>(() => {});
  const completeBehavioralRef = useRef<(choice: 'A' | 'B', timeMs: number) => void>(() => {});

  const currentTest = testQueue[testIdx] as GeneratedTest | undefined;

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      transientTimeoutsRef.current = transientTimeoutsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);

    transientTimeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const clearAllTimers = useCallback(() => {
    if (reactionTimeoutRef.current) { clearTimeout(reactionTimeoutRef.current); reactionTimeoutRef.current = null; }
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (autoAdvanceRef.current) { clearTimeout(autoAdvanceRef.current); autoAdvanceRef.current = null; }
    transientTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    transientTimeoutsRef.current = [];
  }, []);

  const startCountdownTimer = useCallback((durationMs: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerProgress(1);
    const startTime = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.max(0, 1 - elapsed / durationMs);
      setTimerProgress(progress);
      if (progress <= 0 && timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }, 50);
  }, []);

  const showFeedbackOverlay = useCallback((correct: boolean, score: number) => {
    setLastCorrect(correct);
    setLastScore(score);
    feedbackScale.setValue(0.3);
    feedbackOpacity.setValue(1);
    void Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    Animated.parallel([
      Animated.spring(feedbackScale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(feedbackOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [feedbackScale, feedbackOpacity]);

  const initTest = useCallback(() => {
    const test = testQueue[testIdx];
    if (!test) return;
    transitionStartedRef.current = false;
    setPhase('test');
    setTestStartTime(Date.now());
    setSelectedOption(null);
    setBehavioralChoice(null);
    setEarlyTap(false);
    setEarlyTapCount(0);
    setReactionMs(0);
    setTimerProgress(1);
    setPatternResult(null);
    console.log(`[Game] Init test ${testIdx + 1}/${TOTAL_TESTS}: ${test.type}`);
    switch (test.type) {
      case 'reaction-color':
      case 'reaction-shape':
        setSubPhase('wait');
        break;
      case 'memory-numbers':
        setSubPhase('show');
        setMemoryInput(new Array(test.memoryNumbers?.length ?? 4).fill(''));
        setMemoryCorrect(0);
        break;
      case 'memory-pattern':
        setSubPhase('show');
        setPatternSelected([]);
        break;
      default:
        setSubPhase('active');
        break;
    }
  }, [testIdx, testQueue]);
  initTestRef.current = initTest;

  const startTransition = useCallback(() => {
    if (transitionStartedRef.current) return;
    transitionStartedRef.current = true;
    clearAllTimers();
    setPhase('transition');
    transitionSlide.setValue(50);
    transitionOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(transitionOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(transitionSlide, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
    ]).start(() => {
      scheduleTimeout(() => {
        Animated.timing(transitionOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          initTestRef.current();
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
      }, 700);
    });
  }, [fadeAnim, transitionSlide, transitionOpacity, clearAllTimers, scheduleTimeout]);

  const finishGame = useCallback(() => {
    const payload = JSON.stringify(results.length > 0 ? results : []);
    console.log('[Game] Finishing game, navigating to results');
    router.replace({ pathname: '/results', params: { data: payload } });
  }, [results, router]);

  const advanceToNext = useCallback(() => {
    clearAllTimers();
    if (testIdx >= TOTAL_TESTS - 1) {
      finishGame();
    } else {
      setTestIdx(prev => prev + 1);
      startTransition();
    }
  }, [testIdx, clearAllTimers, startTransition, finishGame]);
  advanceToNextRef.current = advanceToNext;

  const completeTest = useCallback((correct: boolean, timeMs: number) => {
    if (!currentTest || subPhase === 'done') return;
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }

    let score = 0;
    let detail = '';
    let isCorrect = correct;

    switch (currentTest.type) {
      case 'reaction-color':
      case 'reaction-shape': {
        score = scoreReaction(timeMs, earlyTapCount);
        detail = `${timeMs}ms${earlyTapCount > 0 ? ` (+${earlyTapCount} early)` : ''}`;
        break;
      }
      case 'memory-numbers': {
        const seq = currentTest.memoryNumbers ?? [];
        let corr = 0;
        memoryInput.forEach((v, i) => { if (v === String(seq[i])) corr++; });
        score = scoreMemoryNumbers(corr, seq.length);
        detail = `${corr}/${seq.length} correct`;
        setMemoryCorrect(corr);
        isCorrect = corr >= Math.ceil(seq.length / 2);
        break;
      }
      case 'memory-pattern': {
        const targetCells = currentTest.memoryPattern?.cells ?? [];
        const correctHits = patternSelected.filter(c => targetCells.includes(c)).length;
        const wrongHits = patternSelected.filter(c => !targetCells.includes(c)).length;
        score = scoreMemoryPattern(correctHits, targetCells.length, wrongHits);
        detail = `${correctHits}/${targetCells.length} recalled`;
        setPatternResult({ correct: correctHits, wrong: wrongHits });
        isCorrect = correctHits >= Math.ceil(targetCells.length / 2);
        break;
      }
      case 'stroop':
      case 'odd-one-out':
      case 'trick-question':
      case 'reasoning':
      case 'awareness': {
        score = scoreMCQ(isCorrect, timeMs, MCQ_TIME_LIMIT);
        detail = isCorrect ? `Correct (${(timeMs / 1000).toFixed(1)}s)` : 'Incorrect';
        break;
      }
      case 'behavioral': {
        score = scoreBehavioral(timeMs);
        detail = 'Choice recorded';
        isCorrect = true;
        break;
      }
    }

    console.log(`[Game] Test ${testIdx + 1} complete: ${currentTest.type} score=${score}`);

    const result: TestResult = {
      type: currentTest.type,
      category: currentTest.category,
      score,
      maxScore: 100,
      detail,
      timeMs,
      correct: isCorrect,
      behavioralTrait: currentTest.behavioral?.trait,
      behavioralChoice: behavioralChoice ?? undefined,
    };

    setResults(prev => [...prev, result]);
    setSubPhase('done');
    showFeedbackOverlay(isCorrect, score);

    autoAdvanceRef.current = setTimeout(() => {
      advanceToNextRef.current();
    }, 1800);
  }, [currentTest, subPhase, earlyTapCount, memoryInput, patternSelected, behavioralChoice, testIdx, showFeedbackOverlay]);
  completeTestRef.current = completeTest;

  const completeBehavioral = useCallback((choice: 'A' | 'B', timeMs: number) => {
    if (subPhase === 'done') return;
    setBehavioralChoice(choice);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeTest(true, timeMs);
  }, [subPhase, completeTest]);
  completeBehavioralRef.current = completeBehavioral;

  const handleReactionTap = useCallback(() => {
    if (subPhase === 'wait') {
      if (reactionTimeoutRef.current) { clearTimeout(reactionTimeoutRef.current); reactionTimeoutRef.current = null; }
      setSubPhase('early');
      setEarlyTap(true);
      setEarlyTapCount(p => p + 1);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log('[Game] Early tap detected');
      scheduleTimeout(() => {
        setEarlyTap(false);
        setSubPhase('wait');
      }, 1200);
      return;
    }
    if (subPhase === 'early') return;
    if (subPhase !== 'go') return;
    const ms = Date.now() - reactionStart;
    setReactionMs(ms);
    completeTest(ms < 350, ms);
  }, [subPhase, reactionStart, completeTest, scheduleTimeout]);

  const handleMemoryInputChange = useCallback((text: string, index: number) => {
    if (text.length > 1 || subPhase === 'done') return;
    const newInput = [...memoryInput];
    newInput[index] = text;
    setMemoryInput(newInput);
    if (text && index < newInput.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (text && index === newInput.length - 1) {
      const timeMs = Date.now() - testStartTime;
      completeTest(false, timeMs);
    }
  }, [memoryInput, subPhase, testStartTime, completeTest]);

  const handlePatternCellTap = useCallback((cellIdx: number) => {
    if (subPhase !== 'input') return;
    setPatternSelected(prev => {
      if (prev.includes(cellIdx)) return prev.filter(c => c !== cellIdx);
      const maxCells = currentTest?.memoryPattern?.cells.length ?? 4;
      if (prev.length >= maxCells) return prev;
      return [...prev, cellIdx];
    });
  }, [subPhase, currentTest]);

  const handlePatternSubmit = useCallback(() => {
    const timeMs = Date.now() - testStartTime;
    completeTest(false, timeMs);
  }, [testStartTime, completeTest]);

  const handleMCQAnswer = useCallback((index: number) => {
    if (selectedOption !== null || subPhase === 'done') return;
    setSelectedOption(index);
    const timeMs = Date.now() - testStartTime;
    let correctIndex = -1;
    if (currentTest?.type === 'stroop') {
      correctIndex = currentTest.stroop?.correctIndex ?? -1;
    } else if (currentTest?.type === 'odd-one-out') {
      correctIndex = currentTest.oddOneOut?.correctIndex ?? -1;
    } else {
      correctIndex = currentTest?.mcq?.correctIndex ?? -1;
    }
    const correct = index === correctIndex;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeTest(correct, timeMs);
  }, [selectedOption, subPhase, testStartTime, currentTest, completeTest]);

  const handleBehavioralChoice = useCallback((choice: 'A' | 'B') => {
    const timeMs = Date.now() - testStartTime;
    completeBehavioral(choice, timeMs);
  }, [testStartTime, completeBehavioral]);

  const handleAdvanceTap = useCallback(() => {
    if (subPhase === 'done') {
      if (autoAdvanceRef.current) { clearTimeout(autoAdvanceRef.current); autoAdvanceRef.current = null; }
      advanceToNext();
    }
  }, [subPhase, advanceToNext]);

  // --- EFFECTS (all after callbacks) ---

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      startTransition();
      return;
    }
    countdownOpacity.setValue(1);
    Animated.sequence([
      Animated.timing(countdownScale, { toValue: 1.3, duration: 200, useNativeDriver: true }),
      Animated.timing(countdownScale, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    Animated.timing(countdownOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }).start();
    const t = setTimeout(() => setCountdown(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, countdown, countdownScale, countdownOpacity, startTransition]);

  useEffect(() => {
    if (phase !== 'test' || !currentTest) return;
    const isReaction = currentTest.type === 'reaction-color' || currentTest.type === 'reaction-shape';
    if (!isReaction || subPhase !== 'wait') return;
    const delay = 1500 + Math.random() * 2000;
    console.log(`[Game] Reaction wait, signal in ${Math.round(delay)}ms`);
    reactionTimeoutRef.current = setTimeout(() => {
      setReactionStart(Date.now());
      setSubPhase('go');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, delay);
    return () => {
      if (reactionTimeoutRef.current) { clearTimeout(reactionTimeoutRef.current); reactionTimeoutRef.current = null; }
    };
  }, [phase, subPhase, currentTest]);

  useEffect(() => {
    if (phase !== 'test' || !currentTest) return;
    if (currentTest.type === 'memory-numbers' && subPhase === 'show') {
      startCountdownTimer(MEMORY_SHOW_DURATION);
      const t = setTimeout(() => {
        setSubPhase('input');
        startCountdownTimer(MEMORY_INPUT_TIMEOUT);
        scheduleTimeout(() => inputRefs.current[0]?.focus(), 300);
      }, MEMORY_SHOW_DURATION);
      const inputTimeout = setTimeout(() => {
        completeTestRef.current(false, MEMORY_SHOW_DURATION + MEMORY_INPUT_TIMEOUT);
      }, MEMORY_SHOW_DURATION + MEMORY_INPUT_TIMEOUT);
      return () => { clearTimeout(t); clearTimeout(inputTimeout); };
    }
  }, [phase, subPhase, currentTest, startCountdownTimer, scheduleTimeout]);

  useEffect(() => {
    if (phase !== 'test' || !currentTest) return;
    if (currentTest.type === 'memory-pattern' && subPhase === 'show') {
      startCountdownTimer(PATTERN_SHOW_DURATION);
      const t = setTimeout(() => {
        setSubPhase('input');
        startCountdownTimer(PATTERN_INPUT_TIMEOUT);
      }, PATTERN_SHOW_DURATION);
      const inputTimeout = setTimeout(() => {
        completeTestRef.current(false, PATTERN_SHOW_DURATION + PATTERN_INPUT_TIMEOUT);
      }, PATTERN_SHOW_DURATION + PATTERN_INPUT_TIMEOUT);
      return () => { clearTimeout(t); clearTimeout(inputTimeout); };
    }
  }, [phase, subPhase, currentTest, startCountdownTimer]);

  useEffect(() => {
    if (phase !== 'test' || !currentTest) return;
    const isMCQ = ['stroop', 'odd-one-out', 'trick-question', 'reasoning', 'awareness'].includes(currentTest.type);
    if (isMCQ && subPhase === 'active') {
      startCountdownTimer(MCQ_TIME_LIMIT);
      const t = setTimeout(() => {
        completeTestRef.current(false, MCQ_TIME_LIMIT);
      }, MCQ_TIME_LIMIT);
      return () => clearTimeout(t);
    }
  }, [phase, subPhase, currentTest, startCountdownTimer]);

  useEffect(() => {
    if (phase !== 'test' || !currentTest) return;
    if (currentTest.type === 'behavioral' && subPhase === 'active') {
      const t = setTimeout(() => {
        const randomChoice = Math.random() > 0.5 ? 'A' as const : 'B' as const;
        completeBehavioralRef.current(randomChoice, BEHAVIORAL_TIMEOUT);
      }, BEHAVIORAL_TIMEOUT);
      return () => clearTimeout(t);
    }
  }, [phase, subPhase, currentTest]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (testIdx + (subPhase === 'done' ? 1 : 0)) / TOTAL_TESTS,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [testIdx, subPhase, progressAnim]);

  // --- RENDERERS ---

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Test {Math.min(testIdx + 1, TOTAL_TESTS)} of {TOTAL_TESTS}</Text>
        {currentTest && (
          <Text style={[styles.progressCategory, { color: CATEGORY_COLORS[currentTest.category] }]}>
            {currentTest.label}
          </Text>
        )}
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, {
          width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]} />
      </View>
    </View>
  );

  const renderTimerBar = (color: string) => (
    <View style={styles.timerBar}>
      <View style={[styles.timerBarFill, {
        width: `${Math.max(0, timerProgress * 100)}%`,
        backgroundColor: timerProgress < 0.25 ? Colors.red : color,
      }]} />
    </View>
  );

  const renderCountdown = () => (
    <View style={styles.centerContent}>
      <Text style={styles.getReadyText}>Get Ready</Text>
      <Animated.Text style={[styles.countdownNumber, {
        transform: [{ scale: countdownScale }],
        opacity: countdownOpacity,
      }]}>
        {countdown}
      </Animated.Text>
      <Text style={styles.countdownSub}>{TOTAL_TESTS} tests ahead</Text>
    </View>
  );

  const renderTransition = () => {
    if (!currentTest) return null;
    return (
      <Animated.View style={[styles.transitionContainer, {
        opacity: transitionOpacity,
        transform: [{ translateY: transitionSlide }],
      }]}>
        <View style={styles.transitionIconWrap}>
          {ICON_MAP[currentTest.iconType]}
        </View>
        <Text style={styles.transitionLabel}>{currentTest.label}</Text>
        <Text style={styles.transitionSub}>Test {testIdx + 1} of {TOTAL_TESTS}</Text>
      </Animated.View>
    );
  };

  const renderReactionTest = () => {
    if (!currentTest) return null;
    const isShape = currentTest.type === 'reaction-shape';
    return (
      <TouchableOpacity
        style={[
          styles.reactionArea,
          subPhase === 'go' && styles.reactionAreaGo,
          (subPhase === 'early' || earlyTap) && styles.reactionAreaEarly,
        ]}
        onPress={handleReactionTap}
        activeOpacity={0.95}
        disabled={subPhase === 'done'}
        testID="reaction-tap-area"
      >
        <View style={[styles.reactionIconWrap, subPhase === 'go' && { backgroundColor: 'rgba(11,17,32,0.25)' }]}>
          {isShape ? (
            <Target size={48} color={subPhase === 'go' ? Colors.bg : (earlyTap ? Colors.red : Colors.amber)} />
          ) : (
            <Zap size={48} color={subPhase === 'go' ? Colors.bg : (earlyTap ? Colors.red : Colors.amber)} />
          )}
        </View>
        {subPhase === 'wait' && (
          <>
            <Text style={styles.reactionWaitTitle}>Wait for it...</Text>
            <Text style={styles.reactionWaitSub}>
              {isShape ? 'Tap when the target appears' : 'Tap when the screen turns green'}
            </Text>
          </>
        )}
        {(subPhase === 'early' || earlyTap) && (
          <>
            <Text style={[styles.reactionWaitTitle, { color: Colors.red }]}>Too early! Stay focused.</Text>
            <Text style={styles.reactionWaitSub}>Wait for the signal...</Text>
          </>
        )}
        {subPhase === 'go' && (
          <>
            <Text style={[styles.reactionWaitTitle, { color: Colors.bg }]}>TAP NOW!</Text>
            <Text style={[styles.reactionWaitSub, { color: 'rgba(11,17,32,0.6)' }]}>As fast as you can</Text>
          </>
        )}
        {subPhase === 'done' && (
          <TouchableOpacity onPress={handleAdvanceTap} activeOpacity={0.8}>
            <Text style={styles.reactionResultMs}>{reactionMs}ms</Text>
            <Text style={styles.reactionResultLabel}>
              {reactionMs < 250 ? 'Lightning fast!' : reactionMs < 350 ? 'Great reflexes!' : reactionMs < 500 ? 'Not bad' : 'Keep practicing'}
            </Text>
            <Text style={styles.tapToContinue}>Tap to continue</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderMemoryNumbersTest = () => {
    if (!currentTest?.memoryNumbers) return null;
    const seq = currentTest.memoryNumbers;
    return (
      <View style={styles.centerContent}>
        <View style={styles.testHeader}>
          <View style={styles.testHeaderIcon}><Brain size={22} color={Colors.teal} /></View>
          <Text style={styles.testTitle}>Number Recall</Text>
        </View>
        {subPhase === 'show' && (
          <>
            <Text style={styles.memoryInstruction}>Memorize these numbers</Text>
            <View style={styles.memorySequenceRow}>
              {seq.map((num, i) => (
                <View key={i} style={styles.memoryDigitBox}>
                  <Text style={styles.memoryDigitText}>{num}</Text>
                </View>
              ))}
            </View>
            {renderTimerBar(Colors.teal)}
          </>
        )}
        {(subPhase === 'input' || subPhase === 'done') && (
          <>
            <Text style={styles.memoryInstruction}>
              {subPhase === 'done' ? `${memoryCorrect}/${seq.length} correct` : 'Enter the numbers in order'}
            </Text>
            {subPhase === 'input' && renderTimerBar(Colors.teal)}
            <View style={styles.memorySequenceRow}>
              {memoryInput.map((val, i) => (
                <View key={i} style={[
                  styles.memoryInputBox,
                  subPhase === 'done' && val === String(seq[i]) && styles.memoryInputCorrect,
                  subPhase === 'done' && val !== String(seq[i]) && styles.memoryInputWrong,
                ]}>
                  {subPhase === 'done' ? (
                    <View style={styles.memoryResultStack}>
                      <Text style={[styles.memoryDigitText, val === String(seq[i]) ? { color: Colors.green } : { color: Colors.red }]}>
                        {val || '?'}
                      </Text>
                      {val !== String(seq[i]) && <Text style={styles.memoryCorrectHint}>{seq[i]}</Text>}
                    </View>
                  ) : (
                    <TextInput
                      ref={el => { inputRefs.current[i] = el; }}
                      style={styles.memoryInputText}
                      value={val}
                      onChangeText={(text) => handleMemoryInputChange(text, i)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      selectionColor={Colors.teal}
                      testID={`memory-input-${i}`}
                    />
                  )}
                </View>
              ))}
            </View>
            {subPhase === 'done' && (
              <TouchableOpacity style={styles.nextButton} onPress={handleAdvanceTap}>
                <Text style={styles.nextButtonText}>Next</Text>
                <ChevronRight size={18} color={Colors.bg} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  const renderMemoryPatternTest = () => {
    if (!currentTest?.memoryPattern) return null;
    const { size, cells } = currentTest.memoryPattern;
    const total = size * size;
    return (
      <View style={styles.centerContent}>
        <View style={styles.testHeader}>
          <View style={styles.testHeaderIcon}><Brain size={22} color={Colors.teal} /></View>
          <Text style={styles.testTitle}>Pattern Recall</Text>
        </View>
        <Text style={styles.memoryInstruction}>
          {subPhase === 'show' ? 'Memorize the highlighted cells' :
           subPhase === 'input' ? `Tap ${cells.length} cells you remember` :
           patternResult ? `${patternResult.correct}/${cells.length} correct` : ''}
        </Text>
        {(subPhase === 'show' || subPhase === 'input') && renderTimerBar(Colors.teal)}
        <View style={[styles.patternGrid, { width: size * 72 + (size - 1) * 8 }]}>
          {Array.from({ length: total }).map((_, idx) => {
            const isHighlighted = cells.includes(idx);
            const isSelected = patternSelected.includes(idx);
            const showHighlight = subPhase === 'show' && isHighlighted;
            const isDone = subPhase === 'done';
            const isCorrectHit = isDone && isSelected && isHighlighted;
            const isWrongHit = isDone && isSelected && !isHighlighted;
            const isMissed = isDone && !isSelected && isHighlighted;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.patternCell,
                  showHighlight && styles.patternCellHighlight,
                  isSelected && !isDone && styles.patternCellSelected,
                  isCorrectHit && styles.patternCellCorrectHit,
                  isWrongHit && styles.patternCellWrongHit,
                  isMissed && styles.patternCellMissed,
                ]}
                onPress={() => handlePatternCellTap(idx)}
                disabled={subPhase !== 'input'}
                activeOpacity={0.7}
                testID={`pattern-cell-${idx}`}
              />
            );
          })}
        </View>
        {subPhase === 'input' && patternSelected.length > 0 && (
          <TouchableOpacity style={[styles.nextButton, { marginTop: 20 }]} onPress={handlePatternSubmit}>
            <Text style={styles.nextButtonText}>Confirm ({patternSelected.length}/{cells.length})</Text>
          </TouchableOpacity>
        )}
        {subPhase === 'done' && (
          <TouchableOpacity style={[styles.nextButton, { marginTop: 20 }]} onPress={handleAdvanceTap}>
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={18} color={Colors.bg} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderStroopTest = () => {
    if (!currentTest?.stroop) return null;
    const { word, displayColor, options, correctIndex } = currentTest.stroop;
    return (
      <View style={styles.centerContent}>
        <View style={styles.testHeader}>
          <View style={[styles.testHeaderIcon, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
            <Eye size={22} color="#60A5FA" />
          </View>
          <Text style={styles.testTitle}>Color Focus</Text>
        </View>
        {subPhase === 'active' && renderTimerBar('#60A5FA')}
        <View style={styles.stroopCard}>
          <Text style={styles.stroopHint}>What COLOR is the text?</Text>
          <Text style={[styles.stroopWord, { color: displayColor }]}>{word}</Text>
          <Text style={styles.stroopNote}>(not what it says)</Text>
        </View>
        <View style={styles.stroopOptions}>
          {options.map((opt, i) => {
            const isDone = subPhase === 'done';
            const isCorrect = i === correctIndex;
            const isSelected = selectedOption === i;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.stroopOptionBtn,
                  { borderColor: opt.hex + '40' },
                  isDone && isCorrect && styles.mcqOptionCorrect,
                  isDone && isSelected && !isCorrect && styles.mcqOptionWrong,
                ]}
                onPress={() => handleMCQAnswer(i)}
                disabled={isDone}
                activeOpacity={0.7}
              >
                <View style={[styles.stroopDot, { backgroundColor: opt.hex }]} />
                <Text style={[styles.stroopOptionText, isDone && isCorrect && { color: Colors.green }]}>
                  {opt.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {subPhase === 'done' && (
          <TouchableOpacity style={[styles.nextButton, { marginTop: 16 }]} onPress={handleAdvanceTap}>
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={18} color={Colors.bg} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderOddOneOutTest = () => {
    if (!currentTest?.oddOneOut) return null;
    const { items, correctIndex } = currentTest.oddOneOut;
    return (
      <View style={styles.centerContent}>
        <View style={styles.testHeader}>
          <View style={[styles.testHeaderIcon, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
            <Eye size={22} color="#60A5FA" />
          </View>
          <Text style={styles.testTitle}>Odd One Out</Text>
        </View>
        {subPhase === 'active' && renderTimerBar('#60A5FA')}
        <Text style={styles.mcqQuestion}>Which one doesn't belong?</Text>
        <View style={styles.oddGrid}>
          {items.map((item, i) => {
            const isDone = subPhase === 'done';
            const isCorrect = i === correctIndex;
            const isSelected = selectedOption === i;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.oddCard,
                  isDone && isCorrect && styles.mcqOptionCorrect,
                  isDone && isSelected && !isCorrect && styles.mcqOptionWrong,
                ]}
                onPress={() => handleMCQAnswer(i)}
                disabled={isDone}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.oddCardText,
                  isDone && isCorrect && { color: Colors.green },
                  isDone && isSelected && !isCorrect && { color: Colors.red },
                ]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {subPhase === 'done' && (
          <TouchableOpacity style={[styles.nextButton, { marginTop: 16 }]} onPress={handleAdvanceTap}>
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={18} color={Colors.bg} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMCQTest = () => {
    if (!currentTest?.mcq) return null;
    const { question, options, correctIndex } = currentTest.mcq;
    const color = CATEGORY_COLORS[currentTest.category];
    return (
      <View style={styles.centerContent}>
        <View style={styles.testHeader}>
          <View style={[styles.testHeaderIcon, { backgroundColor: color + '20' }]}>
            {currentTest.type === 'awareness' ? <Globe size={22} color={color} /> : <Target size={22} color={color} />}
          </View>
          <Text style={styles.testTitle}>{currentTest.label}</Text>
        </View>
        {subPhase === 'active' && renderTimerBar(color)}
        <View style={styles.mcqQuestionCard}>
          <Text style={styles.mcqQuestion}>{question}</Text>
        </View>
        <View style={styles.mcqOptions}>
          {options.map((option, i) => {
            const isDone = subPhase === 'done';
            const isCorrect = i === correctIndex;
            const isSelected = selectedOption === i;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.mcqOption,
                  isDone && isCorrect && styles.mcqOptionCorrect,
                  isDone && isSelected && !isCorrect && styles.mcqOptionWrong,
                ]}
                onPress={() => handleMCQAnswer(i)}
                disabled={isDone}
                activeOpacity={0.7}
                testID={`mcq-option-${i}`}
              >
                <View style={[
                  styles.mcqBadge,
                  isDone && isCorrect && { backgroundColor: Colors.greenGlow, borderColor: Colors.green },
                  isDone && isSelected && !isCorrect && { backgroundColor: Colors.redGlow, borderColor: Colors.red },
                ]}>
                  <Text style={[
                    styles.mcqBadgeText,
                    isDone && isCorrect && { color: Colors.green },
                    isDone && isSelected && !isCorrect && { color: Colors.red },
                  ]}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <Text style={[
                  styles.mcqOptionText,
                  isDone && isCorrect && { color: Colors.green },
                  isDone && isSelected && !isCorrect && { color: Colors.red },
                ]}>{option}</Text>
                {isDone && isCorrect && <Check size={18} color={Colors.green} />}
                {isDone && isSelected && !isCorrect && <X size={18} color={Colors.red} />}
              </TouchableOpacity>
            );
          })}
        </View>
        {subPhase === 'done' && (
          <TouchableOpacity style={[styles.nextButton, { marginTop: 16 }]} onPress={handleAdvanceTap}>
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={18} color={Colors.bg} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderBehavioralTest = () => {
    if (!currentTest?.behavioral) return null;
    const { question, optionA, optionB } = currentTest.behavioral;
    return (
      <View style={styles.centerContent}>
        <View style={styles.testHeader}>
          <View style={[styles.testHeaderIcon, { backgroundColor: 'rgba(244,114,182,0.15)' }]}>
            <Heart size={22} color="#F472B6" />
          </View>
          <Text style={styles.testTitle}>Your Style</Text>
        </View>
        <View style={styles.behavioralQuestionCard}>
          <Text style={styles.behavioralQuestion}>{question}</Text>
        </View>
        <View style={styles.behavioralOptions}>
          <TouchableOpacity
            style={[styles.behavioralOption, behavioralChoice === 'A' && styles.behavioralOptionSelected]}
            onPress={() => handleBehavioralChoice('A')}
            disabled={subPhase === 'done'}
            activeOpacity={0.8}
          >
            <Text style={styles.behavioralOptionLabel}>A</Text>
            <Text style={styles.behavioralOptionText}>{optionA}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.behavioralOption, behavioralChoice === 'B' && styles.behavioralOptionSelected]}
            onPress={() => handleBehavioralChoice('B')}
            disabled={subPhase === 'done'}
            activeOpacity={0.8}
          >
            <Text style={styles.behavioralOptionLabel}>B</Text>
            <Text style={styles.behavioralOptionText}>{optionB}</Text>
          </TouchableOpacity>
        </View>
        {subPhase === 'done' && (
          <TouchableOpacity style={[styles.nextButton, { marginTop: 16 }]} onPress={handleAdvanceTap}>
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={18} color={Colors.bg} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCurrentTest = () => {
    if (!currentTest) return null;
    switch (currentTest.type) {
      case 'reaction-color':
      case 'reaction-shape': return renderReactionTest();
      case 'memory-numbers': return renderMemoryNumbersTest();
      case 'memory-pattern': return renderMemoryPatternTest();
      case 'stroop': return renderStroopTest();
      case 'odd-one-out': return renderOddOneOutTest();
      case 'trick-question':
      case 'reasoning':
      case 'awareness': return renderMCQTest();
      case 'behavioral': return renderBehavioralTest();
      default: return null;
    }
  };

  const renderFeedbackOverlay = () => (
    <Animated.View
      style={[styles.feedbackOverlay, { opacity: feedbackOpacity, transform: [{ scale: feedbackScale }] }]}
      pointerEvents="none"
    >
      <View style={[styles.feedbackCircle, lastCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
        {lastCorrect ? <Check size={32} color={Colors.green} strokeWidth={3} /> : <X size={32} color={Colors.red} strokeWidth={3} />}
      </View>
      <Text style={[styles.feedbackScoreText, { color: lastCorrect ? Colors.green : Colors.red }]}>+{lastScore}</Text>
    </Animated.View>
  );

  const isTestPhase = phase === 'test';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      {isTestPhase && renderProgressBar()}
      {phase === 'transition' && renderTransition()}
      <Animated.View style={[styles.gameContent, { opacity: phase === 'transition' ? 0 : fadeAnim }]}>
        {phase === 'countdown' && renderCountdown()}
        {isTestPhase && renderCurrentTest()}
      </Animated.View>
      {renderFeedbackOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  gameContent: { flex: 1 },
  progressContainer: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  progressCategory: { fontSize: 13, fontWeight: '700' as const },
  progressTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' as const },
  progressFill: { height: '100%', backgroundColor: Colors.teal, borderRadius: 2 },
  centerContent: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  getReadyText: { fontSize: 18, color: Colors.textSecondary, fontWeight: '500' as const, marginBottom: 16, letterSpacing: 2, textTransform: 'uppercase' as const },
  countdownNumber: { fontSize: 120, fontWeight: '800' as const, color: Colors.teal, lineHeight: 130 },
  countdownSub: { fontSize: 15, color: Colors.textMuted, marginTop: 16 },
  transitionContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center' as const, justifyContent: 'center' as const, zIndex: 50 },
  transitionIconWrap: { width: 80, height: 80, borderRadius: 28, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 20 },
  transitionLabel: { fontSize: 28, fontWeight: '800' as const, color: Colors.textPrimary, letterSpacing: -0.5 },
  transitionSub: { fontSize: 15, color: Colors.textMuted, marginTop: 6 },
  timerBar: { width: width - 80, height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' as const, marginBottom: 20 },
  timerBarFill: { height: '100%', borderRadius: 3 },
  testHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginBottom: 24 },
  testHeaderIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.tealGlow, alignItems: 'center' as const, justifyContent: 'center' as const },
  testTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary },
  reactionArea: { flex: 1, borderRadius: 24, backgroundColor: Colors.bgCard, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 8 },
  reactionAreaGo: { backgroundColor: Colors.green },
  reactionAreaEarly: { backgroundColor: Colors.redGlow },
  reactionIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 20 },
  reactionWaitTitle: { fontSize: 24, fontWeight: '700' as const, color: Colors.textPrimary, marginBottom: 8 },
  reactionWaitSub: { fontSize: 15, color: Colors.textSecondary },
  reactionResultMs: { fontSize: 56, fontWeight: '800' as const, color: Colors.teal, textAlign: 'center' as const, marginBottom: 4 },
  reactionResultLabel: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' as const, marginBottom: 16, fontWeight: '500' as const },
  tapToContinue: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' as const, marginTop: 8 },
  memoryInstruction: { fontSize: 16, color: Colors.textSecondary, marginBottom: 20, textAlign: 'center' as const },
  memorySequenceRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 24 },
  memoryDigitBox: { width: 56, height: 68, borderRadius: 14, backgroundColor: Colors.tealGlow, borderWidth: 1.5, borderColor: Colors.teal, alignItems: 'center' as const, justifyContent: 'center' as const },
  memoryDigitText: { fontSize: 28, fontWeight: '700' as const, color: Colors.teal },
  memoryInputBox: { width: 56, height: 68, borderRadius: 14, backgroundColor: Colors.bgCardLight, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' as const, justifyContent: 'center' as const },
  memoryInputCorrect: { borderColor: Colors.green, backgroundColor: Colors.greenGlow },
  memoryInputWrong: { borderColor: Colors.red, backgroundColor: Colors.redGlow },
  memoryInputText: { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary, width: '100%', height: '100%', textAlign: 'center' as const, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as Record<string, string> },
  memoryResultStack: { alignItems: 'center' as const },
  memoryCorrectHint: { fontSize: 12, color: Colors.green, fontWeight: '600' as const, marginTop: 2 },
  patternGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center' as const, marginBottom: 16 },
  patternCell: { width: 72, height: 72, borderRadius: 16, backgroundColor: Colors.bgCardLight, borderWidth: 2, borderColor: Colors.border },
  patternCellHighlight: { backgroundColor: Colors.tealGlow, borderColor: Colors.teal },
  patternCellSelected: { backgroundColor: 'rgba(96,165,250,0.2)', borderColor: '#60A5FA' },
  patternCellCorrectHit: { backgroundColor: Colors.greenGlow, borderColor: Colors.green },
  patternCellWrongHit: { backgroundColor: Colors.redGlow, borderColor: Colors.red },
  patternCellMissed: { backgroundColor: Colors.tealGlow, borderColor: Colors.teal, opacity: 0.4 },
  stroopCard: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 28, alignItems: 'center' as const, marginBottom: 24, width: '100%', borderWidth: 1, borderColor: Colors.border },
  stroopHint: { fontSize: 14, color: Colors.textMuted, marginBottom: 12, fontWeight: '500' as const },
  stroopWord: { fontSize: 52, fontWeight: '900' as const, letterSpacing: 4 },
  stroopNote: { fontSize: 12, color: Colors.textMuted, marginTop: 8, fontStyle: 'italic' as const },
  stroopOptions: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10, justifyContent: 'center' as const, width: '100%' },
  stroopOptionBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, backgroundColor: Colors.bgCardLight, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, borderWidth: 1, width: '47%' as unknown as number, minWidth: 140 },
  stroopDot: { width: 20, height: 20, borderRadius: 10 },
  stroopOptionText: { fontSize: 16, fontWeight: '600' as const, color: Colors.textPrimary },
  oddGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 12, justifyContent: 'center' as const, width: '100%', marginBottom: 8 },
  oddCard: { width: '45%' as unknown as number, minWidth: 140, backgroundColor: Colors.bgCard, borderRadius: 18, paddingVertical: 24, alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.border },
  oddCardText: { fontSize: 20, fontWeight: '700' as const, color: Colors.textPrimary },
  mcqQuestionCard: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 22, marginBottom: 20, width: '100%', borderWidth: 1, borderColor: Colors.border },
  mcqQuestion: { fontSize: 17, fontWeight: '600' as const, color: Colors.textPrimary, lineHeight: 25, textAlign: 'center' as const, marginBottom: 8 },
  mcqOptions: { width: '100%', gap: 10 },
  mcqOption: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: Colors.bgCardLight, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  mcqOptionCorrect: { borderColor: Colors.green, backgroundColor: Colors.greenGlow },
  mcqOptionWrong: { borderColor: Colors.red, backgroundColor: Colors.redGlow },
  mcqBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' as const, justifyContent: 'center' as const },
  mcqBadgeText: { fontSize: 13, fontWeight: '700' as const, color: Colors.textMuted },
  mcqOptionText: { fontSize: 16, fontWeight: '500' as const, color: Colors.textPrimary, flex: 1 },
  behavioralQuestionCard: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 28, marginBottom: 28, width: '100%', borderWidth: 1, borderColor: Colors.border },
  behavioralQuestion: { fontSize: 20, fontWeight: '700' as const, color: Colors.textPrimary, lineHeight: 28, textAlign: 'center' as const },
  behavioralOptions: { width: '100%', gap: 14 },
  behavioralOption: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: Colors.bgCardLight, borderRadius: 18, padding: 20, gap: 16, borderWidth: 1.5, borderColor: Colors.border },
  behavioralOptionSelected: { borderColor: '#F472B6', backgroundColor: 'rgba(244,114,182,0.12)' },
  behavioralOptionLabel: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, textAlign: 'center' as const, lineHeight: 36, fontSize: 16, fontWeight: '800' as const, color: '#F472B6', overflow: 'hidden' as const },
  behavioralOptionText: { fontSize: 16, fontWeight: '500' as const, color: Colors.textPrimary, flex: 1, lineHeight: 22 },
  nextButton: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: Colors.teal, paddingHorizontal: 36, paddingVertical: 16, borderRadius: 16, gap: 6, marginTop: 8 },
  nextButtonText: { fontSize: 16, fontWeight: '700' as const, color: Colors.bg },
  feedbackOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center' as const, justifyContent: 'center' as const, zIndex: 100 },
  feedbackCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 3 },
  feedbackCorrect: { backgroundColor: 'rgba(74, 222, 128, 0.15)', borderColor: Colors.green },
  feedbackWrong: { backgroundColor: 'rgba(255, 90, 90, 0.15)', borderColor: Colors.red },
  feedbackScoreText: { fontSize: 22, fontWeight: '800' as const, marginTop: 8 },
});
