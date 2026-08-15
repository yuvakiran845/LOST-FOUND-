import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages — Phase 1
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';

// Pages — Phase 2
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';

// Pages — Phase 3
import BrowseItemsPage from './pages/BrowseItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import EditItemPage from './pages/EditItemPage';
import ReportLostPage from './pages/ReportLostPage';
import ReportFoundPage from './pages/ReportFoundPage';
import MyItemsPage from './pages/MyItemsPage';

// Pages — Phase 5
import MatchesPage from './pages/MatchesPage';

// Pages — Phase 6
import RequestsPage from './pages/RequestsPage';

// Pages — Phase 7
import ProfilePage from './pages/ProfilePage';

// Pages — Admin
import AdminPage from './pages/AdminPage';

/**
 * Layout wrapper — adds top padding on all pages except the landing page.
 * The landing page uses a full-screen hero with a transparent overlaid navbar,
 * so it deliberately renders flush to the top.
 */
// Only the landing page renders flush to top (no navbar offset)
const FULL_SCREEN_PAGES = ['/'];

function Layout({ children }) {
  const location = useLocation();
  const isFullScreen = FULL_SCREEN_PAGES.includes(location.pathname);
  return (
    <main className={isFullScreen ? '' : 'pt-14'}>
      {children}
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Layout>
          <Routes>
            {/* ── Public Routes ───────────────────────── */}
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Browse items is public */}
            <Route path="/items"     element={<BrowseItemsPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />

            {/* Potential matches */}
            <Route path="/items/:id/matches" element={<MatchesPage />} />

            {/* ── Protected Routes ─────────────────────── */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />

            <Route path="/report/lost" element={
              <ProtectedRoute><ReportLostPage /></ProtectedRoute>
            } />

            <Route path="/report/found" element={
              <ProtectedRoute><ReportFoundPage /></ProtectedRoute>
            } />

            <Route path="/items/:id/edit" element={
              <ProtectedRoute><EditItemPage /></ProtectedRoute>
            } />

            <Route path="/my-items" element={
              <ProtectedRoute><MyItemsPage /></ProtectedRoute>
            } />

            {/* Phase 6 — Recovery Requests */}
            <Route path="/requests" element={
              <ProtectedRoute><RequestsPage /></ProtectedRoute>
            } />

            {/* Phase 7 — User Profile */}
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute><AdminPage /></ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
