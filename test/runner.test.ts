import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { run, type RunnerEnv } from "../src/runner.js";
import { summarize } from "../src/summarize.js";
import { toMarkdown, toSummary } from "../src/format.js";
import type { ProvenanceDoc } from "../src/types.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES = `${here}/../fixtures/prompts`;

function envWithInputs(inputs: Record<string, string>): RunnerEnv {
  return {
    inputs,
    readFile: (p) => readFileSync(p, "utf8"),
    readDir: (p) => readdirSync(p),
    isFile: (p) => statSync(p).isFile(),
    write: () => undefined
  };
}

describe("runner.run", () => {
  it("exits 1 when fail-on-high set and high findings exist", async () => {
    const r = await run(envWithInputs({ prompts_dir: FIXTURES, fail_on_high: "true", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(1);
    expect(r.report.prompts).toBe(6);
    expect(r.report.byState.approved).toBe(4);
    expect(r.commentPosted).toBe(false);
  });

  it("exits 0 when fail-on-high is false even with high findings", async () => {
    const r = await run(envWithInputs({ prompts_dir: FIXTURES, fail_on_high: "false", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(0);
  });

  it("rejects when prompts-dir input is missing", async () => {
    await expect(run({ inputs: {} })).rejects.toThrow(/prompts_dir/);
  });

  it("posts a PR comment in pull_request context", async () => {
    const calls: Array<{ repo: string; issueNumber: number; body: string }> = [];
    const env: RunnerEnv = {
      inputs: { prompts_dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs_test", fail_on_high: "false" },
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_REPOSITORY: "mizcausevic-dev/test",
      GITHUB_EVENT_PATH: `${here}/event.json`,
      readFile: (p) => (p.endsWith("event.json") ? JSON.stringify({ number: 42 }) : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      postComment: async (args) => {
        calls.push({ repo: args.repo, issueNumber: args.issueNumber, body: args.body });
      },
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toContain("Prompt Provenance fleet summary");
  });

  it("skips PR comment when token missing", async () => {
    const env: RunnerEnv = {
      inputs: { prompts_dir: FIXTURES, comment_on_pr: "true", fail_on_high: "false" },
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: "/event.json",
      readFile: (p) => (p.endsWith("event.json") ? "{}" : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no github-token provided");
  });

  it("skips PR comment when GITHUB_EVENT_PATH missing", async () => {
    const env: RunnerEnv = {
      inputs: { prompts_dir: FIXTURES, comment_on_pr: "true", github_token: "ghs", fail_on_high: "false" },
      GITHUB_REPOSITORY: "x/y",
      readFile: (p) => readFileSync(p, "utf8"),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no GITHUB_EVENT_PATH");
  });

  it("skips PR comment when event has no PR number", async () => {
    const env: RunnerEnv = {
      inputs: { prompts_dir: FIXTURES, comment_on_pr: "true", github_token: "ghs", fail_on_high: "false" },
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: "/event.json",
      readFile: (p) => (p.endsWith("event.json") ? "{}" : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no PR number in event payload");
  });

  it("does not comment on non-PR events with comment_on_pr=auto", async () => {
    const env: RunnerEnv = {
      inputs: { prompts_dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs", fail_on_high: "false" },
      GITHUB_EVENT_NAME: "push",
      readFile: (p) => readFileSync(p, "utf8"),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
  });
});

describe("summarize + format unit coverage", () => {
  const docs: ProvenanceDoc[] = readdirSync(FIXTURES)
    .filter((e) => e.endsWith(".json"))
    .map((e) => JSON.parse(readFileSync(`${FIXTURES}/${e}`, "utf8")) as ProvenanceDoc);

  it("toSummary formats the line", () => {
    const r = summarize(docs, "2026-05-27T00:00:00Z");
    const s = toSummary(r);
    expect(s).toContain("prompt");
    expect(s).toContain("approved");
  });

  it("toMarkdown emits per-prompt table and findings", () => {
    const md = toMarkdown(summarize(docs, "2026-05-27T00:00:00Z"));
    expect(md).toContain("Prompt Provenance fleet summary");
    expect(md).toContain("| prompt | state |");
  });
});
