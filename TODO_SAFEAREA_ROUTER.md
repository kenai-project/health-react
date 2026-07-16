# TODO: Fix Router basename + safe-area injection + Android run

- [x] Inspect router + Vite config
- [ ] Patch `frontend/src/app/routes.jsx` to use a Capacitor-safe basename (no `./` / no `"/./"`)
- [ ] Locate safe-area CSS injection code and add null guards before `.style` access
- [ ] Patch `frontend/vite.config.ts` if `base` value causes `"/./"` basename
- [ ] Rebuild frontend and verify in browser
- [ ] Re-run `npx cap run android --target emulator-5554`
- [ ] Separately resolve ADB authorization (`device still authorizing`) if it persists

