'use client';

/**
 * Client SDK Type Definitions
 */

export interface CallConfig {
  apiKey: string;
  apiEndpoint?: string; // Default: current origin
  iceServers?: RTCIceServer[];
  constraints?: {
    audio?: boolean | MediaStreamConstraints['audio'];
    video?: boolean | MediaStreamConstraints['video'];
  };
}

export interface CallSession {
  callId: string;
  participantId: string;
  token: string;
  expiresIn: number;
  iceServers?: RTCIceServer[];
  createdAt: string;
}

export interface CallOptions {
  roomId: string;
  type?: 'video' | 'audio';
  maxParticipants?: number;
  metadata?: Record<string, any>;
}

export interface Participant {
  participantId: string;
  userId?: string;
  userName?: string;
  status: 'joined' | 'active' | 'left' | 'disconnected';
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled?: boolean;
  joinedAt: string;
  metadata?: Record<string, any>;
  remoteStream?: MediaStream;
  peerConnection?: RTCPeerConnection;
}

export interface CallState {
  callId: string;
  roomId: string;
  type: 'video' | 'audio';
  status: 'active' | 'ended' | 'error';
  participantCount: number;
  participants: Participant[];
  duration?: number; // seconds
  metadata?: Record<string, any>;
  createdAt: string;
  endedAt?: string;
}

export interface StreamOptions {
  audio?: boolean | MediaStreamConstraints['audio'];
  video?: boolean | MediaStreamConstraints['video'];
  screen?: boolean;
}

export interface SDKEvents {
  'call:created': { call: CallSession };
  'call:joined': { participants: Participant[] };
  'call:left': { reason?: string };
  'call:ended': { duration: number };
  'participant:joined': { participant: Participant };
  'participant:left': { participant: Participant };
  'stream:added': { participant: Participant; stream: MediaStream };
  'stream:removed': { participant: Participant };
  'track:added': { participant: Participant; track: MediaStreamTrack };
  'track:removed': { participant: Participant; track: MediaStreamTrack };
  'media:audio-changed': { enabled: boolean };
  'media:video-changed': { enabled: boolean };
  'media:screen-share-changed': { enabled: boolean };
  'error': { error: Error };
  'state:changed': { state: CallState };
}

export interface RecordingOptions {
  format?: 'webm' | 'mp4';
  includeAudio?: boolean;
  includeVideo?: boolean;
  layout?: 'grid' | 'speaker' | 'custom';
}

export interface ScreenShareOptions {
  audio?: boolean;
  video?: boolean | MediaStreamConstraints['video'];
}

export type EventCallback<K extends keyof SDKEvents> = (event: SDKEvents[K]) => void;
