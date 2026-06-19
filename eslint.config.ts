import { config as defaultConfig } from "@gingacodemonkey/config/eslint";
import type { Linter } from "eslint";

export const extraRules: Array<Linter.Config> = [];

const config: Array<Linter.Config> = [
  ...defaultConfig,
  ...extraRules,
];

export default config;