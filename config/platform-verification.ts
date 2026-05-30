export interface VerificationConfig {
  name: string;
  requiredFields: string[];
}

export const VERIFICATION_CONFIGS: Record<string, VerificationConfig> = {
  youtube: {
    name: 'YouTube',
    requiredFields: [
      'title options',
      'description',
      'pinned comment',
      'upload checklist',
      'cta',
      'asset needed',
      'review status'
    ]
  },
  tiktok: {
    name: 'TikTok',
    requiredFields: [
      'caption options',
      'hook line',
      'on-screen text',
      'cta',
      'posting checklist',
      'asset needed',
      'review status'
    ]
  },
  instagram: {
    name: 'Instagram',
    requiredFields: [
      'reel caption',
      'carousel caption',
      'story text',
      'cta',
      'posting checklist',
      'asset needed',
      'review status'
    ]
  },
  facebook: {
    name: 'Facebook',
    requiredFields: [
      'page post',
      'group post',
      'comment reply starter',
      'cta',
      'posting checklist',
      'asset needed',
      'review status'
    ]
  },
  whatsapp: {
    name: 'WhatsApp',
    requiredFields: [
      'group announcement',
      'broadcast message',
      'short reminder',
      'cta',
      'posting checklist',
      'asset needed',
      'review status'
    ]
  },
  obsidian: {
    name: 'Obsidian',
    requiredFields: [
      'campaign note summary',
      'next actions',
      'tags',
      'backlink suggestions',
      'review status'
    ]
  }
};
