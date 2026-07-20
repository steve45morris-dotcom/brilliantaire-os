import { ExecutionPlan } from './Planner.js';
import { globalEventBus } from '../kernel/events/EventBus.js';

export interface ApprovalRequest {
  id: string;
  plan: ExecutionPlan;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export class ApprovalEngine {
  private pendingRequests: Map<string, ApprovalRequest> = new Map();

  public getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  public requestApproval(plan: ExecutionPlan): ApprovalRequest {
    const id = `apr-${Date.now()}`;
    const request: ApprovalRequest = {
      id,
      plan,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    
    this.pendingRequests.set(id, request);
    globalEventBus.publish('ApprovalRequested', { id, intentType: plan.intentType });
    return request;
  }

  public approve(id: string): void {
    const req = this.pendingRequests.get(id);
    if (!req) throw new Error(`Approval request ${id} not found.`);
    
    req.status = 'approved';
    this.pendingRequests.delete(id);
    globalEventBus.publish('ApprovalGranted', { id, intentType: req.plan.intentType });
  }

  public reject(id: string): void {
    const req = this.pendingRequests.get(id);
    if (!req) throw new Error(`Approval request ${id} not found.`);
    
    req.status = 'rejected';
    this.pendingRequests.delete(id);
    globalEventBus.publish('ApprovalRejected', { id, intentType: req.plan.intentType });
  }
}

export const globalApprovalEngine = new ApprovalEngine();
