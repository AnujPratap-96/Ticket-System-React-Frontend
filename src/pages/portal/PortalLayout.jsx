import { Link, NavLink, Outlet } from 'react-router-dom';
import { LifeBuoy, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import { useT } from '../../context/PreferencesContext';
import { LanguageSelect, ThemeToggle } from '../../components/common/PreferenceControls';
import NotificationBell from '../../components/navigation/NotificationBell';

const link = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium border-b-2 ${isActive ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`;

/** Customer-facing shell: light, minimal, no staff controls. */
export default function PortalLayout() {
  const { user, logout } = useAuth();
  const t = useT();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Link to="/portal" className="flex items-center gap-2 font-bold text-slate-900 shrink-0" aria-label="Support Center home"><LifeBuoy className="w-5 h-5 text-indigo-600" /><span>DeskFlow<span className="hidden sm:inline"> Support</span></span></Link>
            <nav className="hidden sm:flex" aria-label="Customer">
              <NavLink to="/portal" end className={link}>{t('nav.myTickets')}</NavLink>
              <NavLink to="/portal/new" className={link}>{t('nav.createTicket')}</NavLink>
              <a href="/help" className="px-3 py-2 text-sm font-medium border-b-2 border-transparent text-slate-600 hover:text-slate-900">{t('nav.helpCenter')}</a>
              <NavLink to="/portal/sla" className={link}>{t('nav.supportPlan')}</NavLink>
              <NavLink to="/portal/account" className={link}>{t('nav.myAccount')}</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sm text-slate-600 shrink-0">
            <div className="hidden sm:block"><LanguageSelect /></div>
            <ThemeToggle />
            <NotificationBell basePath="/portal" />
            <Avatar user={user} size={28} />
            <span className="hidden sm:inline max-w-28 truncate">{user.name}</span>
            <button onClick={logout} aria-label="Log out" className="p-1.5 rounded hover:bg-slate-100"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
        {/* Phones: the links sit on their own scrollable row instead of overflowing the screen */}
        <nav className="sm:hidden flex items-center overflow-x-auto border-t border-slate-100 px-2 py-0.5 whitespace-nowrap text-xs" aria-label="Customer (mobile)">
          <NavLink to="/portal" end className={link}>{t('nav.myTickets')}</NavLink>
          <NavLink to="/portal/new" className={link}>{t('nav.createTicket')}</NavLink>
          <a href="/help" className="px-3 py-2 text-sm font-medium border-b-2 border-transparent text-slate-600 hover:text-slate-900">{t('nav.helpCenter')}</a>
          <NavLink to="/portal/sla" className={link}>{t('nav.supportPlan')}</NavLink>
          <NavLink to="/portal/account" className={link}>{t('nav.myAccount')}</NavLink>
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8"><Outlet /></main>
    </div>
  );
}
