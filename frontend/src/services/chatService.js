import api from "./api";

export async function getConversations() {
  const response = await api.get("/conversations/");
  return response.data;
}

export async function getConversation(
  conversationId
) {
  const response = await api.get(
    `/conversations/${conversationId}`
  );

  return response.data;
}

export async function sendChatMessage(
  question,
  conversationId = null,
  documentIds = null
) {
  const payload = {
    question,
    top_k: 5,
  };

  if (conversationId !== null) {
    payload.conversation_id = conversationId;
  }

  if (
    Array.isArray(documentIds) &&
    documentIds.length > 0
  ) {
    payload.document_ids = documentIds;
  }

  const response = await api.post(
    "/chat/",
    payload
  );

  return response.data;
}

export async function deleteConversation(
  conversationId
) {
  const response = await api.delete(
    `/conversations/${conversationId}`
  );

  return response.data;
}