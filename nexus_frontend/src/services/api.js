import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true,
});

export const authApi = {
  me: () => API.get("/auth/me"),
  login: (payload) => API.post("/auth/login", payload),
  signup: (payload) => API.post("/auth/signup", payload),
  devLogin: (email) => API.post("/auth/dev-login", { email }),
  updateAccount: (payload) => API.patch("/auth/account", payload),
  deleteAccount: () => API.delete("/auth/account"),
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

export const resourceApi = {
  list: () => API.get("/resources"),
  create: (payload) => API.post("/resources", payload),
  update: (resourceId, payload) => API.put(`/resources/${resourceId}`, payload),
  remove: (resourceId) => API.delete(`/resources/${resourceId}`),
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
  createUser: (payload) => API.post("/admin/users", payload),
  updateUser: (userId, payload) => API.put(`/admin/users/${userId}`, payload),
  updateRoles: (userId, roles) =>
    API.patch(`/admin/users/${userId}/roles`, { roles }),
  deleteUser: (userId) => API.delete(`/admin/users/${userId}`),
};

export default API;
