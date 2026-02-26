import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const ProtectedAdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await axiosInstance.get("/get-User-Profile");
        if (res.data.success && res.data.data?.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [location.pathname]);

  if (loading) return <div className="loading-spinner">Checking access...</div>;

  return isAdmin ? children : <Navigate to="/login" replace />;
};

export default ProtectedAdminRoute;