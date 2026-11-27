# Test changes

Every change to a test file, with the category and the citation that says the new
expectation is right. See `~/.claude/skills/ship-ready/references/test-integrity.md`.

## 27 Nov 2026

| File | Category | What changed | Citation |
|---|---|---|---|
| `apps/web/e2e/core-flow.spec.ts` | mechanical-rename | The three sound-control locators gained `exact: true`. | My own defect, not the code's. `getByRole("radio", { name: "On" })` matches by substring, so it resolved to both "On" and "Rest only" and Playwright refused in strict mode. The page snapshot in the failure shows the control rendering correctly with `aria-checked="true"` on "On", so the assertion was right and the locator was wrong. No assertion was loosened: the test still requires the same attribute on the same control. |
