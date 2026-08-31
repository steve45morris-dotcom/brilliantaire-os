// config/sentinel_safety.ts
// Primary safety gates configuration for Sentinel OS

export const PUBLIC_TUNNEL_DEFAULT_ENABLED = false;
export const PUBLIC_TUNNEL_REQUIRES_CONFIRMATION = true;
export const VOICE_CAN_START_TUNNEL = false;
export const VOICE_CAN_STOP_TUNNEL = true;
export const VOICE_LOW_RISK_AUTO_EXECUTE = true;
export const VOICE_MEDIUM_RISK_REQUIRES_CONFIRMATION = true;
export const VOICE_HIGH_RISK_REQUIRES_CONFIRMATION = true;
export const ALLOW_KNOWLEDGE_INGESTION_EXECUTION = false;
export const ALLOW_NOTEBOOKLM_EXECUTION = false;
export const ALLOW_OBSIDIAN_DIRECT_WRITE = false;
export const ALLOW_HIGGSFIELD_API_EXECUTION = false;
export const ALLOW_AUTONOMOUS_RENDER = false;
export const ALLOW_LOCAL_INFERENCE_EXECUTION = false;
export const ALLOW_AUTONOMOUS_INFERENCE = false;
export const REQUIRE_STAGING_FOR_KNOWLEDGE = true;

export const RISK_LEVELS = {
  L0: {
    name: "L0",
    description: "status, read-only, help",
    requiresConfirmation: false,
  },
  L1: {
    name: "L1",
    description: "local report generation",
    requiresConfirmation: false,
  },
  L2: {
    name: "L2",
    description: "local file staging",
    requiresConfirmation: true,
  },
  L3: {
    name: "L3",
    description: "tunnel, write, confirm, external handoff",
    requiresConfirmation: true,
  },
  L4: {
    name: "L4",
    description: "destructive, credential, public exposure",
    requiresConfirmation: true,
  },
} as const;

export type RiskLevel = keyof typeof RISK_LEVELS;
