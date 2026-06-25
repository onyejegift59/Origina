# UX, Accessibility & Product Experience Audit: Origina

**Date:** June 25, 2026
**Scope:** Landing page, auth, sidebar, project creation, chat workspace, artifact system, settings, exports

---

## 1. Critical UX Issues

### C1. Copy Buttons Invisible on Touch Devices

**Files:** `ChatMessage.module.css:40-41,93-98`
**Issue:** Message copy buttons use `opacity: 0` with `hover`-only visibility. On touch devices there is no hover state — buttons are permanently invisible. This is a WCAG 2.1 Level A failure (non-text content not programmatically determinable).
**Impact:** Mobile users cannot copy AI responses or their own messages. Core interaction is hidden.
**Fix:** Show copy buttons always on touch devices, or use `display: flex` with a semi-transparent state.

### C2. Touch Targets Below 44px Everywhere

**Files:** Multiple CSS modules
**Issue:** Nearly all interactive elements fall below the 44x44px WCAG 2.5.8 minimum:
- Toolbar buttons: 26x26px (`ArtifactCard.module.css:85`)
- Footer buttons: 26px min-height (`ArtifactCard.module.css:254`)
- Send/Stop: 34px height (`MessageComposer.module.css:48`)
- Chips: ~24px (`ArtifactChips.module.css:20`)
- Menu buttons: 36px (`ChatWorkspace.module.css:240`)
- Header nav: 30-34px (`page.module.css:107,122`)
- Input fields: ~42.5px (`login.module.css:83`)
**Impact:** Users with motor impairments and mobile users struggle with all interactive elements.
**Fix:** Increase padding to guarantee 44px min-height on all interactive elements.

### C3. Artifact Generation Errors Are Silent

**File:** `ChatWorkspace.tsx:56-58`
**Issue:** `handleGenerateArtifact` catches errors and logs to console only. The user receives zero feedback when generation fails. The `generatingArtifact` state clears silently.
**Impact:** Users think generation succeeded but nothing appears. No recovery path.
**Fix:** Surface error messages to the user via inline alert or toast.

### C4. Empty `<div>` During Session Check

**File:** `login/page.tsx:81-83`
**Issue:** While checking auth session, returns `<div className={styles.page} />` — a completely blank page with no spinner, skeleton, or status message.
**Impact:** Users think the page is broken. Screen reader users get silence.
**Fix:** Add a loading spinner or skeleton matching the form layout.

### C5. `readOnly` Trick Blocks Password Managers

**File:** `login/page.tsx:19-20,118,141`
**Issue:** Email and password fields start as `readOnly={true}`, becoming editable only on `onFocus`. This fights password managers, breaks autofill, and frustrates users who rely on saved credentials.
**Impact:** Returning users must manually type credentials every time.
**Fix:** Remove the `readOnly`/`setReadOnly` pattern entirely. Use `autoComplete` attributes instead.

### C6. No "Forgot Password?" Link

**File:** `login/page.tsx:128-175`
**Issue:** No password reset flow exists in the UI. Users who forget their password are locked out permanently with no recovery path.
**Impact:** Account lockout with no self-service recovery.
**Fix:** Add "Forgot password?" link that triggers Supabase password reset email.

---

## 2. High Priority Improvements

### H1. Password Requirements Never Shown Upfront

**File:** `signup/page.tsx:87-149`
**Issue:** Password rules (8+ chars, uppercase, lowercase, number) are never displayed to the user. Validation errors reveal one rule at a time on blur. Users must guess requirements.
**Fix:** Render a checklist below the password field showing all 4 requirements with live checkmarks.

### H2. Signup Redirects Without Email Confirmation Handling

**File:** `signup/page.tsx:62`, `api/auth/signup/route.ts:38-44`
**Issue:** After signup, the user is immediately redirected to `/dashboard`. If email confirmation is required (Supabase default), the user arrives unauthenticated and sees a blank/error state.
**Fix:** Show "Check your email for a confirmation link" on signup success instead of redirecting.

### H3. No Loading Indicator When Generating from Chips

**File:** `ChatWorkspace.tsx:51-63`
**Issue:** `generatingArtifact` state exists but no visual indicator appears in the chips area. Chips remain enabled during generation (potential race condition).
**Fix:** Wire `generatingArtifact` to disable chips. Show spinner on the clicked chip.

### H4. `autoComplete="new-password"` on Login Field

**File:** `login/page.tsx:140`
**Issue:** Login password field uses `autoComplete="new-password"`, telling password managers this is a registration field.
**Fix:** Change to `autoComplete="current-password"`.

### H5. iOS Safari Zooms on Input Focus

**File:** `login/login.module.css:86`, `tokens.css:80`
**Issue:** Input font-size is 15px. iOS Safari zooms the viewport on any input with font-size < 16px, disorienting the user.
**Fix:** Set `font-size: 16px` on all text inputs (mobile override).

### H6. `isRefining` Prop Never Passed (Bug)

**File:** `ChatWorkspace.tsx:173`
**Issue:** `isRefining` is defined on `ArtifactCard` but never passed from `ChatWorkspace`. The refine button's "..." loading state is dead code — refinement shows no loading indicator.
**Fix:** Wire `isRefining` state from ChatWorkspace to ArtifactCard.

### H7. No Escape Key Handlers on Modals/Panels

**Files:** `ArtifactCard.tsx:202-226`, `ArtifactsHub.tsx:76-184`
**Issue:** Artifact modal and Artifacts Hub panel cannot be closed with Escape. Keyboard users must Tab to the close button.
**Fix:** Add Escape key handlers to both overlays.

### H8. No Password Confirmation on Signup

**File:** `signup/page.tsx:87-149`
**Issue:** No "Confirm password" field. Users can mistype their password with no way to recover, especially problematic given no password reset flow.
**Fix:** Add confirm password field with match validation.

### H9. Signup Eye Button Unreachable by Keyboard

**File:** `signup/page.tsx:127`
**Issue:** `tabIndex={-1}` on the show/hide password button. Login page does NOT have this — inconsistent. Keyboard users cannot toggle password visibility on signup.
**Fix:** Remove `tabIndex={-1}` to match login behavior.

### H10. Refine Action Hidden in Collapsed Card State

**File:** `ArtifactCard.tsx:166`
**Issue:** Refine button only renders when card is `expanded=true`. Users in collapsed view have no indication refinement is possible.
**Fix:** Show a disabled Refine hint in collapsed state, or surface it via an icon.

---

## 3. Accessibility Findings (WCAG 2.2 AA)

### A1. Keyboard Navigation Gaps

| Issue | Files | WCAG Criterion |
|-------|-------|----------------|
| No Escape on modals/panels | `ArtifactCard.tsx:202-226`, `ArtifactsHub.tsx:76-184` | 2.1.2 No Keyboard Trap |
| No Arrow keys in "More" dropdown | `ArtifactChips.tsx:90-103` | 2.1.1 Keyboard |
| No Arrow keys in sidebar/settings tablist | `SidebarProjects.tsx:70-148`, `settings/page.tsx:312` | 2.1.1 Keyboard |
| `<span>` used as button for rename | `SidebarProjects.tsx:122-128` | 4.1.2 Name, Role, Value |
| Copy buttons hover-only visibility | `ChatMessage.module.css:40,93` | 1.1.1 Non-text Content |
| No visible focus on rename button | `projects.module.css:132-138` (opacity:0) | 2.4.7 Focus Visible |

### A2. Missing Landmarks

| Issue | Files |
|-------|-------|
| No `<main>` in dashboard layout | `dashboard/layout.tsx` |
| No breadcrumbs on any page | All pages |
| No page `<title>` updates per page | `layout.tsx:9` |

### A3. Focus Management

| Issue | Files |
|-------|-------|
| Session check returns empty div | `login/page.tsx:81-83` — focus lost |
| Export dropdown no focus trap | `ArtifactCard.tsx:134-164` |
| "More" dropdown no focus management | `ArtifactChips.tsx:88-103` |

### A4. Touch Targets (WCAG 2.5.8)

| Element | Actual | Required | Difference |
|---------|--------|----------|------------|
| Toolbar buttons | 26x26px | 44x44px | -18px |
| Footer buttons | 26px min-height | 44px | -18px |
| Send/Stop buttons | 34px | 44px | -10px |
| Chips | ~24px | 44px | -20px |
| Header nav buttons | 30-34px | 44px | -10-14px |
| Input fields | ~42.5px | 44px | -1.5px |

---

## 4. Mobile Issues

| Issue | Files | Impact |
|-------|-------|--------|
| Copy buttons invisible (no hover on touch) | `ChatMessage.module.css:40,93` | Core feature hidden |
| Touch targets below 44px everywhere | Multiple CSS files | Difficult to tap |
| iOS zoom on input focus (15px font) | `login.module.css:86` | Disorienting zoom |
| FAB sticky inside overflow container | `ArtifactsHub.tsx:66`, `ChatWorkspace.module.css:12` | May not stick |
| Horizontal chip scroll hides items | `ArtifactChips.module.css:119-143` | Content hidden |
| Export dropdown overflow on small screens | `ArtifactCard.module.css:578-580` | Clipped |
| Hero min-height 720px too tall | `page.module.css:27` | Content below fold |
| Collapsed sidebar broken on mobile | `Sidebar.module.css:64-68` | Invisible sidebar |

---

## 5. Design Consistency Issues

| Issue | Files |
|-------|-------|
| Redundant artifact labels (toolbar + preview + footer) | `ArtifactCard.tsx:60,81,121` |
| Export format labels: "MARKDOWN" vs "MD" | `ArtifactCard.tsx:159`, `ArtifactsHub.tsx:167` |
| Inconsistent `aria-live` on errors | `login/page.tsx:162` vs `signup/page.tsx:145` |
| Two artifact generation UIs (buttons + chips) | `ChatWorkspace.tsx:183-211` |
| Duplicate rename logic in sidebar and projects page | `SidebarProjects.tsx:30-58`, `projects/page.tsx:52-83` |
| Missing Tooltip on Export button | `ArtifactCard.tsx:134` (all other buttons have Tooltip) |
| Selected chip state never clears | `ArtifactChips.tsx:39,57-62` |
| No loading spinner on buttons (text change only) | `login/page.tsx:168`, `signup/page.tsx:148` |

---

## 6. Quick Wins

| Effort | Fix | Files |
|--------|-----|-------|
| 5 min | Remove `tabIndex={-1}` from signup eye button | `signup/page.tsx:127` |
| 5 min | Change `autoComplete="new-password"` to `"current-password"` | `login/page.tsx:140` |
| 5 min | Remove `readOnly` trick from login form | `login/page.tsx:19-20,118,141` |
| 5 min | Standardize `aria-live` on error messages | `login/page.tsx:162`, `signup/page.tsx:145` |
| 10 min | Add spinner/loading state to session check | `login/page.tsx:81-83` |
| 10 min | Add `aria-label` to artifact card action buttons | `ArtifactCard.tsx` |
| 10 min | Fix `isRefining` prop wiring | `ChatWorkspace.tsx:173` |
| 15 min | Add Tooltip to Export button | `ArtifactCard.tsx:134` |
| 15 min | Add 44px min-height to all interactive elements | Multiple CSS files |
| 20 min | Standardize export format labels | `ArtifactCard.tsx:159`, `ArtifactsHub.tsx:167` |
| 20 min | Add Escape handlers to modal and hub panel | `ArtifactCard.tsx:202-226`, `ArtifactsHub.tsx:76-184` |
| 20 min | Add `<main>` landmark to dashboard layout | `dashboard/layout.tsx` |

---

## 7. Persona-Based Evaluation

### First-Time Founder
- **Lands on page**: Generic illustration doesn't show what Origina actually produces. No screenshots of artifacts.
- **Signs up**: Password requirements hidden. No ToS/privacy links. No email confirmation messaging.
- **Creates project**: Name silently truncated at 40 chars. No character counter.
- **First chat**: No example prompts. Empty state says "What would you like to create today?" but gives no guidance on what the AI can do.
- **Generates artifact**: No feedback if generation fails. Chips show no loading state.
- **Exports**: Format labels inconsistent. No descriptions of what each format contains.

### Non-Technical User
- **Login**: `readOnly` trick prevents password manager from filling credentials. No "Forgot password?" link if locked out.
- **Navigation**: No breadcrumbs. No "Back to Projects" button on workspace. Sidebar collapse icon doesn't indicate direction.
- **Settings**: All settings stored in localStorage only — lost if browser data cleared. No password/email change. No session management.
- **Artifact refinement**: Hidden behind expand action. No indication refinement exists in collapsed state.

### Mobile User
- Copy buttons invisible (no hover on touch). Touch targets all below 44px. iOS Safari zooms on every input. FAB may not stick. Chip scrollbar hidden.

### Keyboard-Only User
- Signup eye button unreachable (`tabIndex={-1}`). Modals and panels can't be closed with Escape. "More" dropdown lacks arrow keys. Rename button hidden until mouse hover. `<span>` used as button for rename (no Space key).

### Returning User
- No breadcrumbs to navigate project hierarchy. No search/filter for projects. Sidebar shows unlimited "Recent Projects". All settings are localStorage-only (lost across devices or browser data clear). No way to change password or email. No session management.

---

## 8. Recommendations Priority

| Priority | Count | Key Areas |
|----------|-------|-----------|
| Immediate | 6 | Fix copy buttons on mobile, add 44px touch targets, surface generation errors, fix session check loading, remove readOnly trick, add forgot password |
| High | 10 | Show password requirements, fix signup redirect, wire isRefining prop, fix autoComplete, fix iOS zoom, add Escape handlers, add confirm password, fix signup eye button, show refine in collapsed state, add loading to chip generation |
| Medium | 8 | Standardize export labels, add spinner to buttons, add empty state guidance, fix artifact label redundancy, fix chip selected state, add Tooltip to Export, add `<main>` landmark, fix collapsed sidebar on mobile |
| Low | 6 | Add search/filter for projects, add breadcrumbs, add keyboard shortcuts, add password strength checklist, add ToS/privacy links, add character counter |
