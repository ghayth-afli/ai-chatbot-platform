/**
 * Landing Page Content Data Source
 *
 * Centralized data export for features, models, bilingual samples, and navigation routes.
 * All text is externalized via i18next translation keys to support bilingual rendering.
 */

export const features = [
  {
    id: "multi-model-chat",
    icon: "network",
    titleKey: "features.multiModel.title",
    bodyKey: "features.multiModel.body",
    accent: "volt",
  },
  {
    id: "chat-history",
    icon: "history",
    titleKey: "features.chatHistory.title",
    bodyKey: "features.chatHistory.body",
    accent: "plasma",
  },
  {
    id: "bilingual",
    icon: "globe",
    titleKey: "features.bilingual.title",
    bodyKey: "features.bilingual.body",
    accent: "spark",
  },
  {
    id: "summaries",
    icon: "summarize",
    titleKey: "features.summaries.title",
    bodyKey: "features.summaries.body",
    accent: "ice",
  },
  {
    id: "model-switching",
    icon: "swap",
    titleKey: "features.modelSwitching.title",
    bodyKey: "features.modelSwitching.body",
    accent: "volt",
  },
];

export const models = [
  {
    modelName: "DeepSeek Chat",
    provider: "DeepSeek",
    descriptionKey: "models.rows.deepseek.description",
    status: "available",
  },
  {
    modelName: "LLaMA 3",
    provider: "Meta",
    descriptionKey: "models.rows.llama.description",
    status: "available",
  },
  {
    modelName: "Mistral 7B",
    provider: "Mistral",
    descriptionKey: "models.rows.mistral.description",
    status: "available",
  },
];

export const bilingualShowcases = [
  {
    titleKey: "bilingual.english.heading",
    sampleKey: "bilingual.english.sample",
    icon: "chat",
  },
  {
    titleKey: "bilingual.arabic.heading",
    sampleKey: "bilingual.arabic.sample",
    icon: "chat",
  },
];

export const navigationRoutes = [
  {
    id: "home",
    labelKey: "nav.home",
    path: "/",
    type: "anchor",
  },
  {
    id: "features",
    labelKey: "nav.features",
    path: "/",
    type: "anchor",
    targetId: "features",
  },
  {
    id: "about",
    labelKey: "nav.about",
    path: "/",
    type: "anchor",
    targetId: "about",
  },
  {
    id: "login",
    labelKey: "nav.login",
    path: "/login",
    type: "route",
  },
  {
    id: "signup",
    labelKey: "nav.signup",
    path: "/signup",
    type: "route",
  },
  {
    id: "chat",
    labelKey: "nav.chat",
    path: "/chat",
    type: "route",
    requiresAuth: true,
  },
  {
    id: "profile",
    labelKey: "nav.profile",
    path: "/profile",
    type: "route",
    requiresAuth: true,
  },
  {
    id: "history",
    labelKey: "nav.history",
    path: "/history",
    type: "route",
    requiresAuth: true,
  },
];

export const sectionMeta = {
  hero: {
    id: "hero",
    titleKey: "hero.headline",
    background: "bg-gradient-to-br from-ink via-surface to-ink",
  },
  features: {
    id: "features",
    titleKey: "features.title",
    background: "bg-ink",
  },
  models: {
    id: "models",
    titleKey: "models.title",
    background: "bg-surface",
  },
  bilingual: {
    id: "bilingual",
    titleKey: "bilingual.title",
    background: "bg-ink",
  },
  about: {
    id: "about",
    titleKey: "about.title",
    background: "bg-surface",
  },
  footer: {
    id: "footer",
    titleKey: "footer.brand",
    background: "bg-ink border-t border-border",
  },
};
