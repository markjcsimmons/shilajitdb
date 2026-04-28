# ShilajitDB Design System

**Status:** ✅ Implemented  
**Version:** 1.0  
**Last Updated:** April 27, 2026

---

## Overview

ShilajitDB uses a **bold, modern dark editorial design** optimized for data-driven clarity and high contrast. The system combines deep navy backgrounds with cobalt blue accents, creating an authoritative, analytical aesthetic that reinforces the database's research-backed mission.

## Visual Foundations

### Color Palette

#### Backgrounds
- **Page background:** `#080B14` — near-black navy, deep and immersive
- **Surface/Cards:** `#0F1320` — slightly lighter for card containers
- **Elevated surface:** `#171C2E` — for hover states and modal backgrounds
- **Deep surface:** `#1F2540` — for nested or tertiary surfaces

#### Text
- **Primary text:** `#FFFFFF` — pure white for maximum contrast and punch on dark backgrounds
- **Secondary text:** `#A0AACC` — readable slate-blue for body copy and descriptions
- **Muted text:** `#636A90` — for metadata, timestamps, and recessed labels
- **Inverted text:** `#080B14` — for text on light/accent backgrounds

#### Accents
- **Accent (Cobalt):** `#3D7AFF` — primary interactive color
- **Accent bright:** `#6E9FFF` — lighter variant for hover/focus states
- **Accent dim:** `#060E28` — background tint for accent-related contexts

#### Semantic Colors (Grade)
- **Ultra Premium:** `#22C55E` (green)
- **Premium:** `#3B82F6` (blue)
- **Average:** `#EAB308` (amber/yellow)
- **Poor:** `#EF4444` (red)

#### Borders
- **Default border:** `#252A40` — subtle warm-dark separator
- **Strong border:** `#313760` — for stronger visual separation

### Typography

#### Font Families
- **Display (Headings):** Playfair Display (serif) — authoritative, editorial
- **Body & UI:** DM Sans (sans-serif) — clean, readable, data-friendly
- **Monospace (Data):** JetBrains Mono — for scores, grades, numbers, technical elements

#### Type Scale
| Role | Font Size | Line Height | Weight | Font |
|------|-----------|-------------|--------|------|
| h1 | 48px (3rem) | 1.2 | 700 (bold) | Playfair Display |
| h2 | 30px (1.875rem) | 1.2 | 600 (semibold) | Playfair Display |
| h3 | 20px (1.25rem) | 1.35 | 600 (semibold) | DM Sans |
| Body | 16px (1rem) | 1.65 | 400 (regular) | DM Sans |
| Body Small | 14px (0.875rem) | 1.65 | 400 (regular) | DM Sans |
| Label | 12px (0.75rem) | 1.2 | 600 (semibold) | DM Sans, uppercase, 0.15em tracking |
| Data/Mono | 14px (0.875rem) | 1.2 | 500 (medium) | JetBrains Mono |

### Spacing System

Based on 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Minimal gaps, inline elements |
| space-2 | 8px | Small gaps, badge/pill padding |
| space-3 | 12px | Compact spacing |
| space-4 | 16px | Standard padding, gaps |
| space-6 | 24px | Section spacing |
| space-8 | 32px | Block spacing |
| space-12 | 48px | Major section separation |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 4px | Badge, pill edges |
| radius-md | 6px | Buttons, small interactive elements |
| radius-lg | 8px | Cards, moderately rounded containers |
| radius-xl | 12px | Large containers |
| radius-pill | 9999px | Fully rounded pills, toggles |

### Shadows

- **Card shadow (default):** `0 1px 3px rgba(0,0,0,.45), 0 0 0 1px #252A40`
- **Card shadow (hover):** `0 4px 16px rgba(0,0,0,.5), 0 0 0 1px #252A40`
- **Card shadow (elevated):** `0 8px 32px rgba(0,0,0,.6), 0 0 0 1px #252A40`

### Corner Radii & Shadows Details

- **Cards:** 8px radius, subtle 1px border
- **Buttons:** 6px radius
- **Badges/Tags:** 4px radius
- **Pills (Filter chips):** Fully rounded (9999px)
- **No drop shadows:** All shadows are minimal and include a 1px border for depth

---

## Components

### Product Card

**Usage:** Homepage product grid, search results

**Structure:**
1. Top section: Brand name (small caps label) + Product name (clickable) + Grade badge (right-aligned)
2. Meta pills: Quality tier, COA status, signals (heavy metals, best-for tags)
3. Bottom section: Price/metadata + COA button (if available)

**Colors:**
- Background: `#0F1320`, hover `#171C2E`
- Border: 1px `#252A40`
- Grade badge: Semantic color background with matching text

**Hover State:** Background lightens to `#171C2E`, shadow elevates to `0 4px 16px rgba(0,0,0,.65)`

### Filter Chips (Pills)

**Usage:** Quality tier, COA status, form filters

**Variants:**
- **Active:** Filled with cobalt (`#3D7AFF`), white text, checkmark icon
- **Inactive:** Transparent with border `#313760`, muted text `#8892B8`

**Interaction:** 150ms ease transition

### Buttons

**Primary:**
- Background: Cobalt `#3D7AFF`
- Text: Inverted `#080B14`
- Hover: Lighter cobalt `#6E9FFF`
- Border radius: 6px

**Secondary:**
- Background: Transparent
- Border: 1px `#313760`
- Text: `#EEF0F8`
- Hover: Background `#171C2E`, border `#313760`

### Navigation

**Header:**
- Sticky top, dark background with blur backdrop
- Wordmark: "Shilajit" in white + "DB" in cobalt
- Nav links: Small (13px), muted text, hover background lift

**Footer:**
- Multi-column layout with links grouped by category
- Text hierarchy: Headlines bold, links smaller + muted
- Footer meta line: Tagline left, "Unbiased · Comprehensive · Free" mono-label right

### Data Table

**Header row:**
- Background: `#171C2E`
- Text: `#636A90` muted, all-caps label style
- Border: 1px `#313760`

**Body rows:**
- Border: 1px `#252A40` between rows
- Hover: Background `#171C2E`
- Text color: `#EEF0F8` for key data, `#8892B8` for secondary

**Transition:** 100ms ease on background

---

## Pages & Layout

### Homepage (`/`)

**Sections:**
1. **Hero** — Large serif headline + supporting text + CTA buttons
2. **Stats bar** — 4-column grid showing key metrics (products graded, brands, COA %, last updated)
3. **Filter bar** — Category pills + search input + view toggle (grid/table)
4. **Top Picks** — 6 category cards (Best Tested, Best Value, Best Resin, Best Capsules, Best Gummies, Editor's Picks)
5. **How We Grade** — 3-column methodology overview cards
6. **Product results** — Grid or table view (depending on active filters)

**Grid width:** Maximum 1200px, centered, with padding on sides

### Database / Search Results

**Layout:**
- Search box top (full width)
- Filter bar below (horizontal pills + view toggle)
- Results grid (2 columns on desktop, responsive to 1 on mobile) or sortable table
- Pagination below results

**Empty state:** Card with dashed border, centered message, link to clear filters

### Learn Pages (`/learn`, `/learn/*`)

**Layout:** Single-column prose with max-width constraint  
**Headings:** Playfair Display serif  
**Body:** DM Sans with generous line-height (1.65)  
**Links:** Cobalt on hover (underline)

### Methodology (`/methodology`)

**Sections:**
- Intro paragraph
- Signal weights table (3-column: Signal, Points, Justification)
- Grade tier explanations (h2 + table of scoring tiers)
- Composite score methodology

**Table styling:** Light header row, alternating subtle backgrounds optional (not needed — clean dividing lines sufficient)

### About (`/about`)

**Prose layout:** Single column, serif headlines, generous spacing

### Updates (`/updates`)

**Layout:** Timeline grouped by date  
**Each entry:** Product card preview + badge (NEW if recently created)

---

## Interactions & States

### Hover States

- **Links:** Underline appears, text color brightens to cobalt
- **Cards:** Background `+8% lightness` (e.g., `#0F1320` → `#171C2E`), shadow elevates
- **Buttons:** Background shift, 100ms transition
- **Table rows:** Background `#171C2E` on hover

### Focus States

- **Keyboard focus:** 2px cobalt outline with 2px offset
- **Applied to all interactive elements**

### Animations

- **Transitions:** 100ms ease for background/color changes, 150ms for filter transitions
- **No bounces or large-scale animations** — data tools should feel immediate
- **Page transitions:** None (SPA-style instant updates)

---

## Accessibility

- **Contrast:** All text meets WCAG AA standards on dark backgrounds
- **Focus ring:** Visible 2px cobalt outline on all interactive elements
- **Semantic HTML:** Proper heading hierarchy (h1 → h2 → h3)
- **Form labels:** Associated with inputs
- **Icon text:** Accompanied by text labels where functionally important

---

## Implementation Notes

### Fonts

All fonts loaded from Google Fonts via `@font-face`:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### Tailwind Configuration

The project uses Tailwind CSS with hex color values directly in utilities. For consistency, consider creating a `colors` configuration in `tailwind.config.ts`:

```ts
colors: {
  'brand-bg': '#080B14',
  'brand-surface': '#0F1320',
  'brand-text-1': '#FFFFFF',
  'brand-text-2': '#A0AACC',
  'brand-text-3': '#636A90',
  'brand-accent': '#3D7AFF',
  // ... etc
}
```

### Component Library

No external component library is used. All components are custom-built in React/TSX, styled with Tailwind CSS.

---

## Design Principles

1. **Data-first:** Design supports information hierarchy, not decoration
2. **High contrast:** Dark navy + white + cobalt create clear visual separation
3. **Editorial tone:** Serif headlines convey authority and research-backed messaging
4. **Minimal motion:** Interactions feel immediate and responsive, not playful
5. **Consistent spacing:** 4px base unit ensures visual rhythm throughout
6. **Semantic color:** Grade colors (green/blue/yellow/red) reinforce meaning without explanation

---

## Changelog

### v1.0 (April 27, 2026)
- Initial design system implementation
- Color palette: navy + cobalt
- Typography: Playfair + DM Sans + JetBrains Mono
- Components: Cards, pills, buttons, tables, nav
- All pages implemented with design system tokens
