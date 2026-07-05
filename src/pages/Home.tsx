import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CARD_TYPES, MODES } from '../types';
import { submitRequest } from '../lib/cloudbase';
import Modal from '../components/Modal';

const FIELD_CLASSES =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white';
const LABEL_CLASSES = 'block text-sm font-medium text-gray-700 mb-1';
const ERR_CLASSES = 'text-xs text-red-500 mt-0.5';

const CALL_RE = /^[A-Z0-9]{2,3}[0-9]{1,3}[A-Z]{1,4}$/i;

function validateCall(s: string): string | null {
  if (!s.trim()) return '不能为空';
  if (!CALL_RE.test(s)) return '呼号格式不正确（如 BG1XXX）';
  return null;
}

function validateNum(v: number, min: number, max: number): string | null {
  if (isNaN(v) || v < min || v > max) return `请输入 ${min}~${max}`;
  return null;
}

export default function Home() {
  const navigate = useNavigate();
  const [cardType, setCardType] = useState<'QSL' | 'EYEBALL' | 'SWL'>('QSL');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successId, setSuccessId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const [form, setForm] = useState({
    from_call: '',
    to_call: '',
    qso_time: '',
    freq: '',
    mode: 'SSB',
    rst_sent: 59,
    rst_rcvd: 59,
    rst_tone: 1,
    eyeball_time: '',
    eyeball_event: '',
    swl_time: '',
    swl_freq: '',
    swl_sinpo_s: 4,
    swl_sinpo_i: 4,
    swl_sinpo_n: 4,
    swl_sinpo_p: 4,
    swl_sinpo_o: 4,
  });

  const update = (k: string, v: any) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const fc = validateCall(form.from_call);
    if (fc) e.from_call = fc;
    const tc = validateCall(form.to_call);
    if (tc) e.to_call = tc;

    if (cardType === 'QSL') {
      if (!form.qso_time) e.qso_time = '请选择通联时间';
      if (!form.freq.trim()) e.freq = '请输入频率';
      const rs = validateNum(form.rst_sent, 1, 9);
      if (rs) e.rst_sent = 'R ' + rs;
      const rr = validateNum(form.rst_rcvd, 1, 9);
      if (rr) e.rst_rcvd = 'S ' + rr;
      const rt = validateNum(form.rst_tone, 1, 9);
      if (rt) e.rst_tone = 'T ' + rt;
    } else if (cardType === 'EYEBALL') {
      if (!form.eyeball_time) e.eyeball_time = '请选择见面时间';
      if (!form.eyeball_event.trim()) e.eyeball_event = '请输入活动名称/地点';
    } else if (cardType === 'SWL') {
      if (!form.swl_time) e.swl_time = '请选择收听时间';
      if (!form.swl_freq.trim()) e.swl_freq = '请输入频率';
      ['S', 'I', 'N', 'P', 'O'].forEach((ch, i) => {
        const keys = ['swl_sinpo_s', 'swl_sinpo_i', 'swl_sinpo_n', 'swl_sinpo_p', 'swl_sinpo_o'];
        const ve = validateNum((form as any)[keys[i]], 1, 5);
        if (ve) e[keys[i]] = `${ch} ${ve}`;
      });
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildData = () => {
    const data: any = {
      card_type: cardType,
      from_call: form.from_call.toUpperCase(),
      to_call: form.to_call.toUpperCase(),
    };
    if (cardType === 'QSL')
      Object.assign(data, {
        qso_time: form.qso_time,
        freq: form.freq,
        mode: form.mode,
        rst_sent: form.rst_sent,
        rst_rcvd: form.rst_rcvd,
        rst_tone: form.rst_tone,
      });
    if (cardType === 'EYEBALL')
      Object.assign(data, { eyeball_time: form.eyeball_time, eyeball_event: form.eyeball_event });
    if (cardType === 'SWL')
      Object.assign(data, {
        swl_time: form.swl_time,
        swl_freq: form.swl_freq,
        swl_sinpo_s: form.swl_sinpo_s,
        swl_sinpo_i: form.swl_sinpo_i,
        swl_sinpo_n: form.swl_sinpo_n,
        swl_sinpo_p: form.swl_sinpo_p,
        swl_sinpo_o: form.swl_sinpo_o,
      });
    return data;
  };

  const handlePreview = () => {
    if (!validate()) {
      formRef.current
        ?.querySelector('[data-error]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await submitRequest(buildData());
      setShowPreview(false);
      setSuccessId(res.id);
      setShowSuccess(true);
    } catch (err: any) {
      alert(`提交失败：${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      const el = document.getElementById('copy-btn');
      if (el) {
        el.textContent = '已复制!';
        setTimeout(() => (el.textContent = '复制编号'), 2000);
      }
    });
  };

  const previewData = buildData();

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

      <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-5">
        {/* 通用字段 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASSES}>
              己方呼号 <span className="text-red-500">*</span>
            </label>
            <input
              className={FIELD_CLASSES}
              value={form.from_call}
              onChange={(e) => update('from_call', e.target.value.toUpperCase())}
              placeholder="如 BG1XXX"
            />
            {errors.from_call && <p className={ERR_CLASSES}>{errors.from_call}</p>}
          </div>
          <div>
            <label className={LABEL_CLASSES}>
              对方呼号 <span className="text-red-500">*</span>
            </label>
            <input
              className={FIELD_CLASSES}
              value={form.to_call}
              onChange={(e) => update('to_call', e.target.value.toUpperCase())}
              placeholder="如 BG2XXX"
            />
            {errors.to_call && <p className={ERR_CLASSES}>{errors.to_call}</p>}
          </div>
        </div>

        {/* QSL 字段 */}
        {cardType === 'QSL' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4" data-error="qso_time">
            <h3 className="text-sm font-semibold text-gray-800">通联信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>
                  通联时间 <span className="text-red-500">*</span>
                </label>
                <input
                  className={FIELD_CLASSES}
                  type="datetime-local"
                  value={form.qso_time}
                  onChange={(e) => update('qso_time', e.target.value)}
                />
                {errors.qso_time && <p className={ERR_CLASSES}>{errors.qso_time}</p>}
              </div>
              <div>
                <label className={LABEL_CLASSES}>
                  频率 <span className="text-red-500">*</span>
                </label>
                <input
                  className={FIELD_CLASSES}
                  value={form.freq}
                  onChange={(e) => update('freq', e.target.value)}
                  placeholder="如 14.270MHz"
                />
                {errors.freq && <p className={ERR_CLASSES}>{errors.freq}</p>}
              </div>
              <div>
                <label className={LABEL_CLASSES}>模式</label>
                <select className={FIELD_CLASSES} value={form.mode} onChange={(e) => update('mode', e.target.value)}>
                  {MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['rst_sent', 'rst_rcvd', 'rst_tone'].map((k, i) => (
                <div key={k}>
                  <label className={LABEL_CLASSES}>RST {['R', 'S', 'T'][i]}</label>
                  <input
                    className={FIELD_CLASSES}
                    type="number"
                    min={1}
                    max={9}
                    value={(form as any)[k]}
                    onChange={(e) => update(k, +e.target.value)}
                  />
                  {errors[k] && <p className={ERR_CLASSES}>{errors[k]}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EYEBALL 字段 */}
        {cardType === 'EYEBALL' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4" data-error="eyeball_time">
            <h3 className="text-sm font-semibold text-gray-800">眼球 QSO 信息</h3>
            <div>
              <label className={LABEL_CLASSES}>
                见面时间 <span className="text-red-500">*</span>
              </label>
              <input
                className={FIELD_CLASSES}
                type="datetime-local"
                value={form.eyeball_time}
                onChange={(e) => update('eyeball_time', e.target.value)}
              />
              {errors.eyeball_time && <p className={ERR_CLASSES}>{errors.eyeball_time}</p>}
            </div>
            <div>
              <label className={LABEL_CLASSES}>
                活动名称 / 地点 <span className="text-red-500">*</span>
              </label>
              <input
                className={FIELD_CLASSES}
                value={form.eyeball_event}
                onChange={(e) => update('eyeball_event', e.target.value)}
                placeholder="如 2026 北京业余无线电节 / 国家会议中心"
              />
              {errors.eyeball_event && <p className={ERR_CLASSES}>{errors.eyeball_event}</p>}
            </div>
          </div>
        )}

        {/* SWL 字段 */}
        {cardType === 'SWL' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4" data-error="swl_time">
            <h3 className="text-sm font-semibold text-gray-800">收听信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>
                  收听时间 <span className="text-red-500">*</span>
                </label>
                <input
                  className={FIELD_CLASSES}
                  type="datetime-local"
                  value={form.swl_time}
                  onChange={(e) => update('swl_time', e.target.value)}
                />
                {errors.swl_time && <p className={ERR_CLASSES}>{errors.swl_time}</p>}
              </div>
              <div>
                <label className={LABEL_CLASSES}>
                  频率 <span className="text-red-500">*</span>
                </label>
                <input
                  className={FIELD_CLASSES}
                  value={form.swl_freq}
                  onChange={(e) => update('swl_freq', e.target.value)}
                  placeholder="如 7.050MHz"
                />
                {errors.swl_freq && <p className={ERR_CLASSES}>{errors.swl_freq}</p>}
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
                      <input
                        className={FIELD_CLASSES + ' text-center'}
                        type="number"
                        min={1}
                        max={5}
                        value={(form as any)[keys[i]]}
                        onChange={(e) => update(keys[i], +e.target.value)}
                      />
                      {errors[keys[i]] && <p className={`${ERR_CLASSES} text-center`}>{errors[keys[i]]}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handlePreview}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
        >
          {loading ? '提交中...' : '预览并提交'}
        </button>
      </form>

      {/* 预览弹窗 */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="预览申请">
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <p>
            <span className="text-gray-500">卡片类型：</span>
            <span className="font-medium">{CARD_TYPES.find((c) => c.value === cardType)?.label}</span>
          </p>
          <p>
            <span className="text-gray-500">发起方：</span>
            <span className="font-medium">{previewData.from_call}</span>
          </p>
          <p>
            <span className="text-gray-500">对方：</span>
            <span className="font-medium">{previewData.to_call}</span>
          </p>
          {cardType === 'QSL' && (
            <>
              <p><span className="text-gray-500">通联时间：</span>{previewData.qso_time}</p>
              <p><span className="text-gray-500">频率：</span>{previewData.freq}</p>
              <p><span className="text-gray-500">模式：</span>{previewData.mode}</p>
              <p><span className="text-gray-500">RST：</span>{previewData.rst_sent}/{previewData.rst_rcvd} T={previewData.rst_tone}</p>
            </>
          )}
          {cardType === 'EYEBALL' && (
            <>
              <p><span className="text-gray-500">见面时间：</span>{previewData.eyeball_time}</p>
              <p><span className="text-gray-500">活动：</span>{previewData.eyeball_event}</p>
            </>
          )}
          {cardType === 'SWL' && (
            <>
              <p><span className="text-gray-500">收听时间：</span>{previewData.swl_time}</p>
              <p><span className="text-gray-500">频率：</span>{previewData.swl_freq}</p>
              <p>
                <span className="text-gray-500">SINPO：</span>
                {previewData.swl_sinpo_s}{previewData.swl_sinpo_i}{previewData.swl_sinpo_n}{previewData.swl_sinpo_p}{previewData.swl_sinpo_o}
              </p>
            </>
          )}
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setShowPreview(false)}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all"
          >
            修改
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {loading ? '提交中...' : '确认提交'}
          </button>
        </div>
      </Modal>

      {/* 成功弹窗 */}
      <Modal open={showSuccess} onClose={() => { setShowSuccess(false); navigate('/status'); }} title="提交成功">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-1">申请编号</p>
          <p className="text-lg font-bold font-mono text-gray-900 mb-4">{successId}</p>
          <div className="flex gap-3">
            <button
              id="copy-btn"
              onClick={() => copyToClipboard(successId)}
              className="flex-1 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition-all"
            >
              复制编号
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}#/status?q=${successId}`;
                navigator.clipboard.writeText(url);
              }}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-all"
            >
              复制查询链接
            </button>
          </div>
          <button
            onClick={() => { setShowSuccess(false); navigate('/status'); }}
            className="mt-3 w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-all"
          >
            前往查询
          </button>
        </div>
      </Modal>
    </div>
  );
}
