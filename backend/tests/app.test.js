/**
 * Backend integration tests using supertest.
 */

import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Machines API', () => {
  it('registers a machine', async () => {
    const res = await request(app)
      .post('/api/machines')
      .send({ name: 'Test Laptop', daemonUrl: 'http://localhost:5001' });
    expect(res.status).toBe(201);
    expect(res.body.machine.name).toBe('Test Laptop');
    expect(res.body.machine.daemonUrl).toBe('http://localhost:5001');
    expect(res.body.machine.id).toBeDefined();
  });

  it('lists registered machines', async () => {
    await request(app)
      .post('/api/machines')
      .send({ name: 'Another Machine', daemonUrl: 'http://localhost:5002' });

    const res = await request(app).get('/api/machines');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.machines)).toBe(true);
    expect(res.body.machines.length).toBeGreaterThan(0);
  });

  it('returns 400 when daemonUrl is missing', async () => {
    const res = await request(app)
      .post('/api/machines')
      .send({ name: 'No URL' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('daemonUrl');
  });

  it('returns 404 for unknown machine id', async () => {
    const res = await request(app).get('/api/machines/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('Context API', () => {
  it('stores and retrieves a key', async () => {
    await request(app)
      .post('/api/context')
      .send({ key: 'testKey', value: 'testValue' });

    const res = await request(app).get('/api/context/testKey');
    expect(res.status).toBe(200);
    expect(res.body.value).toBe('testValue');
  });

  it('returns 400 when key is missing', async () => {
    const res = await request(app)
      .post('/api/context')
      .send({ value: 'noKey' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown key', async () => {
    const res = await request(app).get('/api/context/unknownKey999');
    expect(res.status).toBe(404);
  });

  it('deletes a key', async () => {
    await request(app)
      .post('/api/context')
      .send({ key: 'toDelete', value: 'bye' });

    const del = await request(app).delete('/api/context/toDelete');
    expect(del.status).toBe(200);
    expect(del.body.status).toBe('deleted');

    const get = await request(app).get('/api/context/toDelete');
    expect(get.status).toBe(404);
  });
});

describe('Execute API', () => {
  it('returns 400 when machineId is missing', async () => {
    const res = await request(app)
      .post('/api/execute')
      .send({ agent: 'copilot', prompt: 'hello' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('machineId');
  });

  it('returns 404 for unknown machineId', async () => {
    const res = await request(app)
      .post('/api/execute')
      .send({ machineId: 'ghost', agent: 'copilot', prompt: 'hello' });
    expect(res.status).toBe(404);
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
  });
});
