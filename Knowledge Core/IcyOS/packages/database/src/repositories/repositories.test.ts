import { describe, it, expect } from 'vitest';
import { ProjectRepository, WorkspaceRepository } from './index';

describe('Repository Layer Mappings', () => {
  it('should create and map project parameters', async () => {
    const projectRepo = new ProjectRepository();
    const project = await projectRepo.createProject('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Core OS Upgrade');

    expect(project).toBeDefined();
    expect(project.name).toBe('Core OS Upgrade');
    expect(project.priority).toBe('P1');
  });

  it('should fetch and map workspaces', async () => {
    const workspaceRepo = new WorkspaceRepository();
    const ws = await workspaceRepo.getById('f47ac10b-58cc-4372-a567-0e02b2c3d479');

    expect(ws).not.toBeNull();
    expect(ws?.root_path).toBe('/users/alex');
  });
});
