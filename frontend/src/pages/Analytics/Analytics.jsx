import {

  Activity,

  AlertCircle,
  AlertTriangle,

  ArrowLeft,

  ArrowRight,

  BarChart3,

  CheckCircle2,

  CircleCheck,

  CircleX,

  Clock3,

  Cpu,

  Database,

  FileText,

  Gauge,
  Lightbulb,

  MessageSquareText,

  RefreshCw,

  Sparkles,
  ShieldCheck,

  Target,

  Timer,
  TrendingDown,

  TrendingUp,

  X,

  Zap,

} from "lucide-react";







import { useEffect, useMemo, useState } from "react";







import { useNavigate } from "react-router-dom";















import Navbar from "../../components/layout/Navbar/Navbar";







import Sidebar from "../../components/layout/Sidebar/Sidebar";





import {

  getDashboardData,

  getRagRequests,

  getRagRequestDetails,

  getRagAnalyticsTrends,

} from "../../services/dashboardService";







import { useToast } from "../../hooks/useToast";















import "./Analytics.css";























function formatMilliseconds(value) {







  if (value === null || value === undefined) {







    return "0 ms";







  }















  const milliseconds = Number(value);















  if (!Number.isFinite(milliseconds)) {







    return "0 ms";







  }















  if (milliseconds >= 1000) {







    return `${(milliseconds / 1000).toFixed(2)} s`;







  }















  return `${Math.round(milliseconds)} ms`;







}























function formatSimilarity(value) {







  if (







    value === null ||







    value === undefined ||







    value === ""







  ) {







    return "—";







  }















  const similarity = Number(value);















  if (!Number.isFinite(similarity)) {







    return "—";







  }















  return `${(similarity * 100).toFixed(1)}%`;







}























function formatDateTime(value) {







  if (!value) {







    return "Unknown";







  }















  const date = new Date(value);















  if (Number.isNaN(date.getTime())) {







    return "Unknown";







  }















  return date.toLocaleString(undefined, {







    day: "numeric",







    month: "short",







    hour: "numeric",







    minute: "2-digit",







  });







}























function getQualityLabel(value) {







  if (!value) {







    return "No data";







  }















  const labels = {







    no_data: "No data",







    low: "Low",







    moderate: "Moderate",







    good: "Good",







  };















  return labels[value] || value;







}























function formatTrendDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}


function buildAnalyticsInsights(trends = []) {
  if (!trends.length) {
    return [
      {
        type: "info",
        icon: Sparkles,
        title: "Not enough data yet",
        description:
          "Run a few AI knowledge queries to generate meaningful analytics insights.",
        recommendation:
          "Upload documents and use AI Chat to build your RAG activity history.",
      },
    ];
  }

  const totalRequests = trends.reduce(
    (sum, item) => sum + Number(item.total_requests || 0),
    0
  );
  const successfulRequests = trends.reduce(
    (sum, item) => sum + Number(item.successful_requests || 0),
    0
  );
  const failedRequests = trends.reduce(
    (sum, item) => sum + Number(item.failed_requests || 0),
    0
  );
  const averageSimilarity =
    trends.reduce(
      (sum, item) => sum + Number(item.average_similarity || 0),
      0
    ) / trends.length;
  const averageRetrievalTime =
    trends.reduce(
      (sum, item) => sum + Number(item.average_retrieval_time_ms || 0),
      0
    ) / trends.length;
  const averageGenerationTime =
    trends.reduce(
      (sum, item) => sum + Number(item.average_generation_time_ms || 0),
      0
    ) / trends.length;
  const averageTotalTime =
    trends.reduce(
      (sum, item) => sum + Number(item.average_total_time_ms || 0),
      0
    ) / trends.length;
  const successRate =
    totalRequests > 0
      ? (successfulRequests / totalRequests) * 100
      : 0;

  const busiestDay = trends.reduce(
    (current, item) =>
      Number(item.total_requests || 0) >
      Number(current?.total_requests || 0)
        ? item
        : current,
    trends[0]
  );

  const insights = [];

  if (totalRequests >= 5) {
    insights.push({
      type: "usage",
      icon: TrendingUp,
      title: "RAG activity is being used",
      description: `${totalRequests} RAG requests were recorded across the selected period.`,
      recommendation: `Your busiest day recorded ${busiestDay?.total_requests || 0} requests. Use this activity pattern when evaluating system capacity.`,
    });
  } else {
    insights.push({
      type: "info",
      icon: Sparkles,
      title: "More usage data will improve insights",
      description: `${totalRequests} RAG request${totalRequests === 1 ? "" : "s"} recorded across the selected period.`,
      recommendation:
        "Continue using AI Chat so the analytics can identify stronger usage and performance patterns.",
    });
  }

  if (averageSimilarity < 0.3) {
    insights.push({
      type: "warning",
      icon: AlertTriangle,
      title: "Retrieval quality needs attention",
      description: `Average similarity is ${averageSimilarity.toFixed(3)}, indicating relatively weak retrieval matches.`,
      recommendation:
        "Review document quality, chunking strategy, and the relevance of uploaded knowledge sources.",
    });
  } else if (averageSimilarity < 0.6) {
    insights.push({
      type: "quality",
      icon: Lightbulb,
      title: "Retrieval quality is moderate",
      description: `Average similarity is ${averageSimilarity.toFixed(3)}.`,
      recommendation:
        "Consider improving document structure and retrieval configuration for stronger contextual matches.",
    });
  } else {
    insights.push({
      type: "success",
      icon: CheckCircle2,
      title: "Retrieval quality is strong",
      description: `Average similarity is ${averageSimilarity.toFixed(3)}.`,
      recommendation:
        "Continue monitoring similarity as the knowledge base grows.",
    });
  }

  if (averageGenerationTime > averageRetrievalTime * 2) {
    insights.push({
      type: "performance",
      icon: Zap,
      title: "Generation is the main latency contributor",
      description: `Generation averages ${Math.round(averageGenerationTime)} ms compared with ${Math.round(averageRetrievalTime)} ms for retrieval.`,
      recommendation:
        "Review model selection, prompt size, and generation configuration if faster responses are required.",
    });
  } else if (averageRetrievalTime > averageGenerationTime) {
    insights.push({
      type: "performance",
      icon: TrendingDown,
      title: "Retrieval contributes most to latency",
      description: `Retrieval averages ${Math.round(averageRetrievalTime)} ms compared with ${Math.round(averageGenerationTime)} ms for generation.`,
      recommendation:
        "Review vector search performance, database indexing, and the number of retrieved chunks.",
    });
  } else {
    insights.push({
      type: "performance",
      icon: Zap,
      title: "Response pipeline is balanced",
      description: `Average total response time is ${Math.round(averageTotalTime)} ms.`,
      recommendation:
        "Continue monitoring response timing as usage and document volume increase.",
    });
  }

  if (successRate < 90 && totalRequests >= 5) {
    insights.push({
      type: "warning",
      icon: ShieldCheck,
      title: "Request reliability needs attention",
      description: `${failedRequests} of ${totalRequests} recorded requests failed.`,
      recommendation:
        "Review failed RAG requests in Request History and inspect their diagnostics for recurring errors.",
    });
  } else if (totalRequests >= 5) {
    insights.push({
      type: "success",
      icon: ShieldCheck,
      title: "RAG requests are largely successful",
      description: `The recorded success rate is ${successRate.toFixed(1)}%.`,
      recommendation:
        "Continue monitoring failed requests and investigate any new error patterns.",
    });
  }

  return insights;
}

function Analytics() {







  const navigate = useNavigate();







  const { error: showError } = useToast();















  const [dashboard, setDashboard] = useState(null);







  const [isLoading, setIsLoading] = useState(true);



  const [selectedRequest, setSelectedRequest] = useState(null);







  const [isDiagnosticsLoading, setIsDiagnosticsLoading] = useState(false);

  const RAG_REQUEST_PAGE_SIZE = 10;



  const [requestHistory, setRequestHistory] = useState([]);

  const [requestHistoryTotal, setRequestHistoryTotal] = useState(0);

  const [requestHistoryPage, setRequestHistoryPage] = useState(0);

  const [isRequestHistoryLoading, setIsRequestHistoryLoading] = useState(false);

  const [historyStartDate, setHistoryStartDate] = useState("");

  const [historyEndDate, setHistoryEndDate] = useState("");
  const [analyticsTrends, setAnalyticsTrends] = useState([]);
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);
  const [analyticsInsights, setAnalyticsInsights] = useState([]);



















  async function loadAnalyticsTrends(
    startDate = "",
    endDate = ""
  ) {
    try {
      setIsTrendsLoading(true);
      const data = await getRagAnalyticsTrends(startDate, endDate);
      const trends = data?.trends || [];
      setAnalyticsTrends(trends);
      setAnalyticsInsights(buildAnalyticsInsights(trends));
    } catch (error) {
      showError(
        error?.response?.data?.detail ||
          "Unable to load analytics trends."
      );
      setAnalyticsTrends([]);
      setAnalyticsInsights(buildAnalyticsInsights([]));
    } finally {
      setIsTrendsLoading(false);
    }
  }

  async function loadAnalytics(

    page = requestHistoryPage,

    startDate = historyStartDate,

    endDate = historyEndDate

  ) {

    try {

      setIsLoading(true);

      setIsRequestHistoryLoading(true);



      const [data, history] = await Promise.all([

        getDashboardData(),

        getRagRequests(

          RAG_REQUEST_PAGE_SIZE,

          page * RAG_REQUEST_PAGE_SIZE,

          startDate,

          endDate

        ),

      ]);



      setDashboard(data);

      setRequestHistory(history?.requests || []);

      setRequestHistoryTotal(Number(history?.total || 0));

      setRequestHistoryPage(page);

    } catch (error) {

      showError(

        error?.response?.data?.detail ||

          "Unable to load analytics data."

      );

    } finally {

      setIsLoading(false);

      setIsRequestHistoryLoading(false);

    }

  }



  async function changeRequestHistoryPage(nextPage) {

    const totalPages = Math.max(

      1,

      Math.ceil(requestHistoryTotal / RAG_REQUEST_PAGE_SIZE)

    );



    if (

      nextPage < 0 ||

      nextPage >= totalPages ||

      isRequestHistoryLoading ||

      nextPage === requestHistoryPage

    ) {

      return;

    }



    try {

      setIsRequestHistoryLoading(true);

      const history = await getRagRequests(

        RAG_REQUEST_PAGE_SIZE,

        nextPage * RAG_REQUEST_PAGE_SIZE,

        historyStartDate,

        historyEndDate

      );



      setRequestHistory(history?.requests || []);

      setRequestHistoryTotal(Number(history?.total || 0));

      setRequestHistoryPage(nextPage);

    } catch (error) {

      showError(

        error?.response?.data?.detail ||

          "Unable to load RAG request history."

      );

    } finally {

      setIsRequestHistoryLoading(false);

    }

  }





  async function applyHistoryDateFilter() {

    if (

      historyStartDate &&

      historyEndDate &&

      historyEndDate < historyStartDate

    ) {

      showError("End date cannot be earlier than the start date.");

      return;

    }



    await Promise.all([
      loadAnalytics(0, historyStartDate, historyEndDate),
      loadAnalyticsTrends(historyStartDate, historyEndDate),
    ]);

  }



  async function clearHistoryDateFilter() {

    setHistoryStartDate("");

    setHistoryEndDate("");

    await Promise.all([
      loadAnalytics(0, "", ""),
      loadAnalyticsTrends("", ""),
    ]);

  }



  async function openRequestDiagnostics(request) {



    setSelectedRequest(request);



    setIsDiagnosticsLoading(true);







    try {



      const details = await getRagRequestDetails(request.id);



      setSelectedRequest(details);



    } catch (error) {



      setSelectedRequest(null);



      showError(



        error?.response?.data?.detail ||



          "Unable to load RAG request diagnostics."



      );



    } finally {



      setIsDiagnosticsLoading(false);



    }



  }







  function closeRequestDiagnostics() {



    setSelectedRequest(null);



    setIsDiagnosticsLoading(false);



  }







  useEffect(() => {



    if (!selectedRequest) {



      return undefined;



    }







    function handleEscape(event) {



      if (event.key === "Escape") {



        closeRequestDiagnostics();



      }



    }







    document.addEventListener("keydown", handleEscape);



    document.body.style.overflow = "hidden";







    return () => {



      document.removeEventListener("keydown", handleEscape);



      document.body.style.overflow = "";



    };



  }, [selectedRequest]);







  useEffect(() => {
    loadAnalytics(0, "", "");
    loadAnalyticsTrends("", "");
  }, []);



















  const stats = dashboard?.stats || {};















  const ragAnalytics =







    dashboard?.rag_analytics || {};















  const recentRequests =







    dashboard?.recent_rag_requests || [];















  const recentDocuments =







    dashboard?.recent_documents || [];















  const successRate = Number(







    ragAnalytics.success_rate || 0







  );















  const averageSimilarity = Number(







    ragAnalytics.average_similarity || 0







  );















  const averageMaxSimilarity = Number(







    ragAnalytics.average_max_similarity || 0







  );















  const retrievalQuality =







    getQualityLabel(







      ragAnalytics.retrieval_quality







    );















  const qualityPercentage = Math.min(







    100,







    Math.max(0, averageSimilarity * 100)







  );















  const maxSimilarityPercentage = Math.min(







    100,







    Math.max(0, averageMaxSimilarity * 100)







  );















  const performanceData = useMemo(







    () => [







      {







        label: "Retrieval",







        value: Number(







          ragAnalytics.average_retrieval_time_ms || 0







        ),







        formatted: formatMilliseconds(







          ragAnalytics.average_retrieval_time_ms







        ),







        icon: Target,







      },







      {







        label: "Generation",







        value: Number(







          ragAnalytics.average_generation_time_ms || 0







        ),







        formatted: formatMilliseconds(







          ragAnalytics.average_generation_time_ms







        ),







        icon: Sparkles,







      },







      {







        label: "Total Response",







        value: Number(







          ragAnalytics.average_total_time_ms || 0







        ),







        formatted: formatMilliseconds(







          ragAnalytics.average_total_time_ms







        ),







        icon: Zap,







      },







    ],







    [ragAnalytics]







  );















  const maxPerformanceValue = Math.max(







    ...performanceData.map((item) => item.value),







    1







  );















  return (







    <div className="analytics-page">







      <Navbar />















      <div className="analytics-page__app">







        <Sidebar />















        <main className="analytics-page__main">







          <header className="analytics-page__header">







            <div>







              <button







                type="button"







                className="analytics-page__back"







                onClick={() => navigate("/dashboard")}







              >







                <ArrowLeft size={17} />







                Back to Dashboard







              </button>















              <div className="analytics-page__eyebrow">







                <BarChart3 size={15} />







                RAG ANALYTICS







              </div>















              <h1 className="analytics-page__title">







                Analytics & Insights







              </h1>















              <p className="analytics-page__subtitle">







                Monitor document usage, RAG requests,







                retrieval quality, and AI response







                performance using your real application data.







              </p>







            </div>















            <button







              type="button"







              className="analytics-page__refresh"







              onClick={() => {
                loadAnalytics(
                  0,
                  historyStartDate,
                  historyEndDate
                );
                loadAnalyticsTrends(
                  historyStartDate,
                  historyEndDate
                );
              }}

              disabled={isLoading || isTrendsLoading}







            >







              <RefreshCw







                size={16}







                className={







                  isLoading







                    ? "analytics-page__spin"







                    : ""







                }







              />







              Refresh







            </button>







          </header>















          {isLoading ? (







            <div className="analytics-page__loading">







              <div className="analytics-page__loading-spinner">







                <RefreshCw size={22} />







              </div>















              <h2>Loading analytics</h2>















              <p>







                Fetching the latest data from your







                knowledge assistant.







              </p>







            </div>







          ) : (







            <>







              {/* Overview */}







              <section className="analytics-page__stats">







                <div className="analytics-page__stat-card">







                  <div className="analytics-page__stat-icon">







                    <FileText size={19} />







                  </div>















                  <div>







                    <span className="analytics-page__stat-label">







                      Documents







                    </span>















                    <strong>







                      {stats.documents ?? 0}







                    </strong>







                  </div>







                </div>















                <div className="analytics-page__stat-card">







                  <div className="analytics-page__stat-icon">







                    <MessageSquareText size={19} />







                  </div>















                  <div>







                    <span className="analytics-page__stat-label">







                      Conversations







                    </span>















                    <strong>







                      {stats.conversations ?? 0}







                    </strong>







                  </div>







                </div>















                <div className="analytics-page__stat-card">







                  <div className="analytics-page__stat-icon">







                    <Activity size={19} />







                  </div>















                  <div>







                    <span className="analytics-page__stat-label">







                      RAG Requests







                    </span>















                    <strong>







                      {ragAnalytics.total_requests ?? 0}







                    </strong>







                  </div>







                </div>















                <div className="analytics-page__stat-card">







                  <div className="analytics-page__stat-icon">







                    <CheckCircle2 size={19} />







                  </div>















                  <div>







                    <span className="analytics-page__stat-label">







                      Success Rate







                    </span>















                    <strong>







                      {successRate.toFixed(1)}%







                    </strong>







                  </div>







                </div>







              </section>















              {/* Retrieval Quality */}







              <section className="analytics-page__grid">







                <div className="analytics-card analytics-card--large">







                  <div className="analytics-card__header">







                    <div>







                      <span className="analytics-card__eyebrow">







                        RETRIEVAL QUALITY







                      </span>















                      <h2>







                        Knowledge Retrieval







                      </h2>







                    </div>















                    <div className="analytics-card__icon">







                      <Target size={18} />







                    </div>







                  </div>















                  <div className="analytics-quality">







                    <div className="analytics-quality__main">







                      <span>







                        Average similarity







                      </span>















                      <strong>







                        {formatSimilarity(







                          ragAnalytics.average_similarity







                        )}







                      </strong>







                    </div>















                    <div className="analytics-quality__bar">







                      <div







                        className="analytics-quality__bar-fill"







                        style={{







                          width: `${qualityPercentage}%`,







                        }}







                      />







                    </div>







                  </div>















                  <div className="analytics-quality__row">







                    <div>







                      <span>







                        Best similarity







                      </span>















                      <strong>







                        {formatSimilarity(







                          ragAnalytics.average_max_similarity







                        )}







                      </strong>







                    </div>















                    <div>







                      <span>







                        Retrieval quality







                      </span>















                      <strong>







                        {retrievalQuality}







                      </strong>







                    </div>















                    <div>







                      <span>







                        Low-quality requests







                      </span>















                      <strong>







                        {ragAnalytics.low_quality_requests ??







                          0}







                      </strong>







                    </div>







                  </div>















                  <div className="analytics-quality__comparison">







                    <div className="analytics-quality__comparison-head">







                      <span>







                        Average vs. best similarity







                      </span>















                      <span>







                        {formatSimilarity(







                          ragAnalytics.average_similarity







                        )}{" "}







                        /{" "}







                        {formatSimilarity(







                          ragAnalytics.average_max_similarity







                        )}







                      </span>







                    </div>















                    <div className="analytics-quality__comparison-track">







                      <div







                        className="analytics-quality__comparison-fill"







                        style={{







                          width: `${maxSimilarityPercentage}%`,







                        }}







                      />







                    </div>







                  </div>







                </div>















                {/* Request Health */}







                <div className="analytics-card">







                  <div className="analytics-card__header">







                    <div>







                      <span className="analytics-card__eyebrow">







                        REQUEST HEALTH







                      </span>















                      <h2>







                        RAG Reliability







                      </h2>







                    </div>















                    <div className="analytics-card__icon">







                      <CheckCircle2 size={18} />







                    </div>







                  </div>















                  <div className="analytics-health">







                    <div className="analytics-health__circle">







                      <strong>







                        {successRate.toFixed(0)}%







                      </strong>















                      <span>







                        successful







                      </span>







                    </div>















                    <div className="analytics-health__details">







                      <div>







                        <span>







                          Successful







                        </span>















                        <strong>







                          {ragAnalytics.successful_requests ??







                            0}







                        </strong>







                      </div>















                      <div>







                        <span>







                          Failed







                        </span>















                        <strong>







                          {ragAnalytics.failed_requests ??







                            0}







                        </strong>







                      </div>















                      <div>







                        <span>







                          Avg. chunks







                        </span>















                        <strong>







                          {Number(







                            ragAnalytics.average_retrieved_chunks ||







                              0







                          ).toFixed(1)}







                        </strong>







                      </div>







                    </div>







                  </div>







                </div>







              </section>















              {/* Performance */}







              <section className="analytics-card">







                <div className="analytics-card__header">







                  <div>







                    <span className="analytics-card__eyebrow">







                      PERFORMANCE







                    </span>















                    <h2>







                      Response Performance







                    </h2>















                    <p>







                      Average processing time across







                      recent RAG requests.







                    </p>







                  </div>















                  <div className="analytics-card__icon">







                    <Clock3 size={18} />







                  </div>







                </div>















                <div className="analytics-performance">







                  {performanceData.map((item) => {







                    const Icon = item.icon;















                    const percentage =







                      (item.value /







                        maxPerformanceValue) *







                      100;















                    return (







                      <div







                        className="analytics-performance__item"







                        key={item.label}







                      >







                        <div className="analytics-performance__top">







                          <div>







                            <Icon size={16} />















                            <span>







                              {item.label}







                            </span>







                          </div>















                          <strong>







                            {item.formatted}







                          </strong>







                        </div>















                        <div className="analytics-performance__track">







                          <div







                            className="analytics-performance__fill"







                            style={{







                              width: `${percentage}%`,







                            }}







                          />







                        </div>







                      </div>







                    );







                  })}







                </div>







              </section>
















              {/* Advanced RAG Trends */}
              <section className="analytics-card analytics-card--full analytics-trends">
                <div className="analytics-card__header">
                  <div>
                    <span className="analytics-card__eyebrow">
                      ADVANCED ANALYTICS
                    </span>
                    <h2>RAG Trends</h2>
                    <p>
                      Daily request volume, retrieval quality, response performance,
                      and reliability from your real RAG request data.
                    </p>
                  </div>
                  <div className="analytics-card__icon">
                    <TrendingUp size={18} />
                  </div>
                </div>

                {isTrendsLoading ? (
                  <div className="analytics-trends__loading">
                    <RefreshCw size={20} className="analytics-page__spin" />
                    Loading analytics trends...
                  </div>
                ) : analyticsTrends.length === 0 ? (
                  <div className="analytics-empty">
                    <TrendingUp size={24} />
                    <strong>No trend data available</strong>
                    <span>
                      Generate some AI Chat requests to populate your analytics trends.
                    </span>
                  </div>
                ) : (
                  <div className="analytics-trends__grid">
                    <div className="analytics-trend-card">
                      <div className="analytics-trend-card__header">
                        <div>
                          <span className="analytics-trend-card__label">
                            REQUEST VOLUME
                          </span>
                          <h3>Requests by Day</h3>
                        </div>
                        <Activity size={18} />
                      </div>
                      <div className="analytics-trend-chart">
                        {analyticsTrends.map((item) => {
                          const maxRequests = Math.max(
                            ...analyticsTrends.map((trend) =>
                              Number(trend.total_requests || 0)
                            ),
                            1
                          );
                          const value = Number(item.total_requests || 0);
                          const height = Math.max(
                            value > 0 ? (value / maxRequests) * 100 : 0,
                            value > 0 ? 3 : 0
                          );

                          return (
                            <div
                              className="analytics-trend-chart__column"
                              key={item.date}
                              title={`${formatTrendDate(item.date)}: ${value} requests`}
                            >
                              <strong className="analytics-trend-chart__value">
                                {value}
                              </strong>
                              <div className="analytics-trend-chart__bar">
                                <div
                                  className="analytics-trend-chart__bar-fill"
                                  style={{ height: `${height}%` }}
                                />
                              </div>
                              <span>{formatTrendDate(item.date)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="analytics-trend-card">
                      <div className="analytics-trend-card__header">
                        <div>
                          <span className="analytics-trend-card__label">
                            RETRIEVAL QUALITY
                          </span>
                          <h3>Average Similarity</h3>
                        </div>
                        <Gauge size={18} />
                      </div>
                      <div className="analytics-trend-list">
                        {analyticsTrends.map((item) => {
                          const similarity = Math.max(
                            0,
                            Math.min(1, Number(item.average_similarity || 0))
                          );

                          return (
                            <div
                              className="analytics-trend-list__item"
                              key={item.date}
                            >
                              <div className="analytics-trend-list__top">
                                <span>{formatTrendDate(item.date)}</span>
                                <strong>{formatSimilarity(similarity)}</strong>
                              </div>
                              <div className="analytics-trend-list__track">
                                <div
                                  className="analytics-trend-list__fill"
                                  style={{ width: `${similarity * 100}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="analytics-trend-card">
                      <div className="analytics-trend-card__header">
                        <div>
                          <span className="analytics-trend-card__label">
                            RESPONSE PERFORMANCE
                          </span>
                          <h3>Processing Time</h3>
                        </div>
                        <Timer size={18} />
                      </div>
                      <div className="analytics-trend-metrics">
                        {analyticsTrends.map((item) => (
                          <div
                            className="analytics-trend-metrics__row"
                            key={item.date}
                          >
                            <span>{formatTrendDate(item.date)}</span>
                            <div>
                              <strong>
                                {formatMilliseconds(item.average_total_time_ms)}
                              </strong>
                              <small>
                                Retrieval{" "}
                                {formatMilliseconds(item.average_retrieval_time_ms)}
                                {" · "}
                                Generation{" "}
                                {formatMilliseconds(item.average_generation_time_ms)}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="analytics-trend-card">
                      <div className="analytics-trend-card__header">
                        <div>
                          <span className="analytics-trend-card__label">
                            REQUEST HEALTH
                          </span>
                          <h3>Success vs Failure</h3>
                        </div>
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="analytics-health-trend">
                        {analyticsTrends.map((item) => {
                          const total = Number(item.total_requests || 0);
                          const successful = Number(item.successful_requests || 0);
                          const failed = Number(item.failed_requests || 0);
                          const successPercentage =
                            total > 0 ? (successful / total) * 100 : 0;
                          const failurePercentage =
                            total > 0 ? (failed / total) * 100 : 0;

                          return (
                            <div
                              className="analytics-health-trend__item"
                              key={item.date}
                            >
                              <div className="analytics-health-trend__top">
                                <span>{formatTrendDate(item.date)}</span>
                                <strong>
                                  {total > 0
                                    ? `${successPercentage.toFixed(0)}% success`
                                    : "No requests"}
                                </strong>
                              </div>
                              <div className="analytics-health-trend__track">
                                <div
                                  className="analytics-health-trend__success"
                                  style={{ width: `${successPercentage}%` }}
                                />
                                <div
                                  className="analytics-health-trend__failure"
                                  style={{ width: `${failurePercentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        <div className="analytics-health-trend__legend">
                          <span>
                            <CircleCheck size={13} />
                            Successful
                          </span>
                          <span>
                            <CircleX size={13} />
                            Failed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Advanced Analytics Insights */}
              <section className="analytics-card analytics-card--full analytics-insights">
                <div className="analytics-card__header">
                  <div>
                    <span className="analytics-card__eyebrow">
                      INTELLIGENCE
                    </span>
                    <h2>Analytics Insights</h2>
                    <p>
                      Data-driven observations from your RAG activity and retrieval performance.
                    </p>
                  </div>
                  <div className="analytics-card__icon">
                    <Sparkles size={18} />
                  </div>
                </div>

                {isTrendsLoading ? (
                  <div className="analytics-insights__loading">
                    <RefreshCw size={18} className="analytics-page__spin" />
                    Analyzing your RAG activity...
                  </div>
                ) : (
                  <div className="analytics-insights__grid">
                    {analyticsInsights.map((insight, index) => {
                      const Icon = insight.icon;

                      return (
                        <article
                          key={`${insight.title}-${index}`}
                          className={`analytics-insight-card analytics-insight-card--${insight.type}`}
                        >
                          <div className="analytics-insight-card__icon">
                            <Icon size={18} strokeWidth={2} />
                          </div>

                          <div className="analytics-insight-card__content">
                            <span className="analytics-insight-card__type">
                              {insight.type}
                            </span>
                            <h3>{insight.title}</h3>
                            <p>{insight.description}</p>

                            <div className="analytics-insight-card__recommendation">
                              <Lightbulb size={14} strokeWidth={2} />
                              <span>{insight.recommendation}</span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* RAG Request History */}

              <section className="analytics-card">

                <div className="analytics-card__header">

                  <div>

                    <span className="analytics-card__eyebrow">

                      RAG REQUEST HISTORY

                    </span>

                    <h2>RAG Request History</h2>

                    <p>

                      Browse all recorded requests from your knowledge assistant.

                    </p>

                  </div>

                  <div className="analytics-card__count">

                    {requestHistoryTotal}

                  </div>

                </div>



                <div className="analytics-history-filters">

                  <div className="analytics-history-filters__field">

                    <label htmlFor="analytics-history-start">From</label>

                    <input

                      id="analytics-history-start"

                      type="date"

                      value={historyStartDate}

                      max={historyEndDate || undefined}

                      onChange={(event) =>

                        setHistoryStartDate(event.target.value)

                      }

                    />

                  </div>



                  <div className="analytics-history-filters__field">

                    <label htmlFor="analytics-history-end">To</label>

                    <input

                      id="analytics-history-end"

                      type="date"

                      value={historyEndDate}

                      min={historyStartDate || undefined}

                      onChange={(event) =>

                        setHistoryEndDate(event.target.value)

                      }

                    />

                  </div>



                  <div className="analytics-history-filters__actions">

                    <button

                      type="button"

                      className="analytics-history-filters__apply"

                      onClick={applyHistoryDateFilter}

                      disabled={isRequestHistoryLoading}

                    >

                      <RefreshCw

                        size={15}

                        className={

                          isRequestHistoryLoading

                            ? "analytics-page__spin"

                            : ""

                        }

                      />

                      Apply

                    </button>



                    {(historyStartDate || historyEndDate) && (

                      <button

                        type="button"

                        className="analytics-history-filters__clear"

                        onClick={clearHistoryDateFilter}

                        disabled={isRequestHistoryLoading}

                      >

                        <X size={15} />

                        Clear

                      </button>

                    )}

                  </div>

                </div>



                {isRequestHistoryLoading && requestHistory.length === 0 ? (

                  <div className="analytics-empty">

                    <RefreshCw size={24} className="analytics-page__spin" />

                    <strong>Loading request history</strong>

                    <span>Fetching recorded RAG requests.</span>

                  </div>

                ) : requestHistory.length === 0 ? (

                  <div className="analytics-empty">

                    <Activity size={24} />

                    <strong>No RAG requests yet</strong>

                    <span>

                      Ask a question in AI Chat to generate request history.

                    </span>

                  </div>

                ) : (

                  <>

                    <div className="analytics-requests">

                      {requestHistory.map((request) => (

                        <div

                          className={`analytics-request ${

                            request.status !== "success"

                              ? "analytics-request--error"

                              : ""

                          }`}

                          key={request.id}

                          role="button"

                          tabIndex={0}

                          aria-label={`View diagnostics for request ${request.id}`}

                          onClick={() => openRequestDiagnostics(request)}

                          onKeyDown={(event) => {

                            if (event.key === "Enter" || event.key === " ") {

                              event.preventDefault();

                              openRequestDiagnostics(request);

                            }

                          }}

                        >

                          <div

                            className={`analytics-request__status ${

                              request.status === "success"

                                ? "analytics-request__status--success"

                                : "analytics-request__status--error"

                            }`}

                          >

                            {request.status === "success" ? (

                              <CheckCircle2 size={17} />

                            ) : (

                              <AlertCircle size={17} />

                            )}

                          </div>

                          <div className="analytics-request__content">

                            <div className="analytics-request__question">

                              {request.question || "Untitled request"}

                            </div>

                            <div className="analytics-request__meta">

                              <span>

                                {request.model_name || "Unknown model"}

                              </span>

                              <span>

                                {request.retrieved_chunks ?? 0} chunks

                              </span>

                              <span>

                                Avg. {formatSimilarity(request.average_similarity)}

                              </span>

                              <span>{formatDateTime(request.created_at)}</span>

                            </div>

                          </div>

                          <div className="analytics-request__timing">

                            <strong>

                              {formatMilliseconds(request.total_time_ms)}

                            </strong>

                            <span>response</span>

                          </div>

                          <span

                            className="analytics-request__arrow"

                            aria-hidden="true"

                          >

                            <ArrowRight size={15} />

                          </span>

                        </div>

                      ))}

                    </div>



                    {requestHistoryTotal > RAG_REQUEST_PAGE_SIZE && (

                      <div

                        style={{

                          display: "flex",

                          alignItems: "center",

                          justifyContent: "space-between",

                          gap: "12px",

                          marginTop: "18px",

                          flexWrap: "wrap",

                        }}

                      >

                        <span

                          style={{

                            fontSize: "13px",

                            color: "var(--text-secondary, #64748b)",

                          }}

                        >

                          Showing{" "}

                          {requestHistoryPage * RAG_REQUEST_PAGE_SIZE + 1}–

                          {Math.min(

                            (requestHistoryPage + 1) * RAG_REQUEST_PAGE_SIZE,

                            requestHistoryTotal

                          )}{" "}

                          of {requestHistoryTotal} requests

                        </span>



                        <div

                          style={{

                            display: "flex",

                            alignItems: "center",

                            gap: "8px",

                          }}

                        >

                          <button

                            type="button"

                            className="analytics-page__refresh"

                            onClick={() =>

                              changeRequestHistoryPage(requestHistoryPage - 1)

                            }

                            disabled={

                              requestHistoryPage === 0 ||

                              isRequestHistoryLoading

                            }

                          >

                            <ArrowLeft size={15} />

                            Previous

                          </button>



                          <span

                            style={{

                              minWidth: "74px",

                              textAlign: "center",

                              fontSize: "13px",

                              fontWeight: 600,

                              color: "var(--text-primary, #0f172a)",

                            }}

                          >

                            Page {requestHistoryPage + 1} of{" "}

                            {Math.ceil(

                              requestHistoryTotal / RAG_REQUEST_PAGE_SIZE

                            )}

                          </span>



                          <button

                            type="button"

                            className="analytics-page__refresh"

                            onClick={() =>

                              changeRequestHistoryPage(requestHistoryPage + 1)

                            }

                            disabled={

                              requestHistoryPage >=

                                Math.ceil(

                                  requestHistoryTotal / RAG_REQUEST_PAGE_SIZE

                                ) - 1 || isRequestHistoryLoading

                            }

                          >

                            Next

                            <ArrowRight size={15} />

                          </button>

                        </div>

                      </div>

                    )}

                  </>

                )}

              </section>



              {/* Documents */}







              <section className="analytics-card">







                <div className="analytics-card__header">







                  <div>







                    <span className="analytics-card__eyebrow">







                      KNOWLEDGE BASE







                    </span>















                    <h2>







                      Recent Documents







                    </h2>







                  </div>















                  <button







                    type="button"







                    className="analytics-card__link"







                    onClick={() =>







                      navigate("/documents")







                    }







                  >







                    View documents







                  </button>







                </div>















                {recentDocuments.length === 0 ? (







                  <div className="analytics-empty">







                    <FileText size={24} />















                    <strong>







                      No documents available







                    </strong>















                    <span>







                      Upload a document to start







                      building your knowledge base.







                    </span>







                  </div>







                ) : (







                  <div className="analytics-documents">







                    {recentDocuments







                      .slice(0, 5)







                      .map((document) => (







                        <div







                          className="analytics-document"







                          key={document.id}







                        >







                          <div className="analytics-document__icon">







                            <FileText size={17} />







                          </div>















                          <div className="analytics-document__info">







                            <strong>







                              {document.filename}







                            </strong>















                            <span>







                              {document.status ||







                                "Unknown status"}







                            </span>







                          </div>







                        </div>







                      ))}







                  </div>







                )}







              </section>







            </>







          )}







        </main>







      </div>







      {selectedRequest && (



        <div



          className="analytics-diagnostics-overlay"



          role="presentation"



          onMouseDown={(event) => {



            if (event.target === event.currentTarget) {



              closeRequestDiagnostics();



            }



          }}



        >



          <section



            className="analytics-diagnostics"



            role="dialog"



            aria-modal="true"



            aria-labelledby="analytics-diagnostics-title"



            onMouseDown={(event) => event.stopPropagation()}



          >



            <header className="analytics-diagnostics__header">



              <div className="analytics-diagnostics__heading">



                <span className="analytics-diagnostics__eyebrow">



                  RAG REQUEST DIAGNOSTICS



                </span>



                <h2 id="analytics-diagnostics-title">



                  Request #{selectedRequest.id}



                </h2>



                <p>Detailed retrieval and generation observability data</p>



              </div>







              <button



                type="button"



                className="analytics-diagnostics__close"



                onClick={closeRequestDiagnostics}



                aria-label="Close diagnostics"



              >



                <X size={18} />



              </button>



            </header>







            {isDiagnosticsLoading ? (



              <div className="analytics-diagnostics__loading">



                <RefreshCw



                  size={19}



                  className="analytics-diagnostics__spinner"



                />



                Loading request diagnostics...



              </div>



            ) : (



              <div className="analytics-diagnostics__body">



                <div



                  className={`analytics-diagnostics__status ${



                    selectedRequest.status !== "success"



                      ? "analytics-diagnostics__status--error"



                      : ""



                  }`}



                >



                  {selectedRequest.status === "success" ? (



                    <CheckCircle2 size={16} />



                  ) : (



                    <AlertCircle size={16} />



                  )}



                  Status: {selectedRequest.status || "unknown"}



                </div>







                <section className="analytics-diagnostics__section">



                  <h3 className="analytics-diagnostics__section-title">



                    <MessageSquareText size={16} />



                    Question



                  </h3>



                  <div className="analytics-diagnostics__question">



                    {selectedRequest.question || "No question recorded."}



                  </div>



                </section>







                <section className="analytics-diagnostics__section">



                  <h3 className="analytics-diagnostics__section-title">



                    <Sparkles size={16} />



                    Answer



                  </h3>



                  <div className="analytics-diagnostics__answer">



                    {selectedRequest.answer || "No answer recorded."}



                  </div>



                </section>







                {selectedRequest.error_message && (



                  <section className="analytics-diagnostics__section">



                    <h3 className="analytics-diagnostics__section-title">



                      <AlertCircle size={16} />



                      Error



                    </h3>



                    <div className="analytics-diagnostics__error">



                      {selectedRequest.error_message}



                    </div>



                  </section>



                )}







                <section className="analytics-diagnostics__section">



                  <h3 className="analytics-diagnostics__section-title">



                    <Gauge size={16} />



                    Retrieval & Response Metrics



                  </h3>



                  <div className="analytics-diagnostics__metrics">



                    <div className="analytics-diagnostics__metric">



                      <span>Retrieved chunks</span>



                      <strong>{selectedRequest.retrieved_chunks ?? 0}</strong>



                    </div>



                    <div className="analytics-diagnostics__metric">



                      <span>Average similarity</span>



                      <strong>



                        {formatSimilarity(selectedRequest.average_similarity)}



                      </strong>



                    </div>



                    <div className="analytics-diagnostics__metric">



                      <span>Max similarity</span>



                      <strong>



                        {formatSimilarity(selectedRequest.max_similarity)}



                      </strong>



                    </div>



                    <div className="analytics-diagnostics__metric">



                      <span>Retrieval time</span>



                      <strong>



                        {formatMilliseconds(selectedRequest.retrieval_time_ms)}



                      </strong>



                    </div>



                    <div className="analytics-diagnostics__metric">



                      <span>Generation time</span>



                      <strong>



                        {formatMilliseconds(selectedRequest.generation_time_ms)}



                      </strong>



                    </div>



                    <div className="analytics-diagnostics__metric">



                      <span>Total time</span>



                      <strong>



                        {formatMilliseconds(selectedRequest.total_time_ms)}



                      </strong>



                    </div>



                  </div>



                </section>







                <section className="analytics-diagnostics__section">



                  <h3 className="analytics-diagnostics__section-title">



                    <Cpu size={16} />



                    Request Details



                  </h3>



                  <div className="analytics-diagnostics__details">



                    <div className="analytics-diagnostics__detail">



                      <span>Request ID</span>



                      <strong>{selectedRequest.id ?? "—"}</strong>



                    </div>



                    <div className="analytics-diagnostics__detail">



                      <span>Conversation ID</span>



                      <strong>{selectedRequest.conversation_id ?? "—"}</strong>



                    </div>



                    <div className="analytics-diagnostics__detail">



                      <span>User ID</span>



                      <strong>{selectedRequest.user_id ?? "—"}</strong>



                    </div>



                    <div className="analytics-diagnostics__detail">



                      <span>Model</span>



                      <strong>



                        {selectedRequest.model_name || "Unknown model"}



                      </strong>



                    </div>



                    <div className="analytics-diagnostics__detail">



                      <span>Created</span>



                      <strong>



                        {formatDateTime(selectedRequest.created_at)}



                      </strong>



                    </div>



                    <div className="analytics-diagnostics__detail">



                      <span>Status</span>



                      <strong>{selectedRequest.status || "unknown"}</strong>



                    </div>



                  </div>



                </section>







                <section className="analytics-diagnostics__section">



                  <h3 className="analytics-diagnostics__section-title">



                    <Database size={16} />



                    Document IDs



                  </h3>



                  {Array.isArray(selectedRequest.document_ids) &&



                  selectedRequest.document_ids.length > 0 ? (



                    <div className="analytics-diagnostics__scores">



                      {selectedRequest.document_ids.map((documentId) => (



                        <span



                          className="analytics-diagnostics__score"



                          key={String(documentId)}



                        >



                          {String(documentId)}



                        </span>



                      ))}



                    </div>



                  ) : (



                    <div className="analytics-diagnostics__empty">



                      No document IDs were recorded for this request.



                    </div>



                  )}



                </section>







                <section className="analytics-diagnostics__section">



                  <h3 className="analytics-diagnostics__section-title">



                    <Timer size={16} />



                    Similarity Scores



                  </h3>



                  {Array.isArray(selectedRequest.similarity_scores) &&



                  selectedRequest.similarity_scores.length > 0 ? (



                    <div className="analytics-diagnostics__scores">



                      {selectedRequest.similarity_scores.map((score, index) => (



                        <span



                          className="analytics-diagnostics__score"



                          key={`${index}-${score}`}



                        >



                          #{index + 1}: {formatSimilarity(score)}



                        </span>



                      ))}



                    </div>



                  ) : (



                    <div className="analytics-diagnostics__empty">



                      No similarity scores were recorded for this request.



                    </div>



                  )}



                </section>



              </div>



            )}



          </section>



        </div>



      )}



    </div>



  );



}















export default Analytics;