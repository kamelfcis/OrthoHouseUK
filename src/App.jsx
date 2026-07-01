import { useEffect, Suspense, lazy, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import SplashScreen from './components/Layout/SplashScreen'
import RouteLoader from './components/common/RouteLoader'
import { runWhenIdle } from './lib/idle'

const CookieConsent = lazy(() => import('./components/Layout/CookieConsent'))

const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const ProtectedRoute = lazy(() => import('./components/admin/ProtectedRoute'))

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
const AdminSocialMedia = lazy(() => import('./pages/admin/SocialMedia'))

function App() {
  const [showCookieConsent, setShowCookieConsent] = useState(false)

  useEffect(() => {
    const show = () => setShowCookieConsent(true)
    const cancelIdle = runWhenIdle(show, { timeout: 5000 })
    return cancelIdle
  }, [])

  return (
    <>
      <SplashScreen />
      {showCookieConsent && (
        <Suspense fallback={null}>
          <CookieConsent />
        </Suspense>
      )}
      <Routes>
      {/* Public Routes */}
      <Route path="/*" element={
        <Layout>
          <Suspense fallback={<RouteLoader />}>
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
        <Suspense fallback={<RouteLoader />}>
          <Login />
        </Suspense>
      } />
      {/* Temporary test routes - bypasses all protection */}
      <Route path="/admin/test" element={
        <Suspense fallback={<RouteLoader />}>
          <ProductsSimple />
        </Suspense>
      } />
      <Route path="/admin/test-minimal" element={
        <Suspense fallback={<RouteLoader />}>
          <ProductsMinimal />
        </Suspense>
      } />
      <Route path="/admin" element={
        <Suspense fallback={<RouteLoader />}>
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        </Suspense>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={
          <Suspense fallback={<RouteLoader />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="products" element={
          <Suspense fallback={<RouteLoader />}>
            <AdminProducts />
          </Suspense>
        } />
        <Route path="products-full" element={
          <Suspense fallback={<RouteLoader />}>
            <AdminProducts />
          </Suspense>
        } />
        <Route path="blogs" element={
          <Suspense fallback={<RouteLoader />}>
            <AdminBlogs />
          </Suspense>
        } />
        <Route path="partners" element={
          <Suspense fallback={<RouteLoader />}>
            <AdminPartners />
          </Suspense>
        } />
        <Route path="categories" element={
          <Suspense fallback={<RouteLoader />}>
            <AdminCategories />
          </Suspense>
        } />
        <Route path="messages" element={
          <Suspense fallback={<RouteLoader />}>
            <AdminMessages />
          </Suspense>
        } />
        <Route path="page-content" element={
          <Suspense fallback={<RouteLoader />}>
            <AdminPageContent />
          </Suspense>
        } />
        <Route path="users" element={
          <Suspense fallback={<RouteLoader />}>
            <AdminUsers />
          </Suspense>
        } />
        <Route path="branches" element={
          <Suspense fallback={<RouteLoader />}>
            <AdminBranches />
          </Suspense>
        } />
        <Route path="social-media" element={
          <Suspense fallback={<RouteLoader />}>
            <AdminSocialMedia />
          </Suspense>
        } />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
    </>
  )
}

export default App
