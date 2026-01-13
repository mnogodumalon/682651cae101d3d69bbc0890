# Design Brief: Schichtplaner Dashboard

## 1. App Analysis

### What This App Does
The Schichtplaner (Shift Planner) is a workforce management system for scheduling employee shifts across companies. It manages employees (Mitarbeiterverwaltung), shift types (Schichtartenverwaltung), companies/locations (Unternehmensverwaltung), and the actual shift assignments (Schichteinteilung) that connect employees to specific shifts on specific dates.

### Who Uses This
Operations managers, team leads, or small business owners who need to quickly see today's and upcoming shifts, identify coverage gaps, and assign employees to shifts. They're busy, often checking the app on mobile between tasks. They need instant clarity on "who's working when."

### The ONE Thing Users Care About Most
**Today's shift schedule** - Who is working right now and who is coming in next. This is the heartbeat of any shift management tool. Managers need to see at a glance if shifts are covered.

### Primary Actions (IMPORTANT!)
1. **Schicht zuweisen** → Primary Action Button (assign a new shift to an employee)
2. View shift details (tap on a shift to see more info)
3. Navigate between days/weeks

---

## 2. What Makes This Design Distinctive

### Visual Identity
A calm, professional design with a cool slate-blue base that evokes reliability and order - essential qualities for workforce management. The accent color is a warm amber-orange that stands out against the cool tones, drawing attention to important actions and time-sensitive information. The design feels like a modern operations center: organized, clear, and actionable.

### Layout Strategy
The hero element is a **timeline-style view of today's shifts** taking 65% of the viewport width on desktop. This isn't a generic KPI card - it's a horizontal timeline showing who's working when, making scheduling gaps immediately visible. The narrow right column (35%) contains quick stats: total shifts today, employees working, and upcoming shifts. On mobile, the timeline becomes a vertical list with large touch targets, and stats are compressed into a compact horizontal scroll at the top.

### Unique Element
The **shift timeline blocks** are color-coded by shift type (Frühschicht, Spätschicht, Nachtschicht) with subtle gradients and employee initials in avatar circles. Each block shows start-end time with a visual width proportional to duration, making it instantly clear how shifts overlap or leave gaps. The current time is marked with an animated vertical line that pulses gently.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap`
- **Why this font:** Professional yet approachable, excellent readability at small sizes, and distinctive enough to avoid the generic "corporate dashboard" feel. The rounded terminals give it warmth without sacrificing professionalism.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(215 25% 97%)` | `--background` |
| Main text | `hsl(220 25% 10%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(220 25% 10%)` | `--card-foreground` |
| Borders | `hsl(215 20% 88%)` | `--border` |
| Primary action | `hsl(25 95% 53%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(215 70% 55%)` | `--accent` |
| Muted background | `hsl(215 20% 94%)` | `--muted` |
| Muted text | `hsl(215 15% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(150 60% 40%)` | (component use) |
| Error/negative | `hsl(0 70% 50%)` | `--destructive` |

### Why These Colors
The cool slate-blue base (`hsl(215...)`) creates a calm, professional atmosphere - perfect for an app managers check frequently. The warm amber-orange primary (`hsl(25 95% 53%)`) creates strong contrast for the call-to-action, signaling "this is where you take action." The blue accent is used for interactive elements and highlights. Together they create a professional but not sterile environment.

### Background Treatment
A subtle cool-toned off-white (`hsl(215 25% 97%)`) that's warmer than pure white but maintains the professional feel. Cards are pure white to create clear visual separation and layer hierarchy.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
The mobile layout prioritizes today's shifts as a vertical scrolling list that dominates the viewport. Quick stats are compressed into a horizontally scrollable row of compact badges at the top - not full cards. The hero (shift list) takes 75% of visual attention, with stats serving as context. The primary action floats at the bottom for thumb-friendly access.

### What Users See (Top to Bottom)

**Header:**
- App title "Schichtplaner" in semibold 20px, left-aligned
- Today's date below title in muted text, 14px
- Small filter icon (right) to access date picker

**Quick Stats Row (Horizontal Scroll):**
- Compact badges showing: "5 Schichten heute", "4 Mitarbeiter", "2 offen"
- Each badge is pill-shaped, subtle background, small text (13px)
- Scrolls horizontally if needed, no more than 3-4 items visible

**Hero Section: Today's Shifts (The FIRST thing users see)**
- Takes remaining viewport (~70% of screen height)
- Vertical list of shift cards, each showing:
  - Employee avatar (initials) on left
  - Employee name (bold 16px) + shift type badge
  - Time range below (14px muted): "06:00 - 14:00"
  - Company name if multiple exist (12px, very muted)
- Cards have 12px border-radius, subtle shadow
- Active/current shift has a colored left border (4px, accent color)
- Why hero: Managers need instant answer to "who is working now"

**Section 2: Upcoming Tomorrow**
- Simple header "Morgen" with count badge
- Condensed list (smaller cards, 2-3 items max)
- "Alle anzeigen" link if more items exist

**Bottom Navigation / Action:**
- Fixed bottom bar with prominent "Schicht zuweisen" button
- Full-width button, 56px height, amber-orange background
- Plus icon + text, rounded corners (12px)

### What is HIDDEN on Mobile
- Weekly overview chart (not essential for quick checks)
- Employee list (accessible via tap-through)
- Detailed company information
- Shift type management

### Touch Targets
- All cards minimum 48px touch height
- Primary action button 56px height
- Avatar/badges 40px tap targets

### Interactive Elements
- Tap on shift card → opens detail sheet (shows full info, edit option)
- Tap on employee avatar → shows employee contact info
- Tap on stat badge → filters to that category
- Pull down → refresh data

---

## 5. Desktop Layout

### Overall Structure
A 65/35 left-heavy split that puts the interactive shift timeline front and center. The left column contains the day's shift timeline visualization - a horizontal bar chart where each employee is a row and shifts are colored blocks. The right column contains supporting KPIs, a mini-calendar for navigation, and upcoming shifts list. Eye flow: timeline (left) → current time marker → stats (top-right) → calendar (middle-right) → upcoming (bottom-right).

### Column Layout
- **Left column (65%):** Today's shift timeline - the main interactive area. Each row represents an employee with their shift as a horizontal bar showing time. Above the timeline: day navigation (previous/today/next) and date display.
- **Right column (35%):** Stacked components - KPI row at top (3 small inline stats), compact calendar widget below, then upcoming shifts list.

### Layout Diagram (ASCII)
```
┌─────────────────────────────────────────┐  ┌─────────────────────┐
│  ← Gestern   HEUTE (Di, 14.01)  Morgen →│  │ 8 Schichten  4 MA   │
├─────────────────────────────────────────┤  │ 1 Lücke             │
│     06  08  10  12  14  16  18  20  22  │  ├─────────────────────┤
│ ┌─────────────────────────────────────┐ │  │   [ Mini Calendar ] │
│ │ M. Schmidt  ████████████            │ │  │   Januar 2026       │
│ │ A. Weber         ████████████       │ │  │   [13][14][15][16]  │
│ │ K. Fischer                ██████████│ │  ├─────────────────────┤
│ │ L. Braun    ██████████              │ │  │ Morgen              │
│ └─────────────────────────────────────┘ │  │ • M. Schmidt 06-14  │
│              ↑ current time marker      │  │ • A. Weber 10-18    │
└─────────────────────────────────────────┘  │ • Mehr anzeigen...  │
                                             └─────────────────────┘
                           [ + Schicht zuweisen ]
```

### What Appears on Hover
- Shift blocks: Show tooltip with full details (employee name, shift type, start-end, company, notes)
- Employee names: Show quick-view card with contact info
- Calendar days: Show shift count for that day
- Stats: Show breakdown (e.g., "4 Mitarbeiter" → list of names)

### Clickable/Interactive Areas
- Shift blocks → Opens detail dialog with edit/delete options
- Employee row → Opens employee detail view
- Calendar day → Navigates to that day's schedule
- "Schicht zuweisen" button → Opens assignment form dialog
- Empty timeline areas → Click to create shift at that time

---

## 6. Components

### Hero KPI (Timeline View - Desktop) / Shift List (Mobile)
The MOST important element: the visual representation of today's shifts.

- **Title:** Heutige Schichten
- **Data source:** Schichteinteilung (filtered by today's date)
- **Calculation:** Filter records where `zuweisung_datum` equals today
- **Display:**
  - Desktop: Horizontal timeline with employee rows and time-based shift blocks
  - Mobile: Vertical card list sorted by start time
- **Context shown:** Current time indicator, shift type colors, coverage gaps visible as empty space
- **Why this is the hero:** This answers the #1 question: "Who is working today and when?" Visual timeline makes gaps instantly obvious.

### Secondary KPIs

**Schichten heute (Shifts Today)**
- Source: Schichteinteilung
- Calculation: Count where date = today
- Format: number
- Display: Inline stat, medium weight

**Mitarbeiter im Einsatz (Employees Working)**
- Source: Schichteinteilung joined with Mitarbeiterverwaltung
- Calculation: Count distinct employees with shifts today
- Format: number
- Display: Inline stat, medium weight

**Offene Schichten (Unassigned)**
- Source: Could be calculated if shift types define required coverage
- Calculation: (For now, placeholder - show 0 or count orphaned shift types)
- Format: number with warning color if > 0
- Display: Inline stat, alert styling if non-zero

### Chart: Weekly Overview (Desktop Only)
- **Type:** Stacked bar chart - shows daily shift counts by type
- **Title:** Diese Woche
- **What question it answers:** How is this week's coverage looking? Any days understaffed?
- **Data source:** Schichteinteilung filtered to current week
- **X-axis:** Days of week (Mo-So), current day highlighted
- **Y-axis:** Number of shifts
- **Colors:** Each shift type (Schichtart) gets a color from a defined palette
- **Mobile simplification:** Not shown on mobile (hidden)

### Lists/Tables

**Upcoming Shifts (Morgen)**
- Purpose: Preview tomorrow's schedule for planning
- Source: Schichteinteilung where date = tomorrow
- Fields shown: Employee name, time range, shift type badge
- Mobile style: Compact cards, max 3 shown with "mehr anzeigen" link
- Desktop style: Simple list in sidebar
- Sort: By start time ascending
- Limit: 5 items

**Mini Calendar Widget (Desktop Only)**
- Purpose: Quick navigation between days
- Shows: Current month with shift counts per day as dots/badges
- Interactive: Click day to navigate
- Highlights: Today, days with shifts, days without coverage

### Primary Action Button (REQUIRED!)

- **Label:** "Schicht zuweisen" (mobile: "+" icon with label)
- **Action:** add_record
- **Target app:** Schichteinteilung
- **What data:** Form with fields:
  - Date picker (default: today)
  - Employee select (dropdown from Mitarbeiterverwaltung)
  - Shift type select (dropdown from Schichtartenverwaltung)
  - Start time, End time (can prefill from shift type)
  - Company select (if multiple)
  - Notes (optional textarea)
- **Mobile position:** bottom_fixed - full-width button at bottom
- **Desktop position:** header area, right side - prominent button
- **Why this action:** The core purpose of a shift planner is to assign shifts. This must be one tap/click away.

---

## 7. Visual Details

### Border Radius
- Cards: 12px (rounded, friendly)
- Buttons: 10px
- Badges/pills: 20px (fully rounded)
- Input fields: 8px
- Shift blocks in timeline: 6px

### Shadows
- Cards: `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` - subtle elevation
- Dialogs: `0 10px 40px rgba(0,0,0,0.12)` - elevated for focus
- Buttons on hover: subtle lift effect

### Spacing
- Normal to spacious - breathing room is important for scannability
- Card padding: 20px desktop, 16px mobile
- Section gaps: 24px
- Element gaps within cards: 12px

### Animations
- **Page load:** Stagger fade-in for cards (100ms delay each)
- **Hover effects:** Subtle scale (1.01) on cards, background color shift on buttons
- **Tap feedback:** Quick scale pulse (0.98 → 1)
- **Timeline:** Current time marker has gentle pulse animation
- **Data loading:** Skeleton screens matching final layout

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(215 25% 97%);
  --foreground: hsl(220 25% 10%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(220 25% 10%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(220 25% 10%);
  --primary: hsl(25 95% 53%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(215 20% 94%);
  --secondary-foreground: hsl(220 25% 10%);
  --muted: hsl(215 20% 94%);
  --muted-foreground: hsl(215 15% 45%);
  --accent: hsl(215 70% 55%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 70% 50%);
  --border: hsl(215 20% 88%);
  --input: hsl(215 20% 88%);
  --ring: hsl(25 95% 53%);
  --radius: 0.75rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Plus Jakarta Sans font loaded from Google Fonts URL
- [ ] All CSS variables copied exactly as specified
- [ ] Mobile layout shows vertical shift list, horizontal stats scroll
- [ ] Desktop layout shows 65/35 split with timeline on left
- [ ] Hero element (timeline/shift list) is prominent and takes most viewport
- [ ] Colors create calm, professional mood with amber action accent
- [ ] Primary action "Schicht zuweisen" is always visible and accessible
- [ ] Shift cards show employee initials in avatar, name, time range
- [ ] Current time marker visible in desktop timeline
- [ ] Clicking shifts opens detail view
- [ ] Date navigation works (previous/today/next)
- [ ] Loading states use skeleton screens
