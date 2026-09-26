import api from "./api";

export async function getDocuments(search = "") {
  const response = await api.get("/documents/", {
    params: search.trim()
      ? { search: search.trim() }
      : {},
  });

  return response.data;
}

export async function getDocument(documentId) {
  const response = await api.get(
    `/documents/${documentId}`
  );

  return response.data;
}

export async function deleteDocument(documentId) {
  const response = await api.delete(
    `/documents/${documentId}`
  );

  return response.data;
}

export async function createDocument(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/documents/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },

      // First upload can take longer because
      // the embedding model loads on demand.
      timeout: 180000,
    }
  );

  return response.data;
}

// Alias kept for compatibility with other components.
export async function uploadDocument(file) {
  return createDocument(file);
}