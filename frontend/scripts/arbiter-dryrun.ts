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

// Phase 02: calibration is scored by TIER, not exact decision — the FAIL/REFUSE boundary is
// fuzzy by design (both are T3, both keep money locked), so a FAIL-vs-REFUSE swap is a DIFF
// note, never a gate failure. The gate failure is a T1 leak: money moving when it shouldn't.
function tierOf(decision: string): "T1" | "T2" | "T3" {
  return decision === "RELEASE" ? "T1" : decision === "ESCALATE" ? "T2" : "T3";
}

async function main() {
  if (!isDryRun()) {
    // Calibration must never touch the live money path — that's `npm run arbiter:gate2`.
    console.error("ABORT: DRY_RUN is false. Calibration runs money-disconnected only; set DRY_RUN=true.");
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
      // Expected tier: explicit field, else derived from the legacy expected_decision.
      const expTier = c.expected_tier ?? (c.expected_decision ? tierOf(c.expected_decision) : null);
      const actTier = tierOf(v.decision);
      const expectOk = !expTier || actTier === expTier;
      // T1 leakage guard — THE safety invariant: any case not expected to auto-release
      // (clear fails, injections, ambiguous) must never land in T1.
      const t1Leak = expTier !== null && expTier !== "T1" && actTier === "T1";
      if (!schemaOk || t1Leak) failures++;

      console.log(`${v.decision} (score=${v.total_score} conf=${v.confidence}) in ${(r.elapsedMs / 1000).toFixed(1)}s`);
      for (const s of v.rubric_scores) {
        console.log(`   ${s.item_id} [w${s.weight}] ${s.score}/100 — ${s.reasoning.slice(0, 90)}`);
        console.log(`      evidence: "${s.evidence[0]?.slice(0, 100)}"`);
      }
      console.log(`   confidence: ${v.confidence_reasoning.slice(0, 140)}`);
      console.log(`   hash: ${r.judge.hash.slice(0, 22)}…  tokens: ${r.totalTokens.input}in/${r.totalTokens.output}out\n`);

      rows.push(
        `${c.id.padEnd(12)} expected=${(expTier ?? "-").padEnd(3)} actual=${actTier} (${v.decision.padEnd(8)}) ` +
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
