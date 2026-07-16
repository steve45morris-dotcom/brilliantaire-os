export type ComponentSourceStatus = 'trusted' | 'approved' | 'experimental' | 'rejected' | 'deprecated';

export interface ComponentSourceRecord {
  id: string;
  name: string;
  status: ComponentSourceStatus;
  source: string;
  license: string;
  versionOrCommit: string;
  filesAdded: string[];
  filesModified: string[];
  dependencies: string[];
  accessibilityStatus: string;
  customizationNotes: string;
  projectUsage: string[];
}

export const COMPONENT_SOURCES: ComponentSourceRecord[] = [
  { id: 'one-system', name: 'Existing One System components', status: 'trusted', source: 'local:dashboard/src/components', license: 'Project-owned', versionOrCommit: 'current branch', filesAdded: [], filesModified: [], dependencies: [], accessibilityStatus: 'Project verification required per component', customizationNotes: 'Prefer existing behavior and accessibility foundations.', projectUsage: ['the-one-system', 'icyflamze'] },
  { id: 'shadcn-ui', name: 'shadcn/ui', status: 'approved', source: 'https://github.com/shadcn-ui/ui', license: 'MIT', versionOrCommit: 'pin per import', filesAdded: [], filesModified: [], dependencies: [], accessibilityStatus: 'Verify copied primitive and local modifications', customizationNotes: 'Import one component at a time; never import the full library.', projectUsage: [] },
  { id: 'launch-ui', name: 'Launch UI', status: 'experimental', source: 'https://github.com/launch-ui/launch-ui', license: 'MIT', versionOrCommit: 'unselected', filesAdded: [], filesModified: [], dependencies: [], accessibilityStatus: 'Pilot review required', customizationNotes: 'Reference compositions only until compatibility is pinned.', projectUsage: [] },
  { id: 'workspace-specific', name: 'Workspace-specific components', status: 'approved', source: 'local workspace implementations', license: 'Project-owned', versionOrCommit: 'current branch', filesAdded: [], filesModified: [], dependencies: [], accessibilityStatus: 'Guardian review required', customizationNotes: 'Brand layer may vary; interaction and accessibility foundations remain stable.', projectUsage: ['profbetgeng', 'joy-beauty-studio'] },
  { id: 'magic-mcp', name: 'Magic MCP generated components', status: 'experimental', source: 'https://github.com/21st-dev/magic-mcp', license: 'MIT', versionOrCommit: 'not installed', filesAdded: [], filesModified: [], dependencies: [], accessibilityStatus: 'Unverified', customizationNotes: 'Do not install or execute automatically; security and output review required.', projectUsage: [] },
];
