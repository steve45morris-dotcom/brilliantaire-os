export interface DistributionPlatformConfig {
  platformName: string;
  metricFields: string[];
  linkRequired: boolean;
  packageSourceFolder: string;
  verificationReportFolder: string;
  releaseChecklistFolder: string;
  archiveIndexFolder: string;
}

export const DISTRIBUTION_METRICS_CONFIGS: Record<string, DistributionPlatformConfig> = {
  youtube: {
    platformName: 'YouTube',
    metricFields: [
      'post link',
      'views',
      'likes',
      'comments',
      'subscribers gained',
      'click notes',
      'creator notes'
    ],
    linkRequired: true,
    packageSourceFolder: 'outputs/platform_adapters/youtube/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    releaseChecklistFolder: 'outputs/manual_release/checklists/',
    archiveIndexFolder: 'outputs/distribution_metrics/archive_index/'
  },
  tiktok: {
    platformName: 'TikTok',
    metricFields: [
      'post link',
      'views',
      'likes',
      'comments',
      'shares',
      'saves',
      'profile visits',
      'creator notes'
    ],
    linkRequired: true,
    packageSourceFolder: 'outputs/platform_adapters/tiktok/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    releaseChecklistFolder: 'outputs/manual_release/checklists/',
    archiveIndexFolder: 'outputs/distribution_metrics/archive_index/'
  },
  instagram: {
    platformName: 'Instagram',
    metricFields: [
      'post link',
      'views',
      'likes',
      'comments',
      'shares',
      'saves',
      'follows',
      'creator notes'
    ],
    linkRequired: true,
    packageSourceFolder: 'outputs/platform_adapters/instagram/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    releaseChecklistFolder: 'outputs/manual_release/checklists/',
    archiveIndexFolder: 'outputs/distribution_metrics/archive_index/'
  },
  facebook: {
    platformName: 'Facebook',
    metricFields: [
      'post link',
      'reactions',
      'comments',
      'shares',
      'group feedback',
      'creator notes'
    ],
    linkRequired: true,
    packageSourceFolder: 'outputs/platform_adapters/facebook/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    releaseChecklistFolder: 'outputs/manual_release/checklists/',
    archiveIndexFolder: 'outputs/distribution_metrics/archive_index/'
  },
  whatsapp: {
    platformName: 'WhatsApp',
    metricFields: [
      'group name',
      'replies',
      'reactions',
      'link clicks if known',
      'screenshots saved yes/no',
      'creator notes'
    ],
    linkRequired: false,
    packageSourceFolder: 'outputs/platform_adapters/whatsapp/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    releaseChecklistFolder: 'outputs/manual_release/checklists/',
    archiveIndexFolder: 'outputs/distribution_metrics/archive_index/'
  },
  obsidian: {
    platformName: 'Obsidian',
    metricFields: [
      'note path',
      'linked notes count',
      'next actions created',
      'archive status',
      'creator notes'
    ],
    linkRequired: false,
    packageSourceFolder: 'outputs/platform_adapters/obsidian/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    releaseChecklistFolder: 'outputs/manual_release/checklists/',
    archiveIndexFolder: 'outputs/distribution_metrics/archive_index/'
  }
};
