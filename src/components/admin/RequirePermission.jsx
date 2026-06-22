import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { selectPermissions } from '../../store/authSlice';
import { can } from '../../utils/permissions';

// Wrap an admin page. If the logged-in admin lacks the permission,
// show an access-denied panel instead of the page.
export default function RequirePermission({ permission, children }) {
  const permissions = useSelector(selectPermissions);
  if (can(permissions, permission)) return children;

  return (
    <div className="card p-10 text-center max-w-md mx-auto mt-10">
      <ShieldAlert size={40} className="mx-auto text-amber-500" />
      <h2 className="text-lg font-extrabold mt-3">Access restricted</h2>
      <p className="text-sm text-ink-500 mt-1">
        Your account does not have permission to view this section. Contact the store
        owner if you believe this is a mistake.
      </p>
      <Link to="/admin" className="btn-primary mt-4 inline-flex">Back to Dashboard</Link>
    </div>
  );
}
