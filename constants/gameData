export type TestType =
  | 'reaction-color'
  | 'reaction-shape'
  | 'memory-numbers'
  | 'memory-pattern'
  | 'stroop'
  | 'odd-one-out'
  | 'trick-question'
  | 'reasoning'
  | 'awareness'
  | 'behavioral';

export type TestCategory = 'reaction' | 'memory' | 'focus' | 'logic' | 'awareness' | 'behavioral';

export interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface StroopData {
  word: string;
  displayColor: string;
  colorName: string;
  options: { name: string; hex: string }[];
  correctIndex: number;
}

export interface OddOneOutData {
  items: string[];
  correctIndex: number;
}

export interface BehavioralData {
  question: string;
  optionA: string;
  optionB: string;
  trait: string;
}

export interface PatternGridData {
  size: number;
  cells: number[];
}

export interface GeneratedTest {
  type: TestType;
  category: TestCategory;
  label: string;
  iconType: 'zap' | 'brain' | 'eye' | 'target' | 'globe' | 'heart';
  mcq?: MCQQuestion;
  stroop?: StroopData;
  oddOneOut?: OddOneOutData;
  behavioral?: BehavioralData;
  memoryNumbers?: number[];
  memoryPattern?: PatternGridData;
}

export interface TestResult {
  type: TestType;
  category: TestCategory;
  score: number;
  maxScore: number;
  detail: string;
  timeMs: number;
  correct?: boolean;
  behavioralTrait?: string;
  behavioralChoice?: 'A' | 'B';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const STROOP_COLORS = [
  { name: 'Red', hex: '#FF5A5A' },
  { name: 'Blue', hex: '#60A5FA' },
  { name: 'Green', hex: '#4ADE80' },
  { name: 'Yellow', hex: '#FBBF24' },
];

function generateStroop(): StroopData {
  const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
  let colorIdx: number;
  do {
    colorIdx = Math.floor(Math.random() * STROOP_COLORS.length);
  } while (colorIdx === wordIdx);

  const options = shuffle(STROOP_COLORS);
  const correctIndex = options.findIndex(c => c.name === STROOP_COLORS[colorIdx].name);

  return {
    word: STROOP_COLORS[wordIdx].name.toUpperCase(),
    displayColor: STROOP_COLORS[colorIdx].hex,
    colorName: STROOP_COLORS[colorIdx].name,
    options,
    correctIndex,
  };
}

const oddOneOutPool = [
  { items: ['Apple', 'Banana', 'Carrot', 'Mango'], correctIndex: 2 },
  { items: ['Mars', 'Jupiter', 'Moon', 'Saturn'], correctIndex: 2 },
  { items: ['2', '4', '7', '8'], correctIndex: 2 },
  { items: ['Dog', 'Cat', 'Eagle', 'Rabbit'], correctIndex: 2 },
  { items: ['Square', 'Rectangle', 'Circle', 'Pentagon'], correctIndex: 2 },
  { items: ['Piano', 'Guitar', 'Drums', 'Violin'], correctIndex: 2 },
  { items: ['Red', 'Blue', 'Happy', 'Green'], correctIndex: 2 },
  { items: ['Tokyo', 'Paris', 'Amazon', 'London'], correctIndex: 2 },
  { items: ['Oxygen', 'Gold', 'Silver', 'Iron'], correctIndex: 0 },
  { items: ['Whale', 'Shark', 'Dolphin', 'Tuna'], correctIndex: 3 },
];

function generateOddOneOut(): OddOneOutData {
  const template = oddOneOutPool[Math.floor(Math.random() * oddOneOutPool.length)];
  const items = [...template.items];
  const correctItem = items[template.correctIndex];
  const shuffled = shuffle(items);
  return { items: shuffled, correctIndex: shuffled.indexOf(correctItem) };
}

const trickQuestions: MCQQuestion[] = [
  { question: "A farmer has 17 sheep. All but 9 die. How many are left?", options: ["8", "9", "17", "0"], correctIndex: 1 },
  { question: "How many months have 28 days?", options: ["1", "2", "6", "All 12"], correctIndex: 3 },
  { question: "If you have 3 apples and take away 2, how many do YOU have?", options: ["1", "2", "3", "0"], correctIndex: 1 },
  { question: "What weighs more: 1kg of feathers or 1kg of steel?", options: ["Steel", "Feathers", "Same weight", "Depends"], correctIndex: 2 },
  { question: "If you pass the person in 2nd place, what place are you in?", options: ["1st", "2nd", "3rd", "4th"], correctIndex: 1 },
  { question: "How many times can you subtract 5 from 25?", options: ["5", "4", "1", "Infinite"], correctIndex: 2 },
  { question: "What has a head, a tail, but no body?", options: ["Snake", "Worm", "Coin", "Fish"], correctIndex: 2 },
  { question: "If 2 is company and 3 is a crowd, what are 4 and 5?", options: ["A party", "9", "Too many", "A group"], correctIndex: 1 },
  { question: "A rooster lays an egg on top of a barn. Which way does it roll?", options: ["Left", "Right", "Down", "Roosters don't lay eggs"], correctIndex: 3 },
  { question: "What gets wetter the more it dries?", options: ["Sponge", "Towel", "Sand", "Paper"], correctIndex: 1 },
];

const reasoningQuestions: MCQQuestion[] = [
  { question: "What comes next: 2, 6, 18, 54, ?", options: ["108", "162", "72", "148"], correctIndex: 1 },
  { question: "If all Bloops are Razzles and all Razzles are Lazzles, are all Bloops Lazzles?", options: ["True", "False", "Cannot determine", "Sometimes"], correctIndex: 0 },
  { question: "Which number doesn't belong: 3, 5, 11, 14, 17, 23?", options: ["3", "14", "17", "23"], correctIndex: 1 },
  { question: "Complete: 1, 1, 2, 3, 5, 8, ?", options: ["11", "12", "13", "10"], correctIndex: 2 },
  { question: "If 5 machines take 5 min to make 5 widgets, how long for 100 machines to make 100?", options: ["100 min", "5 min", "20 min", "50 min"], correctIndex: 1 },
  { question: "What is 15% of 200?", options: ["25", "30", "35", "20"], correctIndex: 1 },
  { question: "A is to D as 1 is to ?", options: ["3", "4", "5", "2"], correctIndex: 1 },
  { question: "If CIFAIPC is rearranged, it becomes a(n):", options: ["City", "Animal", "Ocean", "Country"], correctIndex: 2 },
  { question: "Which is larger: 3/4 or 5/8?", options: ["3/4", "5/8", "Same", "Cannot tell"], correctIndex: 0 },
  { question: "Next in series: J, F, M, A, M, ?", options: ["J", "N", "A", "S"], correctIndex: 0 },
];

const awarenessQuestions: MCQQuestion[] = [
  { question: "Which direction does the sun rise?", options: ["North", "East", "West", "South"], correctIndex: 1 },
  { question: "How many legs does a spider have?", options: ["6", "8", "10", "12"], correctIndex: 1 },
  { question: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], correctIndex: 2 },
  { question: "What is the largest organ in the human body?", options: ["Heart", "Brain", "Liver", "Skin"], correctIndex: 3 },
  { question: "How many days are in a leap year?", options: ["364", "365", "366", "367"], correctIndex: 2 },
  { question: "What gas do plants absorb from the air?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctIndex: 2 },
  { question: "Which is the smallest continent?", options: ["Europe", "Australia", "Antarctica", "Africa"], correctIndex: 1 },
  { question: "How many bones in an adult human body?", options: ["106", "206", "306", "406"], correctIndex: 1 },
  { question: "What is the boiling point of water at sea level?", options: ["90°C", "100°C", "110°C", "120°C"], correctIndex: 1 },
  { question: "Which metal is liquid at room temperature?", options: ["Lead", "Mercury", "Zinc", "Tin"], correctIndex: 1 },
];

const behavioralPool: BehavioralData[] = [
  { question: "Under pressure, you prefer to:", optionA: "Act fast and adapt", optionB: "Step back and analyze", trait: "pressure" },
  { question: "When making decisions, you:", optionA: "Trust your gut feeling", optionB: "Weigh all the options", trait: "decision" },
  { question: "You feel more energized by:", optionA: "Starting new things", optionB: "Finishing what you started", trait: "motivation" },
  { question: "After making a mistake, you:", optionA: "Move on quickly", optionB: "Analyze what went wrong", trait: "error_response" },
  { question: "You'd rather be:", optionA: "Fast but occasionally wrong", optionB: "Slow but always accurate", trait: "speed_accuracy" },
  { question: "In a team, you prefer to:", optionA: "Lead the conversation", optionB: "Observe and contribute", trait: "social_style" },
];

function pickRandomMCQ(pool: MCQQuestion[]): MCQQuestion {
  const template = pool[Math.floor(Math.random() * pool.length)];
  const correctOption = template.options[template.correctIndex];
  const shuffled = shuffle(template.options);
  return {
    question: template.question,
    options: shuffled,
    correctIndex: shuffled.indexOf(correctOption),
  };
}

function generateMemoryNumbers(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
}

function generateMemoryPattern(): PatternGridData {
  const size = 3;
  const total = size * size;
  const numHighlight = 4;
  const cells: number[] = [];
  while (cells.length < numHighlight) {
    const c = Math.floor(Math.random() * total);
    if (!cells.includes(c)) cells.push(c);
  }
  return { size, cells };
}

export function generateTestQueue(): GeneratedTest[] {
  const queue: GeneratedTest[] = [];

  queue.push({ type: 'reaction-color', category: 'reaction', label: 'Color Reaction', iconType: 'zap' });
  queue.push({ type: 'reaction-shape', category: 'reaction', label: 'Quick Tap', iconType: 'zap' });

  queue.push({ type: 'memory-numbers', category: 'memory', label: 'Number Recall', iconType: 'brain', memoryNumbers: generateMemoryNumbers() });
  queue.push({ type: 'memory-pattern', category: 'memory', label: 'Pattern Recall', iconType: 'brain', memoryPattern: generateMemoryPattern() });

  queue.push({ type: 'stroop', category: 'focus', label: 'Color Focus', iconType: 'eye', stroop: generateStroop() });
  queue.push({ type: 'odd-one-out', category: 'focus', label: 'Odd One Out', iconType: 'eye', oddOneOut: generateOddOneOut() });

  queue.push({ type: 'trick-question', category: 'logic', label: 'Quick Thinking', iconType: 'target', mcq: pickRandomMCQ(trickQuestions) });
  queue.push({ type: 'reasoning', category: 'logic', label: 'Logic Puzzle', iconType: 'target', mcq: pickRandomMCQ(reasoningQuestions) });

  queue.push({ type: 'awareness', category: 'awareness', label: 'Quick Knowledge', iconType: 'globe', mcq: pickRandomMCQ(awarenessQuestions) });

  queue.push({ type: 'behavioral', category: 'behavioral', label: 'Your Style', iconType: 'heart', behavioral: behavioralPool[Math.floor(Math.random() * behavioralPool.length)] });

  return shuffle(queue);
}

export function scoreReaction(timeMs: number, earlyPenalties: number): number {
  const adjusted = timeMs + earlyPenalties * 150;
  if (adjusted <= 200) return 100;
  if (adjusted >= 700) return 10;
  return Math.round(100 - ((adjusted - 200) / 500) * 90);
}

export function scoreMemoryNumbers(correct: number, total: number): number {
  return Math.round((correct / total) * 100);
}

export function scoreMemoryPattern(correctCells: number, totalToSelect: number, wrongCells: number): number {
  const accuracy = Math.max(0, correctCells - wrongCells * 0.5) / totalToSelect;
  return Math.round(Math.max(0, accuracy) * 100);
}

export function scoreMCQ(correct: boolean, timeMs: number, maxTimeMs: number): number {
  if (!correct) return 10;
  const speedBonus = Math.max(0, 1 - timeMs / maxTimeMs);
  return Math.round(60 + speedBonus * 40);
}

export function scoreBehavioral(timeMs: number): number {
  return Math.max(30, Math.round(100 - timeMs / 80));
}

export type { MCQQuestion as LogicQuestion };
export function getRandomQuestion(): MCQQuestion {
  return pickRandomMCQ(reasoningQuestions);
}
export { generateMemoryNumbers as generateMemorySequence };
