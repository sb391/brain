import AsyncStorage from '@react-native-async-storage/async-storage';

const SCORE_HISTORY_KEY = 'brainscore_history';
const MAX_HISTORY = 10;

export interface ScoreEntry {
  score: number;
  tier: string;
  timestamp: number;
  categoryScores: Record<string, { score: number; max: number }>;
}

export async function getScoreHistory(): Promise<ScoreEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SCORE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.log('[ScoreHistory] Failed to read:', e);
    return [];
  }
}

export async function saveScore(entry: ScoreEntry): Promise<void> {
  try {
    const history = await getScoreHistory();
    history.push(entry);
    const trimmed = history.slice(-MAX_HISTORY);
    await AsyncStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(trimmed));
    console.log('[ScoreHistory] Saved score:', entry.score, 'total entries:', trimmed.length);
  } catch (e) {
    console.log('[ScoreHistory] Failed to save:', e);
  }
}

export async function clearScoreHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SCORE_HISTORY_KEY);
  } catch (e) {
    console.log('[ScoreHistory] Failed to clear:', e);
  }
}
