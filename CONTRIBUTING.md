# Contributing to xyz-prompt

Thank you for your interest in contributing! xyz-prompt is a React SPA for rating, comparing, and analyzing LLM system prompts. Contributions of any size are welcome: bugs, features, documentation, and tests.

---

## Development setup

### Prerequisites

| Component | Details |
|-----------|---------|
| Runtime | Node.js >= 20 |
| Package manager | npm |

### 1. Clone and install

```bash
git clone https://github.com/RainbowKolors/xyz-prompt.git
cd xyz-prompt
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Verify your changes

```bash
npm run lint
npm run build
```

Both commands must pass before opening a pull request.

---

## Code conventions

- **Identifiers and commits:** English.
- **Internal comments:** Spanish is acceptable for team-facing notes when helpful.
- **Scope:** Keep pull requests focused. Avoid unrelated refactors.
- **Style:** Match existing patterns in `src/` (Zustand store, Dexie schema, Tailwind utility classes).
- **Types:** Prefer explicit TypeScript types for public APIs and store actions.

---

## Security

- **Never commit** `.env`, `.env.local`, API keys, tokens, or credential files.
- Provider API keys are stored in **browser IndexedDB** at runtime — do not export or commit database dumps containing secrets.
- If you add new environment variables, update `.env.example` with commented placeholders only.

---

## Pull request checklist

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No secrets or `.env` files included
- [ ] README updated if behavior, setup, or architecture changed
- [ ] SVG assets live under `resources/assets/` if visuals were added

---

## Questions

Open a [GitHub issue](https://github.com/RainbowKolors/xyz-prompt/issues) for bugs or feature discussions before large changes.
