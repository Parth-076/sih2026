# LabelCheck — System Flow (Authoritative)

This is the approved workflow from the project brief. It must not be simplified or
replaced with a generic OCR-app flow. Every phase should map back to a stage here.

```
LOGIN
   ↓
AUTHENTICATION
   ↓
ROLE-BASED ACCESS
   ↓
 ┌───────────────┬───────────────┬───────────────┐
 │   INSPECTOR   │    OFFICER    │     ADMIN     │
 └───────────────┴───────────────┴───────────────┘
                    ↓
                 PRODUCT
                    ↓
       ┌────────────┴────────────┐
       ↓                         ↓
  UPLOAD IMAGE            BARCODE SCANNING
                                 ↓
                              PRODUCT ID
                                 ↓
                         PRODUCT REPOSITORY
       └────────────┬────────────┘
                    ↓
             IMAGE PROCESSING
                    ↓
          OCR + COMPUTER VISION
                    ↓
             TEXT + BOXES
                    ↓
       ┌────────────┴────────────┐
       ↓                         ↓
DECLARATION EXTRACTION    FONT SIZE &
                          READABILITY ANALYSIS
       └────────────┬────────────┘
                    ↓
            COMPLIANCE ANALYSIS
                    ↓
       ┌────────────┼────────────┐
       ↓            ↓            ↓
    MISSING      MISLEADING   NON-STANDARD
 DECLARATIONS   DECLARATIONS  DECLARATIONS
       └────────────┼────────────┘
                    ↓
            COMPLIANCE RESULT
             ↓              ↓
        COMPLIANT       NON-COMPLIANT
             └───────┬──────┘
                     ↓
             EVIDENCE + REPORT
                     ↓
              INSPECTION HISTORY
                 REPOSITORY
                     ↓
          ┌──────────┴──────────┐
          ↓                     ↓
      DASHBOARD            REPORT ACCESS
```

## Differentiators the UI/UX must surface

1. Barcode–OCR Cross-Verification
2. Explainable Rule Engine (every finding traces to a rule + evidence)
3. Evidence-First Inspection (image region, OCR text, rule, expected vs detected, confidence)
4. Human-in-the-Loop Verification (Confirm / Reject / Mark for Review on uncertain findings)
5. Multi-Side Package Understanding (front/back/side images per inspection)
6. Versioned Rule Knowledge (rules have `version`, `active`, demo-vs-real source tag)
7. Automated Evidence-Based Reporting (PDF report ties every finding back to evidence)

## Hard constraints

- No fabricated AI confidence numbers, no "Feature coming soon" buttons, no fake legal
  rules presented as law.
- Backend enforces role permissions — frontend hiding of buttons is not sufficient.
- System must degrade gracefully if the AI service, barcode decode, or MongoDB is
  unavailable (see README §9 and the error-handling requirements in the brief).
