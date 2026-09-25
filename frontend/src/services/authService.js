import api from "./api";


const ACCESS_TOKEN_KEY =
  "rag-access-token";


export async function registerUser(
  userData
) {
  const response = await api.post(
    "/auth/register",
    userData
  );

  return response.data;
}


export async function loginUser(
  credentials
) {
  const response = await api.post(
    "/auth/login",
    credentials
  );

  return response.data;
}


export function saveAccessToken(
  token
) {
  if (!token) {
    throw new Error(
      "Access token is required."
    );
  }

  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    token
  );
}


export function getAccessToken() {
  return localStorage.getItem(
    ACCESS_TOKEN_KEY
  );
}


export function removeAccessToken() {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );
}


export async function requestPasswordReset(
  data
) {
  const response = await api.post(
    "/auth/forgot-password",
    data
  );

  return response.data;
}


export async function resetPassword(
  token,
  newPassword
) {
  const response = await api.post(
    "/auth/reset-password",
    {
      token,
      new_password: newPassword,
    }
  );

  return response.data;
}