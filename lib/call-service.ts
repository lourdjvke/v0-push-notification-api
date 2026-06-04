import {
  database,
  ref,
  set,
  get,
  remove,
  update,
} from '@/lib/firebase';
import { generateCallToken } from '@/lib/call-tokens';
import { CallState, ParticipantStatusSchema } from '@/lib/call-schemas';

/**
 * Call Service
 * Business logic for managing WebRTC calls
 */

interface CallMetadata {
  callId: string;
  roomId: string;
  type: 'video' | 'audio';
  status: 'active' | 'ended' | 'error';
  maxParticipants: number;
  metadata?: Record<string, any>;
  createdAt: string;
  endedAt?: string;
  creatorEmail?: string;
}

interface Participant {
  participantId: string;
  userId?: string;
  userName?: string;
  status: 'joined' | 'active' | 'left' | 'disconnected';
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled?: boolean;
  joinedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Generate a unique call ID
 */
export function generateCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique participant ID
 */
export function generateParticipantId(): string {
  return `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new call session
 */
export async function createCall(
  roomId: string,
  options?: {
    type?: 'video' | 'audio';
    maxParticipants?: number;
    metadata?: Record<string, any>;
    creatorEmail?: string;
  }
): Promise<{
  callId: string;
  participantId: string;
  token: string;
  expiresIn: number;
  iceServers?: Array<{ urls: string | string[]; username?: string; credential?: string }>;
}> {
  const callId = generateCallId();
  const participantId = generateParticipantId();
  const type = options?.type || 'video';
  const maxParticipants = options?.maxParticipants || 10;
  const now = new Date().toISOString();

  // Create call metadata
  const callMetadata: any = {
    callId,
    roomId,
    type,
    status: 'active',
    maxParticipants,
    createdAt: now,
  };

  // Only add optional fields if they are defined
  if (options?.metadata) {
    callMetadata.metadata = options.metadata;
  }
  if (options?.creatorEmail) {
    callMetadata.creatorEmail = options.creatorEmail;
  }

  // Store call metadata in Firebase
  const callRef = ref(database, `calls/${callId}`);
  await set(callRef, callMetadata);

  // Create initial participant (creator)
  const participantData: Participant = {
    participantId,
    status: 'joined',
    audioEnabled: true,
    videoEnabled: type === 'video',
    screenShareEnabled: false,
    joinedAt: now,
  };

  const participantRef = ref(database, `calls/${callId}/participants/${participantId}`);
  await set(participantRef, participantData);

  // Generate call token
  const token = generateCallToken(callId, participantId, {
    userId: options?.creatorEmail, // Use email as userId for now
  });

  // Default ICE servers (can be extended with TURN servers)
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  return {
    callId,
    participantId,
    token,
    expiresIn: 15 * 60, // 15 minutes in seconds
    iceServers,
  };
}

/**
 * Get call state
 */
export async function getCallState(callId: string): Promise<CallState | null> {
  try {
    const callRef = ref(database, `calls/${callId}`);
    const snapshot = await get(callRef);

    if (!snapshot.exists()) {
      return null;
    }

    const callData = snapshot.val();
    const participantsData = callData.participants || {};

    // Calculate duration
    const createdAt = new Date(callData.createdAt);
    const duration = Math.floor((Date.now() - createdAt.getTime()) / 1000);

    // Transform participants
    const participants = Object.values(participantsData) as Participant[];

    return {
      callId: callData.callId,
      roomId: callData.roomId,
      type: callData.type,
      status: callData.status,
      maxParticipants: callData.maxParticipants,
      participantCount: participants.length,
      participants,
      duration,
      metadata: callData.metadata,
      createdAt: callData.createdAt,
      endedAt: callData.endedAt,
    };
  } catch (error) {
    console.error('[v0] Error getting call state:', error);
    return null;
  }
}

/**
 * End a call
 */
export async function endCall(
  callId: string,
  options?: {
    reason?: string;
    metadata?: Record<string, any>;
  }
): Promise<boolean> {
  try {
    const callRef = ref(database, `calls/${callId}`);
    const snapshot = await get(callRef);

    if (!snapshot.exists()) {
      return false;
    }

    const now = new Date().toISOString();
    const createdAt = new Date(snapshot.val().createdAt);
    const duration = Math.floor((new Date(now).getTime() - createdAt.getTime()) / 1000);

    // Update call status
    await update(callRef, {
      status: 'ended',
      endedAt: now,
      duration,
      endReason: options?.reason,
      endMetadata: options?.metadata,
    });

    return true;
  } catch (error) {
    console.error('[v0] Error ending call:', error);
    return false;
  }
}

/**
 * Add a participant to an active call
 */
export async function addParticipant(
  callId: string,
  userId?: string,
  userName?: string,
  metadata?: Record<string, any>
): Promise<{
  participantId: string;
  token: string;
  expiresIn: number;
} | null> {
  try {
    // Check if call exists and is active
    const callRef = ref(database, `calls/${callId}`);
    const callSnapshot = await get(callRef);

    if (!callSnapshot.exists()) {
      console.error(`[v0] Call not found: ${callId}`);
      return null;
    }

    const callData = callSnapshot.val();
    if (callData.status !== 'active') {
      console.error(`[v0] Call is not active: ${callId}`);
      return null;
    }

    // Check participant limit
    const participantsRef = ref(database, `calls/${callId}/participants`);
    const participantsSnapshot = await get(participantsRef);
    const participantCount = participantsSnapshot.exists() ? Object.keys(participantsSnapshot.val()).length : 0;

    if (participantCount >= callData.maxParticipants) {
      console.error(`[v0] Call is at maximum participants: ${callId}`);
      return null;
    }

    // Create new participant
    const participantId = generateParticipantId();
    const now = new Date().toISOString();

    const participantData: any = {
      participantId,
      status: 'joined',
      audioEnabled: true,
      videoEnabled: callData.type === 'video',
      screenShareEnabled: false,
      joinedAt: now,
    };

    // Only add optional fields if defined
    if (userId) {
      participantData.userId = userId;
    }
    if (userName) {
      participantData.userName = userName;
    }
    if (metadata) {
      participantData.metadata = metadata;
    }

    const newParticipantRef = ref(database, `calls/${callId}/participants/${participantId}`);
    await set(newParticipantRef, participantData);

    // Generate token for new participant
    const token = generateCallToken(callId, participantId, {
      userId,
      userName,
    });

    return {
      participantId,
      token,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  } catch (error) {
    console.error('[v0] Error adding participant:', error);
    return null;
  }
}

/**
 * Update participant media settings
 */
export async function updateParticipant(
  callId: string,
  participantId: string,
  updates: {
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    screenShareEnabled?: boolean;
  }
): Promise<boolean> {
  try {
    const participantRef = ref(database, `calls/${callId}/participants/${participantId}`);
    const snapshot = await get(participantRef);

    if (!snapshot.exists()) {
      return false;
    }

    await update(participantRef, updates);
    return true;
  } catch (error) {
    console.error('[v0] Error updating participant:', error);
    return false;
  }
}

/**
 * Remove a participant from a call
 */
export async function removeParticipant(callId: string, participantId: string): Promise<boolean> {
  try {
    const participantRef = ref(database, `calls/${callId}/participants/${participantId}`);
    const snapshot = await get(participantRef);

    if (!snapshot.exists()) {
      return false;
    }

    // Mark as left instead of deleting for history
    await update(participantRef, {
      status: 'left',
      leftAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('[v0] Error removing participant:', error);
    return false;
  }
}

/**
 * Generate a new token for an existing participant
 */
export async function generateNewParticipantToken(
  callId: string,
  participantId: string
): Promise<{
  token: string;
  expiresIn: number;
} | null> {
  try {
    const participantRef = ref(database, `calls/${callId}/participants/${participantId}`);
    const snapshot = await get(participantRef);

    if (!snapshot.exists()) {
      return null;
    }

    const participantData = snapshot.val();
    const token = generateCallToken(callId, participantId, {
      userId: participantData.userId,
      userName: participantData.userName,
    });

    return {
      token,
      expiresIn: 15 * 60,
    };
  } catch (error) {
    console.error('[v0] Error generating new token:', error);
    return null;
  }
}

/**
 * List all active calls for a user (by email)
 */
export async function listUserCalls(email: string): Promise<CallMetadata[]> {
  try {
    const callsRef = ref(database, 'calls');
    const snapshot = await get(callsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const allCalls = snapshot.val();
    const userCalls: CallMetadata[] = [];

    for (const callId in allCalls) {
      const callData = allCalls[callId];
      if (callData.creatorEmail === email) {
        userCalls.push(callData);
      }
    }

    // Sort by creation date (newest first)
    return userCalls.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('[v0] Error listing user calls:', error);
    return [];
  }
}
