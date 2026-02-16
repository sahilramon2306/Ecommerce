import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import { ClipLoader } from 'react-spinners';

function App() {
  return (
    <>
      <Navbar />

      {/* Global loading fallback for lazy routes / components */}
      <Suspense fallback={
        <div className="global-loading">
          <ClipLoader color="#2563eb" size={60} speedMultiplier={0.9} />
          <p>Loading...</p>
        </div>
      }>
        <main className="main-content">
          <AppRoutes />
        </main>
      </Suspense>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={16}
        containerStyle={{
          marginTop: '70px', // space below navbar
        }}
        toastOptions={{
          duration: 4500,
          style: {
            borderRadius: '12px',
            background: '#1f2937',
            color: '#f1f5f9',
            padding: '14px 22px',
            fontSize: '16px',
            maxWidth: '480px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
          },
          success: {
            style: {
              background: '#10b981',
              color: 'white',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: 'white',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#ef4444',
            },
          },
          loading: {
            style: {
              background: '#374151',
              color: '#f3f4f6',
            },
          },
        }}
      />
    </>
  );
}

export default App;