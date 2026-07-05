import { useState, useEffect } from 'react';
import {
  initCloudBase,
  getAdminConfig,
  setAdminPassword,
  getAllRequests,
  updateRequestStatus,
} from '../lib/cloudbase';
import { hashPassword } from '../lib/crypto';
import { CARD_TYPES, STATUS_LABELS } from '../types';

const STATUS_ORDER = ['申请', '待处理', '处理中', '已寄出', '已妥收'];

const FIELD_CLASSES =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white';

/* ===== 首次密码设置 ===== */
function SetupView({ onDone }: { onDone: () => void }) {
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setError('');
    if (pwd.length < 6) { setError('密码至少 6 位'); return; }
    if (pwd !== pwd2) { setError('两次密码不一致'); return; }
    setLoading(true);
    try {
      await initCloudBase();
      const h = await hashPassword(pwd);
      await setAdminPassword(h);
      onDone();
    } catch (e: any) {
      setError(e.message || '设置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">管理后台</h1>
      <p className="text-gray-500 text-sm mb-6">首次使用，请设置管理密码</p>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设置密码</label>
            <input
              type="password"
              className={FIELD_CLASSES}
              placeholder="至少 6 位"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <input
              type="password"
              className={FIELD_CLASSES}
              placeholder="再次输入"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <button
          onClick={handleSetup}
          disabled={loading}
          className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {loading ? '设置中...' : '设置密码并进入'}
        </button>
      </div>
    </div>
  );
}

/* ===== 登录 ===== */
function LoginView({ onLogin }: { onLogin: (pwd: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await initCloudBase();
      const config = await getAdminConfig();
      if (!config?.password_hash) {
        setError('管理员配置异常，请清除数据库 admin_config 文档后重试');
        return;
      }
      const h = await hashPassword(password);
      if (h === config.password_hash) {
        onLogin(password);
      } else {
        setError('密码错误');
      }
    } catch (e: any) {
      setError(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">管理后台</h1>
      <p className="text-gray-500 text-sm mb-6">请输入管理密码</p>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <input
          type="password"
          className={FIELD_CLASSES + ' mb-4'}
          placeholder="管理密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {loading ? '验证中...' : '登录'}
        </button>
        {error && <p className="mt-4 text-sm text-center text-red-500">{error}</p>}
      </div>
    </div>
  );
}

/* ===== 主面板 ===== */
const STATUS_COLORS: Record<string, string> = {
  申请: 'bg-yellow-100 text-yellow-800',
  待处理: 'bg-blue-100 text-blue-800',
  处理中: 'bg-purple-100 text-purple-800',
  已寄出: 'bg-green-100 text-green-800',
  已妥收: 'bg-gray-100 text-gray-600',
};

function Dashboard() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const pageSize = 15;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAllRequests({
        status: statusFilter || undefined,
        card_type: typeFilter || undefined,
        page,
        pageSize,
      });
      setList(res.list);
      setTotal(res.total);
    } catch (e: any) {
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statusFilter, typeFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      await updateRequestStatus(id, newStatus);
      setList((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
      );
    } catch (e: any) {
      alert('更新失败: ' + (e.message || e));
    } finally {
      setUpdating(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">管理后台</h1>
      <p className="text-gray-500 text-sm mb-6">
        共 {total} 条记录
      </p>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white"
        >
          <option value="">全部状态</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white"
        >
          <option value="">全部类型</option>
          {CARD_TYPES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button
          onClick={fetchData}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
        >
          刷新
        </button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">暂无记录</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {list.map((item: any) => (
              <div key={item._id} className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.from_call} → {item.to_call}
                    <span className="ml-2 text-xs text-gray-400">
                      [{CARD_TYPES.find((c) => c.value === item.card_type)?.label || item.card_type}]
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    <span className="font-mono">{item._id?.slice(-8)}</span>
                    <span className="mx-1">·</span>
                    {new Date(item.created_at).toLocaleString('zh-CN')}
                    {item.card_type === 'QSL' && (
                      <span> · {item.freq} {item.mode} RST {item.rst_sent}/{item.rst_rcvd}</span>
                    )}
                    {item.card_type === 'EYEBALL' && <span> · {item.eyeball_event}</span>}
                    {item.card_type === 'SWL' && <span> · {item.swl_freq}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || ''}`}>
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                  <select
                    value={item.status}
                    disabled={updating === item._id}
                    onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 bg-white disabled:opacity-50"
                  >
                    <option value={item.status}>操作</option>
                    {STATUS_ORDER.filter((s) => s !== item.status).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 disabled:opacity-30 hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="text-xs text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 disabled:opacity-30 hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ===== 入口 ===== */
export default function Admin() {
  const [step, setStep] = useState<'loading' | 'setup' | 'login' | 'dashboard'>('loading');
  const [_plainPwd, setPlainPwd] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await initCloudBase();
        const config = await getAdminConfig();
        if (!config?.password_hash) {
          setStep('setup');
        } else {
          setStep('login');
        }
      } catch {
        setStep('login');
      }
    })();
  }, []);

  if (step === 'loading') {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-sm">初始化中...</p>
      </div>
    );
  }

  if (step === 'setup') return <SetupView onDone={() => setStep('login')} />;
  if (step === 'login')
    return (
      <LoginView
        onLogin={(pwd) => {
          setPlainPwd(pwd);
          setStep('dashboard');
        }}
      />
    );
  return <Dashboard />;
}
