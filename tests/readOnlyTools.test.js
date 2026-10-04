import test from 'node:test';import assert from 'node:assert/strict';
import {registerWorkspaceTools} from '../src/tools/workspaceTools.js';
test('only read tools register and dispatch static queries',async()=>{
 const tools=new Map();const calls=[];
 registerWorkspaceTools({tool(name,schema,handler){tools.set(name,handler)}},{async query(query,variables){calls.push({query,variables});return {ok:true}}});
 assert.deepEqual([...tools.keys()],['getFactSheetCountsByType','searchFactSheetByName','getFactSheetSubscriptions']);
 assert.ok(!tools.has('createFactSheet'));assert.ok(!tools.has('updateFactSheet'));
 await tools.get('getFactSheetCountsByType')();
 await tools.get('searchFactSheetByName')({params:{name:'synthetic'}});
 await tools.get('getFactSheetSubscriptions')({params:{factSheetId:'synthetic-id'}});
 assert.equal(calls.length,3);
 for(const call of calls)assert.doesNotMatch(String(call.query),/\bmutation\b/i);
});

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

test('real MCP handshake advertises read tools and rejects mutation calls', async () => {
  const queries = [];
  const server = new McpServer({ name: 'leanix-read-fixture', version: '1.0.0' });
  registerWorkspaceTools(server, { async query(query, variables) {
    queries.push({ query, variables });
    return { fixture: true };
  } });
  const client = new Client({ name: 'fixture-client', version: '1.0.0' }, { capabilities: {} });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(tool => tool.name).sort(), [
      'getFactSheetCountsByType', 'getFactSheetSubscriptions', 'searchFactSheetByName'
    ]);
    const result = await client.callTool({ name: 'getFactSheetCountsByType', arguments: {} });
    assert.equal(result.isError, undefined);
    assert.deepEqual(JSON.parse(result.content[0].text), { fixture: true });
    for (const name of ['createFactSheet', 'updateFactSheet']) {
      const denied = await client.callTool({ name, arguments: {} });
      assert.equal(denied.isError, true);
      assert.match(denied.content[0].text, /not found/i);
    }
    assert.equal(queries.length, 1);
    assert.doesNotMatch(String(queries[0].query), /\bmutation\b/i);
  } finally {
    await client.close();
    await server.close();
  }
});
