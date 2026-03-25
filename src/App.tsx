import { HashRouter, Routes, Route } from 'react-router-dom';
import MainSite from './pages/MainSite';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </HashRouter>
  );
}
