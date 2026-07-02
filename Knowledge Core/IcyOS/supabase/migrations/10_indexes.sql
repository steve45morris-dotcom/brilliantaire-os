-- Migration: 10_indexes.sql
-- Purpose: Initialize foreign keys indexes and trgm text indexes.
-- Dependencies: 09_knowledge_governance.sql
-- Safety Notes: Safe to run, improves execution performance.

-- Foreign Keys B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_missions_sprint_id ON missions(sprint_id);
CREATE INDEX IF NOT EXISTS idx_actions_mission_id ON actions(mission_id);
CREATE INDEX IF NOT EXISTS idx_timeline_blocks_timeline_id ON timeline_blocks(timeline_id);
CREATE INDEX IF NOT EXISTS idx_sessions_workspace_id ON sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_trust_profiles_user_id ON trust_profiles(user_id);

-- GIN Trigram Search Indexes
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON projects USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_missions_name_trgm ON missions USING gin(name gin_trgm_ops);
