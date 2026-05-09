import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchActiveReservations = createAsyncThunk(
  "reservations/fetchActive",
  async () => {
    const response = await api.get("/reservations/active");
    return response.data;
  },
);

export const createReservation = createAsyncThunk(
  "reservations/create",
  async (data) => {
    const response = await api.post("/reservations", data);
    return response.data;
  },
);

export const addItem = createAsyncThunk(
  "reservations/addItem",
  async ({ id, productId, quantity }) => {
    const response = await api.post(`/reservations/${id}/items`, {
      productId,
      quantity,
    });
    return response.data;
  },
);

export const removeItem = createAsyncThunk(
  "reservations/removeItem",
  async ({ id, itemId }) => {
    const response = await api.delete(`/reservations/${id}/items/${itemId}`);
    return response.data;
  },
);

export const closeReservation = createAsyncThunk(
  "reservations/close",
  async ({ id, applyDiscount, discountPercent }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/invoices/reservations/${id}/close`, {
        applyDiscount,
        discountPercentOverride: discountPercent,
      });
      return response.data; // returns invoice
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to close",
      );
    }
  },
);

const reservationSlice = createSlice({
  name: "reservations",
  initialState: {
    active: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveReservations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveReservations.fulfilled, (state, action) => {
        state.loading = false;
        state.active = action.payload;
      })
      .addCase(fetchActiveReservations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.active.push(action.payload);
      })
      .addCase(addItem.fulfilled, (state, action) => {
        const index = state.active.findIndex(
          (r) => r._id === action.payload._id,
        );
        if (index !== -1) state.active[index] = action.payload;
      })
      .addCase(removeItem.fulfilled, (state, action) => {
        const index = state.active.findIndex(
          (r) => r._id === action.payload._id,
        );
        if (index !== -1) state.active[index] = action.payload;
      })
      .addCase(closeReservation.pending, (state) => {
        state.loading = true;
      })
      .addCase(closeReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.active = state.active.filter(
          (r) => r._id !== action.payload.reservationId,
        );
      })
      .addCase(closeReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default reservationSlice.reducer;
