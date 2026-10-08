# Google Play compliance tracker

Status legend: ⬜ todo · 🟨 in progress · ✅ done · ➖ n/a. Update this file whenever a phase touches anything below.

| Item                                               | Status | Notes                                                                                                                     |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| targetSdk 36 (required for new apps)               | ⬜     | Expo SDK 57 default to be verified on `expo prebuild` output in Phase 6 (`android/app/build.gradle`).                     |
| Edge-to-edge                                       | 🟨     | Enforced on API 35+; RN 0.86 / SDK 57 is edge-to-edge by default. Use safe-area insets in every screen (Phase 2).         |
| Predictive back                                    | 🟨     | `android.predictiveBackGestureEnabled: true` in app.json. Verify back gestures on Android 15/16 device in Phase 2.        |
| `com.google.android.gms.permission.AD_ID` declared | ⬜     | Phase 4 (react-native-google-mobile-ads). Required when targeting 33+ and using the advertising ID.                       |
| "Contains ads" declaration                         | ⬜     | Play Console → App content.                                                                                               |
| Privacy policy (hosted URL)                        | ⬜     | Draft → `docs/privacy-policy.md` (Phase 4/6). Owner hosts it.                                                             |
| Data safety form                                   | ⬜     | List exactly what AdMob, Firebase (Analytics, Crashlytics, Remote Config) and our API collect. Phase 5/6.                 |
| Target audience 13+ / not child-directed           | ⬜     | Families policy not applicable if 13+ only; avoid child-appealing store assets. AdMob: no `tagForChildDirectedTreatment`. |
| IARC content rating questionnaire                  | ⬜     | Notes: no violence, no user-generated content, ads present, no gambling.                                                  |
| UMP consent before ad requests                     | ⬜     | Phase 4. Settings → "Privacy options" entry point required when consent form applies.                                     |
| app-ads.txt                                        | ⬜     | `docs/app-ads.txt` with AdMob publisher ID; host on developer website domain listed in Play.                              |
| Accounts / account deletion                        | ➖     | No accounts. If added: in-app **and** web deletion required.                                                              |
| Real ad IDs only in release builds                 | ⬜     | Phase 4: test IDs in dev, real IDs via EAS env. Never click own live ads.                                                 |
| Image licensing                                    | ⬜     | Every level image stores `credit` + `license`; sources: own art, Unsplash, Pexels, Wikimedia Commons.                     |
