import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/auth/Login';
import RegisterOrg from './pages/auth/RegisterOrg';
import DashboardHome from './pages/dashboard/DashboardHome';
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
            <Route path="live" element={<div>Live Wall Page</div>} />
            <Route path="incidents" element={<div>Incidents List</div>} />
            {/* Add more routes here */}
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}