import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { QSLRequest } from '../types';
import { STATUS_LABELS, CARD_TYPES } from '../types';
import { queryRequests, initCloudBase } from '../lib/cloudbase';

const STATUS_COLORS: Record<string, string> = {
  申请: 'bg-yellow-100 text-yellow-800',
  待处理: 'bg-blue-100 text-blue-800',
  处理中: 'bg-purple-100 text-purple-800',
  已寄出: 'bg-green-100 text-green-800',
  已妥收: 'bg-gray-100 text-gray-600',
};

const STATUS_ORDER = ['申请', '待处理', '处理中', '已寄出', '已妥收'];

function ProgressBar({ status }: { status: string }) {
  const idx = STATUS_ORDER.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-2">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= idx;
        return (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                done ? (i === idx ? 'bg-indigo-500 ring-2 ring-indigo-200' : 'bg-green-400') : 'bg-gray-200'
              }`}
            />
            {i < STATUS_ORDER.length - 1 && (
              <div className={`w-6 h-0.5 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || ''}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function Status() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [mode, setMode] = useState<'id' | 'call'>(initialQ ? 'id' : 'call');
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<QSLRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQ) {
      setQuery(initialQ);
      handleQueryWith(initialQ, 'id');
    }
  }, [initialQ]);

  const handleQueryWith = async (q: string, m: 'id' | 'call') => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      await initCloudBase();
      const data = await queryRequests(m === 'id' ? { id: q.trim() } : { call: q.trim().toUpperCase() });
      setResults(data as QSLRequest[]);
    } catch (err: any) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = () => handleQueryWith(query, mode);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">状态查询</h1>
      <p className="text-gray-500 text-sm mb-6">输入申请编号或呼号查询卡片处理进度</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('id')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'id' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            按编号
          </button>
          <button
            onClick={() => setMode('call')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'call' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            按呼号
          </button>
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

      {/* 空状态 */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-400 text-sm">未找到相关记录</p>
          <p className="text-gray-400 text-xs mt-1">请确认编号或呼号是否正确</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r: any) => (
            <div key={r._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">
                    {r._id?.slice(-8)}
                  </span>
                  <button
                    onClick={() => copyText(r._id)}
                    className="text-xs text-gray-400 hover:text-indigo-500 transition-colors"
                    title="复制编号"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="text-sm text-gray-900 font-medium mb-1">
                {r.from_call} → {r.to_call}
                <span className="ml-2 text-xs text-gray-400">
                  [{CARD_TYPES.find((c) => c.value === r.card_type)?.label || r.card_type}]
                </span>
              </div>

              {r.card_type === 'QSL' && (
                <div className="text-xs text-gray-500">
                  {r.qso_time && `${r.qso_time} · `}
                  {r.freq} · {r.mode} · RST {r.rst_sent}/{r.rst_rcvd}
                </div>
              )}
              {r.card_type === 'EYEBALL' && (
                <div className="text-xs text-gray-500">
                  {r.eyeball_time} · {r.eyeball_event}
                </div>
              )}
              {r.card_type === 'SWL' && (
                <div className="text-xs text-gray-500">
                  {r.swl_time} · {r.swl_freq} · SINPO {r.swl_sinpo_s}
                  {r.swl_sinpo_i}
                  {r.swl_sinpo_n}
                  {r.swl_sinpo_p}
                  {r.swl_sinpo_o}
                </div>
              )}

              <ProgressBar status={r.status} />

              <div className="text-xs text-gray-400 mt-2">
                申请于 {new Date(r.created_at).toLocaleString('zh-CN')}
                {r.confirmed_at && (
                  <span className="ml-2 text-green-500">
                    · 妥收于 {new Date(r.confirmed_at).toLocaleString('zh-CN')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
