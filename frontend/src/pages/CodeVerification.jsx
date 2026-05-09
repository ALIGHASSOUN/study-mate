import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { verifyCode } from "../store/authSlice";
import toast from "react-hot-toast";

const CodeVerification = () => {
  const [code, setCode] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tempSessionId, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!tempSessionId) {
      navigate("/login");
    }
    if (error) {
      toast.error(error);
    }
  }, [tempSessionId, navigate, error]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 4) {
      toast.error("Please enter 4-digit code");
      return;
    }
    try {
      const result = await dispatch(
        verifyCode({ sessionId: tempSessionId, code: fullCode }),
      ).unwrap();
      if (result.role === "cashier") {
        navigate("/");
      }
    } catch (err) {
      toast.error(err);
      setCode(["", "", "", ""]);
      inputRefs.current[0].focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cafe-dark px-4">
      <div className="w-full max-w-md bg-cafe-deep rounded-2xl shadow-2xl p-8 border border-cafe-mid">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cafe-teal">
            Cashier Verification
          </h1>
          <p className="text-cafe-light mt-2">
            Enter the 4-digit code provided by admin
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-4">
            {code.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                ref={(el) => (inputRefs.current[idx] = el)}
                className="w-16 h-16 text-center text-2xl font-bold rounded-xl bg-cafe-mid/30 border border-cafe-mid text-cafe-light focus:outline-none focus:ring-2 focus:ring-cafe-teal"
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cafe-teal hover:bg-cafe-mid text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CodeVerification;
