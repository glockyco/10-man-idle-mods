export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "mods",
        "speed-mod",
        "mod-loader",
        "proxy",
        "extractor",
        "website",
      ],
    ],
  },
};
