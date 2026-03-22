import AsyncStorage from '@react-native-async-storage/async-storage';

const TRACKER_KEY = 'brainscore_question_tracker';
const MAX_HISTORY_PER_THEME = 30;

interface QuestionHistory {
  [themeId: string]: number[];
}

let cachedHistory: QuestionHistory | null = null;

export async function loadQuestionHistory(): Promise<QuestionHistory> {
  if (cachedHistory) return cachedHistory;
  try {
    const raw = await AsyncStorage.getItem(TRACKER_KEY);
    cachedHistory = raw ? JSON.parse(raw) : {};
    console.log('[QuestionTracker] Loaded history:', Object.keys(cachedHistory ?? {}).length, 'themes');
    return cachedHistory ?? {};
  } catch (e) {
    console.log('[QuestionTracker] Failed to load history:', e);
    cachedHistory = {};
    return {};
  }
}

export async function saveUsedQuestions(themeId: string, usedIndices: number[]): Promise<void> {
  try {
    const history = await loadQuestionHistory();
    const existing = history[themeId] ?? [];
    const combined = [...existing, ...usedIndices];
    history[themeId] = combined.slice(-MAX_HISTORY_PER_THEME);
    cachedHistory = history;
    await AsyncStorage.setItem(TRACKER_KEY, JSON.stringify(history));
    console.log(`[QuestionTracker] Saved ${usedIndices.length} used questions for theme '${themeId}', total tracked: ${history[themeId].length}`);
  } catch (e) {
    console.log('[QuestionTracker] Failed to save history:', e);
  }
}

export function getRecentlyUsed(history: QuestionHistory, themeId: string): number[] {
  return history[themeId] ?? [];
}

export function selectFreshQuestions<T>(
  pool: T[],
  count: number,
  recentlyUsed: number[],
): { selected: T[]; indices: number[] } {
  const allIndices = pool.map((_, i) => i);

  const fresh = allIndices.filter(i => !recentlyUsed.includes(i));
  const stale = allIndices.filter(i => recentlyUsed.includes(i));

  const shuffledFresh = shuffleArray(fresh);
  const shuffledStale = shuffleArray(stale);

  const prioritized = [...shuffledFresh, ...shuffledStale];

  const pickedIndices = prioritized.slice(0, count);
  const finalIndices = shuffleArray(pickedIndices);

  console.log(`[QuestionTracker] Pool: ${pool.length}, Needed: ${count}, Fresh available: ${fresh.length}, Using stale: ${Math.max(0, count - fresh.length)}`);

  return {
    selected: finalIndices.map(i => pool[i]),
    indices: finalIndices,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function clearQuestionHistory(): Promise<void> {
  cachedHistory = null;
  return AsyncStorage.removeItem(TRACKER_KEY);
}
