import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCartOutlined, MessageOutlined, InboxOutlined, HomeOutlined, LogoutOutlined } from '@ant-design/icons';

const NAV = [
  { to: '/staff/orders', icon: <ShoppingCartOutlined />, label: 'Xử lý đơn hàng' },
  { to: '/staff/support', icon: <MessageOutlined />, label: 'Hỗ trợ khách hàng' },
  { to: '/staff/inventory', icon: <InboxOutlined />, label: 'Quản lý kho' },
];

export default function StaffSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="w-60 min-h-screen bg-gray-900 fixed left-0 top-0 z-50 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <span className="text-2xl">🛒</span>
        <div>
          <p className="text-white font-bold text-base leading-tight">TechShop</p>
          <p className="text-gray-400 text-xs">Staff Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-gray-400 text-xs">Staff</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2 !text-white text-sm py-1.5 px-2 rounded hover:bg-gray-700 transition-colors mb-1"
        >
          <HomeOutlined /> Trang chủ
        </button>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-2 !text-red-400 hover:text-red-300 text-sm py-1.5 px-2 rounded hover:bg-gray-800 transition-colors"
        >
          <LogoutOutlined /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}
