import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;

export function hasFirebaseConfig(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;

  if (!hasFirebaseConfig()) {
    console.log('[Firebase] Missing config — analytics disabled');
    return null;
  }

  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    console.log('[Firebase] App initialized');
    return app;
  } catch (e) {
    console.log('[Firebase] Init error:', e);
    return null;
  }
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) return analyticsInstance;

  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('[Firebase] Analytics not supported in this environment');
      return null;
    }
    analyticsInstance = getAnalytics(firebaseApp);
    console.log('[Firebase] Analytics initialized');
    return analyticsInstance;
  } catch (e) {
    console.log('[Firebase] Analytics init error:', e);
    return null;
  }
}
