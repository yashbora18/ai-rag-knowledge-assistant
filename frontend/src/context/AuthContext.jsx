import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

import {
  getAccessToken,
  removeAccessToken,
} from "../services/authService";


const AuthContext =
  createContext(null);


export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);


  const loadCurrentUser =
    useCallback(async () => {
      const token =
        getAccessToken();

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return null;
      }

      setIsLoading(true);

      try {
        const response =
          await api.get(
            "/users/me"
          );

        setUser(response.data);

        return response.data;
      } catch (error) {
        removeAccessToken();
        setUser(null);

        return null;
      } finally {
        setIsLoading(false);
      }
    }, []);


  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);


  const logout = useCallback(() => {
    removeAccessToken();
    setUser(null);
  }, []);


  const value = {
    user,
    isLoading,
    isAuthenticated:
      Boolean(user),
    logout,
    refreshUser:
      loadCurrentUser,
  };


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}