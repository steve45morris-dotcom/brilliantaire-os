import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/legal-document';
import { TERMS } from '../../lib/legal/content';

export const metadata: Metadata = { title: 'Terms of Service · IcyOS' };

export default function TermsPage() {
  return <LegalDocumentPage doc={TERMS} />;
}
