import { MedicineItem, TrainingVideoData, TroubleshootingData, DeviceTroubleshootingFlow } from './types.js';

// Available medicines data
export const AVAILABLE_MEDICINES: MedicineItem[] = [
  {
    id: "p1",
    name: "Zepbound",
    logo: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:2d277f26-2ba6-4e9b-bbaa-ad67cf7dfb3c",
    image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c",
    buyLink: "https://www.lilly.com/lillydirect/medicines/zepbound",
    buyLinkText: "Shop Zepbound"
  },
  {
    id: "p2",
    name: "Humalog",
    logo: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:3edf9f1e-bee4-4911-8379-133d322b45dc",
    image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:5ee58310-165a-460d-8407-c8ae83057123",
    buyLink: "https://www.lilly.com/lillydirect/medicines/humalog",
    buyLinkText: "Humalog Family"
  },
  {
    id: "p3",
    name: "Humulin",
    logo: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:6c772ffa-4709-46da-be6d-f3c68f127264",
    image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:cc9415dc-f284-4e28-b649-439a07634b44",
    buyLink: "https://www.lilly.com/lillydirect/medicines/humulin",
    buyLinkText: "Humulin Family"
  },
  {
    id: "p4",
    name: "Emgality",
    logo: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:556265c1-5f18-4343-9848-bcbe41acc349",
    image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:8d64fe3d-39e0-4e6e-9d07-f57cb0a075dc",
    buyLink: "https://www.lilly.com/lillydirect/medicines/emgality",
    buyLinkText: "Shop Emgality"
  },
  {
    id: "p5",
    name: "Basaglar",
    logo: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:bc00440b-ff3f-4941-af3c-9774187db4b4",
    image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:bc00440b-ff3f-4941-af3c-9774187db4b4",
    buyLink: "https://www.lilly.com/lillydirect/medicines/basaglar",
    buyLinkText: "Shop Basaglar"
  },
  {
    id: "p6",
    name: "LYUMJEV",
    logo: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:872ad3f8-2b95-4751-9472-d944d70e1b00",
    image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:6716296c-3f53-460a-a38e-d65137f2236c",
    buyLink: "https://www.lilly.com/lillydirect/medicines/lyumjev",
    buyLinkText: "Shop Lyumjev"
  },
  {
    id: "p7",
    name: "Rezvoglar",
    logo: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:80a71062-f900-4816-887c-f5020ca1606e",
    image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:80a71062-f900-4816-887c-f5020ca1606e",
    buyLink: "https://www.lilly.com/lillydirect/medicines/rezvoglar",
    buyLinkText: "Shop Rezvoglar"
  }
];

// Troubleshooting data for medications
export const TROUBLESHOOTING_DATA: Record<string, TroubleshootingData> = {
  "p1": {
    medicineId: "p1",
    medicineName: "Zepbound",
    medicineLogo: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:2d277f26-2ba6-4e9b-bbaa-ad67cf7dfb3c",
    medicineImage: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c",
    commonIssues: [
      {
        issue: "Injection site pain or swelling",
        severity: "mild",
        solutions: [
          "Apply a cold compress to the injection site for 10-15 minutes",
          "Rotate injection sites (thigh, abdomen, upper arm)",
          "Ensure the pen is at room temperature before injection",
          "Use proper injection technique - insert at 90° angle"
        ],
        whenToSeekHelp: "If pain persists for more than 24 hours or if you notice signs of infection (redness, warmth, pus)",
        preventiveTips: [
          "Let the pen warm to room temperature (15-30 minutes)",
          "Clean injection site with alcohol",
          "Don't inject into the same spot twice in a row"
        ]
      },
      {
        issue: "Pen won't inject or seems blocked",
        severity: "moderate",
        solutions: [
          "Check if the pen has been stored properly (refrigerated)",
          "Ensure you've removed both caps from the pen",
          "Prime the pen by dialing 2 units and pressing until you see a drop",
          "Check expiration date on the pen",
          "Make sure the medicine is clear and colorless"
        ],
        whenToSeekHelp: "If the pen still doesn't work after troubleshooting, contact your pharmacy or Lilly customer support",
        preventiveTips: [
          "Store pens in refrigerator (36°F to 46°F)",
          "Don't freeze or shake the pen",
          "Check expiration dates regularly"
        ]
      },
      {
        issue: "Forgot to take dose",
        severity: "mild",
        solutions: [
          "Take the missed dose as soon as you remember",
          "If it's close to your next scheduled dose, skip the missed dose",
          "Do not take two doses at the same time",
          "Resume your regular dosing schedule"
        ],
        whenToSeekHelp: "Contact your healthcare provider if you frequently miss doses or have questions about timing",
        preventiveTips: [
          "Set a weekly reminder on your phone",
          "Use a medication tracking app",
          "Keep a dosing calendar"
        ]
      }
    ],
    sideEffects: {
      common: [
        {
          issue: "Nausea or vomiting",
          severity: "mild",
          solutions: [
            "Take with food or after meals",
            "Eat smaller, more frequent meals",
            "Stay hydrated with clear fluids",
            "Avoid spicy, fatty, or strong-smelling foods",
            "Try ginger tea or ginger candies"
          ],
          whenToSeekHelp: "If nausea is severe, persistent, or prevents you from eating or drinking",
          preventiveTips: [
            "Start with smaller portions",
            "Eat bland foods initially",
            "Avoid lying down immediately after eating"
          ]
        },
        {
          issue: "Diarrhea or stomach upset",
          severity: "mild",
          solutions: [
            "Stay well hydrated with water and electrolytes",
            "Eat bland foods (BRAT diet: bananas, rice, applesauce, toast)",
            "Avoid dairy, caffeine, and high-fat foods temporarily",
            "Consider probiotics after consulting your doctor"
          ],
          whenToSeekHelp: "If diarrhea is severe, bloody, or lasts more than 2-3 days",
          preventiveTips: [
            "Gradually increase fiber in diet",
            "Stay hydrated throughout the day",
            "Monitor symptoms and keep a food diary"
          ]
        }
      ],
      serious: [
        {
          issue: "Severe allergic reaction",
          severity: "emergency",
          solutions: [
            "Stop using Zepbound immediately",
            "Call 911 or go to emergency room right away",
            "If you have an EpiPen, use it as directed",
            "Do not drive yourself - have someone drive you"
          ],
          whenToSeekHelp: "IMMEDIATELY - This is a medical emergency",
          preventiveTips: [
            "Inform all healthcare providers about medication allergies",
            "Carry emergency contact information",
            "Consider medical alert bracelet if you have severe allergies"
          ]
        },
        {
          issue: "Severe abdominal pain",
          severity: "severe",
          solutions: [
            "Stop taking Zepbound immediately",
            "Contact your healthcare provider right away",
            "Do not eat or drink until evaluated by a doctor",
            "Go to emergency room if pain is severe"
          ],
          whenToSeekHelp: "Immediately - could indicate pancreatitis or other serious condition"
        }
      ]
    },
    emergencyContacts: {
      poison: "1-800-222-1222",
      medicalEmergency: "911",
      lillySupport: "1-800-LillyRx (1-800-545-5979)"
    },
    resources: {
      patientGuide: "https://www.lilly.com/lillydirect/medicines/zepbound/patient-guide",
      faq: "https://www.lilly.com/lillydirect/medicines/zepbound/faq",
      videoTutorials: "https://www.lilly.com/lillydirect/medicines/zepbound/videos"
    }
  },
  "p2": {
    medicineId: "p2",
    medicineName: "Humalog",
    medicineLogo: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:3edf9f1e-bee4-4911-8379-133d322b45dc",
    medicineImage: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:5ee58310-165a-460d-8407-c8ae83057123",
    commonIssues: [
      {
        issue: "Blood sugar too low (hypoglycemia)",
        severity: "severe",
        solutions: [
          "Treat immediately with 15g fast-acting carbs (glucose tablets, juice)",
          "Wait 15 minutes and recheck blood sugar",
          "Repeat treatment if still below 70 mg/dL",
          "Eat a snack with protein once blood sugar normalizes"
        ],
        whenToSeekHelp: "If unconscious, having seizures, or unable to swallow - call 911 immediately",
        preventiveTips: [
          "Always carry glucose tablets or quick-acting sugar",
          "Test blood sugar before driving",
          "Eat regular meals and snacks as recommended"
        ]
      },
      {
        issue: "Blood sugar too high (hyperglycemia)",
        severity: "moderate",
        solutions: [
          "Check blood sugar and ketones if possible",
          "Take correction dose as prescribed by doctor",
          "Drink water to stay hydrated",
          "Avoid exercise if blood sugar is very high (>300 mg/dL)"
        ],
        whenToSeekHelp: "If blood sugar consistently above 300 mg/dL or if you have ketones",
        preventiveTips: [
          "Take insulin as prescribed",
          "Monitor carbohydrate intake",
          "Check blood sugar regularly"
        ]
      }
    ],
    sideEffects: {
      common: [
        {
          issue: "Injection site reactions",
          severity: "mild",
          solutions: [
            "Rotate injection sites regularly",
            "Use proper injection technique",
            "Keep injection sites clean",
            "Apply ice if swelling occurs"
          ],
          whenToSeekHelp: "If reactions worsen or don't improve within a few days"
        }
      ],
      serious: [
        {
          issue: "Severe hypoglycemia",
          severity: "emergency",
          solutions: [
            "If conscious: give glucose tablets or sugary drink immediately",
            "If unconscious: call 911 and use glucagon if available",
            "Do not give food or drink to unconscious person",
            "Stay with person until emergency help arrives"
          ],
          whenToSeekHelp: "IMMEDIATELY - Call 911 for severe hypoglycemia"
        }
      ]
    },
    emergencyContacts: {
      poison: "1-800-222-1222",
      medicalEmergency: "911",
      lillySupport: "1-800-LillyRx (1-800-545-5979)"
    },
    resources: {
      patientGuide: "https://www.lilly.com/lillydirect/medicines/humalog/patient-guide",
      faq: "https://www.lilly.com/lillydirect/medicines/humalog/faq",
      videoTutorials: "https://www.lilly.com/lillydirect/medicines/humalog/videos"
    }
  }
  // Add more medicines as needed
};

// Interactive Device Troubleshooting Flows
export const DEVICE_TROUBLESHOOTING_FLOWS: Record<string, DeviceTroubleshootingFlow> = {
  "zepbound-pen-not-clicking": {
    medicineId: "p1",
    medicineName: "Zepbound",
    deviceName: "Zepbound Pen",
    deviceImage: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c",
    issueType: "pen-not-clicking",
    steps: [
      {
        id: "check-caps",
        title: "Step 1: Check Pen Caps",
        description: "First, let's make sure the pen is properly prepared for injection.",
        visual: "https://i.ibb.co/YF0s1k8p/Screenshot-2026-01-20-at-10-54-14-AM.png",
        videoUrl: "https://example.com/videos/zepbound-remove-caps.mp4",
        videoDuration: "30 seconds",
        checkInstructions: [
          "Look at your Zepbound pen",
          "Check if both the outer cap and inner needle cap have been removed",
          "The injection button should be visible at the end"
        ],
        yesAction: {
          type: "next",
          nextStepId: "check-medicine"
        },
        noAction: {
          type: "complete",
          outcome: "Remove both caps completely. The outer cap (larger) and inner needle cap (smaller) must both be removed before injection. Try your injection again with both caps removed."
        }
      },
      {
        id: "check-medicine",
        title: "Step 2: Check Medicine Appearance",
        description: "Now let's verify the medicine inside looks correct.",
        visual: "https://i.ibb.co/YF0s1k8p/Screenshot-2026-01-20-at-10-54-14-AM.png",
        safetyWarning: "Do not use this pen if the medicine appears cloudy, discolored, or contains particles.",
        checkInstructions: [
          "Look through the pen window at the medicine inside",
          "The medicine should be clear and colorless",
          "There should be no particles, cloudiness, or discoloration"
        ],
        yesAction: {
          type: "next",
          nextStepId: "check-expiration"
        },
        noAction: {
          type: "escalate",
          outcome: "Do not use this pen. The medicine appears contaminated or degraded. You'll need a replacement pen."
        }
      },
      {
        id: "check-expiration",
        title: "Step 3: Check Expiration Date",
        description: "Let's verify the pen hasn't expired.",
        visual: "https://i.ibb.co/YF0s1k8p/Screenshot-2026-01-20-at-10-54-14-AM.png",
        checkInstructions: [
          "Look for the expiration date on the pen label",
          "Check if today's date is before the expiration date",
          "Expired pens should not be used"
        ],
        yesAction: {
          type: "next",
          nextStepId: "check-storage"
        },
        noAction: {
          type: "complete",
          outcome: "This pen has expired and should not be used. Please dispose of it safely and get a new pen from your pharmacy."
        }
      },
      {
        id: "check-storage",
        title: "Step 4: Check Storage Conditions",
        description: "Proper storage is crucial for pen function.",
        visual: "https://i.ibb.co/YF0s1k8p/Screenshot-2026-01-20-at-10-54-14-AM.png",
        checkInstructions: [
          "Has this pen been stored in the refrigerator (36-46°F)?",
          "Has it been at room temperature for 15-30 minutes before this injection?",
          "Has the pen been frozen, shaken vigorously, or exposed to heat?"
        ],
        yesAction: {
          type: "next",
          nextStepId: "test-mechanism"
        },
        noAction: {
          type: "escalate",
          outcome: "Improper storage may have damaged the pen mechanism. This could explain why it's not clicking properly."
        }
      },
      {
        id: "test-mechanism",
        title: "Step 5: Test Pen Mechanism",
        description: "Let's test if the pen mechanism is working.",
        visual: "https://i.ibb.co/YF0s1k8p/Screenshot-2026-01-20-at-10-54-14-AM.png",
        safetyWarning: "Do not inject yet - this is just a mechanism test.",
        checkInstructions: [
          "Hold the pen firmly in your hand",
          "WITHOUT injecting, press the injection button firmly",
          "You should hear/feel a distinct 'click' sound",
          "Do you hear or feel the clicking mechanism?"
        ],
        yesAction: {
          type: "complete",
          outcome: "Great! The pen mechanism is working. The clicking sound means the pen is functioning properly. You can proceed with your injection following the normal instructions."
        },
        noAction: {
          type: "escalate",
          outcome: "The pen mechanism appears to be malfunctioning. This needs to be reported to our product quality team."
        }
      }
    ],
    outcomes: {
      resolved: "Your pen is working correctly. You can proceed with your injection as normal.",
      needsReplacement: "Your pen needs to be replaced. Please contact your pharmacy or healthcare provider for a new pen.",
      qualityComplaint: "This issue should be reported to our product quality team for investigation."
    }
  },
  "humalog-pen-not-working": {
    medicineId: "p2",
    medicineName: "Humalog",
    deviceName: "Humalog Pen",
    deviceImage: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:5ee58310-165a-460d-8407-c8ae83057123",
    issueType: "pen-not-working",
    steps: [
      {
        id: "check-insulin-flow",
        title: "Step 1: Check Insulin Flow",
        description: "Let's test if insulin is flowing from the pen.",
        checkInstructions: [
          "Attach a new needle to your pen",
          "Dial 2 units on the dose selector",
          "Hold the pen with needle pointing up",
          "Press the injection button - do you see a drop of insulin at the needle tip?"
        ],
        yesAction: {
          type: "complete",
          outcome: "Your pen is working correctly. The insulin flow is normal."
        },
        noAction: {
          type: "next",
          nextStepId: "check-needle"
        }
      },
      {
        id: "check-needle",
        title: "Step 2: Check Needle",
        description: "The needle might be blocked or damaged.",
        checkInstructions: [
          "Remove the current needle",
          "Attach a brand new needle",
          "Try the flow test again (dial 2 units, press button)",
          "Do you now see insulin at the needle tip?"
        ],
        yesAction: {
          type: "complete",
          outcome: "The previous needle was blocked. Your pen is working fine with the new needle."
        },
        noAction: {
          type: "escalate",
          outcome: "The pen mechanism may be blocked or malfunctioning."
        }
      }
    ],
    outcomes: {
      resolved: "Your pen is working correctly.",
      needsReplacement: "Your pen needs to be replaced.",
      qualityComplaint: "This issue should be reported for quality review."
    }
  }
};