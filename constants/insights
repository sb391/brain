import type { TestResult } from '@/constants/gameData';
import { getTier } from '@/constants/colors';
import type { TierName } from '@/constants/colors';

export interface SkillLevels {
  reaction: number;
  memory: number;
  focus: number;
  logic: number;
  decision: number;
}

export interface IdentityCard {
  brainType: string;
  speed: 'Low' | 'Medium' | 'High';
  accuracy: 'Low' | 'Medium' | 'High';
  focus: 'Stable' | 'Fluctuating';
  decisionStyle: 'Fast' | 'Balanced' | 'Analytical';
}

export interface MilestoneInfo {
  currentTier: TierName;
  nextTier: TierName | null;
  nextTierLabel: string;
  pointsAway: number;
  nextThreshold: number;
}

export interface BrainInsights {
  brainType: string;
  brainTypeDescription: string;
  strengths: string[];
  weaknesses: string[];
  decisionStyle: string;
  decisionStyleDescription: string;
  focusPattern: string;
  focusPatternDescription: string;
  suggestions: string[];
  skillLevels: SkillLevels;
  identityCard: IdentityCard;
  milestone: MilestoneInfo;
  quickInsights: string[];
}

interface ScoreParams {
  total: number;
  categoryScores: Record<string, { score: number; max: number }>;
  reactionAvgMs: number;
  memoryAccuracy: number;
  focusAccuracy: number;
  logicAccuracy: number;
  awarenessCorrect: boolean;
  behavioralTraits: Record<string, string>;
  testResults: TestResult[];
}

function getCategoryPct(params: ScoreParams, cat: string): number {
  const c = params.categoryScores[cat];
  if (!c || c.max === 0) return 0;
  return c.score / c.max;
}

function getBrainType(p: ScoreParams): { name: string; description: string } {
  const reactionPct = getCategoryPct(p, 'reaction');
  const memoryPct = getCategoryPct(p, 'memory');
  const focusPct = getCategoryPct(p, 'focus');
  const logicPct = getCategoryPct(p, 'logic');

  const allPcts = [reactionPct, memoryPct, focusPct, logicPct];
  const maxPct = Math.max(...allPcts);
  const minPct = Math.min(...allPcts);
  const isBalanced = maxPct - minPct < 0.2 && p.total >= 500;

  if (isBalanced && p.total >= 700) {
    return { name: 'The Polymath', description: 'A rare and balanced mind. You perform consistently across reaction, memory, focus, and logic — a sign of well-rounded cognitive fitness.' };
  }

  if (reactionPct >= 0.8 && logicPct >= 0.7) {
    return { name: 'The Instinctive', description: 'You combine lightning reflexes with sharp reasoning. Your brain processes and acts on information faster than most, making you naturally decisive.' };
  }

  if (logicPct >= 0.75 && logicPct === maxPct) {
    return { name: 'The Strategist', description: 'Logic and pattern recognition are your forte. You approach problems methodically, breaking them down with an analytical precision that others admire.' };
  }

  if (reactionPct >= 0.75 && reactionPct === maxPct) {
    return { name: 'The Quickdraw', description: 'Your reflexes are razor-sharp. You process visual stimuli and respond faster than the average person — a trait valued in high-stakes, time-sensitive situations.' };
  }

  if (memoryPct >= 0.75 && memoryPct === maxPct) {
    return { name: 'The Archivist', description: 'Your memory is your superpower. You absorb, retain, and recall information with remarkable precision — a cognitive edge in learning and decision-making.' };
  }

  if (focusPct >= 0.75 && focusPct === maxPct) {
    return { name: 'The Sentinel', description: 'Your focus is unwavering. Where others get distracted by noise and conflicting signals, you cut through with clarity and sustained attention.' };
  }

  if (isBalanced) {
    return { name: 'The Versatile Mind', description: 'You show balanced performance across all domains. No single weakness holds you back — with targeted practice, you could excel in any cognitive area.' };
  }

  if (p.total >= 600) {
    return { name: 'The Adaptive Thinker', description: 'You adapt well across different cognitive challenges. Your brain switches between speed and accuracy as needed — a sign of cognitive flexibility.' };
  }

  if (p.behavioralTraits['pressure'] === 'A' || p.behavioralTraits['decision'] === 'A') {
    return { name: 'The Intuitive', description: 'You lean on gut feeling and instinct. Your brain processes subconscious patterns quickly, even if your conscious performance is still developing.' };
  }

  return { name: 'The Rising Mind', description: 'Your cognitive potential is vast and untapped. Every session builds new neural pathways — consistency is your key to unlocking significantly higher performance.' };
}

function getStrengths(p: ScoreParams): string[] {
  const s: string[] = [];

  if (p.reactionAvgMs < 300) s.push('Exceptional reaction speed — your neural processing is in the top tier');
  else if (p.reactionAvgMs < 400) s.push('Quick reflexes — you respond to stimuli faster than most');

  if (p.memoryAccuracy >= 0.85) s.push('Strong short-term memory — high information retention under pressure');
  else if (p.memoryAccuracy >= 0.6) s.push('Reliable working memory — you hold and manipulate information well');

  if (p.focusAccuracy >= 0.85) s.push('Excellent focus and attention — you cut through distractions cleanly');
  else if (p.focusAccuracy >= 0.6) s.push('Good attentional control — you maintain clarity in conflicting situations');

  if (p.logicAccuracy >= 0.85) s.push('Sharp logical reasoning — you spot patterns and traps that others miss');
  else if (p.logicAccuracy >= 0.6) s.push('Solid problem-solving ability — your analytical thinking is above average');

  if (p.awarenessCorrect) s.push('Good general knowledge recall — your brain retrieves facts quickly');

  if (p.total >= 750) s.push('Consistently high performance across all cognitive dimensions');

  if (p.behavioralTraits['speed_accuracy'] === 'A' && p.reactionAvgMs < 350) {
    s.push('Your preference for speed aligns with your actual performance — genuine fast thinker');
  }

  if (s.length === 0) s.push('Willingness to test and improve — the foundation of cognitive growth');

  return s.slice(0, 4);
}

function getWeaknesses(p: ScoreParams): string[] {
  const w: string[] = [];

  if (p.reactionAvgMs >= 500) w.push('Reaction speed needs work — delayed stimulus response may impact split-second decisions');
  else if (p.reactionAvgMs >= 400) w.push('Reaction time is average — faster processing would sharpen your overall performance');

  if (p.memoryAccuracy < 0.4) w.push('Short-term memory recall is a growth area — you may lose details under time pressure');
  else if (p.memoryAccuracy < 0.6) w.push('Memory accuracy could improve — targeted practice would strengthen retention');

  if (p.focusAccuracy < 0.4) w.push('Focus under conflicting information needs strengthening — distractions may pull you off track');
  else if (p.focusAccuracy < 0.6) w.push('Attentional control has room to grow — especially in tasks with competing signals');

  if (p.logicAccuracy < 0.4) w.push('Logical reasoning under pressure is a clear growth area — trick questions trip you up');
  else if (p.logicAccuracy < 0.6) w.push('Problem-solving speed could improve — you may overthink or rush in logic tasks');

  if (p.behavioralTraits['speed_accuracy'] === 'A' && p.logicAccuracy < 0.5) {
    w.push('Your preference for speed may sometimes lead to accuracy trade-offs in complex tasks');
  }

  if (w.length === 0) w.push('No major weaknesses detected — focus on maintaining your edge');

  return w.slice(0, 3);
}

function getDecisionStyle(p: ScoreParams): { style: string; description: string } {
  const prefersSpeed = p.behavioralTraits['speed_accuracy'] === 'A';
  const prefersGut = p.behavioralTraits['decision'] === 'A';
  const actsUnderPressure = p.behavioralTraits['pressure'] === 'A';
  const fastReaction = p.reactionAvgMs < 350;
  const goodLogic = p.logicAccuracy >= 0.6;

  if (prefersGut && fastReaction && !goodLogic) {
    return { style: 'Impulsive Intuitive', description: 'You trust your instincts and act fast, but sometimes at the cost of accuracy. Slowing down on complex decisions could improve outcomes without sacrificing your natural speed.' };
  }

  if (!prefersSpeed && goodLogic && !fastReaction) {
    return { style: 'Deliberate Analyst', description: 'You prefer to think things through carefully before acting. This serves you well in complex decisions, though you might benefit from trusting your first instinct more in time-pressured situations.' };
  }

  if (fastReaction && goodLogic) {
    return { style: 'Balanced Decision-Maker', description: 'You blend speed with accuracy effectively. You can make quick calls when needed but also slow down for complex problems — an ideal cognitive profile for leadership.' };
  }

  if (actsUnderPressure && fastReaction) {
    return { style: 'Pressure Performer', description: 'You thrive under pressure and your reaction data confirms it. Time constraints actually sharpen your focus rather than scatter it.' };
  }

  if (prefersSpeed) {
    return { style: 'Action-Oriented', description: 'You lean toward action over deliberation. This makes you decisive, but building a brief "pause and check" habit could prevent occasional missteps.' };
  }

  return { style: 'Thoughtful Responder', description: 'You take your time with decisions, weighing options carefully. This thoroughness is a strength — consider practicing faster decision-making for situations that demand it.' };
}

function getFocusPattern(p: ScoreParams): { pattern: string; description: string } {
  const fastReaction = p.reactionAvgMs < 350;
  const goodFocus = p.focusAccuracy >= 0.7;
  const goodMemory = p.memoryAccuracy >= 0.7;
  const hadEarlyTaps = p.testResults.some(t =>
    (t.type === 'reaction-color' || t.type === 'reaction-shape') && t.detail.includes('early')
  );

  if (goodFocus && goodMemory && fastReaction) {
    return { pattern: 'Laser Focus', description: 'Your attention is sharp and sustained. You maintain concentration through distractions, recall details accurately, and react without hesitation. This is elite-level cognitive control.' };
  }

  if (hadEarlyTaps && !goodFocus) {
    return { pattern: 'Anticipatory', description: 'You tend to act before the full picture is clear. Your brain anticipates rather than observes — this gives you speed but costs accuracy. Training delayed response could help.' };
  }

  if (goodFocus && !goodMemory) {
    return { pattern: 'Present-Focused', description: 'You excel at processing what is in front of you right now, but storing and recalling past information is harder. Your attention is sharp in the moment but may not encode deeply.' };
  }

  if (goodMemory && !goodFocus) {
    return { pattern: 'Deep Encoder', description: 'You absorb and retain information well, but competing stimuli can throw you off. Your brain prioritizes depth of processing over filtering speed.' };
  }

  if (fastReaction && hadEarlyTaps) {
    return { pattern: 'Trigger-Happy', description: 'You are highly responsive but occasionally jump the gun. Your brain is primed for action — adding a split-second filter before acting would make you much more effective.' };
  }

  if (!fastReaction && goodFocus) {
    return { pattern: 'Steady Observer', description: 'You take in information carefully and process it accurately. You may not be the fastest responder, but your outputs are reliable and well-considered.' };
  }

  return { pattern: 'Developing', description: 'Your focus pattern is still forming. Regular practice with attention-based tasks will help establish stronger cognitive habits and improve both speed and accuracy.' };
}

function getSuggestions(p: ScoreParams): string[] {
  const s: string[] = [];

  if (p.reactionAvgMs >= 400) {
    s.push('Train reaction speed with daily 5-minute tap exercises — response time improves 15-20% within 2 weeks');
  }

  if (p.memoryAccuracy < 0.6) {
    s.push('Practice "dual n-back" exercises — clinically proven to boost working memory capacity by up to 30%');
  }

  if (p.focusAccuracy < 0.6) {
    s.push('Try the Stroop effect daily — practicing color-word conflicts builds attentional control rapidly');
  }

  if (p.logicAccuracy < 0.6) {
    s.push('Solve 2-3 logic puzzles daily (pattern games, Sudoku) — consistent practice rewires reasoning pathways');
  }

  if (p.total < 500) {
    s.push('Prioritize 7-8 hours of sleep — cognitive performance drops up to 30% when sleep-deprived');
  }

  if (p.total >= 500 && p.total < 750) {
    s.push('Test at different times of day to find your cognitive peak — most people perform best mid-morning');
  }

  if (p.total >= 750) {
    s.push('You are performing at a high level — introduce variety by learning a new skill or language to push new neural pathways');
  }

  s.push('Stay hydrated and move your body — even a 10-minute walk boosts cognitive function for up to 2 hours');

  if (p.behavioralTraits['error_response'] === 'A') {
    s.push('Your tendency to move on quickly after mistakes is efficient, but occasional reflection deepens learning');
  }

  return s.slice(0, 5);
}

const TIER_THRESHOLDS: { tier: TierName; threshold: number; label: string }[] = [
  { tier: 'Rookie', threshold: 0, label: 'Rookie Mind' },
  { tier: 'Starter', threshold: 250, label: 'Starter Mind' },
  { tier: 'Sharp', threshold: 450, label: 'Sharp Mind' },
  { tier: 'Elite', threshold: 650, label: 'Elite Mind' },
  { tier: 'Genius', threshold: 850, label: 'Genius Mind' },
];

function getMilestone(totalScore: number): MilestoneInfo {
  const currentTier = getTier(totalScore);
  const currentIdx = TIER_THRESHOLDS.findIndex(t => t.tier === currentTier);
  const nextIdx = currentIdx + 1;

  if (nextIdx >= TIER_THRESHOLDS.length) {
    return {
      currentTier,
      nextTier: null,
      nextTierLabel: 'Maximum reached',
      pointsAway: 0,
      nextThreshold: 1000,
    };
  }

  const next = TIER_THRESHOLDS[nextIdx];
  return {
    currentTier,
    nextTier: next.tier,
    nextTierLabel: next.label,
    pointsAway: next.threshold - totalScore,
    nextThreshold: next.threshold,
  };
}

function getQuickInsights(p: ScoreParams): string[] {
  const insights: string[] = [];

  if (p.reactionAvgMs < 300 && p.logicAccuracy < 0.5) {
    insights.push('You react quickly but sometimes rush decisions before thinking them through');
  } else if (p.reactionAvgMs < 350) {
    insights.push('Your reflexes are sharp — you process visual information faster than average');
  }

  if (p.memoryAccuracy >= 0.7 && p.focusAccuracy < 0.5) {
    insights.push('Your memory is strong under short bursts but focus drops under conflicting signals');
  } else if (p.memoryAccuracy >= 0.7) {
    insights.push('You retain and recall information well under pressure');
  }

  if (p.focusAccuracy >= 0.7 && p.reactionAvgMs > 400) {
    insights.push('You prioritize precision over speed — a careful, deliberate approach');
  } else if (p.focusAccuracy < 0.4) {
    insights.push('Focus drops when faced with conflicting or distracting information');
  }

  if (p.logicAccuracy >= 0.7) {
    insights.push('Your logical reasoning cuts through traps that catch most people');
  } else if (p.logicAccuracy < 0.4) {
    insights.push('Trick questions and logic traps tend to catch you — slow down before answering');
  }

  if (p.behavioralTraits['pressure'] === 'A' && p.reactionAvgMs < 350) {
    insights.push('You thrive under pressure and your speed confirms it');
  } else if (p.behavioralTraits['pressure'] === 'B' && p.logicAccuracy >= 0.6) {
    insights.push('You prefer to analyze before acting — and your logic scores prove it works');
  }

  if (insights.length === 0) {
    insights.push('Every session builds new neural pathways — consistency is your path to growth');
  }

  return insights.slice(0, 3);
}

function getIdentityCard(p: ScoreParams, brainType: string): IdentityCard {
  const speed: 'Low' | 'Medium' | 'High' = p.reactionAvgMs < 300 ? 'High' : p.reactionAvgMs < 450 ? 'Medium' : 'Low';

  const avgAccuracy = (p.memoryAccuracy + p.focusAccuracy + p.logicAccuracy) / 3;
  const accuracy: 'Low' | 'Medium' | 'High' = avgAccuracy >= 0.7 ? 'High' : avgAccuracy >= 0.4 ? 'Medium' : 'Low';

  const focus: 'Stable' | 'Fluctuating' = p.focusAccuracy >= 0.6 ? 'Stable' : 'Fluctuating';

  const prefersSpeed = p.behavioralTraits['speed_accuracy'] === 'A';
  const prefersGut = p.behavioralTraits['decision'] === 'A';
  const decisionStyle: 'Fast' | 'Balanced' | 'Analytical' =
    (prefersSpeed && prefersGut) ? 'Fast' :
    (!prefersSpeed && !prefersGut) ? 'Analytical' : 'Balanced';

  return { brainType, speed, accuracy, focus, decisionStyle };
}

function getSkillLevels(p: ScoreParams): SkillLevels {
  const reactionPct = getCategoryPct(p, 'reaction');
  const memoryPct = getCategoryPct(p, 'memory');
  const focusPct = getCategoryPct(p, 'focus');
  const logicPct = getCategoryPct(p, 'logic');

  const prefersSpeed = p.behavioralTraits['speed_accuracy'] === 'A';
  const prefersGut = p.behavioralTraits['decision'] === 'A';
  const decisionPct = (prefersSpeed ? 0.6 : 0.4) + (prefersGut ? 0.2 : 0.1) + (p.total > 500 ? 0.15 : 0.05);

  return {
    reaction: Math.min(1, reactionPct),
    memory: Math.min(1, memoryPct),
    focus: Math.min(1, focusPct),
    logic: Math.min(1, logicPct),
    decision: Math.min(1, decisionPct),
  };
}

export function generateInsights(testResults: TestResult[]): BrainInsights {
  const categoryScores: Record<string, { score: number; max: number }> = {};
  const behavioralTraits: Record<string, string> = {};
  let totalScore = 0;
  let reactionTotalMs = 0;
  let reactionCount = 0;
  let memoryCorrectTotal = 0;
  let memoryMaxTotal = 0;
  let focusCorrectCount = 0;
  let focusTotalCount = 0;
  let logicCorrectCount = 0;
  let logicTotalCount = 0;
  let awarenessCorrect = false;

  for (const r of testResults) {
    totalScore += r.score;
    if (!categoryScores[r.category]) categoryScores[r.category] = { score: 0, max: 0 };
    categoryScores[r.category].score += r.score;
    categoryScores[r.category].max += r.maxScore;

    if (r.category === 'reaction') {
      reactionTotalMs += r.timeMs;
      reactionCount++;
    }
    if (r.category === 'memory') {
      const match = r.detail.match(/(\d+)\/(\d+)/);
      if (match) {
        memoryCorrectTotal += parseInt(match[1], 10);
        memoryMaxTotal += parseInt(match[2], 10);
      }
    }
    if (r.category === 'focus') {
      focusTotalCount++;
      if (r.correct) focusCorrectCount++;
    }
    if (r.category === 'logic') {
      logicTotalCount++;
      if (r.correct) logicCorrectCount++;
    }
    if (r.category === 'awareness' && r.correct) awarenessCorrect = true;
    if (r.behavioralTrait && r.behavioralChoice) {
      behavioralTraits[r.behavioralTrait] = r.behavioralChoice;
    }
  }

  const params: ScoreParams = {
    total: totalScore,
    categoryScores,
    reactionAvgMs: reactionCount > 0 ? reactionTotalMs / reactionCount : 500,
    memoryAccuracy: memoryMaxTotal > 0 ? memoryCorrectTotal / memoryMaxTotal : 0,
    focusAccuracy: focusTotalCount > 0 ? focusCorrectCount / focusTotalCount : 0,
    logicAccuracy: logicTotalCount > 0 ? logicCorrectCount / logicTotalCount : 0,
    awarenessCorrect,
    behavioralTraits,
    testResults,
  };

  const bt = getBrainType(params);
  const ds = getDecisionStyle(params);
  const fp = getFocusPattern(params);

  return {
    brainType: bt.name,
    brainTypeDescription: bt.description,
    strengths: getStrengths(params),
    weaknesses: getWeaknesses(params),
    decisionStyle: ds.style,
    decisionStyleDescription: ds.description,
    focusPattern: fp.pattern,
    focusPatternDescription: fp.description,
    suggestions: getSuggestions(params),
    skillLevels: getSkillLevels(params),
    identityCard: getIdentityCard(params, bt.name),
    milestone: getMilestone(totalScore),
    quickInsights: getQuickInsights(params),
  };
}
