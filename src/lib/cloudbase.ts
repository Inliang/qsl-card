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
