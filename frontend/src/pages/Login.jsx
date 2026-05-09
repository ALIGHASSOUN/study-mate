import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginStep1 } from "../store/authSlice";
import toast from "react-hot-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }
    setLoading(true);
    try {
      const result = await dispatch(
        loginStep1({ username, password })
      ).unwrap();
      if (result.role === "admin") {
        navigate("/");
      } else if (result.role === "cashier") {
        navigate("/login/code");
      }
    } catch (err) {
      // err from rejectWithValue is a string
      toast.error(typeof err === "string" ? err : err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cafe-dark px-4">
      <div className="w-full max-w-md bg-cafe-deep rounded-2xl shadow-2xl p-8 border border-cafe-mid">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cafe-teal">Study Cafe</h1>
          <p className="text-cafe-light mt-2">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-cafe-light mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-cafe-mid/30 border border-cafe-mid text-cafe-light focus:outline-none focus:ring-2 focus:ring-cafe-teal focus:border-transparent transition"
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-cafe-light mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-cafe-mid/30 border border-cafe-mid text-cafe-light focus:outline-none focus:ring-2 focus:ring-cafe-teal focus:border-transparent transition"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cafe-teal hover:bg-cafe-mid text-white font-semibold py-3 rounded-xl transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
