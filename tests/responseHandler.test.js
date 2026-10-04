import test from 'node:test';import assert from 'node:assert/strict';
import {withErrorHandling} from '../src/utils/responseHandler.js';
test('tool failures are isError and never leak raw remote messages',async()=>{
 const logs=[];const saved=console.error;console.error=x=>logs.push(x);
 try {const result=await withErrorHandling(async()=>{throw Error('TOKEN=private-schema')},'secret tenant')();assert.equal(result.isError,true);assert.match(result.content[0].text,/Reference: [a-f0-9-]+/);assert.ok(!JSON.stringify(result).includes('private-schema'));assert.ok(!logs.join('').includes('private-schema'));assert.ok(!logs.join('').includes('secret tenant'));}
 finally {console.error=saved;}
});
test('successful tool results preserve content',async()=>{assert.deepEqual(await withErrorHandling(async()=>({ok:true}),'read')(),{content:[{type:'text',text:'{\n  "ok": true\n}'}]})});
