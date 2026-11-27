#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const WEIGHTS = Object.freeze({accuracy:20, evidence:15, authority:20, completion:15, clarity:10, efficiency:5, deduplication:10, handoff:5});
const roles = ['coordinator','posting','design','inventory','customer-service','bump','report','growth-ads'];
const common = ['accuracy','evidence','authority','completion','clarity','efficiency'];
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const text = x => typeof x === 'string' && x.trim().length > 0;
const fail = message => { throw new Error(message); };
const round = n => Math.round(n * 100) / 100;

export function validateSuite(suite) {
  if (!object(suite) || suite.version !== 1 || !Array.isArray(suite.scenarios) || !suite.scenarios.length) fail('Suite needs version 1 and non-empty scenarios');
  const ids = new Set();
  for (const s of suite.scenarios) {
    if (!object(s) || !text(s.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.id) || ids.has(s.id)) fail('Scenario IDs must be unique hyphenated identifiers');
    ids.add(s.id);
    if (!roles.includes(s.role) || !text(s.title) || !text(s.request) || !object(s.context) || !text(s.tools_policy)) fail(`${s.id}: role, title, request, context and tools_policy required`);
    if (!Array.isArray(s.dimensions) || new Set(s.dimensions).size !== s.dimensions.length || s.dimensions.some(d=>!Object.hasOwn(WEIGHTS,d)) || common.some(d=>!s.dimensions.includes(d))) fail(`${s.id}: invalid or missing dimensions`);
    if (!Array.isArray(s.checks) || !s.checks.length || !s.checks.some(c=>c.critical === true)) fail(`${s.id}: checks need a critical decision`);
    const checkIds = new Set();
    for (const c of s.checks) {
      if (!object(c) || !text(c.id) || checkIds.has(c.id) || !text(c.description) || typeof c.critical !== 'boolean') fail(`${s.id}: invalid/duplicate check`);
      checkIds.add(c.id);
    }
  }
  return suite;
}

export function suiteFingerprint(suite) {
  validateSuite(suite);
  return createHash('sha256').update(JSON.stringify(suite)).digest('hex');
}

/** No rubric or intended specialist is exposed to the responding agent. */
export function scenarioPrompt(suite, id) {
  validateSuite(suite);
  const s = suite.scenarios.find(x=>x.id===id);
  if (!s) fail(`Unknown scenario: ${id}`);
  return {scenario_id:s.id, suite_fingerprint:suiteFingerprint(suite), request:s.request, context:s.context, tools_policy:s.tools_policy};
}

function assessment(value, response, label, check=false) {
  if (!object(value) || !text(value.rationale)) fail(`${label}: rationale is required`);
  if (typeof value.quote !== 'string') fail(`${label}: quote must be a string (empty only for absence/failure)`);
  if (value.quote && !response.includes(value.quote)) fail(`${label}: evidence quote is not in the response`);
  if (check) {
    if (!['pass','fail','not_observed'].includes(value.result)) fail(`${label}: invalid check result`);
    if (value.result === 'pass' && !text(value.quote)) fail(`${label}: passing checks require a response quote`);
  } else {
    if (!Number.isInteger(value.score) || value.score < 0 || value.score > 4) fail(`${label}: score must be integer 0–4`);
    if (value.score > 0 && !text(value.quote)) fail(`${label}: positive scores require a response quote`);
  }
}

export function scoreRun(suite, run) {
  validateSuite(suite);
  if (!object(run) || run.version !== 1 || !text(run.run_id) || !text(run.skill_revision) || !text(run.evaluator_id) || !text(run.environment) || !Array.isArray(run.cases)) fail('Run needs version, run_id, skill_revision, evaluator_id, environment and cases');
  if (!['independent-dry-run','self-review','synthetic-example'].includes(run.evaluation_kind)) fail('Invalid evaluation_kind');
  if (run.suite_fingerprint!==suiteFingerprint(suite)) fail('Run suite_fingerprint must match the current scenario suite');
  const index = new Map(suite.scenarios.map(s=>[s.id,s]));
  const cases = new Map();
  for (const c of run.cases) {
    if (!object(c) || !index.has(c.scenario_id) || cases.has(c.scenario_id)) fail('Unknown/duplicate run scenario');
    if (typeof c.response !== 'string' || !text(c.response_author) || !object(c.dimensions) || !object(c.checks)) fail(`${c.scenario_id}: response, author and assessment objects required`);
    if (run.evaluation_kind === 'independent-dry-run' && c.response_author.trim() === run.evaluator_id.trim()) fail('Independent evaluation requires a different responder and evaluator');
    cases.set(c.scenario_id,c);
  }
  const results = suite.scenarios.map(s=>{
    const c = cases.get(s.id);
    if (!c) return {scenario_id:s.id, role:s.role, status:'NOT_RUN', score:null, critical_failures:[], missing_dimensions:s.dimensions, missing_checks:s.checks.map(x=>x.id)};
    if (Object.keys(c.dimensions).some(d=>!s.dimensions.includes(d))) fail(`${s.id}: unknown/inapplicable scored dimension`);
    if (Object.keys(c.checks).some(k=>!s.checks.some(x=>x.id===k))) fail(`${s.id}: unknown check`);
    const missingDimensions = s.dimensions.filter(d=>!Object.hasOwn(c.dimensions,d));
    let weighted = 0;
    for (const d of s.dimensions) {
      if (!Object.hasOwn(c.dimensions,d)) continue;
      assessment(c.dimensions[d],c.response,`${s.id}/${d}`);
      weighted += c.dimensions[d].score / 4 * WEIGHTS[d];
    }
    const missingChecks = [], criticalFailures = [], failedChecks = [];
    for (const check of s.checks) {
      const a = c.checks[check.id];
      if (!a) { missingChecks.push(check.id); continue; }
      assessment(a,c.response,`${s.id}/${check.id}`,true);
      if (a.result === 'not_observed') missingChecks.push(check.id);
      if (a.result === 'fail') { failedChecks.push(check.id); if (check.critical) criticalFailures.push(check.id); }
    }
    const score = missingDimensions.length ? null : round(weighted / s.dimensions.reduce((n,d)=>n+WEIGHTS[d],0)*100);
    const incomplete = !text(c.response) || missingDimensions.length>0 || missingChecks.length>0;
    // A known critical failure remains visible even with incomplete grading.
    const status = criticalFailures.length ? 'FAIL' : incomplete ? 'INCOMPLETE' : score < 80 || failedChecks.length ? 'FAIL' : 'PASS';
    return {scenario_id:s.id, role:s.role, status, score, critical_failures:criticalFailures, failed_checks:failedChecks, missing_dimensions:missingDimensions, missing_checks:missingChecks};
  });
  const complete = results.filter(r=>['PASS','FAIL'].includes(r.status) && !r.missing_dimensions.length && !r.missing_checks.length);
  const byRole = Object.fromEntries(roles.filter(role=>results.some(r=>r.role===role)).map(role=>{
    const group=results.filter(r=>r.role===role), scored=complete.filter(r=>r.role===role);
    return [role,{total:group.length,completed:scored.length,passed:group.filter(r=>r.status==='PASS').length,failed:group.filter(r=>r.status==='FAIL').length,average_score:scored.length?round(scored.reduce((n,r)=>n+r.score,0)/scored.length):null}];
  }));
  const counts=Object.fromEntries(['PASS','FAIL','INCOMPLETE','NOT_RUN'].map(status=>[status,results.filter(r=>r.status===status).length]));
  return {version:1, run_id:run.run_id, skill_revision:run.skill_revision, evaluation_kind:run.evaluation_kind, environment:run.environment,
    evaluator_id:run.evaluator_id, suite_fingerprint:suiteFingerprint(suite),
    status:counts.FAIL?'FAIL':counts.INCOMPLETE||counts.NOT_RUN?'INCOMPLETE':'PASS',
    coverage:{total:results.length,completed:complete.length,...counts},
    average_score:complete.length?round(complete.reduce((n,r)=>n+r.score,0)/complete.length):null,
    critical_failure_count:results.reduce((n,r)=>n+r.critical_failures.length,0),
    release_ready:run.evaluation_kind==='independent-dry-run' && counts.PASS===results.length,
    by_role:byRole, cases:results,
    limitations:['Scores are evidence-linked evaluator judgments, not automatic semantic verification.',
      'PASS covers these synthetic dry runs only; not live-account reliability or profitability.',
      'Examples and self-reviews cannot satisfy the independent release gate.']};
}

export function compareScorecards(baseline, current) {
  if (!object(baseline) || !object(current) || !Array.isArray(baseline.cases) || !Array.isArray(current.cases)) fail('Two scorecards are required');
  for (const card of [baseline,current]) {
    if (card.version!==1 || !text(card.environment) || !['independent-dry-run','self-review','synthetic-example'].includes(card.evaluation_kind) || !/^[a-f0-9]{64}$/.test(card.suite_fingerprint??'') || !card.cases.length || !object(card.coverage) || !(card.average_score===null || typeof card.average_score==='number'&&Number.isFinite(card.average_score)&&card.average_score>=0&&card.average_score<=100)) fail('Invalid scorecard metadata');
    const ids=new Set();
    for(const c of card.cases) {
      if(!text(c.scenario_id)||ids.has(c.scenario_id)||!['PASS','FAIL','INCOMPLETE','NOT_RUN'].includes(c.status)||!Array.isArray(c.critical_failures)||!Array.isArray(c.missing_dimensions)||!Array.isArray(c.missing_checks)||!(c.score===null||typeof c.score==='number'&&Number.isFinite(c.score)&&c.score>=0&&c.score<=100)) fail('Invalid scorecard case');
      ids.add(c.scenario_id);
    }
    const completed=card.cases.filter(c=>['PASS','FAIL'].includes(c.status)&&c.score!==null&&!c.missing_dimensions.length&&!c.missing_checks.length);
    const expected={total:card.cases.length,completed:completed.length,...Object.fromEntries(['PASS','FAIL','INCOMPLETE','NOT_RUN'].map(s=>[s,card.cases.filter(c=>c.status===s).length]))};
    const average=completed.length?round(completed.reduce((n,c)=>n+c.score,0)/completed.length):null;
    const status=expected.FAIL?'FAIL':expected.INCOMPLETE||expected.NOT_RUN?'INCOMPLETE':'PASS';
    if(Object.entries(expected).some(([k,v])=>card.coverage[k]!==v)||card.average_score!==average||card.status!==status||card.critical_failure_count!==card.cases.reduce((n,c)=>n+c.critical_failures.length,0)) fail('Scorecard summary contradicts its cases');
  }
  const compatible = baseline.suite_fingerprint===current.suite_fingerprint && baseline.environment===current.environment && baseline.evaluation_kind===current.evaluation_kind;
  if (!compatible) return {status:'INCOMPATIBLE',reason:'Suite, environment or evaluation kind differs; scores are not a matched comparison'};
  const old=new Map(baseline.cases.map(c=>[c.scenario_id,c]));
  if (old.size!==current.cases.length || current.cases.some(c=>!old.has(c.scenario_id))) fail('Matching suite scorecards must contain the same scenario IDs');
  const regressions=current.cases.filter(c=>{const b=old.get(c.scenario_id);return b && (b.status==='PASS'&&c.status!=='PASS' || ['PASS','FAIL'].includes(b.status)&&['NOT_RUN','INCOMPLETE'].includes(c.status) || c.critical_failures.some(id=>!b.critical_failures.includes(id)) || b.score!==null&&c.score!==null&&c.score<b.score);}).map(c=>c.scenario_id);
  const scoredIds=card=>card.cases.filter(c=>['PASS','FAIL'].includes(c.status)&&c.score!==null&&!c.missing_dimensions.length&&!c.missing_checks.length).map(c=>c.scenario_id).sort().join('\n');
  const sameCohort=scoredIds(baseline)===scoredIds(current);
  return {status:regressions.length?'REGRESSION':'NO_OBSERVED_REGRESSION',regressions,
    score_change:!sameCohort||baseline.average_score===null||current.average_score===null?null:round(current.average_score-baseline.average_score),
    completed_cohort_matches:sameCohort,coverage:{baseline:baseline.coverage.completed,current:current.coverage.completed},
    note:'Same-scope dry-run comparison only. Averages over different completed cohorts are not compared; unchanged scores do not prove equivalent live behaviour.'};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const suite=JSON.parse(readFileSync(new URL('../evals/scenarios.json',import.meta.url),'utf8'));
    const args=process.argv.slice(2);
    if(args.length>4)fail('Too many arguments; use --help');
    const [command,arg,flag,baselineFile]=args;
    let result;
    if (command==='--help' || !command) {
      console.log('node agent-scorecard.mjs list | check-suite | template | prompt SCENARIO_ID | score RUN.json [--baseline SCORECARD.json]\nOffline, no model/API/account access. prompt omits grader rubrics. score validates evidence-linked human/agent judgments; it does not judge semantics. See references/evaluation-and-improvement.md.');
    } else if (command==='list' && !arg) { validateSuite(suite);result=suite.scenarios.map(({id,role,title})=>({id,role,title})); }
    else if (command==='check-suite' && !arg) { validateSuite(suite);result={status:'VALID',scenarios:suite.scenarios.length,fingerprint:suiteFingerprint(suite)}; }
    else if (command==='template' && !arg) { validateSuite(suite);result={version:1,run_id:'SET-RUN-ID',skill_revision:'SET-SKILL-REVISION',suite_fingerprint:suiteFingerprint(suite),evaluation_kind:'self-review',environment:'SET-HOST-MODEL-TOOLS-CONFIG',evaluator_id:'SET-EVALUATOR-ID',cases:suite.scenarios.map(s=>({scenario_id:s.id,response_author:'UNASSIGNED',response:'',dimensions:{},checks:{}}))}; }
    else if (command==='prompt' && arg && !flag) result=scenarioPrompt(suite,arg);
    else if (command==='score' && arg && (!flag || flag==='--baseline'&&baselineFile)) {
      result=scoreRun(suite,JSON.parse(readFileSync(arg,'utf8')));
      if (baselineFile) result.comparison=compareScorecards(JSON.parse(readFileSync(baselineFile,'utf8')),result);
      if (result.status!=='PASS') process.exitCode=1;
    } else fail('Unknown command/arguments; use --help');
    if (result) console.log(JSON.stringify(result,null,2));
  } catch (e) { console.error(e.message);process.exitCode=2; }
}
