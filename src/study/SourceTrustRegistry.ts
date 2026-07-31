export type SourceTrustTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export interface SourceTrustRecord {
  id: string;
  title: string;
  url: string;
  tier: SourceTrustTier;
  license: string;
  retrievedAt: string;
  reuseRestriction: string;
  notes: string;
}

const retrievedAt = '2026-07-11T00:00:00.000Z';

const SOURCE_TRUST_SEED: SourceTrustRecord[] = [
  {
    id: 'source-github-docs',
    title: 'GitHub Docs',
    url: 'https://docs.github.com/',
    tier: 'tier1',
    license: 'GitHub Terms / Docs use policy',
    retrievedAt,
    reuseRestriction: 'Reference only; do not copy verbatim workflow content.',
    notes: 'Primary source for repository metadata, licenses, and workflow conventions.'
  },
  {
    id: 'source-google-sre',
    title: 'Google SRE Book',
    url: 'https://sre.google/sre-book/table-of-contents/',
    tier: 'tier1',
    license: 'Google terms / book usage policy',
    retrievedAt,
    reuseRestriction: 'Reference only; summarize operational practices.',
    notes: 'Primary reliability engineering reference.'
  },
  {
    id: 'source-microsoft-well-architected',
    title: 'Microsoft Cloud Adoption / Well-Architected',
    url: 'https://learn.microsoft.com/azure/well-architected/',
    tier: 'tier1',
    license: 'Microsoft documentation policy',
    retrievedAt,
    reuseRestriction: 'Reference only.',
    notes: 'Primary source for architecture and governance patterns.'
  },
  {
    id: 'source-aws-well-architected',
    title: 'AWS Well-Architected Framework',
    url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html',
    tier: 'tier1',
    license: 'AWS documentation policy',
    retrievedAt,
    reuseRestriction: 'Reference only.',
    notes: 'Primary source for production readiness and reliability guidance.'
  },
  {
    id: 'source-openssf',
    title: 'OpenSSF',
    url: 'https://openssf.org/',
    tier: 'tier1',
    license: 'OpenSSF site terms',
    retrievedAt,
    reuseRestriction: 'Reference only.',
    notes: 'Primary source for supply chain and security governance.'
  },
  {
    id: 'source-typescript',
    title: 'TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/',
    tier: 'tier1',
    license: 'TypeScript documentation policy',
    retrievedAt,
    reuseRestriction: 'Reference only.',
    notes: 'Primary source for language-level correctness and tooling behavior.'
  },
  {
    id: 'source-react',
    title: 'React Documentation',
    url: 'https://react.dev/',
    tier: 'tier1',
    license: 'React documentation policy',
    retrievedAt,
    reuseRestriction: 'Reference only.',
    notes: 'Primary source for frontend component and hook patterns.'
  },
  {
    id: 'source-postgresql',
    title: 'PostgreSQL Documentation',
    url: 'https://www.postgresql.org/docs/',
    tier: 'tier1',
    license: 'PostgreSQL docs policy',
    retrievedAt,
    reuseRestriction: 'Reference only.',
    notes: 'Primary source for database migration and query safety.'
  },
  {
    id: 'source-microsoft-engineering',
    title: 'Microsoft Engineering Docs',
    url: 'https://microsoft.github.io/code-with-engineering-playbook/',
    tier: 'tier2',
    license: 'Documentation policy',
    retrievedAt,
    reuseRestriction: 'Reference only; verify against official product guidance.',
    notes: 'Established engineering organization reference.'
  },
  {
    id: 'source-google-eng-practices',
    title: 'Google Engineering Practices',
    url: 'https://google.github.io/eng-practices/',
    tier: 'tier2',
    license: 'Documentation policy',
    retrievedAt,
    reuseRestriction: 'Reference only.',
    notes: 'Established engineering organization guidance for reviews and release work.'
  },
  {
    id: 'source-openfeature',
    title: 'OpenFeature',
    url: 'https://openfeature.dev/',
    tier: 'tier3',
    license: 'Apache-2.0',
    retrievedAt,
    reuseRestriction: 'Implementation patterns may be reused after verification.',
    notes: 'Maintained open-source project for feature flag governance.'
  },
  {
    id: 'source-community-postmortem',
    title: 'Community Postmortem Templates',
    url: 'https://github.com/search?q=postmortem+template',
    tier: 'tier4',
    license: 'Mixed / verify per repository',
    retrievedAt,
    reuseRestriction: 'Requires manual review and source-specific license validation.',
    notes: 'Community source; useful for pattern discovery, not independent activation.'
  }
];

export class SourceTrustRegistry {
  public listSources(): SourceTrustRecord[] {
    return [...SOURCE_TRUST_SEED];
  }

  public byTier(tier: SourceTrustTier): SourceTrustRecord[] {
    return SOURCE_TRUST_SEED.filter((source) => source.tier === tier);
  }

  public findById(id: string): SourceTrustRecord | null {
    return SOURCE_TRUST_SEED.find((source) => source.id === id) ?? null;
  }

  public validateForAdoption(sourceIds: string[]): { passed: boolean; blockers: string[] } {
    const blockers: string[] = [];
    const selected = sourceIds
      .map((id) => this.findById(id))
      .filter((source): source is SourceTrustRecord => Boolean(source));

    if (selected.length === 0) {
      blockers.push('At least one registered source is required.');
    }

    if (!selected.some((source) => source.tier === 'tier1' || source.tier === 'tier2')) {
      blockers.push('Adoption requires at least one tier1 or tier2 source.');
    }

    if (selected.some((source) => source.tier === 'tier4')) {
      blockers.push('Tier4 sources require an additional verification source.');
    }

    return {
      passed: blockers.length === 0,
      blockers
    };
  }
}

export const globalSourceTrustRegistry = new SourceTrustRegistry();
