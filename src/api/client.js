// Maxx API client — single source for all backend calls.
// In dev, Vite proxies /api -> http://localhost:4000 (see vite.config.js).
const BASE = '/api';

function migrateStorageKey(next, prev) {
  try {
    if (!localStorage.getItem(next) && localStorage.getItem(prev)) {
      localStorage.setItem(next, localStorage.getItem(prev));
      localStorage.removeItem(prev);
    }
  } catch { /* ignore */ }
}

const TOKEN_KEY = 'maxx-token';
const CUSTOMER_TOKEN_KEY = 'maxx-customer-token';
migrateStorageKey(TOKEN_KEY, 'alrafiq-token');
migrateStorageKey(CUSTOMER_TOKEN_KEY, 'alrafiq-customer-token');

export const getToken   = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
export const setToken   = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };
export const clearToken = () => setToken('');

// Storefront customer token (kept separate from the admin token).
export const getCustomerToken   = () => { try { return localStorage.getItem(CUSTOMER_TOKEN_KEY) || ''; } catch { return ''; } };
export const setCustomerToken   = (t) => { try { t ? localStorage.setItem(CUSTOMER_TOKEN_KEY, t) : localStorage.removeItem(CUSTOMER_TOKEN_KEY); } catch { /* ignore */ } };
export const clearCustomerToken = () => setCustomerToken('');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function api(path, { method = 'GET', body, headers = {}, retries = 2 } = {}) {
  const token = getToken();
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(BASE + path, {
        method,
        headers: {
          ...(body != null ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
          ...headers
        },
        body: body != null ? JSON.stringify(body) : undefined
      });
      let data = null;
      try { data = await res.json(); } catch { /* non-json */ }
      if (!res.ok) {
        if ((res.status === 503 || res.status === 502) && attempt < retries) {
          await sleep(600 * (attempt + 1));
          continue;
        }
        const err = new Error((data && data.error) || ('Request failed (' + res.status + ')'));
        err.status = res.status;
        throw err;
      }
      return data;
    } catch (err) {
      lastErr = err;
      if (attempt < retries && (!err.status || err.status >= 500)) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error('Request failed');
}

export async function apiLogin(email, password) {
  const data = await api('/auth/login', { method: 'POST', body: { email, password } });
  if (data && data.token) setToken(data.token);
  return data;
}

// Restore the current admin from the stored token (used on app load / refresh).
export const authMeApi = () => api('/auth/me');

export const apiHealth = () => api('/health');

// Editable site content (announcement bar, testimonials, flash sale, about stats)
export const siteSettingsApi     = ()      => api('/settings/site');
export const siteSettingsSaveApi = (site)  => api('/settings/site', { method: 'PUT', body: { site } });

// Customer account requests attach the customer token (not the admin one).
async function accountApi(path, { method = 'GET', body } = {}) {
  const token = getCustomerToken();
  const res = await fetch(BASE + '/account' + path, {
    method,
    headers: {
      ...(body != null ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: body != null ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-json */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || ('Request failed (' + res.status + ')'));
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function accountRegisterApi(body) {
  const data = await accountApi('/register', { method: 'POST', body });
  if (data?.token) setCustomerToken(data.token);
  return data;
}
export async function accountLoginApi(body) {
  const data = await accountApi('/login', { method: 'POST', body });
  if (data?.token) setCustomerToken(data.token);
  return data;
}
export const accountMeApi       = ()      => accountApi('/me');
export const accountUpdateApi   = (body)  => accountApi('/me', { method: 'PATCH', body });
export const accountPasswordApi = (body)  => accountApi('/password', { method: 'PATCH', body });

// Saved addresses
export const addressesListApi   = ()          => accountApi('/addresses');
export const addressCreateApi   = (body)      => accountApi('/addresses', { method: 'POST', body });
export const addressUpdateApi   = (id, body)  => accountApi('/addresses/' + id, { method: 'PATCH', body });
export const addressDeleteApi   = (id)        => accountApi('/addresses/' + id, { method: 'DELETE' });

// Account-linked wishlist
export const wishlistGetApi     = ()          => accountApi('/wishlist');
export const wishlistSyncApi    = (productIds)=> accountApi('/wishlist', { method: 'PUT', body: { productIds } });

// Multipart image upload (XHR for upload progress)
export function uploadImages(files, { productId, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('images', f));
    if (productId) fd.append('productId', productId);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', BASE + '/uploads');
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      let data = null; try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error((data && data.error) || ('Upload failed (' + xhr.status + ')')));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(fd);
  });
}

export const deleteImage = (url) => api('/uploads', { method: 'DELETE', body: { url } });

// AI + SEO
export const aiMode              = () => api('/ai/mode');
export const aiPost              = (path, body) => api('/ai' + path, { method: 'POST', body });
export const seoScoreApi         = (blog, meta) => api('/seo/score', { method: 'POST', body: { blog, meta } });
export const seoSchema           = (type, body) => api('/seo/schema/' + type, { method: 'POST', body });
export const optimizeProductApi  = (product) => api('/products/optimize', { method: 'POST', body: { product } });

// Products — slim catalog by default; pass page/limit for paginated shop queries
export const productsListApi = (params = {}) => {
  const qs = new URLSearchParams({ slim: 1, ...params });
  return api('/products?' + qs);
};
export const productsListAdminApi  = ()             => api('/products/all');
export const productGetApi         = (id)           => api('/products/' + id);
export const productGetBySlugApi   = (slug)         => api('/products/by-slug/' + slug);
export const productAddApi         = (product)      => api('/products',        { method: 'POST',   body: { product } });
export const productUpdateApi      = (id, product)  => api('/products/' + id,  { method: 'PUT',    body: { product } });
export const productDeleteApi      = (id)           => api('/products/' + id,  { method: 'DELETE' });

// Orders
export const ordersListApi    = (params = {}) => api('/orders?' + new URLSearchParams(params));
export const orderGetApi      = (id)          => api('/orders/' + id);
export const orderCreateApi   = (order)       => api('/orders',       { method: 'POST',   body: { order } });
export const orderCheckoutApi = (order)       => api('/orders/checkout', { method: 'POST', body: { order } });
export const orderTrackApi    = (id)          => api('/orders/track/' + encodeURIComponent(id));
export const orderUpdateApi   = (id, order)   => api('/orders/' + id, { method: 'PUT',    body: { order } });
export const orderDeleteApi   = (id)          => api('/orders/' + id, { method: 'DELETE' });

// Customers
export const customersListApi   = (params = {}) => api('/customers?' + new URLSearchParams(params));
export const customerGetApi     = (id)          => api('/customers/' + id);
export const customerCreateApi  = (customer)    => api('/customers',       { method: 'POST',   body: { customer } });
export const customerUpdateApi  = (id, customer)=> api('/customers/' + id, { method: 'PUT',    body: { customer } });
export const customerDeleteApi  = (id)          => api('/customers/' + id, { method: 'DELETE' });

// Complaints
export const complaintsListApi   = (params = {}) => api('/complaints?' + new URLSearchParams(params));
export const complaintGetApi     = (id)          => api('/complaints/' + id);
export const complaintSubmitApi  = (data)        => api('/complaints/submit',  { method: 'POST', body: data });
export const complaintTrackApi   = (id)          => api('/complaints/track/' + id);
export const complaintUpdateApi  = (id, patch)   => api('/complaints/' + id,  { method: 'PATCH', body: patch });
export const complaintDeleteApi  = (id)          => api('/complaints/' + id,  { method: 'DELETE' });

// Reviews
export const reviewsListApi       = (params = {})  => api('/reviews?' + new URLSearchParams(params));
export const reviewsByProductApi  = (productId)    => api('/reviews/product/' + productId);
export const reviewSubmitApi      = (data)         => api('/reviews/submit',    { method: 'POST',   body: data });
export const reviewUpdateApi      = (id, patch)    => api('/reviews/' + id,     { method: 'PATCH',  body: patch });
export const reviewDeleteApi      = (id)           => api('/reviews/' + id,     { method: 'DELETE' });
export const reviewsBulkImportApi = (body)         => api('/reviews/bulk',      { method: 'POST',   body });

// Coupons
export const couponsListApi    = ()            => api('/coupons');
export const couponValidateApi = (code, total) => api('/coupons/validate', { method: 'POST', body: { code, orderTotal: total } });
export const couponCreateApi   = (coupon)      => api('/coupons',       { method: 'POST',   body: { coupon } });
export const couponUpdateApi   = (id, coupon)  => api('/coupons/' + id, { method: 'PUT',    body: { coupon } });
export const couponDeleteApi   = (id)          => api('/coupons/' + id, { method: 'DELETE' });

// Banners
export const bannersPublicApi  = (type)        => api('/banners/public' + (type ? '?type=' + type : ''));
export const bannersListApi    = ()            => api('/banners');
export const bannerCreateApi   = (banner)      => api('/banners',       { method: 'POST',   body: { banner } });
export const bannerUpdateApi   = (id, banner)  => api('/banners/' + id, { method: 'PUT',    body: { banner } });
export const bannerDeleteApi   = (id)          => api('/banners/' + id, { method: 'DELETE' });

// Blog
export const blogPublicApi     = (params = {}) => api('/blog/public?' + new URLSearchParams(params));
export const blogPostPublicApi = (slug)        => api('/blog/public/' + slug);
export const blogListApi       = ()            => api('/blog');
export const blogCreateApi     = (post)        => api('/blog',          { method: 'POST',   body: { post } });
export const blogUpdateApi     = (slug, post)  => api('/blog/' + slug,  { method: 'PUT',    body: { post } });
export const blogDeleteApi     = (slug)        => api('/blog/' + slug,  { method: 'DELETE' });

// Email
export const newsletterSubscribeApi = (email)         => api('/email/subscribe',      { method: 'POST',   body: { email } });
export const emailContactsApi       = (params = {})   => api('/email/contacts?' + new URLSearchParams(params));
export const emailAddContactsApi    = (contacts)       => api('/email/contacts',       { method: 'POST',   body: { contacts } });
export const emailDeleteContactApi  = (id)             => api('/email/contacts/' + id, { method: 'DELETE' });
export const emailCampaignsApi      = ()               => api('/email/campaigns');
export const emailCreateCampaignApi = (campaign)       => api('/email/campaigns',       { method: 'POST',   body: { campaign } });
export const emailUpdateCampaignApi = (id, patch)      => api('/email/campaigns/' + id, { method: 'PATCH',  body: patch });
export const emailDeleteCampaignApi = (id)             => api('/email/campaigns/' + id, { method: 'DELETE' });

// Accounts / Transactions
export const transactionsListApi   = (params = {})   => api('/accounts?' + new URLSearchParams(params));
export const transactionCreateApi  = (transaction)   => api('/accounts',       { method: 'POST',   body: { transaction } });
export const transactionUpdateApi  = (id, data)      => api('/accounts/' + id, { method: 'PUT',    body: { transaction: data } });
export const transactionDeleteApi  = (id)            => api('/accounts/' + id, { method: 'DELETE' });
export const activityLogApi        = (params = {})   => api('/accounts/activity-log?' + new URLSearchParams(params));

// Team
export const teamList          = ()              => api('/team');
export const teamAssigneesApi  = ()              => api('/team/assignees');
export const teamAdd           = (body)          => api('/team',                         { method: 'POST',   body });
export const teamUpdate        = (id, body)      => api('/team/' + id,                  { method: 'PATCH',  body });
export const teamSetPassword   = (id, password)  => api('/team/' + id + '/password',    { method: 'PATCH',  body: { password } });
export const teamDelete        = (id)            => api('/team/' + id,                  { method: 'DELETE' });
export const teamImpersonate   = (id)            => api('/team/impersonate/' + id,       { method: 'POST' });

// Impersonation token helpers
const PARENT_KEY = 'maxx-parent-token';
migrateStorageKey(PARENT_KEY, 'alrafiq-parent-token');
export const beginImpersonationToken = (newToken) => {
  try { const cur = getToken(); if (cur) localStorage.setItem(PARENT_KEY, cur); } catch { /* ignore */ }
  setToken(newToken);
};
export const endImpersonationToken = () => {
  try { const p = localStorage.getItem(PARENT_KEY); if (p) { setToken(p); localStorage.removeItem(PARENT_KEY); } else setToken(''); }
  catch { /* ignore */ }
};

// Export download helper
export async function downloadExport(entity, format = 'csv', filters = {}) {
  const clean = {};
  Object.entries(filters || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') clean[k] = v; });
  const params = new URLSearchParams({ format, ...clean });
  const token = getToken();
  const res = await fetch(BASE + '/exports/' + entity + '?' + params.toString(), {
    headers: token ? { Authorization: 'Bearer ' + token } : {}
  });
  if (!res.ok) {
    let msg = 'Export failed (' + res.status + ')';
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    const err = new Error(msg); err.status = res.status; throw err;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'maxx-' + entity + '-' + new Date().toISOString().slice(0, 10) + '.' + format;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function backendAvailable() {
  try { await apiHealth(); return true; } catch { return false; }
}

// ===== Vendor portal (separate token, separate session) =====
const VENDOR_TOKEN_KEY = 'maxx-vendor-token';
migrateStorageKey(VENDOR_TOKEN_KEY, 'alrafiq-vendor-token');
export const getVendorToken = () => { try { return localStorage.getItem(VENDOR_TOKEN_KEY) || ''; } catch { return ''; } };
export const setVendorToken = (t) => { try { t ? localStorage.setItem(VENDOR_TOKEN_KEY, t) : localStorage.removeItem(VENDOR_TOKEN_KEY); } catch { /* ignore */ } };
export const clearVendorToken = () => setVendorToken('');

async function vendorReq(path, { method = 'GET', body } = {}) {
  const token = getVendorToken();
  const res = await fetch(BASE + '/vendor' + path, {
    method,
    headers: {
      ...(body != null ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: body != null ? JSON.stringify(body) : undefined
  });
  let data = null; try { data = await res.json(); } catch { /* non-json */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || ('Request failed (' + res.status + ')'));
    err.status = res.status; throw err;
  }
  return data;
}
export async function vendorLoginApi(email, password) {
  const data = await vendorReq('/auth/login', { method: 'POST', body: { email, password } });
  if (data && data.token) setVendorToken(data.token);
  return data;
}
export const vendorMeApi             = ()         => vendorReq('/me');
export const vendorProductsApi       = ()         => vendorReq('/products');
export const vendorOrdersApi         = ()         => vendorReq('/orders');
export const vendorUpdateOrderApi    = (id, body) => vendorReq('/orders/' + id, { method: 'PATCH', body });
export const vendorCouriersApi       = ()         => vendorReq('/couriers');
export const vendorRevenueApi        = ()         => vendorReq('/revenue');
export const vendorNotificationsApi = async () => {
  const token = getVendorToken();
  const res = await fetch(BASE + '/notifications/vendor', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
  let data = null; try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) return { notifications: [], unread: 0 };
  return data;
};
export const vendorMarkNotificationReadApi = async (id) => {
  const token = getVendorToken();
  await fetch(BASE + '/notifications/vendor/' + id + '/read', { method: 'PATCH', headers: token ? { Authorization: 'Bearer ' + token } : {} });
};
export const vendorMarkAllNotificationsReadApi = async () => {
  const token = getVendorToken();
  await fetch(BASE + '/notifications/vendor/read-all', { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {} });
};

// ---- Customer notifications ----
async function customerNotifReq(path, { method = 'GET', body } = {}) {
  const token = getCustomerToken();
  const res = await fetch(BASE + '/notifications' + path, {
    method,
    headers: {
      ...(body != null ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: body != null ? JSON.stringify(body) : undefined
  });
  let data = null; try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || ('Request failed (' + res.status + ')'));
    err.status = res.status; throw err;
  }
  return data;
}
export const customerNotificationsApi = () => customerNotifReq('/customer');
export const customerMarkNotificationReadApi = (id) => customerNotifReq('/customer/' + id + '/read', { method: 'PATCH' });
export const customerMarkAllNotificationsReadApi = () => customerNotifReq('/customer/read-all', { method: 'POST' });

// ---- Firebase FCM token registration ----
export async function registerPushTokenApi(token, userType = 'customer') {
  const authToken = userType === 'vendor' ? getVendorToken() : getCustomerToken();
  const res = await fetch(BASE + '/push/register/' + userType, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
    },
    body: JSON.stringify({ token })
  });
  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch { /* ignore */ }
    throw new Error((data && data.error) || 'Failed to register push token');
  }
  return res.json();
}

export async function unregisterPushTokenApi(token, userType = 'customer') {
  const authToken = userType === 'vendor' ? getVendorToken() : getCustomerToken();
  await fetch(BASE + '/push/register/' + userType, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
    },
    body: JSON.stringify({ token })
  });
}

// ---- Commission slabs (public) ----
export const commissionSlabsApi = () => api('/commission/slabs');
export const commissionCalculateApi = (price) => api('/commission/calculate', { method: 'POST', body: { price } });
export const vendorListingRequestsApi= ()         => vendorReq('/listing-requests');
export const vendorSubmitListingApi  = (product, notes) => vendorReq('/listing-requests', { method: 'POST', body: { product, notes } });

export function vendorUploadImages(files) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('images', f));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', BASE + '/vendor/uploads');
    const token = getVendorToken();
    if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error((data && data.error) || ('Upload failed (' + xhr.status + ')')));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(fd);
  });
}

// ---- Admin: Vendor management (separate from vendor portal) ----
export const vendorsAdminList = ()            => api('/vendors-admin');
export const vendorsAdminAdd  = (body)        => api('/vendors-admin', { method: 'POST', body });
export const vendorsAdminUpdate = (id, body)  => api('/vendors-admin/' + id, { method: 'PATCH', body });
export const vendorsAdminSetPassword = (id, password) => api('/vendors-admin/' + id + '/password', { method: 'PATCH', body: { password } });
export const vendorsAdminDelete = (id)        => api('/vendors-admin/' + id, { method: 'DELETE' });

// ---- Admin: Listing Requests (vendor product proposals) ----
export const listingRequestsAdminList   = ()         => api('/listing-requests-admin');
export const listingRequestsAdminApprove = (id)       => api('/listing-requests-admin/' + id + '/approve', { method: 'POST' });
export const listingRequestsAdminReject  = (id, reason) => api('/listing-requests-admin/' + id + '/reject',  { method: 'POST', body: { reason } });
