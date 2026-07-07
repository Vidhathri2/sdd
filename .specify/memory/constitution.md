<!--
Sync Impact Report
Version change: template → 1.0.0
Modified principles: none (new constitution)
Added sections: Technology & Security Constraints; Development Workflow
Removed sections: none
Templates reviewed: .specify/templates/plan-template.md ✅, .specify/templates/spec-template.md ✅, .specify/templates/tasks-template.md ✅
Follow-up TODOs: none
-->

# Deal Studio Constitution

## Core Principles

### I. Demo-first delivery
Prioritize a working, end-to-end Salesforce CPQ flow over edge-case hardening. Delivery MUST focus on a demoable proof-of-concept while preserving basic security, correctness, and clarity.

### II. Server-side Salesforce integration
All Salesforce OAuth and REST API calls MUST occur in Next.js server routes. The browser MUST never directly call Salesforce endpoints, and the Connected App secret MUST never be exposed to client-side code.

### III. Environment-driven configuration
No credentials, secrets, or Salesforce-specific configuration may be hardcoded. Required values MUST come from environment variables and be documented in `.env.example`; local development uses `.env.local`.

### IV. Separation of concerns
Keep Salesforce authentication, data fetching, and data writing separate from UI components. The integration layer and presentation layer MUST be independently maintainable.

### V. Modular readability
Prefer modular, readable implementation over cleverness. Code MUST be easy for a reviewer unfamiliar with implementation details to understand, with straightforward naming, small functions, and explicit responsibilities.

## Technology & Security Constraints
- Use Next.js with TypeScript and Tailwind CSS.
- Build Deal Studio as a standalone web application, not a Salesforce-hosted app.
- Use server-side API routes for all Salesforce integration and OAuth.
- Protect auth sessions with secure cookie practices (`httpOnly`, `sameSite`, secure in production).
- Fail fast on missing required environment variables rather than embedding defaults.
- Avoid unnecessary dependencies; add libraries only when they reduce complexity or improve maintainability.

## Development Workflow
- Build the minimum viable demo flow first, then refine based on feedback.
- Keep UI and backend changes separate in review and commit history.
- Validate changes with local build verification before merging.
- Document required environment variables and setup steps clearly for reviewers and teammates.

## Governance
- This constitution is the source of truth for Deal Studio architecture, security, and delivery tradeoffs.
- Any change to the stack, security model, or secret handling MUST include an updated constitution and a version bump.
- PR reviewers MUST verify that Salesforce secrets are not exposed client-side and that API calls remain server-side.
- Manager review is required for any changes that alter the core integration or security constraints.
- Amendments MUST be accompanied by a build validation step and a short rationale.

**Version**: 1.0.0 | **Ratified**: 2026-06-22 | **Last Amended**: 2026-06-22
