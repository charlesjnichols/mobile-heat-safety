# Coaching Checklist for Code Orange/Red Days

## Overview
Menu-driven React web application to record heat safety checklists for practices, ensuring compliance with regulations.

## Tech Stack
- Frontend: React 18+ with TypeScript
- UI: Tailwind CSS + shadcn/ui components
- State: React Context + useReducer
- Storage: Local JSON file (download/upload capability)
- Heat Index: National Weather Service formula

## Data Schema

### Practice
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Practice ID | string | auto | UUID, hidden |
| Location | string | yes | Text input |
| Date | Date | yes | Date picker |
| Head Coach | string | yes | Text input |
| Team ID | string | yes | FK to Teams |

### CheckList
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Checklist ID | string | auto | UUID, hidden |
| Practice ID | string | auto | FK to Practice, hidden |
| Time | string | yes | HH:MM format |
| Temperature | number | yes | °F, range 60-130 |
| Relative Humidity | number | yes | %, range 0-100 |
| Heat Index | number | auto | NWS formula, not editable |
| Action Taken | enum | yes | Dropdown selection |

### Heat Index Formula (NWS)
HI = -42.379 + 2.04901523T + 10.14333127RH - 0.22475541TRH 
     - 0.00683783T² - 0.05481717RHD² + 0.00122874T²RH 
     + 0.00085282TRH² - 0.00000199T²RH²

Where T = Temperature (°F), RH = Relative Humidity (%)

### Action Taken Options
- No restrictions
- Water breaks every 30 minutes
- Water breaks every 20 minutes
- Modified practice (reduced intensity)
- Modified practice (shortened duration)
- Cancel outdoor practice
- Move to indoor facility
- Other (specify)

### Teams
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Team ID | string | auto | UUID, hidden |
| Team Name | string | yes | Text input, unique |

## Views

### Main View
- Table with sort by Date, group by Team
- Columns: Date, Location, Team, # Checklists, Max Heat Index
- Menu Bar: Search, Select, Refresh
- Collapsed Menu: About, Feedback, Export (CSV/PDF)
- FAB: Add New Practice

### Team View
- Table listing all teams
- FAB: Add New Team
- Click team to see practices

### Practice Detail View
- Header: Date, Location, Head Coach, Team
- Checklist table (inline view)
- FAB: Add New Checklist Entry

### Checklist Inline View
Columns: Time, Temperature, Humidity, Heat Index, Action Taken, Color Code

### Forms
- Practice Form: Side-by-side layout
- Checklist Form: Side-by-side with live Heat Index calculation
- Team Form: Simple single-column

## Validation Rules
- Temperature: 60-130°F required
- Humidity: 0-100% required
- Time: Valid HH:MM format
- Practice Date: Cannot be future date
- Team Name: Required, unique

## Color Coding
- Green (Heat Index < 80): Normal operations
- Yellow (80-90): Caution - water breaks
- Orange (90-105): Warning - modified practice
- Red (105-130): Danger - cancel practice
- Purple (> 130): Extreme Danger - cancel all activities

## Export
- CSV: All practices with checklists, filterable by date/team
- PDF: Formatted report with header, tables, color-coded heat index

## File Structure
/src
  /components
    /forms
    /tables
    /views
  /utils
    heatIndex.ts
    export.ts
  /types
    index.ts
  /context
    AppContext.tsx