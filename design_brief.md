# Design Brief: Schichtplaner Dashboard

## 1. App Analysis

### What This App Does
The Schichtplaner suite manages shift planning for companies. It stores companies, employees, shift types and each individual shift assignment. Managers need a fast overview of upcoming work as well as the ability to add new shifts on-the-go.

### Who Uses This
• Office managers and shift supervisors who organise daily staff rotations.  
• They are not tech-savvy — they expect an at-a-glance view and one tap to add a shift.

### The ONE Thing Users Care About Most
“How many shifts are scheduled today?” — they open the dashboard each morning to confirm coverage.

### Primary Actions (IMPORTANT!)
1. **Schicht anlegen** → Primary Action Button (adds a new `Schichteinteilung` record).  
2. Inspect upcoming shifts for the week.  
3. View employee details (secondary drill-down).

---

## 2. What Makes This Design Distinctive

### Visual Identity
Warm cream background combined with a terracotta accent (#e06b2d) creates an inviting, slightly tactile feel that fits the human-centred nature of shift planning. Subtle shadows and generous whitespace evoke paper schedule boards while still feeling modern.

### Layout Strategy
An **asymmetric** layout emphasises the hero KPI on the left, with supporting metrics and a chart on the right. Size variation (large hero card vs small KPI cards) and an accent-coloured progress ring around the hero value create visual interest without clutter.

### Unique Element
The hero KPI card features a circular progress ring that fills as the day’s scheduled shifts reach 100 %. The ring uses an 8 px stroke with rounded caps and a soft inner shadow, making the number feel tangible and “almost clickable”.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans  
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;700&display=swap`  
- **Why this font:** Friendly, professional geometry that remains highly legible at both large and small sizes, adding personality compared to system fonts.

### Color Palette (all hsl())

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(35 60% 97%)` | `--background` |
| Main text | `hsl(24 20% 18%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(24 20% 18%)` | `--card-foreground` |
| Borders | `hsl(35 30% 85%)` | `--border` |
| Primary action | `hsl(20 80% 50%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(20 80% 50% / 15%)` | `--accent` |
| Muted background | `hsl(35 60% 94%)` | `--muted` |
| Muted text | `hsl(24 10% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(140 45% 45%)` | *(component)* |
| Error/negative | `hsl(0 70% 50%)` | `--destructive` |

### Why These Colors
Terracotta accent echoes bulletin-board pins and emphasises actionable items. Cream background reduces glare compared to stark white and supports long desktop sessions.

### Background Treatment
Plain cream (`--background`) with a **2 % vertical gradient** from 97 % → 98 % lightness adds barely noticeable depth.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Single-column vertical flow. Hero KPI dominates first viewport (≈60 % height). Secondary KPIs follow in a horizontally scrollable row. Chart then upcoming-shifts list. Primary action button floats bottom-right (FAB) for thumb reach.

### What Users See (Top to Bottom)

**Header:** App name “Schichtplaner” centred; small settings icon right.  
**Hero Section:** Circular ring + number of today’s shifts (48 px number). Ring diameter 180 px. Below, label “Schichten heute”.  
**Section 2 – Quick KPIs:** Horizontal scroll of three small cards (Employees, Shift Types, Shifts diese Woche).  
**Section 3 – Chart:** Bar chart “Schichten pro Tag (7 Tage)” full-width aspect-ratio 16:9.  
**Section 4 – Liste:** List of next 5 upcoming shifts (date, employee, shift type).  
**Bottom FAB:** Terracotta “Schicht anlegen” + plus icon.

### Mobile-Specific Adaptations
Cards stack inside scroll; list items use card style with large touch targets (min-height 56 px).

### Touch Targets
All buttons ≥44 px height; FAB diameter 56 px.

### Interactive Elements
• Tapping a KPI card scrolls to corresponding section.  
• Tapping a list item opens record (handled elsewhere).

---

## 5. Desktop Layout

### Overall Structure
Two-column grid (16 / 8). Left column contains hero KPI on top, then bar chart. Right column stacks secondary KPIs then upcoming-shifts list. Eye flow: hero → chart → KPIs → list.

### Section Layout
- **Top left (hero):** 340 × 340 px card with progress ring and big number.  
- **Below hero:** Bar chart full left-column width.  
- **Right column top:** Three KPI cards in grid 3 × 1.  
- **Right column bottom:** Upcoming shifts list (scroll if >8 items).

### What Appears on Hover
• Bar chart bars highlight accent colour and show exact count tooltip.  
• List rows reveal “Bearbeiten” icon.

### Clickable/Interactive Areas
• KPI cards clickable same as mobile.  
• List rows clickable.

---

## 6. Components

### Hero KPI – “Schichten heute”
- **Title:** Schichten heute  
- **Data source:** `Schichteinteilung`  
- **Calculation:** Count of records where `zuweisung_datum === heute`  
- **Display:** Large number (48 px, weight 700) inside circular progress ring representing `(count / employees) × 100 %`.  
- **Context shown:** Sub-label shows “von [totalEmployees] Mitarbeitern”.  
- **Why this is the hero:** Confirms staffing for current day instantly.

### Secondary KPIs

**Mitarbeiter**  
- Source: `Mitarbeiterverwaltung`  
- Calculation: Count of records  
- Format: number  
- Display: Small card (title 14 px, number 28 px, users-icon).

**Schichtarten**  
- Source: `Schichtartenverwaltung`  
- Calculation: Count of records  
- Display: same style with schedule-icon.

**Schichten diese Woche**  
- Source: `Schichteinteilung`  
- Calculation: Count of records with date in current ISO week.  
- Display: same style.

### Chart – “Schichten pro Tag (7 Tage)”
- **Type:** Bar chart  
- **What question it answers:** Do we have load spikes this week?  
- **Data source:** `Schichteinteilung`  
- **X-axis:** Next 7 calendar days (locale “de”).  
- **Y-axis:** Anzahl Schichten.  
- **Mobile simplification:** Bars narrower; tooltip only on tap.

### List – „Bevorstehende Schichten“
- Purpose: Quick view of next shifts  
- Source: `Schichteinteilung`  
- Fields shown: Datum (DD.MM), Mitarbeiter (Vorname Nachname), Schichtart  
- Mobile style: card list  
- Desktop style: simple table  
- Sort: by `zuweisung_datum` ASC  
- Limit: 10 items (mobile 5).

### Primary Action Button (REQUIRED!)
- **Label:** Schicht anlegen  
- **Action:** add_record  
- **Target app:** `Schichteinteilung`  
- **What data:** Form asks for Mitarbeiter (lookup), Schichtart (lookup), Datum (date), Beginn, Ende, Notiz  
- **Mobile position:** fab  
- **Desktop position:** header (right)  
- **Why this action:** Creating new shifts is the main daily task for managers.

---

## 7. Visual Details

- **Border Radius:** rounded (8 px)  
- **Shadows:** subtle 2 px y-offset, 8 px blur, rgba(0,0,0,0.05)  
- **Spacing:** normal (8-24 px rhythm)  
- **Animations:**  
  - Page load: fade-in 150 ms  
  - Hover effects: card lifts 2 px  
  - Tap feedback: background accent flashes 60 ms

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --background: hsl(35 60% 97%);
  --foreground: hsl(24 20% 18%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(24 20% 18%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(24 20% 18%);
  --primary: hsl(20 80% 50%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(35 60% 94%);
  --secondary-foreground: hsl(24 20% 18%);
  --muted: hsl(35 60% 94%);
  --muted-foreground: hsl(24 10% 50%);
  --accent: hsl(20 80% 50% / 15%);
  --accent-foreground: hsl(20 80% 45%);
  --destructive: hsl(0 70% 50%);
  --border: hsl(35 30% 85%);
  --input: hsl(35 30% 85%);
  --ring: hsl(20 80% 50% / 40%);
}
```

---

## 9. Implementation Checklist
- [ ] Font link added to `index.html`.  
- [ ] All CSS variables copied.  
- [ ] Hero progress ring prominent.  
- [ ] Mobile FAB present.  
- [ ] Data calculations correct.  
- [ ] Loading & error states handled.  
- [ ] Primary action opens form and creates record.

---

## Quality Checklist
✔ Distinctive accent and hero ring  
✔ Clear hierarchy and non-generic layout  
✔ Mobile and desktop designed separately  
✔ All required variables and components specified

