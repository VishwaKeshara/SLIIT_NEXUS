import { useEffect, useState } from "react";
import { notificationApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const NotificationPanel = () => {
  const { user, unreadCount, setUnreadCount } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user || !open) {
      return;
    }

    const loadNotifications = async () => {
      const { data } = await notificationApi.list();
      setItems(data);
    };

    loadNotifications();
  }, [open, user]);

  if (!user) {
    return null;
  }

  const markAllRead = async () => {
    await notificationApi.markAllAsRead();
    setUnreadCount(0);
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[22rem] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Alerts and updates</p>
              <p className="text-xs text-slate-500">Booking, ticket, and comment notifications.</p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              Mark all read
            </button>
          </div>

          <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
            {items.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No notifications yet.
              </div>
            )}

            {items.map((item) => (
              <article
                key={item.id}
                className={`rounded-xl border p-3 ${
                  item.read ? "border-slate-200 bg-slate-50" : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  </div>
                  {!item.read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />}
                </div>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  {item.type.replaceAll("_", " ")}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
