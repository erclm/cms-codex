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
    expect(workflowYaml).toMatch(/enabled and status=ready/i);
    expect(workflowYaml).toMatch(/never ship the theme enabled by default/i);
  });

  it("scopes the theme to the storefront and keeps generation fast", () => {
    expect(workflowYaml).toMatch(/storefront only/i);
    expect(workflowYaml).toMatch(/Do not change admin/i);
    expect(workflowYaml).toMatch(/Keep generation quick/i);
  });

  it("preserves prior themes and serializes runs per issue", () => {
    expect(workflowYaml).toMatch(/Preserve existing theme definitions/i);
    expect(workflowYaml).toMatch(/append a new data-theme block/i);
    expect(workflowYaml).toMatch(
      /concurrency:\s*\n\s*group:\s*codex-theme-\${{ github\.event\.issue\.number }}/i
    );
    expect(workflowYaml).toMatch(/cancel-in-progress:\s*true/i);
  });

  it("checks out the default branch as the working base", () => {
    expect(workflowYaml).toMatch(
      /ref:\s*\${{\s*github\.event\.repository\.default_branch\s*}}/i
    );
  });
});
