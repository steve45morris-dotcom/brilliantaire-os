/**
 * IcyOS API client for P.J.K. and other local tools.
 *
 * Uses personal access tokens (icy_…) created through IcyOS Settings.
 * Zero runtime dependencies beyond Node.js built-ins.
 *
 * Usage:
 *   import { IcyOS } from './icyos-client';
 *   const api = new IcyOS({ baseUrl: 'http://localhost:3000', token: process.env.ICYOS_TOKEN! });
 *   const workspace = await api.workspace();
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IcyOSConfig {
  baseUrl: string;
  token: string;
}

export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiError {
  error: { code: string; message: string; detail: unknown };
}

export interface WorkspaceOverview {
  workspace: { id: string; name: string };
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  priority: 'P1' | 'P2' | 'P3';
  missions: Mission[];
}

export interface Mission {
  id: string;
  name: string;
  status: string;
  steps: Step[];
}

export interface Step {
  id: string;
  text: string;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class IcyOS {
  private base: string;
  private token: string;

  constructor(config: IcyOSConfig) {
    this.base = config.baseUrl.replace(/\/+$/, '');
    this.token = config.token;
  }

  // -- Workspace ------------------------------------------------------------

  async workspace(): Promise<WorkspaceOverview> {
    return this.get('/api/workspace');
  }

  // -- Projects -------------------------------------------------------------

  async createProject(name: string, priority: 'P1' | 'P2' | 'P3' = 'P2'): Promise<Project> {
    return this.post('/api/projects', { name, priority });
  }

  async updateProject(id: string, changes: { name?: string; priority?: 'P1' | 'P2' | 'P3' }): Promise<Project> {
    return this.patch(`/api/projects/${id}`, changes);
  }

  async deleteProject(id: string): Promise<void> {
    await this.del(`/api/projects/${id}`);
  }

  // -- Missions -------------------------------------------------------------

  async createMission(projectId: string, name: string, steps: string[] = []): Promise<Mission> {
    return this.post(`/api/projects/${projectId}/missions`, { name, steps });
  }

  async renameMission(id: string, name: string): Promise<Mission> {
    return this.patch(`/api/missions/${id}`, { name });
  }

  // -- Steps ----------------------------------------------------------------

  async addStep(missionId: string, text: string): Promise<Step> {
    return this.post(`/api/missions/${missionId}/steps`, { text });
  }

  async completeStep(actionId: string, completed = true): Promise<unknown> {
    return this.post('/api/actions/complete', { actionId, completed });
  }

  // -- HTTP plumbing --------------------------------------------------------

  private headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.base}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let detail: string;
      try {
        const err = (await res.json()) as ApiError;
        detail = err.error?.message ?? res.statusText;
      } catch {
        detail = res.statusText;
      }
      throw new Error(`IcyOS ${method} ${path}: ${res.status} ${detail}`);
    }

    if (res.status === 204) return undefined as T;

    const envelope = (await res.json()) as ApiEnvelope<T>;
    return envelope.data;
  }

  private get<T>(path: string): Promise<T> {
    return this.request('GET', path);
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request('POST', path, body);
  }

  private patch<T>(path: string, body: unknown): Promise<T> {
    return this.request('PATCH', path, body);
  }

  private del(path: string): Promise<void> {
    return this.request('DELETE', path);
  }
}

// ---------------------------------------------------------------------------
// CLI smoke test: `npx tsx tools/icyos-client.ts`
// ---------------------------------------------------------------------------

if (process.argv[1] && /icyos-client\.[tj]s$/.test(process.argv[1])) {
  const token = process.env.ICYOS_TOKEN;
  const base = process.env.ICYOS_URL ?? 'http://localhost:3000';

  if (!token) {
    console.error('Set ICYOS_TOKEN to an icy_… personal access token.');
    process.exit(1);
  }

  const api = new IcyOS({ baseUrl: base, token });
  api.workspace().then(
    (ws) => { console.log(JSON.stringify(ws, null, 2)); },
    (err) => { console.error(String(err)); process.exit(1); },
  );
}
