---
name: Federal Compliance & Inspection UI
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#42474e'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#73777f'
  outline-variant: '#c2c7cf'
  surface-tint: '#3d6185'
  primary: '#002541'
  on-primary: '#ffffff'
  primary-container: '#123b5d'
  on-primary-container: '#82a5cd'
  inverse-primary: '#a6caf3'
  secondary: '#0261a2'
  on-secondary: '#ffffff'
  secondary-container: '#76b8fe'
  on-secondary-container: '#00487a'
  tertiary: '#002924'
  on-tertiary: '#ffffff'
  tertiary-container: '#00413a'
  on-tertiary-container: '#49b3a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e4ff'
  primary-fixed-dim: '#a6caf3'
  on-primary-fixed: '#001d34'
  on-primary-fixed-variant: '#24496c'
  secondary-fixed: '#d1e4ff'
  secondary-fixed-dim: '#9dcaff'
  on-secondary-fixed: '#001d36'
  on-secondary-fixed-variant: '#00497c'
  tertiary-fixed: '#8df5e4'
  tertiary-fixed-dim: '#70d8c8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  headline-xl:
    fontFamily: IBM Plex Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system establishes an institutional, uncompromisingly reliable, and highly operational visual language tailored for regulatory agents, field inspectors, and forensic compliance analysts. Balancing federal authority with high-speed field utility, the design language fuses **Corporate / Modern** structure with technical, data-dense precision.

Key attributes:
- **Authoritative & Legitimate:** Evokes federal security, official chain-of-custody protocols, and rigorous public safety enforcement through disciplined alignment, measured negative space, and formal contrast.
- **Forensic Clarity:** Eliminates ambiguity. Complex laboratory manifests, batch tracing tables, and forensic supply-chain chains are rendered with clear visual hierarchy, legible tabular data, and distinct compliance status cues.
- **High-Velocity Field Operations:** Built to withstand demanding inspection environments—from refrigerated processing plants using tablets with damp gloves to low-glare outdoor loading docks—prioritizing tactile feedback, large tap zones for inputs, and instant triage scanning.

## Colors

The palette leverages authoritative deep navies balanced against forensic operational greens, cautionary ambers, and actionable alert reds, anchored on clinical slate foundations.

### Functional Roles
- **Primary Navy (`#123B5D`):** Applied to primary actions, official identification top bars, high-level navigation, and prominent structural containers to evoke federal credibility.
- **Royal Blue (`#1769AA`):** Direct interactive affordances, links, active state indicators, focus outlines, and primary system prompts.
- **Verification Emeralds (`#2E7D32` & `#00897B`):** System verification markers, tamper-evident security passes, automated batch approvals, and cryptographic check indicators.
- **Cautionary Amber (`#F9A825`):** Discrepancies requiring manual agent reconciliation, pending lab verifications, and temperature deviation warnings.
- **Critical Crimson (`#C62828`):** Contamination alerts, embargo mandates, expired certifications, and immediate detention triggers.
- **Neutral Canvas & Foundations:**
  - Background: Crisp cool gray-blue (`#F5F7FA`) maintaining clean optical separation from pure white operational cards.
  - Surfaces: `#FFFFFF` for primary cards, data tables, and input panels.
  - Structural Hairlines: `#E2E8F0` for crisp, low-fatigue structural boundaries.
  - Text Tokens: High-contrast Slate 900 (`#0F172A`) for primary forensic data, Slate 600 (`#475569`) for metadata labels and auditing watermarks.

## Typography

The type system blends **IBM Plex Sans** for institutional headings, inspection labels, and security badges with **Inter** for sustained readability within complex diagnostic data tables, narrative violation logs, and lab results.

- **Tabular Figures:** All numeric displays (lot numbers, timestamps, temperature feeds, barcode payloads, inspection IDs) must enforce tabular numerals (`tnum`) to maintain structural vertical alignment across data grids.
- **Label Tracking:** All uppercase indicators, verification chips, and federal status tags (`label-sm`, `label-md`) require expanded letter-spacing (+0.04em to +0.08em) to ensure legibility when rendered in constrained container spaces or low-backlight mobile environments.

## Layout & Spacing

The layout is grounded in a robust 12-column responsive fluid grid anchored by strict 8px vertical rhythm intervals (with a 4px sub-grid for dense form controls and status pills).

### Form Factor Behavior
- **Desktop (1200px+):** Fixed structural side rail (280px) for session-state agency badges, active inspection metadata, and workflow routing. 12-column content plane with 24px (`space-lg`) gutters and 32px (`space-xl`) margins. Supports dense side-by-side verification (e.g., extracted OCR manifest on the left, automated chain-of-custody trace on the right).
- **Tablet / Rugged Toughpad (768px - 1199px):** Collapsible sidebar into a top masthead; 8-column layout with 16px (`space-md`) gutters. Inspection actions lock to a persistent 64px bottom execution dock for rapid thumb triggers.
- **Mobile Handheld (320px - 767px):** 4-column layout with 12px (`gutter-mobile`) gutters and 16px (`margin-mobile`) horizontal canvas margin. Multi-column field matrices collapse strictly to single-column card stacks to prevent horizontal panning during physical dockside audits.

## Elevation & Depth

Visual hierarchy is maintained primarily via structural borders and subtle tonal layering rather than heavy ambient drop shadows, reflecting a crisp, utilitarian federal software standard.

- **Surface Tiers:**
  - *Tier 0 (Base Canvas):* `#F5F7FA` cool neutral canvas.
  - *Tier 1 (Resting Panel):* `#FFFFFF` cards and sections bounded by a 1px solid `#E2E8F0` hairline border. No resting shadow, ensuring crisp visual delineation on rugged, low-contrast displays.
  - *Tier 2 (Elevated / Inspection Floating Context):* `#FFFFFF` with a crisp border (`#CBD5E1`) and a tight directional ambient shadow: `0 4px 12px -2px rgba(18, 59, 93, 0.08), 0 2px 6px -1px rgba(18, 59, 93, 0.04)`.
  - *Tier 3 (Modals / Seizure Actions / Overlays):* `0 20px 25px -5px rgba(15, 23, 42, 0.16), 0 10px 10px -5px rgba(15, 23, 42, 0.06)`, framed by a 1px solid `#94A3B8` outline.
- **Security & Watermark Accents:** Secure federal panels, cryptographic signatures, and audit stamps feature an ultra-subtle, high-precision guilloche or micro-ruled vector background pattern rendered at 3% opacity of `#123B5D`.

## Shapes

The design system enforces a disciplined, low-radius shape profile (**Soft / Level 1**), projecting institutional stability, operational density, and structural integrity.

- **Standard Elements (Buttons, Inputs, Status Badges):** 4px (`0.25rem`) corner radius. Accentuates precision without the cold harshness of unstyled square elements.
- **Cards, Enclosures, & Data Panels:** 8px (`0.5rem`, `rounded-lg`). Provides containment for dense operational data sets while retaining clean edge alignment.
- **Audit Stamps & Stepper Nodes:** Circular (`50%` / pill-shaped) strictly reserved for numeric sequence steps and state indicators to contrast against rectangular data modules.

## Components

### Buttons & Interactive Triggers
- **Primary Operational Button:** Solid `#123B5D` fill, pure white `#FFFFFF` label (`label-lg`), 4px corner radius. Minimum height of 48px on mobile/touch interfaces (40px desktop) with horizontal padding of `space-lg`. Active/pressed states shift to `#0E2942` with an inner border highlight.
- **Secondary Action Button:** Border 1.5px solid `#1769AA`, transparent background, `#1769AA` text. On hover, fills with 8% opacity tint of Royal Blue.
- **Critical Violation Trigger:** `#C62828` fill with high-contrast white text, reserved exclusively for irreversible enforcement actions (e.g., "Issue Stop-Sale Order", "Revoke Facility Clearance").

### Workflow Step Indicator (Linear Pipeline)
- Dedicated 6-phase inspector workflow pipeline: `SCAN -> EXTRACT -> VERIFY -> TRACE -> INSPECT -> REPORT`.
- Connected horizontally by a 2px rigid track (`#E2E8F0` for upcoming, `#1769AA` for completed).
- Step Nodes: 32px circular indicators. Completed steps feature `#00897B` fill with an embedded white check mark; active step features `#123B5D` fill with `#1769AA` 3px focus ring pulse; future steps utilize `#FFFFFF` surface with `#94A3B8` border and numeric index.

### Status Badges & Audit Tags
- High-contrast, all-caps micro-badges (`label-sm`) with 4px border radius, 2px horizontal internal padding, and 1px border.
  - *Verified / Cleared:* Green background `#E8F5E9`, text `#2E7D32`, border `#A5D6A7`.
  - *Discrepancy / Action Required:* Amber background `#FFF8E1`, text `#B78103`, border `#FFE082`.
  - *Quarantine / Non-Compliant:* Red background `#FFEBEE`, text `#C62828`, border `#FFCDD2`.
  - *Federal Chain of Custody Secure:* Deep Teal background `#E0F2F1`, text `#00695C`, border `#80CBC4`.

### Field Input Controls
- Touch-optimized text inputs with a minimum touch target height of 48px.
- Background: `#FFFFFF`, border: 1.5px solid `#CBD5E1`.
- Focus State: 2px solid `#1769AA` with a non-blurring 2px offset outline.
- Monospaced field variants for Serial Numbers, Lot Codes, NDC, and GTIN-14 inputs, enforcing uppercase input transforms and auto-segmentation formatting.

### Data-Centric Forensic Cards
- Bounded by 1px solid `#E2E8F0` with a top header strip (4px height) color-coded by the overarching compliance status.
- Key-Value display pairs stack metric label (`label-sm` in `#64748B`) directly above the data value (`body-md` in `#0F172A`, bold) with 2px vertical separation for high-speed scanning during transit and field conditions.