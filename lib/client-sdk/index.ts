'use client';

/**
 * Call SDK
 * High-level API for WebRTC calling
 * 
 * Usage:
 * const sdk = new CallSDK({ apiKey: 'your-api-key' });
 * const session = await sdk.createCall({ roomId: 'my-room' });
 * await sdk.joinCall(session.token);
 * await sdk.toggleAudio(true);
 * await sdk.toggleVideo(true);
 */

import { WebRTCManager } from './webrtc-manager';
import { CallRecorder } from './recording';
import type {
  CallConfig,
  CallSession,
  CallOptions,
  Participant,
  CallState,
  StreamOptions,
  SDKEvents,
  EventCallback,
} from './types';

type SDKEventKey = keyof SDKEvents;

export class CallSDK {
  private config: Required<CallConfig>;
  private session: CallSession | null = null;
  private callState: CallState | null = null;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private webrtcManager: WebRTCManager;
  private recorder: CallRecorder | null = null;
  private eventListeners: Map<SDKEventKey, EventCallback<any>[]> = new Map();
  private participantStreams: Map<string, MediaStream> = new Map();

  constructor(config: CallConfig) {
    this.config = {
      apiKey: config.apiKey,
      apiEndpoint: config.apiEndpoint || (typeof window !== 'undefined' ? window.location.origin : ''),
      iceServers: config.iceServers,
      constraints: config.constraints || { audio: true, video: true },
    };

    this.webrtcManager = new WebRTCManager({
      iceServers: this.config.iceServers,
    });
  }

  /**
   * Create a new call session
   */
  async createCall(options: CallOptions): Promise<CallSession> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/api/calls/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          roomId: options.roomId,
          type: options.type || 'video',
          maxParticipants: options.maxParticipants || 10,
          metadata: options.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create call: ${response.statusText}`);
      }

      this.session = await response.json();
      this.emit('call:created', { call: this.session });

      return this.session;
    } catch (error) {
      console.error('[v0] Create call error:', error);
      this.emit('error', { error: error as Error });
      throw error;
    }
  }

  /**
   * Join a call using a token
   */
  async joinCall(token: string): Promise<void> {
    try {
      if (!this.session) {
        throw new Error('No session found. Create a call first.');
      }

      // Get call state
      const response = await fetch(`${this.config.apiEndpoint}/api/calls/${this.session.callId}/state`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to join call: ${response.statusText}`);
      }

      this.callState = await response.json();

      // Get local media stream
      await this.getLocalStream();

      // Initialize WebRTC connections with other participants
      if (this.callState.participants) {
        for (const participant of this.callState.participants) {
          if (participant.participantId !== this.session.participantId) {
            await this.webrtcManager.createPeerConnection(participant.participantId, {
              onStream: (stream) => {
                this.participantStreams.set(participant.participantId, stream);
                this.emit('stream:added', { participant, stream });
              },
              onRemoveStream: () => {
                this.participantStreams.delete(participant.participantId);
                this.emit('stream:removed', { participant });
              },
            });
          }
        }
      }

      this.emit('call:joined', { participants: this.callState.participants || [] });
    } catch (error) {
      console.error('[v0] Join call error:', error);
      this.emit('error', { error: error as Error });
      throw error;
    }
  }

  /**
   * Leave the current call
   */
  async leaveCall(reason?: string): Promise<void> {
    try {
      if (!this.session) {
        throw new Error('No active session');
      }

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Close all peer connections
      this.webrtcManager.closeAll();

      this.emit('call:left', { reason });
    } catch (error) {
      console.error('[v0] Leave call error:', error);
      this.emit('error', { error: error as Error });
      throw error;
    }
  }

  /**
   * Get local media stream
   */
  private async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    this.localStream = await navigator.mediaDevices.getUserMedia(this.config.constraints);
    return this.localStream;
  }

  /**
   * Toggle audio
   */
  async toggleAudio(enabled: boolean): Promise<void> {
    if (!this.localStream) {
      throw new Error('No local stream available');
    }

    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });

    this.emit('media:audio-changed', { enabled });
  }

  /**
   * Toggle video
   */
  async toggleVideo(enabled: boolean): Promise<void> {
    if (!this.localStream) {
      throw new Error('No local stream available');
    }

    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });

    this.emit('media:video-changed', { enabled });
  }

  /**
   * Start screen share
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: { cursor: 'always' },
      });

      this.emit('media:screen-share-changed', { enabled: true });
      return this.screenStream;
    } catch (error) {
      console.error('[v0] Screen share error:', error);
      this.emit('error', { error: error as Error });
      throw error;
    }
  }

  /**
   * Stop screen share
   */
  async stopScreenShare(): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    this.emit('media:screen-share-changed', { enabled: false });
  }

  /**
   * Start recording (client-side)
   */
  async startRecording(stream: MediaStream): Promise<void> {
    try {
      if (!this.session) {
        throw new Error('No active session');
      }

      this.recorder = new CallRecorder(this.session.callId, this.session.participantId);
      await this.recorder.init();
      await this.recorder.startRecording(stream);
    } catch (error) {
      console.error('[v0] Start recording error:', error);
      this.emit('error', { error: error as Error });
      throw error;
    }
  }

  /**
   * Stop recording (client-side)
   */
  async stopRecording(): Promise<Blob> {
    if (!this.recorder) {
      throw new Error('Recording not started');
    }

    return await this.recorder.stopRecording();
  }

  /**
   * Upload recording
   */
  async uploadRecording(endpoint: string): Promise<void> {
    if (!this.recorder) {
      throw new Error('No recording available');
    }

    await this.recorder.uploadRecording({
      endpoint,
      method: 'POST',
    });
  }

  /**
   * Get current call state
   */
  getCallState(): CallState | null {
    return this.callState;
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get participant stream
   */
  getParticipantStream(participantId: string): MediaStream | null {
    return this.participantStreams.get(participantId) || null;
  }

  /**
   * Event listening
   */
  on<K extends SDKEventKey>(event: K, callback: EventCallback<K>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off<K extends SDKEventKey>(event: K, callback: EventCallback<K>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit<K extends SDKEventKey>(event: K, data: SDKEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

// Export types for external use
export type {
  CallConfig,
  CallSession,
  CallOptions,
  Participant,
  CallState,
  StreamOptions,
  SDKEvents,
  EventCallback,
};

export { CallRecorder };
export { WebRTCManager };
