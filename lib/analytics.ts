import { logEvent as firebaseLogEvent, setUserProperties } from 'firebase/analytics';
import { Platform, Dimensions } from 'react-native';
import { getFirebaseAnalytics, hasFirebaseConfig } from './firebase';

type EventParams = Record<string, string | number | boolean | undefined>;

let analyticsReady = false;
let pendingEvents: Array<{ name: string; params?: EventParams }> = [];

async function ensureAnalytics() {
  if (analyticsReady || Platform.OS !== 'web' || !hasFirebaseConfig()) return;
  const analytics = await getFirebaseAnalytics();
  if (analytics) {
    analyticsReady = true;

    if (pendingEvents.length > 0) {
      console.log(`[Analytics] Flushing ${pendingEvents.length} pending events`);
      for (const event of pendingEvents) {
        try {
          firebaseLogEvent(analytics, event.name, event.params);
        } catch (e) {
          console.log(`[Analytics] Flush error for ${event.name}:`, e);
        }
      }
      pendingEvents = [];
    }
  }
}

export async function logEvent(eventName: string, params?: EventParams): Promise<void> {
  console.log(`[Analytics] ${eventName}`, params ?? '');

  if (Platform.OS !== 'web' || !hasFirebaseConfig()) return;

  try {
    const analytics = await getFirebaseAnalytics();
    if (analytics) {
      firebaseLogEvent(analytics, eventName, params);
      analyticsReady = true;
    } else {
      pendingEvents.push({ name: eventName, params });
    }
  } catch (e) {
    console.log(`[Analytics] Error logging ${eventName}:`, e);
    pendingEvents.push({ name: eventName, params });
  }
}

export async function setUserProps(): Promise<void> {
  if (Platform.OS !== 'web' || !hasFirebaseConfig()) return;

  try {
    const analytics = await getFirebaseAnalytics();
    if (!analytics) return;

    const { width } = Dimensions.get('window');
    const deviceType = width < 768 ? 'mobile' : 'desktop';

    setUserProperties(analytics, {
      device_type: deviceType,
      platform: 'web',
    });
    console.log('[Analytics] User properties set:', { deviceType });
  } catch (e) {
    console.log('[Analytics] Error setting user properties:', e);
  }
}

// --- Typed event helpers ---

export function trackLandingView() {
  return logEvent('landing_view');
}

export function trackStartTest() {
  return logEvent('start_test');
}

export function trackTestProgress(roundName: string) {
  return logEvent('test_progress', { round_name: roundName });
}

export function trackTestComplete(params: {
  totalScore: number;
  tier: string;
  durationSeconds: number;
}) {
  return logEvent('test_complete', {
    total_score: params.totalScore,
    tier: params.tier,
    duration_seconds: params.durationSeconds,
  });
}

export function trackRetryClicked() {
  return logEvent('retry_clicked');
}

export function trackShareClicked(method: 'whatsapp' | 'copy_link') {
  return logEvent('share_clicked', { method });
}

export function trackChallengeOpened() {
  return logEvent('challenge_opened');
}

export function trackPaymentInitiated() {
  return logEvent('payment_initiated');
}

export function trackPaymentSuccess(params: { amount: number; planName: string }) {
  return logEvent('payment_success', {
    amount: params.amount,
    plan_name: params.planName,
  });
}

export function trackPremiumUnlocked() {
  return logEvent('premium_unlocked');
}

export { ensureAnalytics };
