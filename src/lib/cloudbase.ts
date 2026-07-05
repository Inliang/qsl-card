// CloudBase 配置 — 部署时替换为实际环境 ID
const ENV_ID = 'your-env-id';

let app: any = null;

export async function initCloudBase() {
  if (app) return app;
  const cloudbase = (window as any).cloudbase;
  if (!cloudbase) {
    const script = document.createElement('script');
    script.src = 'https://web-9gikcbug35bad3a8-1304825656.tcloudbaseapp.com/sdk/1.7.0/cloud.js';
    await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
    document.head.appendChild(script);
  }
  app = (window as any).cloudbase.init({ env: ENV_ID });
  await app.auth({ persistence: 'local' }).anonymousAuthProvider().signIn();
  return app;
}

export function getDb() {
  return app?.database();
}

export async function submitRequest(data: Record<string, any>) {
  const db = getDb();
  const now = Date.now();
  return db.collection('qsl_requests').add({
    ...data,
    status: '申请',
    created_at: now,
    updated_at: now,
  });
}

export async function queryRequests(params: { id?: string; call?: string }) {
  const db = getDb();
  if (params.id) {
    const res = await db.collection('qsl_requests').doc(params.id).get();
    return res.data ? [res.data] : [];
  }
  const res = await db.collection('qsl_requests')
    .where({ from_call: params.call })
    .orderBy('created_at', 'desc')
    .limit(50)
    .get();
  return res.data || [];
}

export async function confirmReceived(id: string) {
  const db = getDb();
  return db.collection('qsl_requests').doc(id).update({
    status: '已妥收',
    confirmed_at: Date.now(),
    updated_at: Date.now(),
  });
}

/* ========== 管理后台接口 ========== */

export async function getAdminConfig() {
  const db = getDb();
  const res = await db.collection('admin_config').doc('admin_config').get();
  return res.data || null;
}

export async function setAdminPassword(passwordHash: string) {
  const db = getDb();
  const res = await db.collection('admin_config').doc('admin_config').get();
  if (res.data) {
    return db.collection('admin_config').doc('admin_config').update({ password_hash: passwordHash });
  }
  return db.collection('admin_config').add({ _id: 'admin_config', password_hash: passwordHash });
}

export async function getAllRequests(params?: { status?: string; card_type?: string; page?: number; pageSize?: number }) {
  const db = getDb();
  const pageSize = params?.pageSize || 20;
  let query = db.collection('qsl_requests');

  const conditions: Record<string, any> = {};
  if (params?.status) conditions.status = params.status;
  if (params?.card_type) conditions.card_type = params.card_type;

  if (Object.keys(conditions).length > 0) {
    query = query.where(conditions);
  }

  const totalRes = await query.count();
  const total = totalRes.total;

  const res = await query
    .orderBy('created_at', 'desc')
    .skip(((params?.page || 1) - 1) * pageSize)
    .limit(pageSize)
    .get();

  return { list: res.data || [], total };
}

export async function updateRequestStatus(id: string, status: string) {
  const db = getDb();
  return db.collection('qsl_requests').doc(id).update({
    status,
    updated_at: Date.now(),
  });
}
