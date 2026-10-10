import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Règle d'ingénierie n°14 : 300 lignes max par fichier.
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "public/sw.js", "tests/e2e/**"],
  },
];

export default eslintConfig;
