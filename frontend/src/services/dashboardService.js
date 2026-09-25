import api from "./api";

export async function getDashboardData() {
  const response = await api.get("/dashboard/");
  return response.data;
}

export async function getRagRequests(
  limit = 20,
  offset = 0,
  startDate = "",
  endDate = ""
) {
  const params = {
    limit,
    offset,
  };

  if (startDate) {
    params.start_date = startDate;
  }

  if (endDate) {
    params.end_date = endDate;
  }

  const response = await api.get("/dashboard/rag-requests", {
    params,
  });

  return response.data;
}

export async function getRagRequestDetails(requestId) {
  const response = await api.get(
    `/dashboard/rag-requests/${requestId}`
  );

  return response.data;
}

export async function getRagAnalyticsTrends(
  startDate = "",
  endDate = ""
) {
  const params = {};

  if (startDate) {
    params.start_date = startDate;
  }

  if (endDate) {
    params.end_date = endDate;
  }

  const response = await api.get(
    "/dashboard/rag-analytics/trends",
    {
      params,
    }
  );

  return response.data;
}