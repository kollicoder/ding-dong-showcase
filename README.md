# ding-dong showcase

Public, try-it-yourself demo of the ding-dong (working name) hyperlocal delivery app for Porur, Chennai.
Live: https://kollicoder.github.io/ding-dong-showcase/

- `/app/` — the web prototype (kollicoder/porur-delivery-prototype) built in **sandbox mode**
- `/seller/` — the Expo partner/seller app (kollicoder/porur-delivery-native, apps/vendor) exported for web in sandbox mode
- `source/sandbox/firebase-mock.js` — replaces `firebase/app|auth|firestore` at build time with a localStorage store seeded with demo data. No network calls to Firebase; frames on this origin sync live via BroadcastChannel. One-tap login with `?demo=customer|seller|rider|admin`.

Rebuild: web `npx vite build --config vite.sandbox.config.js` in the prototype repo; seller `DD_SANDBOX=1 DD_BASE=/ding-dong-showcase/seller npx expo export --platform web` in apps/vendor.
