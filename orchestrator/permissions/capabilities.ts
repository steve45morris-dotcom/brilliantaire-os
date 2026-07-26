export const ALL_CAPABILITIES = [
  'fs:read',
  'fs:write',
  'process:diagnostic',
  'process:build',
  'git:read',
  'git:stage',
  'git:commit',
  'git:push',
  'git:pr',
  'network:egress',
] as const;

export type Capability = (typeof ALL_CAPABILITIES)[number];

export const CAPABILITIES_REQUIRING_APPROVAL: readonly Capability[] = [
  'git:commit',
  'git:push',
  'git:pr',
];
