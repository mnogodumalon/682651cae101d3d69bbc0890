# Design Brief: Schichtplaner

## 1. App Analysis

### What This App Does
Schichtplaner is a shift planning system for managing employee work schedules across multiple companies. It tracks which employees are assigned to which shifts, when those shifts occur, and at which company location. The system allows managers to schedule workers, define shift types (Frühschicht, Spätschicht, Nachtschicht, etc.), and maintain employee contact information.

### Who Uses This
Shift managers, team leads, or small business owners who need to organize staff schedules. They're busy, often checking the schedule on their phone between tasks. They need to quickly see today's shifts, upcoming assignments, and add new shift assignments without friction.

### The ONE Thing Users Care About Most
**"Who is working today and when?"** - When a manager opens this app, they immediately want to see today's shift overview: which employees are scheduled, what times, and for which company/location.

### Primary Actions (IMPORTANT!)
1. **Neue Schicht eintragen** → Primary Action Button - This is what users do most: assign an employee to work a shift on a specific date
2. View today's and upcoming shifts
3. See employee availability at a glance

---

## 2. What Makes This Design Distinctive

This dashboard uses an **industrial-inspired color palette** with a deep slate blue as the primary accent, creating a professional, no-nonsense feel appropriate for shift work environments. The warm off-white background with subtle blue undertones feels clean but not sterile. Typography uses **IBM Plex Sans** - a font designed for readability in data-heavy interfaces, with its technical precision fitting perfectly for schedules and time displays. The compact card-based layout mimics a physical shift board, making the digital experience feel familiar to users accustomed to paper schedules.

---

## 3. Theme & Colors

### Font
- **Family:** IBM Plex Sans
- **URL:** `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap`
- **Why this font:** IBM Plex Sans has a technical, precise character perfect for schedules and time data. Its clear numerals are highly readable, and the font's industrial heritage fits the shift-work context.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(210 25% 97%)` | `--background` |
| Main text | `hsl(215 25% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(215 25% 15%)` | `--card-foreground` |
| Borders | `hsl(214 20% 88%)` | `--border` |
| Primary action | `hsl(215 60% 42%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(215 60% 95%)` | `--accent` |
| Muted background | `hsl(210 20% 94%)` | `--muted` |
| Muted text | `hsl(215 15% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 55% 40%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The deep slate blue (`hsl(215 60% 42%)`) primary color conveys professionalism and reliability - essential for workforce management. The cool-toned background creates a calm, focused environment for schedule viewing. The subtle blue undertones throughout create cohesion while maintaining excellent contrast for text readability.

### Background Treatment
The page background uses a soft cool gray (`hsl(210 25% 97%)`) - not pure white, which creates visual depth when cards are layered on top. This subtle tint reduces eye strain during extended use.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### What Users See (Top to Bottom)

**Header:**
- App title "Schichtplaner" left-aligned, medium weight
- Current date displayed below in muted text (e.g., "Sonntag, 12. Januar 2025")
- No navigation icons - keep it simple

**Hero Section (The FIRST thing users see):**
- Large heading: "Heute" with count badge showing number of shifts
- If shifts exist today: Compact shift cards showing employee name, time range, and company
- If no shifts: Friendly empty state "Keine Schichten heute"
- Card height: compact, showing essential info only
- Each card shows: Employee name (bold), time range (e.g., "06:00 - 14:00"), company name (muted)
- Why hero: This immediately answers "who's working today?"

**Section 2: Kommende Schichten (Next 7 Days)**
- Collapsible section, expanded by default
- Grouped by date with date headers
- Same compact card style as hero section
- Maximum 10 upcoming shifts shown
- "Alle anzeigen" link if more exist

**Section 3: Schnellübersicht (Quick Stats)**
- Three inline stat cards in a horizontal scroll on mobile:
  - Total employees count
  - Total shift types defined
  - Shifts this week count
- Cards are compact, icon + number + label format

**Bottom Navigation / Action:**
- Fixed bottom button: "Neue Schicht eintragen" (primary color, full width minus padding)
- 16px padding from edges, 20px from bottom (safe area aware)
- Button has subtle shadow for depth

### What is HIDDEN on Mobile
- Detailed employee contact info (available on tap)
- Full shift type descriptions
- Company address details
- Historical shift data

### Touch Targets
- All cards minimum 48px touch target height
- Bottom action button: 52px height
- Adequate spacing between cards (12px gap)

---

## 5. Desktop Layout

### Overall Structure
Two-column layout with a 65/35 split. The wider left column contains the main shift schedule view, while the narrower right column shows stats and quick actions.

### Column Layout
- **Left column (65%):**
  - Today's shifts section with larger cards
  - Upcoming shifts table (full table view, not cards)
  - Shift timeline visualization for the current week

- **Right column (35%):**
  - Quick stats panel (stacked vertically)
  - Primary action button "Neue Schicht eintragen"
  - Recent activity or upcoming empty slots

### What Appears on Hover
- Shift cards: Subtle elevation increase, shows "Details" link
- Employee names: Tooltip with contact info (email, phone)
- Table rows: Light background highlight, action icons appear

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Schichten heute
- **Data source:** Schichteinteilung (filtered by today's date)
- **Calculation:** Count of records where zuweisung_datum equals today
- **Display:** Large number (48px bold) with "Schichten" label below. Accompanied by a list of today's shift cards.
- **Context shown:** Shows vs. yesterday (e.g., "+2 mehr als gestern")
- **Why this is the hero:** Managers open the app to see who's working today - this answers that immediately with both a count and the actual assignments.

### Secondary KPIs
**Mitarbeiter**
- Source: Mitarbeiterverwaltung
- Calculation: Total count of records
- Format: number
- Display: Compact stat card with Users icon

**Schichtarten**
- Source: Schichtartenverwaltung
- Calculation: Total count of records
- Format: number
- Display: Compact stat card with Layers icon

**Diese Woche**
- Source: Schichteinteilung
- Calculation: Count where zuweisung_datum is within current week
- Format: number
- Display: Compact stat card with Calendar icon

### Chart (if applicable)
- **Type:** Bar chart - shows distribution across days, perfect for seeing workload patterns
- **Title:** Schichten diese Woche
- **What question it answers:** "Are shifts evenly distributed across the week, or are some days overloaded?"
- **Data source:** Schichteinteilung
- **X-axis:** Day of week (Mo, Di, Mi, Do, Fr, Sa, So)
- **Y-axis:** Number of shifts
- **Mobile simplification:** Smaller bars, no axis labels, just visual pattern. Hidden by default, shown on tap.

### Lists/Tables (if applicable)

**Heutige Schichten**
- Purpose: Show who's working today at a glance
- Source: Schichteinteilung (joined with Mitarbeiterverwaltung, Schichtartenverwaltung, Unternehmensverwaltung)
- Fields shown: Employee name (from lookup), time range (zuweisung_beginn - zuweisung_ende), company name (from lookup)
- Mobile style: Compact cards
- Desktop style: Cards in grid (2 columns)
- Sort: By zuweisung_beginn ascending
- Limit: All for today

**Kommende Schichten**
- Purpose: Plan ahead - see upcoming assignments
- Source: Schichteinteilung (future dates only)
- Fields shown: Date, employee name, time, company
- Mobile style: Compact cards grouped by date
- Desktop style: Table with columns
- Sort: By zuweisung_datum ascending, then zuweisung_beginn
- Limit: 10 on mobile, 15 on desktop

### Primary Action Button (REQUIRED!)

- **Label:** Neue Schicht eintragen
- **Action:** add_record
- **Target app:** Schichteinteilung
- **What data:** Opens a form/dialog with:
  - Date picker (zuweisung_datum)
  - Employee select dropdown (zuweisung_mitarbeiter - populated from Mitarbeiterverwaltung)
  - Company select dropdown (zuweisung_unternehmen - populated from Unternehmensverwaltung)
  - Shift type select dropdown (zuweisung_schichtart - populated from Schichtartenverwaltung)
  - Start time (zuweisung_beginn)
  - End time (zuweisung_ende)
  - Optional notes (zuweisung_notiz)
- **Mobile position:** bottom_fixed
- **Desktop position:** sidebar (right column, prominent placement)
- **Why this action:** Adding shift assignments is the primary workflow - managers constantly add new shifts as schedules are created or adjusted. This must be one tap away.

---

## 7. Visual Details

### Border Radius
rounded (8px) - Modern but not playful, appropriate for business application

### Shadows
subtle - Cards have `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)), buttons have slightly more depth on hover

### Spacing
normal - 16px base padding in cards, 24px between sections, 12px gap between cards

### Animations
- **Page load:** Subtle fade-in (200ms) for cards, staggered by 50ms
- **Hover effects:** Cards lift slightly (translateY -2px) with shadow increase
- **Tap feedback:** Scale down slightly (0.98) on active state

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --radius: 0.5rem;
  --background: hsl(210 25% 97%);
  --foreground: hsl(215 25% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(215 25% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(215 25% 15%);
  --primary: hsl(215 60% 42%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(210 20% 94%);
  --secondary-foreground: hsl(215 25% 15%);
  --muted: hsl(210 20% 94%);
  --muted-foreground: hsl(215 15% 50%);
  --accent: hsl(215 60% 95%);
  --accent-foreground: hsl(215 25% 15%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(214 20% 88%);
  --input: hsl(214 20% 88%);
  --ring: hsl(215 60% 42%);
  --chart-1: hsl(215 60% 42%);
  --chart-2: hsl(152 55% 40%);
  --chart-3: hsl(35 90% 55%);
  --chart-4: hsl(280 50% 55%);
  --chart-5: hsl(195 70% 45%);
}
```

Google Font import (add to index.html `<head>`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

Add to body/html styling:
```css
body {
  font-family: 'IBM Plex Sans', sans-serif;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (IBM Plex Sans)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4 (single column, fixed bottom button)
- [ ] Desktop layout matches Section 5 (two columns 65/35)
- [ ] Hero element is prominent as described (today's shifts count + cards)
- [ ] Colors create the professional, industrial mood described in Section 2
- [ ] Primary action button is always visible and accessible
- [ ] Data fetching uses the provided LivingAppsService methods
- [ ] applookup fields use extractRecordId() helper
- [ ] Empty states are friendly and helpful
- [ ] Touch targets are minimum 48px on mobile
