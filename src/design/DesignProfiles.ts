export interface DesignProfile {
  projectId: string;
  name: string;
  audience: string;
  brandObjective: string;
  emotionalDirection: string;
  typographyDirection: string;
  colorDirection: string;
  imageryDirection: string;
  conversionGoal: string;
  prohibitedVisualPatterns: string[];
  minimumVisualScore: number;
}

const sharedProhibitions = ['generic AI imagery', 'random neon', 'unverified testimonials'];

export const DESIGN_PROFILES: DesignProfile[] = [
  { projectId: 'the-one-system', name: 'The One System', audience: 'Operators managing projects and agents', brandObjective: 'Make system state legible and trustworthy', emotionalDirection: 'Calm command authority', typographyDirection: 'Technical grotesk with compact mono data', colorDirection: 'Neutral ink with semantic status accents', imageryDirection: 'Real system evidence and restrained diagrams', conversionGoal: 'Reach the correct operational action', prohibitedVisualPatterns: [...sharedProhibitions, 'decorative marketing hero'], minimumVisualScore: 80 },
  { projectId: 'icyflamze', name: 'Icyflamze', audience: 'Listeners, collaborators, and creative operators', brandObjective: 'Express a singular Nigerian hip-hop world', emotionalDirection: 'Cold precision with controlled flame', typographyDirection: 'Monumental display with readable utility text', colorDirection: 'Ice cyan, flame orange, gold, and black', imageryDirection: 'Original artist photography and release artwork', conversionGoal: 'Play, follow, or enter the creative workspace', prohibitedVisualPatterns: [...sharedProhibitions, 'generic musician template'], minimumVisualScore: 90 },
  { projectId: 'profbetgeng', name: 'ProfBetGeng', audience: 'Sports bettors managing ticket risk', brandObjective: 'Turn betting complexity into confident decisions', emotionalDirection: 'Analytical energy and disciplined confidence', typographyDirection: 'Condensed sports display with neutral UI sans', colorDirection: 'Pitch green, signal cyan, gold, and risk red', imageryDirection: 'Real ticket, odds, and match context', conversionGoal: 'Convert a ticket or start a risk review', prohibitedVisualPatterns: [...sharedProhibitions, 'casino visual noise'], minimumVisualScore: 85 },
  { projectId: 'treegroove', name: 'TreeGroove Records', audience: 'Artists, label operators, and distributors', brandObjective: 'Present the label as an organized cultural engine', emotionalDirection: 'Grounded, rhythmic, independent', typographyDirection: 'Editorial display with practical catalog text', colorDirection: 'Forest green, charcoal, paper white, and signal red', imageryDirection: 'Artist, release, studio, and catalog photography', conversionGoal: 'Review catalog or start a release workflow', prohibitedVisualPatterns: [...sharedProhibitions, 'identical release cards'], minimumVisualScore: 85 },
  { projectId: 'joy-beauty-studio', name: 'Joy Beauty Studio', audience: 'Local clients booking beauty services', brandObjective: 'Make expertise, availability, and booking feel personal', emotionalDirection: 'Polished warmth and confident care', typographyDirection: 'Elegant editorial serif with crisp service sans', colorDirection: 'Ink, petal coral, mineral green, and clean white', imageryDirection: 'Close, honest service and studio photography', conversionGoal: 'Book a specific service', prohibitedVisualPatterns: [...sharedProhibitions, 'beige luxury template', 'excessive script fonts'], minimumVisualScore: 85 },
  { projectId: 'avatar', name: 'Avatar Studio', audience: 'Creative producers managing digital personas', brandObjective: 'Make the character pipeline inspectable', emotionalDirection: 'Cinematic craft and technical control', typographyDirection: 'Wide cinematic display with mono metadata', colorDirection: 'Black, silver, skin-safe neutrals, and render blue', imageryDirection: 'Actual turntables, rigs, and render frames', conversionGoal: 'Review or approve a render stage', prohibitedVisualPatterns: [...sharedProhibitions, 'faceless synthetic portraits'], minimumVisualScore: 85 },
  { projectId: 'podcast', name: 'Podcast Engine', audience: 'Hosts and editors producing spoken content', brandObjective: 'Turn audio progress into an obvious editorial flow', emotionalDirection: 'Focused, intimate, articulate', typographyDirection: 'Humanist sans with mono timecode', colorDirection: 'Warm white, graphite, broadcast red, and waveform blue', imageryDirection: 'Real hosts, microphones, transcripts, and waveforms', conversionGoal: 'Ingest, edit, or publish an episode', prohibitedVisualPatterns: [...sharedProhibitions, 'decorative fake waveform'], minimumVisualScore: 85 },
  { projectId: 'ai-school', name: 'AI School', audience: 'Builders learning practical AI systems', brandObjective: 'Make technical learning structured and credible', emotionalDirection: 'Curious, direct, rigorous', typographyDirection: 'Readable textbook serif with code mono', colorDirection: 'White, carbon, cobalt, and annotation yellow', imageryDirection: 'Real diagrams, code, and lesson artifacts', conversionGoal: 'Start or continue a lesson', prohibitedVisualPatterns: [...sharedProhibitions, 'robot head imagery'], minimumVisualScore: 85 },
];

export const getDesignProfile = (projectId: string) => DESIGN_PROFILES.find((profile) => profile.projectId === projectId);
