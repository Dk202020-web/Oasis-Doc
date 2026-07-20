import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { ProtectedRoute, AdminRoute } from './components/RouteGuards'

import Home from './pages/Home'
import ServicesLanding from './pages/ServicesLanding'
import CategoryPage from './pages/CategoryPage'
import ServiceDetail from './pages/ServiceDetail'
import Cart from './pages/Cart'
import OrderConfirmation from './pages/OrderConfirmation'
import Suivi from './pages/Suivi'
import MyOrders from './pages/MyOrders'
import MyAccount from './pages/MyAccount'
import HowItWorks from './pages/HowItWorks'
import FAQ from './pages/FAQ'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Signup from './pages/Signup'

import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import RequestsQueue from './pages/admin/RequestsQueue'
import RequestDetail from './pages/admin/RequestDetail'
import CatalogManager from './pages/admin/CatalogManager'
import Settings from './pages/admin/Settings'
import AdminUsers from './pages/admin/AdminUsers'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<ServicesLanding />} />
          <Route path="/services/:slug" element={<CategoryPage />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/panier" element={<Cart />} />
          <Route path="/confirmation" element={<OrderConfirmation />} />
          <Route path="/suivi" element={<Suivi />} />
          <Route path="/comment-ca-marche" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/confidentialite" element={<Privacy />} />
          <Route path="/conditions" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Signup />} />

          <Route
            path="/mes-commandes"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mon-compte"
            element={
              <ProtectedRoute>
                <MyAccount />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="requests" element={<RequestsQueue />} />
            <Route path="requests/:id" element={<RequestDetail />} />
            <Route path="catalog" element={<CatalogManager />} />
            <Route path="admins" element={<AdminUsers />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
