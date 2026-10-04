import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/legal-document';
import { PRIVACY } from '../../lib/legal/content';

export const metadata: Metadata = { title: 'Privacy Policy · IcyOS' };

export default function PrivacyPage() {
  return <LegalDocumentPage doc={PRIVACY} />;
}
