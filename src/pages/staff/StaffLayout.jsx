import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Topbar from '../../components/navigation/Topbar';
import { useAuth } from '../../context/AuthContext';

export default function StaffLayout() {
  const { twoFactorRequired } = useAuth();
  const { pathname } = useLocation();

  // The workspace requires two-factor and this person has none: the API refuses everything else, so send them to set it up.
  if (twoFactorRequired && pathname !== '/staff/account') return <Navigate to="/staff/account" replace />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Topbar />
      {twoFactorRequired && (
        <div role="alert" className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm px-4 py-2.5 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
          Your workspace requires two-factor authentication. Set it up below to continue.
        </div>
      )}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6"><Outlet /></main>
    </div>
  );
}
