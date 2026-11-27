import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scoreRun,compareScorecards} from '../skills/shopee-shop-manager/scripts/agent-scorecard.mjs';

const root=new URL('../skills/shopee-shop-manager/evals/',import.meta.url);
const read=p=>JSON.parse(readFileSync(new URL(p,root),'utf8'));

test('published evaluation records reproduce honestly and the release gate uses the final run',()=>{
  const suite=read('scenarios.json'),manifest=read('release.json');
  assert.equal(manifest.version,1);
  assert.ok(manifest.runs.length>=1);
  const cards=new Map();
  for(const record of manifest.runs){
    const run=read(record.run),saved=read(record.scorecard),computed=scoreRun(suite,run);
    const {comparison,...savedCore}=saved;
    assert.deepEqual(computed,savedCore,record.label);
    if(comparison){
      assert.ok(record.comparison_baseline,'stored comparison needs its baseline');
      assert.deepEqual(comparison,compareScorecards(cards.get(record.comparison_baseline),computed));
    }
    assert.equal(run.skill_revision,record.skill_revision);
    assert.equal(computed.status,record.expected_status);
    cards.set(record.label,computed);
  }
  const final=cards.get(manifest.release_run);
  assert.ok(final,'release run must exist');
  assert.equal(final.release_ready,true);
  assert.equal(final.coverage.completed,suite.scenarios.length);
  assert.equal(final.critical_failure_count,0);
  // A rising average must not erase the known intervening case regression.
  if(cards.has('initial')&&cards.has('first-retest'))
    assert.equal(compareScorecards(cards.get('initial'),cards.get('first-retest')).status,'REGRESSION');
});
