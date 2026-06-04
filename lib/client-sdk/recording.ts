'use client';

/**
 * Client-Side Recording SDK
 * Manages local recording to IndexedDB with chunking and upload support
 * 
 * Usage:
 * const recorder = new CallRecorder('call_123', 'participant_456');
 * await recorder.startRecording(mediaStream);
 * // ... recording in progress ...
 * const blob = await recorder.stopRecording();
 * await recorder.uploadRecording({ endpoint: 'https://api.example.com/upload' });
 */

interface RecordingConfig {
  callId: string;
  participantId: string;
  mimeType?: string; // e.g., 'video/webm;codecs=vp8,opus'
  chunkSize?: number; // in milliseconds, default 5000
}

interface UploadEndpoint {
  endpoint: string; // URL to upload to
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  onProgress?: (progress: number) => void; // 0-100
}

interface StoredChunk {
  id: string;
  callId: string;
  participantId: string;
  sequence: number;
  blob: Blob;
  timestamp: number;
  size: number;
}

/**
 * IndexedDB Database Manager
 */
class RecordingDB {
  private dbName = 'CallRecorderDB';
  private storeName = 'recordingChunks';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('callId', 'callId', { unique: false });
          store.createIndex('participantId', 'participantId', { unique: false });
          store.createIndex('sequence', 'sequence', { unique: false });
        }
      };
    });
  }

  async saveChunk(chunk: StoredChunk): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(chunk);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getChunks(callId: string, participantId: string): Promise<StoredChunk[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('callId');
      const request = index.getAll(callId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const chunks = request.result as StoredChunk[];
        const filtered = chunks
          .filter(c => c.participantId === participantId)
          .sort((a, b) => a.sequence - b.sequence);
        resolve(filtered);
      };
    });
  }

  async deleteChunks(callId: string, participantId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('callId');
      const request = index.openCursor(callId);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const chunk = cursor.value as StoredChunk;
          if (chunk.participantId === participantId) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  async clearAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * Call Recorder - Main Recording Class
 */
export class CallRecorder {
  private config: RecordingConfig;
  private mediaRecorder: MediaRecorder | null = null;
  private db: RecordingDB;
  private chunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private chunkSequence: number = 0;
  private isRecording: boolean = false;

  constructor(callId: string, participantId: string, config?: Partial<RecordingConfig>) {
    this.config = {
      callId,
      participantId,
      mimeType: config?.mimeType || 'video/webm;codecs=vp8,opus',
      chunkSize: config?.chunkSize || 5000,
    };
    this.db = new RecordingDB();
  }

  /**
   * Initialize the recorder (must call before startRecording)
   */
  async init(): Promise<void> {
    await this.db.init();
  }

  /**
   * Start recording from a MediaStream
   */
  async startRecording(stream: MediaStream): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    // Check if mime type is supported
    if (!MediaRecorder.isTypeSupported(this.config.mimeType!)) {
      console.warn(
        `[v0] Mime type ${this.config.mimeType} not supported, using default`
      );
      this.config.mimeType = 'video/webm';
    }

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: this.config.mimeType,
    });

    this.chunks = [];
    this.recordingStartTime = Date.now();
    this.chunkSequence = 0;
    this.isRecording = true;

    // Handle data available
    this.mediaRecorder.ondataavailable = async (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);

        // Save chunk to IndexedDB
        const chunk: StoredChunk = {
          id: `${this.config.callId}_${this.config.participantId}_${this.chunkSequence}`,
          callId: this.config.callId,
          participantId: this.config.participantId,
          sequence: this.chunkSequence,
          blob: event.data,
          timestamp: Date.now(),
          size: event.data.size,
        };

        try {
          await this.db.saveChunk(chunk);
          console.log(`[v0] Saved recording chunk ${this.chunkSequence}`);
        } catch (error) {
          console.error('[v0] Failed to save chunk to IndexedDB:', error);
        }

        this.chunkSequence++;
      }
    };

    // Start requesting data at the specified interval
    this.mediaRecorder.start(this.config.chunkSize);
    console.log('[v0] Recording started');
  }

  /**
   * Stop recording and return the combined blob
   */
  async stopRecording(): Promise<Blob> {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('Recording is not in progress');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = () => {
        this.isRecording = false;
        const mimeType = this.config.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        console.log(`[v0] Recording stopped. Total size: ${blob.size} bytes`);
        resolve(blob);
      };

      this.mediaRecorder!.onerror = (event: Event) => {
        this.isRecording = false;
        reject(new Error(`Recording error: ${(event as any).error?.message}`));
      };

      this.mediaRecorder!.stop();
    });
  }

  /**
   * Upload recording to a custom endpoint
   */
  async uploadRecording(endpoint: UploadEndpoint): Promise<void> {
    try {
      const chunks = await this.db.getChunks(
        this.config.callId,
        this.config.participantId
      );

      if (chunks.length === 0) {
        throw new Error('No recording chunks found');
      }

      const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
      let uploadedSize = 0;

      for (const chunk of chunks) {
        const formData = new FormData();
        formData.append('file', chunk.blob, `chunk_${chunk.sequence}`);
        formData.append('callId', this.config.callId);
        formData.append('participantId', this.config.participantId);
        formData.append('sequence', chunk.sequence.toString());
        formData.append('totalChunks', chunks.length.toString());

        const response = await fetch(endpoint.endpoint, {
          method: endpoint.method || 'POST',
          headers: endpoint.headers,
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        uploadedSize += chunk.size;
        const progress = Math.round((uploadedSize / totalSize) * 100);

        if (endpoint.onProgress) {
          endpoint.onProgress(progress);
        }

        console.log(`[v0] Uploaded chunk ${chunk.sequence} (${progress}%)`);
      }

      // After successful upload, delete chunks from IndexedDB
      await this.db.deleteChunks(this.config.callId, this.config.participantId);
      console.log('[v0] Recording uploaded and cleaned up');
    } catch (error) {
      console.error('[v0] Upload failed:', error);
      throw error;
    }
  }

  /**
   * Download the complete recording as a file
   */
  async downloadRecording(filename?: string): Promise<void> {
    const chunks = await this.db.getChunks(
      this.config.callId,
      this.config.participantId
    );

    if (chunks.length === 0) {
      throw new Error('No recording chunks found');
    }

    const mimeType = this.config.mimeType || 'video/webm';
    const blobs = chunks.map(c => c.blob);
    const blob = new Blob(blobs, { type: mimeType });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `recording_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all recorded chunks from IndexedDB
   */
  async clearRecording(): Promise<void> {
    await this.db.deleteChunks(this.config.callId, this.config.participantId);
    this.chunks = [];
    console.log('[v0] Recording cleared');
  }

  /**
   * Get recording statistics
   */
  async getRecordingStats(): Promise<{
    duration: number;
    size: number;
    chunkCount: number;
  }> {
    const chunks = await this.db.getChunks(
      this.config.callId,
      this.config.participantId
    );

    const duration = Date.now() - this.recordingStartTime;
    const size = chunks.reduce((sum, c) => sum + c.size, 0);

    return {
      duration: Math.floor(duration / 1000), // in seconds
      size,
      chunkCount: chunks.length,
    };
  }
}
