# Design Brief: Schichtplaner Dashboard

## 1. App Analysis

### What This App Does
Schichtplaner is a workforce shift scheduling system for businesses. It manages employees, defines shift types (Frühschicht, Spätschicht, etc.), and assigns workers to specific shifts on specific dates. The core workflow is: define shift types → assign employees to shifts → track who works when.

### Who Uses This
Shift managers or small business owners who need a quick overview of daily staffing. They check the dashboard multiple times per day to see who's working, upcoming shifts, and to quickly add new shift assignments.

### The ONE Thing Users Care About Most
**Today's shifts** - Who is working TODAY? This is what they check first thing every morning and throughout the day.

### Primary Actions (IMPORTANT!)
1. **Neue Schicht eintragen** → Primary Action Button (add a shift assignment)
2. View shift details by tapping on a shift
3. See weekly overview

---

## 2. What Makes This Design Distinctive

### Visual Identity
This dashboard uses a **professional, industrial aesthetic** that suits a workforce management tool. The cool slate-blue background creates a calm, serious tone appropriate for business operations. The warm amber accent color (#f59e0b tones) provides clear visual anchors for time-related elements and actions, subtly evoking the idea of clock faces and shift timing. Typography is clean and efficient - this is a tool, not a lifestyle app.

### Layout Strategy
- **Hero element:** Today's shift timeline dominates the view - a tall, vertical list showing current and upcoming shifts with prominent time indicators
- **Asymmetric layout** on desktop: 70/30 split with the shift timeline taking the larger portion, stats and quick actions in the narrower column
- **Visual interest** created through:
  - Large time stamps (24px bold) contrasting with smaller employee names (14px regular)
  - Color-coded shift types using subtle background tints
  - Generous vertical spacing between shift cards creating breathing room
  - The hero section uses a slightly elevated card with subtle shadow to lift it from the page

### Unique Element
**Shift time indicators** - Each shift displays its time range as a bold, monospace-styled badge on the left edge of the card, creating a visual "timeline ruler" effect. The current active shift has a pulsing amber dot indicator, making it immediately obvious who's working RIGHT NOW.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap`
- **Why this font:** Space Grotesk has a technical, systematic feel perfect for scheduling and time management. Its geometric forms echo clock faces and timetables, while remaining highly readable for quick scanning.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(215 25% 97%)` | `--background` |
| Main text | `hsl(215 25% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(215 25% 15%)` | `--card-foreground` |
| Borders | `hsl(215 20% 88%)` | `--border` |
| Primary action | `hsl(35 92% 50%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(35 92% 95%)` | `--accent` |
| Muted background | `hsl(215 20% 94%)` | `--muted` |
| Muted text | `hsl(215 15% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(142 70% 40%)` | (component use) |
| Error/negative | `hsl(0 84% 60%)` | `--destructive` |

### Why These Colors
The cool slate-blue base (hsl 215) creates a professional, calm environment suitable for workplace tools. The warm amber primary (hsl 35) provides energetic contrast for actions and time indicators - amber naturally associates with clocks, timers, and alertness. The high contrast between dark text and light backgrounds ensures quick readability during busy moments.

### Background Treatment
The page uses a subtle cool-tinted off-white (`hsl(215 25% 97%)`) rather than pure white. This reduces eye strain during extended use and creates a gentle "paper" feel that makes the white cards pop slightly.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
- Hero (today's shifts) takes the entire first viewport
- Strong vertical timeline feel with large time indicators
- Everything scrolls vertically in logical order
- Fixed bottom action button for quick shift creation

### What Users See (Top to Bottom)

**Header:**
- App title "Schichtplaner" (20px, weight 600) left-aligned
- Today's date right-aligned in muted text (14px)
- Total height: 56px with padding

**Hero Section (The FIRST thing users see):**
- Section title: "Heute" with badge showing count (e.g., "3 Schichten")
- Takes approximately 70% of viewport height
- Shows today's shifts as a scrollable vertical list
- Each shift card displays:
  - Left edge: Time range badge (e.g., "06:00 - 14:00") in monospace style, 16px bold
  - Right of time: Employee name (16px medium) and shift type below (14px, muted)
  - Active shift (current time) has amber left border and subtle amber background tint
  - Cards have 12px vertical gap between them
- **Why this is the hero:** Users open the app to answer "Who is working now?" - this answers it instantly

**Section 2: Quick Stats**
- Horizontal row of 3 compact stat boxes
- "Diese Woche" (shifts this week) | "Mitarbeiter" (total employees) | "Schichtarten" (shift types)
- Each stat: number large (24px bold), label small below (12px muted)
- Full-width row, stats evenly distributed
- Background: muted color, no card shadow

**Section 3: Kommende Schichten**
- Title: "Nächste 7 Tage"
- Grouped by date (date header, then shifts for that date)
- More compact than hero cards - single line per shift
- Format: "Mo 15.01 | 06:00-14:00 | M. Müller | Frühschicht"
- Maximum 10 items shown, scrollable

**Bottom Navigation / Action:**
- Fixed bottom button bar (safe area aware)
- Primary action button: "Schicht eintragen" (full width, 48px tall)
- Amber background, white text, rounded (12px radius)

### Mobile-Specific Adaptations
- Today's shifts show full detail, upcoming shifts are compressed to single lines
- No charts on mobile - just the essential shift information
- Tap any shift to see full details in a bottom sheet

### Touch Targets
- All interactive elements minimum 44px tap target
- Shift cards have 16px padding for comfortable tapping
- Bottom action button has 48px height plus safe area

### Interactive Elements
- Tap shift card → opens detail bottom sheet with full info and edit options
- Pull down on hero section → refresh data

---

## 5. Desktop Layout

### Overall Structure
- Maximum width: 1200px, centered
- Two-column layout: 65% / 35% split
- Left column: Today's shifts (hero) + upcoming week
- Right column: Stats + quick filters + recent activity
- Eye flow: Top-left (hero) → Right column (stats) → Down left (upcoming)

### Section Layout

**Top Area:**
- Full-width header bar with title left, date center, action button right
- Action button "Neue Schicht" in header (amber, 40px tall)

**Left Column (65%):**
- **Hero Card: "Schichten Heute"**
  - Large card with subtle shadow (0 4px 6px rgba(0,0,0,0.05))
  - Shows all today's shifts in timeline format
  - Current shift highlighted with amber accent
  - Each row: Time (bold, monospace) | Employee name | Shift type | Company
  - Generous row spacing (16px)

- **Below Hero: "Nächste 7 Tage"**
  - Compact table-style view
  - Columns: Datum | Zeit | Mitarbeiter | Schichtart | Unternehmen
  - Alternating row backgrounds for readability
  - Sortable by clicking column headers

**Right Column (35%):**
- **Stats Grid** (2x2 cards)
  - Schichten heute | Schichten diese Woche
  - Aktive Mitarbeiter | Schichtarten
  - Each card: 100px tall, number prominent (32px), label below (14px muted)

- **Filter/Quick View**
  - Dropdown to filter by company
  - Dropdown to filter by shift type

- **Mini Calendar**
  - Current week view showing which days have shifts (dots)
  - Click day to filter the main view

### What Appears on Hover
- Shift rows: subtle background highlight + "Details anzeigen" text appears right-aligned
- Stat cards: subtle scale transform (1.02) and shadow increase
- Action button: slight brightness increase

### Clickable/Interactive Areas
- Each shift row → opens side panel with full shift details
- Stat cards → click to see breakdown (e.g., click "Mitarbeiter" to see employee list)
- Calendar days → filter shifts to that day

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Schichten Heute
- **Data source:** schichteinteilung (filtered by today's date)
- **Calculation:** Filter records where `zuweisung_datum` = today, count and list
- **Display:** List of shift cards, not just a number - users need to see WHO is working
- **Context shown:** Current time indicator, active shift highlighted
- **Why this is the hero:** The #1 question users have is "Who is working today?" - this answers it instantly with names and times

### Secondary KPIs

**Schichten diese Woche**
- Source: schichteinteilung
- Calculation: Count where `zuweisung_datum` between today and +7 days
- Format: number
- Display: Stat card, medium size

**Aktive Mitarbeiter**
- Source: mitarbeiterverwaltung
- Calculation: Count all records
- Format: number
- Display: Stat card, medium size

**Schichtarten**
- Source: schichtartenverwaltung
- Calculation: Count all records
- Format: number
- Display: Stat card, small

### Chart (if applicable)
- **Type:** None for mobile, optional bar chart for desktop
- On desktop right column: Simple bar showing shifts per day for current week
- X-axis: Days (Mo, Di, Mi, Do, Fr, Sa, So)
- Y-axis: Number of shifts
- Subtle, not prominent - the list view is more useful than a chart

### Lists/Tables

**Heute Schichten (Hero List)**
- Purpose: Show exactly who is working today and when
- Source: schichteinteilung filtered by today
- Fields shown: zuweisung_beginn, zuweisung_ende, zuweisung_mitarbeiter (resolved), zuweisung_schichtart (resolved)
- Mobile style: Tall cards with prominent time badge
- Desktop style: Table rows with all fields visible
- Sort: By zuweisung_beginn ascending (earliest first)
- Limit: All (typically < 20 per day)

**Kommende Schichten**
- Purpose: See upcoming week at a glance
- Source: schichteinteilung filtered by next 7 days
- Fields shown: zuweisung_datum, zuweisung_beginn, zuweisung_ende, zuweisung_mitarbeiter (resolved), zuweisung_schichtart (resolved)
- Mobile style: Compact single-line items
- Desktop style: Full table with sortable columns
- Sort: By zuweisung_datum, then zuweisung_beginn
- Limit: 20 items

### Primary Action Button (REQUIRED!)

- **Label:** "Schicht eintragen"
- **Action:** add_record
- **Target app:** schichteinteilung
- **What data:** Form with fields:
  - zuweisung_datum (date picker, default today)
  - zuweisung_beginn (time input)
  - zuweisung_ende (time input)
  - zuweisung_mitarbeiter (select from mitarbeiterverwaltung)
  - zuweisung_schichtart (select from schichtartenverwaltung)
  - zuweisung_unternehmen (select from unternehmensverwaltung)
  - zuweisung_notiz (optional textarea)
- **Mobile position:** bottom_fixed
- **Desktop position:** header (right side)
- **Why this action:** Creating shift assignments is the core daily task - managers constantly add and adjust shifts throughout the day

---

## 7. Visual Details

### Border Radius
- Cards: 12px (rounded, friendly but professional)
- Buttons: 8px
- Badges/pills: 6px
- Input fields: 8px

### Shadows
- Cards: `0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.04)` (subtle elevation)
- Hero card: `0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.04)` (slightly more elevated)
- Buttons: none (flat design)
- Modals: `0 20px 40px rgba(0, 0, 0, 0.15)`

### Spacing
- Page padding: 16px mobile, 24px desktop
- Card padding: 16px mobile, 20px desktop
- Between cards: 16px
- Between sections: 32px
- Row spacing in lists: 12px

### Animations
- **Page load:** Stagger fade-in (hero first, then stats, then upcoming)
- **Hover effects:** Scale 1.02 on cards, background color shift on rows
- **Tap feedback:** Scale 0.98 momentarily, then return

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(215 25% 97%);
  --foreground: hsl(215 25% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(215 25% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(215 25% 15%);
  --primary: hsl(35 92% 50%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(215 20% 94%);
  --secondary-foreground: hsl(215 25% 15%);
  --muted: hsl(215 20% 94%);
  --muted-foreground: hsl(215 15% 45%);
  --accent: hsl(35 92% 95%);
  --accent-foreground: hsl(35 92% 25%);
  --destructive: hsl(0 84% 60%);
  --border: hsl(215 20% 88%);
  --input: hsl(215 20% 88%);
  --ring: hsl(35 92% 50%);
  --radius: 0.75rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Space Grotesk)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4 (hero shifts dominate, fixed bottom action)
- [ ] Desktop layout matches Section 5 (65/35 split, timeline on left)
- [ ] Hero element is prominent as described (today's shifts with time badges)
- [ ] Colors create the mood described in Section 2 (professional slate-blue with amber accents)
- [ ] Current shift highlighted with amber indicator
- [ ] Primary action button present and functional (opens form to add shift)
- [ ] Shift times displayed in bold monospace style
- [ ] Employee and shift type names resolved from lookup apps
