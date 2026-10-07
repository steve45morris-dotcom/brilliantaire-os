import fs from 'node:fs';
import path from 'node:path';
import { globalSharedMemoryManager } from '../../agent-upgrade/memory.js';
import { globalAgentExecutionTelemetry } from '../live/AgentExecutionTelemetry.js';
import { globalLiveOperationsStore } from '../live/LiveOperationsStore.js';

export type CanonicalState =
  | 'VERIFIED_COMPLETE'
  | 'IMPLEMENTED_UNVERIFIED'
  | 'STAGED'
  | 'PLAN_ONLY'
  | 'BLOCKED_CAPABILITY'
  | 'PARTIAL_PROPAGATION'
  | 'FAILED';

export interface GuardRequest {
  objective: string;
  target: string;
  requiredCapabilities: string[];
  availableCapabilities: string[];
  executionSurface: string;
  evidenceProvided?: {
    filesWritten?: string[];
    testsPassed?: boolean;
    registered?: boolean;
    globalReadbackVerified?: boolean;
    propagationVerifiedCount?: number;
    propagationTargetCount?: number;
    composition?: {
      plannedRequiredCapabilities: string[];
      executedSteps: string[];
      skippedSteps: string[];
      failedSteps: string[];
      blockedSteps: string[];
      handoffs: Array<{ handoffId: string; sourceStep: string; targetStep: string }>;
      validatedOutputSteps: string[];
      unresolvedRequiredCapabilities: string[];
    };
  };
}

export interface Handoff {
  target: string;
  mutation: string;
  constraints: string[];
  inspectFiles: string[];
  testsToRun: string[];
  requiredEvidence: string[];
  finalStatus: CanonicalState;
}

export interface GuardResult {
  status: CanonicalState;
  capabilityGap: boolean;
  blockedCapability?: string;
  notification?: string;
  handoff?: Handoff;
  evidenceVerified: boolean;
  propagationGaps?: string[];
}

export class CapabilityCompletionGuard {
  constructor() {}

  /**
   * Evaluates if the current execution context is capable of completing the task,
   * checks for capability gaps, validates global propagation, and generates handoffs.
   */
  public evaluate(request: GuardRequest): GuardResult {
    const isGlobal = this.detectGlobalIntent(request.objective);
    
    // 1. Check for Capability Gap
    const missingCapabilities = request.requiredCapabilities.filter(
      (cap) => !request.availableCapabilities.includes(cap)
    );

    if (missingCapabilities.length > 0) {
      const blockedCap = missingCapabilities[0];
      const limitation = `missing execution capability: '${blockedCap}' on surface '${request.executionSurface}'`;
      const handoffAction = `Execute this patch via Codex CLI or terminal console with full local writes.`;
      
      const notification = `RED FLAG: I can prepare or stage this change, but I cannot currently verify that the authoritative system has been updated because ${limitation}. I will not mark it complete. Required next action: ${handoffAction}.`;

      // Generate Handoff
      const handoff: Handoff = {
        target: request.target,
        mutation: `Authoritative update of ${request.target} with required capability '${blockedCap}'`,
        constraints: ['Verify filesystem permissions', 'Run test suites post-execution'],
        inspectFiles: request.evidenceProvided?.filesWritten || [],
        testsToRun: ['npm run typecheck', 'npm run test'],
        requiredEvidence: [`Authoritative execution proof of '${blockedCap}'`],
        finalStatus: 'VERIFIED_COMPLETE'
      };

      // Record to learning loop / shared memory
      this.recordFailure(request, blockedCap, notification);

      return {
        status: 'BLOCKED_CAPABILITY',
        capabilityGap: true,
        blockedCapability: blockedCap,
        notification,
        handoff,
        evidenceVerified: false
      };
    }

    // 2. Evaluate completion status based on evidence provided
    const evidence = request.evidenceProvided;
    if (!evidence) {
      return {
        status: 'PLAN_ONLY',
        capabilityGap: false,
        evidenceVerified: false
      };
    }

    // Check memory readback first before global consumer propagation
    if (request.objective.toLowerCase().includes('remember') && !evidence.globalReadbackVerified) {
      const notification = `RED FLAG: I can prepare or stage this change, but I cannot currently verify that the authoritative system has been updated because global memory readback verification failed. I will not mark it complete. Required next action: Validate database reload or manual config query.`;
      return {
        status: 'BLOCKED_CAPABILITY',
        capabilityGap: true,
        blockedCapability: 'verify',
        notification,
        evidenceVerified: false
      };
    }

    // 3. Check global propagation if global intent is parsed and multiple consumers exist
    if (isGlobal && evidence.propagationTargetCount !== undefined && evidence.propagationTargetCount > 1) {
      const targetCount = evidence.propagationTargetCount;
      const verifiedCount = evidence.propagationVerifiedCount ?? 0;
      
      if (verifiedCount < targetCount) {
        const gapCount = targetCount - verifiedCount;
        const gaps = [`Propagation failed: only ${verifiedCount} out of ${targetCount} consumers verified`];
        
        return {
          status: 'PARTIAL_PROPAGATION',
          capabilityGap: false,
          evidenceVerified: false,
          propagationGaps: gaps,
          notification: `RED FLAG: Partial propagation detected. Only ${verifiedCount}/${targetCount} consumers loaded the source. Required next action: manual sync.`
        };
      }
    }

    const hasFiles = (evidence.filesWritten && evidence.filesWritten.length > 0);
    const testsRun = evidence.testsPassed === true;
    const registered = evidence.registered === true;

    // Check if files written to non-canonical directory (staged check)
    const hasNonCanonicalWrites = evidence.filesWritten?.some(file => {
      // canonical directory check: must be under src/ or skills/
      const normalized = path.normalize(file);
      return !normalized.startsWith('src/') && !normalized.startsWith('skills/') && !normalized.includes('/src/') && !normalized.includes('/skills/');
    });

    if (hasNonCanonicalWrites && hasFiles) {
      return {
        status: 'STAGED',
        capabilityGap: false,
        evidenceVerified: false
      };
    }

    if (hasFiles && !testsRun) {
      return {
        status: 'IMPLEMENTED_UNVERIFIED',
        capabilityGap: false,
        evidenceVerified: false
      };
    }

    if (hasFiles && testsRun && !registered) {
      // File exists but registry/discovery does not load it
      return {
        status: 'IMPLEMENTED_UNVERIFIED',
        capabilityGap: false,
        evidenceVerified: false
      };
    }

    if (hasFiles && testsRun && registered) {
      return {
        status: 'VERIFIED_COMPLETE',
        capabilityGap: false,
        evidenceVerified: true
      };
    }

    return {
      status: 'PLAN_ONLY',
      capabilityGap: false,
      evidenceVerified: false
    };
  }

  public evaluateAndRecord(
    request: GuardRequest,
    execution: { agentId: string; agentName?: string; missionId?: string; taskId?: string; taskName?: string }
  ): GuardResult {
    globalLiveOperationsStore.addEvent(globalAgentExecutionTelemetry.record('capability.verification.started', {
      ...execution,
      completionGuardStatus: 'VERIFYING'
    }));
    const result = this.evaluate(request);
    globalLiveOperationsStore.addEvent(globalAgentExecutionTelemetry.record('capability.verification.completed', {
      ...execution,
      completionGuardStatus: result.status,
      verified: result.evidenceVerified,
      blockedReason: result.notification
    }));
    return result;
  }

  /**
   * Helper to detect if intent claims global, system-wide, or permanent updates.
   */
  private detectGlobalIntent(objective: string): boolean {
    const globalConcepts = [
      'globally',
      'system-wide',
      'every agent',
      'every workflow',
      'from now on',
      'permanently',
      'activate',
      'install',
      'upgrade',
      'remember globally',
      'update the system',
      'make this canonical'
    ];
    const lowerObj = objective.toLowerCase();
    return globalConcepts.some((concept) => lowerObj.includes(concept));
  }

  /**
   * Records failure to the telemetry learning loop.
   */
  private recordFailure(request: GuardRequest, blockedCap: string, notification: string): void {
    try {
      globalSharedMemoryManager.addBlockedItem(
        `Capability awareness block: ${blockedCap} required for ${request.target}`
      );
      globalSharedMemoryManager.addLessonLearned(
        `Capability gap detected: '${blockedCap}' is unavailable on execution surface '${request.executionSurface}' when modifying '${request.target}'.`
      );
    } catch (e) {
      // Fail-safe in case memory manager has issues
    }
  }
}
