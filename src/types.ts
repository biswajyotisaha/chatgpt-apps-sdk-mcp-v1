// Medicine data types
export interface MedicineItem {
  id: string;
  name: string;
  logo: string;
  image: string;
  buyLink: string;
  buyLinkText: string;
}

export interface MedicineData {
  items: MedicineItem[];
  total_count: number;
  medicineName?: string;
  [key: string]: unknown;
}

// Training video data types
export interface TrainingVideoData {
  title: string;
  duration: string; // e.g., "45 seconds"
  videoUrl: string;
  thumbnailUrl?: string;
  medicineId: string;
  medicineImage: string;
  medicineLogo: string;
  medicineName: string;
  content: {
    penDescription: string;
    injectionProcess: string[];
    expectedSensations: string[];
    disposalGuidance: string[];
  };
}

// Troubleshooting data types
export interface TroubleshootingStep {
  issue: string;
  severity: 'mild' | 'moderate' | 'severe' | 'emergency';
  solutions: string[];
  whenToSeekHelp: string;
  preventiveTips?: string[];
}

export interface TroubleshootingData {
  medicineId: string;
  medicineName: string;
  medicineLogo: string;
  medicineImage: string;
  commonIssues: TroubleshootingStep[];
  sideEffects: {
    common: TroubleshootingStep[];
    serious: TroubleshootingStep[];
  };
  emergencyContacts: {
    poison: string;
    medicalEmergency: string;
    lillySupport: string;
  };
  resources: {
    patientGuide: string;
    faq: string;
    videoTutorials: string;
  };
  [key: string]: unknown;
}

// Interactive Device Troubleshooting Types
export interface TroubleshootingFlowStep {
  id: string;
  title: string;
  description: string;
  visual?: string; // Image URL showing what to check
  videoUrl?: string; // Video URL for visual demonstration
  videoDuration?: string; // e.g., "30 seconds"
  safetyWarning?: string;
  checkInstructions: string[];
  yesAction: {
    type: 'next' | 'complete' | 'escalate';
    nextStepId?: string;
    outcome?: string;
  };
  noAction: {
    type: 'next' | 'complete' | 'escalate';
    nextStepId?: string;
    outcome?: string;
  };
}

export interface DeviceTroubleshootingFlow {
  medicineId: string;
  medicineName: string;
  deviceName: string;
  deviceImage: string;
  issueType: string; // e.g., "pen-not-clicking", "injection-failure"
  steps: TroubleshootingFlowStep[];
  outcomes: {
    resolved: string;
    needsReplacement: string;
    qualityComplaint: string;
  };
  [key: string]: unknown;
}

export interface ProductQualityComplaint {
  complaintId: string;
  medicineId: string;
  medicineName: string;
  deviceType: string;
  issueDescription: string;
  troubleshootingResults: string[];
  userResponses: Record<string, 'yes' | 'no'>;
  timestamp: string;
  status: 'submitted' | 'under-review' | 'resolved';
}