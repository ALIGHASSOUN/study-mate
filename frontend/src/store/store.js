import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import productReducer from "./productSlice";
import settingsReducer from "./settingsSlice";
import reservationReducer from "./reservationSlice"; // ✅ تأكد من هذا السطر

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    settings: settingsReducer,
    reservations: reservationReducer, // ✅ وهذا السطر
  },
});
