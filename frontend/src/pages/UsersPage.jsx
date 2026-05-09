import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import { X, Edit, Trash2, Plus } from "lucide-react";

const UsersPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", password: "" });

  const fetchCashiers = async () => {
    try {
      const res = await api.get("/users");
      setCashiers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const data = {};
        if (form.password) data.password = form.password;
        await api.put(`/users/${editing._id}`, data);
        toast.success("User updated");
      } else {
        await api.post("/users", {
          username: form.username,
          password: form.password,
        });
        toast.success("Cashier created");
      }
      setShowModal(false);
      setEditing(null);
      setForm({ username: "", password: "" });
      fetchCashiers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this cashier?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Cashier deactivated");
      fetchCashiers();
    } catch (err) {
      toast.error("Failed to deactivate");
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="text-center mt-10 text-red-500">
        Access denied. Admins only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-light p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cafe-teal">
            Cashier Accounts
          </h1>
          <button
            onClick={() => {
              setEditing(null);
              setForm({ username: "", password: "" });
              setShowModal(true);
            }}
            className="bg-cafe-teal hover:bg-cafe-mid px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={18} /> Add Cashier
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-cafe-deep rounded-xl border border-cafe-mid overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-cafe-mid bg-cafe-mid/20">
                <tr>
                  <th className="text-left py-3 px-4">Username</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cashiers.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-cafe-mid/30 hover:bg-cafe-mid/10"
                  >
                    <td className="py-3 px-4 font-medium">{c.username}</td>
                    <td className="py-3 px-4">{c.role}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          c.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(c);
                          setForm({ username: c.username, password: "" });
                          setShowModal(true);
                        }}
                        className="text-cafe-teal hover:text-white"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {cashiers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-cafe-gray">
                      No cashier accounts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-cafe-deep rounded-xl p-6 w-full max-w-md border border-cafe-mid">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editing ? "Edit Cashier" : "New Cashier"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editing && (
                <input
                  type="text"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  required
                />
              )}
              <input
                type="password"
                placeholder={editing ? "New password (leave empty to keep)" : "Password"}
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                required={!editing}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cafe-teal"
                >
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
