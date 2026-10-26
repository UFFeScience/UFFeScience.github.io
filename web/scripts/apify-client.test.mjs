import test from 'node:test';
import assert from 'node:assert/strict';
import { createApifyClient, openPublicationStore } from '../lib/apify-client.js';

test('opens a named persistent store instead of reusing an expired ID', async () => {
  const calls = [];
  const api = createApifyClient('test-key', async (url, options) => {
    calls.push([url, options.method]);
    return new Response(JSON.stringify({ data: { id: 'persistent-store' } }), { status: 201 });
  });
  assert.equal(await openPublicationStore(api, { storeId: 'expired-store' }), 'persistent-store');
  assert.deepEqual(calls, [
    ['https://api.apify.com/v2/key-value-stores?name=uffescience-publications', 'POST'],
  ]);
});

test('accepts successful writes with an empty body', async () => {
  const api = createApifyClient('test-key', async () => new Response('', { status: 201 }));
  assert.equal(
    await api('key-value-stores/store/records/WEEK', { method: 'PUT', body: { id: 'run' } }),
    null,
  );
});

test('identifies the endpoint and HTTP status without disclosing credentials', async () => {
  const api = createApifyClient('secret-test-key', async () => new Response('{}', { status: 404 }));
  await assert.rejects(api('actor-tasks/missing/runs'), (error) => {
    assert.equal(error.status, 404);
    assert.match(error.message, /GET actor-tasks\/missing\/runs/);
    assert.ok(!error.message.includes('secret-test-key'));
    return true;
  });
});
