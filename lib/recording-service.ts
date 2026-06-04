import {
  database,
  ref,
  set,
  get,
  update,
} from '@/lib/firebase';

/**
 * Recording Service
 * Business logic for managing call recordings
 */

interface RecordingMetadata {
  recordingId: string;
  callId: string;
  format: 'webm' | 'mp4';
  status: 'recording' | 'stopped' | 'processing' | 'ready' | 'failed';
  includeAudio: boolean;
  includeVideo: boolean;
  layout: 'grid' | 'speaker' | 'custom';
  startedAt: string;
  endedAt?: string;
  duration?: number; // seconds
  fileSize?: number; // bytes
  downloadUrl?: string;
  storageBackend?: string; // e.g., 'firebase-storage', 's3', 'custom'
  storageLocation?: string; // URL or path to stored recording
  metadata?: Record<string, any>;
}

/**
 * Generate a unique recording ID
 */
export function generateRecordingId(): string {
  return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Start a recording for a call
 */
export async function startRecording(
  callId: string,
  options?: {
    format?: 'webm' | 'mp4';
    includeAudio?: boolean;
    includeVideo?: boolean;
    layout?: 'grid' | 'speaker' | 'custom';
    metadata?: Record<string, any>;
  }
): Promise<{
  recordingId: string;
  status: string;
} | null> {
  try {
    // Check if call exists
    const callRef = ref(database, `calls/${callId}`);
    const callSnapshot = await get(callRef);

    if (!callSnapshot.exists()) {
      console.error(`[v0] Call not found: ${callId}`);
      return null;
    }

    const recordingId = generateRecordingId();
    const now = new Date().toISOString();

    const recordingMetadata: RecordingMetadata = {
      recordingId,
      callId,
      format: options?.format || 'webm',
      status: 'recording',
      includeAudio: options?.includeAudio ?? true,
      includeVideo: options?.includeVideo ?? true,
      layout: options?.layout || 'grid',
      startedAt: now,
      metadata: options?.metadata,
    };

    // Store recording metadata in Firebase
    const recordingRef = ref(database, `calls/${callId}/recordings/${recordingId}`);
    await set(recordingRef, recordingMetadata);

    // Also create an index for quick access
    const recordingIndexRef = ref(database, `recordings/${recordingId}`);
    await set(recordingIndexRef, {
      recordingId,
      callId,
      startedAt: now,
      status: 'recording',
    });

    return {
      recordingId,
      status: 'recording',
    };
  } catch (error) {
    console.error('[v0] Error starting recording:', error);
    return null;
  }
}

/**
 * Stop a recording
 */
export async function stopRecording(
  callId: string,
  recordingId: string,
  options?: {
    fileSize?: number;
    duration?: number;
    metadata?: Record<string, any>;
  }
): Promise<{
  recordingId: string;
  status: string;
  duration?: number;
  fileSize?: number;
} | null> {
  try {
    const recordingRef = ref(database, `calls/${callId}/recordings/${recordingId}`);
    const snapshot = await get(recordingRef);

    if (!snapshot.exists()) {
      console.error(`[v0] Recording not found: ${recordingId}`);
      return null;
    }

    const recordingData = snapshot.val();
    const startedAt = new Date(recordingData.startedAt);
    const now = new Date();
    const duration = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    // Update recording status
    await update(recordingRef, {
      status: 'stopped',
      endedAt: now.toISOString(),
      duration,
      fileSize: options?.fileSize,
      metadata: options?.metadata,
    });

    // Also update the index
    const recordingIndexRef = ref(database, `recordings/${recordingId}`);
    await update(recordingIndexRef, {
      status: 'stopped',
      endedAt: now.toISOString(),
      duration,
    });

    return {
      recordingId,
      status: 'stopped',
      duration,
      fileSize: options?.fileSize,
    };
  } catch (error) {
    console.error('[v0] Error stopping recording:', error);
    return null;
  }
}

/**
 * Get recording metadata
 */
export async function getRecordingMetadata(
  callId: string,
  recordingId: string
): Promise<RecordingMetadata | null> {
  try {
    const recordingRef = ref(database, `calls/${callId}/recordings/${recordingId}`);
    const snapshot = await get(recordingRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val();
  } catch (error) {
    console.error('[v0] Error getting recording metadata:', error);
    return null;
  }
}

/**
 * Get all recordings for a call
 */
export async function getCallRecordings(callId: string): Promise<RecordingMetadata[]> {
  try {
    const recordingsRef = ref(database, `calls/${callId}/recordings`);
    const snapshot = await get(recordingsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const recordings = snapshot.val();
    return Object.values(recordings) as RecordingMetadata[];
  } catch (error) {
    console.error('[v0] Error getting call recordings:', error);
    return [];
  }
}

/**
 * Update recording status (for async processing)
 */
export async function updateRecordingStatus(
  callId: string,
  recordingId: string,
  status: 'recording' | 'stopped' | 'processing' | 'ready' | 'failed',
  options?: {
    downloadUrl?: string;
    storageLocation?: string;
    storageBackend?: string;
    error?: string;
    metadata?: Record<string, any>;
  }
): Promise<boolean> {
  try {
    const recordingRef = ref(database, `calls/${callId}/recordings/${recordingId}`);
    const updates: any = { status };

    if (options?.downloadUrl) {
      updates.downloadUrl = options.downloadUrl;
    }
    if (options?.storageLocation) {
      updates.storageLocation = options.storageLocation;
    }
    if (options?.storageBackend) {
      updates.storageBackend = options.storageBackend;
    }
    if (options?.error) {
      updates.error = options.error;
    }
    if (options?.metadata) {
      updates.metadata = options.metadata;
    }

    await update(recordingRef, updates);

    // Also update the index
    const recordingIndexRef = ref(database, `recordings/${recordingId}`);
    await update(recordingIndexRef, { status });

    return true;
  } catch (error) {
    console.error('[v0] Error updating recording status:', error);
    return false;
  }
}

/**
 * Delete a recording (for cleanup)
 */
export async function deleteRecording(callId: string, recordingId: string): Promise<boolean> {
  try {
    const recordingRef = ref(database, `calls/${callId}/recordings/${recordingId}`);
    await update(recordingRef, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('[v0] Error deleting recording:', error);
    return false;
  }
}
