-- Migration: 12_rls_policies.sql
-- Purpose: Enable and configure Row Level Security (RLS) policies.
-- Dependencies: 11_triggers_functions.sql
-- Safety Notes: Enforces database security gates.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY user_self_select ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY workspace_select ON workspaces FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY project_select ON projects FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = projects.workspace_id AND workspaces.user_id = auth.uid()
    ));
