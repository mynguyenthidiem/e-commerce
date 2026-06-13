import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    const result = await login(values.email, values.password);
    setLoading(false);
    if (result.ok) {
      if (result.roleNames?.includes('Admin')) navigate('/admin/dashboard');
      else if (result.roleNames?.includes('Staff')) navigate('/staff/orders');
      else navigate('/');
    } else {
      setError(result.message);
    }
  };

  const fillDemo = (email, password) => form.setFieldsValue({ email, password });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-[420px] shadow-xl rounded-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800">Đăng nhập</h2>
          <p className="text-gray-500 mt-1">Chào mừng trở lại!</p>
        </div>

        {error && <Alert message={error} type="error" showIcon className="mb-4" />}

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
            <Input prefix={<UserOutlined />} placeholder="Nhập email của bạn" />
          </Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} className="h-11 font-semibold">
            Đăng nhập
          </Button>
        </Form>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Tài khoản demo:</p>
          <div className="flex gap-2 flex-wrap">
            {[['admin@shop.com','123456','Admin'],['dinhvangiang@shop.com','123456','Staff'],['nguyenvanan@gmail.com','123456','Customer']].map(([email,pw,label]) => (
              <button key={label} onClick={() => fillDemo(email, pw)} className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors border border-blue-200">
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">Đăng ký ngay</Link>
        </p>
      </Card>
    </div>
  );
}
