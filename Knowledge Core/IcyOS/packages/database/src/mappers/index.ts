import { User, Workspace, Project, Mission } from '@icyos/shared';
export class DatabaseMappers {
  static toUser(row: any): User {
    return {
      id: row.id,
      name: row.name,
      timezone: row.timezone,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
  static toWorkspace(row: any): Workspace {
    return {
      id: row.id,
      user_id: row.user_id,
      root_path: row.root_path,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
  static toProject(row: any): Project {
    return {
      id: row.id,
      workspace_id: row.workspace_id,
      name: row.name,
      priority: row.priority,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
  static toMission(row: any): Mission {
    return {
      id: row.id,
      sprint_id: row.sprint_id,
      name: row.name,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
