import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import TrainingAcademy from "./pages/TrainingAcademy";
import CourseEnrol from "./pages/CourseEnrol";
import CourseDetail from "./pages/CourseDetail";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Contact from "./pages/Contact";
import Career from "./pages/Career";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import Wishlist from "./pages/Wishlist";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PayFastDebug from "./pages/PayFastDebug";
import Health from "./pages/Health";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import AdminResellers from "./pages/admin/Resellers";
import AdminFinance from "./pages/admin/Finance";
import AdminHero from "./pages/admin/Hero";
import AdminAcademies from "./pages/admin/Academies";
import ResellerDashboard from "./pages/reseller/Dashboard";
import ResellerSales from "./pages/reseller/Sales";
import ResellerWithdraw from "./pages/reseller/Withdraw";
import AcademyDashboard from "./pages/academy/Dashboard";
import AcademySales from "./pages/academy/Sales";
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-right" />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route path="/training-academy" element={<TrainingAcademy />} />
          <Route path="/cisco-academy" element={<TrainingAcademy />} />
          <Route
            path="/courses/enrol"
            element={
              <ProtectedRoute>
                <CourseEnrol />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:slug"
            element={
              <ProtectedRoute>
                <CourseDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:slug" element={<ProductDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/career" element={<Career />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancelled" element={<PaymentCancel />} />
          <Route path="/health" element={<Health />} />
          {import.meta.env.DEV && <Route path="/debug/payfast" element={<PayFastDebug />} />}
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin" />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="hero" element={<AdminHero />} />
          <Route path="academies" element={<AdminAcademies />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="resellers" element={<AdminResellers />} />
          <Route path="finance" element={<AdminFinance />} />
        </Route>

        {/* Reseller routes */}
        <Route path="/reseller" element={<ProtectedRoute role="reseller" />}>
          <Route path="dashboard" element={<ResellerDashboard />} />
          <Route path="sales" element={<ResellerSales />} />
          <Route path="withdraw" element={<ResellerWithdraw />} />
        </Route>

        {/* Academy affiliate routes */}
        <Route path="/academy" element={<ProtectedRoute role="academy" />}>
          <Route path="dashboard" element={<AcademyDashboard />} />
          <Route path="sales" element={<AcademySales />} />
        </Route>
      </Routes>
    </>
  );
}
