import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateSuite,suiteFingerprint,scenarioPrompt,scoreRun,compareScorecards} from '../skills/shopee-shop-manager/scripts/agent-scorecard.mjs';

const dimensions=['accuracy','evidence','authority','completion','clarity','efficiency','deduplication'];
function suite() { return {version:1,scenarios:[{id:'synthetic-bump',role:'bump',title:'Synthetic scorer fixture',request:'Explain the permitted next action.',context:{active:true},tools_policy:'Offline only',dimensions:[...dimensions],checks:[{id:'no-paid-action',description:'Preserve the free-only instruction.',critical:true},{id:'no-repeat',description:'Do not repeat an active Bump.',critical:false}]}]}; }
function run(s) {
  return {version:1,run_id:'synthetic-fixture',skill_revision:'fixture-only',suite_fingerprint:suiteFingerprint(s),evaluation_kind:'synthetic-example',environment:'synthetic-node-test',evaluator_id:'grader',cases:[{scenario_id:'synthetic-bump',response_author:'responder',response:'Keep the active Bump. No paid action. Record the existing countdown.',dimensions:Object.fromEntries(dimensions.map(d=>[d,{score:4,quote:'Keep the active Bump.',rationale:'Synthetic scoring fixture, not a measured agent result.'}])),checks:{'no-paid-action':{result:'pass',quote:'No paid action.',rationale:'Fixture evidence.'},'no-repeat':{result:'pass',quote:'Keep the active Bump.',rationale:'Fixture evidence.'}}}]};
}

test('rubric checks are withheld from runtime prompts',()=>{
  const s=suite(),p=scenarioPrompt(s,'synthetic-bump');
  assert.equal(p.request,s.scenarios[0].request);assert.deepEqual(p.context,{active:true});
  for(const key of ['checks','role','dimensions','title'])assert.equal(Object.hasOwn(p,key),false);
  assert.equal(p.suite_fingerprint,suiteFingerprint(s));
});
test('synthetic examples cannot claim independent release readiness',()=>{
  const s=suite(),r=scoreRun(s,run(s));
  assert.equal(r.status,'PASS');assert.equal(r.average_score,100);assert.equal(r.release_ready,false);
});
test('an independent complete run can satisfy the gate but self-grading cannot',()=>{
  const s=suite(),r=run(s);r.evaluation_kind='independent-dry-run';
  assert.equal(scoreRun(s,r).release_ready,true);
  r.evaluator_id='responder';assert.throws(()=>scoreRun(s,r),/different responder/);
});
test('critical error overrides a high score and remains visible if other grading is incomplete',()=>{
  const s=suite(),r=run(s);r.cases[0].checks['no-paid-action']={result:'fail',quote:'No paid action.',rationale:'Synthetic negative judgement to test gate precedence.'};
  const scored=scoreRun(s,r);assert.equal(scored.average_score,100);assert.equal(scored.status,'FAIL');assert.equal(scored.critical_failure_count,1);
  delete r.cases[0].dimensions.evidence;
  const partial=scoreRun(s,r);assert.equal(partial.status,'FAIL');assert.equal(partial.cases[0].score,null);assert.equal(partial.coverage.completed,0);
});
test('ordinary check failures and low scores also prevent a pass',()=>{
  const s=suite(),r=run(s);r.cases[0].checks['no-repeat'].result='fail';
  assert.equal(scoreRun(s,r).status,'FAIL');
  const low=run(s);for(const v of Object.values(low.cases[0].dimensions))v.score=3;
  assert.equal(scoreRun(s,low).average_score,75);assert.equal(scoreRun(s,low).status,'FAIL');
});
test('unrun cases and missing assessments are not silently counted as passed',()=>{
  const s=suite(),r=run(s);r.cases=[];
  const empty=scoreRun(s,r);assert.equal(empty.status,'INCOMPLETE');assert.equal(empty.coverage.NOT_RUN,1);assert.equal(empty.average_score,null);
  const partial=run(s);delete partial.cases[0].dimensions.evidence;partial.cases[0].checks['no-repeat'].result='not_observed';
  const p=scoreRun(s,partial);assert.equal(p.status,'INCOMPLETE');assert.equal(p.coverage.completed,0);
});
test('quotes must exist and positive judgments cannot omit evidence',()=>{
  for(const mutate of [r=>r.cases[0].dimensions.accuracy.quote='invented evidence',r=>r.cases[0].dimensions.authority.quote='',r=>r.cases[0].checks['no-paid-action'].quote='']){
    const s=suite(),r=run(s);mutate(r);assert.throws(()=>scoreRun(s,r),/quote/);
  }
  const s=suite(),r=run(s);r.cases[0].dimensions.evidence={score:0,quote:'',rationale:'Behaviour absent from response.'};
  assert.doesNotThrow(()=>scoreRun(s,r));
});
test('duplicate or foreign cases and unknown scoring fields are rejected',()=>{
  for(const mutate of [r=>r.cases.push(structuredClone(r.cases[0])),r=>r.cases[0].scenario_id='unknown',r=>r.cases[0].dimensions.extra={score:4},r=>r.cases[0].checks.extra={result:'pass'},r=>r.cases[0].dimensions.accuracy.score=5]){
    const s=suite(),r=run(s);mutate(r);assert.throws(()=>scoreRun(s,r));
  }
});
test('suite changes invalidate old fingerprints and incomparable baselines',()=>{
  const s=suite(),r=run(s),baseline=scoreRun(s,r);s.scenarios[0].context.active=false;
  assert.throws(()=>scoreRun(s,r),/fingerprint/);
  const current=scoreRun(s,run(s));assert.equal(compareScorecards(baseline,current).status,'INCOMPATIBLE');
  const same=scoreRun(s,run(s));same.environment='other-host';assert.equal(compareScorecards(current,same).status,'INCOMPATIBLE');
});
test('a regression cannot be hidden by a high average or unchanged critical failure count',()=>{
  const s=suite(),baseline=scoreRun(s,run(s)),r=run(s);r.cases[0].checks['no-repeat'].result='fail';
  const current=scoreRun(s,r);assert.equal(compareScorecards(baseline,current).status,'REGRESSION');
  const old=structuredClone(current),newer=structuredClone(current);old.cases[0].critical_failures=['old'];newer.cases[0].critical_failures=['different'];
  assert.equal(compareScorecards(old,newer).status,'REGRESSION');
  assert.equal(compareScorecards(baseline,baseline).status,'NO_OBSERVED_REGRESSION');
});
test('invalid suite shape or incomplete scorecards cannot fake compatibility',()=>{
  const s=suite();s.scenarios[0].dimensions=['accuracy'];assert.throws(()=>validateSuite(s));
  assert.throws(()=>compareScorecards({cases:[]},{cases:[]}));
});
test('distributed scenario suite covers all eight roles and runtime CLI hides rubrics',()=>{
  const path=new URL('../skills/shopee-shop-manager/evals/scenarios.json',import.meta.url);
  const s=JSON.parse(readFileSync(path,'utf8'));validateSuite(s);
  for(const role of ['coordinator','posting','design','inventory','customer-service','bump','report','growth-ads'])assert.ok(s.scenarios.filter(c=>c.role===role).length>=3,role);
  const cli=fileURLToPath(new URL('../skills/shopee-shop-manager/scripts/agent-scorecard.mjs',import.meta.url));
  const p=JSON.parse(execFileSync(process.execPath,[cli,'prompt',s.scenarios[0].id],{encoding:'utf8'}));
  assert.equal(Object.hasOwn(p,'checks'),false);assert.equal(Object.hasOwn(p,'role'),false);
});
