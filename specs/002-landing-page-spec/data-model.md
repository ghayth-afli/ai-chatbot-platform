# Data Model — Phase 1 Landing Page

## LanguagePreference

- **Represents**: The selected locale and text-direction state stored on the client.
- **Fields**:
  - `locale`: enum `['en', 'ar']`, required.
  - `dir`: enum `['ltr', 'rtl']`, derived from locale.
  - `persistedAt`: ISO timestamp recorded when value is saved to `localStorage`.
- **Validation rules**:
  - Only valid locale codes allowed; default to `en` when value is missing or corrupted.
  - When `locale === 'ar'`, `dir` MUST be `rtl` and document direction updated atomically.
- **Relationships**: Consumed by Navbar, Hero CTA, Footer, and Bilingual section components for copy + layout decisions.

## NavigationButton

- **Represents**: The LOGIN and SIGNUP buttons in the navbar with distinct styling requirements.
- **Fields**:
  - `id`: `'login' | 'signup'`
  - `labelKey`: translation key (e.g., `nav.login`)
  - `path`: target route (`'/login'` or `'/signup'`)
  - `style`: `'primary' | 'secondary'` (Signup is primary/filled, Login is secondary/outline)
  - `visible`: `'always'` (never hidden, including mobile)
  - `positioning`: `'right'` (right-aligned in navbar)
  - `minHeight`: `44` (pixels, for touch targets)
- **Validation rules**:
  - Signup button MUST use `style: 'primary'` with filled Volt background.
  - Login button MUST use `style: 'secondary'` with outline Volt border.
  - Both buttons MUST be visible at all responsive breakpoints (320px–1440px).
  - Contrast ratio for Signup button MUST exceed 7.8:1 (WCAG AAA). Login outline MUST have 4.5:1 minimum (WCAG AA).
  - Button labels MUST NOT be truncated: always show "Sign Up" and "Login" in full.
- **Relationships**: Rendered by `Navbar.jsx`; navigation handled by React Router `navigate()` on click; positions on the RIGHT side of the navbar layout.

## NavigationRoute

- **Represents**: Links exposed in navbar/footer and the corresponding React Router targets.
- **Fields**:
  - `labelKey`: translation key (e.g., `nav.login`).
  - `path`: React Router path (`'/' | '/login' | '/signup' | '/chat' | '/profile' | '/history'`).
  - `type`: `'anchor' | 'route'` (anchor scrolls within the page).
  - `requiresAuth`: boolean (e.g., `/chat`, `/profile`, `/history`).
- **Validation rules**:
  - Anchor routes MUST include a DOM id target on the landing page (`features`, `about`).
  - Auth-only routes MUST be guarded by CTA/auth-context logic even if rendered publicly.
- **Relationships**: Navbar renders primary routes; Footer reuses same dataset for secondary navigation + language indicator.

## FeatureCard

- **Represents**: Marketing capabilities grid in the Features section.
- **Fields**:
  - `id`: slug (e.g., `multi-model-chat`).
  - `icon`: name of icon asset (mapped to inline SVG or component).
  - `titleKey` / `bodyKey`: translation keys for text.
  - `accent`: brand token (`volt`, `plasma`, `spark`, `ice`).
- **Validation rules**:
  - Exactly five cards must exist to cover required feature list; failing to render one is a test failure.
  - Each card must map to a unique translation key pair.
- **Relationships**: Rendered by `Features.jsx`; translation keys stored under `features.<id>.*` per locale files.

## ModelCard

- **Represents**: Each AI model showcased in the Models section.
- **Fields**:
  - `modelName`: string (`"DeepSeek Chat"`, `"LLaMA 3"`, `"Mistral 7B"`).
  - `provider`: string, also translated (e.g., `OpenRouter`).
  - `descriptionKey`: translation key summarizing differentiator.
  - `badge`: optional visual indicator (e.g., provider tag, "Coming Soon").
- **Validation rules**:
  - Table MUST include the three mandated models in spec order; provider string must match specification exactly before translation.
  - Cards can expose `status: 'available' | 'comingSoon'` for future toggles.
- **Relationships**: `Models.jsx` iterates this array; also referenced in hero chips to keep naming consistent.

## BilingualShowcaseSnippet

- **Represents**: Side-by-side English/Arabic text examples within the bilingual/RTL section.
- **Fields**:
  - `titleKey` / `subtitleKey`: translation keys describing the context (e.g., "English Interface").
  - `sampleEn` / `sampleAr`: short UI strings demonstrating typography; may reference translation keys for reuse.
  - `icon`: optional indicator (chat bubble vs interface).
- **Validation rules**:
  - Arabic snippet MUST use Arabic font class (e.g., `font-['Noto_Kufi_Arabic']`) and appear RTL even in mixed-language pages.
  - Each snippet should reference valid translation keys to avoid hardcoding.
- **Relationships**: Rendered inside `Bilingual.jsx`; also used by automated tests to confirm RTL toggling.

## HeroCTAState

- **Represents**: Derived state used to decide CTA destination and label.
- **Fields**:
  - `isAuthenticated`: boolean from auth context mock.
  - `primaryTarget`: `/chat` when authenticated, `/login` otherwise.
  - `labelKey`: translation key that may change (e.g., `cta.resumeChat` vs `cta.startChatting`).
- **Validation rules**:
  - Must recompute whenever auth state or locale changes to keep label translated.
  - Fallback target defaults to `/login` if state unknown.
- **Relationships**: Hero component + CTA button; reused by navbar CTA if we expose duplicates.

## SectionMeta

- **Represents**: Metadata (id, background, gradient, DOM anchor) for each landing section to support scroll navigation.
- **Fields**:
  - `id`: DOM id for anchor links (e.g., `"hero"`, `"features"`, `"models"`).
  - `titleKey`: translation key for section heading.
  - `background`: Tailwind token(s) for surfaces/gradients.
  - `motion`: optional animation tokens/duration (aligns with brand motion guidelines).
- **Validation rules**:
  - IDs must remain stable for anchor navigation and tests; duplicate IDs forbidden.
  - Gradients must use brand palette values defined in `brand_identity_chatbot_genz.html`.
- **Relationships**: Used by layout components to wrap each section and by the optional "Features"/"About" anchor links.
