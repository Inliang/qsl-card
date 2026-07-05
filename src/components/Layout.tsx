import { Outlet, NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: '申请', icon: '✉' },
  { to: '/status', label: '查询', icon: '🔍' },
  { to: '/confirm', label: '妥收', icon: '✅' },
  { to: '/admin', label: '管理', icon: '⚙' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 桌面端顶部导航 */}
      <header className="hidden md:flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 shadow-sm">
        <NavLink to="/" className="text-lg font-bold tracking-tight text-gray-900">
          QSL 卡片交换
        </NavLink>
        <nav className="flex gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* 主内容 */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 md:py-10">
        <Outlet />
      </main>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 text-xs font-medium ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
