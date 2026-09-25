import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Spinner from "../components/common/Spinner/Spinner";
import { useAuth } from "../context/AuthContext";


function ProtectedRoute() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  const location =
    useLocation();


  if (isLoading) {
    return (
      <Spinner
        size="large"
        fullScreen
      />
    );
  }


  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }


  return <Outlet />;
}


export default ProtectedRoute;