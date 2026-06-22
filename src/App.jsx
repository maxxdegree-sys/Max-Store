import { Suspense, lazy, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productsListApi, accountMeApi, getCustomerToken, clearCustomerToken, siteSettingsApi, wishlistGetApi, wishlistSyncApi, getToken, clearToken, authMeApi } from './api/client';
import { tryRefreshFcmToken } from './utils/pushNotifications';
import { setProducts, selectAllProducts } from './store/productsSlice';
import { setUser, selectUser, selectIsAdmin, selectPermissions, selectAdminReady, setAdminReady, logoutCustomer } from './store/authSlice';
import { selectWishlist, setWishlist } from './store/wishlistSlice';
import { setSiteSettings } from './store/settingsSlice';
import { can } from './utils/permissions';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';
import Loader from './components/ui/Loader';

// Storefront
const Home          = lazy(() => import('./pages/Home'));
const Shop          = lazy(() => import('./pages/Shop'));
const Categories    = lazy(() => import('./pages/Categories'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart          = lazy(() => import('./pages/Cart'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const Wishlist      = lazy(() => import('./pages/Wishlist'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const About         = lazy(() => import('./pages/About'));
const Contact       = lazy(() => import('./pages/Contact'));
const Complaint     = lazy(() => import('./pages/Complaint'));
const TicketTracking= lazy(() => import('./pages/TicketTracking'));
const Faq           = lazy(() => import('./pages/Faq'));
const Blog          = lazy(() => import('./pages/Blog'));
const BlogPost      = lazy(() => import('./pages/BlogPost'));
const Privacy       = lazy(() => import('./pages/PrivacyPolicy'));
const Terms         = lazy(() => import('./pages/Terms'));
const NotFound      = lazy(() => import('./pages/NotFound'));

// Admin
const AdminLayout     = lazy(() => import('./pages/admin/AdminLayout'));
const AdminLogin      = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts   = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders     = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers  = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminBanners    = lazy(() => import('./pages/admin/AdminBanners'));
const AdminCoupons    = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminReviews    = lazy(() => import('./pages/admin/AdminReviews'));
const AdminComplaints = lazy(() => import('./pages/admin/AdminComplaints'));
const AdminAccounts   = lazy(() => import('./pages/admin/AdminAccounts'));
const AdminExports    = lazy(() => import('./pages/admin/AdminExports'));
const AdminBlog       = lazy(() => import('./pages/admin/AdminBlog'));
const AdminEmail      = lazy(() => import('./pages/admin/AdminEmail'));
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'));
const AdminActivity   = lazy(() => import('./pages/admin/AdminActivity'));
const AdminContent    = lazy(() => import('./pages/admin/AdminContent'));
const AdminVendors    = lazy(() => import('./pages/admin/AdminVendors'));
const AdminCommission = lazy(() => import('./pages/admin/AdminCommission'));
const AdminListingRequests = lazy(() => import('./pages/admin/AdminListingRequests'));

// Vendor portal (separate layout, separate token)
const VendorLogin            = lazy(() => import('./pages/vendor/VendorLogin'));
const VendorLayout           = lazy(() => import('./pages/vendor/VendorLayout'));
const VendorDashboard        = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorProducts         = lazy(() => import('./pages/vendor/VendorProducts'));
const VendorOrders           = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorListingRequests  = lazy(() => import('./pages/vendor/VendorListingRequests'));
const VendorNotifications    = lazy(() => import('./pages/vendor/VendorNotifications'));

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    productsListApi({ slim: 1 }).then((d) => { if (Array.isArray(d?.products) && d.products.length) dispatch(setProducts(d.products)); }).catch(() => {});
    siteSettingsApi().then((d) => { if (d?.site) dispatch(setSiteSettings(d.site)); }).catch(() => {});
    // Restore sessions — admin first, then customer so both tokens prefer the storefront user in Redux.
    if (getToken()) {
      authMeApi()
        .then((d) => {
          const u = d?.user;
          if (u) dispatch(setUser({
            uid: u.uid || u.id, id: u.id, email: u.email, name: u.name,
            role: u.role, department: u.department, permissions: u.permissions,
            canImport: u.canImport ?? false, isAdmin: true
          }));
        })
        .catch(() => clearToken())
        .finally(() => dispatch(setAdminReady(true)));
    } else {
      dispatch(setAdminReady(true));
    }
    if (getCustomerToken()) {
      accountMeApi()
        .then((d) => { if (d?.user) dispatch(setUser(d.user)); })
        .catch(() => { clearCustomerToken(); dispatch(logoutCustomer()); })
        .finally(() => { tryRefreshFcmToken('customer'); });
    }
  }, [dispatch]);
  return (
    <>
      <ScrollToTop />
      <AccountSync />
      <Suspense fallback={<Loader fullScreen />}>
        <Routes>
          {/* Storefront */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="categories" element={<Categories />} />
            <Route path="category/:slug" element={<Shop />} />
            <Route path="category/:slug/:subslug" element={<Shop />} />
            <Route path="product/:slug" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="dashboard/*" element={<Dashboard />} />
            <Route path="order-tracking" element={<OrderTracking />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="complaint" element={<Complaint />} />
            <Route path="track-ticket" element={<TicketTracking />} />
            <Route path="faq" element={<Faq />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:slug" element={<BlogPost />} />
            <Route path="privacy-policy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin (separate layout) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<RequirePermission perm="dashboard"><AdminDashboard /></RequirePermission>} />
            <Route path="products"   element={<RequirePermission perm="products"><AdminProducts /></RequirePermission>} />
            <Route path="orders"     element={<RequirePermission perm="orders"><AdminOrders /></RequirePermission>} />
            <Route path="customers"  element={<RequirePermission perm="customers"><AdminCustomers /></RequirePermission>} />
            <Route path="banners"    element={<RequirePermission perm="banners"><AdminBanners /></RequirePermission>} />
            <Route path="content"    element={<RequirePermission perm="banners"><AdminContent /></RequirePermission>} />
            <Route path="coupons"    element={<RequirePermission perm="coupons"><AdminCoupons /></RequirePermission>} />
            <Route path="reviews"    element={<RequirePermission perm="reviews"><AdminReviews /></RequirePermission>} />
            <Route path="complaints" element={<RequirePermission perm="complaints"><AdminComplaints /></RequirePermission>} />
            <Route path="accounts"   element={<RequirePermission perm="accounts"><AdminAccounts /></RequirePermission>} />
            <Route path="exports"    element={<RequirePermission perm="exports"><AdminExports /></RequirePermission>} />
            <Route path="blog"       element={<RequirePermission perm="blog"><AdminBlog /></RequirePermission>} />
            <Route path="email"      element={<RequirePermission perm="email"><AdminEmail /></RequirePermission>} />
            <Route path="vendors"    element={<RequirePermission perm="vendors"><AdminVendors /></RequirePermission>} />
            <Route path="commission" element={<RequirePermission perm="accounts"><AdminCommission /></RequirePermission>} />
            <Route path="listing-requests" element={<RequirePermission perm="vendors"><AdminListingRequests /></RequirePermission>} />
            <Route path="team"       element={<RequirePermission perm="team"><AdminUsers /></RequirePermission>} />
            <Route path="activity"   element={<RequirePermission perm="activity"><AdminActivity /></RequirePermission>} />
          </Route>

          {/* Vendor portal (separate layout, separate token) */}
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor" element={<VendorLayout />}>
            <Route index element={<VendorDashboard />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="listing-requests" element={<VendorListingRequests />} />
            <Route path="notifications" element={<VendorNotifications />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

// Blocks the whole admin area unless a valid admin session is present.
function RequireAdmin({ children }) {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const ready = useSelector(selectAdminReady);
  if (!getToken()) return <Navigate to="/admin/login" replace />;
  if (!ready) return <Loader fullScreen />;          // still restoring the session
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

// Blocks a single admin section unless the signed-in admin holds the permission.
function RequirePermission({ perm, children }) {
  const permissions = useSelector(selectPermissions);
  if (!can(permissions, perm)) return <NoAccess />;
  return children;
}

function NoAccess() {
  return (
    <div className="min-h-[50vh] grid place-items-center text-center px-6">
      <div className="max-w-md">
        <h1 className="text-2xl font-extrabold">Access restricted</h1>
        <p className="mt-2 text-ink-500">You don&apos;t have permission to view this section. Ask an executive if you need access.</p>
        <Link to="/admin" className="btn-primary mt-5 inline-flex">Back to Dashboard</Link>
      </div>
    </div>
  );
}

// Keeps the signed-in customer's wishlist synced with the server so it follows
// them across devices. Merges any guest items on first login, then mirrors changes.
function AccountSync() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const items = useSelector(selectWishlist);
  const products = useSelector(selectAllProducts);
  const hydratedRef = useRef(false);
  const productsRef = useRef(products);
  const itemsRef = useRef(items);
  productsRef.current = products;
  itemsRef.current = items;

  const isCustomer = !!user && user.kind === 'customer';

  useEffect(() => {
    if (!isCustomer || !getCustomerToken()) { hydratedRef.current = false; return; }
    tryRefreshFcmToken('customer');
    let cancelled = false;
    wishlistGetApi()
      .then(({ productIds = [] }) => {
        if (cancelled) return;
        const local = itemsRef.current || [];
        const localIds = new Set(local.map((x) => String(x.id)));
        const merged = [...local];
        productIds.forEach((pid) => {
          if (localIds.has(String(pid))) return;
          const p = (productsRef.current || []).find((x) => String(x.id) === String(pid));
          if (p) merged.push({ id: p.id, slug: p.slug, title: p.title, price: p.price, image: p.images?.[0] || '' });
        });
        dispatch(setWishlist(merged));
        hydratedRef.current = true;
        wishlistSyncApi(merged.map((x) => x.id)).catch(() => {});
      })
      .catch(() => { hydratedRef.current = true; });
    return () => { cancelled = true; };
  }, [isCustomer, dispatch]);

  useEffect(() => {
    if (!isCustomer || !hydratedRef.current) return;
    const t = setTimeout(() => { wishlistSyncApi(items.map((x) => x.id)).catch(() => {}); }, 600);
    return () => clearTimeout(t);
  }, [items, isCustomer]);

  return null;
}
