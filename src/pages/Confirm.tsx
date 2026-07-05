import { useState } from 'react';
import { confirmReceived, initCloudBase, queryRequests } from '../lib/cloudbase';
import { CARD_TYPES, STATUS_LABELS } from '../types';

export default function Confirm() {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'input' | 'preview' | 'result'>('input');

  const handleLookup = async () => {
    if (!id.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      await initCloudBase();
      const res = await queryRequests({ id: id.trim() });
      if (res.length === 0) {
        setMsg('未找到该申请');
        return;
      }
      const r = res[0] as any;
      if (r.status === '已妥收') {
        setMsg('该卡片已确认妥收');
        return;
      }
      setPreview(r);
      setStep('preview');
    } catch (err: any) {
      setMsg(err.message || '查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await initCloudBase();
      await confirmReceived(id.trim());
      setOk(true);
      setStep('result');
    } catch (err: any) {
      setOk(false);
      setMsg(`确认失败：${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setId('');
    setPreview(null);
    setNote('');
    setMsg('');
    setOk(false);
    setStep('input');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">确认妥收</h1>
      <p className="text-gray-500 text-sm mb-6">收到卡片后，在此确认妥收</p>

      {/* Step 1: 输入编号 */}
      {step === 'input' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">申请编号</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none mb-4"
            placeholder="输入你收到的申请编号"
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          />
          <button
            onClick={handleLookup}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? '查询中...' : '查询申请'}
          </button>
          {msg && <p className={`mt-4 text-sm text-center ${ok ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
        </div>
      )}

      {/* Step 2: 预览确认 */}
      {step === 'preview' && preview && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">请确认以下卡片信息</h3>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5">
            <p>
              <span className="text-gray-500">编号：</span>
              <span className="font-mono">{preview._id?.slice(-8)}</span>
            </p>
            <p>
              <span className="text-gray-500">类型：</span>
              <span className="font-medium">{CARD_TYPES.find((c: any) => c.value === preview.card_type)?.label}</span>
            </p>
            <p>
              <span className="text-gray-500">双方：</span>
              <span className="font-medium">{preview.from_call} → {preview.to_call}</span>
            </p>
            <p>
              <span className="text-gray-500">当前状态：</span>
              <span className="font-medium">{STATUS_LABELS[preview.status] || preview.status}</span>
            </p>
            {preview.card_type === 'QSL' && (
              <p>
                <span className="text-gray-500">详情：</span>
                {preview.qso_time} · {preview.freq} · {preview.mode} · RST {preview.rst_sent}/{preview.rst_rcvd}
              </p>
            )}
            {preview.card_type === 'EYEBALL' && (
              <p>
                <span className="text-gray-500">详情：</span>
                {preview.eyeball_time} · {preview.eyeball_event}
              </p>
            )}
            {preview.card_type === 'SWL' && (
              <p>
                <span className="text-gray-500">详情：</span>
                {preview.swl_time} · {preview.swl_freq} · SINPO {preview.swl_sinpo_s}{preview.swl_sinpo_i}{preview.swl_sinpo_n}{preview.swl_sinpo_p}{preview.swl_sinpo_o}
              </p>
            )}
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none mb-5 resize-none"
            rows={3}
            placeholder="如：卡片品相完好 / 有折痕等"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all"
            >
              返回
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {loading ? '确认中...' : '确认妥收'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 完成 */}
      {step === 'result' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">妥收确认成功</h3>
          <p className="text-sm text-gray-500 mb-1">编号 {id.slice(-8)}</p>
          <p className="text-xs text-gray-400">
            确认时间：{new Date().toLocaleString('zh-CN')}
          </p>
          <button
            onClick={reset}
            className="mt-5 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-all"
          >
            确认另一张
          </button>
        </div>
      )}
    </div>
  );
}
