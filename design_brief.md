# Design Brief: Schichtplaner Dashboard

## 1. App Analysis

### What This App Does
This app manages shift planning for companies: it stores companies, employees, shift types, and individual shift assignments. The dashboard must help a manager see upcoming coverage at a glance and quickly add new assignments without digging into separate screens.

### Who Uses This
Operations managers or team leads who schedule staff for different companies and shift types. They are non-technical and want fast answers: What is happening next, how full is the week, and who is assigned.

### The ONE Thing Users Care About Most
How many shifts are scheduled for the next 7 days (and whether the immediate days look covered). This answers the daily question: "Are we staffed for the coming week?"

### Primary Actions (IMPORTANT!)
1. Schicht einteilen (create a new shift assignment) -> Primary Action Button
2. Mitarbeitende pflegen
3. Schichtarten verwalten

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design feels like a calm scheduling desk: warm paper-like background, precise geometric typography, and a deep teal action color. A burnt-orange accent highlights time-critical information, giving the layout a "dispatch board" character without feeling busy.

### Layout Strategy
The layout is asymmetric with a wide left column for the hero KPI and the trend chart, and a narrower right column for upcoming shifts and roster lists. The hero is a large numeric block with a custom 7-day "shift ribbon" beneath it, which creates immediate visual interest. Secondary KPIs are compact and arranged in a tight horizontal strip to avoid competing with the hero. Lists on the right column are stacked but visually separated by spacing and subtle borders.

### Unique Element
The hero card includes a 7-day "shift ribbon": a horizontal strip of seven small bars with day initials, each bar height representing the number of shifts on that day. This micro-visual makes the week feel tangible and breaks the default card grid look.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap`
- **Why this font:** Space Grotesk is geometric and modern without feeling sterile. It fits scheduling and operational data while still being friendly.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(38 36% 97%)` | `--background` |
| Main text | `hsl(205 28% 16%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(205 28% 16%)` | `--card-foreground` |
| Borders | `hsl(28 18% 86%)` | `--border` |
| Primary action | `hsl(187 54% 26%)` | `--primary` |
| Text on primary | `hsl(40 30% 98%)` | `--primary-foreground` |
| Accent highlight | `hsl(24 78% 48%)` | `--accent` |
| Muted background | `hsl(36 32% 94%)` | `--muted` |
| Muted text | `hsl(205 16% 42%)` | `--muted-foreground` |
| Success/positive | `hsl(142 52% 36%)` | (component use) |
| Error/negative | `hsl(4 78% 52%)` | `--destructive` |

### Why These Colors
A warm off-white base feels calm and human, while deep teal gives strong action contrast. Burnt orange is used sparingly to draw attention to time-sensitive items and the hero ribbon, creating a distinct scheduling-board vibe.

### Background Treatment
Use a subtle layered background: a soft radial glow in the top-left and a faint diagonal linear gradient across the page. This keeps the light theme from feeling flat while staying understated.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Mobile focuses on a strong vertical flow. The hero KPI dominates the first screen, followed by a horizontal scroll of secondary KPIs. Lists become stacked cards with generous spacing. The primary action is a fixed bottom button for thumb reach.

### What Users See (Top to Bottom)

**Header:**
Title "Schichtplaner" on the left, current date on the right (small, muted). No secondary actions here on mobile.

**Hero Section (The FIRST thing users see):**
A large card with the KPI "Schichten naechste 7 Tage" in 48px bold. Beneath the number, a short subtitle "geplant" and the 7-day ribbon (day initials with mini bars). This hero should take roughly the top 55-60% of the first viewport.

**Section 2: Schnellkennzahlen**
A horizontal scroll row of compact KPI cards: "Schichten heute", "Mitarbeiter", "Schichtarten", "Unternehmen". Each card uses smaller numbers (24px) and muted labels.

**Section 3: Wochenverlauf**
An area chart card titled "Schichten pro Tag" showing the next 7 days. Y-axis labels are minimal; x-axis shows day initials.

**Section 4: Naechste Schichten**
A vertical list of the next 5 assignments. Each item is a card with date, time range, employee name, company, and shift type. If a note exists, show a small accent dot.

**Section 5: Schichtarten**
A pill-style wrap list of all shift types (name + time range), using a muted background with a thin accent border.

**Section 6: Team & Unternehmen**
Two small stacked cards: a short list of employees (name + email/phone) and a list of companies (name + city). Limit each list to 4 items.

**Bottom Navigation / Action:**
A fixed full-width primary button labeled "Schicht einteilen".

### Mobile-Specific Adaptations
- Chart is simplified to 7 days only.
- Secondary KPIs are horizontal-scroll to avoid shrinking.
- Lists use cards instead of table rows for touch comfort.

### Touch Targets
Buttons and list items should be at least 44px tall. The bottom action button should be 56px height.

### Interactive Elements (if applicable)
Tapping a shift in the "Naechste Schichten" list opens a details dialog with full info and the note field.

---

## 5. Desktop Layout

### Overall Structure
Two-column asymmetric layout: left column about 2/3 width (hero + chart), right column about 1/3 width (lists). Eye flow: hero -> chart -> upcoming shifts -> roster lists.

### Section Layout
- **Top header:** Title "Schichtplaner" + subtitle "Uebersicht" on the left, primary action button on the right.
- **Left column:**
  - Hero KPI card (large, with 7-day ribbon)
  - Area chart card "Schichten pro Tag" (next 14 days)
- **Right column:**
  - "Naechste Schichten" list card (max 6 items)
  - "Team" list card (4 recent employees)
  - "Unternehmen" list card (4 companies)
  - "Schichtarten" pill list card (all shift types)

### What Appears on Hover
Upcoming shift list items lift slightly (shadow increase) and reveal the note line if it exists. The accent dot brightens to the accent color.

### Clickable/Interactive Areas (if applicable)
- Clicking a shift item opens a detail dialog.
- The primary action opens a dialog form to add a new shift assignment.

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Schichten naechste 7 Tage
- **Data source:** Schichteinteilung
- **Calculation:** Count of assignments where date is today through today + 6 days
- **Display:** Large number (48px) with subtitle "geplant" and the 7-day ribbon beneath
- **Context shown:** Small text line: "Heute: X | Morgen: Y"
- **Why this is the hero:** It answers the immediate staffing question for the coming week

### Secondary KPIs

**Schichten heute**
- Source: Schichteinteilung
- Calculation: Count of assignments with date = today
- Format: number
- Display: Compact card

**Mitarbeiter gesamt**
- Source: Mitarbeiterverwaltung
- Calculation: Count of records
- Format: number
- Display: Compact card

**Schichtarten**
- Source: Schichtartenverwaltung
- Calculation: Count of records
- Format: number
- Display: Compact card

**Unternehmen**
- Source: Unternehmensverwaltung
- Calculation: Count of records
- Format: number
- Display: Compact card

### Chart
- **Type:** Area chart (trend focus without harsh edges)
- **Title:** Schichten pro Tag
- **What question it answers:** Is the workload rising or falling across the next two weeks?
- **Data source:** Schichteinteilung
- **X-axis:** Date (formatted as dd.MM or day initials on mobile)
- **Y-axis:** Count of shifts
- **Mobile simplification:** Show only 7 days, minimal ticks

### Lists/Tables

**Naechste Schichten**
- Purpose: Show the immediate roster so managers know who works next
- Source: Schichteinteilung (joined to Mitarbeiter, Unternehmen, Schichtarten)
- Fields shown: Date, time range, employee name, company, shift type, note indicator
- Mobile style: Stacked cards
- Desktop style: Compact list with hover reveal
- Sort: Date asc, then time asc
- Limit: 6 (desktop), 5 (mobile)

**Team**
- Purpose: Quick access to people context
- Source: Mitarbeiterverwaltung
- Fields shown: Name, email or phone
- Mobile style: Small list
- Desktop style: Compact list
- Sort: createdat desc
- Limit: 4

**Unternehmen**
- Purpose: Keep active companies visible
- Source: Unternehmensverwaltung
- Fields shown: Name, PLZ + Ort
- Mobile style: Small list
- Desktop style: Compact list
- Sort: createdat desc
- Limit: 4

**Schichtarten**
- Purpose: Quick visual inventory of available shift types
- Source: Schichtartenverwaltung
- Fields shown: Name + time range
- Mobile style: Wrap of pills
- Desktop style: Wrap of pills
- Sort: Name asc
- Limit: all

### Primary Action Button (REQUIRED!)

- **Label:** Schicht einteilen
- **Action:** add_record
- **Target app:** Schichteinteilung
- **What data:** Datum, Mitarbeiter, Unternehmen, Schichtart, Beginn, Ende, Notiz
- **Mobile position:** bottom_fixed
- **Desktop position:** header
- **Why this action:** Assigning shifts is the most frequent task in this workflow

---

## 7. Visual Details

### Border Radius
rounded (8px)

### Shadows
subtle, with a soft spread and a slightly warmer tint (shadow increases on hover)

### Spacing
spacious, with clear separation between sections

### Animations
- **Page load:** subtle fade + 8px upward motion for the main sections
- **Hover effects:** cards lift slightly with stronger shadow
- **Tap feedback:** button press darkens slightly

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(38 36% 97%);
  --foreground: hsl(205 28% 16%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(205 28% 16%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(205 28% 16%);
  --primary: hsl(187 54% 26%);
  --primary-foreground: hsl(40 30% 98%);
  --secondary: hsl(36 28% 92%);
  --secondary-foreground: hsl(205 28% 18%);
  --muted: hsl(36 32% 94%);
  --muted-foreground: hsl(205 16% 42%);
  --accent: hsl(24 78% 48%);
  --accent-foreground: hsl(40 30% 98%);
  --destructive: hsl(4 78% 52%);
  --border: hsl(28 18% 86%);
  --input: hsl(28 18% 86%);
  --ring: hsl(187 54% 34%);
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
