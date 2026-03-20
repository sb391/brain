export interface BrainInsights {
  brainType: string;
  brainTypeDescription: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

interface ScoreParams {
  total: number;
  reaction: number;
  memory: number;
  logic: number;
  reactionMs: number;
  memoryCorrect: number;
  memoryTotal: number;
  logicCorrect: boolean;
}

const brainTypes: Record<string, { name: string; description: string; condition: (p: ScoreParams) => boolean }[]> = {
  primary: [
    {
      name: 'The Strategist',
      description: 'You excel at logical thinking and pattern recognition. Your analytical mind breaks down complex problems with ease.',
      condition: (p) => p.logic >= 250 && p.logic >= p.reaction && p.logic >= p.memory,
    },
    {
      name: 'The Quickdraw',
      description: 'Lightning-fast reflexes define your cognitive style. You process and react to stimuli faster than most.',
      condition: (p) => p.reaction >= 250 && p.reaction >= p.memory && p.reaction >= p.logic,
    },
    {
      name: 'The Archivist',
      description: 'Your memory is your superpower. You absorb and retain information with remarkable accuracy.',
      condition: (p) => p.memory >= 250 && p.memory >= p.reaction && p.memory >= p.logic,
    },
    {
      name: 'The Polymath',
      description: 'A balanced mind across all domains. You don\'t specialize — you dominate everywhere.',
      condition: (p) => {
        const max = Math.max(p.reaction, p.memory, p.logic);
        const min = Math.min(p.reaction, p.memory, p.logic);
        return max - min < 80 && p.total >= 500;
      },
    },
    {
      name: 'The Instinctive',
      description: 'You rely on gut feeling and rapid intuition. Your brain makes snap decisions that are often right.',
      condition: (p) => p.reactionMs < 300 && p.logicCorrect,
    },
    {
      name: 'The Rising Mind',
      description: 'Your cognitive potential is vast and untapped. With focused practice, significant growth awaits.',
      condition: () => true,
    },
  ],
};

function getBrainType(p: ScoreParams): { name: string; description: string } {
  for (const bt of brainTypes.primary) {
    if (bt.condition(p)) {
      return { name: bt.name, description: bt.description };
    }
  }
  return { name: 'The Rising Mind', description: 'Your cognitive potential is vast and untapped.' };
}

function getStrengths(p: ScoreParams): string[] {
  const strengths: string[] = [];

  if (p.reactionMs < 300) strengths.push('Elite-level reaction speed — faster than 90% of users');
  else if (p.reactionMs < 400) strengths.push('Above-average reaction time — quick neural processing');

  if (p.memoryCorrect >= 4) strengths.push('Strong short-term memory — high information retention');
  else if (p.memoryCorrect >= 3) strengths.push('Solid working memory — good at holding multiple items');

  if (p.logicCorrect) strengths.push('Sound logical reasoning — effective pattern recognition');

  if (p.total >= 700) strengths.push('Consistent high performance across all cognitive areas');
  if (p.total >= 500 && strengths.length < 2) strengths.push('Balanced cognitive profile with no major gaps');
  if (strengths.length === 0) strengths.push('Willingness to test and improve — the foundation of growth');

  return strengths.slice(0, 4);
}

function getWeaknesses(p: ScoreParams): string[] {
  const weaknesses: string[] = [];

  if (p.reactionMs >= 500) weaknesses.push('Reaction speed could be sharper — delayed stimulus response');
  else if (p.reactionMs >= 400) weaknesses.push('Reaction time is average — room for faster processing');

  if (p.memoryCorrect <= 2) weaknesses.push('Short-term memory recall needs strengthening');
  else if (p.memoryCorrect <= 3) weaknesses.push('Memory accuracy could improve with focused training');

  if (!p.logicCorrect) weaknesses.push('Logical reasoning under pressure is a growth area');

  if (p.total < 400 && weaknesses.length < 2) weaknesses.push('Overall cognitive speed could benefit from regular brain exercises');
  if (weaknesses.length === 0) weaknesses.push('Minor optimization opportunities — you\'re performing well overall');

  return weaknesses.slice(0, 3);
}

function getSuggestions(p: ScoreParams): string[] {
  const suggestions: string[] = [];

  if (p.reactionMs >= 400) {
    suggestions.push('Try "tap reaction" games daily for 5 minutes to train faster reflexes');
  }
  if (p.memoryCorrect <= 3) {
    suggestions.push('Practice the "dual n-back" exercise — proven to boost working memory');
  }
  if (!p.logicCorrect) {
    suggestions.push('Solve 2-3 logic puzzles daily (Sudoku, pattern games) to sharpen reasoning');
  }
  if (p.total < 500) {
    suggestions.push('Ensure 7-8 hours of sleep — cognitive performance drops 30% when sleep-deprived');
  }
  if (p.total >= 500 && p.total < 750) {
    suggestions.push('Try testing at different times of day to find your cognitive peak hours');
  }
  if (p.total >= 750) {
    suggestions.push('Challenge yourself with harder tests — you\'re ready for advanced cognitive training');
  }

  suggestions.push('Stay hydrated — even mild dehydration reduces focus and reaction time by 12%');

  return suggestions.slice(0, 4);
}

export function generateInsights(params: {
  total: number;
  reaction: number;
  memory: number;
  logic: number;
  reactionMs: number;
  memoryCorrect: number;
  memoryTotal: number;
  logicCorrect: boolean;
}): BrainInsights {
  const bt = getBrainType(params);
  return {
    brainType: bt.name,
    brainTypeDescription: bt.description,
    strengths: getStrengths(params),
    weaknesses: getWeaknesses(params),
    suggestions: getSuggestions(params),
  };
}
