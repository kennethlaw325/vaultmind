module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
