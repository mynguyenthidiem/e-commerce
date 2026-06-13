import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardOutlined, AppstoreOutlined, ShoppingCartOutlined,
  TeamOutlined, TagOutlined, GiftOutlined, BarChartOutlined,
  CreditCardOutlined, UserAddOutlined, HomeOutlined, LogoutOutlined,
} from '@ant-design/icons';

const NAV = [
  { to: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { to: '/admin/products', icon: <AppstoreOutlined />, label: 'Sản phẩm' },
  { to: '/admin/orders', icon: <ShoppingCartOutlined />, label: 'Đơn hàng' },
  { to: '/admin/customers', icon: <TeamOutlined />, label: 'Khách hàng' },
  { to: '/admin/categories', icon: <TagOutlined />, label: 'Danh mục' },
  { to: '/admin/promotions', icon: <GiftOutlined />, label: 'Khuyến mãi' },
  { to: '/admin/reports', icon: <BarChartOutlined />, label: 'Báo cáo' },
  { to: '/admin/payment-methods', icon: <CreditCardOutlined />, label: 'Thanh toán' },
  { to: '/admin/staff', icon: <UserAddOutlined />, label: 'Nhân viên' },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="w-60 h-screen bg-gray-900 fixed left-0 top-0 z-50 flex flex-col overflow-y-auto">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <span className="text-2xl">🛒</span>
        <div>
          <p className="text-white font-bold text-base leading-tight">TechShop</p>
          <p className="text-gray-400 text-xs">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 ">
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

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-gray-400 text-xs">Administrator</p>
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
