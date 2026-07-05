import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CARD_TYPES, MODES } from '../types';
import { submitRequest } from '../lib/cloudbase';

const FIELD_CLASSES = 'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white';
const LABEL_CLASSES = 'block text-sm font-medium text-gray-700 mb-1';

export default function Home() {
  const navigate = useNavigate();
  const [cardType, setCardType] = useState<'QSL' | 'EYEBALL' | 'SWL'>('QSL');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    from_call: '', to_call: '',
    qso_time: '', freq: '', mode: 'SSB', rst_sent: 59, rst_rcvd: 59, rst_tone: 1,
    eyeball_time: '', eyeball_event: '',
    swl_time: '', swl_freq: '',
    swl_sinpo_s: 4, swl_sinpo_i: 4, swl_sinpo_n: 4, swl_sinpo_p: 4, swl_sinpo_o: 4,
  });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: any = { card_type: cardType, from_call: form.from_call, to_call: form.to_call };
      if (cardType === 'QSL') Object.assign(data, { qso_time: form.qso_time, freq: form.freq, mode: form.mode, rst_sent: form.rst_sent, rst_rcvd: form.rst_rcvd, rst_tone: form.rst_tone });
      if (cardType === 'EYEBALL') Object.assign(data, { eyeball_time: form.eyeball_time, eyeball_event: form.eyeball_event });
      if (cardType === 'SWL') Object.assign(data, { swl_time: form.swl_time, swl_freq: form.swl_freq, swl_sinpo_s: form.swl_sinpo_s, swl_sinpo_i: form.swl_sinpo_i, swl_sinpo_n: form.swl_sinpo_n, swl_sinpo_p: form.swl_sinpo_p, swl_sinpo_o: form.swl_sinpo_o });
      const res = await submitRequest(data);
      alert(`申请提交成功！编号：${res.id}`);
      navigate('/status');
    } catch (err: any) {
      alert(`提交失败：${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">QSL 卡片申请</h1>
      <p className="text-gray-500 text-sm mb-6">选择卡片类型，填写通联信息后提交</p>

      {/* 卡片类型选择 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {CARD_TYPES.map((ct) => (
          <button
            key={ct.value}
            onClick={() => setCardType(ct.value)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              cardType === ct.value
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="text-sm font-semibold text-gray-900">{ct.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{ct.desc}</div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 通用字段 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASSES}>己方呼号 <span className="text-red-500">*</span></label>
            <input className={FIELD_CLASSES} required value={form.from_call} onChange={(e) => update('from_call', e.target.value.toUpperCase())} placeholder="如 BG1XXX" />
          </div>
          <div>
            <label className={LABEL_CLASSES}>对方呼号 <span className="text-red-500">*</span></label>
            <input className={FIELD_CLASSES} required value={form.to_call} onChange={(e) => update('to_call', e.target.value.toUpperCase())} placeholder="如 BG2XXX" />
          </div>
        </div>

        {/* QSL 字段 */}
        {cardType === 'QSL' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">通联信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>通联时间</label>
                <input className={FIELD_CLASSES} type="datetime-local" value={form.qso_time} onChange={(e) => update('qso_time', e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLASSES}>频率</label>
                <input className={FIELD_CLASSES} value={form.freq} onChange={(e) => update('freq', e.target.value)} placeholder="如 14.270MHz" />
              </div>
              <div>
                <label className={LABEL_CLASSES}>模式</label>
                <select className={FIELD_CLASSES} value={form.mode} onChange={(e) => update('mode', e.target.value)}>
                  {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['rst_sent', 'rst_rcvd', 'rst_tone'].map((k, i) => (
                <div key={k}>
                  <label className={LABEL_CLASSES}>RST {['R', 'S', 'T'][i]}</label>
                  <input className={FIELD_CLASSES} type="number" min={1} max={9} value={(form as any)[k]} onChange={(e) => update(k, +e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EYEBALL 字段 */}
        {cardType === 'EYEBALL' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">眼球 QSO 信息</h3>
            <div>
              <label className={LABEL_CLASSES}>见面时间</label>
              <input className={FIELD_CLASSES} type="datetime-local" value={form.eyeball_time} onChange={(e) => update('eyeball_time', e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASSES}>活动名称 / 地点</label>
              <input className={FIELD_CLASSES} value={form.eyeball_event} onChange={(e) => update('eyeball_event', e.target.value)} placeholder="如 2026 北京业余无线电节 / 国家会议中心" />
            </div>
          </div>
        )}

        {/* SWL 字段 */}
        {cardType === 'SWL' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">收听信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>收听时间</label>
                <input className={FIELD_CLASSES} type="datetime-local" value={form.swl_time} onChange={(e) => update('swl_time', e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLASSES}>频率</label>
                <input className={FIELD_CLASSES} value={form.swl_freq} onChange={(e) => update('swl_freq', e.target.value)} placeholder="如 7.050MHz" />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASSES}>SINPO</label>
              <div className="grid grid-cols-5 gap-2">
                {['S', 'I', 'N', 'P', 'O'].map((ch, i) => {
                  const keys = ['swl_sinpo_s', 'swl_sinpo_i', 'swl_sinpo_n', 'swl_sinpo_p', 'swl_sinpo_o'];
                  return (
                    <div key={ch}>
                      <span className="block text-xs text-gray-500 text-center mb-1">{ch}</span>
                      <input className={FIELD_CLASSES + ' text-center'} type="number" min={1} max={5} value={(form as any)[keys[i]]} onChange={(e) => update(keys[i], +e.target.value)} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
        >
          {loading ? '提交中...' : '提交申请'}
        </button>
      </form>
    </div>
  );
}
