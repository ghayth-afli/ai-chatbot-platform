# Feature Specification: Phase 1 — Landing Page

**Feature Branch**: `002-landing-page-spec`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: Phase 1 — Landing Page specification for bilingual React + Tailwind experience on nexus.ai

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Experience the landing story (Priority: P1)

A first-time visitor lands on nexus.ai and scrolls through the entire landing page to understand the value proposition, product capabilities, and the multi-model advantage without needing to authenticate.

**Why this priority**: The landing page is the public entry point for every prospective user. It must clearly tell the story, showcase trust, and route people to the right next step before any other feature matters.

**Independent Test**: Load `/` in a clean browser session, verify all seven sections render with the correct content hierarchy, and confirm that the information hierarchy matches the constitution and brand identity.

**Acceptance Scenarios**:

1. **Given** a visitor opens `/`, **When** the page renders, **Then** the navbar, hero, features, models, bilingual, about, and footer sections appear in the specified order with nexus branding.
2. **Given** the hero section is visible, **When** the visitor reads the headline and subtitle, **Then** the messaging references multi-model AI chat, bilingual support, and productivity benefits.
3. **Given** the visitor scrolls to Features, **When** they view the cards, **Then** each required capability (multi-model chat, chat history, bilingual, summaries, model switching) is represented with iconography consistent with the brand kit.
4. **Given** the visitor reaches the Models section, **When** they inspect each card, **Then** model name, provider, and a short differentiating description are visible.
5. **Given** the visitor reaches the About section, **When** they read the copy, **Then** it explains the platform’s purpose, multi-model interface, saved history, summaries, and productivity intent.

---

### User Story 2 - Switch languages & directions (Priority: P1)

A bilingual visitor toggles between English and Arabic, sees instant translation updates, and confirms the layout flips into RTL with appropriate typography and spacing.

**Why this priority**: Bilingual + RTL support is a constitutional mandate. The landing page must prove that the platform is inclusive before sign-up.

**Independent Test**: Toggle the language switcher, confirm copy, numeral formatting, and layout direction update instantly without reloading, and verify language preference persists after a refresh.

**Acceptance Scenarios**:

1. **Given** the navbar language switch is visible, **When** the visitor selects Arabic, **Then** the entire page (nav through footer) updates copy from `ar.json` and sets `dir="rtl"` on the document root.
2. **Given** Arabic is active, **When** the visitor refreshes the page, **Then** Arabic remains selected because the preference was stored in `localStorage`.
3. **Given** Arabic is active, **When** the user scrolls through sections, **Then** layout, alignment, and icon ordering mirror to RTL without clipping or overlapping content on desktop and mobile widths.
4. **Given** Arabic is active, **When** the visitor toggles back to English, **Then** the layout returns to LTR within 500ms and the stored preference updates.
5. **Given** the bilingual showcase section, **When** the visitor views it, **Then** paired English/Arabic examples demonstrate UI text, RTL chat bubbles, and Arabic font usage that align with the brand identity HTML file.

---

### User Story 3 - Navigate to product surfaces (Priority: P1)

A prospective or returning user uses the landing page controls to jump into authentication, chat, profile, or history pages, with the hero CTA respecting their session state.

**Why this priority**: The landing experience must convert interest into authenticated usage. Routing is a contractual requirement for this phase.

**Independent Test**: Click each navbar link and CTA, confirm React Router moves to `/login`, `/signup`, `/chat`, `/profile`, or `/history`, and validate conditional routing for logged-in vs logged-out CTA behavior.

**Acceptance Scenarios**:

1. **Given** the visitor is unauthenticated, **When** they click “Login” in the navbar, **Then** they are routed to `/login` without a page reload.
2. **Given** the visitor is unauthenticated, **When** they click the hero “Start Chatting” CTA, **Then** they are routed to `/login` with focus placed on the login form container.
3. **Given** the visitor has an active session (auth context true), **When** they click the hero CTA, **Then** they are routed to `/chat` to resume conversations.
4. **Given** the visitor opens the optional nav link “Features” or “About”, **When** they click it, **Then** the page performs smooth-scrolling to the corresponding section.
5. **Given** the visitor selects “History” or “Profile” from a secondary navigation control, **When** they click it, **Then** React Router navigates to `/history` or `/profile` while preserving the stored language preference.

---

### User Story 4 - Mobile-first responsive experience (Priority: P2)

A mobile visitor on a 360px wide device can read every section, toggle languages, and reach CTA targets without layout breakage while seeing the neon-on-dark aesthetic.

**Why this priority**: Constitution Principles III and VIII require responsive, modern UX. The landing page is a marketing funnel on every device.

**Independent Test**: Resize to 320–400px widths (or use mobile simulator), interact with nav, CTA, sliders, and confirm spacing, typography, and RTL mirroring remain intact.

**Acceptance Scenarios**:

1. **Given** the viewport is 360px wide, **When** the page loads, **Then** the navbar collapses into a mobile-friendly layout with accessible controls for login/signup and the language switch.
2. **Given** the viewport is 360px wide, **When** the visitor scrolls through hero, features, models, bilingual, and about sections, **Then** cards stack vertically with consistent spacing and no horizontal scroll.
3. **Given** the viewport is 360px wide and Arabic is active, **When** the visitor scrolls, **Then** RTL alignment and typography remain correct with readable font sizes.
4. **Given** the visitor reaches the footer on mobile, **When** they check the content, **Then** brand name, AI platform descriptor, language indicator, and copyright text remain legible and non-overlapping.
5. **Given** the visitor interacts with CTA or nav elements on touch devices, **When** they tap buttons, **Then** targets meet minimum 44px touch-friendly guidelines and respond within 200ms.

---

### Edge Cases

- **Missing translation key**: If a string is absent in `ar.json` or `en.json`, the UI must fall back to English, log the missing key for QA, and keep layout stable.
- **localStorage unavailable**: When storage is blocked (incognito or privacy mode), the language switch still functions for the session but defaults to English on reload without throwing errors.
- **Undefined auth state**: If the hero CTA cannot determine session status, it must default to `/login` and show a non-blocking warning in the console rather than breaking navigation.
- **Slow font/network load**: When Google Fonts fail to load, the page must fall back to safe fonts while maintaining spacing and avoiding layout shift beyond 100ms CLS budget.
- **Viewports below 320px**: If the device width is extremely small, horizontal scrolling is permitted for sections but navigation controls must remain reachable via a stacked layout.
- **Model catalog updates**: If a provider is temporarily unavailable, the Models section must still show the last known description and visually flag the card as “Coming Soon” instead of removing it.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The landing page route `/` MUST render the seven required sections (navbar, hero, features, models, bilingual/RTL, about, footer) in the specified order using React and Tailwind CSS.
- **FR-002**: The navbar MUST include the nexus. wordmark, optional anchor links (Features, About), Login button, Signup button, and an EN/AR language switch styled per the brand identity.
- **FR-003**: The language switch MUST toggle between English and Arabic text by reading from `src/i18n/en.json` and `src/i18n/ar.json`, update visible copy without reloading, and store the selected locale in `localStorage`.
- **FR-004**: Selecting Arabic MUST update the document direction to RTL and mirror alignment, spacing, and icon ordering for every section, including cards and chat bubble mockups.
- **FR-005**: The hero section MUST include a headline, subtitle, three model chips (DeepSeek, LLaMA3, Mistral), a gradient/dark background, and a “Start Chatting” CTA styled with neon accents.
- **FR-006**: The hero CTA MUST route authenticated users to `/chat` and unauthenticated users to `/login`, using the existing auth context or a feature flag stub defined for this phase.
- **FR-007**: The Features section MUST surface at least five cards highlighting multi-model chat, chat history, bilingual support, AI-generated summaries, and model switching, each with an icon and translation-backed copy.
- **FR-008**: The Models section MUST display cards for DeepSeek Chat (OpenRouter), LLaMA 3 (Groq), and Mistral 7B (Together AI) including provider name and a short human-readable description.
- **FR-009**: The Bilingual / RTL section MUST visually demonstrate English and Arabic UI snippets (e.g., chat bubbles, interface labels) and explain language switching, RTL layout, and font considerations.
- **FR-010**: The About section MUST describe the platform purpose, multi-model interface, chat history, AI summaries, and productivity focus in both languages, sourcing copy from the translation files.
- **FR-011**: The footer MUST include the brand name, “AI Platform” context, language indicator, copyright statement, and an optional GitHub link/icon consistent with brand contrast rules.
- **FR-012**: React Router MUST define routes for `/`, `/login`, `/signup`, `/chat`, `/profile`, and `/history`; navbar buttons and CTA MUST navigate to these routes without full page reloads.
- **FR-013**: All textual content (headlines, button labels, descriptions) MUST be stored in JSON translation files—no hardcoded strings may remain in JSX components.
- **FR-014**: Tailwind CSS MUST enforce the dark theme palette (Ink background, Surface panels) with neon Volt/Plasma accents, rounded components, and responsive spacing tokens inspired by the brand identity HTML.
- **FR-015**: The layout MUST remain responsive from 320px to 1440px widths, ensuring sections stack gracefully, typography scales appropriately, and no horizontal scroll appears on standard devices.
- **FR-016**: Interactive controls (language switch, CTA, navbar buttons) MUST include accessible labels, 4.5:1 contrast ratios, and keyboard focus states to satisfy WCAG AA expectations for marketing pages.

### Key Entities _(include if feature involves data)_

- **Landing Section Content**: Structured copy blocks (title, subtitle, body, CTAs) stored in translation files and rendered in sequence on the landing page.
- **Language Preference**: Simple data object containing locale code (`en`/`ar`), `dir` value, and persistence metadata (localStorage key, timestamp) used by the i18n layer.
- **Model Catalog Entry**: Represents each supported AI model with attributes for name, provider, positioning statement, and accent color/icon to match brand chips.
- **Navigation Route**: Mapping of labels to React Router paths plus metadata for whether routing is internal (scroll) or page navigation, ensuring consistent behavior across nav and footer.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Loading `/` on a cold cache renders all seven sections with branded styling in under 2 seconds on a standard broadband connection (measured via Lighthouse Performance).
- **SC-002**: Toggling the language switch updates every visible string and the document direction within 500ms, and the selected language persists after refresh with 0 translation key misses in QA logs.
- **SC-003**: All CTA and navbar actions route to the correct destinations with <1 second transition time, and hero CTA obeys session state in 100% of tested scenarios.
- **SC-004**: Responsive testing across 320px, 768px, and 1440px widths shows zero layout overlap/overflow issues, and CLS remains below 0.1 despite font loading.
- **SC-005**: Models and Features sections each surface the required items exactly as listed in the specification, verified by automated snapshot/DOM tests.
- **SC-006**: Accessibility audit (axe or Lighthouse) reports no critical issues for contrast, keyboard focus, or ARIA labels on the landing page.
- **SC-007**: Bilingual / RTL showcase demonstrates English and Arabic examples with correct fonts and direction, validated by design review referencing brand_identity_chatbot_genz.html.
- **SC-008**: Footer displays brand identity, AI platform descriptor, and language indicator across both languages without truncation on devices down to 320px width.

## Assumptions

- **A-001**: The authentication context or helper hook from future phases exposes whether a user is logged in; during this phase a mock or stub may simulate that state for CTA routing.
- **A-002**: Placeholder pages for `/login`, `/signup`, `/chat`, `/profile`, and `/history` already exist (or simple stubs will be created) so routing can be verified without building full flows.
- **A-003**: Landing page copy is static marketing content authored by the product team; no CMS integration is required in Phase 1.
- **A-004**: Browser localStorage is available; if blocked, the system silently falls back to English each load per the Edge Case guidance.
- **A-005**: Brand fonts (Syne, DM Sans, Space Mono) are delivered via web fonts referenced in brand_identity_chatbot_genz.html and may be loaded from Google Fonts.
- **A-006**: The list of highlighted AI models (DeepSeek Chat, LLaMA 3, Mistral 7B) will not change during Phase 1; future updates will reuse the same component structure.
- **A-007**: Analytics, SEO meta tags, or blog content are out of scope for this phase and may be handled in later marketing initiatives.
- **A-008**: Backend services are not required for the landing page beyond existing routing; any dynamic data (e.g., hero login state) comes from front-end context only.
