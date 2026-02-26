# Cursor Rules - Strict Technical Excellence

## Core Principles
- Modular, simple, and readable code over "clever" or compact code.
- Strict adherence to DRY (Don't Repeat Yourself) and KISS (Keep It Simple, Stupid).
- Maximum 300 lines per file. Refactor immediately if exceeded.
- Use latest stable standards and features of the language/framework.
- no obvious comments - give why
- function  should be less tha 30 lines

## Coding Standards
- No 'any' in TypeScript. Use explicit interfaces and types.
- No one-liners for complex logic. Use 3-5 lines if it improves readability.
- Variable names must be descriptive and verbose enough to avoid ambiguity.
- Functions must be small, focused, and pure where possible.

## AI Interaction Protocol
- Always "think" step-by-step before providing code.
- If a request violates best practices, challenge it and suggest a better architecture.
- When refactoring, ensure no regression by checking dependencies.
- Silent failures are prohibited; implement robust error handling.


additionalsAI Interaction Protocol

- Keep changes small and committable
- No duplicated shared code: use shared/
- Each game lives in apps/<name>/
- No assets at repo root
- Use relative paths
- Everything must work with npm run dev and npm run build