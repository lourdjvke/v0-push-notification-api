'use client';

/**
 * WebRTC Manager
 * Handles peer connections, ICE candidates, and media negotiation
 */

import type { Participant } from './types';

export interface PeerConnectionConfig {
  iceServers?: RTCIceServer[];
  iceTransportPolicy?: 'all' | 'relay';
  bundlePolicy?: 'balanced' | 'max-compat' | 'max-bundle';
}

export class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private iceServers: RTCIceServer[];
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private pendingCandidates: Map<string, RTCIceCandidate[]> = new Map();
  private onStreamCallback?: (participantId: string, stream: MediaStream) => void;
  private onRemoveStreamCallback?: (participantId: string) => void;
  private onIceCandidateCallback?: (participantId: string, candidate: RTCIceCandidate) => void;

  constructor(config?: PeerConnectionConfig) {
    this.iceServers = config?.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
  }

  /**
   * Create a peer connection for a participant
   */
  async createPeerConnection(
    participantId: string,
    config?: {
      onStream?: (stream: MediaStream) => void;
      onRemoveStream?: () => void;
      onIceCandidate?: (candidate: RTCIceCandidate) => void;
    }
  ): Promise<RTCPeerConnection> {
    if (this.peerConnections.has(participantId)) {
      return this.peerConnections.get(participantId)!;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        if (config?.onIceCandidate) {
          config.onIceCandidate(event.candidate);
        }
        if (this.onIceCandidateCallback) {
          this.onIceCandidateCallback(participantId, event.candidate);
        }
      }
    };

    // Handle remote streams
    peerConnection.ontrack = (event: RTCTrackEvent) => {
      console.log(`[v0] Remote track received from ${participantId}:`, event.track.kind);
      
      // Combine all tracks into a single stream
      const stream = event.streams[0] || new MediaStream();
      if (stream && config?.onStream) {
        config.onStream(stream);
      }
      if (stream && this.onStreamCallback) {
        this.onStreamCallback(participantId, stream);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`[v0] Connection state for ${participantId}: ${peerConnection.connectionState}`);
      
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        if (config?.onRemoveStream) {
          config.onRemoveStream();
        }
        if (this.onRemoveStreamCallback) {
          this.onRemoveStreamCallback(participantId);
        }
      }
    };

    // Handle ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`[v0] ICE connection state for ${participantId}: ${peerConnection.iceConnectionState}`);
    };

    this.peerConnections.set(participantId, peerConnection);
    this.pendingCandidates.set(participantId, []);

    return peerConnection;
  }

  /**
   * Add local tracks to a peer connection
   */
  async addLocalTracks(
    participantId: string,
    stream: MediaStream
  ): Promise<RTCSender[]> {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error(`Peer connection not found for participant ${participantId}`);
    }

    const senders: RTCSender[] = [];
    for (const track of stream.getTracks()) {
      const sender = await peerConnection.addTrack(track, stream);
      senders.push(sender);
    }

    return senders;
  }

  /**
   * Create an offer
   */
  async createOffer(participantId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error(`Peer connection not found for participant ${participantId}`);
    }

    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Create an answer
   */
  async createAnswer(participantId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error(`Peer connection not found for participant ${participantId}`);
    }

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(
    participantId: string,
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error(`Peer connection not found for participant ${participantId}`);
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(description));

    // Process any pending ICE candidates
    const pendingCandidates = this.pendingCandidates.get(participantId) || [];
    for (const candidate of pendingCandidates) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.warn('[v0] Failed to add ICE candidate:', error);
      }
    }
    this.pendingCandidates.set(participantId, []);
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(
    participantId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) {
      console.warn(`Peer connection not found for participant ${participantId}`);
      return;
    }

    try {
      if (peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Store candidate for later addition
        const pendingCandidates = this.pendingCandidates.get(participantId) || [];
        pendingCandidates.push(new RTCIceCandidate(candidate));
        this.pendingCandidates.set(participantId, pendingCandidates);
      }
    } catch (error) {
      console.error('[v0] Error adding ICE candidate:', error);
    }
  }

  /**
   * Get connection stats
   */
  async getStats(participantId: string): Promise<RTCStatsReport | null> {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) {
      return null;
    }

    return await peerConnection.getStats();
  }

  /**
   * Close a peer connection
   */
  closePeerConnection(participantId: string): void {
    const peerConnection = this.peerConnections.get(participantId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(participantId);
      this.pendingCandidates.delete(participantId);
      
      const dataChannel = this.dataChannels.get(participantId);
      if (dataChannel) {
        dataChannel.close();
        this.dataChannels.delete(participantId);
      }
    }
  }

  /**
   * Close all peer connections
   */
  closeAll(): void {
    for (const participantId of this.peerConnections.keys()) {
      this.closePeerConnection(participantId);
    }
  }

  /**
   * Get all peer connections
   */
  getPeerConnections(): Map<string, RTCPeerConnection> {
    return this.peerConnections;
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onStream?: (participantId: string, stream: MediaStream) => void;
    onRemoveStream?: (participantId: string) => void;
    onIceCandidate?: (participantId: string, candidate: RTCIceCandidate) => void;
  }): void {
    this.onStreamCallback = callbacks.onStream;
    this.onRemoveStreamCallback = callbacks.onRemoveStream;
    this.onIceCandidateCallback = callbacks.onIceCandidate;
  }
}
