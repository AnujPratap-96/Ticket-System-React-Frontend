import { Outlet } from 'react-router-dom';
import Topbar from '../../components/navigation/Topbar';

export default function StaffLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Topbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6"><Outlet /></main>
    </div>
  );
}
