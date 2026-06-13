import { Outlet, Navigate } from 'react-router-dom';
import StaffSidebar from '../components/staff/StaffSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import { useAuth } from '../context/AuthContext';

export default function StaffLayout() {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  if (!user || !user.roleNames?.includes('Staff')) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StaffSidebar />
      <div className="flex-1 flex flex-col ml-60">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
