export type DriftCode =
  | 'DOCUMENTED_ROUTE_MISSING'
  | 'LIVE_ROUTE_UNDOCUMENTED'
  | 'DOCUMENTED_COMMAND_MISSING'
  | 'LIVE_COMMAND_UNDOCUMENTED'
  | 'OUTDATED_FILE_PATH'
  | 'STALE_STATUS'
  | 'BROKEN_INTERNAL_LINK'
  | 'RENAMED_COMPONENT'
  | 'MISMATCHED_TEST_COUNT'
  | 'OBSOLETE_PREVIEW_INSTRUCTION';

export interface DriftItem {
  code: DriftCode;
  severity: 'high' | 'medium' | 'low';
  subject: string;
  document: string;
  message: string;
  expected?: string;
  actual?: string;
}

export interface DriftReport {
  generatedAt: string;
  items: DriftItem[];
  summary: { total: number; high: number; medium: number; low: number };
  coverage: {
    documentsScanned: number;
    routeFilesScanned: number;
    packageCommandsScanned: number;
    checksRun: string[];
  };
}

export interface DocumentationSourceMapConfig {
  root: string;
  documentationFiles: string[];
  routeFiles: string[];
  packageFile: string;
  expectedStatuses?: Record<string, Record<string, string>>;
  expectedTestCount?: number;
  renamedSymbols?: Record<string, string>;
}
