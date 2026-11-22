# 1stskill benchmark runner

Public runner for the [1stskill](https://1stskill.com) GA benchmark. It runs the ten
public coding tasks with the Claude Code or Codex CLI on GitHub Actions, using the
participant's own API key, and uploads each task's patch. Scoring happens on the
1stskill server with the same verifier as operator runs; this repository never grades.

## Participate

1. Register your public skill repository at https://1stskill.com.
2. Copy [template/1stskill.yml](template/1stskill.yml) into your repository's
   `.github/workflows/`, set `account` to your 1stskill.com nickname (and `skill-path`
   if the skill is not at the repository root), replace the commit placeholder with a
   commit of this repository, and add one secret: `ANTHROPIC_API_KEY` or
   `OPENAI_API_KEY`.
3. Run the workflow from your repository's Actions tab and choose `claude` or `codex`.

There is no other setup. The workflow installs the latest CLI, runs the tasks, attests
the result file and submits it.

## Results and marks

- A signed result accepted by the site receives the `GA` (GitHub Attested) mark: the
  attestation names this workflow, its commit and the skill repository. The result is
  credited only to the `account` written in it, and only if that account registered
  this repository with the same skill content; because only people with write access
  can run workflows in your repository, nobody else can claim your results.
- `OV` (Official Verified) is the operator's re-run under the same public conditions.
- Scores are absolute, not relative to a baseline. Re-running a skill replaces the
  displayed result and keeps earlier results as history.
- The result file `1stskill-result.json` (schema `1stskill.ga-result/1`) carries the CLI
  version, the suite version with per-task tree hashes, token usage and each task's patch.
  The runner sends patches, never verdicts.

## Local run

Use Node.js 24 and install one CLI (`npm install -g @anthropic-ai/claude-code` or
`npm install -g @openai/codex`). Put the provider key in the environment, then:

```sh
node bin/run.mjs --cli claude --model <model id> --skill ./path/to/skill --out result.json
```

`--skill` points at the folder that contains `SKILL.md`; only Markdown and LICENSE files
inside it are installed, matching what the site imports. Omitting `--model` uses the CLI
default. Metadata falls back to `git`, `GITHUB_REPOSITORY`, `GITHUB_SHA`,
`GITHUB_RUN_ID` and `RUNNER_COMMIT`; a local run without them records placeholder
commits and must not be submitted.

## Verification items

These were not confirmed by a live run when this repository was created:

- Action majors were checked against release feeds on 2026-11-22
  (`actions/checkout` v7.0.1, `actions/setup-node` v7.1.0, `actions/attest` v4.2.2,
  `actions/upload-artifact` v7.0.2) and are pinned by major tag. Re-check before relying.
- `actions/attest` inputs (`subject-path`) and outputs (`bundle-path`) must be confirmed
  against its release notes.
- The runner commit is read from the `job_workflow_sha` claim of the job's GitHub OIDC
  token; confirm with a dry run before participants use the template.
- The submission endpoint `https://1stskill.com/api/ga/submissions` is not deployed yet.
  Until it is, the attested result stays an Actions artifact.
- CLI flags, version output and default models depend on the installed CLI version; the
  pinned flags mirror the native evaluator and were not exercised against a live CLI here.
- The instruction hash matches the site's registered hash only when the workflow runs the
  same skill folder that was registered.
