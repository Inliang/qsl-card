// CloudBase 配置 — 部署时替换为实际环境 ID
const ENV_ID = 'your-env-id';
const USE_CLOUDBASE = ENV_ID !== 'your-env-id';

/* ========== localStorage fallback（无 CloudBase 环境时自动启用） ========== */

const LS_REQUESTS = 'ls_qsl_requests';
const LS_CONFIG = 'ls_admin_config';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function lsGet<T = any>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, val: any) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ---- CloudBase 模式 ----
let app: any = null;

export async function initCloudBase() {
  if (!USE_CLOUDBASE) return null; // localStorage 模式无需初始化
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

function getDb() {
  return app?.database();
}

// ---- 公共接口 ----

export async function submitRequest(data: Record<string, any>) {
  if (USE_CLOUDBASE) {
    const db = getDb();
    const now = Date.now();
    return db.collection('qsl_requests').add({ ...data, status: '申请', created_at: now, updated_at: now });
  }
  // localStorage
  const id = uid();
  const now = Date.now();
  const record = { _id: id, ...data, status: '申请', created_at: now, updated_at: now };
  const list = lsGet<any[]>(LS_REQUESTS, []);
  list.unshift(record);
  lsSet(LS_REQUESTS, list);
  return { id };
}

export async function queryRequests(params: { id?: string; call?: string }) {
  if (USE_CLOUDBASE) {
    const db = getDb();
    if (params.id) {
      const res = await db.collection('qsl_requests').doc(params.id).get();
      return res.data ? [res.data] : [];
    }
    const _ = db.command;
    const res = await db.collection('qsl_requests')
      .where(_.or([{ from_call: params.call }, { to_call: params.call }]))
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();
    return res.data || [];
  }
  // localStorage
  const list = lsGet<any[]>(LS_REQUESTS, []);
  if (params.id) {
    const found = list.find((r) => r._id === params.id || r._id?.endsWith(params.id!));
    return found ? [found] : [];
  }
  const call = params.call?.toUpperCase();
  return list.filter((r) => r.from_call?.toUpperCase() === call || r.to_call?.toUpperCase() === call);
}

export async function confirmReceived(id: string) {
  if (USE_CLOUDBASE) {
    const db = getDb();
    return db.collection('qsl_requests').doc(id).update({
      status: '已妥收', confirmed_at: Date.now(), updated_at: Date.now(),
    });
  }
  const list = lsGet<any[]>(LS_REQUESTS, []);
  const idx = list.findIndex((r) => r._id === id || r._id?.endsWith(id));
  if (idx === -1) throw new Error('未找到该申请');
  list[idx].status = '已妥收';
  list[idx].confirmed_at = Date.now();
  list[idx].updated_at = Date.now();
  lsSet(LS_REQUESTS, list);
}

/* ========== 管理后台接口 ========== */

export async function getAdminConfig() {
  if (USE_CLOUDBASE) {
    const db = getDb();
    const res = await db.collection('admin_config').doc('admin_config').get();
    return res.data || null;
  }
  return lsGet(LS_CONFIG, null);
}

export async function setAdminPassword(passwordHash: string) {
  if (USE_CLOUDBASE) {
    const db = getDb();
    const res = await db.collection('admin_config').doc('admin_config').get();
    if (res.data) {
      return db.collection('admin_config').doc('admin_config').update({ password_hash: passwordHash });
    }
    return db.collection('admin_config').add({ _id: 'admin_config', password_hash: passwordHash });
  }
  lsSet(LS_CONFIG, { password_hash: passwordHash });
}

export async function getAllRequests(params?: {
  status?: string; card_type?: string; page?: number; pageSize?: number;
}) {
  if (USE_CLOUDBASE) {
    const db = getDb();
    const pageSize = params?.pageSize || 20;
    let query = db.collection('qsl_requests');
    const conditions: Record<string, any> = {};
    if (params?.status) conditions.status = params.status;
    if (params?.card_type) conditions.card_type = params.card_type;
    if (Object.keys(conditions).length > 0) query = query.where(conditions);
    const totalRes = await query.count();
    const res = await query.orderBy('created_at', 'desc')
      .skip(((params?.page || 1) - 1) * pageSize).limit(pageSize).get();
    return { list: res.data || [], total: totalRes.total };
  }
  let list = lsGet<any[]>(LS_REQUESTS, []);
  if (params?.status) list = list.filter((r) => r.status === params.status);
  if (params?.card_type) list = list.filter((r) => r.card_type === params.card_type);
  const total = list.length;
  const pageSize = params?.pageSize || 20;
  const page = params?.page || 1;
  const start = (page - 1) * pageSize;
  return { list: list.slice(start, start + pageSize), total };
}

export async function updateRequestStatus(id: string, status: string) {
  if (USE_CLOUDBASE) {
    const db = getDb();
    return db.collection('qsl_requests').doc(id).update({ status, updated_at: Date.now() });
  }
  const list = lsGet<any[]>(LS_REQUESTS, []);
  const idx = list.findIndex((r) => r._id === id || r._id?.endsWith(id));
  if (idx === -1) throw new Error('未找到该申请');
  list[idx].status = status;
  list[idx].updated_at = Date.now();
  lsSet(LS_REQUESTS, list);
}
