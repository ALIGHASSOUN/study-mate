import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex items-center justify-center bg-cafe-dark">
        <div className="p-10 bg-cafe-primary rounded-xl shadow-2xl border border-cafe-muted">
          <h1 className="text-3xl font-bold text-cafe-accent mb-4">
            Study Cafe System
          </h1>
          <p className="text-cafe-cool">
            لوحة الألوان تعمل بنجاح! جاهزون للانطلاق.
          </p>
          <button className="mt-6 px-6 py-2 bg-cafe-cool text-cafe-dark font-bold rounded-lg hover:bg-cafe-accent transition-colors">
            ابدأ العمل
          </button>
        </div>
      </div>
    </Router>
  );
}

export default App;
