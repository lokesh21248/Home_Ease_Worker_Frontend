import { Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

class AlertFeedbackService {
  /**
   * High-priority vibration and haptic pattern for incoming job alerts.
   * Designed to penetrate pocket fabric and catch the partner's attention while driving or busy.
   */
  public async playJobAlertFeedback(): Promise<void> {
    try {
      // Distinct double-pulse cadence: wait 0ms, vibrate 600ms, pause 250ms, vibrate 600ms
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 600, 250, 600, 250, 800]);
      } else {
        Vibration.vibrate([0, 500, 200, 500]);
      }

      // Trigger haptic alert if supported natively by device
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setTimeout(async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          } catch {}
        }, 300);
      } catch {
        // Silently handled: native haptics unsupported or running in Expo Go without native build
      }
    } catch {
      // Handled silently
    }
  }

  /**
   * Positive haptic feedback for job acceptance, PIN unlock, or payment credit.
   */
  public async playSuccessFeedback(): Promise<void> {
    try {
      Vibration.vibrate(180);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Silently handled
      }
    } catch {
      // Handled silently
    }
  }

  /**
   * Tactile touch impact for button presses, status step updates, and switches.
   */
  public async playTouchFeedback(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    try {
      const hapticStyle =
        style === 'light'
          ? Haptics.ImpactFeedbackStyle.Light
          : style === 'heavy'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium;

      await Haptics.impactAsync(hapticStyle);
    } catch {}
  }

  /**
   * Cancel ongoing vibration pattern
   */
  public stopVibration(): void {
    try {
      Vibration.cancel();
    } catch {}
  }
}

export const alertFeedbackService = new AlertFeedbackService();
export default alertFeedbackService;
