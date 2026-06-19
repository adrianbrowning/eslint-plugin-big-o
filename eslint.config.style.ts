import { config as defaultConfig } from "@gingacodemonkey/config/styled";
import type { Linter } from "eslint";
import { extraRules } from "./eslint.config.ts";

const config: Array<Linter.Config> = [
  ...defaultConfig,
  ...extraRules,
  {
    files: [ "package.json" ],
    rules: {
      "no-irregular-whitespace": "off",
      "depend/ban-dependencies": "off",
    },
  },
  {
    files: [ "tests/**/*.test.ts" ],
    rules: {
      "sonarjs/no-empty-test-file": "off",
    },
  },
];

export default config;
