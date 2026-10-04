import { jsonResponse } from '../../../lib/api/response';

interface LegalDocument {
  id: string;
  title: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: { heading: string; content: string }[];
}

interface LegalSnapshot {
  documents: LegalDocument[];
  companyName: string;
  jurisdiction: string;
  contactEmail: string;
}

export async function GET() {
  const snapshot: LegalSnapshot = {
    companyName: 'IcyOS Technologies',
    jurisdiction: 'United States',
    contactEmail: 'legal@icyos.dev',
    documents: [
      {
        id: 'tos',
        title: 'Terms of Service',
        version: '1.0',
        effectiveDate: '2026-10-01',
        lastUpdated: '2026-10-01',
        sections: [
          {
            heading: 'Acceptance of Terms',
            content:
              'By accessing or using the IcyOS platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Service. We reserve the right to update these Terms at any time, and your continued use of the Service after such changes constitutes acceptance of the updated Terms.',
          },
          {
            heading: 'Account Terms',
            content:
              'You must be at least 18 years of age to use this Service. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account. IcyOS Technologies reserves the right to suspend or terminate accounts that violate these Terms or are used for unauthorized purposes.',
          },
          {
            heading: 'Acceptable Use',
            content:
              'You agree to use the Service only for lawful purposes and in accordance with these Terms. You shall not use the Service to transmit harmful, offensive, or illegal content, attempt to gain unauthorized access to any part of the Service, interfere with or disrupt the integrity or performance of the Service, or use the Service to compete directly with IcyOS Technologies without prior written consent.',
          },
          {
            heading: 'Intellectual Property Rights',
            content:
              'The Service, including all content, features, and functionality, is owned by IcyOS Technologies and is protected by copyright, trademark, and other intellectual property laws. You retain ownership of any content you submit to the Service, but grant IcyOS Technologies a non-exclusive, worldwide license to use, reproduce, and display such content solely for the purpose of operating and improving the Service.',
          },
          {
            heading: 'Limitation of Liability',
            content:
              'To the maximum extent permitted by applicable law, IcyOS Technologies shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service. In no event shall the aggregate liability of IcyOS Technologies exceed the amount you paid for the Service in the twelve months preceding the claim.',
          },
          {
            heading: 'Termination',
            content:
              'Either party may terminate this agreement at any time. IcyOS Technologies may suspend or terminate your access to the Service immediately, without prior notice, if you breach any provision of these Terms. Upon termination, your right to use the Service will cease immediately. Provisions that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.',
          },
        ],
      },
      {
        id: 'privacy',
        title: 'Privacy Policy',
        version: '1.0',
        effectiveDate: '2026-10-01',
        lastUpdated: '2026-10-01',
        sections: [
          {
            heading: 'Information We Collect',
            content:
              'We collect information you provide directly, such as your name, email address, and account credentials. We also collect usage data automatically, including IP addresses, browser type, pages visited, and interaction patterns within the Service. When you use AI-powered features, we process the prompts and content you provide to deliver the requested functionality.',
          },
          {
            heading: 'How We Use Your Information',
            content:
              'We use collected information to provide, maintain, and improve the Service, to communicate with you about updates and changes, to detect and prevent fraud or abuse, and to comply with legal obligations. We may use aggregated, anonymized data for analytics and product development. We do not sell your personal information to third parties.',
          },
          {
            heading: 'Data Storage and Security',
            content:
              'Your data is stored on secure servers provided by our infrastructure partners, including Supabase and Vercel. We implement industry-standard security measures including encryption in transit and at rest, access controls, and regular security audits. While we strive to protect your information, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.',
          },
          {
            heading: 'Your Rights',
            content:
              'You have the right to access, correct, or delete your personal information at any time through your account settings or by contacting us. You may request a copy of all data we hold about you in a portable format. You may opt out of non-essential communications at any time. If you are located in the European Economic Area, you have additional rights under the GDPR, including the right to data portability and the right to lodge a complaint with a supervisory authority.',
          },
          {
            heading: 'Cookies and Tracking',
            content:
              'We use essential cookies to maintain your session and preferences. We may use analytics cookies to understand how the Service is used and to improve the user experience. You can control cookie preferences through your browser settings. Disabling essential cookies may affect the functionality of the Service.',
          },
        ],
      },
      {
        id: 'aup',
        title: 'Acceptable Use Policy',
        version: '1.0',
        effectiveDate: '2026-10-01',
        lastUpdated: '2026-10-01',
        sections: [
          {
            heading: 'Prohibited Activities',
            content:
              'You may not use the Service to engage in any illegal activity, distribute malware or malicious code, attempt to reverse engineer or decompile any part of the Service, harvest or collect user information without consent, impersonate any person or entity, or use automated systems to access the Service in a manner that exceeds reasonable request volumes. Mining cryptocurrency using Service resources is strictly prohibited.',
          },
          {
            heading: 'Content Guidelines',
            content:
              'Content submitted to the Service must not contain hate speech, harassment, or threats of violence, infringe on intellectual property rights of others, contain sexually explicit material involving minors, promote illegal activities or substances, or contain deliberately misleading or deceptive information. IcyOS Technologies reserves the right to remove content that violates these guidelines without prior notice.',
          },
          {
            heading: 'Resource Usage',
            content:
              'You agree to use Service resources responsibly and within the limits of your subscription tier. Excessive API calls, storage usage, or computational demands that degrade the experience for other users may result in temporary throttling or suspension. If your usage consistently exceeds your tier limits, we will notify you and work with you to find an appropriate plan.',
          },
          {
            heading: 'Enforcement',
            content:
              'Violations of this Acceptable Use Policy may result in a warning and request to cease the prohibited activity, temporary suspension of your account, permanent termination of your account, or legal action where appropriate. IcyOS Technologies will make reasonable efforts to notify you before taking enforcement action, except where immediate action is necessary to protect the Service or other users. You may appeal enforcement decisions by contacting legal@icyos.dev.',
          },
        ],
      },
    ],
  };

  return jsonResponse(snapshot);
}
