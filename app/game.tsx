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
import { Zap, Brain, Target, ChevronRight, Check, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { getRandomQuestion, generateMemorySequence } from '@/constants/gameData';
import type { LogicQuestion } from '@/constants/gameData';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type GamePhase = 'countdown' | 'reaction-wait' | 'reaction-tap' | 'reaction-done'
  | 'memory-show' | 'memory-input' | 'memory-done'
  | 'logic' | 'logic-done'
  | 'transition';

interface GameResults {
  reactionMs: number;
  memoryCorrect: number;
  memoryTotal: number;
  logicCorrect: boolean;
  logicTimeMs: number;
}

const MEMORY_SHOW_DURATION = 3500;
const LOGIC_TIME_LIMIT = 15000;

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<GamePhase>('countdown');
  const [countdownNum, setCountdownNum] = useState(3);
  const [currentTest, setCurrentTest] = useState(0);

  const [reactionStart, setReactionStart] = useState(0);
  const [reactionMs, setReactionMs] = useState(0);
  const [tappedEarly, setTappedEarly] = useState(false);

  const [memorySequence, setMemorySequence] = useState<number[]>([]);
  const [memoryInput, setMemoryInput] = useState<string[]>(['', '', '', '', '']);
  const [memoryCorrect, setMemoryCorrect] = useState(0);
  const [memoryTimerProgress, setMemoryTimerProgress] = useState(1);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [logicQuestion, setLogicQuestion] = useState<LogicQuestion | null>(null);
  const [logicSelected, setLogicSelected] = useState<number | null>(null);
  const [logicStartTime, setLogicStartTime] = useState(0);
  const [logicTimeMs, setLogicTimeMs] = useState(0);
  const [logicTimerProgress, setLogicTimerProgress] = useState(1);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const countdownOpacity = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const feedbackScale = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | null>(null);

  const transitionSlide = useRef(new Animated.Value(0)).current;
  const transitionOpacity = useRef(new Animated.Value(1)).current;
  const [transitionLabel, setTransitionLabel] = useState('');
  const [transitionIcon, setTransitionIcon] = useState<'zap' | 'brain' | 'target'>('zap');

  const memoryTimerAnim = useRef(new Animated.Value(1)).current;
  const logicTimerAnim = useRef(new Animated.Value(1)).current;

  const stepIndicatorAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logicIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const memoryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showFeedback = useCallback((type: 'correct' | 'wrong') => {
    setFeedbackType(type);
    feedbackScale.setValue(0.3);
    feedbackOpacity.setValue(1);

    if (type === 'correct') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    Animated.parallel([
      Animated.spring(feedbackScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setFeedbackType(null);
    });
  }, [feedbackScale, feedbackOpacity]);

  const showTransition = useCallback((label: string, icon: 'zap' | 'brain' | 'target', callback: () => void) => {
    setTransitionLabel(label);
    setTransitionIcon(icon);
    setPhase('transition');
    transitionSlide.setValue(50);
    transitionOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(transitionOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(transitionSlide, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(transitionOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
          callback();
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
      }, 600);
    });
  }, [fadeAnim, transitionSlide, transitionOpacity]);

  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdownNum <= 0) {
      showTransition('Reaction', 'zap', () => {
        setCurrentTest(1);
        setPhase('reaction-wait');
      });
      return;
    }

    countdownOpacity.setValue(1);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    Animated.timing(countdownOpacity, {
      toValue: 0.3,
      duration: 700,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      setCountdownNum(c => c - 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [phase, countdownNum, scaleAnim, countdownOpacity, showTransition]);

  useEffect(() => {
    if (phase !== 'reaction-wait') return;
    setTappedEarly(false);

    const delay = 1500 + Math.random() * 2500;
    reactionTimeoutRef.current = setTimeout(() => {
      setReactionStart(Date.now());
      setPhase('reaction-tap');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, delay);

    return () => {
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    };
  }, [phase]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentTest / 3,
      duration: 500,
      useNativeDriver: false,
    }).start();

    stepIndicatorAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: currentTest > i ? 1 : (currentTest === i + 1 ? 0.5 : 0),
        duration: 400,
        useNativeDriver: false,
      }).start();
    });
  }, [currentTest, progressAnim, stepIndicatorAnims]);

  useEffect(() => {
    if (phase !== 'memory-show') return;

    memoryTimerAnim.setValue(1);
    const startTime = Date.now();
    memoryIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.max(0, 1 - elapsed / MEMORY_SHOW_DURATION);
      setMemoryTimerProgress(progress);
      if (progress <= 0 && memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current);
      }
    }, 50);

    Animated.timing(memoryTimerAnim, {
      toValue: 0,
      duration: MEMORY_SHOW_DURATION,
      useNativeDriver: false,
    }).start();

    return () => {
      if (memoryIntervalRef.current) clearInterval(memoryIntervalRef.current);
    };
  }, [phase, memoryTimerAnim]);

  useEffect(() => {
    if (phase !== 'logic') return;

    logicTimerAnim.setValue(1);
    const startTime = Date.now();
    logicIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.max(0, 1 - elapsed / LOGIC_TIME_LIMIT);
      setLogicTimerProgress(progress);
      if (progress <= 0 && logicIntervalRef.current) {
        clearInterval(logicIntervalRef.current);
      }
    }, 50);

    Animated.timing(logicTimerAnim, {
      toValue: 0,
      duration: LOGIC_TIME_LIMIT,
      useNativeDriver: false,
    }).start();

    return () => {
      if (logicIntervalRef.current) clearInterval(logicIntervalRef.current);
    };
  }, [phase, logicTimerAnim]);

  const handleReactionTap = useCallback(() => {
    if (phase === 'reaction-wait') {
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
      setTappedEarly(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      reactionTimeoutRef.current = setTimeout(() => {
        setTappedEarly(false);
        setPhase('reaction-wait');
      }, 1000);
      return;
    }
    if (phase !== 'reaction-tap') return;

    const ms = Date.now() - reactionStart;
    setReactionMs(ms);
    setPhase('reaction-done');
    showFeedback(ms < 350 ? 'correct' : 'wrong');
  }, [phase, reactionStart, showFeedback]);

  const startMemoryTest = useCallback(() => {
    const seq = generateMemorySequence(5);
    setMemorySequence(seq);
    setMemoryInput(['', '', '', '', '']);
    setCurrentTest(2);

    showTransition('Memory', 'brain', () => {
      setPhase('memory-show');
    });

    setTimeout(() => {
      setPhase('memory-input');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 400);
    }, 600 + MEMORY_SHOW_DURATION + 800);
  }, [showTransition]);

  const handleMemoryInputChange = useCallback((text: string, index: number) => {
    if (text.length > 1) return;
    const newInput = [...memoryInput];
    newInput[index] = text;
    setMemoryInput(newInput);

    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    if (text && index === 4) {
      const correct = newInput.reduce((acc, val, i) => {
        return acc + (val === String(memorySequence[i]) ? 1 : 0);
      }, 0);
      setMemoryCorrect(correct);
      setPhase('memory-done');
      showFeedback(correct >= 3 ? 'correct' : 'wrong');
    }
  }, [memoryInput, memorySequence, showFeedback]);

  const startLogicTest = useCallback(() => {
    const q = getRandomQuestion();
    setLogicQuestion(q);
    setLogicSelected(null);
    setLogicStartTime(Date.now());
    setCurrentTest(3);
    setLogicTimerProgress(1);

    showTransition('Logic', 'target', () => {
      setPhase('logic');
    });
  }, [showTransition]);

  const handleLogicAnswer = useCallback((index: number) => {
    if (logicSelected !== null || !logicQuestion) return;
    const timeMs = Date.now() - logicStartTime;
    setLogicSelected(index);
    setLogicTimeMs(timeMs);
    setPhase('logic-done');

    if (logicIntervalRef.current) clearInterval(logicIntervalRef.current);

    const isCorrect = index === logicQuestion.correctIndex;
    showFeedback(isCorrect ? 'correct' : 'wrong');
  }, [logicSelected, logicQuestion, logicStartTime, showFeedback]);

  const finishGame = useCallback(() => {
    const results: GameResults = {
      reactionMs,
      memoryCorrect,
      memoryTotal: 5,
      logicCorrect: logicSelected === logicQuestion?.correctIndex,
      logicTimeMs,
    };

    router.replace({
      pathname: '/results',
      params: {
        reactionMs: String(results.reactionMs),
        memoryCorrect: String(results.memoryCorrect),
        memoryTotal: String(results.memoryTotal),
        logicCorrect: String(results.logicCorrect),
        logicTimeMs: String(results.logicTimeMs),
      },
    });
  }, [reactionMs, memoryCorrect, logicSelected, logicQuestion, logicTimeMs, router]);

  const renderFeedbackOverlay = () => {
    if (!feedbackType) return null;
    return (
      <Animated.View
        style={[
          styles.feedbackOverlay,
          {
            opacity: feedbackOpacity,
            transform: [{ scale: feedbackScale }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={[
          styles.feedbackCircle,
          feedbackType === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
        ]}>
          {feedbackType === 'correct' ? (
            <Check size={40} color={Colors.green} strokeWidth={3} />
          ) : (
            <X size={40} color={Colors.red} strokeWidth={3} />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderTransitionScreen = () => {
    const iconMap = {
      zap: <Zap size={36} color={Colors.amber} />,
      brain: <Brain size={36} color={Colors.teal} />,
      target: <Target size={36} color={Colors.amber} />,
    };

    return (
      <Animated.View style={[
        styles.transitionContainer,
        {
          opacity: transitionOpacity,
          transform: [{ translateY: transitionSlide }],
        },
      ]}>
        <View style={styles.transitionIconWrap}>
          {iconMap[transitionIcon]}
        </View>
        <Text style={styles.transitionLabel}>{transitionLabel}</Text>
        <Text style={styles.transitionSub}>Get ready...</Text>
      </Animated.View>
    );
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressSteps}>
        {['Reaction', 'Memory', 'Logic'].map((label, i) => {
          const isCompleted = currentTest > i + 1;
          const isActive = currentTest === i + 1;
          return (
            <View key={label} style={styles.progressStep}>
              <Animated.View style={[
                styles.progressDot,
                isCompleted && styles.progressDotDone,
                isActive && styles.progressDotActive,
              ]}>
                {isCompleted ? (
                  <Check size={10} color={Colors.bg} strokeWidth={3} />
                ) : (
                  <Text style={[
                    styles.progressDotNum,
                    isActive && styles.progressDotNumActive,
                  ]}>{i + 1}</Text>
                )}
              </Animated.View>
              <Text style={[
                styles.progressStepLabel,
                isCompleted && styles.progressStepLabelDone,
                isActive && styles.progressStepLabelActive,
              ]}>{label}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );

  const renderCountdown = () => (
    <View style={styles.centerContent}>
      <Text style={styles.getReadyText}>Get Ready</Text>
      <Animated.Text style={[
        styles.countdownNumber,
        {
          transform: [{ scale: scaleAnim }],
          opacity: countdownOpacity,
        },
      ]}>
        {countdownNum}
      </Animated.Text>
      <View style={styles.countdownDots}>
        {[3, 2, 1].map(n => (
          <View
            key={n}
            style={[
              styles.countdownDot,
              countdownNum >= n && styles.countdownDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderReactionTest = () => {
    const pulseStyle = phase === 'reaction-wait' && !tappedEarly ? {
      borderWidth: 2,
      borderColor: 'rgba(255, 181, 71, 0.2)',
    } : {};

    return (
      <TouchableOpacity
        style={[
          styles.reactionArea,
          phase === 'reaction-tap' && styles.reactionAreaGo,
          tappedEarly && styles.reactionAreaEarly,
          pulseStyle,
        ]}
        onPress={handleReactionTap}
        activeOpacity={0.95}
        testID="reaction-tap-area"
      >
        <View style={[
          styles.reactionIconWrap,
          phase === 'reaction-tap' && { backgroundColor: 'rgba(11,17,32,0.25)' },
        ]}>
          <Zap size={48} color={phase === 'reaction-tap' ? Colors.bg : (tappedEarly ? Colors.red : Colors.amber)} />
        </View>
        {phase === 'reaction-wait' && !tappedEarly && (
          <>
            <Text style={styles.reactionWaitTitle}>Wait for it...</Text>
            <Text style={styles.reactionWaitSub}>Tap when the screen turns green</Text>
            <View style={styles.reactionPulseRing} />
          </>
        )}
        {tappedEarly && (
          <>
            <Text style={[styles.reactionWaitTitle, { color: Colors.red }]}>Too early!</Text>
            <Text style={styles.reactionWaitSub}>Wait for the green flash</Text>
          </>
        )}
        {phase === 'reaction-tap' && (
          <>
            <Text style={[styles.reactionWaitTitle, { color: Colors.bg }]}>TAP NOW!</Text>
            <Text style={[styles.reactionWaitSub, { color: 'rgba(11,17,32,0.6)' }]}>As fast as you can</Text>
          </>
        )}
        {phase === 'reaction-done' && (
          <>
            <Text style={styles.reactionResultMs}>{reactionMs}ms</Text>
            <Text style={styles.reactionResultLabel}>
              {reactionMs < 250 ? 'Lightning fast!' : reactionMs < 350 ? 'Great reflexes!' : reactionMs < 500 ? 'Not bad' : 'Keep practicing'}
            </Text>
            <TouchableOpacity style={styles.nextButton} onPress={startMemoryTest} testID="next-memory">
              <Text style={styles.nextButtonText}>Next</Text>
              <ChevronRight size={18} color={Colors.bg} />
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderTimerBar = (progress: number, color: string) => (
    <View style={styles.timerBar}>
      <View style={[
        styles.timerBarFill,
        {
          width: `${Math.max(0, progress * 100)}%`,
          backgroundColor: progress < 0.25 ? Colors.red : color,
        },
      ]} />
    </View>
  );

  const renderMemoryTest = () => (
    <View style={styles.centerContent}>
      <View style={styles.testHeader}>
        <View style={styles.testHeaderIcon}>
          <Brain size={22} color={Colors.teal} />
        </View>
        <Text style={styles.testTitle}>Memory Test</Text>
      </View>

      {phase === 'memory-show' && (
        <>
          <Text style={styles.memoryInstruction}>Memorize these numbers</Text>
          <View style={styles.memorySequenceRow}>
            {memorySequence.map((num, i) => (
              <View key={i} style={styles.memoryDigitBox}>
                <Text style={styles.memoryDigitText}>{num}</Text>
              </View>
            ))}
          </View>
          {renderTimerBar(memoryTimerProgress, Colors.teal)}
          <Text style={styles.timerLabel}>Memorize time remaining</Text>
        </>
      )}

      {(phase === 'memory-input' || phase === 'memory-done') && (
        <>
          <Text style={styles.memoryInstruction}>
            {phase === 'memory-done'
              ? memoryCorrect === 5 ? 'Perfect recall!' : `${memoryCorrect}/5 correct`
              : 'Enter the numbers in order'}
          </Text>
          <View style={styles.memorySequenceRow}>
            {memoryInput.map((val, i) => (
              <View
                key={i}
                style={[
                  styles.memoryInputBox,
                  phase === 'memory-done' && val === String(memorySequence[i]) && styles.memoryInputCorrect,
                  phase === 'memory-done' && val !== String(memorySequence[i]) && styles.memoryInputWrong,
                ]}
              >
                {phase === 'memory-done' ? (
                  <View style={styles.memoryResultStack}>
                    <Text style={[
                      styles.memoryDigitText,
                      val === String(memorySequence[i]) ? { color: Colors.green } : { color: Colors.red },
                    ]}>{val || '?'}</Text>
                    {val !== String(memorySequence[i]) && (
                      <Text style={styles.memoryCorrectHint}>{memorySequence[i]}</Text>
                    )}
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
          {phase === 'memory-done' && (
            <TouchableOpacity style={styles.nextButton} onPress={startLogicTest} testID="next-logic">
              <Text style={styles.nextButtonText}>Next</Text>
              <ChevronRight size={18} color={Colors.bg} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  const renderLogicTest = () => {
    if (!logicQuestion) return null;
    return (
      <View style={styles.centerContent}>
        <View style={styles.testHeader}>
          <View style={[styles.testHeaderIcon, { backgroundColor: Colors.amberGlow }]}>
            <Target size={22} color={Colors.amber} />
          </View>
          <Text style={styles.testTitle}>Logic Test</Text>
        </View>

        {phase === 'logic' && renderTimerBar(logicTimerProgress, Colors.amber)}

        <View style={styles.logicQuestionCard}>
          <Text style={styles.logicQuestionText}>{logicQuestion.question}</Text>
        </View>

        <View style={styles.logicOptions}>
          {logicQuestion.options.map((option, i) => {
            const isSelected = logicSelected === i;
            const isCorrect = i === logicQuestion.correctIndex;
            const showResult = phase === 'logic-done';

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.logicOption,
                  showResult && isCorrect && styles.logicOptionCorrect,
                  showResult && isSelected && !isCorrect && styles.logicOptionWrong,
                ]}
                onPress={() => handleLogicAnswer(i)}
                disabled={phase === 'logic-done'}
                activeOpacity={0.7}
                testID={`logic-option-${i}`}
              >
                <View style={[
                  styles.logicOptionBadge,
                  showResult && isCorrect && { backgroundColor: Colors.greenGlow, borderColor: Colors.green },
                  showResult && isSelected && !isCorrect && { backgroundColor: Colors.redGlow, borderColor: Colors.red },
                ]}>
                  <Text style={[
                    styles.logicOptionLabel,
                    showResult && isCorrect && { color: Colors.green },
                    showResult && isSelected && !isCorrect && { color: Colors.red },
                  ]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={[
                  styles.logicOptionText,
                  showResult && isCorrect && { color: Colors.green },
                  showResult && isSelected && !isCorrect && { color: Colors.red },
                ]}>
                  {option}
                </Text>
                {showResult && isCorrect && (
                  <Check size={18} color={Colors.green} />
                )}
                {showResult && isSelected && !isCorrect && (
                  <X size={18} color={Colors.red} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {phase === 'logic-done' && (
          <TouchableOpacity style={[styles.nextButton, { marginTop: 28 }]} onPress={finishGame} testID="finish-game">
            <Text style={styles.nextButtonText}>See Results</Text>
            <ChevronRight size={18} color={Colors.bg} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const isGamePhase = phase !== 'countdown' && phase !== 'transition';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      {isGamePhase && currentTest > 0 && renderProgressBar()}

      {phase === 'transition' && renderTransitionScreen()}

      <Animated.View style={[styles.gameContent, { opacity: phase === 'transition' ? 0 : fadeAnim }]}>
        {phase === 'countdown' && renderCountdown()}
        {(phase === 'reaction-wait' || phase === 'reaction-tap' || phase === 'reaction-done') && renderReactionTest()}
        {(phase === 'memory-show' || phase === 'memory-input' || phase === 'memory-done') && renderMemoryTest()}
        {(phase === 'logic' || phase === 'logic-done') && renderLogicTest()}
      </Animated.View>

      {renderFeedbackOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: 20,
  },
  gameContent: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressSteps: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  progressStep: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  progressDotDone: {
    backgroundColor: Colors.teal,
  },
  progressDotActive: {
    backgroundColor: Colors.bgCardLight,
    borderWidth: 2,
    borderColor: Colors.teal,
  },
  progressDotNum: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  progressDotNumActive: {
    color: Colors.teal,
  },
  progressStepLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  progressStepLabelDone: {
    color: Colors.teal,
  },
  progressStepLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '600' as const,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.teal,
    borderRadius: 2,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  getReadyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 16,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  countdownNumber: {
    fontSize: 120,
    fontWeight: '800' as const,
    color: Colors.teal,
    lineHeight: 130,
  },
  countdownDots: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 24,
  },
  countdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  countdownDotActive: {
    backgroundColor: Colors.teal,
  },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 100,
  },
  feedbackCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 3,
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: Colors.green,
  },
  feedbackWrong: {
    backgroundColor: 'rgba(255, 90, 90, 0.15)',
    borderColor: Colors.red,
  },
  transitionContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 50,
  },
  transitionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  transitionLabel: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  transitionSub: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 6,
  },
  reactionArea: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: Colors.bgCard,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 8,
  },
  reactionAreaGo: {
    backgroundColor: Colors.green,
  },
  reactionAreaEarly: {
    backgroundColor: Colors.redGlow,
  },
  reactionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  reactionWaitTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  reactionWaitSub: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  reactionPulseRing: {
    position: 'absolute' as const,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255, 181, 71, 0.1)',
    top: '35%',
  },
  reactionResultMs: {
    fontSize: 64,
    fontWeight: '800' as const,
    color: Colors.teal,
    marginBottom: 4,
  },
  reactionResultLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    fontWeight: '500' as const,
  },
  testHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 28,
  },
  testHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.tealGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  testTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  memoryInstruction: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  memorySequenceRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 28,
  },
  memoryDigitBox: {
    width: 56,
    height: 68,
    borderRadius: 14,
    backgroundColor: Colors.tealGlow,
    borderWidth: 1.5,
    borderColor: Colors.teal,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  memoryDigitText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.teal,
  },
  memoryInputBox: {
    width: 56,
    height: 68,
    borderRadius: 14,
    backgroundColor: Colors.bgCardLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  memoryInputCorrect: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenGlow,
  },
  memoryInputWrong: {
    borderColor: Colors.red,
    backgroundColor: Colors.redGlow,
  },
  memoryInputText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    width: '100%',
    height: '100%',
    textAlign: 'center' as const,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as Record<string, string>,
  },
  memoryResultStack: {
    alignItems: 'center' as const,
  },
  memoryCorrectHint: {
    fontSize: 12,
    color: Colors.green,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  timerBar: {
    width: width - 80,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  timerBarFill: {
    height: '100%',
    backgroundColor: Colors.teal,
    borderRadius: 3,
  },
  timerLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  nextButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.teal,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 6,
    marginTop: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.bg,
  },
  logicQuestionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logicQuestionText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 26,
    textAlign: 'center' as const,
  },
  logicOptions: {
    width: '100%',
    gap: 10,
  },
  logicOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.bgCardLight,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logicOptionCorrect: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenGlow,
  },
  logicOptionWrong: {
    borderColor: Colors.red,
    backgroundColor: Colors.redGlow,
  },
  logicOptionBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  logicOptionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  logicOptionText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.textPrimary,
    flex: 1,
  },
});
