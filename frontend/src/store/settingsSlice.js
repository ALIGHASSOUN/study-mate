import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// جلب الإعدادات الحالية
export const fetchSettings = createAsyncThunk("settings/fetch", async () => {
  const response = await api.get("/settings");
  return response.data;
});

// تحديث الإعدادات
export const updateSettings = createAsyncThunk(
  "settings/update",
  async (data) => {
    const response = await api.put("/settings", data);
    return response.data;
  },
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.data = action.payload;
      });
  },
});

export default settingsSlice.reducer;
