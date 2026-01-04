import { nextJsConfig } from "@miniapps/eslint-config/next-js";

export default [
  ...nextJsConfig,
  {
    ignores: ["postcss.config.js", "tailwind.config.js"],
  },
];

