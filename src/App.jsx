import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PreferencesProvider } from './context/PreferencesContext';
import AssistantWidget from './components/assistant/AssistantWidget';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import AcceptInvitePage from './pages/auth/AcceptInvitePage';
import PortalLayout from './pages/portal/PortalLayout';
import PortalTicketsPage from './pages/portal/PortalTicketsPage';
import PortalNewTicketPage from './pages/portal/PortalNewTicketPage';
import PortalTicketPage from './pages/portal/PortalTicketPage';
import PortalSlaPage from './pages/portal/PortalSlaPage';
import AccountPage from './pages/account/AccountPage';
import WorkspacePage from './pages/workspace/WorkspacePage';
import StartWorkspacePage from './pages/workspace/StartWorkspacePage';
import PlatformLoginPage from './pages/platform/PlatformLoginPage';
import { ArticlePage, HelpCenterPage } from './pages/help/HelpPages';

// Staff console is a separate lazy chunk: customers never download it.
const PlatformPage = lazy(() => import('./pages/platform/PlatformPage'));
const StaffLayout = lazy(() => import('./pages/staff/StaffLayout'));
const TicketListPage = lazy(() => import('./pages/tickets/TicketListPage'));
const TicketDetailPage = lazy(() => import('./pages/tickets/TicketDetailPage'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
const PolicyManager = lazy(() => import('./pages/admin/PolicyManager'));
const CannedResponsesPage = lazy(() => import('./pages/admin/CannedResponsesPage'));
const AuditLogPage = lazy(() => import('./pages/admin/AuditLogPage'));
const KnowledgeBasePage = lazy(() => import('./pages/admin/KnowledgeBasePage'));
const AiSettingsPage = lazy(() => import('./pages/admin/AiSettingsPage'));
const OrganizationsPage = lazy(() => import('./pages/admin/OrganizationsPage'));
const AutomationPage = lazy(() => import('./pages/admin/AutomationPage'));
const IntegrationsPage = lazy(() => import('./pages/admin/IntegrationsPage'));
const UsagePage = lazy(() => import('./pages/admin/UsagePage'));
const TeamPage = lazy(() => import('./pages/admin/TeamPage'));
const DepartmentsPage = lazy(() => import('./pages/admin/DepartmentsPage'));
const WorkspaceSettingsPage = lazy(() => import('./pages/admin/WorkspaceSettingsPage'));
const AdminActivityPage = lazy(() => import('./pages/admin/AdminActivityPage'));
const HolidaysPage = lazy(() => import('./pages/admin/HolidaysPage'));

const Splash = () => <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;

const homeFor = (user) => (user.role === 'super_admin' ? '/platform' : user.role === 'customer' ? '/portal' : '/staff');

/** Public pages: signed-in users are sent to their own home. */
function PublicOnly() {
  const { user, booting } = useAuth();
  if (booting) return <Splash />;
  return user ? <Navigate to={homeFor(user)} replace /> : <Outlet />;
}

/** Wraps a route tree: requires sign-in and the right audience. */
function RequireAudience({ audience }) {
  const { user, booting } = useAuth();
  if (booting) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/platform" replace />;
  const isCustomer = user.role === 'customer';
  if ((audience === 'customer') !== isCustomer) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}

/** The platform owner's area. */
function RequirePlatform() {
  const { user, booting } = useAuth();
  if (booting) return <Splash />;
  if (!user) return <Navigate to="/platform/login" replace />;
  return user.role === 'super_admin' ? <Outlet /> : <Navigate to={homeFor(user)} replace />;
}

function RequirePermission({ allow, children }) {
  const { permissions } = useAuth();
  return permissions[allow] ? children : <Navigate to="/staff" replace />;
}

export default function App() {
  return (
    <PreferencesProvider>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Splash />}>
            <Routes>
              {/* Public: landing page + help center, readable signed in or out */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/help/:slug" element={<ArticlePage />} />

              {/* Which company? Creating one. The platform owner. */}
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/start" element={<StartWorkspacePage />} />
              <Route element={<PublicOnly />}>
                <Route path="/platform/login" element={<PlatformLoginPage />} />
              </Route>
              <Route element={<RequirePlatform />}>
                <Route path="/platform" element={<PlatformPage />} />
              </Route>

              <Route element={<PublicOnly />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/accept-invite" element={<AcceptInvitePage />} />
              </Route>

              {/* Customer portal */}
              <Route element={<RequireAudience audience="customer" />}>
                <Route path="/portal" element={<PortalLayout />}>
                  <Route index element={<PortalTicketsPage />} />
                  <Route path="new" element={<PortalNewTicketPage />} />
                  <Route path="tickets/:id" element={<PortalTicketPage />} />
                  <Route path="sla" element={<PortalSlaPage />} />
                  <Route path="account" element={<AccountPage />} />
                </Route>
              </Route>

              {/* Staff console (agent / lead / admin) lives under /staff */}
              <Route element={<RequireAudience audience="staff" />}>
                <Route path="/staff" element={<StaffLayout />}>
                  <Route index element={<TicketListPage />} />
                  <Route path="tickets/:id" element={<TicketDetailPage />} />
                  <Route path="account" element={<AccountPage />} />
                  <Route path="canned" element={<CannedResponsesPage />} />
                  <Route path="analytics" element={<RequirePermission allow="view_analytics"><AnalyticsDashboard /></RequirePermission>} />
                  <Route path="kb" element={<RequirePermission allow="manage_routing"><KnowledgeBasePage /></RequirePermission>} />
                  <Route path="team" element={<RequirePermission allow="manage_routing"><TeamPage /></RequirePermission>} />
                  <Route path="usage" element={<RequirePermission allow="manage_settings"><UsagePage /></RequirePermission>} />
                  <Route path="integrations" element={<RequirePermission allow="manage_settings"><IntegrationsPage /></RequirePermission>} />
                  <Route path="automation" element={<RequirePermission allow="manage_settings"><AutomationPage /></RequirePermission>} />
                  <Route path="organizations" element={<RequirePermission allow="manage_settings"><OrganizationsPage /></RequirePermission>} />
                  <Route path="departments" element={<RequirePermission allow="manage_settings"><DepartmentsPage /></RequirePermission>} />
                  <Route path="holidays" element={<RequirePermission allow="manage_settings"><HolidaysPage /></RequirePermission>} />
                  <Route path="policies" element={<RequirePermission allow="edit_sla_policies"><PolicyManager /></RequirePermission>} />
                  <Route path="ai" element={<RequirePermission allow="manage_settings"><AiSettingsPage /></RequirePermission>} />
                  <Route path="workspace" element={<RequirePermission allow="manage_settings"><WorkspaceSettingsPage /></RequirePermission>} />
                  <Route path="activity" element={<RequirePermission allow="manage_settings"><AdminActivityPage /></RequirePermission>} />
                  <Route path="audit" element={<RequirePermission allow="manage_settings"><AuditLogPage /></RequirePermission>} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          {/* One assistant for every page: landing, login, help, customer portal and the staff console */}
          <AssistantWidget />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
    </PreferencesProvider>
  );
}
