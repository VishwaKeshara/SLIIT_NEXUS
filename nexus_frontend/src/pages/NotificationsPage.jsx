import { useEffect, useState } from "react";
import { notificationApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const NotificationsPage = () => {
  const { unreadCount, setUnreadCount } = useAuth();
  const [items, setItems] = useState([]);

  const loadNotifications = async () => {
    const { data } = await notificationApi.list();
    setItems(data);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    await notificationApi.markAllAsRead();
    setUnreadCount(0);
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-28">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Inbox</p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">Notifications and activity updates.</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Review booking approvals, incident progress, and collaboration updates in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {unreadCount} unread
            </div>
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Mark all read
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {items.length === 0 && (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
              No notifications yet.
            </div>
          )}

          {items.map((item) => (
            <article
              key={item.id}
              className={`rounded-[1.75rem] border p-6 shadow-sm ${
                item.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.type.replaceAll("_", " ")}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{item.title}</h2>
                  <p className="mt-3 text-slate-600">{item.message}</p>
                </div>
                {!item.read && <span className="mt-1 h-3 w-3 rounded-full bg-blue-500" />}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default NotificationsPage;
