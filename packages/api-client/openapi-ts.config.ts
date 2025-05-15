import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../../apps/api/generated/openapi.json",
  output: { path: "src", format: "prettier", clean: false },
  plugins: [
    { name: "@hey-api/client-fetch", runtimeConfigPath: "./src/hey-api.ts" },
    "@tanstack/react-query",
    "zod",
  ],
});
