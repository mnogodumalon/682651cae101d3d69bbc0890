# Design Brief: Schichtplaner

## 1. App Analysis

### What This App Does
Schichtplaner is a shift scheduling application for managing employee work shifts across companies. It allows administrators to assign employees to specific shift types on specific dates, while managing companies, shift types, and employee data.

### Who Uses This
Shift managers, HR personnel, or small business owners who need to organize and track employee work schedules. They're busy, often checking on mobile between tasks, and need quick access to "what's happening today" and "who's working when."

### The ONE Thing Users Care About Most
**Today's shifts** - When they open the app, they want to immediately see who is working today and what shifts are scheduled. Everything else is secondary.

### Primary Actions
1. See today's and upcoming shifts at a glance
2. View which employees are assigned to work
3. Quick overview of shift distribution by type
4. Access employee and shift details

---

## 2. What Makes This Design Distinctive

This dashboard uses a **warm industrial aesthetic** inspired by shift work environments - factories, hospitals, logistics. The warm cream background with a deep slate blue accent creates a professional yet approachable feel. The design emphasizes **time and scheduling** with a clear visual timeline and shift-based color coding. Rather than generic corporate blue, the palette draws from safety signage and industrial control panels - functional, clear, and instantly readable even at a glance.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap`
- **Why this font:** Space Grotesk has a technical, slightly industrial character that fits a scheduling/operations app. Its open letterforms are highly readable on screens, and the geometric shapes give it a modern, efficient feel without being cold.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(45 30% 97%)` | `--background` |
| Main text | `hsl(220 25% 18%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(220 25% 18%)` | `--card-foreground` |
| Popover background | `hsl(0 0% 100%)` | `--popover` |
| Popover text | `hsl(220 25% 18%)` | `--popover-foreground` |
| Borders | `hsl(40 15% 88%)` | `--border` |
| Primary action | `hsl(215 50% 35%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Secondary background | `hsl(45 20% 94%)` | `--secondary` |
| Secondary text | `hsl(220 25% 25%)` | `--secondary-foreground` |
| Accent highlight | `hsl(35 85% 55%)` | `--accent` |
| Accent text | `hsl(220 25% 15%)` | `--accent-foreground` |
| Muted background | `hsl(45 15% 93%)` | `--muted` |
| Muted text | `hsl(220 10% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(145 55% 40%)` | (component use) |
| Error/negative | `hsl(0 70% 55%)` | `--destructive` |
| Input background | `hsl(40 15% 92%)` | `--input` |
| Focus ring | `hsl(215 50% 50%)` | `--ring` |

### Chart Colors
| Chart Element | Color |
|--------------|-------|
| Chart 1 | `hsl(215 50% 45%)` |
| Chart 2 | `hsl(35 80% 55%)` |
| Chart 3 | `hsl(170 45% 45%)` |
| Chart 4 | `hsl(280 40% 55%)` |
| Chart 5 | `hsl(350 60% 55%)` |

### Why These Colors
The warm cream background (`hsl(45 30% 97%)`) creates a softer, less sterile feel than pure white - appropriate for an app dealing with human schedules and work-life. The deep slate blue primary (`hsl(215 50% 35%)`) conveys reliability and structure without being corporate-generic. The amber accent (`hsl(35 85% 55%)`) adds energy and draws attention to important elements like today's shifts - reminiscent of caution/attention colors in industrial settings but warmer and more inviting.

### Background Treatment
A subtle warm off-white background that gives the page a slight "paper" quality. Cards are pure white to create clear visual separation and hierarchy. The gentle contrast between background and cards creates depth without shadows.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### What Users See (Top to Bottom)

**Header:**
- App title "Schichtplaner" on the left (Space Grotesk 600 weight, 20px)
- Current date shown below title in muted text (14px)
- Simple, minimal - no hamburger menu or extra icons

**Hero Section (The FIRST thing users see):**
A prominent "Today's Shifts" card that dominates the top half of the screen.
- Large number showing count of shifts today (48px, bold 700 weight)
- Label "Schichten heute" below the number (14px, muted)
- Below that, a compact list of the first 3-4 today's shifts showing:
  - Employee name (bold)
  - Shift type badge (small pill with shift name)
  - Time range (e.g., "06:00 - 14:00")
- If more than 4 shifts: "Alle X Schichten anzeigen" link at bottom
- Why this is the hero: Users open this app to see "who's working today" - this answers that instantly

**Section 2: Quick Stats Row**
A horizontal scroll row of 3 compact stat cards:
- Total Mitarbeiter (employee count)
- Schichtarten (shift type count)
- Schichten diese Woche (shifts this week count)
Each card: Icon + number + label, compact (about 100px wide each)

**Section 3: Upcoming Shifts**
A simple list showing the next 5 upcoming shifts (beyond today):
- Date as section header (e.g., "Morgen, 13. Jan")
- Each shift: Employee name, shift type pill, time
- Minimal chrome, focus on scanability
- "Alle Schichten" link at bottom

**Section 4: Team Overview**
Collapsed accordion section titled "Team" showing employee count
- Tap to expand and see list of employees
- Each employee: Avatar placeholder (initials), full name
- Keep collapsed by default to prioritize scheduling info

**Bottom Navigation / Action:**
No fixed bottom navigation. The page scrolls naturally. Keep it simple.

### What is HIDDEN on Mobile
- Company details (available elsewhere, not critical for daily use)
- Shift type management (administrative, not daily)
- Charts and graphs (too complex for quick mobile checks)
- Detailed shift history (not needed for "what's now" use case)

### Touch Targets
- All tappable items minimum 44px height
- Shift items have generous padding for easy tapping
- Accordion headers have full-width tap targets

---

## 5. Desktop Layout

### Overall Structure
A clean two-column layout with a wider left column (65%) for primary content and narrower right column (35%) for supporting information. Maximum content width of 1400px, centered on larger screens.

### Column Layout

**Left Column (65%):**
- Hero: Today's shifts with full list (not truncated like mobile)
- Below hero: Shifts timeline - a simple bar chart showing shift distribution by day for the current week
- Below chart: Upcoming shifts list (next 7 days)

**Right Column (35%):**
- Quick stats cards (vertically stacked)
- Team list (always visible, scrollable if long)
- Company info card (compact)

### Header (Desktop)
- Title "Schichtplaner" left-aligned (24px, 600 weight)
- Current date and day name next to title
- Clean horizontal line below header (using border color)

### What Appears on Hover
- Shift items: subtle background highlight, cursor pointer
- Employee names: underline appears, indicating clickable
- Stat cards: slight scale (1.02) and shadow increase

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Schichten heute
- **Data source:** Schichteinteilung (filtered by today's date)
- **Calculation:** Count of records where `zuweisung_datum` equals today
- **Display:** Large number (48px mobile, 56px desktop), bold 700 weight, primary color
- **Context shown:** List of today's shifts with employee name, shift type, and time
- **Why this is the hero:** Shift managers need to know immediately who's working today - this is the core use case

### Secondary KPIs

**Mitarbeiter (Employee Count)**
- Source: Mitarbeiterverwaltung
- Calculation: Total count of records
- Format: number
- Display: Compact stat card with user icon, number (24px bold), label below

**Schichtarten (Shift Types Count)**
- Source: Schichtartenverwaltung
- Calculation: Total count of records
- Format: number
- Display: Compact stat card with layers icon, number (24px bold), label below

**Schichten diese Woche (Shifts This Week)**
- Source: Schichteinteilung
- Calculation: Count where `zuweisung_datum` is within current week (Monday to Sunday)
- Format: number
- Display: Compact stat card with calendar icon, number (24px bold), label below

### Chart (Desktop Only)

- **Type:** Bar chart - best for comparing discrete time periods (days)
- **Title:** Schichten diese Woche
- **What question it answers:** "How are shifts distributed across this week? Are some days understaffed?"
- **Data source:** Schichteinteilung
- **X-axis:** Day of week (Mo, Di, Mi, Do, Fr, Sa, So)
- **Y-axis:** Number of shifts
- **Colors:** Primary color (`hsl(215 50% 35%)`) for bars
- **Mobile simplification:** Hidden on mobile - the weekly count KPI is sufficient

### Lists/Tables

**Today's Shifts List**
- Purpose: Show who is working today with essential details
- Source: Schichteinteilung (joined with Mitarbeiterverwaltung and Schichtartenverwaltung)
- Fields shown: Employee full name, shift type name (as badge), start time - end time
- Mobile style: Compact cards with stacked layout
- Desktop style: Clean list with horizontal layout
- Sort: By start time (zuweisung_beginn) ascending
- Limit: Mobile 4 items initially, Desktop unlimited

**Upcoming Shifts List**
- Purpose: See what's coming in the next few days
- Source: Schichteinteilung (joined with related apps)
- Fields shown: Date (as group header), employee name, shift type badge, time range
- Mobile style: Grouped by date, compact items
- Desktop style: Same but with more visible items
- Sort: By date ascending, then by start time
- Limit: Mobile 5 items, Desktop 10 items

**Team List**
- Purpose: Quick reference of all employees
- Source: Mitarbeiterverwaltung
- Fields shown: Full name (vorname + nachname), initials avatar
- Mobile style: Collapsed accordion, expands to simple list
- Desktop style: Always visible sidebar card
- Sort: Alphabetically by nachname
- Limit: None (show all)

### Primary Action Button
- **Label:** None - This is a read-only dashboard view
- **Note:** No primary action button since this is an overview dashboard, not a data entry interface

---

## 7. Visual Details

### Border Radius
Rounded (8px / `--radius: 0.5rem`) for cards and containers. Creates a modern, friendly feel without being too playful. Badges use pill shape (9999px) for shift type labels.

### Shadows
Subtle - cards have minimal shadow (`0 1px 3px rgba(0,0,0,0.05)`) to create depth without heaviness. Hover states increase shadow slightly (`0 4px 12px rgba(0,0,0,0.08)`).

### Spacing
Normal to spacious - 16px padding inside cards, 24px gap between major sections. White space is important for scanability. Content should breathe.

### Animations
- **Page load:** Subtle fade-in (200ms) for cards, staggered by 50ms for visual polish
- **Hover effects:** Smooth background color transition (150ms), subtle scale on stat cards
- **Tap feedback:** Brief scale down (0.98) on tap for mobile

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST update these values in `src/index.css`:

```css
:root {
  --radius: 0.5rem;
  --background: hsl(45 30% 97%);
  --foreground: hsl(220 25% 18%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(220 25% 18%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(220 25% 18%);
  --primary: hsl(215 50% 35%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(45 20% 94%);
  --secondary-foreground: hsl(220 25% 25%);
  --muted: hsl(45 15% 93%);
  --muted-foreground: hsl(220 10% 45%);
  --accent: hsl(35 85% 55%);
  --accent-foreground: hsl(220 25% 15%);
  --destructive: hsl(0 70% 55%);
  --border: hsl(40 15% 88%);
  --input: hsl(40 15% 92%);
  --ring: hsl(215 50% 50%);
  --chart-1: hsl(215 50% 45%);
  --chart-2: hsl(35 80% 55%);
  --chart-3: hsl(170 45% 45%);
  --chart-4: hsl(280 40% 55%);
  --chart-5: hsl(350 60% 55%);
}
```

### Google Fonts Link
Add to `index.html` in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Font Family CSS
Add to `src/index.css` in base layer:
```css
body {
  font-family: 'Space Grotesk', sans-serif;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Space Grotesk font loaded from Google Fonts
- [ ] All CSS variables copied exactly to src/index.css
- [ ] Mobile layout matches Section 4 - hero is today's shifts
- [ ] Desktop layout matches Section 5 - two columns
- [ ] Hero element (today's shifts count + list) is prominent
- [ ] Colors create the warm industrial mood described in Section 2
- [ ] Shift type badges use pill shape
- [ ] Chart only appears on desktop
- [ ] Team list is accordion on mobile, always visible on desktop
- [ ] Hover states are smooth and subtle
- [ ] All data comes from LivingAppsService
- [ ] extractRecordId used for all applookup fields
- [ ] Null checks on all optional fields
- [ ] Date comparison uses date-fns for "today" and "this week" logic
