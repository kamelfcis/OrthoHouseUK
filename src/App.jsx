import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'
import SplashScreen from './components/Layout/SplashScreen'
import CookieConsent from './components/Layout/CookieConsent'

// Lazy load all pages for better code splitting
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogDetail = lazy(() => import('./pages/BlogDetail'))
const Services = lazy(() => import('./pages/Services'))
const PartnerInfo = lazy(() => import('./pages/PartnerInfo'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Team = lazy(() => import('./pages/Team'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Testimonials = lazy(() => import('./pages/Testimonials'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const ProductsSimple = lazy(() => import('./pages/admin/ProductsSimple'))
const ProductsMinimal = lazy(() => import('./pages/admin/ProductsMinimal'))
const AdminBlogs = lazy(() => import('./pages/admin/Blogs'))
const AdminPartners = lazy(() => import('./pages/admin/Partners'))
const AdminMessages = lazy(() => import('./pages/admin/Messages'))
const AdminPageContent = lazy(() => import('./pages/admin/PageContent'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminBranches = lazy(() => import('./pages/admin/Branches'))

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh' 
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #005f9a',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)
function App() {
  return (
    <>
      <SplashScreen />
      <CookieConsent />
      <Routes>
      {/* Public Routes */}
      <Route path="/*" element={
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/partners" element={<Services />} />
              <Route path="/partners/:id" element={<PartnerInfo />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/team" element={<Team />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      } />

      {/* Admin Routes */}
      <Route path="/admin/login" element={
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      } />
      {/* Temporary test routes - bypasses all protection */}
      <Route path="/admin/test" element={
        <Suspense fallback={<PageLoader />}>
          <ProductsSimple />
        </Suspense>
      } />
      <Route path="/admin/test-minimal" element={
        <Suspense fallback={<PageLoader />}>
          <ProductsMinimal />
        </Suspense>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="products" element={
          <Suspense fallback={<PageLoader />}>
            <AdminProducts />
          </Suspense>
        } />
        <Route path="products-full" element={
          <Suspense fallback={<PageLoader />}>
            <AdminProducts />
          </Suspense>
        } />
        <Route path="blogs" element={
          <Suspense fallback={<PageLoader />}>
            <AdminBlogs />
          </Suspense>
        } />
        <Route path="partners" element={
          <Suspense fallback={<PageLoader />}>
            <AdminPartners />
          </Suspense>
        } />
        <Route path="categories" element={
          <Suspense fallback={<PageLoader />}>
            <AdminCategories />
          </Suspense>
        } />
        <Route path="messages" element={
          <Suspense fallback={<PageLoader />}>
            <AdminMessages />
          </Suspense>
        } />
        <Route path="page-content" element={
          <Suspense fallback={<PageLoader />}>
            <AdminPageContent />
          </Suspense>
        } />
        <Route path="users" element={
          <Suspense fallback={<PageLoader />}>
            <AdminUsers />
          </Suspense>
        } />
        <Route path="branches" element={
          <Suspense fallback={<PageLoader />}>
            <AdminBranches />
          </Suspense>
        } />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
    </>
  )
}

export default App
