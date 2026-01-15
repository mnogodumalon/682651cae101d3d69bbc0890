# Design Brief: Schichtplaner Dashboard

## 1. App Analysis

### What This App Does
The **Schichtplaner** backend manages companies, employees, shift types and concrete shift assignments.  HR or operations managers use it to plan which employee works which shift at which company location and date.

### Who Uses This
Operations managers and team leads who are responsible for scheduling staff.  They open the dashboard at the start of each day on desktop in the office or on their phone while on-site.

### The ONE Thing Users Care About Most
"Wie viele Schichten sind **heute** bereits geplant und laufen reibungslos?"  The hero KPI therefore shows **Today’s Planned Shifts**.

### Primary Actions (IMPORTANT!)
1. **Schicht anlegen** → Primary Action Button
2. Mitarbeiterzuordnung ändern
3. Schichtart anpassen

---

## 2. What Makes This Design Distinctive

### Visual Identity
A warm off-white background combined with a fresh turquoise accent conveys calm confidence while hinting at efficiency.  Large, friendly typography (Plus Jakarta Sans) and rounded 8 px cards create an approachable but professional feel perfect for workforce planning.

### Layout Strategy
- **Asymmetric layout**: On desktop, a wide left column houses the hero KPI and 7-day trend chart, while the right column lists today’s shifts.  This mirrors the user’s workflow: first check today’s overview, then dive into individual assignments.
- **Hero emphasis**: The hero KPI sits in a full-width card with 48 px number, turquoise progress ring and generous 40 px top/bottom padding, separating it from other elements.
- **Visual interest**: Size variation (large hero, medium KPIs, small list rows) and a thin accent bar on the left side of each card break monotony.
- Secondary elements use muted tones, ensuring the accent turquoise draws attention only where needed.

### Unique Element
An **accent-colored vertical timeline bar** runs through the “Heute” list: each shift card aligns to this bar, visually ordering shifts by start time and making the schedule feel like a live timeline.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;700&display=swap`
- **Why this font:** It offers clear, friendly letterforms with strong weight contrast (300 vs 700) that enhance hierarchy and remain highly readable on busy desks or mobile screens.

### Color Palette
All colors use complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(40 20% 97%)` | `--background` |
| Main text | `hsl(210 15% 20%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(210 15% 15%)` | `--card-foreground` |
| Borders | `hsl(210 20% 90%)` | `--border` |
| Primary action | `hsl(174 70% 45%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(174 70% 45%)` | `--accent` |
| Muted background | `hsl(210 20% 96%)` | `--muted` |
| Muted text | `hsl(210 10% 40%)` | `--muted-foreground` |
| Success/positive | `hsl(145 63% 42%)` | (component use) |
| Error/negative | `hsl(0 70% 50%)` | `--destructive` |

### Why These Colors
The very light warm background prevents eye fatigue during long scheduling sessions.  Turquoise evokes clarity and action without the stress of red or the corporate blandness of blue.  Muted greys keep the interface calm so that the accent color guides focus.

### Background Treatment
Plain warm off-white to maximise contrast against the turquoise accent.  A subtle 1 px dashed texture is added via CSS to give the surface tactile warmth without visual noise.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Single-column vertical flow.  Hero KPI dominates the first viewport.  Primary action button is a fixed bottom FAB for thumb reach.

### What Users See (Top to Bottom)

**Header:** App title "Schichtplaner" centre-aligned, a plus-circle icon button on the right that triggers the primary action (Schicht anlegen).

**Hero Section (The FIRST thing users see):**
- Large card (takes ~60 % of first viewport height)
- Displays today’s planned shifts count with 48 px bold number, progress ring indicating percentage filled vs capacity (capacity = total employees * 1 shift)
- Small subtext "Schichten heute geplant"

**Section 2: Sekundäre KPIs**
- Horizontal scroll of 3 KPI cards:  
  1. Mitarbeitende heute im Einsatz  
  2. Offene Schichten diese Woche  
  3. Total Schichtarten

**Section 3: Heute Zeitstrahl**
- Vertical list of today’s shift cards ordered by start time alongside the turquoise timeline bar.  Each card shows employee name, shift type and company.

**Bottom Navigation / Action:**
Floating Action Button (turquoise, plus icon) labelled "Schicht anlegen" fixed above safe-area bottom.

### Mobile-Specific Adaptations
- Secondary KPI cards are horizontally scrollable to save vertical space.
- Shift list cards use compact spacing and condensed text.

### Touch Targets
Buttons ≥ 44 × 44 px, list cards full-width with 8 px padding.

### Interactive Elements
- Tapping a shift card opens a detail dialog with edit options.

---

## 5. Desktop Layout

### Overall Structure
CSS grid with two columns:  
• **Left (65 %)** – hero KPI on top, 7-day bar chart below.  
• **Right (35 %)** – list of today’s shifts scrolling.

Eye path: hero → chart → detailed list.

### Section Layout
- **Top area (left column):** Hero KPI card full width.
- **Below hero (left):** Bar chart "Schichten pro Tag (7 Tage)".
- **Right column:** Sticky shift list with accent timeline.

### What Appears on Hover
- Shift cards reveal edit icon on hover.
- Bars in chart display exact count tooltip.

### Clickable/Interactive Areas
- Clicking a bar filters the shift list to that date.
- Shift cards open detail dialog for quick edits.

---

## 6. Components

### Hero KPI
- **Title:** Geplante Schichten heute
- **Data source:** Schichteinteilung
- **Calculation:** Count of records where `zuweisung_datum` == today
- **Display:** 48 px bold number inside circular progress ring (stroke 8 px, rounded caps, accent color)
- **Context shown:** Percentage vs employees count today (total employees scheduled / total employees) shown as ring progress.
- **Why this is the hero:** Managers immediately see if today is fully staffed.

### Secondary KPIs

**Mitarbeitende heute im Einsatz**
- Source: Schichteinteilung (distinct `zuweisung_mitarbeiter` for today)
- Calculation: Unique employees count
- Format: number
- Display: Small card with 24 px bold number

**Offene Schichten diese Woche**
- Source: Schichteinteilung
- Calculation: Count of records in current ISO week where `zuweisung_mitarbeiter` is null
- Format: number
- Display: Small card

**Gesamt Schichtarten**
- Source: Schichtartenverwaltung
- Calculation: Total records
- Format: number
- Display: Small card

### Chart
- **Type:** BarChart – categorical comparison suits discrete daily counts
- **Title:** Schichten pro Tag (7 Tage)
- **What question it answers:** Sehe ich frühzeitig Unter- oder Überbesetzung in der Woche?
- **Data source:** Schichteinteilung
- **X-axis:** Date label (Mon – Sun)
- **Y-axis:** Count of shifts
- **Mobile simplification:** Remove gridlines and y-axis labels; rely on tooltip.

### Lists/Tables

**Heute (Shift Timeline)**
- Purpose: Quick overview of who works when/where today
- Source: Schichteinteilung joined with Mitarbeiterverwaltung, Schichtartenverwaltung, Unternehmensverwaltung
- Fields shown: Start–Ende, Mitarbeiter Name, Schichtart, Unternehmen
- Mobile style: Card list with accent timeline
- Desktop style: Same cards within right column scroll
- Sort: By `zuweisung_beginn`
- Limit: All for today (scroll)

### Primary Action Button (REQUIRED!)

- **Label:** "Schicht anlegen"
- **Action:** add_record
- **Target app:** Schichteinteilung
- **What data:** Mitarbeiter (lookup), Schichtart (lookup), Unternehmen (lookup), Datum (date), Beginn, Ende, Notiz
- **Mobile position:** fab
- **Desktop position:** header (top right)
- **Why this action:** Creating new shift assignments is the primary daily task of managers.

---

## 7. Visual Details

### Border Radius
rounded (8 px)

### Shadows
subtle – `0 1px 3px hsla(210 15% 20% / 0.08)` on cards; hero card gets slightly larger `0 2px 6px ...0.12`

### Spacing
normal – 16 px base grid; hero gets 40 px top/bottom padding

### Animations
- **Page load:** fade-in then KPI number counts up using spring animation (200 ms)
- **Hover effects:** cards raise shadow; buttons darken accent by 5 % lightness
- **Tap feedback:** buttons scale to 98 % briefly

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --background: hsl(40 20% 97%);
  --foreground: hsl(210 15% 20%);

  --card: hsl(0 0% 100%);
  --card-foreground: hsl(210 15% 15%);

  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(210 15% 15%);

  --primary: hsl(174 70% 45%);
  --primary-foreground: hsl(0 0% 100%);

  --secondary: hsl(210 20% 96%);
  --secondary-foreground: hsl(210 10% 40%);

  --muted: hsl(210 20% 96%);
  --muted-foreground: hsl(210 10% 40%);

  --accent: hsl(174 70% 45%);
  --accent-foreground: hsl(0 0% 100%);

  --destructive: hsl(0 70% 50%);

  --border: hsl(210 20% 90%);
  --input: hsl(210 20% 90%);
  --ring: hsl(174 70% 45%);
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

