export interface QSLRequest {
  _id?: string;
  card_type: 'QSL' | 'EYEBALL' | 'SWL';
  status: '申请' | '待处理' | '处理中' | '已寄出' | '已妥收';
  from_call: string;
  to_call: string;
  created_at: number;
  updated_at: number;
  // QSL
  qso_time?: string;
  freq?: string;
  mode?: string;
  rst_sent?: number;
  rst_rcvd?: number;
  rst_tone?: number;
  // EYEBALL
  eyeball_time?: string;
  eyeball_event?: string;
  // SWL
  swl_time?: string;
  swl_freq?: string;
  swl_sinpo_s?: number;
  swl_sinpo_i?: number;
  swl_sinpo_n?: number;
  swl_sinpo_p?: number;
  swl_sinpo_o?: number;
  // 管理
  handled_by?: string;
  shipped_at?: number;
  confirmed_at?: number;
}

export const CARD_TYPES = [
  { value: 'QSL' as const, label: '通联卡 QSL', desc: '双方通联确认卡片' },
  { value: 'EYEBALL' as const, label: '眼球卡 EYEBALL', desc: '线下 eyeball QSO 面基确认' },
  { value: 'SWL' as const, label: '收听卡 SWL', desc: '收听方发出的接收报告' },
];

export const STATUS_LABELS: Record<string, string> = {
  '申请': '已申请',
  '待处理': '待处理',
  '处理中': '处理中',
  '已寄出': '已寄出',
  '已妥收': '已妥收',
};

export const MODES = ['SSB', 'CW', 'FT8', 'FT4', 'RTTY', 'AM', 'FM', 'DMR', '其他'];
