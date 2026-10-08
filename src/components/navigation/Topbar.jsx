import { NavLink } from 'react-router-dom';
import { BarChart2, BookOpen, Building, Building2, CalendarOff, Plug, Zap, FileText, LifeBuoy, LogOut, MessageSquare, MessageSquareText, ScrollText, Settings2, Sparkles, User as UserIcon, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import Dropdown, { menuItem } from '../common/Dropdown';
import NotificationBell from './NotificationBell';
import { useT } from '../../context/PreferencesContext';
import { LanguageSelect, ThemeToggle } from '../common/PreferenceControls';

const DEMO_USERS = [
  { label: 'Admin', email: 'admin@deskflow.com' },
  { label: 'Lead', email: 'lead@deskflow.com' },
  { label: 'Agent', email: 'agent.sarah@deskflow.com' },
  { label: 'Customer', email: 'rahul@acme.com' },
];
const SWITCHER_ON = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_SWITCHER === 'true';

const tab = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
  }`;

const btn = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800';

export default function Topbar() {
  const { user, permissions, logout, login } = useAuth();
  const t = useT();

  // Secondary screens live in one "Manage" menu so the bar stays short.
  const manage = [
    permissions.manage_routing && { to: '/staff/team', icon: Users, text: 'Team' },
    permissions.manage_routing && { to: '/staff/kb', icon: BookOpen, text: 'Help articles' },
    permissions.manage_settings && { to: '/staff/integrations', icon: Plug, text: 'Integrations' },
    permissions.manage_settings && { to: '/staff/automation', icon: Zap, text: 'Automation' },
    permissions.manage_settings && { to: '/staff/organizations', icon: Building, text: 'Organizations' },
    permissions.manage_settings && { to: '/staff/departments', icon: Building2, text: 'Departments' },
    permissions.manage_settings && { to: '/staff/holidays', icon: CalendarOff, text: 'Holidays' },
    permissions.edit_sla_policies && { to: '/staff/policies', icon: FileText, text: 'SLA policies' },
    permissions.manage_settings && { to: '/staff/ai', icon: Sparkles, text: 'AI assistant' },
    permissions.manage_settings && { to: '/staff/audit', icon: ScrollText, text: 'Audit log' },
  ].filter(Boolean);

  return (
    <header className="staff-topbar bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <NavLink to="/staff" end className="flex items-center gap-2.5 shrink-0" aria-label="DeskFlow home">
            <span className="bg-indigo-600 p-1.5 rounded-lg"><LifeBuoy className="w-4 h-4" /></span>
            <span className="font-bold tracking-wide hidden sm:inline">DeskFlow</span>
          </NavLink>

          <nav className="flex items-center gap-1" aria-label="Main">
            <NavLink to="/staff" end className={tab}><MessageSquare className="w-4 h-4" /><span className="hidden md:inline">{t('nav.tickets')}</span></NavLink>
            {permissions.view_analytics && <NavLink to="/staff/analytics" className={tab}><BarChart2 className="w-4 h-4" /><span className="hidden md:inline">{t('nav.analytics')}</span></NavLink>}
            <NavLink to="/staff/canned" className={tab}><MessageSquareText className="w-4 h-4" /><span className="hidden md:inline">{t('nav.replies')}</span></NavLink>
            {manage.length > 0 && (
              <Dropdown label={<span className="hidden md:inline">{t('nav.manage')}</span>} icon={Settings2} buttonClass={btn}>
                {manage.map(({ to, icon: Icon, text }) => (
                  <NavLink key={to} to={to} role="menuitem" className={({ isActive }) => `${menuItem} ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : ''}`}>
                    <Icon className="w-4 h-4 text-slate-400" />{text}
                  </NavLink>
                ))}
              </Dropdown>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <LanguageSelect onDark />
          <ThemeToggle onDark />
          <NotificationBell basePath="/staff" dark />
          <Dropdown
            align="right"
            buttonClass="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg hover:bg-slate-800 text-sm"
            label={<span className="hidden sm:inline max-w-32 truncate font-medium">{user.name}</span>}
            icon={() => <Avatar user={user} size={28} />}
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <Avatar user={user} size={40} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase text-[10px] font-bold">{user.role}</span>
              </div>
            </div>
            <NavLink to="/staff/account" role="menuitem" className={menuItem}><UserIcon className="w-4 h-4 text-slate-400" />My account</NavLink>
            <NavLink to="/help" role="menuitem" className={menuItem}><BookOpen className="w-4 h-4 text-slate-400" />Help center</NavLink>
            {SWITCHER_ON && (
              <div className="border-t border-slate-100 mt-1 pt-1">
                <div className="px-4 py-1 text-[10px] uppercase tracking-wide text-slate-400">Demo: switch account</div>
                {DEMO_USERS.filter((u) => u.email !== user.email).map((u) => (
                  <button key={u.email} role="menuitem" onClick={() => login(u.email, 'password123')} className={menuItem}>{u.label}</button>
                ))}
              </div>
            )}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button role="menuitem" onClick={logout} className={`${menuItem} text-rose-600`}><LogOut className="w-4 h-4" />{t('nav.signOut')}</button>
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
