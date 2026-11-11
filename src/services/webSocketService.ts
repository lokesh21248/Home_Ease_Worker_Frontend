import { BASE_API_URL } from '../api/endpoints';

// Candidate WebSocket URLs for resilient real-time STOMP connection
const getCandidateWebSocketUrls = (): string[] => {
  const candidates: string[] = [];

  // 1. Env configured tracking ws url if present
  if (process.env.EXPO_PUBLIC_TRACKING_WS_URL) {
    const envUrl = process.env.EXPO_PUBLIC_TRACKING_WS_URL.trim();
    if (envUrl) candidates.push(envUrl);
  }

  // 2. Derive endpoints from BASE_API_URL
  try {
    const url = new URL(BASE_API_URL);
    const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = url.host;
    const workerEndpoint = `${wsProto}//${host}/worker/stream/websocket`;
    const standardEndpoint = `${wsProto}//${host}/ws`;

    if (!candidates.includes(workerEndpoint)) candidates.push(workerEndpoint);
    if (!candidates.includes(standardEndpoint)) candidates.push(standardEndpoint);
  } catch {
    const fallbackWorker = 'ws://3.108.55.219/worker/stream/websocket';
    const fallbackWs = 'ws://3.108.55.219/ws';
    if (!candidates.includes(fallbackWorker)) candidates.push(fallbackWorker);
    if (!candidates.includes(fallbackWs)) candidates.push(fallbackWs);
  }

  return candidates;
};

type JobRequestListener = (payload: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnectedState: boolean = false;
  private reconnectTimeout: any = null;
  private heartbeatInterval: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 15;
  private endpointIndex: number = 0;
  private listeners: Set<JobRequestListener> = new Set();
  private currentUserId: string | null = null;
  private currentWorkerId: string | null = null;
  private subscriptionIds: { [dest: string]: string } = {};

  /**
   * Connect to backend STOMP WebSocket broker with auto endpoint fallback
   */
  connect(userId: string, workerId?: string): void {
    if (!userId) return;
    this.currentUserId = userId;
    if (workerId) this.currentWorkerId = workerId;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      // If already connected, re-subscribe if workerId was updated
      if (this.isConnectedState) {
        this.subscribeToChannels();
      }
      return;
    }

    const candidates = getCandidateWebSocketUrls();
    const wsUrl = candidates[this.endpointIndex % candidates.length];
    console.log(`[WebSocketService] Connecting to: ${wsUrl} (candidate ${(this.endpointIndex % candidates.length) + 1}/${candidates.length})`);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[WebSocketService] Socket connection opened. Sending STOMP CONNECT frame.');
        this.sendFrame('CONNECT', {
          'accept-version': '1.2,1.1,1.0',
          'heart-beat': '10000,10000',
        });
      };

      this.socket.onmessage = (event) => {
        this.handleIncomingData(event.data);
      };

      this.socket.onerror = (err) => {
        console.warn('[WebSocketService] Socket error:', err);
      };

      this.socket.onclose = (event) => {
        console.log(`[WebSocketService] Socket closed. Code: ${event.code}, Reason: ${event.reason}`);
        this.isConnectedState = false;
        this.cleanupHeartbeat();
        this.endpointIndex++;
        this.scheduleReconnect();
      };
    } catch (e: any) {
      console.warn('[WebSocketService] Connection initiation failed:', e?.message);
      this.endpointIndex++;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect and clear all active reconnect timers
   */
  disconnect(): void {
    this.isConnectedState = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.cleanupHeartbeat();
    if (this.socket) {
      try {
        this.sendFrame('DISCONNECT', {});
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Register a listener for new order dispatch pushes
   */
  onNewJobRequest(listener: JobRequestListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  isConnected(): boolean {
    return this.isConnectedState && this.socket?.readyState === WebSocket.OPEN;
  }

  private handleIncomingData(data: any): void {
    if (typeof data !== 'string') return;

    // Handle newline heartbeats
    if (data === '\n' || data === '\r\n') {
      return;
    }

    const frames = this.parseStompFrames(data);
    for (const frame of frames) {
      if (frame.command === 'CONNECTED') {
        console.log('[WebSocketService] STOMP session established!');
        this.isConnectedState = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.subscribeToChannels();
      } else if (frame.command === 'MESSAGE') {
        try {
          const bodyJson = JSON.parse(frame.body);
          console.log('[WebSocketService] Incoming message on destination:', frame.headers['destination'], bodyJson);
          this.notifyListeners(bodyJson);
        } catch {
          console.warn('[WebSocketService] Non-JSON message payload:', frame.body);
        }
      }
    }
  }

  private subscribeToChannels(): void {
    if (!this.isConnectedState || !this.socket) return;

    // Subscribe to userId topic
    if (this.currentUserId) {
      const userDest = `/topic/worker/${this.currentUserId}/requests`;
      this.sendFrame('SUBSCRIBE', {
        id: 'sub-user-req',
        destination: userDest,
        ack: 'auto',
      });
      const userStreamDest = `/topic/worker/${this.currentUserId}/stream`;
      this.sendFrame('SUBSCRIBE', {
        id: 'sub-user-stream',
        destination: userStreamDest,
        ack: 'auto',
      });
      console.log('[WebSocketService] Subscribed to:', userDest, userStreamDest);
    }

    // Subscribe to workerId topic
    if (this.currentWorkerId && this.currentWorkerId !== this.currentUserId) {
      const workerDest = `/topic/worker/${this.currentWorkerId}/requests`;
      this.sendFrame('SUBSCRIBE', {
        id: 'sub-worker-req',
        destination: workerDest,
        ack: 'auto',
      });
      const workerStreamDest = `/topic/worker/${this.currentWorkerId}/stream`;
      this.sendFrame('SUBSCRIBE', {
        id: 'sub-worker-stream',
        destination: workerStreamDest,
        ack: 'auto',
      });
      console.log('[WebSocketService] Subscribed to:', workerDest, workerStreamDest);
    }
  }

  private notifyListeners(payload: any): void {
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.warn('[WebSocketService] Error executing listener callback:', err);
      }
    });
  }

  private sendFrame(command: string, headers: Record<string, string>, body: string = ''): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    let frame = `${command}\n`;
    for (const [key, value] of Object.entries(headers)) {
      frame += `${key}:${value}\n`;
    }
    frame += `\n${body}\0`;
    this.socket.send(frame);
  }

  private parseStompFrames(raw: string): Array<{ command: string; headers: Record<string, string>; body: string }> {
    const frames: Array<{ command: string; headers: Record<string, string>; body: string }> = [];
    const parts = raw.split('\0');

    for (const part of parts) {
      const trimmed = part.replace(/^[\r\n]+/, '').trim();
      if (!trimmed) continue;

      const lines = trimmed.split(/\r?\n/);
      const command = lines[0]?.trim();
      if (!command) continue;

      const headers: Record<string, string> = {};
      let bodyIndex = -1;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === '') {
          bodyIndex = i + 1;
          break;
        }
        const colonPos = line.indexOf(':');
        if (colonPos !== -1) {
          const key = line.substring(0, colonPos).trim();
          const value = line.substring(colonPos + 1).trim();
          headers[key] = value;
        }
      }

      const body = bodyIndex !== -1 ? lines.slice(bodyIndex).join('\n') : '';
      frames.push({ command, headers, body });
    }
    return frames;
  }

  private startHeartbeat(): void {
    this.cleanupHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send('\n'); // Standard STOMP ping
        } catch {}
      }
    }, 10000);
  }

  private cleanupHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocketService] Max reconnect attempts reached. Resetting counter for next reconnect attempt.');
      this.reconnectAttempts = 0;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1500 * Math.pow(1.3, this.reconnectAttempts), 15000);
    console.log(`[WebSocketService] Reconnecting in ${Math.round(delay)}ms (Attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.currentUserId) {
        this.connect(this.currentUserId, this.currentWorkerId || undefined);
      }
    }, delay);
  }
}

export const webSocketService = new WebSocketService();
