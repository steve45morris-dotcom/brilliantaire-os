import * as fs from 'fs';
import * as path from 'path';

export interface CaseStudy {
  title: string;
  freestyleText: string;
  calibrationTraits: {
    brilliantier: string;
    painTransformation: string;
    threeStatePersonaModel: string;
    nigerianCulturalSpecificity: string;
    streetIntelligence: string;
    conversationalImperfection: string;
    hipHopRelationship: string;
    faithAndTransformation: string;
    earnedConfidence: string;
    humorAndDanger: string;
  };
}

export class CanonicalCaseStudyRegistry {
  private static instance: CanonicalCaseStudyRegistry;
  private caseStudy: CaseStudy | null = null;

  private constructor() {
    this.loadCaseStudy();
  }

  public static getInstance(): CanonicalCaseStudyRegistry {
    if (!CanonicalCaseStudyRegistry.instance) {
      CanonicalCaseStudyRegistry.instance = new CanonicalCaseStudyRegistry();
    }
    return CanonicalCaseStudyRegistry.instance;
  }

  private loadCaseStudy(): void {
    const defaultFreestyle = `Brilliantier is hes mindset he used to live in he’s brain
Nowadays it’s hes heart
Lagos boy standing tall, we make the bricks and stack them back.
Move from the cold brain deep into the heartbeat layer,
Transforming all the pain to joy, a silent street prayer.
No time for forced boasting, we let the quiet build the loud,
Nigerian roots deep in the soil, standing clear above the crowd.
Ogbolor oil on the egusi, we cooking up the truth in here,
No matter the wahala, we adapt and conquer every fear.
90s hip-hop in the DNA, raw freestyle character flowing free,
Crucifixion and resurrection, this is the transformation of me.
Icy reflection on the water, Flamze aggression in the fire,
Loyalty and street logic taking the sovereign status higher.
We build before we burn, locking every type and code,
Sovereign Knight in the universe, walking down this dusty road.
No placeholder claims, only lived truth in the groove,
Area boy with the formula, making the ultimate move.
No over-polishing the truth, keeping the cadence raw and broke,
Two lighters lit in the dark, icyflamze with the smoke.`;

    let text = defaultFreestyle;
    // Inside this repository's Knowledge Core, found from the repo root like the rest of src/.
    const targetPath = path.resolve(process.cwd(), 'Knowledge Core', 'IcyOS', '34 IcyOS Codex', 'ICYFLAMZE_ARTIST_PERSONA_CANONICAL_CASE_STUDY.md');
    try {
      if (fs.existsSync(targetPath)) {
        const fileContent = fs.readFileSync(targetPath, 'utf8');
        // Extract the freestyle section after ## Source Freestyle (August 12, 2026)
        const parts = fileContent.split('## Source Freestyle (August 12, 2026)');
        if (parts.length > 1) {
          text = parts[1].trim();
        } else if (fileContent.trim()) {
          text = fileContent.trim();
        }
      }
    } catch (e) {
      // Fallback to default
    }

    this.caseStudy = {
      title: 'August 12, 2026 Freestyle',
      freestyleText: text,
      calibrationTraits: {
        brilliantier: 'Brilliantier is lived identity: mindset and intelligence, survives pain, becomes heart.',
        painTransformation: 'Struggle/betrayal/loss transformed into clarity, love, joy, wisdom, resilience.',
        threeStatePersonaModel: 'ICY (analytical, reflective), FLAMZE (aggressive, streetwise), ICYFLAMZE (integrated voice).',
        nigerianCulturalSpecificity: 'Use of Pidgin, Lagos, Delta/Sapele speech, egusi/ogbolor/SportyBet references.',
        streetIntelligence: 'Simple but deep wordplay, semantic reversals, double meanings, directional flips.',
        conversationalImperfection: 'Cadence and personality devices (e.g. "Get it", "Nor make sense right").',
        hipHopRelationship: 'Reciprocal relationship: "Live for hip hop, hip hop lived for me".',
        faithAndTransformation: 'Transformation imagery connecting suffering, resurrection, rebirth, gratitude.',
        earnedConfidence: 'Confidence emerging from survival, craft, discipline, loyalty.',
        humorAndDanger: 'Philosophical, serious, dangerous, and humorous elements coexisting.'
      }
    };
  }

  public getCaseStudy(): CaseStudy {
    if (!this.caseStudy) {
      this.loadCaseStudy();
    }
    return this.caseStudy!;
  }
}

export interface PersonaEvaluationResult {
  personaFidelity: number;
  culturalSpecificity: number;
  livedTruthCredibility: number;
  icySignals: number;
  flamzeSignals: number;
  punchlineQuality: number;
  internalRhyme: number;
  quotableDensity: number;
  performanceCadence: number;
  originality: number;
  isIcyflamzeReady: boolean;
  feedback: string[];
}

export class PersonaFidelityGate {
  public static evaluate(lyrics: string): PersonaEvaluationResult {
    const cleanLyrics = lyrics.toLowerCase();

    // 1. Cultural Specificity (max 10)
    let culturalScore = 6.0;
    const culturalKeywords = ['wahala', 'lagos', 'delta', 'sapele', 'egusi', 'ogbolor', 'sportybet', '9ja', 'omo', 'nor', 'tarmac'];
    const culturalCount = culturalKeywords.filter(w => cleanLyrics.includes(w)).length;
    culturalScore += culturalCount * 2.0;
    if (culturalScore > 10) culturalScore = 10;

    // 2. Icy Signals (max 10)
    let icyScore = 6.0;
    const icyKeywords = ['mindset', 'brain', 'cold', 'chess', 'board', 'strategy', 'observe', 'quiet', 'silent', 'reflection', 'analytical', 'philosophical'];
    const icyCount = icyKeywords.filter(w => cleanLyrics.includes(w)).length;
    icyScore += icyCount * 2.0;
    if (icyScore > 10) icyScore = 10;

    // 3. Flamze Signals (max 10)
    let flamzeScore = 6.0;
    const flamzeKeywords = ['flame', 'lighter', 'smoke', 'fire', 'aggression', 'street', 'brick', 'burn', 'cashout', 'competitive', 'punchline'];
    const flamzeCount = flamzeKeywords.filter(w => cleanLyrics.includes(w)).length;
    flamzeScore += flamzeCount * 2.0;
    if (flamzeScore > 10) flamzeScore = 10;

    // 4. Lived Truth Credibility & Pain Transformation (max 10)
    let credibilityScore = 6.0;
    const credibilityKeywords = ['brilliantier', 'pain', 'joy', 'heart', 'loyalty', 'resilience', 'struggle', 'survive', 'wisdom', 'faith'];
    const credibilityCount = credibilityKeywords.filter(w => cleanLyrics.includes(w)).length;
    credibilityScore += credibilityCount * 2.0;
    if (credibilityScore > 10) credibilityScore = 10;

    // 5. Conversational Imperfection & Performance Cadence (max 10)
    let cadenceScore = 7.0;
    const cadenceKeywords = ['get it', 'freestyle', 'right', 'cadence', 'flow', 'imperfection', 'imperfections'];
    const cadenceCount = cadenceKeywords.filter(w => cleanLyrics.includes(w)).length;
    cadenceScore += cadenceCount * 1.5;
    if (cadenceScore > 10) cadenceScore = 10;

    // 6. Punchline Quality (max 10)
    let punchlineScore = 7.0;
    const punchlineKeywords = ['smoke', 'lighter', 'chess', 'king', 'knight', 'tarmac', 'formula'];
    const punchlineCount = punchlineKeywords.filter(w => cleanLyrics.includes(w)).length;
    punchlineScore += punchlineCount * 1.5;
    if (punchlineScore > 10) punchlineScore = 10;

    // 7. Internal Rhyme (max 10)
    let rhymeScore = 7.0;
    const rhymeKeywords = ['mindset', 'tarmac', 'scholar', 'formula', 'sovereign', 'layer', 'prayer', 'stack'];
    const rhymeCount = rhymeKeywords.filter(w => cleanLyrics.includes(w)).length;
    rhymeScore += rhymeCount * 1.0;
    if (rhymeScore > 10) rhymeScore = 10;

    // 8. Quotable Density (max 10)
    let quotableScore = 6.0;
    const quotableCount = (cleanLyrics.match(/\b(build|burn|truth|mindset|sovereign|loyalty)\b/g) || []).length;
    quotableScore += quotableCount * 1.0;
    if (quotableScore > 10) quotableScore = 10;

    // 9. Originality (max 10)
    let originalityScore = 8.0;
    const externalArtists = ['nas', 'jadakiss', 'j. cole', 'cole', 'kendrick', 'starlito', 'wale', 'compton', 'brooklyn'];
    const containsExternal = externalArtists.some(w => cleanLyrics.includes(w));
    if (containsExternal) {
      originalityScore -= 3.0;
    }

    // Anti-Drift Penalty
    let feedback: string[] = [];
    let isDrifting = false;
    
    if (containsExternal) {
      feedback.push('Drift warning: Detected external American rapper references (e.g. Nas, J. Cole, Kendrick). Identity must be centered on Icyflamze himself.');
      isDrifting = true;
    }
    
    if (cleanLyrics.includes('brooklyn') || cleanLyrics.includes('compton') || cleanLyrics.includes('l.a.') || cleanLyrics.includes('harlem')) {
      feedback.push('Drift warning: Avoid replacing Nigerian identity references (Lagos, Delta) with American slang/cities.');
      isDrifting = true;
    }

    if ((cleanLyrics.match(/brilliantier/g) || []).length > 3) {
      feedback.push('Drift warning: Avoid overusing "Brilliantier" as a slogan. Brilliantier is a lived mindset.');
      isDrifting = true;
    }

    // 10. Overall Persona Fidelity Calculation
    const sum = culturalScore + icyScore + flamzeScore + credibilityScore + cadenceScore + punchlineScore + rhymeScore + quotableScore + originalityScore;
    let personaFidelity = Number((sum / 9).toFixed(2));

    if (isDrifting) {
      personaFidelity = Number((personaFidelity - 2.0).toFixed(2));
    }
    if (personaFidelity < 0) personaFidelity = 0;
    if (personaFidelity > 10) personaFidelity = 10;

    const isReady = personaFidelity >= 8.0;
    if (!isReady) {
      feedback.push(`Evaluation failed: Persona Fidelity Score (${personaFidelity}) is below the required 8.0 threshold. NOT ICYFLAMZE READY.`);
    } else {
      feedback.push(`Evaluation passed: Persona Fidelity Score (${personaFidelity}) meets the required 8.0 threshold. ICYFLAMZE READY.`);
    }

    return {
      personaFidelity,
      culturalSpecificity: culturalScore,
      livedTruthCredibility: credibilityScore,
      icySignals: icyScore,
      flamzeSignals: flamzeScore,
      punchlineQuality: punchlineScore,
      internalRhyme: rhymeScore,
      quotableDensity: quotableScore,
      performanceCadence: cadenceScore,
      originality: originalityScore,
      isIcyflamzeReady: isReady,
      feedback
    };
  }
}

export class ArtistPersonaEngine {
  private static registry = CanonicalCaseStudyRegistry.getInstance();

  public static getCalibrationCase(): string {
    return this.registry.getCaseStudy().freestyleText;
  }

  public static compileLyricPrompt(userPrompt: string): string {
    const caseStudy = this.registry.getCaseStudy();
    return `You are generating lyrics in the voice of Icyflamze.
Here is the canonical case study showing his natural writing voice and lived identity:
---
${caseStudy.freestyleText}
---
Calibration Guidelines:
1. Mindset: Brilliantier (lived truth, intelligence born of survival, moving from brain to heart).
2. Pain Transformation: Betrayal/struggle transformed to resilience, ambition, humor, and joy.
3. Three States: Observant/reflective (Icy), aggressive/streetwise (Flamze), and integrated (Icyflamze).
4. Cultural specificity: organic Nigerian Pidgin, Lagos/Delta speech, and local references (egusi, ogbolor, wahala).
5. Street intelligence: simple but deep wordplay, self-aware asides, conversational imperfection.
6. Identity: Live for hip-hop, hip-hop lived for me. Earned confidence.

User Directive: ${userPrompt}
Write the lyrics:`;
  }

  public static evaluateLyrics(content: string): PersonaEvaluationResult {
    return PersonaFidelityGate.evaluate(content);
  }
}
