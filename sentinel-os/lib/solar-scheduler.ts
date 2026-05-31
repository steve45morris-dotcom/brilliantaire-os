import { runExecute, runQuery } from "./db";

export interface ComputeNode {
  region: string;
  solarCapacityKw: number;
  currentSolarOutputKw: number;
  loadPercent: number;
  solarRatio: number; // currentSolarOutputKw / solarCapacityKw
}

export const REGIONAL_NODES: ComputeNode[] = [
  { region: "US-EAST", solarCapacityKw: 500, currentSolarOutputKw: 380, loadPercent: 42, solarRatio: 0.76 },
  { region: "EU-CENTRAL", solarCapacityKw: 800, currentSolarOutputKw: 680, loadPercent: 55, solarRatio: 0.85 },
  { region: "AP-SOUTHEAST", solarCapacityKw: 400, currentSolarOutputKw: 110, loadPercent: 28, solarRatio: 0.275 }
];

export async function getOptimalInferenceNode(): Promise<{ selectedNode: ComputeNode; nodes: ComputeNode[] }> {
  // Select highest solarRatio
  let selectedNode = REGIONAL_NODES[0];
  let maxRatio = -1;

  for (const node of REGIONAL_NODES) {
    if (node.solarRatio > maxRatio) {
      maxRatio = node.solarRatio;
      selectedNode = node;
    }
  }

  // Log allocation choice to system logs table
  try {
    const timestamp = new Date().toISOString();
    await runExecute(`
      INSERT INTO system_logs (level, msg, created_at, service)
      VALUES ('INFO', 'Routed inference model task to solar-aligned cluster: ${selectedNode.region} (Renewable ratio: ${(selectedNode.solarRatio * 100).toFixed(1)}%)', '${timestamp}', 'SOLAR-SCHEDULER');
    `);
  } catch (err) {
    console.error("Failed to write solar scheduler log into SQLite:", err);
  }

  return { selectedNode, nodes: REGIONAL_NODES };
}
