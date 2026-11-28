const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
function loader(aliases = {}) {
  const cache = new Map();
  function load(relative) {
    const file = path.resolve(relative);
    if (cache.has(file)) return cache.get(file).exports;
    const mod = new Module(file, module);
    mod.paths = Module._nodeModulePaths(process.cwd());
    cache.set(file, mod);
    mod.require = id => {
      if (id === 'server-only') return {};
      if (id in aliases) return aliases[id];
      if (id.startsWith('@/')) return load('src/' + id.slice(2) + '.ts');
      if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id + '.ts'));
      return require(id);
    };
    mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    } }).outputText, file);
    return mod.exports;
  }
  return load;
}
const base = 'src/lib/server/team-members/';
const load = loader();
const contracts = load(base + 'contracts.ts');
const valid = { email: 'NEW@example.com', name: 'New Member', username: 'TES', role: 'AFFILIATOR', password: 'test-password-123' };
const input = contracts.parseMemberInput(valid);
test('normalizes email and username without changing password', () => {
  assert.equal(input.email, 'new@example.com'); assert.equal(input.username, 'tes');
  assert.equal(input.password, valid.password);
});
for (const patch of [{ email: 'invalid' }, { name: 'x' }, { username: 'bad name' }, { password: 'short' }, { role: 'ROOT' }]) {
  test('rejects invalid input: ' + Object.keys(patch)[0], () => assert.throws(() => contracts.parseMemberInput({ ...valid, ...patch }), { status: 400 }));
}
for (const role of ['MEMBER', 'AFFILIATOR']) {
  test(role + ' cannot create accounts', () => assert.throws(() => contracts.requireCreationAccess({ id: 'actor', role, isActive: true }, 'MEMBER'), { status: 403 }));
}
test('inactive admin and admin escalation are denied; owner can create admins', () => {
  assert.throws(() => contracts.requireCreationAccess({ role: 'SYSTEM_OWNER', isActive: false }, 'MEMBER'), { status: 403 });
  assert.throws(() => contracts.requireCreationAccess({ role: 'SYSTEM_ADMIN', isActive: true }, 'SYSTEM_ADMIN'), { status: 403 });
  assert.throws(() => contracts.requireCreationAccess({ role: 'SYSTEM_OWNER', isActive: true }, 'SYSTEM_OWNER'), { status: 403 });
  contracts.requireCreationAccess({ role: 'SYSTEM_OWNER', isActive: true }, 'SYSTEM_ADMIN');
});
function dependencies(overrides = {}) {
  const events = [];
  return { events, repository: {
    authorize: async () => { events.push('authorize'); },
    save: async (_, member) => { events.push('save'); return member; },
    disableAffiliate: async () => { events.push('disable'); }, ...overrides,
  }, auth: {
    create: async () => { events.push('auth-create'); return 'new-auth-id'; },
    remove: async id => { assert.equal(id, 'new-auth-id'); events.push('auth-remove'); },
  } };
}
const { createTeamMember } = load(base + 'create.ts');
test('authorized creation returns only public account data', async () => {
  const deps = dependencies();
  const result = await createTeamMember('actor', input, deps);
  assert.deepEqual(deps.events, ['authorize', 'auth-create', 'save']);
  assert.equal(result.userId, 'new-auth-id'); assert.equal(result.role, 'AFFILIATOR');
  assert.ok(!('password' in result));
});
test('access or duplicate failure does not touch Supabase Auth', async () => {
  const deps = dependencies({ authorize: async () => { throw new contracts.MemberError(409, 'Duplicate'); } });
  await assert.rejects(createTeamMember('actor', input, deps), { status: 409 });
  assert.deepEqual(deps.events, []);
});
test('rolled-back affiliate write disables its mirror and deletes only the newly created auth user', async () => {
  const deps = dependencies({ save: async () => { throw new Error('write failed'); } });
  await assert.rejects(createTeamMember('actor', input, deps), /write failed/);
  assert.deepEqual(deps.events, ['authorize', 'auth-create', 'disable', 'auth-remove']);
});
test('uncertain database commit preserves the account for reconciliation', async () => {
  const deps = dependencies({ save: async () => { throw new contracts.UncertainMemberWrite(); } });
  await assert.rejects(createTeamMember('actor', input, deps), { status: 503 });
  assert.deepEqual(deps.events, ['authorize', 'auth-create']);
});
test('failed non-affiliate write does not access the Main database', async () => {
  const deps = dependencies({ save: async () => { throw new Error('write failed'); } });
  await assert.rejects(createTeamMember('actor', { ...input, role: 'MEMBER' }, deps));
  assert.deepEqual(deps.events, ['authorize', 'auth-create', 'auth-remove']);
});
test('Supabase admin uses a server secret in apikey and keeps password out of metadata', async () => {
  const old = { key: process.env.SUPABASE_SECRET_KEY, url: process.env.NEXT_PUBLIC_SUPABASE_URL, fetch: global.fetch };
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_mock_test'; process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  global.fetch = async (url, init) => {
    assert.equal(url, 'https://example.supabase.co/auth/v1/admin/users');
    assert.equal(init.headers.apikey, 'sb_secret_mock_test'); assert.equal(init.headers.Authorization, undefined);
    const body = JSON.parse(init.body); assert.equal(body.password, input.password);
    assert.deepEqual(body.user_metadata, { name: input.name, full_name: input.name });
    return Response.json({ id: 'created-id' });
  };
  try { assert.equal(await load(base + 'auth-admin.ts').createAuthAdmin().create(input), 'created-id'); }
  finally { restoreEnv('SUPABASE_SECRET_KEY', old.key); restoreEnv('NEXT_PUBLIC_SUPABASE_URL', old.url); global.fetch = old.fetch; }
});
function restoreEnv(key, value) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
test('invalid admin key reports configuration failure without exposing credentials', async () => {
  const oldKey = process.env.SUPABASE_SECRET_KEY, oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, oldFetch = global.fetch;
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_mock_rejected'; process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  global.fetch = async () => Response.json({ message: 'Invalid API key' }, { status: 401 });
  try {
    await assert.rejects(load(base + 'auth-admin.ts').createAuthAdmin().create(input), error => error.status === 503 && !error.message.includes('sb_secret_mock_rejected'));
    global.fetch = async () => Response.json({ error_code: 'email_exists' }, { status: 422 });
    await assert.rejects(load(base + 'auth-admin.ts').createAuthAdmin().create(input), { status: 409 });
  } finally { restoreEnv('SUPABASE_SECRET_KEY', oldKey); restoreEnv('NEXT_PUBLIC_SUPABASE_URL', oldUrl); global.fetch = oldFetch; }
});
test('Next route rejects cross-origin and unauthenticated calls before account creation', async () => {
  const { NextRequest } = require('next/server');
  let user = null, created = 0;
  const routeLoad = loader({
    '@supabase/ssr': { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user }, error: null }) } }) },
    'next/headers': { cookies: async () => ({ getAll: () => [], set() {} }) },
    '@/lib/server/team-members/create': { createTeamMember: async () => { created++; return { email: input.email }; } },
    '@/lib/server/team-members/auth-admin': { createAuthAdmin: () => ({}) },
    '@/lib/server/team-members/repository': { memberRepository: {} },
  });
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, oldKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'; process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable';
  const { POST } = routeLoad('src/app/api/team/members/route.ts');
  const request = origin => new NextRequest('http://localhost:3100/api/team/members', { method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(valid) });
  try {
    assert.equal((await POST(request('http://evil.test'))).status, 403);
    assert.equal((await POST(request('http://localhost:3100'))).status, 401);
    assert.equal(created, 0);
    user = { id: 'verified-id' };
    const response = await POST(request('http://localhost:3100'));
    assert.equal(response.status, 201); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(created, 1);
  } finally { restoreEnv('NEXT_PUBLIC_SUPABASE_URL', oldUrl); restoreEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', oldKey); }
});
test('repository rechecks the actor under lock and rejects a revoked admin before insert', async () => {
  let inserts = 0;
  const db = { query: async () => ({ rows: [] }) };
  const tx = { query: async sql => {
    if (sql.includes('FOR SHARE')) return { rows: [{ id: 'actor', role: 'MEMBER', isActive: true }] };
    inserts++; throw new Error('Unexpected insert');
  } };
  const repo = loader({ './database': { database: () => db, transaction: async (_, fn) => fn(tx) } })(base + 'repository.ts').memberRepository;
  await assert.rejects(repo.save('actor', { ...input, id: 'member', userId: 'auth', isActive: true }, input), { status: 403 });
  assert.equal(inserts, 0);
});
test('repository recovers a lost COMMIT response without deleting a committed account', async () => {
  const member = { ...input, id: 'member', userId: 'auth', isActive: true };
  delete member.password;
  const db = { query: async () => ({ rows: [member] }) };
  const repo = loader({ './database': { database: () => db, transaction: async () => { throw new Error('Connection lost after COMMIT'); } } })(base + 'repository.ts').memberRepository;
  assert.deepEqual(await repo.save('actor', member, input), member);
});
test('repository preserves an account when failed COMMIT cannot be reconciled', async () => {
  const db = { query: async () => { throw new Error('Database offline'); } };
  const local = loader({ './database': { database: () => db, transaction: async () => { throw new Error('Connection lost'); } } });
  const repo = local(base + 'repository.ts').memberRepository;
  await assert.rejects(repo.save('actor', { id: 'member' }, input), { status: 503 });
});
