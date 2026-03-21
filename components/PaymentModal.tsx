import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { X, Lock, Sparkles, Brain, TrendingUp, Shield } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { trackPaymentSuccess } from '@/lib/analytics';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ visible, onClose, onSuccess }: PaymentModalProps) {
  const [_processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'offer' | 'processing' | 'success'>('offer');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('offer');
      setProcessing(false);
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
      checkScale.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim, checkScale]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }, [fadeAnim, slideAnim, onClose]);

  const handlePurchase = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessing(true);
    setStep('processing');

    await new Promise((r) => setTimeout(r, 2000));

    setStep('success');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void trackPaymentSuccess({ amount: 49, planName: 'full_insights' });

    Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();

    setTimeout(() => {
      onSuccess();
    }, 1200);
  }, [checkScale, onSuccess]);

  const features = [
    { icon: Brain, label: 'Your Brain Type Profile', color: Colors.teal },
    { icon: TrendingUp, label: 'Strengths & Weaknesses', color: Colors.amber },
    { icon: Sparkles, label: 'Personalized Improvement Tips', color: '#A78BFA' },
  ];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={handleClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {step === 'offer' && (
            <>
              <View style={styles.sheetHandle} />
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.lockBadge}>
                <View style={styles.lockIconWrap}>
                  <Lock size={24} color={Colors.amber} />
                </View>
              </View>

              <Text style={styles.title}>Unlock Full Insights</Text>
              <Text style={styles.subtitle}>
                Discover your brain type, hidden strengths, and a personalized improvement plan.
              </Text>

              <View style={styles.featureList}>
                {features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: `${f.color}15` }]}>
                      <f.icon size={18} color={f.color} />
                    </View>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={handlePurchase}
                activeOpacity={0.85}
                testID="purchase-button"
              >
                <Text style={styles.purchaseButtonText}>Unlock for ₹49</Text>
              </TouchableOpacity>

              <View style={styles.secureRow}>
                <Shield size={13} color={Colors.textMuted} />
                <Text style={styles.secureText}>Secure one-time payment</Text>
              </View>
            </>
          )}

          {step === 'processing' && (
            <View style={styles.processingWrap}>
              <ActivityIndicator size="large" color={Colors.teal} />
              <Text style={styles.processingText}>Processing payment...</Text>
              <Text style={styles.processingSubtext}>This will just take a moment</Text>
            </View>
          )}

          {step === 'success' && (
            <View style={styles.successWrap}>
              <Animated.View style={[styles.successCircle, { transform: [{ scale: checkScale }] }]}>
                <Text style={styles.successEmoji}>✓</Text>
              </Animated.View>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successSubtext}>Your full insights are ready</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end' as const,
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    minHeight: 380,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center' as const,
    marginBottom: 20,
  },
  closeBtn: {
    position: 'absolute' as const,
    top: 18,
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCardLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  lockBadge: {
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  lockIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.amberGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  featureList: {
    gap: 14,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  purchaseButton: {
    backgroundColor: Colors.amber,
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#1A1A2E',
  },
  secureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  secureText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  processingWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    gap: 16,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  processingSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  successWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 50,
    gap: 12,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.greenGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  successEmoji: {
    fontSize: 32,
    color: Colors.green,
    fontWeight: '700' as const,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.green,
  },
  successSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
