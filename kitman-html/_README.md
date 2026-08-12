# kitman-html — design reference (do not build or import)

These 32 static HTML pages are the **approved UI/UX reference** for the marketplace — the exact
look & feel to reproduce in React.

- **Reference only.** Nothing in `src/` imports from here. It is not part of the Vite build,
  is ignored by ESLint/Prettier, and is never served.
- Rebuild each screen with our own React components (`src/components/ui`) and Tailwind tokens.
  The result should *look* like these pages, not reuse their markup/CSS.
- Open any file directly in a browser to see the target. `pages-directory.html` lists them all.
