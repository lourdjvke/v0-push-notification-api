import { z } from 'zod';

// Call type: video or audio
export const CallTypeSchema = z.enum(['video', 'audio']).default('video');

// Call status
export const CallStatusSchema = z.enum(['active', 'ended', 'error']).default('active');

// Participant status
export const ParticipantStatusSchema = z.enum(['joined', 'active', 'left', 'disconnected']).default('joined');

/**
 * Create Call Request Schema
 */
export const CreateCallRequestSchema = z.object({
  roomId: z.string().min(1, 'roomId is required'),
  type: CallTypeSchema.optional(),
  maxParticipants: z.number().int().min(2).max(100).optional().default(10),
  metadata: z.record(z.any()).optional(),
});

export type CreateCallRequest = z.infer<typeof CreateCallRequestSchema>;

/**
 * Create Call Response Schema
 */
export const CreateCallResponseSchema = z.object({
  callId: z.string(),
  token: z.string(),
  participantId: z.string(),
  expiresIn: z.number(), // seconds
  iceServers: z.array(z.object({
    urls: z.union([z.string(), z.array(z.string())]),
    username: z.string().optional(),
    credential: z.string().optional(),
  })).optional(),
  createdAt: z.string().datetime(),
});

export type CreateCallResponse = z.infer<typeof CreateCallResponseSchema>;

/**
 * Call State Schema
 */
export const CallStateSchema = z.object({
  callId: z.string(),
  roomId: z.string(),
  type: CallTypeSchema,
  status: CallStatusSchema,
  maxParticipants: z.number(),
  participantCount: z.number(),
  participants: z.array(z.object({
    participantId: z.string(),
    userId: z.string().optional(),
    userName: z.string().optional(),
    status: ParticipantStatusSchema,
    audioEnabled: z.boolean(),
    videoEnabled: z.boolean(),
    screenShareEnabled: z.boolean().optional(),
    joinedAt: z.string().datetime(),
    metadata: z.record(z.any()).optional(),
  })).optional(),
  duration: z.number().optional(), // seconds
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
});

export type CallState = z.infer<typeof CallStateSchema>;

/**
 * Add Participant Request Schema
 */
export const AddParticipantRequestSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  userName: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type AddParticipantRequest = z.infer<typeof AddParticipantRequestSchema>;

/**
 * Add Participant Response Schema
 */
export const AddParticipantResponseSchema = z.object({
  participantId: z.string(),
  joinToken: z.string(),
  expiresIn: z.number(),
});

export type AddParticipantResponse = z.infer<typeof AddParticipantResponseSchema>;

/**
 * Update Participant Request Schema (PATCH)
 */
export const UpdateParticipantRequestSchema = z.object({
  audioEnabled: z.boolean().optional(),
  videoEnabled: z.boolean().optional(),
  screenShareEnabled: z.boolean().optional(),
});

export type UpdateParticipantRequest = z.infer<typeof UpdateParticipantRequestSchema>;

/**
 * Generate Token Request Schema
 */
export const GenerateTokenRequestSchema = z.object({
  participantId: z.string().min(1, 'participantId is required'),
});

export type GenerateTokenRequest = z.infer<typeof GenerateTokenRequestSchema>;

/**
 * Generate Token Response Schema
 */
export const GenerateTokenResponseSchema = z.object({
  token: z.string(),
  participantId: z.string(),
  expiresIn: z.number(),
});

export type GenerateTokenResponse = z.infer<typeof GenerateTokenResponseSchema>;

/**
 * End Call Request Schema
 */
export const EndCallRequestSchema = z.object({
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type EndCallRequest = z.infer<typeof EndCallRequestSchema>;

/**
 * Recording Start Request Schema
 */
export const StartRecordingRequestSchema = z.object({
  format: z.enum(['webm', 'mp4']).default('webm'),
  includeAudio: z.boolean().default(true),
  includeVideo: z.boolean().default(true),
  layout: z.enum(['grid', 'speaker', 'custom']).default('grid'),
});

export type StartRecordingRequest = z.infer<typeof StartRecordingRequestSchema>;

/**
 * Recording Response Schema
 */
export const RecordingResponseSchema = z.object({
  recordingId: z.string(),
  status: z.enum(['recording', 'stopped', 'processing', 'ready', 'failed']),
  format: z.string().optional(),
  duration: z.number().optional(),
  fileSize: z.number().optional(),
  downloadUrl: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
});

export type RecordingResponse = z.infer<typeof RecordingResponseSchema>;

/**
 * Error Response Schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.enum([
    'INVALID_REQUEST',
    'UNAUTHORIZED',
    'NOT_FOUND',
    'CALL_ENDED',
    'MEDIA_NOT_PERMITTED',
    'ICE_FAILED',
    'STORAGE_QUOTA_EXCEEDED',
    'TRANSCRIPTION_UNAVAILABLE',
    'INVALID_TOKEN',
    'PARTICIPANT_NOT_FOUND',
    'INTERNAL_ERROR',
  ]).optional(),
  details: z.record(z.any()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Webhook Registration Schema
 */
export const WebhookRegistrationSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.enum([
    'participant.joined',
    'participant.left',
    'call.ended',
    'recording.started',
    'recording.stopped',
    'transcription.segment',
    'quality.degraded',
  ])).min(1, 'At least one event is required'),
  retryPolicy: z.object({
    maxRetries: z.number().int().min(0).max(10).default(3),
    retryDelay: z.number().int().min(1000).default(1000), // milliseconds
  }).optional(),
});

export type WebhookRegistration = z.infer<typeof WebhookRegistrationSchema>;

/**
 * Quality Stats Schema
 */
export const QualityStatsSchema = z.object({
  participantId: z.string(),
  latencyMs: z.number(),
  packetLoss: z.number(), // percentage 0-100
  resolution: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
  bitrate: z.number(), // kbps
  fps: z.number().optional(),
  audioLevel: z.number().optional(), // 0-1
  timestamp: z.string().datetime(),
});

export type QualityStats = z.infer<typeof QualityStatsSchema>;
