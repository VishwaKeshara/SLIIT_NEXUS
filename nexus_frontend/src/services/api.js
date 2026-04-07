import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true,
});

export const authApi = {
  me: () => API.get("/auth/me"),
  devLogin: (email) => API.post("/auth/dev-login", { email }),
  logout: () => API.post("/auth/logout"),
  googleLoginUrl: "http://localhost:8080/oauth2/authorization/google",
};

export const notificationApi = {
  list: () => API.get("/notifications"),
  summary: () => API.get("/notifications/summary"),
  markAllAsRead: () => API.patch("/notifications/read-all"),
};

export const bookingApi = {
  list: () => API.get("/bookings"),
  updateStatus: (bookingId, status) =>
    API.patch(`/bookings/${bookingId}/status`, { status }),
};

export const ticketApi = {
  list: () => API.get("/tickets"),
  updateStatus: (ticketId, status) =>
    API.patch(`/tickets/${ticketId}/status`, { status }),
  addComment: (ticketId, content) =>
    API.post(`/tickets/${ticketId}/comments`, { content }),
};

export const adminApi = {
  listUsers: () => API.get("/admin/users"),
  updateRoles: (userId, roles) =>
    API.patch(`/admin/users/${userId}/roles`, { roles }),
};

export default API;
