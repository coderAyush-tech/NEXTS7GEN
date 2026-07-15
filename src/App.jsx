import { HashRouter, Route, Routes } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import AdmissionPage from './pages/AdmissionPage';
import CoursesPage from './pages/CoursesPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<HomePage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="admission" element={<AdmissionPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
