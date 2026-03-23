import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import GlobalListener from "./components/GlobalListener";
import { Toaster } from 'react-hot-toast';
import { Suspense, useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <GlobalListener />

      <Suspense fallback={
        <div className="global-loading">
          <ClipLoader color="#2563eb" size={60} />
          <p>Loading...</p>
        </div>
      }>
        <main className="main-content">
          <AppRoutes />
        </main>
      </Suspense>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4500,
          style: {
            borderRadius: '12px',
            background: '#1f2937',
            color: '#f1f5f9',
            padding: '14px 22px',
            fontSize: '16px',
          },
        }}
      />
      <Footer />
    </>

  );
}

export default App;   