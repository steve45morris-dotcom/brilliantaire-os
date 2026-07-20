export const SKILL_ACQUISITION_EVENTS = {
  DISCOVERED: 'SkillAcquisitionDiscovered',
  COMPATIBILITY_CHECKED: 'SkillAcquisitionCompatibilityChecked',
  RISK_REVIEWED: 'SkillAcquisitionRiskReviewed',
  APPROVED: 'SkillAcquisitionApproved',
  REJECTED: 'SkillAcquisitionRejected',
  VERIFIED: 'SkillAcquisitionVerified',
  ACTIVATED: 'SkillAcquisitionActivated'
};

export interface SkillAcquisitionEvent {
  type: string;
  candidateId: string;
  timestamp: string;
  data?: any;
}
