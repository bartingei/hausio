import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import BrowsePage from './pages/BrowsePage';
import ListingDetailPage from './pages/ListingDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandlordDashboard from './pages/LandlordDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import TenantDashboard from './pages/TenantDashboard';

function AppInner() {
  const location = useLocation();
  const hideNav = location.pathname === '/';

  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/"               element={<LandingPage />} />
        <Route path="/browse"         element={<BrowsePage />} />
        <Route path="/listings/:id"   element={<ListingDetailPage />} />
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/register"       element={<RegisterPage />} />
        <Route path="/dashboard"      element={<LandlordDashboard />} />
        <Route path="/tenant"         element={<TenantDashboard />} />
        <Route path="/admin"          element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;