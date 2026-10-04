import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_DIRECT_VAULT_WRITE,
  ALLOW_AUTO_SYNC,
  ALLOW_VAULT_DELETION,
  ALLOW_VAULT_MODIFICATION,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_VAULT_PRESENCE,
  outputFolders,
  upstreamSources,
  moduleExportSources,
  vaultRoutingRules,
  VAULT_CANDIDATE_PATHS,
  SAFE_WRITE_FOLDER,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/obsidian-sync-layer.js';

export interface ObsidianSyncLayerBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    directVaultWrite: boolean;
    autoSync: boolean;
    vaultDeletion: boolean;
    vaultModification: boolean;
    directObsidianWrite: boolean;
    humanApproval: boolean;
    vaultPresence: boolean;
  };
  outputCounts: {
    syncManifests: number;
    routePreviews: number;
    syncReports: number;
    vaultHealth: number;
    logs: number;
  };
  upstreamSourceStatus: Record<string, { exists: boolean; fileCount: number }>;
  vaultDetected: string | null;
  moduleExportSourceCount: number;
  vaultRoutingRuleCount: number;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

function detectVaultPath(): string | null {
  for (const candidate of VAULT_CANDIDATE_PATHS) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function getObsidianSyncLayerBridgeStatus(): ObsidianSyncLayerBridgeStatus {
  const sourceStatus: Record<string, { exists: boolean; fileCount: number }> = {};
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const exists = fs.existsSync(sourcePath);
    let fileCount = 0;
    if (exists) {
      const stat = fs.statSync(sourcePath);
      if (stat.isFile()) {
        fileCount = 1;
      } else {
        fileCount = fs.readdirSync(sourcePath).filter(f => !f.startsWith('.')).length;
      }
    }
    sourceStatus[source] = { exists, fileCount };
  }

  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    safetyFlags: {
      directVaultWrite: ALLOW_DIRECT_VAULT_WRITE,
      autoSync: ALLOW_AUTO_SYNC,
      vaultDeletion: ALLOW_VAULT_DELETION,
      vaultModification: ALLOW_VAULT_MODIFICATION,
      directObsidianWrite: ALLOW_DIRECT_OBSIDIAN_WRITE,
      humanApproval: REQUIRE_HUMAN_APPROVAL,
      vaultPresence: REQUIRE_VAULT_PRESENCE
    },
    outputCounts: {
      syncManifests: countFiles(outputFolders.syncManifests),
      routePreviews: countFiles(outputFolders.routePreviews),
      syncReports: countFiles(outputFolders.syncReports),
      vaultHealth: countFiles(outputFolders.vaultHealth),
      logs: countFiles(outputFolders.logs)
    },
    upstreamSourceStatus: sourceStatus,
    vaultDetected: detectVaultPath(),
    moduleExportSourceCount: moduleExportSources.length,
    vaultRoutingRuleCount: vaultRoutingRules.length
  };
}

export function generateBridgeReport(): string {
  const status = getObsidianSyncLayerBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  let sourceTable = '';
  for (const [source, info] of Object.entries(status.upstreamSourceStatus)) {
    sourceTable += `| ${source} | ${info.exists} | ${info.fileCount} |\n`;
  }

  return `# Obsidian Sync Layer Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Direct Vault Write | ${status.safetyFlags.directVaultWrite} |
| Auto Sync | ${status.safetyFlags.autoSync} |
| Vault Deletion | ${status.safetyFlags.vaultDeletion} |
| Vault Modification | ${status.safetyFlags.vaultModification} |
| Direct Obsidian Write | ${status.safetyFlags.directObsidianWrite} |
| Human Approval | ${status.safetyFlags.humanApproval} |
| Vault Presence | ${status.safetyFlags.vaultPresence} |

## Output Inventory

| Output Type | Count |
|---|---|
| Sync Manifests | ${status.outputCounts.syncManifests} |
| Route Previews | ${status.outputCounts.routePreviews} |
| Sync Reports | ${status.outputCounts.syncReports} |
| Vault Health | ${status.outputCounts.vaultHealth} |
| Logs | ${status.outputCounts.logs} |

## Vault Detection

- **Vault Path:** ${status.vaultDetected || 'not detected'}
- **Module Export Sources:** ${status.moduleExportSourceCount}
- **Vault Routing Rules:** ${status.vaultRoutingRuleCount}

## Upstream Source Status

| Source | Exists | File Count |
|---|---|---|
${sourceTable}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'obsidian_sync_layer_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
