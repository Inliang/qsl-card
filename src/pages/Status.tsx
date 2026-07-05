import { useState } from 'react';
import type { QSLRequest } from '../types';
import { STATUS_LABELS, CARD_TYPES } from '../types';
import { queryRequests, initCloudBase } from '../lib/cloudbase';

const STATUS_COLORS: Record<string, string> = {
  '申请': 'bg-yellow-100 text-yellow-800',
  '待处理': 'bg-blue-100 text-blue-800',
  '处理中': 'bg-purple-100 text-purple-800',
  '已寄出': 'bg-green-100 text-green-800',
  '已妥收': 'bg-gray-100 text-gray-600',
};

export default function Status() {
  const [mode, setMode] = useState<'id' | 'call'>('id');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QSLRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      await initCloudBase();
      const data = await queryRequests(mode === 'id' ? { id: query.trim() } : { call: query.trim().toUpperCase() });
      setResults(data as QSLRequest[]);
      if (data.length === 0) setError('未找到相关记录');
    } catch (err: any) {
      setError(err.message || '查询失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">状态查询</h1>
      <p className="text-gray-500 text-sm mb-6">输入申请编号或呼号查询卡片处理进度</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('id')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'id' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >按编号</button>
          <button
            onClick={() => setMode('call')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'call' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >按呼号</button>
        </div>
        <div className="flex gap-3">
          <input
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            placeholder={mode === 'id' ? '输入申请编号' : '输入呼号，如 BG1XXX'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            onClick={handleQuery}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {loading ? '查询中...' : '查询'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r: any) => (
            <div key={r._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-mono">{r._id?.slice(-8)}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || ''}`}>
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
              <div className="text-sm text-gray-900 font-medium">
                {r.from_call} → {r.to_call}
                <span className="ml-2 text-xs text-gray-400">
                  [{CARD_TYPES.find((c) => c.value === r.card_type)?.label || r.card_type}]
                </span>
              </div>
              {r.card_type === 'QSL' && (
                <div className="text-xs text-gray-500 mt-1">
                  {r.qso_time && `${r.qso_time} · `}{r.freq} · {r.mode} · RST {r.rst_sent}/{r.rst_rcvd}
                </div>
              )}
              {r.card_type === 'EYEBALL' && (
                <div className="text-xs text-gray-500 mt-1">
                  {r.eyeball_time} · {r.eyeball_event}
                </div>
              )}
              {r.card_type === 'SWL' && (
                <div className="text-xs text-gray-500 mt-1">
                  {r.swl_time} · {r.swl_freq} · SINPO {r.swl_sinpo_s}{r.swl_sinpo_i}{r.swl_sinpo_n}{r.swl_sinpo_p}{r.swl_sinpo_o}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                申请于 {new Date(r.created_at).toLocaleString('zh-CN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
