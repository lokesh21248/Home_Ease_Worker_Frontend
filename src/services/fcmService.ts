/**
 * HomeEase Worker - Firebase Cloud Messaging (FCM) & Push Notification Service
 * 
 * Supports both native push notification providers:
 * 1. `expo-notifications` (for Expo managed workflow / EAS builds)
 * 2. `@react-native-firebase/messaging` (for bare React Native builds)
 * 3. Graceful fallback mode for Expo Go / simulator / development without native push modules
 */

import { Platform } from 'react-native';
import { workerApiService } from '../api/workerApiService';

export interface RemoteMessage {
  messageId: string;
  notification?: {
    title: string;
    body: string;
  };
  data?: Record<string, any>;
  sentTime?: number;
}

type MessageHandler = (message: RemoteMessage) => void;

// Safe dynamic accessor for expo-notifications to prevent compile errors when package is missing
function getExpoNotifications(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-notifications');
  } catch {
    return null;
  }
}

// Safe dynamic accessor for @react-native-firebase/messaging
function getFirebaseMessaging(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const messaging = require('@react-native-firebase/messaging');
    return messaging.default || messaging;
  } catch {
    return null;
  }
}

class FCMService {
  private messageListeners: Set<MessageHandler> = new Set();
  private fcmToken: string | null = null;
  private isInitialized: boolean = false;
  private expoNotifications = getExpoNotifications();
  private firebaseMessaging = getFirebaseMessaging();

  constructor() {
    this.initNotificationChannels();
  }

  /**
   * Configure high-priority Android notification channels (Android 8.0+)
   */
  private async initNotificationChannels(): Promise<void> {
    if (this.expoNotifications && Platform.OS === 'android') {
      try {
        await this.expoNotifications.setNotificationChannelAsync('job_alerts', {
          name: 'Job Alerts',
          importance: this.expoNotifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        // Set foreground notification presentation handler
        this.expoNotifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
      } catch (err) {
        console.warn('[FCMService] Failed to set Android notification channel:', err);
      }
    }
  }

  /**
   * Request push notification permissions (iOS & Android 13+)
   */
  public async requestUserPermission(): Promise<boolean> {
    // 1. Try @react-native-firebase/messaging
    if (this.firebaseMessaging) {
      try {
        const authStatus = await this.firebaseMessaging().requestPermission();
        const enabled =
          authStatus === this.firebaseMessaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === this.firebaseMessaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
      } catch (err) {
        console.warn('[FCMService] Firebase requestPermission error:', err);
      }
    }

    // 2. Try expo-notifications
    if (this.expoNotifications) {
      try {
        const { status: existingStatus } = await this.expoNotifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await this.expoNotifications.requestPermissionsAsync();
          finalStatus = status;
        }
        return finalStatus === 'granted';
      } catch (err) {
        console.warn('[FCMService] Expo requestPermissionsAsync error:', err);
      }
    }

    // 3. Fallback mode (simulated permission in dev/mock environment)
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  }

  /**
   * Fetch device registration token for push delivery and register with backend
   */
  public async getFCMToken(): Promise<string> {
    if (this.fcmToken && !this.fcmToken.startsWith('fcm_mock_token_')) {
      return this.fcmToken;
    }

    let token: string | null = null;

    // 1. Try @react-native-firebase/messaging
    if (this.firebaseMessaging) {
      try {
        token = await this.firebaseMessaging().getToken();
        console.log('[FCMService] Acquired native Firebase FCM token');
      } catch (err) {
        console.warn('[FCMService] Failed to acquire Firebase FCM token:', err);
      }
    }

    // 2. Try expo-notifications
    if (!token && this.expoNotifications) {
      try {
        const devicePushToken = await this.expoNotifications.getDevicePushTokenAsync();
        token = devicePushToken.data;
        console.log('[FCMService] Acquired Expo native device push token');
      } catch (err) {
        // Fallback to Expo push token if getDevicePushToken fails (e.g. without google-services.json)
        try {
          const expoPushToken = await this.expoNotifications.getExpoPushTokenAsync();
          token = expoPushToken.data;
          console.log('[FCMService] Acquired Expo push token fallback');
        } catch (innerErr) {
          console.warn('[FCMService] Failed to acquire Expo push token:', innerErr);
        }
      }
    }

    // 3. Fallback mock token for development if no native push provider is installed
    if (!token) {
      token = 'fcm_mock_token_' + Math.random().toString(36).substring(2, 12);
      console.log('[FCMService] Using mock token (native push package not installed or in simulator)');
    }

    this.fcmToken = token;

    // Register token with backend via POST /api/v1/user/fcm-token (or /api/v1/worker/fcm-token)
    try {
      await workerApiService.updateFcmToken(this.fcmToken);
      console.log('[FCMService] Successfully registered push token with backend');
    } catch (err) {
      console.warn('[FCMService] Failed to register push token with backend:', err);
    }

    this.setupListeners();
    return this.fcmToken;
  }

  /**
   * Setup native message listeners
   */
  private setupListeners(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Firebase onMessage
    if (this.firebaseMessaging) {
      try {
        this.firebaseMessaging().onMessage(async (remoteMessage: any) => {
          const formatted: RemoteMessage = {
            messageId: remoteMessage.messageId || `msg_${Date.now()}`,
            notification: remoteMessage.notification ? {
              title: remoteMessage.notification.title || '',
              body: remoteMessage.notification.body || '',
            } : undefined,
            data: remoteMessage.data,
            sentTime: remoteMessage.sentTime || Date.now(),
          };
          this.messageListeners.forEach((listener) => listener(formatted));
        });
      } catch (err) {
        console.warn('[FCMService] Failed to attach Firebase onMessage listener:', err);
      }
    }

    // Expo notification received listener
    if (this.expoNotifications) {
      try {
        this.expoNotifications.addNotificationReceivedListener((notification: any) => {
          const req = notification.request;
          const content = req.content;
          const formatted: RemoteMessage = {
            messageId: req.identifier || `msg_${Date.now()}`,
            notification: {
              title: content.title || '',
              body: content.body || '',
            },
            data: content.data,
            sentTime: Date.now(),
          };
          this.messageListeners.forEach((listener) => listener(formatted));
        });
      } catch (err) {
        console.warn('[FCMService] Failed to attach Expo notification listener:', err);
      }
    }
  }

  /**
   * Foreground notification listener
   */
  public onMessage(handler: MessageHandler): () => void {
    this.messageListeners.add(handler);
    return () => {
      this.messageListeners.delete(handler);
    };
  }

  /**
   * Subscribe worker to service category topic or user topic (e.g. 'user_{workerId}' or 'topic_cleaning_hyderabad')
   */
  public async subscribeToTopic(topic: string): Promise<void> {
    if (this.firebaseMessaging) {
      try {
        await this.firebaseMessaging().subscribeToTopic(topic);
        console.log(`[FCMService] Subscribed to Firebase topic: ${topic}`);
        return;
      } catch (err) {
        console.warn(`[FCMService] Failed to subscribe to Firebase topic ${topic}:`, err);
      }
    }

    // Note: Backend automatically auto-subscribes registered device tokens to topic `user_{userId}`
    console.log(`[FCMService] Topic subscription requested for: ${topic} (managed via backend token registry)`);
  }

  /**
   * Unsubscribe from topic
   */
  public async unsubscribeFromTopic(topic: string): Promise<void> {
    if (this.firebaseMessaging) {
      try {
        await this.firebaseMessaging().unsubscribeFromTopic(topic);
        console.log(`[FCMService] Unsubscribed from Firebase topic: ${topic}`);
        return;
      } catch (err) {
        console.warn(`[FCMService] Failed to unsubscribe from Firebase topic ${topic}:`, err);
      }
    }
    console.log(`[FCMService] Unsubscribed from topic: ${topic}`);
  }

  /**
   * Helper method for UI simulation - triggers a mock FCM push event
   */
  public simulateIncomingJobNotification(customerName: string, serviceName: string, price: number) {
    const mockMessage: RemoteMessage = {
      messageId: `msg_${Date.now()}`,
      notification: {
        title: '⚡ New Job Request Available!',
        body: `${customerName} booked ${serviceName}. Earn ₹${price}`,
      },
      data: {
        type: 'NEW_JOB_REQUEST',
        jobId: 'c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4a',
      },
      sentTime: Date.now(),
    };

    this.messageListeners.forEach((listener) => listener(mockMessage));
  }
}

export const fcmService = new FCMService();
export default fcmService;
