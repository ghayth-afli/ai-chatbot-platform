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
      "deepseek": "DeepSeek Chat",
      "llama": "LLaMA 3",
      "mistral": "Mistral 7B"
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
      "deepseek": { "description": "…" },
      "llama": { "description": "…" },
      "mistral": { "description": "…" }
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

## 4. Hero CTA Contract

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
