/**
 * HomeEase Worker - Firebase Cloud Messaging (FCM) Service Structure
 * 
 * In production, this interfaces directly with `@react-native-firebase/messaging`:
 * `import messaging from '@react-native-firebase/messaging';`
 * 
 * For this FRONTEND-ONLY architecture, it provides the identical API contract,
 * handles token generation, background/foreground event callbacks, and topic subscriptions.
 */

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

class FCMService {
  private messageListeners: Set<MessageHandler> = new Set();
  private fcmToken: string = 'fcm_mock_token_' + Math.random().toString(36).substring(2, 12);

  /**
   * Request push notification permissions (iOS & Android 13+)
   */
  public async requestUserPermission(): Promise<boolean> {
    // Simulates native permission prompt
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  }

  /**
   * Fetch device registration token for push delivery
   */
  public async getFCMToken(): Promise<string> {
    try {
      await workerApiService.updateFcmToken(this.fcmToken);
    } catch (err) {}
    return this.fcmToken;
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
   * Subscribe worker to service category topic (e.g. 'topic_cleaning_hyderabad')
   */
  public async subscribeToTopic(topic: string): Promise<void> {
    console.log(`[FCM] Subscribed worker to topic: ${topic}`);
  }

  /**
   * Unsubscribe from topic
   */
  public async unsubscribeFromTopic(topic: string): Promise<void> {
    console.log(`[FCM] Unsubscribed worker from topic: ${topic}`);
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
