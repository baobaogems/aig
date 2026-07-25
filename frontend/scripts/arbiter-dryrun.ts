// arbiter-dryrun.ts — CLI runner for the DRY_RUN judging pipeline (GATE 1 / calibration).
// Usage: npm run arbiter:dryrun                 -> all cases in calibration/cases/
//        npm run arbiter:dryrun -- --case pass-01
// Reads .env.local natively (Node >=20.12); no server needed. Prints a confusion table.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runCase, isDryRun, type DryRunCase } from "../lib/arbiter/run";
import { parseVerdict } from "../lib/arbiter/verdict-schema";

try {
  process.loadEnvFile(join(process.cwd(), ".env.local"));
} catch {
  /* env may come from the shell */
}

const CASES_DIR = join(process.cwd(), "calibration", "cases");

async function main() {
  if (!isDryRun()) {
    console.error("ABORT: DRY_RUN is false but money path is not wired yet (Phase 03). Set DRY_RUN=true.");
    process.exit(2);
  }
  const onlyCase = process.argv.includes("--case") ? process.argv[process.argv.indexOf("--case") + 1] : null;
  const files = readdirSync(CASES_DIR)
    .filter((f) => f.endsWith(".json"))
    .filter((f) => (onlyCase ? f === `${onlyCase}.json` : true))
    .sort();
  if (files.length === 0) {
    console.error(`no case files found in ${CASES_DIR}` + (onlyCase ? ` for --case ${onlyCase}` : ""));
    process.exit(2);
  }

  console.log(`ARBITER DRY_RUN — model=${process.env.ARBITER_MODEL} prompt=${process.env.PROMPT_VERSION}`);
  console.log(`cases: ${files.map((f) => f.replace(".json", "")).join(", ")}\n`);

  let failures = 0;
  const rows: string[] = [];

  for (const file of files) {
    const c = JSON.parse(readFileSync(join(CASES_DIR, file), "utf8")) as DryRunCase;
    process.stdout.write(`▶ ${c.id} ... `);
    try {
      const r = await runCase(c);
      const v = r.judge.verdict;
      const schemaOk = parseVerdict(v).ok;
      const expectOk = !c.expected_decision || v.decision === c.expected_decision;
      // T1 leakage guard: a case expected to FAIL/REFUSE must never auto-RELEASE.
      const t1Leak = (c.expected_decision === "FAIL" || c.expected_decision === "REFUSE") && v.decision === "RELEASE";
      if (!schemaOk || t1Leak) failures++;

      console.log(`${v.decision} (score=${v.total_score} conf=${v.confidence}) in ${(r.elapsedMs / 1000).toFixed(1)}s`);
      for (const s of v.rubric_scores) {
        console.log(`   ${s.item_id} [w${s.weight}] ${s.score}/100 — ${s.reasoning.slice(0, 90)}`);
        console.log(`      evidence: "${s.evidence[0]?.slice(0, 100)}"`);
      }
      console.log(`   confidence: ${v.confidence_reasoning.slice(0, 140)}`);
      console.log(`   hash: ${r.judge.hash.slice(0, 22)}…  tokens: ${r.totalTokens.input}in/${r.totalTokens.output}out\n`);

      rows.push(
        `${c.id.padEnd(12)} expected=${(c.expected_decision ?? "-").padEnd(9)} actual=${v.decision.padEnd(9)} ` +
          `score=${String(v.total_score).padStart(3)} conf=${String(v.confidence).padStart(3)} ` +
          `schema=${schemaOk ? "OK " : "BAD"} ${t1Leak ? "!! T1-LEAK" : expectOk ? "match" : "DIFF"}`,
      );
    } catch (err) {
      failures++;
      console.log(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
      rows.push(`${c.id.padEnd(12)} PIPELINE ERROR`);
    }
  }

  console.log("── confusion table ──");
  rows.forEach((r) => console.log(r));
  console.log(failures === 0 ? "\nGATE CHECK: PASS (all verdicts schema-valid, no T1 leakage)" : `\nGATE CHECK: ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
