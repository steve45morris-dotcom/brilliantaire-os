import { describe, it, expect } from 'vitest';
import { redactSecrets, containsSecret, REDACTED } from './redact';

/**
 * Every credential below is synthetic — assembled from repeated filler
 * characters so that no value resembling a real key exists in this repo.
 * The scrubber is never tested against a live secret.
 */
const fake = {
  gcp: 'AIzaSy' + 'A'.repeat(33),
  aws: 'AKIA' + 'B'.repeat(16),
  anthropic: 'sk-ant-' + 'C'.repeat(24),
  openai: 'sk-proj-' + 'D'.repeat(24),
  stripe: 'sk_live_' + 'E'.repeat(24),
  github: 'ghp_' + 'F'.repeat(36),
  githubPat: 'github_pat_' + 'G'.repeat(24),
  gitlab: 'glpat-' + 'H'.repeat(20),
  slack: 'xoxb-' + '1'.repeat(12),
  hf: 'hf_' + 'I'.repeat(30),
  perplexity: 'pplx-' + 'J'.repeat(30),
  digitalocean: 'dop_v1_' + 'a'.repeat(64),
  shopify: 'shpat_' + 'b'.repeat(32),
  // A real JWT header segment is base64 of a small JSON object — ~30+ chars.
  jwt: 'eyJ' + 'h'.repeat(30) + '.' + 'K'.repeat(24) + '.' + 'L'.repeat(24)
};

describe('redactSecrets — known credential shapes', () => {
  const cases: [string, string, string][] = [
    ['gcp-api-key', fake.gcp, `curl "https://api.example.com?key=${fake.gcp}"`],
    ['aws-access-key-id', fake.aws, `aws configure set aws_access_key_id ${fake.aws}`],
    ['anthropic-key', fake.anthropic, `export ANTHROPIC_API_KEY=${fake.anthropic}`],
    ['openai-key', fake.openai, `openai --key ${fake.openai}`],
    ['stripe-key', fake.stripe, `stripe login ${fake.stripe}`],
    ['github-token', fake.github, `gh auth login --with-token ${fake.github}`],
    ['github-pat', fake.githubPat, `git remote add o https://${fake.githubPat}@github.com/x/y`],
    ['gitlab-pat', fake.gitlab, `glab auth login -t ${fake.gitlab}`],
    ['slack-token', fake.slack, `curl -d token=${fake.slack} https://slack.com/api/x`],
    ['huggingface-token', fake.hf, `huggingface-cli login --token ${fake.hf}`],
    ['perplexity-key', fake.perplexity, `curl -H "x-key: ${fake.perplexity}" https://x`],
    ['digitalocean-token', fake.digitalocean, `doctl auth init -t ${fake.digitalocean}`],
    ['shopify-token', fake.shopify, `shopify app deploy --token ${fake.shopify}`],
    ['jwt', fake.jwt, `curl -H "Authorization: ${fake.jwt}" https://x`]
  ];

  it.each(cases)('redacts %s', (name, secret, command) => {
    const result = redactSecrets(command);
    expect(result.text).not.toContain(secret);
    expect(result.text).toContain(REDACTED);
    expect(result.hits).toContain(name);
  });
});

describe('redactSecrets — named values with unrecognised shapes', () => {
  it('redacts an opaque value announced by its variable name', () => {
    const result = redactSecrets('export MY_SERVICE_TOKEN=totally-opaque-value-9999');
    expect(result.text).not.toContain('totally-opaque-value-9999');
    expect(result.text).toBe(`export MY_SERVICE_TOKEN=${REDACTED}`);
    expect(result.hits).toContain('env-assignment');
  });

  it('redacts a quoted value', () => {
    const result = redactSecrets('env API_SECRET="quoted opaque thing" node app.js');
    expect(result.text).not.toContain('quoted opaque thing');
    expect(result.hits).toContain('env-assignment');
  });

  it('redacts a value passed via CLI flag', () => {
    const result = redactSecrets('deploy --api-key hunter2-not-a-known-shape --verbose');
    expect(result.text).not.toContain('hunter2-not-a-known-shape');
    expect(result.text).toContain('--verbose');
    expect(result.hits).toContain('cli-flag');
  });

  it('redacts a PEM private key block', () => {
    const pem = ['-----BEGIN RSA PRIVATE KEY-----', 'M'.repeat(40), '-----END RSA PRIVATE KEY-----'].join('\n');
    const result = redactSecrets(`echo "${pem}" > id_rsa`);
    expect(result.text).not.toContain('M'.repeat(40));
    expect(result.hits).toContain('private-key-block');
  });
});

describe('redactSecrets — must not damage ordinary commands', () => {
  const benign = [
    'git status',
    'npm run build',
    'git add . && git commit -m "fix parser"',
    'docker compose up -d',
    'cat data/coldspark.db | head',
    'claude-code --resume',
    'python3 scripts/train.py --epochs 30 --lr 0.001',
    'ssh-keygen -t ed25519 -C me@example.com'
  ];

  it.each(benign)('leaves %s untouched', command => {
    const result = redactSecrets(command);
    expect(result.text).toBe(command);
    expect(result.hits).toHaveLength(0);
  });
});

describe('containsSecret / idempotence', () => {
  it('detects before and not after scrubbing', () => {
    const command = `curl "https://x?key=${fake.gcp}"`;
    expect(containsSecret(command)).toBe(true);
    expect(containsSecret(redactSecrets(command).text)).toBe(false);
  });

  it('is idempotent', () => {
    const once = redactSecrets(`export GEMINI_API_KEY=${fake.gcp}`).text;
    expect(redactSecrets(once).text).toBe(once);
  });

  it('scrubs every secret when several share one line', () => {
    const command = `AWS_SECRET=${fake.aws} GOOGLE_KEY=${fake.gcp} ./deploy.sh`;
    const result = redactSecrets(command);
    expect(result.text).not.toContain(fake.aws);
    expect(result.text).not.toContain(fake.gcp);
    expect(result.text).toContain('./deploy.sh');
  });
});
