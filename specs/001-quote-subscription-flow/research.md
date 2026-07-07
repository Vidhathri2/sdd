# Research & Technical Decisions: Quote Creation & Subscription Period Configuration Flow

## Date Splitting & Division Logic

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
   - Built-in JS `Date` methods handles leap days automatically when we increment using calendar operations (e.g. adding 1 year and subtracting 1 day).
   - Example: Period starting Feb 1, 2024 (leap year) ending Jan 31, 2025. Period starting Feb 1, 2025 ending Jan 31, 2026.
4. **Validation Rules**:
   - `Term Start Date` < `Term End Date`.
   - Each child product row validation: if quantity > 0, then `Region`, `GCP Project ID`, and `Looker Instance Id` are mandatory and must be validated.

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
- **Animations**: `0.2s cubic-bezier(0.4, 0, 0.2, 1)` transitions for hover state shifts, slide-out drawer animations, and tab changes.
- **Typography**: Inter (imported from Google Fonts) to replace standard system/browser sans-serif.
