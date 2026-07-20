import { describe, it, expect } from 'vitest';
import { globalIntegrationRegistry } from './integrations/core/IntegrationRegistry.js';
import { globalIntegrationLifecycle } from './integrations/core/IntegrationLifecycle.js';
import { globalIntegrationSecurity } from './integrations/core/IntegrationSecurity.js';
import { redactSecret } from './integrations/core/IntegrationConfig.js';
import { globalGitHubIntegrationContract } from './integrations/github/GitHubIntegrationContract.js';

// Core UIF modules imports for testing
import { globalIntegrationBridge } from './integrations/core/IntegrationBridge.js';
import { globalIntegrationHealthChecker } from './integrations/core/IntegrationHealth.js';
import { globalIntegrationPermissions } from './integrations/core/IntegrationPermissions.js';
import { globalIntegrationScheduler } from './integrations/core/IntegrationScheduler.js';
import { globalIntegrationMetrics } from './integrations/core/IntegrationMetrics.js';
import { globalIntegrationLogger } from './integrations/core/IntegrationLogger.js';
import { globalIntegrationFactory } from './integrations/core/IntegrationFactory.js';
import { globalIntegrationState } from './integrations/core/IntegrationState.js';

describe('Universal Integration Framework Tests', () => {
  it('should register integrations on registry mapping', () => {
    globalIntegrationRegistry.clear();
    globalIntegrationRegistry.register(globalGitHubIntegrationContract);

    const match = globalIntegrationRegistry.get('github');
    expect(match?.name).toBe('GitHub Read-Only Intelligence');
  });

  it('should mask secrets successfully', () => {
    expect(redactSecret('ghp_mytesttoken12345')).toBe('ghp_...2345');
    expect(redactSecret('')).toBe('MISSING');
  });

  it('should block write permissions by default', () => {
    const integration = globalGitHubIntegrationContract;
    const canWrite = globalIntegrationSecurity.verifyPermissions(integration, 'repo:write');
    expect(canWrite).toBe(false);

    const canRead = globalIntegrationSecurity.verifyPermissions(integration, 'repo:read');
    expect(canRead).toBe(true);
  });

  it('should handle lifecycle status transitions', async () => {
    globalIntegrationRegistry.clear();
    globalIntegrationRegistry.register(globalGitHubIntegrationContract);

    await globalIntegrationLifecycle.suspend('github');
    expect(globalGitHubIntegrationContract.status).toBe('suspended');

    await globalIntegrationLifecycle.activate('github');
    expect(globalGitHubIntegrationContract.status).toBe('active');
  });

  // NEW Core Module Tests
  it('should bridge calls to registered integrations', async () => {
    globalIntegrationRegistry.clear();
    globalIntegrationRegistry.register(globalGitHubIntegrationContract);

    const response = await globalIntegrationBridge.route('github', 'repositories');
    expect(response.source).toBe('mock');
    expect(response.data[0].name).toBe('brilliantaire-os');
  });

  it('should check health for all integrations', () => {
    globalIntegrationRegistry.clear();
    globalIntegrationRegistry.register(globalGitHubIntegrationContract);

    const healthList = globalIntegrationHealthChecker.checkAll();
    expect(healthList.length).toBe(1);
    expect(healthList[0].id).toBe('github');
    expect(healthList[0].health.status).toBe('healthy');
  });

  it('should enforce permissions dynamically and audit check', () => {
    const integration = globalGitHubIntegrationContract;
    
    // Read operations allowed
    const canRead = globalIntegrationPermissions.checkPermission(integration, 'repo:read');
    expect(canRead).toBe(true);

    // Write operations require approval / blocked by default
    const canWrite = globalIntegrationPermissions.checkPermission(integration, 'repo:write');
    expect(canWrite).toBe(false);
    expect(globalIntegrationPermissions.requiresApproval('repo:write')).toBe(true);
  });

  it('should manage periodic sync schedules', () => {
    globalIntegrationScheduler.schedule('github', 60000);
    const schedules = globalIntegrationScheduler.listSchedules();
    expect(schedules.length).toBe(1);
    expect(schedules[0].integrationId).toBe('github');
    expect(schedules[0].intervalMs).toBe(60000);

    const nextRun = globalIntegrationScheduler.getNextRun('github');
    expect(nextRun).not.toBeNull();

    globalIntegrationScheduler.unschedule('github');
    expect(globalIntegrationScheduler.listSchedules().length).toBe(0);
  });

  it('should record metrics for operations', () => {
    globalIntegrationMetrics.record('github', 'listRepositories', 45, true);
    const history = globalIntegrationMetrics.getMetrics('github');
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].operation).toBe('listRepositories');

    const summary = globalIntegrationMetrics.getSummary('github');
    expect(summary.totalOps).toBe(1);
    expect(summary.successRate).toBe(100);
    expect(summary.avgLatencyMs).toBe(45);
  });

  it('should log structured integration-scoped logs', () => {
    globalIntegrationLogger.info('github', 'Repository list fetched');
    const logs = globalIntegrationLogger.getLogs('github');
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].message).toBe('Repository list fetched');
    expect(logs[0].level).toBe('info');
  });

  it('should factory-create registered plugin instances', () => {
    globalIntegrationFactory.registerPlugin({
      id: 'mock-plugin',
      name: 'Mock Plugin',
      factory: () => globalGitHubIntegrationContract
    });

    expect(globalIntegrationFactory.hasPlugin('mock-plugin')).toBe(true);
    const created = globalIntegrationFactory.create('mock-plugin');
    expect(created?.id).toBe('github');
  });

  it('should manage runtime state per integration', () => {
    globalIntegrationState.setState('github', { isHealthy: true, syncCount: 5 });
    const state = globalIntegrationState.getState('github');
    expect(state.syncCount).toBe(5);
    expect(state.isHealthy).toBe(true);

    globalIntegrationState.incrementSync('github');
    expect(globalIntegrationState.getState('github').syncCount).toBe(6);
  });
});

