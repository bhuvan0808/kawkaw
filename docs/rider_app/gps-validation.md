# GPS — Validation Checklist

## Permissions
- [ ] First location use prompts for **While using the app**, then upgrade to **Allow all the time** for background.
- [ ] Denial is handled gracefully (the online toggle shows the permission dialog; no crash).
- [ ] "Don't allow" / permanently denied → guidance points to system settings.

## Accuracy & cadence
- [ ] Updates arrive every ~10–15s while online (target 12s).
- [ ] Reported accuracy is reasonable (< ~50 m outdoors with GPS).
- [ ] On the emulator, set a mock location (Extended controls → Location) and confirm it flows to the backend.
- [ ] Moving on a physical device produces a continuous track (no large gaps) on the customer's live‑tracking map.

## Route & ETA
- [ ] The active-delivery screen draws an OSRM route from the rider to the drop.
- [ ] Distance + ETA badge is plausible for the route.
- [ ] If routing fails (no network), the map still shows the drop marker; "Navigate" handoff still works.

## Edge cases
- [ ] GPS disabled mid-trip → ticks skip without crashing; resume when GPS returns.
- [ ] Indoors / poor signal → app keeps running; stale fixes don't spam errors.
- [ ] Airplane mode → locations queue offline and flush on reconnect (see foreground-service doc).
- [ ] Time-zone / clock changes don't break the "last updated" display.

## Cross-device
- [ ] Verify on at least: one stock-Android device and one OEM with custom location/battery handling.
