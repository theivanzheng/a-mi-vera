import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminBottomNav from './AdminBottomNav';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-layout-main">
        <AdminHeader />
        <div className="admin-body">
          <Outlet />
        </div>
        <AdminBottomNav />
      </div>
    </div>
  );
}
