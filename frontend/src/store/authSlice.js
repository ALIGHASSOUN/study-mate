import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// Helpers for localStorage
const loadUser = () => {
  const stored = localStorage.getItem("auth_user");
  if (stored) {
    try {
      const { user, expiresAt } = JSON.parse(stored);
      if (expiresAt && new Date(expiresAt) > new Date()) {
        return { user, isAuthenticated: true, role: user.role };
      } else {
        localStorage.removeItem("auth_user");
      }
    } catch (e) {}
  }
  return { user: null, isAuthenticated: false, role: null };
};

const saveUser = (user) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 18); // 18 hours
  localStorage.setItem(
    "auth_user",
    JSON.stringify({ user, expiresAt: expiresAt.toISOString() }),
  );
};

const clearUser = () => {
  localStorage.removeItem("auth_user");
};

export const loginStep1 = createAsyncThunk(
  "auth/loginStep1",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", { username, password });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  },
);

export const verifyCode = createAsyncThunk(
  "auth/verifyCode",
  async ({ sessionId, code }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/verify-code", { sessionId, code });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Verification failed",
      );
    }
  },
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/me");
      return res.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Not authenticated",
      );
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
      clearUser();
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  },
);

const initialState = {
  loading: false,
  error: null,
  tempSessionId: null,
  requiresCode: false,
  ...loadUser(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;
      state.tempSessionId = null;
      state.requiresCode = false;
      clearUser();
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN STEP 1
      .addCase(loginStep1.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginStep1.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.role === "admin") {
          const user = { role: "admin", username: "admin" };
          state.user = user;
          state.isAuthenticated = true;
          state.role = "admin";
          saveUser(user);
        } else if (action.payload.requiresCode) {
          state.requiresCode = true;
          state.tempSessionId = action.payload.sessionId;
          state.role = "cashier";
        }
      })
      .addCase(loginStep1.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // VERIFY CODE
      .addCase(verifyCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyCode.fulfilled, (state, action) => {
        state.loading = false;
        const user = { role: action.payload.role };
        state.user = user;
        state.isAuthenticated = true;
        state.role = action.payload.role;
        state.requiresCode = false;
        state.tempSessionId = null;
        saveUser(user);
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // FETCH ME
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.role = action.payload.role;
        saveUser(action.payload);
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        // إذا كان هناك مستخدم مخزَّن محلياً صالح، استخدمه
        const stored = loadUser();
        if (stored.isAuthenticated) {
          state.user = stored.user;
          state.isAuthenticated = true;
          state.role = stored.role;
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.role = null;
        }
      })
      // LOGOUT
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.role = null;
        state.tempSessionId = null;
        state.requiresCode = false;
        clearUser();
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
