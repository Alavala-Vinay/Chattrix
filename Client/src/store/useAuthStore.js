import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : "https://chattrix-y8fo.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // ✅ Check auth
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.error("❌ Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ✅ Signup
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("✅ Account created successfully");
      get().connectSocket();
    } catch (error) {
      console.error("❌ Signup error:", error);
      toast.error(error?.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  // ✅ Login
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("✅ Logged in successfully");
      get().connectSocket();
    } catch (error) {
      console.error("❌ Login error:", error);
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ✅ Logout
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("✅ Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.error("❌ Logout error:", error);
      toast.error(error?.response?.data?.message || "Logout failed");
    }
  },

  // ✅ Update Profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      let res;

      if (data.profilePic instanceof File) {
        // send as FormData if file provided
        const formData = new FormData();
        formData.append("profilePic", data.profilePic);
        res = await axiosInstance.put("/auth/update-profile", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // send as JSON
        res = await axiosInstance.put("/auth/update-profile", data, {
          headers: { "Content-Type": "application/json" },
        });
      }

      set({ authUser: res.data });
      toast.success("✅ Profile updated successfully");
    } catch (error) {
      console.error("❌ Update profile error:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // ✅ Connect socket
  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;

    // If already connected, do nothing
    if (socket?.connected) return;

    // Disconnect old socket if any
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    const newSocket = io(BASE_URL, {
      auth: { userId: authUser._id },
      transports: ["websocket"], // 🔑 helps avoid polling fallback
      reconnection: true,
    });

    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  // ✅ Disconnect socket
  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.removeAllListeners();
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
      console.log("✅ Socket disconnected manually");
    }
  },
}));
