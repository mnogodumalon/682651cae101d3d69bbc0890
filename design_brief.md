# Design Brief: Schichtplaner

## 1. App Analysis

### What This App Does
This is a shift planning system (Schichtplaner) that allows managers to schedule employee shifts across different companies and shift types. The system tracks shift assignments with date, time, employee, shift type, and company information.

### Who Uses This
Shift managers or team leads who need to:
- See who is working today and this week at a glance
- Quickly assign new shifts to employees
- Track shift coverage across different shift types
- Manage schedules for potentially multiple companies

### The ONE Thing Users Care About Most
**"Who is working today?"** - The manager needs to immediately see today's shift coverage when they open the app. They want to know at a glance which employees are scheduled, what shift types are covered, and if there are any gaps.

### Primary Actions (IMPORTANT!)
1. **Neue Schicht eintragen** (Add new shift) - Primary Action Button - This is what managers do constantly
2. View shift details
3. Navigate between days/weeks

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a deep indigo accent on a warm off-white base to create a professional, trustworthy feel appropriate for workforce management. The warmth of the background prevents the "sterile office software" feel while the indigo brings a modern, capable energy. The asymmetric layout with a prominent calendar week view immediately signals "scheduling app" without needing explanation.

### Layout Strategy
- **Hero element:** Today's shift summary card takes 65% of the top section with bold shift count and employee avatars
- **Desktop split:** 60/40 left-heavy - main content (hero + weekly overview) on left, upcoming shifts list on right
- **Visual tension:** The hero uses massive typography (48px shift count) while secondary stats are compact inline badges
- **Mobile:** Hero dominates first viewport, then scrolls to compact daily timeline

### Unique Element
The "Today's Coverage" hero card features a horizontal row of stacked employee initials (like Slack avatars) showing who's on shift today. This creates immediate visual recognition - managers know their team by face/initials. The indigo accent rings around active shifts create a subtle pulse of activity.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap`
- **Why this font:** Professional yet friendly geometric sans-serif. The rounded terminals soften the corporate feel while maintaining excellent readability. Weight range allows strong hierarchy from light labels to bold numbers.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(40 33% 98%)` | `--background` |
| Main text | `hsl(230 25% 18%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(230 25% 18%)` | `--card-foreground` |
| Borders | `hsl(40 20% 90%)` | `--border` |
| Primary action | `hsl(243 75% 58%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(243 75% 95%)` | `--accent` |
| Muted background | `hsl(40 20% 96%)` | `--muted` |
| Muted text | `hsl(230 10% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(152 60% 40%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The warm cream background (`hsl(40 33% 98%)`) creates an inviting, non-clinical workspace feel. The deep indigo primary (`hsl(243 75% 58%)`) is distinctive without being playful - it conveys reliability and professionalism essential for business scheduling software. The color is rich enough to stand out but mature enough for daily work use.

### Background Treatment
Solid warm off-white. The warmth comes from the subtle yellow undertone in the HSL (hue 40). Cards are pure white to create subtle lift. No gradients - the warmth and card separation provide enough visual interest.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Mobile is designed for the "quick morning check" use case - manager glances at phone to see who's working. The hero takes the full first viewport with massive numbers. Secondary info requires scrolling. Asymmetry exists in how the hero dominates vs. compressed supporting info.

### What Users See (Top to Bottom)

**Header:**
- App title "Schichtplaner" (left, 20px semibold)
- Company filter dropdown if multiple companies (right, compact)

**Hero Section (The FIRST thing users see):**
- Large card taking ~70% of viewport height
- "Heute" label (14px muted)
- Massive shift count "5 Schichten" (48px extra-bold indigo)
- Horizontal row of employee initial badges (36px circles, stacked with -8px overlap)
- Time range summary below: "06:00 - 22:00" (14px muted)
- Subtle indigo left border accent (4px)
- **Why this is the hero:** Answers "who's working today?" instantly without reading

**Section 2: Quick Stats Row**
- Horizontal scrollable row of compact stat badges (not cards)
- "Diese Woche: 24 Schichten" | "8 Mitarbeiter" | "3 Schichtarten"
- Each stat is inline text with small icon, not a separate card
- Creates density contrast with spacious hero

**Section 3: Nächste Schichten (Upcoming Shifts)**
- Simple list view (not cards)
- Each item: Employee name, shift type badge, time
- Grouped by day with sticky date headers
- Shows next 7 days
- Tap to see details (bottom sheet)

**Bottom Navigation / Action:**
- Fixed bottom bar with prominent "Neue Schicht" button (full-width, 56px height)
- Indigo background, white text, rounded corners
- Icon (plus) + text

### What is HIDDEN on Mobile
- Weekly calendar grid (too small to be useful)
- Detailed shift times table
- Company details
- Historical data

### Touch Targets
- All interactive elements minimum 44px height
- Employee badges 36px with 8px padding
- List items full-width tap target, 56px minimum height

### Interactive Elements
- Tap on employee badge → shows their shifts for today
- Tap on shift list item → bottom sheet with full shift details

---

## 5. Desktop Layout

### Overall Structure
60/40 left-heavy asymmetric split. The eye flows: hero stats (top-left dominant) → weekly calendar (left below) → upcoming list (right column for reference). The left column owns the narrative, the right provides supporting detail.

### Column Layout
- **Left column (60%):** Hero stats card + Weekly calendar view
- **Right column (40%):** Upcoming shifts list + Quick add form

The left is for understanding the big picture. The right is for action and detail.

### Layout Diagram (ASCII)
```
┌────────────────────────────────────────┐  ┌─────────────────────────────┐
│         HEADER: Schichtplaner          │  │    [+ Neue Schicht]         │
└────────────────────────────────────────┘  └─────────────────────────────┘

┌────────────────────────────────────────┐  ┌─────────────────────────────┐
│                                        │  │                             │
│   HERO: Heute                          │  │   NÄCHSTE SCHICHTEN         │
│   ┌─────────┐                          │  │                             │
│   │ 5       │  Schichten heute         │  │   ─────────────────────     │
│   │ ●●●●●   │  06:00 - 22:00           │  │   Mo 13.01.                 │
│   └─────────┘                          │  │   · Max M. - Früh 06-14     │
│                                        │  │   · Anna S. - Spät 14-22   │
│   Quick stats: 24 diese Woche │ 8 MA   │  │   ─────────────────────     │
│                                        │  │   Di 14.01.                 │
└────────────────────────────────────────┘  │   · Lisa K. - Früh 06-14    │
                                            │   ...                        │
┌────────────────────────────────────────┐  │                             │
│                                        │  │                             │
│   WOCHENÜBERSICHT                      │  │                             │
│   ┌────┬────┬────┬────┬────┬────┬────┐ │  │                             │
│   │ Mo │ Di │ Mi │ Do │ Fr │ Sa │ So │ │  │                             │
│   │ 5  │ 4  │ 6  │ 5  │ 4  │ 2  │ 1  │ │  │                             │
│   └────┴────┴────┴────┴────┴────┴────┘ │  │                             │
│                                        │  │                             │
└────────────────────────────────────────┘  └─────────────────────────────┘
```

### What Appears on Hover
- Week day columns: highlight with accent background, show employee names tooltip
- Shift list items: subtle lift shadow, show "Bearbeiten" action
- Employee badges: show full name tooltip

### Clickable/Interactive Areas
- Week day columns → click to filter/focus that day
- Shift list items → click to open edit dialog
- Employee badges → click to see employee's schedule

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Heute (Today)
- **Data source:** Schichteinteilung (filtered by today's date)
- **Calculation:** Count of shifts where zuweisung_datum = today
- **Display:** Large number (48px bold) + employee avatar row + time span
- **Context shown:** Time range of shifts (earliest start to latest end), employee initials
- **Why this is the hero:** Managers' #1 question is "who's working today?" - this answers it instantly

### Secondary KPIs

**Schichten diese Woche**
- Source: Schichteinteilung (current week)
- Calculation: Count of shifts in current Mon-Sun
- Format: number
- Display: Inline badge with icon

**Aktive Mitarbeiter**
- Source: Mitarbeiterverwaltung
- Calculation: Count of unique employees with shifts this week
- Format: number
- Display: Inline badge with icon

**Schichtarten**
- Source: Schichtartenverwaltung
- Calculation: Count of distinct shift types used this week
- Format: number
- Display: Inline badge with icon

### Chart: Weekly Overview

- **Type:** Bar chart - shows shift distribution across weekdays. Bar height immediately shows busy vs. light days.
- **Title:** Wochenübersicht
- **What question it answers:** Which days have most coverage? Are there gaps?
- **Data source:** Schichteinteilung (current week)
- **X-axis:** Weekday (Mo, Di, Mi, Do, Fr, Sa, So)
- **Y-axis:** Number of shifts
- **Mobile simplification:** Compact horizontal bar chart, or hidden entirely (replaced by quick stats)

### Lists/Tables

**Nächste Schichten (Upcoming Shifts)**
- Purpose: See what's coming up, act on upcoming shifts
- Source: Schichteinteilung (next 7 days)
- Fields shown: Employee name (from applookup), shift type name, date, time (zuweisung_beginn - zuweisung_ende)
- Mobile style: Simple list with date headers
- Desktop style: Compact list with inline date badges
- Sort: By zuweisung_datum ascending, then zuweisung_beginn
- Limit: 15 items

### Primary Action Button (REQUIRED!)

- **Label:** Neue Schicht
- **Action:** add_record
- **Target app:** Schichteinteilung
- **What data:** Form fields: zuweisung_datum (date picker), zuweisung_mitarbeiter (select from Mitarbeiterverwaltung), zuweisung_schichtart (select from Schichtartenverwaltung), zuweisung_beginn, zuweisung_ende, zuweisung_unternehmen (if multiple), zuweisung_notiz (optional)
- **Mobile position:** bottom_fixed (sticky footer button)
- **Desktop position:** header (top right prominent button)
- **Why this action:** Creating shifts is the core workflow. Managers add shifts daily as schedules change. One tap access is essential.

---

## 7. Visual Details

### Border Radius
Rounded (8px) - `--radius: 0.5rem`
- Cards: 12px for larger cards, 8px for smaller elements
- Buttons: 8px
- Badges/pills: 20px (full pill for small tags)

### Shadows
Subtle - cards have light shadow for depth without heaviness
- Cards: `0 1px 3px hsl(230 25% 18% / 0.06), 0 1px 2px hsl(230 25% 18% / 0.04)`
- Hover: `0 4px 12px hsl(230 25% 18% / 0.1)`

### Spacing
Normal with generous hero spacing
- Base unit: 16px
- Card padding: 24px (desktop), 16px (mobile)
- Hero internal spacing: 32px
- Between sections: 24px
- Compact list items: 12px vertical

### Animations
- **Page load:** Stagger fade-in for cards (100ms delay between)
- **Hover effects:** Subtle lift (translateY -2px) + shadow increase on cards
- **Tap feedback:** Scale down 98% on press

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --radius: 0.5rem;
  --background: hsl(40 33% 98%);
  --foreground: hsl(230 25% 18%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(230 25% 18%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(230 25% 18%);
  --primary: hsl(243 75% 58%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(40 20% 96%);
  --secondary-foreground: hsl(230 25% 18%);
  --muted: hsl(40 20% 96%);
  --muted-foreground: hsl(230 10% 45%);
  --accent: hsl(243 75% 95%);
  --accent-foreground: hsl(243 75% 45%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(40 20% 90%);
  --input: hsl(40 20% 90%);
  --ring: hsl(243 75% 58%);
  --chart-1: hsl(243 75% 58%);
  --chart-2: hsl(152 60% 40%);
  --chart-3: hsl(40 90% 50%);
  --chart-4: hsl(280 60% 55%);
  --chart-5: hsl(200 75% 50%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Plus Jakarta Sans)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4 (hero dominant, fixed bottom button)
- [ ] Desktop layout matches Section 5 (60/40 asymmetric split)
- [ ] Hero element is prominent as described (48px bold count, employee avatars)
- [ ] Colors create the mood described in Section 2 (warm + indigo professional)
- [ ] Primary action "Neue Schicht" button is prominently placed
- [ ] Weekly bar chart shows shift distribution
- [ ] Upcoming shifts list shows next 7 days grouped by date
- [ ] Employee names resolved from applookup references
- [ ] Shift type names resolved from applookup references
