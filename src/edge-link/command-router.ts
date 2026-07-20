import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Helper to read JSON safely
function readJSON(filePath: string): any {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export class CommandRouter {
  async route(cmd: any): Promise<any> {
    const { target, payload = {} } = cmd;

    // --- OPTION 2: Structured API Endpoints ---

    // 1. Get Governance Health Score
    if (target === 'get_health') {
      const data = readJSON(
        path.join(process.cwd(), 'dashboard/public/dashboard-data.json')
      );
      const score = data?.governance?.score ?? 0;
      const issues = data?.governance?.issuesCount ?? 0;
      return {
        status: 'success',
        data: { score, issues, verdict: score >= 70 ? 'HEALTHY' : 'DEGRADED' },
      };
    }

    // 2. List active agents (from AGENTS.md or hardcoded)
    if (target === 'list_agents') {
      // You can parse AGENTS.md, but for speed we hardcode the known council
      return {
        status: 'success',
        data: {
          agents: ['ASTRA (Planner)', 'SID (Builder)', 'GEMINI (Guardian)'],
          active: true,
        },
      };
    }

    // 3. List active projects (from PROJECTS.md)
    if (target === 'list_projects') {
      try {
        const content = fs.readFileSync('PROJECTS.md', 'utf-8');
        const lines = content.split('\n').filter(l => l.startsWith('- '));
        return {
          status: 'success',
          data: { projects: lines.map(l => l.replace('- ', '').trim()) },
        };
      } catch {
        return { status: 'error', error: 'Could not read PROJECTS.md' };
      }
    }

    // 4. Campaign status (mock – replace with your actual logic)
    if (target === 'get_campaign_status') {
      // Example: read a specific file or query your DB
      return {
        status: 'success',
        data: {
          active: ['Icyflamze Release', 'Tree Groove Marketing'],
          pending: 2,
          last_run: new Date().toISOString(),
        },
      };
    }

    // 5. List music tracks (mock – point to your actual catalog)
    if (target === 'list_tracks') {
      // Example: read a directory or JSON manifest
      return {
        status: 'success',
        data: {
          tracks: ['icyflamze_04.mp3', 'tree_groove_mix.wav', 'ambient_demo.flac'],
          total: 3,
        },
      };
    }

    // 6. Trigger knowledge harvest (wraps a task but returns structured result)
    if (target === 'start_harvest') {
      try {
        const { stdout, stderr } = await execAsync('task knowledge:harvest');
        return {
          status: 'success',
          data: { output: stdout.trim(), errors: stderr.trim() || 'none' },
        };
      } catch (e: any) {
        return { status: 'error', error: e.message };
      }
    }

    // --- OPTION 1: Generic Taskfile runner (catch‑all) ---
    if (target.startsWith('task:')) {
      const script = target.replace('task:', '');
      try {
        const { stdout, stderr } = await execAsync(`task ${script}`);
        return {
          status: 'success',
          data: { stdout: stdout.trim(), stderr: stderr.trim() || 'none' },
        };
      } catch (e: any) {
        return { status: 'error', error: e.message };
      }
    }

    // Built-in: Echo test
    if (target === 'ping') {
      return { status: 'success', data: { pong: true } };
    }

    // Unknown target
    return {
      status: 'error',
      error: `Unknown target: ${target}. Available: ping, get_health, list_agents, list_projects, get_campaign_status, list_tracks, start_harvest, task:*`,
    };
  }
}
