import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';
import { vendorNotificationsApi, vendorMarkNotificationReadApi, vendorMarkAllNotificationsReadApi } from '../../api/client';
import { enableAppPush, pushForNewNotifications, tryRefreshFcmToken } from '../../utils/pushNotifications';

export default function VendorNotifications() {
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pushOn, setPushOn] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted');

  const load = () => vendorNotificationsApi()
    .then((d) => {
      const prev = new Set(list.map((n) => n.id));
      pushForNewNotifications(d?.notifications || [], prev);
      setList(d?.notifications || []);
      setUnread(d?.unread ?? 0);
    })
    .finally(() => setLoading(false));

  useEffect(() => {
    load();
    tryRefreshFcmToken('vendor');
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const enablePush = async () => {
    const { status, reason } = await enableAppPush({ userType: 'vendor' });
    setPushOn(status === 'granted');
    if (status === 'granted') toast.success('Push notifications enabled (Firebase FCM)');
    else if (status === 'denied') toast.error('Notifications blocked in browser settings');
    else toast.error(reason ? `Could not enable push: ${reason}` : 'Could not enable push notifications');
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><Bell size={20} /> Notifications {unread > 0 && <span className="badge bg-brand-50 text-brand-700 text-sm">{unread}</span>}</h1>
          <p className="text-sm text-ink-500">New orders, listing updates and platform alerts.</p>
        </div>
        <div className="flex gap-2">
          {!pushOn && <button type="button" onClick={enablePush} className="btn-outline !py-2 !px-3 text-xs">Enable push</button>}
          {unread > 0 && <button type="button" onClick={() => vendorMarkAllNotificationsReadApi().then(load)} className="btn-ghost !py-2 !px-3 text-xs">Mark all read</button>}
        </div>
      </header>
      {loading ? <div className="text-ink-500">Loading...</div> : list.length === 0 ? (
        <div className="card p-8 text-center text-ink-500 text-sm">No notifications yet.</div>
      ) : (
        <div className="card divide-y divide-ink-100 dark:divide-white/10">
          {list.map((n) => (
            <div key={n.id} className={`p-4 flex gap-3 ${!n.read ? 'bg-brand-50/50' : ''}`}>
              <Bell size={18} className="text-brand-700 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{n.title}</div>
                {n.body && <p className="text-xs text-ink-500 mt-1">{n.body}</p>}
                {n.link && <a href={n.link} className="text-xs text-brand-700 font-semibold mt-2 inline-block">Open →</a>}
              </div>
              {!n.read && (
                <button type="button" onClick={() => vendorMarkNotificationReadApi(n.id).then(load)} className="text-xs text-brand-700 font-semibold shrink-0">Read</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
