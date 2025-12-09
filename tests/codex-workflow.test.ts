import { readFileSync } from "node:fs";
import { join } from "node:path";

const workflowPath = join(
  process.cwd(),
  ".github",
  "workflows",
  "codex-theme.yml"
);
const workflowYaml = readFileSync(workflowPath, "utf8");

describe("codex theme workflow", () => {
  it("asks Codex to keep the storefront theme toggleable", () => {
    expect(workflowYaml).toMatch(/toggleable/i);
    expect(workflowYaml).toMatch(/theme flag/i);
  });

  it("checks out the default branch as the working base", () => {
    expect(workflowYaml).toMatch(
      /ref:\s*\${{\s*github\.event\.repository\.default_branch\s*}}/i
    );
  });
});
