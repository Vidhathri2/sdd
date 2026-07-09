# Research & Technical Decisions: Quote Creation, Subscription, & GCP Commitment Flow
 
## Date Splitting & Division Logic (Looker Flow)
 
### Requirement
Given a Start Date, an End Date, and a Frequency (Yearly), generate a sequence of contiguous periods that divide the term into yearly segments (max 365/366 days) with no gaps or overlaps.
 
### Mechanics & Algorithms
1. **Contiguity Guarantee**:
   - For Period $k$ starting at $S_k$ and ending at $E_k$, Period $k+1$ must start at $S_{k+1} = E_k + 1 \text{ day}$.
2. **Yearly Calculation**:
   - Period 1 starts at $S_1 = \text{Term Start Date}$.
   - For each period:
     - The ideal end date is 1 year minus 1 day from the start of that period: $E_k = S_k + 1 \text{ year} - 1 \text{ day}$.
     - If this ideal end date exceeds the overall $\text{Term End Date}$, we cap the period end date: $E_k = \text{Term End Date}$.
   - Repeat until the overall end date is reached.
3. **Leap Years**:
   - Built-in JS `Date` methods handle leap days automatically when we increment using calendar operations (e.g. adding 1 year and subtracting 1 day).
4. **Validation Rules**:
   - `Term Start Date` < `Term End Date`.
   - Each child product row validation: if quantity > 0, then `Region`, `GCP Project ID`, and `Looker Instance Id` are mandatory and must be validated.
 
---
 
## Date Calculation & Term Division Logic (GCP Commit Flow)
 
### Requirement
Given a Start Date and a set of Commitment Periods with custom months durations (e.g. 12 months, 24 months), calculate the overall subscription term length and dynamic Subscription End Date.
 
### Mechanics & Algorithms
1. **Cumulative Term Months**:
   - The total term is the sum of all months across configured periods:
     $$\text{Total Term Months} = \sum_{i=1}^{n} \text{Months}_i$$
2. **Subscription End Date Calculation**:
   - Let the start date be $S$ (e.g., `2026-02-01`).
   - The system adds the total term months to $S$ using standard date addition.
   - Ideal End Date:
     $$E = S + \text{Total Term Months} - 1 \text{ day}$$
   - Example: Start date `2026-02-01` with `Total Term Months = 12` calculates end date as `2027-01-31`.
3. **Leap Years & Boundary Conditions**:
   - Standard JS `Date` methods handle month-end bounds.
   - When adding months, if the day component exceeds the maximum days in the target month (e.g. adding 1 month to Jan 31 in a non-leap year target Feb), JS defaults to the next month. The algorithm must clamp the day to the last day of the target month to prevent month leakage.
 
---
 
## Shorthand Currency Parsing Logic (GCP Commit Flow)
 
### Requirement
Allow users to enter shorthand values (e.g. `10k`, `2.5M`, `1B`) and parse them into numeric values representing the actual commitment amount on blur.
 
### Parsing Algorithm
1. **Regular Expression Pattern**:
   - Extract the numeric part and the multiplier character using a regular expression:
     `/^([0-9]+(?:\.[0-9]+)?)\s*([kKmMyYbB]?)$/`
2. **Multiplier Mapping**:
   - `k` / `K` (Thousands) -> Multiply by $1,000$ ($10^3$)
   - `m` / `M` (Millions) -> Multiply by $1,000,000$ ($10^6$)
   - `b` / `B` (Billions) -> Multiply by $1,000,000,000$ ($10^9$)
3. **Validation Guards**:
   - If regex matching fails, or the parsed number is negative, trigger validation error and highlight field.
 
---
 
## State Persistence & Data Storage
 
### Decision
We will use client-side `localStorage` to persist quotes and mock tables, and `sessionStorage` for temporary navigational context.
 
### Rationale
- Omit complex database/backend setups to preserve speed and allow zero-install local runs.
- `sessionStorage` automatically isolates active deal configurations per tab.
- `localStorage` mimics a server database, allowing us to load, update, and submit quotes across views.
 
---
 
## UI/UX Design System Tokens
 
To satisfy the premium look-and-feel requirement, we define the following CSS tokens:
 
- **Backgrounds**: Slate dark theme (`#0f172a` canvas, `#1e293b` cards) with glassmorphism overlays (`backdrop-filter: blur(12px)`).
- **Accents**: Indigo blue (`#6366f1` base, `#4f46e5` hover, `#818cf8` light) for active buttons and selections.
- **Grays**: High contrast slate tints (`#f8fafc` primary text, `#94a3b8` muted labels, `#334155` borders).
- **Animations**: `0.2s cubic-bezier(0.4, 0, 0.2, 1)` transitions for hover state shifts, accordion drawer toggles, and tab changes.
- **Typography**: Inter (imported from Google Fonts) to replace standard system/browser sans-serif.
