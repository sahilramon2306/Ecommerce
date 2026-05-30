import { Suspense, useEffect, useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import GlobalListener from "./components/GlobalListener";
import "./App.css";

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  const toastOptions = useMemo(
    () => ({
      duration: 4200,
      style: {
        border: `1px solid ${isDark ? "rgba(148, 163, 184, 0.18)" : "rgba(15, 23, 42, 0.08)"}`,
        borderRadius: "10px",
        background: isDark ? "#111827" : "#ffffff",
        color: isDark ? "#f8fafc" : "#0f172a",
        boxShadow: isDark
          ? "0 18px 50px rgba(0, 0, 0, 0.36)"
          : "0 18px 50px rgba(15, 23, 42, 0.12)",
        padding: "14px 18px",
        fontSize: "0.95rem",
        fontWeight: 650,
      },
      success: {
        iconTheme: {
          primary: "#0f6b5f",
          secondary: "#ffffff",
        },
      },
      error: {
        iconTheme: {
          primary: "#dc2626",
          secondary: "#ffffff",
        },
      },
    }),
    [isDark]
  );

  return (
    <div className="app-layout">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <GlobalListener />

      <Suspense fallback={<AppLoading />}>
        <main className="main-content" id="main-content">
          <AppRoutes />
        </main>
      </Suspense>

      <Footer />

      <Toaster
        position="top-center"
        gutter={12}
        containerClassName="app-toaster"
        toastOptions={toastOptions}
      />
    </div>
  );
}

function AppLoading() {
  return (
    <main className="main-content main-content--loading" aria-live="polite">
      <section className="global-loading" aria-label="Loading page content">
        <div className="global-loading__card">
          <ClipLoader color="#0f6b5f" size={46} speedMultiplier={0.9} />
          <div>
            <h1>Preparing your experience</h1>
            <p>Loading SahimonCart...</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
