/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  moduleNameMapper: { "^@saving/shared$": "<rootDir>/../../packages/shared/src" },
};
