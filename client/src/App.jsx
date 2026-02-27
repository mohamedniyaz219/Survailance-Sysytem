import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/auth/Login';
import RegisterOrg from './pages/auth/RegisterOrg';
import DashboardHome from './pages/views/DashboardHome';
import LiveWallPage from './pages/views/LiveWallPage';
import IncidentsPage from './pages/views/IncidentsPage';
import MapViewPage from './pages/views/MapViewPage';
import AIModelsPage from './pages/views/AIModelsPage';
import UserReportsPage from './pages/views/UserReportsPage';
import RespondersPage from './pages/views/RespondersPage';
import CamerasPage from './pages/views/CamerasPage';
import ZonesPage from './pages/views/ZonesPage';
import EventsPage from './pages/views/EventsPage';
import AnomalyRulesPage from './pages/views/AnomalyRulesPage';
import TenantSettings from './pages/TenantSettings';
import { useSelector } from 'react-redux';

// Layout for Dashboard (Sidebar + Content)
const DashboardLayout = () => (
  <div className="h-screen w-full flex font-sans overflow-hidden bg-stone-brown-50">
    <Sidebar />
    <Outlet /> {/* Renders the child route */}
  </div>
);

// Protected Route Wrapper
const PrivateRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register-org" element={<RegisterOrg />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<DashboardHome />} />
          <Route path="live" element={<LiveWallPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="map" element={<MapViewPage />} />
          <Route path="ai-models" element={<AIModelsPage />} />
          <Route path="user-reports" element={<UserReportsPage />} />
          <Route path="responders" element={<RespondersPage />} />
          <Route path="cameras" element={<CamerasPage />} />
          <Route path="zones" element={<ZonesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="anomaly-rules" element={<AnomalyRulesPage />} />
          <Route path="settings" element={<TenantSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}