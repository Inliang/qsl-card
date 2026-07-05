import { useState } from 'react';
import { confirmReceived, initCloudBase } from '../lib/cloudbase';

export default function Confirm() {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  const handleConfirm = async () => {
    if (!id.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      await initCloudBase();
      await confirmReceived(id.trim());
      setOk(true);
      setMsg('妥收确认成功！');
    } catch (err: any) {
      setOk(false);
      setMsg(`确认失败：${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">确认妥收</h1>
      <p className="text-gray-500 text-sm mb-6">收到卡片后，在此确认妥收</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">申请编号</label>
        <input
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none mb-4"
          placeholder="输入你收到的申请编号"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
        >
          {loading ? '确认中...' : '确认妥收'}
        </button>
        {msg && (
          <p className={`mt-4 text-sm text-center ${ok ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
        )}
      </div>
    </div>
  );
}
