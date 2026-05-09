import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// جلب جميع المنتجات
export const fetchProducts = createAsyncThunk("products/fetch", async () => {
  const response = await api.get("/products");
  return response.data;
});

// إضافة منتج جديد
export const createProduct = createAsyncThunk(
  "products/create",
  async (product) => {
    const response = await api.post("/products", product);
    return response.data;
  },
);

// تعديل منتج
export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, data }) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
);

// حذف منتج (تعطيله)
export const deleteProduct = createAsyncThunk("products/delete", async (id) => {
  await api.delete(`/products/${id}`);
  return id;
});

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (p) => p._id === action.payload._id,
        );
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
      });
  },
});

export default productSlice.reducer;
