import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE || "https://plusbooks-backend.onrender.com";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// Ajoute automatiquement le token si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ======================
   Ebooks
   ====================== */
export const fetchEbooks = (page = 1) =>
  api.get(`/ebooks?page=${page}`).then((r) => r.data);

export const fetchEbook = (id) =>
  api.get(`/ebooks/${id}`).then((r) => r.data);

export const createEbook = (data) =>
  api.post(`/ebooks`, data).then((r) => r.data);

/* ======================
   Auth
   ====================== */
export const register = (payload) =>
  api.post(`/register`, payload).then((r) => r.data);

export const login = (payload) =>
  api.post(`/login`, payload).then((r) => r.data);

export const me = () => api.get(`/me`).then((r) => r.data);

export const logout = () => api.post(`/logout`);

/* ======================
   Contact (public)
   ====================== */
export const sendContact = (payload) =>
  api.post(`/contact`, payload).then((r) => r.data);

/* ======================
   Community (posts)
   ====================== */
export const fetchPosts = (page = 1) =>
  api.get(`/posts?page=${page}`).then((r) => r.data);

export const fetchPost = (id) =>
  api.get(`/posts/${id}`).then((r) => r.data);

export const createPost = (payload) =>
  api.post(`/posts`, payload).then((r) => r.data);

export const fetchPostComments = (postId) =>
  api.get(`/posts/${postId}/comments`).then((r) => r.data);

export const addComment = (postId, payload) =>
  api.post(`/posts/${postId}/comments`, payload).then((r) => r.data);

/* ======================
   Messages (privés)
   ====================== */
export const fetchThread = (userId) =>
  api.get(`/messages/with/${userId}`).then((r) => r.data);

export const sendMessage = (payload) =>
  api.post(`/messages`, payload).then((r) => r.data);

export const unreadCount = () =>
  api.get(`/messages/unread_count`).then((r) => r.data);

/* ======================
   Groups
   ====================== */
export const fetchGroups = () =>
  api.get(`/groups`).then((r) => r.data);

export const fetchGroup = (id) =>
  api.get(`/groups/${id}`).then((r) => r.data);

export const createGroup = (payload) =>
  api.post(`/groups`, payload).then((r) => r.data);

export const joinGroup = (id) =>
  api.post(`/groups/${id}/join`).then((r) => r.data);

export const leaveGroup = (id) =>
  api.post(`/groups/${id}/leave`).then((r) => r.data);

export default api;
