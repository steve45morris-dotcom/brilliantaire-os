export interface PlatformConfig {
  name: string;
  outputFolder: string;
  fields: string[];
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  youtube: {
    name: 'YouTube',
    outputFolder: 'outputs/platform_adapters/youtube/',
    fields: [
      'title',
      'description',
      'pinned comment',
      'tags',
      'thumbnail note',
      'upload checklist',
      'CTA'
    ]
  },
  tiktok: {
    name: 'TikTok',
    outputFolder: 'outputs/platform_adapters/tiktok/',
    fields: [
      'caption',
      'hook',
      'on-screen text',
      'CTA',
      'sound note',
      'posting checklist'
    ]
  },
  instagram: {
    name: 'Instagram',
    outputFolder: 'outputs/platform_adapters/instagram/',
    fields: [
      'caption',
      'Reel hook',
      'carousel idea',
      'CTA',
      'visual note',
      'posting checklist'
    ]
  },
  facebook: {
    name: 'Facebook',
    outputFolder: 'outputs/platform_adapters/facebook/',
    fields: [
      'post copy',
      'group version',
      'page version',
      'CTA',
      'visual note',
      'posting checklist'
    ]
  },
  whatsapp: {
    name: 'WhatsApp',
    outputFolder: 'outputs/platform_adapters/whatsapp/',
    fields: [
      'group post',
      'broadcast post',
      'short CTA',
      'community line',
      'posting checklist'
    ]
  },
  obsidian: {
    name: 'Obsidian',
    outputFolder: 'outputs/platform_adapters/obsidian/',
    fields: [
      'note title',
      'summary',
      'source campaign',
      'next action',
      'tags',
      'backlink suggestions'
    ]
  }
};
