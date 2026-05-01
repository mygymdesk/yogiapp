# Login smoothness fix + full UI/UX polish pass

## Part 1 — Why login feels slow & "sudden" (root causes)

Three concrete problems compound:

1. **Double session check.** `login.tsx` calls `signInWithPassword`, then `navigate("/")`. The `/_app` route's `beforeLoad` then calls `supabase.auth.getSession()` *again* before rendering anything — that's a second async round-trip while the screen is blank.
2. **Cold Supabase client + query waterfall.** `Today` mounts and fires 7 independent hooks (`useTodayWater`, `useTodayMood`, `useWeightLogs`, `useWalkLogs`, `useProfile`, `useMedicines`, `useTodayMeals`) with no shared cache. The page renders empty, then "pops" once data lands → the "logged in suddenly" feeling.
3. **No transition.** Login button → blank → fully-loaded Today, with zero motion bridging the two. The eye reads this as a freeze.

## Part 2 — Login fixes (Batch 1)

### 2.1 Remove the double session check
- In `src/routes/_app.tsx` `beforeLoad`, instead of calling `getSession()` (network-ish, hits storage + JWT validate), read `supabase.auth.getSession()` only once on first load and rely on the in-memory session afterwards. Replace with a synchronous check via the AuthContext when possible, or cache the session in a module-level `let` so subsequent navigations don't re-await.
- Even better: use `loader` returning the session and `staleTime: Infinity`, so tab switches don't re-validate.

### 2.2 Optimistic post-login transition
- In `login.tsx`, after `signInWithPassword` succeeds, show a brief success state on the button ("Signed in ✓"), then navigate. Wrap the whole login screen in an `AnimatePresence` exit (slide-up + fade) so it doesn't just disappear.
- Add a 1-frame `requestAnimationFrame` before navigate so the success state is visible.

### 2.3 Skeleton-first Today screen
- Add `src/components/TodayTileSkeleton.tsx` — same dimensions as `TrackerTile`, shimmering bg, no count.
- In `Today`, while any of the 7 queries are still loading on first mount, render skeletons. This kills the "blank then snap-in" effect.
- The `AdherenceRing` should mount at 0% then animate to value (it already animates — just don't render `Math.round(NaN/NaN)`).

### 2.4 Route transition wrapper
- Wrap `<Outlet />` in `_app.tsx` with `AnimatePresence` + `motion.div` keyed by `pathname`, fading content in over ~180 ms. Same for `login → /`.

### 2.5 (Optional, big win) React Query
- Introduce `@tanstack/react-query` with a single `QueryClient` in `__root.tsx`. Convert the 7 tracker hooks to `useQuery` with shared `queryKey: ['today', userId]`. Result: cached across tab switches, no waterfall on remount, instant "Today" on return visits.
- If the user prefers minimum churn, skip this and just do 2.1–2.4 — improvement will still be noticeable.

---

## Part 3 — Senior UI/UX audit (full app)

Grouped by impact. Each item is concrete and actionable.

### A. Motion & feedback (highest ROI for "feels premium")
1. **Route transitions** — currently none. Add 180 ms fade+8 px slide between every `_app/*` route.
2. **Skeleton loaders** — Today, Insights, Diet, Plan all render blank then pop. Need shimmer skeletons matching final layout.
3. **Bottom-tab indicator** — `layoutId="tab-indicator"` is good, but the icon doesn't scale on activation. Add `whileHover`/active scale 1.05 on the active icon.
4. **Tile press feedback** — `TrackerTile` taps should `whileTap scale 0.97` + subtle haptic (already imported, just unused on tap-through tiles).
5. **Toast** — currently top-of-screen pill. Promote to a small icon + text (✓ for success, ⚠ for error) with color tint; auto-dismiss in 2 s, swipe to dismiss.
6. **CountUp** — verify easing (should be `easeOutCubic`, ~0.6 s); right now numbers may snap.

### B. Login screen polish
7. Country picker is a button + dropdown stack; replace with a proper sheet for native feel.
8. Phone input formatting — group digits as user types (`98765 43210`) instead of raw stream.
9. Password field — add caps-lock indicator and "forgot password?" link (currently no recovery).
10. Submit button — replace "…" with a spinner; disable for the duration with subtle opacity dip.
11. **Error states** — toast is fine but the input itself should briefly shake on auth failure.

### C. Today screen
12. Greeting fades in (already client-only) but causes a flash from "Hello." to "Good evening." Pre-render an empty placeholder of the same height to avoid layout shift.
13. **Adherence ring** is the hero element but lacks a label inside (just a number). Add small "today" caption beneath the percentage.
14. Tile order is fixed; consider letting the user reorder later. For now, group: *primary daily* (Diet, Water, Walk) above *check-ins* (Medicine, Mood, Weight) with a subtle divider.
15. Empty-state copy is good ("Tap to log your first meal") — keep it but italicize secondary copy with the Fraunces serif for warmth.

### D. Settings (it's long — break it up)
16. Settings is one giant scroll with 5 sections and ~25 fields. Split into sub-routes: `/settings/profile`, `/settings/targets`, `/settings/notifications`, `/settings/security`. Index lists them with a chevron.
17. **Save button** — currently floating? Add a sticky bottom "Save changes" bar that only appears when the form is dirty.
18. Toggles are custom but inconsistent (different bg colors when off). Standardize via a `Switch` component.
19. Timezone is a `<select>` of 9 hardcoded zones — promote to a searchable sheet using `Intl.supportedValuesOf('timeZone')`.
20. Time pickers (`type="time"`) render natively & ugly on Android. Use a custom wheel picker or at minimum theme via CSS.
21. Push notification card has the test/disable/enable buttons crammed; space them, give "Test" a different visual weight (ghost), keep "Off" destructive but smaller.

### E. Bottom sheets (Water, Mood, Medicine, Meal, Walk, Weight)
22. Drag-to-dismiss is implemented well. Add a subtle scale-down of the underlying app (~0.96) when sheet is open for depth.
23. Sheets don't trap focus → keyboard users tab out into the page below. Add focus trap + restore on close.
24. Numeric steppers should support long-press to repeat increment.

### F. Typography & rhythm
25. Mixing Geist + Fraunces + Geist Mono + Inter is one font too many. Drop **Inter** (root link loads it, never used after Geist).
26. Consistent vertical rhythm — `pt-12` is used as page top padding everywhere; that's good. Standardize section spacing to a 24/32 px scale (currently mixes 6/8/16).
27. Headings use Fraunces at 28 px / 36 px — good. Add an h2 level (Fraunces 20 px medium) for sub-sections, currently jumps from 28 px → 11 px uppercase eyebrow.

### G. Color & contrast
28. `text-text-muted` at 40% opacity on `bg-bg-base` likely fails WCAG AA on small text. Bump muted to ~55% on body copy ≤14 px.
29. Single accent per tracker (`accent="diet|water|...`) is great. Verify each has the same saturation; right now `walk` and `weight` may look dimmer than `water`.
30. Status bar — `meta theme-color` is `#0A0A0B`. Match the chrome on iOS PWA (status-bar-style is `black-translucent` which can clash with light content scroll). Confirm both.

### H. Empty / error / offline
31. No empty states for Insights when there's <7 days of data — show an illustration + "Log a few days to see trends".
32. No offline indicator. Service worker is registered for push but not for caching shell. Add a small "You're offline — changes will sync later" banner driven by `navigator.onLine`.
33. Error boundary in `_app/*` routes is missing — only `defaultErrorComponent` exists. Add per-route to give context-specific recovery (e.g. "Couldn't load Insights — retry").

### I. Accessibility
34. Buttons made from `<button>` without `aria-label` for icon-only ones (`Eye`/`EyeOff` toggle, tab bar, close handles).
35. Bottom sheet `role="dialog"` + `aria-modal="true"` missing.
36. Color is the only signal on toggle on/off; add an inner check icon when on.
37. Hit targets: tab bar items are 64 px tall ✓; ensure all icon-only buttons are ≥ 44×44 (some are 36).

### J. Performance / perceived speed
38. Today fires 7 separate Supabase queries serially-ish on every mount. Batch via React Query (see §2.5) or a single RPC `get_today_summary`.
39. Preload next likely route on tab hover/touch-start (TanStack `defaultPreload="intent"`).
40. Service worker should cache the app shell so reopening from home screen is instant.

---

## Part 4 — Suggested execution order

I recommend doing this in **3 small batches** so each is reviewable:

- **Batch 1 (login smoothness — ~1 prompt):** §2.1, 2.2, 2.3, 2.4, plus A.1 route transition.
- **Batch 2 (visual polish across app):** A.2–A.6, F.25–27, G.28–29, I.34–36.
- **Batch 3 (structural refactors):** D.16 (split settings), §2.5 (React Query), §38 (batched RPC), H.31–33 (offline/empty/error states).

Want me to proceed with **Batch 1** first, or pick specific items from the audit?