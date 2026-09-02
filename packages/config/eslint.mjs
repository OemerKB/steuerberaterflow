import js from "@eslint/js";

/** Basis-ESLint-Preset für alle Workspaces (Flat Config). */
export default [
  js.configs.recommended,
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/generated/**", "**/test-results/**"],
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        File: "readonly",
        Blob: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        AbortController: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        requestAnimationFrame: "readonly",
        ResizeObserver: "readonly",
        IntersectionObserver: "readonly",
        customElements: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },
];
