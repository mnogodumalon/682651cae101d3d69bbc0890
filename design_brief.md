# Design Brief: Schichtplaner Dashboard

## 1. App Analysis

### What This App Does
Manages companies, employees, shift types, and daily shift assignments to keep staffing organized across locations. Provides visibility into who is scheduled when, and where coverage gaps exist.

### Who Uses This
Team leads or dispatchers coordinating shifts for multiple companies/locations who need quick insight into today’s coverage and the upcoming week, plus easy tools to assign or adjust shifts.

### The ONE Thing Users Care About Most
Seeing whether today and the next few days are properly staffed, and quickly assigning or adjusting shifts when there are gaps.

### Primary Actions (IMPORTANT!)
1. Neue Schicht zuweisen → Primary Action Button
2. Schichtdetails prüfen (hover/click into lists)
3. Mitarbeiterkontakt öffnen (from assignments list)

---

## 2. What Makes This Design Distinctive

### Visual Identity
Calm, professional feel with a warm ivory base and a deep saffron accent reminiscent of scheduling boards. Manrope’s rounded, confident letterforms keep data approachable while still sharp for operations.

### Layout Strategy
Asymmetric layout with a hero “Heutige Besetzung” card spanning the top left to dominate attention. Right side holds a compact “Nächste Schichten” list for immediate actions. Below, a two-column split: left shows weekly load bar chart; right shows shift-type mix pie and a compact stats strip. Size variation (wide hero, tall list, mixed charts) and generous whitespace create flow.

### Unique Element
Hero KPI uses a subtle pill header with a glowing saffron underline and a stacked mini-progress bar indicating today’s coverage vs goal, making the most important signal feel like a control center status tile.

---

## 3. Theme & Colors

### Font
- **Family:** Manrope
- **URL:** `https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700&display=swap`
- **Why this font:** Geometric yet friendly, great legibility for data-heavy views while feeling modern and intentional.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(42 42% 97%)` | `--background` |
| Main text | `hsl(220 24% 16%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(220 24% 16%)` | `--card-foreground` |
| Borders | `hsl(36 22% 86%)` | `--border` |
| Primary action | `hsl(35 86% 55%)` | `--primary` |
| Text on primary | `hsl(42 100% 98%)` | `--primary-foreground` |
| Accent highlight | `hsl(28 78% 64%)` | `--accent` |
| Muted background | `hsl(40 24% 94%)` | `--muted` |
| Muted text | `hsl(220 12% 40%)` | `--muted-foreground` |
| Success/positive | `hsl(142 45% 36%)` | (component use) |
| Error/negative | `hsl(0 68% 50%)` | `--destructive` |

### Why These Colors
Ivory base reduces glare and feels operational yet warm. Saffron/orange accent signals action/urgency suited to scheduling. Deep charcoal text ensures readability; muted grays keep dense data calm.

### Background Treatment
Soft vertical gradient from `hsl(42 42% 97%)` to `hsl(40 28% 96%)` with faint noise texture implied in cards via subtle shadows—keeps the page from feeling flat while remaining light.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Single-column scroll with oversized hero at the top, followed by horizontally scrollable KPI chips for quick glance, then stacked lists/charts. Primary action floats as a bottom-right pill for thumb reach.

### What Users See (Top to Bottom)

**Header:**
- Title “Schichtplaner”
- Compact filter button (date range) and overflow menu (icon)

**Hero Section (The FIRST thing users see):**
- “Heutige Besetzung” card occupying most of the first viewport height (~55%). Large number showing assigned staff today vs planned goal (e.g., `12/14`), colored bar showing coverage %, with small badges for date and company filter. Dominant saffron underline under the title.

**Section 2: KPI Carousel**
- Horizontal scroll chips: “Schichten diese Woche”, “Freie Slots heute”, “Meistgenutzte Schichtart”, “Mitarbeiter ohne Schicht heute”. Each chip is compact, pill-shaped with icon and number.

**Section 3: Nächste Schichten**
- Stacked list of the next 5 assignments with name, company badge, shift type badge, time range, date. Tappable rows.

**Section 4: Wochenübersicht**
- Compact bar chart (5–7 days) showing count of shifts per day; tap shows tooltip.

**Section 5: Schichtarten-Mix**
- Donut chart summarizing shift type distribution this week with legend below.

**Bottom Navigation / Action:**
- Floating primary button “Schicht zuweisen” in bottom thumb zone.

### Mobile-Specific Adaptations
- Charts simplified: fewer ticks, stacked legends below. Lists use larger tap areas and avoid dense tables. KPI chips use horizontal scroll to avoid vertical clutter.

### Touch Targets
- Buttons ≥44px height, list rows padded 14–16px, floating action button with pill shape and shadow for clear affordance.

### Interactive Elements (if applicable)
- Tapping a list item opens detail drawer; tapping KPI chips switches the chart focus (e.g., filter week range). Hover states omitted; rely on tactile feedback.

---

## 5. Desktop Layout

### Overall Structure
Asymmetric 2-column grid:
- Left (60%): hero + weekly bar chart stacked.
- Right (40%): next shifts list on top, shift-type donut + compact KPI strip below.
Eye path: Hero → Next Shifts → Weekly chart → Shift-type mix.

### Section Layout
- Top row: Hero card wide left; right column shows “Nächste Schichten” list (scrollable area with 6–8 items).
- Second row: Left column “Wochenübersicht” bar chart. Right column: donut chart and below it a row of small KPI tiles (free slots, top shift type, unassigned).
- Primary action button sits in header/right-aligned near filters.

### What Appears on Hover
- List rows: show contact icons (email/phone) on hover.
- Chart bars/slices: tooltip with counts and percentage.
- KPI tiles: subtle lift/shadow.

### Clickable/Interactive Areas (if applicable)
- List rows click to open details (assignment form).
- Hero coverage bar click opens today’s assignments filtered.

---

## 6. Components

### Hero KPI
- **Title:** Heutige Besetzung
- **Data source:** Schichteinteilung
- **Calculation:** Count of assignments for today (by `zuweisung_datum` == today). Coverage % = assigned / planned goal (goal configurable; fallback using shift types count or default 12).
- **Display:** Large `assigned/goal` number with label “heute”, progress bar, small badge for date and company filter.
- **Context shown:** Coverage % text and delta vs goal (goal minus assigned). Color shifts to success if ≥100%.
- **Why this is the hero:** Immediate operational question is whether today is covered.

### Secondary KPIs
**Schichten diese Woche**
- Source: Schichteinteilung
- Calculation: Count assignments where date is within current week.
- Format: Integer.
- Display: Card/chip with calendar icon.

**Freie Slots heute**
- Source: Schichteinteilung + goal
- Calculation: max(goal - assigned today, 0).
- Format: Integer.
- Display: Muted card with warning accent if >0.

**Meistgenutzte Schichtart**
- Source: Schichteinteilung + Schichtartenverwaltung
- Calculation: Mode of `zuweisung_schichtart` for current week; show name.
- Format: Text + count.
- Display: Small card with badge color accent.

**Mitarbeiter ohne Schicht heute**
- Source: Mitarbeiterverwaltung + Schichteinteilung
- Calculation: Employees minus those assigned today.
- Format: Integer.
- Display: Card with neutral background; turns accent if >0.

### Chart (if applicable)
- **Type:** Bar chart
- **Title:** Wochenübersicht
- **What question it answers:** Are we balanced across the week? Shows counts per day.
- **Data source:** Schichteinteilung
- **X-axis:** Day label (Mon–Sun) from `zuweisung_datum`
- **Y-axis:** Count of shifts
- **Mobile simplification:** Fewer ticks, tighter bars, legend below.

### Chart 2
- **Type:** Donut chart
- **Title:** Schichtarten-Mix
- **Question:** Which shift types dominate this week?
- **Data source:** Schichteinteilung + Schichtartenverwaltung (lookup names)
- **Mobile simplification:** Minimal legend under chart.

### Lists/Tables
**Nächste Schichten**
- Purpose: Quick glance at upcoming assignments and contact.
- Source: Schichteinteilung (sorted by date/time ascending)
- Fields shown: Mitarbeiter name, company badge, shift type badge, date, time range, note icon if present.
- Mobile style: Card rows with stacked text and colored pills.
- Desktop style: Table-like list with compact badges; hover reveals contact icons.
- Sort: by `zuweisung_datum` then `zuweisung_beginn`.
- Limit: 8 items desktop, 5 mobile.

### Primary Action Button (REQUIRED!)
- **Label:** Schicht zuweisen
- **Action:** add_record
- **Target app:** Schichteinteilung
- **What data:** Mitarbeiter (lookup), Unternehmen (lookup), Schichtart (lookup), Datum (date), Beginn (text), Ende (text), Notiz (textarea).
- **Mobile position:** bottom_fixed pill button.
- **Desktop position:** header right-aligned.
- **Why this action:** Core operational task is assigning shifts; everything else supports this.

---

## 7. Visual Details

### Border Radius
Rounded (12px cards, 999px for pills/hero underline).

### Shadows
Subtle: `0 12px 30px rgba(34, 41, 47, 0.06)` on hero and charts; lighter `0 8px 16px rgba(34, 41, 47, 0.04)` on small cards.

### Spacing
Spacious with 16px base grid; hero uses 24px padding; gutters 20–24px to keep airiness.

### Animations
- **Page load:** soft fade + staggered cards.
- **Hover effects:** slight lift + color shift on cards; underline glow on hero title.
- **Tap feedback:** scale 0.98 on tap for mobile buttons.

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --background: hsl(42 42% 97%);
  --foreground: hsl(220 24% 16%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(220 24% 16%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(220 24% 16%);
  --primary: hsl(35 86% 55%);
  --primary-foreground: hsl(42 100% 98%);
  --secondary: hsl(40 24% 94%);
  --secondary-foreground: hsl(220 24% 16%);
  --muted: hsl(40 24% 94%);
  --muted-foreground: hsl(220 12% 40%);
  --accent: hsl(28 78% 64%);
  --accent-foreground: hsl(220 24% 16%);
  --destructive: hsl(0 68% 50%);
  --border: hsl(36 22% 86%);
  --input: hsl(36 22% 86%);
  --ring: hsl(35 86% 55%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described
- [ ] Colors create the mood described in Section 2
