# Testing

## Current State
- The codebase currently lacks a comprehensive automated test suite.
- Manual verification and end-to-end testing (e.g., verifying Supabase auth flow and face engine integration) are the primary validation methods.

## Future Testing Strategy
- **Unit Tests**: Implement using Vitest for React components and utility functions.
- **Component Tests**: Use React Testing Library to verify component behavior and DOM interactions.
- **Integration Tests**: Verify the interaction between the React frontend, the local Python Flask API (Face Engine), and the Supabase backend.
- **E2E Tests**: Consider tools like Playwright or Cypress for full system workflows (login -> face scan -> attendance logged).
