# UI Contracts — Landing Page

## 1. Translation Files (`src/i18n/en.json`, `src/i18n/ar.json`)

- **Schema**:

```json
{
  "nav": {
    "login": "…",
    "signup": "…",
    "features": "…",
    "about": "…",
    "language": "…"
  },
  "hero": {
    "headline": "…",
    "subhead": "…",
    "cta": {
      "default": "…",
      "authenticated": "…"
    },
    "chips": {
      "Nemotron": "Nemotron Chat",
      "llama": "LLaMA 3",
      "Trinity": "Trinity 7B"
    }
  },
  "features": {
    "multiModel": { "title": "…", "body": "…" },
    "chatHistory": { "title": "…", "body": "…" },
    "bilingual": { "title": "…", "body": "…" },
    "summaries": { "title": "…", "body": "…" },
    "modelSwitching": { "title": "…", "body": "…" }
  },
  "models": {
    "title": "Available Models",
    "rows": {
      "Nemotron": { "description": "…" },
      "llama": { "description": "…" },
      "Trinity": { "description": "…" }
    }
  },
  "bilingual": {
    "title": "…",
    "english": { "heading": "English Interface", "sample": "…" },
    "arabic": { "heading": "واجهة عربية", "sample": "…" },
    "rtl": { "heading": "RTL Layout", "body": "…" }
  },
  "about": {
    "title": "…",
    "body": ["sentence 1", "sentence 2", "sentence 3"]
  },
  "footer": {
    "brand": "nexus.",
    "platform": "AI Platform",
    "languageIndicator": "Language",
    "copyright": "…"
  }
}
```

- **Contract rules**:
  - Every string rendered on the landing page MUST reference one of the keys above or documented extensions; no literal strings.
  - Arabic file mirrors the same key structure and adds Arabic-specific typography markers if needed (e.g., `fontClass`).
  - Missing keys must fall back to English and log a warning via the i18next missing-key handler.

## 2. Language Preference API

- **Interface**:

```ts
interface LanguagePreference {
  locale: "en" | "ar";
  dir: "ltr" | "rtl";
  persistedAt: string;
}
```

- **Operations**:
  - `getStoredLanguage(): LanguagePreference | null`
  - `setLanguage(locale: 'en' | 'ar'): LanguagePreference`
  - `applyDirection(dir: 'ltr' | 'rtl'): void`
- **Contract rules**:
  - Setter must atomically update `i18next.changeLanguage`, `document.documentElement.dir`, and `localStorage` key `nexus.lang`. Partial updates are not allowed.
  - Callers can subscribe to changes via React context; emitting duplicate events is acceptable but must not cause layout thrash.

## 3. Navigation Routing Contract

- **Dataset shape**:

```ts
interface NavRoute {
  id:
    | "home"
    | "features"
    | "about"
    | "login"
    | "signup"
    | "chat"
    | "profile"
    | "history";
  labelKey: string; // nav.* translation key
  path: "/" | "/login" | "/signup" | "/chat" | "/profile" | "/history";
  type: "anchor" | "route";
  targetId?: "features" | "about";
  requiresAuth?: boolean;
}
```

- **Behavior**:
  - Anchor routes trigger smooth scroll to the matching DOM section when already on `/`.
  - Route entries call `navigate(path)` from React Router; if `requiresAuth` is true and the mock auth context says `false`, navigation still occurs but CTA copy reflects locked state (future enhancement can block).

## 4. Navbar Button Styling Contract

- **Positioning & Visibility**:
  - LOGIN and SIGNUP buttons MUST be positioned on the RIGHT side of the navbar.
  - Both buttons MUST be always visible (never hidden) across all responsive breakpoints from 320px to 1440px; on mobile viewports they may stack vertically within the navbar but must remain accessible.
  - Buttons MUST be separated from other nav items (anchor links, language toggle) by spacing.

- **Button Styling**:

```ts
interface NavbarButtonStyle {
  signup: {
    style: "primary"; // Filled button
    background: "bg-volt"; // Volt (#C8FF00)
    textColor: "text-ink"; // Text on Volt
    contrast: "7.8:1"; // Exceeds WCAG AA
    height: "h-11"; // 44px minimum (Tailwind h-11)
    padding: "px-4 py-2"; // Comfortable click target
    border: "none"; // Filled, no border
    hoverState: "opacity-90"; // Subtle hover feedback
  };
  login: {
    style: "secondary"; // Outline/Ghost button
    background: "bg-transparent";
    textColor: "text-volt"; // Volt text
    contrast: "4.5:1"; // WCAG AA minimum
    height: "h-11"; // 44px minimum (Tailwind h-11)
    padding: "px-4 py-2";
    border: "border border-volt"; // Volt outline
    hoverState: "bg-volt/10"; // Light Volt background on hover
  };
}
```

- **Tailwind Implementation Example**:

  ```jsx
  <button className="bg-volt text-ink h-11 px-4 py-2 hover:opacity-90 font-medium">
    Sign Up
  </button>
  <button className="bg-transparent text-volt border border-volt h-11 px-4 py-2 hover:bg-volt/10 font-medium">
    Login
  </button>
  ```

- **Contract Rules**:
  - Both buttons MUST have minimum 44px height to meet touch target guidelines (SC-009).
  - Contrast ratio of Signup button (Volt text/background) MUST be validated at 7.8:1+ (exceeds WCAG AA 4.5:1).
  - Login button outline MUST use the same Volt color as the Signup fill to maintain visual cohesion.
  - Buttons MUST scale appropriately on 320px viewports without text truncation or overlap.
  - Label text must NOT be abbreviated (always show "Sign Up" and "Login", not "Up" or "In").

## 5. Hero CTA Contract

- **Props**:

```ts
interface HeroCtaProps {
  isAuthenticated: boolean;
  target: "/chat" | "/login";
  labelKey: "cta.startChatting" | "cta.resumeChat";
}
```

- **Rules**:
  - Parent component is responsible for deriving `target` based on `isAuthenticated`; CTA component only renders and emits a `navigate(target)` handler.
  - CTA must emit analytics event payload `{ action: 'landing_cta_click', target, locale }` once instrumentation is available; stub now for later integration.

## 5. Section Anchors

- Each major section exposes an `id` attribute (`hero`, `features`, `models`, `bilingual`, `about`, `footer`). Nav routes and intersection observers rely on these values; they must not change without updating contracts + tests.
