import { z } from 'zod';

const ProcessInstruction = z.object({
  type: z.literal('process'),
  executable: z.string(),
  args: z.array(z.string()),
  cwd: z.literal('repo').default('repo'),
  expected: z.object({ exit_code: z.number().int() }).optional(),
  timeout_ms: z.number().int().positive().max(120000).default(30000),
});

const FileExistsInstruction = z.object({ type: z.literal('file_exists'), path: z.string() });
const FileAbsentInstruction = z.object({ type: z.literal('file_absent'), path: z.string() });
const FileHashInstruction = z.object({
  type: z.literal('file_hash'),
  path: z.string(),
  algorithm: z.literal('sha256').default('sha256'),
  expected_hash: z.string().optional(),
});
const FileContainsInstruction = z.object({
  type: z.literal('file_contains'),
  path: z.string(),
  pattern: z.string(),
  is_regex: z.boolean().default(false),
});
const GitDiffInstruction = z.object({ type: z.literal('git_diff'), args: z.array(z.string()).default([]) });
const GitStatusInstruction = z.object({ type: z.literal('git_status') });
const TestInstruction = z.object({ type: z.literal('test'), target: z.string().optional() });
const TypecheckInstruction = z.object({ type: z.literal('typecheck') });
const BuildInstruction = z.object({ type: z.literal('build') });

export const VerificationInstruction = z.discriminatedUnion('type', [
  ProcessInstruction,
  FileExistsInstruction,
  FileAbsentInstruction,
  FileHashInstruction,
  FileContainsInstruction,
  GitDiffInstruction,
  GitStatusInstruction,
  TestInstruction,
  TypecheckInstruction,
  BuildInstruction,
]);
export type VerificationInstruction = z.infer<typeof VerificationInstruction>;

export const Claim = z.object({
  claim_id: z.string().regex(/^C\d{3,}$/),
  claim: z.string().min(1),
  evidence: z.array(z.string()),
  depends_on: z.array(z.string().regex(/^C\d{3,}$/)).default([]),
  justification: z.string().min(1).optional(),
  verification: z.array(VerificationInstruction).min(1),
});
export type Claim = z.infer<typeof Claim>;

export const ClaimsFile = z.object({ claims: z.array(Claim) });
export type ClaimsFile = z.infer<typeof ClaimsFile>;
