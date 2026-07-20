import { describe, it, expect, vi } from 'vitest';
import { CommandRouter } from './command-router.js';
import fs from 'fs';

vi.mock('child_process', () => {
  const { promisify } = require('util');
  const exec = (cmd: string, options: any, callback: any) => {
    if (typeof options === 'function') {
      callback = options;
    }
    if (cmd.includes('knowledge:harvest')) {
      callback(null, 'knowledge harvested successfully', '');
    } else if (cmd.includes('task some-task')) {
      callback(null, 'task run successfully', '');
    } else {
      callback(new Error('command failed'), '', 'some error');
    }
  };

  // Add standard Node promisify.custom symbol for child_process.exec
  (exec as any)[promisify.custom] = (cmd: string) => {
    if (cmd.includes('knowledge:harvest')) {
      return Promise.resolve({ stdout: 'knowledge harvested successfully', stderr: '' });
    } else if (cmd.includes('task some-task')) {
      return Promise.resolve({ stdout: 'task run successfully', stderr: '' });
    } else {
      return Promise.reject(new Error('command failed'));
    }
  };

  return { exec };
});

describe('CommandRouter Tests', () => {
  const router = new CommandRouter();

  it('should respond to ping target', async () => {
    const res = await router.route({ target: 'ping' });
    expect(res).toEqual({ status: 'success', data: { pong: true } });
  });

  it('should get governance health score', async () => {
    const res = await router.route({ target: 'get_health' });
    expect(res.status).toBe('success');
    expect(res.data).toHaveProperty('score');
    expect(res.data).toHaveProperty('issues');
    expect(res.data).toHaveProperty('verdict');
  });

  it('should list active agents', async () => {
    const res = await router.route({ target: 'list_agents' });
    expect(res.status).toBe('success');
    expect(res.data.agents).toContain('ASTRA (Planner)');
    expect(res.data.agents).toContain('SID (Builder)');
    expect(res.data.agents).toContain('GEMINI (Guardian)');
    expect(res.data.active).toBe(true);
  });

  it('should list active projects from PROJECTS.md', async () => {
    const spy = vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('- Project 1\n- Project 2');
    const res = await router.route({ target: 'list_projects' });
    expect(res.status).toBe('success');
    expect(res.data.projects).toEqual(['Project 1', 'Project 2']);
    spy.mockRestore();
  });

  it('should handle error if read PROJECTS.md fails', async () => {
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
      throw new Error('Read failed');
    });
    const res = await router.route({ target: 'list_projects' });
    expect(res.status).toBe('error');
    expect(res.error).toBe('Could not read PROJECTS.md');
    spy.mockRestore();
  });

  it('should return campaign status', async () => {
    const res = await router.route({ target: 'get_campaign_status' });
    expect(res.status).toBe('success');
    expect(res.data.active).toContain('Icyflamze Release');
    expect(res.data.active).toContain('Tree Groove Marketing');
  });

  it('should list tracks', async () => {
    const res = await router.route({ target: 'list_tracks' });
    expect(res.status).toBe('success');
    expect(res.data.tracks).toContain('icyflamze_04.mp3');
  });

  it('should trigger start_harvest', async () => {
    const res = await router.route({ target: 'start_harvest' });
    expect(res.status).toBe('success');
    expect(res.data.output).toBe('knowledge harvested successfully');
  });

  it('should execute custom task via task:* target', async () => {
    const res = await router.route({ target: 'task:some-task' });
    expect(res.status).toBe('success');
    expect(res.data.stdout).toBe('task run successfully');
  });

  it('should return error for unknown target', async () => {
    const res = await router.route({ target: 'unknown_target' });
    expect(res.status).toBe('error');
    expect(res.error).toContain('Unknown target: unknown_target');
  });
});
