export interface ManualReleasePlatformConfig {
  platformName: string;
  sourcePackageFolder: string;
  verificationReportFolder: string;
  requiredAsset: string;
  postingMode: 'manual';
  requiredCTA: string;
  requiredCampaignPhrase: string;
  statusField: string;
}

export const MANUAL_RELEASE_CONFIGS: Record<string, ManualReleasePlatformConfig> = {
  youtube: {
    platformName: 'YouTube',
    sourcePackageFolder: 'outputs/platform_adapters/youtube/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    requiredAsset: 'Sporty Rollout Master Video Assets (cyberpunk styling)',
    postingMode: 'manual',
    requiredCTA: 'Join the Brilliantier movement and unlock early access.',
    requiredCampaignPhrase: 'A Brilliantier knows when to cash out.',
    statusField: 'pending'
  },
  tiktok: {
    platformName: 'TikTok',
    sourcePackageFolder: 'outputs/platform_adapters/tiktok/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    requiredAsset: 'Sporty Rollout Master Video Assets (cyberpunk styling)',
    postingMode: 'manual',
    requiredCTA: 'Join the Brilliantier movement and unlock early access.',
    requiredCampaignPhrase: 'A Brilliantier knows when to cash out.',
    statusField: 'pending'
  },
  instagram: {
    platformName: 'Instagram',
    sourcePackageFolder: 'outputs/platform_adapters/instagram/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    requiredAsset: 'Sporty Rollout Reel and Carousel Graphic Elements',
    postingMode: 'manual',
    requiredCTA: 'Join the Brilliantier movement and unlock early access.',
    requiredCampaignPhrase: 'A Brilliantier knows when to cash out.',
    statusField: 'pending'
  },
  facebook: {
    platformName: 'Facebook',
    sourcePackageFolder: 'outputs/platform_adapters/facebook/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    requiredAsset: 'Sporty Promo Image assets and group artwork',
    postingMode: 'manual',
    requiredCTA: 'Join the Brilliantier movement and unlock early access.',
    requiredCampaignPhrase: 'A Brilliantier knows when to cash out.',
    statusField: 'pending'
  },
  whatsapp: {
    platformName: 'WhatsApp',
    sourcePackageFolder: 'outputs/platform_adapters/whatsapp/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    requiredAsset: 'Sporty Release Announcement graphic card',
    postingMode: 'manual',
    requiredCTA: 'Join the Brilliantier movement and unlock early access.',
    requiredCampaignPhrase: 'A Brilliantier knows when to cash out.',
    statusField: 'pending'
  },
  obsidian: {
    platformName: 'Obsidian',
    sourcePackageFolder: 'outputs/platform_adapters/obsidian/',
    verificationReportFolder: 'outputs/platform_verification/reports/',
    requiredAsset: 'Obsidian Campaign Brief note format',
    postingMode: 'manual',
    requiredCTA: 'Join the Brilliantier movement and unlock early access.',
    requiredCampaignPhrase: 'A Brilliantier knows when to cash out.',
    statusField: 'pending'
  }
};
