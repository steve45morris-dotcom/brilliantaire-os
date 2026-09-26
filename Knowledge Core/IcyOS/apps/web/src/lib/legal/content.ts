import { LEGAL } from './config';

// Drafts for legal review, not legal advice. Keep statements here true to what
// the code does: if billing, data handling or processors change, update these.

export type Block = string | { list: string[] };

export interface Section {
  id: string;
  heading: string;
  blocks: Block[];
}

export interface LegalDocument {
  title: string;
  intro: string;
  sections: Section[];
}

const { product, entity, contactEmail, trialDays, minimumAge } = LEGAL;

export const TERMS: LegalDocument = {
  title: 'Terms of Service',
  intro: `These Terms of Service ("Terms") are an agreement between you and ${entity} ("${entity}", "we", "us") and govern your use of ${product}, including its website, apps and APIs (the "Service"). By creating an account or using the Service, you agree to these Terms. If you use the Service for an organization, you agree on its behalf and confirm you have authority to do so.`,
  sections: [
    {
      id: 'eligibility',
      heading: '1. Eligibility and accounts',
      blocks: [
        `You must be at least ${minimumAge} years old to use the Service. You are responsible for your account credentials and for all activity under your account. Tell us promptly at ${contactEmail} if you believe your account has been compromised.`,
      ],
    },
    {
      id: 'trial',
      heading: '2. Free trial',
      blocks: [
        `New accounts receive a ${trialDays}-day free trial. No payment details are needed to start it. When the trial ends, access to the Service is limited to the billing page until you subscribe. If you subscribe during the trial, any trial time remaining is kept where our payment provider allows it, and you are first charged when the trial ends.`,
      ],
    },
    {
      id: 'subscriptions',
      heading: '3. Subscriptions and payment',
      blocks: [
        'Paid plans are billed monthly in advance and renew automatically each month until cancelled. Per-seat plans are billed for the number of seats you select.',
        'Payments are processed by Stripe, our payment provider. We do not receive or store your full card number. You authorize us, through Stripe, to charge your payment method for each billing period and for any applicable taxes.',
        'If a payment fails, we and Stripe will retry it. Your access continues while we retry. If payment cannot be collected, your subscription may be cancelled and your access limited.',
        'We may change our prices. We will give you at least 30 days’ notice before a price change takes effect for your subscription, and the new price applies from your next billing period after that notice.',
      ],
    },
    {
      id: 'cancellation',
      heading: '4. Cancellation and refunds',
      blocks: [
        'You can cancel at any time from the billing page, which opens our billing portal. Cancellation takes effect at the end of the current billing period, and you keep access until then.',
        'Payments are non-refundable, and we do not give partial or prorated refunds for unused time, unused seats or downgrades, except where required by law.',
      ],
    },
    {
      id: 'content',
      heading: '5. Your content',
      blocks: [
        'You keep all rights to the content you put into the Service, such as projects, missions, notes, timelines and prompts ("Your Content").',
        'You grant us a limited license to host, store, process and display Your Content only as needed to provide and secure the Service for you. This license ends when Your Content is deleted from the Service.',
        'We do not use Your Content to train artificial intelligence models, and we do not sell it.',
        'You are responsible for Your Content and confirm you have the rights needed to use it with the Service.',
      ],
    },
    {
      id: 'ai',
      heading: '6. AI features',
      blocks: [
        'Some features send Your Content to a third-party AI provider to generate a response. The provider depends on how the Service is configured, as described in our Privacy Policy.',
        'AI output can be inaccurate, incomplete or inappropriate. Review it before relying on it. You are responsible for decisions and actions you take based on AI output.',
      ],
    },
    {
      id: 'acceptable-use',
      heading: '7. Acceptable use',
      blocks: [
        'You agree not to:',
        {
          list: [
            'break the law or infringe anyone’s rights;',
            'access or attempt to access other users’ data, or probe, scan or test the Service’s security without our written permission;',
            'interfere with or overload the Service, including by exceeding rate limits or automating access in ways we have not enabled;',
            'upload malware or content that is unlawful, harassing or abusive;',
            'resell, sublicense or provide the Service to third parties except as your plan allows; or',
            'reverse engineer the Service, except where the law permits it despite this restriction.',
          ],
        },
      ],
    },
    {
      id: 'integrations',
      heading: '8. Third-party services',
      blocks: [
        'The Service can connect to third-party services you choose, such as Google Calendar or Obsidian. Those services are governed by their own terms. We are not responsible for them, and you can disconnect them at any time.',
      ],
    },
    {
      id: 'ip',
      heading: '9. Our intellectual property',
      blocks: [
        `The Service, including its software, design and documentation, is owned by ${entity} and its licensors and is protected by intellectual property laws. Apart from the right to use the Service under these Terms, no rights are granted to you. If you send us feedback, we may use it without obligation to you.`,
      ],
    },
    {
      id: 'termination',
      heading: '10. Suspension and termination',
      blocks: [
        'You may stop using the Service and delete your account at any time.',
        'We may suspend or terminate your access if you materially breach these Terms, if required by law, or to protect the Service or other users. Where reasonable, we will give notice and a chance to fix the issue first.',
        'After termination you may request an export of Your Content for 30 days, after which we may delete it as described in our Privacy Policy.',
      ],
    },
    {
      id: 'disclaimers',
      heading: '11. Disclaimers',
      blocks: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE". TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE OR AI OUTPUT WILL BE ACCURATE, UNINTERRUPTED OR ERROR-FREE.',
      ],
    },
    {
      id: 'liability',
      heading: '12. Limitation of liability',
      blocks: [
        `TO THE FULLEST EXTENT PERMITTED BY LAW, ${entity.toUpperCase()} WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE OR DATA. OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE IS LIMITED TO THE AMOUNT YOU PAID US FOR THE SERVICE IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM.`,
        'Some jurisdictions do not allow these limitations, so they may not all apply to you.',
      ],
    },
    {
      id: 'indemnity',
      heading: '13. Indemnity',
      blocks: [
        `You will defend and indemnify ${entity} against third-party claims arising from Your Content or your breach of these Terms, except to the extent caused by us.`,
      ],
    },
    {
      id: 'law',
      heading: '14. Governing law and disputes',
      blocks: [
        `These Terms are governed by the laws of ${LEGAL.governingLaw}, without regard to its conflict-of-laws rules. Disputes will be resolved exclusively in ${LEGAL.courts}, and you and we consent to their jurisdiction. This does not remove any mandatory consumer protections you have where you live.`,
      ],
    },
    {
      id: 'changes',
      heading: '15. Changes to these Terms',
      blocks: [
        'We may update these Terms. For material changes we will give at least 30 days’ notice by email or in the Service. Continuing to use the Service after changes take effect means you accept them. If you do not agree, you can cancel before they take effect.',
      ],
    },
    {
      id: 'contact',
      heading: '16. Contact',
      blocks: [`Questions about these Terms: ${contactEmail}.`],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Privacy Policy',
  intro: `This Privacy Policy explains how ${entity} ("we", "us") collects, uses and shares personal information when you use ${product} (the "Service"). ${entity} is the controller of this information.`,
  sections: [
    {
      id: 'collect',
      heading: '1. Information we collect',
      blocks: [
        {
          list: [
            'Account information: your email address, name, and sign-in credentials. Passwords are handled by our authentication provider and stored only in hashed form.',
            'Your Content: the projects, missions, notes, timelines, prompts and AI responses you create in the Service.',
            'Integration data: if you connect Google Calendar or Obsidian, the calendar events or note information you choose to make available. These integrations are read-only.',
            'Billing information: your plan, subscription status and billing history, along with the customer and subscription identifiers from Stripe. Card details are collected and stored by Stripe, not by us.',
            'Technical information: IP addresses and request details used for security and rate limiting, and service logs.',
          ],
        },
      ],
    },
    {
      id: 'use',
      heading: '2. How we use information',
      blocks: [
        {
          list: [
            'to provide, maintain and secure the Service, including preventing abuse;',
            'to run AI features you use, by sending the relevant content to an AI provider to generate a response;',
            'to manage your trial, subscription and payments;',
            'to communicate with you about your account, security and changes to the Service; and',
            'to comply with legal obligations.',
          ],
        },
        'We do not sell your personal information, share it for cross-context behavioral advertising, show ads, or use Your Content to train AI models.',
      ],
    },
    {
      id: 'legal-bases',
      heading: '3. Legal bases (EEA and UK users)',
      blocks: [
        'We process personal information to perform our contract with you, for our legitimate interests in securing and improving the Service, with your consent (for example, when you connect an integration), and to meet legal obligations.',
      ],
    },
    {
      id: 'sharing',
      heading: '4. Service providers',
      blocks: [
        'We share personal information only with providers that process it on our behalf to run the Service:',
        {
          list: [
            'Supabase: database hosting and authentication.',
            'Stripe: payment processing and billing.',
            'AI providers: Anthropic, OpenAI or Google (Gemini), depending on configuration, to generate responses to your requests. A deployment configured with a self-hosted model (Ollama) does not send this content to an external AI provider.',
            `${LEGAL.hostingProvider}: application hosting.`,
          ],
        },
        'We may also disclose information when required by law, to protect rights and safety, or as part of a merger or acquisition, subject to this Policy.',
      ],
    },
    {
      id: 'transfers',
      heading: '5. International transfers',
      blocks: [
        'We are based in the United States, and our providers may process information in other countries. Where the law requires it, we rely on appropriate safeguards such as the European Commission’s Standard Contractual Clauses.',
      ],
    },
    {
      id: 'retention',
      heading: '6. Retention',
      blocks: [
        'We keep account information and Your Content while your account is active. After you delete your account, we delete it within 30 days, except where we must keep it longer by law. Billing records are kept as long as tax and accounting law requires. Rate-limiting data is short-lived and not stored.',
      ],
    },
    {
      id: 'security',
      heading: '7. Security',
      blocks: [
        'We use encryption in transit, database access controls that separate each user’s data, and restricted access to production systems. No system is perfectly secure, but we work to protect your information and will notify you of a breach where the law requires.',
      ],
    },
    {
      id: 'rights',
      heading: '8. Your rights',
      blocks: [
        'Depending on where you live, you may have the right to access, correct, delete or export your personal information, and to object to or restrict certain processing. California and other US state residents have similar rights and the right not to be discriminated against for exercising them. We do not sell or share personal information as those laws define it.',
        `To exercise a right, contact ${contactEmail}. We will verify your request and respond within the time the law requires. If you are in the EEA or UK, you may also complain to your data protection authority.`,
      ],
    },
    {
      id: 'cookies',
      heading: '9. Cookies',
      blocks: [
        'We use only essential cookies, which keep you signed in and secure your session. We do not use advertising or analytics cookies.',
      ],
    },
    {
      id: 'children',
      heading: '10. Children',
      blocks: [
        `The Service is not intended for anyone under ${minimumAge}, and we do not knowingly collect personal information from children.`,
      ],
    },
    {
      id: 'changes',
      heading: '11. Changes to this Policy',
      blocks: [
        'We may update this Policy. For material changes we will notify you by email or in the Service before they take effect.',
      ],
    },
    {
      id: 'contact',
      heading: '12. Contact',
      blocks: [`Privacy questions or requests: ${contactEmail}.`],
    },
  ],
};

/** All text in a document, for placeholder checks. */
export function documentText(doc: LegalDocument): string {
  return [
    doc.title,
    doc.intro,
    ...doc.sections.flatMap((s) => [s.heading, ...s.blocks.map((b) => (typeof b === 'string' ? b : b.list.join('\n')))]),
  ].join('\n');
}
