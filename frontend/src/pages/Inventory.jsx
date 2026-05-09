import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../store/productSlice";
import { fetchSettings, updateSettings } from "../store/settingsSlice";
import toast from "react-hot-toast";

const Inventory = () => {
  const dispatch = useDispatch();
  const { items: products, loading: productsLoading } = useSelector(
    (state) => state.products,
  );
  const { data: settings, loading: settingsLoading } = useSelector(
    (state) => state.settings,
  );
  const { user } = useSelector((state) => state.auth);

  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) setSettingsForm(settings);
  }, [settings]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...productForm,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
    };
    if (editingProduct) {
      await dispatch(updateProduct({ id: editingProduct._id, data }));
      toast.success("Product updated");
    } else {
      await dispatch(createProduct(data));
      toast.success("Product added");
    }
    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({ name: "", category: "", price: "", stock: "" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      await dispatch(deleteProduct(id));
      toast.success("Product deactivated");
    }
  };

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    await dispatch(updateSettings(settingsForm));
    toast.success("Settings updated");
  };

  if (user?.role !== "admin")
    return (
      <div className="text-center mt-10 text-red-500">
        Access denied. Admins only.
      </div>
    );

  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-light p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-cafe-teal mb-6">
          Inventory & Settings
        </h1>

        {/* Settings Section */}
        <div className="bg-cafe-deep rounded-xl p-6 mb-8 border border-cafe-mid">
          <h2 className="text-xl font-semibold mb-4">Cafe Settings</h2>
          {settingsLoading ? (
            <p>Loading settings...</p>
          ) : (
            <form onSubmit={handleSettingsUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">
                    Single Chair - Standard (per hour)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.singlePriceStandard ?? ""}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        singlePriceStandard: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Single Chair - Premium (per hour)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.singlePricePremium ?? ""}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        singlePricePremium: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Double Chair - Standard (per hour)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.doublePriceStandard ?? ""}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        doublePriceStandard: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Double Chair - Premium (per hour)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.doublePricePremium ?? ""}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        doublePricePremium: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Default Discount (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settingsForm.discountPercent ?? ""}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        discountPercent: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Minutes Unit (billing)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.minutesUnit ?? 10}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        minutesUnit: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Round Up Threshold (minutes)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.roundUpThreshold ?? 7}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        roundUpThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Cafe Name</label>
                  <input
                    type="text"
                    value={settingsForm.cafeName || ""}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        cafeName: e.target.value,
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Phone</label>
                  <input
                    type="text"
                    value={settingsForm.cafePhone || ""}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        cafePhone: e.target.value,
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Currency</label>
                  <input
                    type="text"
                    value={settingsForm.currency || "SYP"}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        currency: e.target.value,
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Total Chairs</label>
                  <input
                    type="number"
                    value={settingsForm.totalChairs ?? 100}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        totalChairs: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="bg-cafe-teal hover:bg-cafe-mid px-4 py-2 rounded"
                >
                  Save Settings
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Products Section */}
        <div className="bg-cafe-deep rounded-xl p-6 border border-cafe-mid">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-semibold">Products</h2>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: "",
                  category: "",
                  price: "",
                  stock: "",
                });
                setShowProductModal(true);
              }}
              className="bg-cafe-teal hover:bg-cafe-mid px-4 py-2 rounded"
            >
              + Add Product
            </button>
          </div>
          {productsLoading ? (
            <p>Loading products...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-cafe-mid">
                  <tr>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left">Category</th>
                    <th className="text-left">Price</th>
                    <th className="text-left">Stock</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id} className="border-b border-cafe-mid/50">
                      <td className="py-2">{p.name}</td>
                      <td>{p.category}</td>
                      <td>{p.price}</td>
                      <td>{p.stock}</td>
                      <td>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setProductForm({
                              name: p.name,
                              category: p.category,
                              price: p.price,
                              stock: p.stock,
                            });
                            setShowProductModal(true);
                          }}
                          className="text-cafe-teal mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="text-red-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        No products yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-cafe-deep rounded-xl p-6 w-full max-w-md border border-cafe-mid">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? "Edit Product" : "New Product"}
            </h2>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({ ...productForm, category: e.target.value })
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({ ...productForm, price: e.target.value })
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                required
              />
              <input
                type="number"
                placeholder="Stock"
                value={productForm.stock}
                onChange={(e) =>
                  setProductForm({ ...productForm, stock: e.target.value })
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cafe-teal"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
