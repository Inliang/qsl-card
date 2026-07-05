import { useState } from 'react';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    // 简易密码验证 — 生产环境应使用 CloudBase 认证
    if (password === 'admin123') {
      setAuthed(true);
      setError('');
    } else {
      setError('密码错误');
    }
  };

  if (!authed) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">管理后台</h1>
        <p className="text-gray-500 text-sm mb-6">请输入管理密码</p>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <input
            type="password"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none mb-4"
            placeholder="管理密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all shadow-sm"
          >
            登录
          </button>
          {error && <p className="mt-4 text-sm text-center text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">管理后台</h1>
      <p className="text-gray-500 text-sm mb-6">
        卡片管理面板 — 连接 CloudBase 后展示实时数据
      </p>

      {/* 占位列表 */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {[
          { id: 'a1b2c3d4', type: 'QSL', from: 'BG1AAA', to: 'BG2BBB', status: '待处理', time: '2026-07-01 14:30' },
          { id: 'e5f6g7h8', type: 'EYEBALL', from: 'BG3CCC', to: 'BG4DDD', status: '已寄出', time: '2026-07-02 09:15' },
          { id: 'i9j0k1l2', type: 'SWL', from: 'SWL-001', to: 'BG5EEE', status: '已妥收', time: '2026-07-03 18:00' },
        ].map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {item.from} → {item.to}
                <span className="ml-2 text-xs text-gray-400">[{item.type}]</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{item.id} · {item.time}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                item.status === '已妥收' ? 'bg-gray-100 text-gray-600'
                : item.status === '已寄出' ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
              }`}>{item.status}</span>
              <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600">
                <option>操作</option>
                <option>标记处理中</option>
                <option>标记已寄出</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
