import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Dropdown, Input } from 'antd';
import { ShoppingCartOutlined, UserOutlined, SearchOutlined, MenuOutlined } from '@ant-design/icons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCategories} from '../../context/CategoryContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { categories } = useCategories();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (value) => {
    if (value.trim()) navigate(`/products?q=${encodeURIComponent(value.trim())}`);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const userMenuItems = [
    ...(user?.roleNames?.includes('Admin') ? [{ key: 'admin', label: <Link to="/admin/dashboard">Admin Panel</Link> }] : []),
    ...(user?.roleNames?.includes('Staff') ? [{ key: 'staff', label: <Link to="/staff/orders">Staff Panel</Link> }] : []),
    { key: 'account', label: <Link to="/account">Tài khoản</Link> },
    { key: 'orders', label: <Link to="/orders">Đơn hàng</Link> },
    { key: 'support', label: <Link to="/support">Hỗ trợ</Link> },
    { type: 'divider' },
    { key: 'logout', label: <span className="text-red-500" onClick={handleLogout}>Đăng xuất</span> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b-2 border-blue-500">
      <div className="container">
        <div className="flex items-center gap-4 h-16">
          <Link to="/" className="flex items-center gap-1.5 text-blue-600 font-bold text-lg flex-shrink-0">
            🛒 <span>TechShop</span>
          </Link>

          <div className="flex-1 max-w-xl">
            <Input.Search
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onSearch={handleSearch}
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
            />
          </div>

          <div className="flex items-center gap-3">
            <Link to="/cart">
              <Badge count={totalItems} size="small">
                <ShoppingCartOutlined className="text-2xl text-gray-600 hover:text-blue-600 transition-colors" />
              </Badge>
            </Link>

            {user && <NotificationBell />}

            {user ? (
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                <button className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {user.name?.[0] ?? '?'}
                  </div>
                  <span className="hide-mobile">{user.name?.split(' ').slice(-1)[0]}</span>
                </button>
              </Dropdown>
            ) : (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
                Đăng nhập
              </Link>
            )}

            <button
              className="p-1.5 text-gray-600 hover:text-blue-600 transition-colors md:hidden"
              onClick={() => setMenuOpen(p => !p)}
            >
              <MenuOutlined />
            </button>
          </div>
        </div>

        <nav className={`pb-2 flex gap-4 overflow-x-auto text-sm border-t border-blue-50 pt-2 ${menuOpen ? 'flex' : 'hidden md:flex'}`}>
          <Link to="/products" className="text-gray-600 hover:text-blue-600 whitespace-nowrap transition-colors">
            Tất cả sản phẩm
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.name}`}
              className="text-gray-600 hover:text-blue-600 whitespace-nowrap transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
