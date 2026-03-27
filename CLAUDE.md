# Project conventions

## Components

- Do NOT create index.ts barrel files for components. Import directly from the component file.
- Always use Radix UI primitives for interactive components (sliders, dialogs, tooltips, toggles, etc.) to ensure accessibility (ARIA, keyboard navigation, focus management) is handled correctly.

## File naming

- All files and directories must use kebab-case (e.g. `bouncing-text.tsx`, `control-panel.module.scss`).
