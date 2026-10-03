// src/App.tsx

import { useEffect, useMemo, useState } from "react";
import "./App.css";

import {
  getDashboardSummary,
  getInvoices,
  uploadInvoice,
  type DashboardSummary,
  type Invoice,
} from "./api";

const chartData = [42, 58, 48, 72, 62, 82, 68, 91, 76, 88, 72, 96];

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const initialDashboard: DashboardSummary = {
  total_invoices: 0,
  pending_approval: 0,
  approved: 0,
  high_risk: 0,
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dashboard, setDashboard] =
    useState<DashboardSummary>(initialDashboard);

  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [dashboardError, setDashboardError] =
    useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadVendor, setUploadVendor] =
    useState("");

  const [uploadAmount, setUploadAmount] =
    useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] =
    useState("");

  const [uploadSuccess, setUploadSuccess] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      icon: "▦",
    },
    {
      name: "Invoices",
      icon: "▤",
    },
    {
      name: "Predictions",
      icon: "✦",
    },
    {
      name: "Analytics",
      icon: "◈",
    },
    {
      name: "Approvals",
      icon: "✓",
      count: dashboard.pending_approval,
    },
  ];

  async function loadDashboard() {
    try {
      setDashboardLoading(true);
      setDashboardError("");

      const data = await getDashboardSummary();

      setDashboard(data);
    } catch (err) {
      console.error(
        "Failed to load dashboard:",
        err,
      );

      setDashboardError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard.",
      );
    } finally {
      setDashboardLoading(false);
    }
  }

  async function loadInvoices() {
    try {
      setLoading(true);
      setError("");

      const data = await getInvoices();

      setInvoices(data);
    } catch (err) {
      console.error(
        "Failed to load invoices:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to backend.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    try {
      setRefreshing(true);

      await Promise.all([
        loadDashboard(),
        loadInvoices(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    loadInvoices();
  }, []);

  const riskDistribution = useMemo(() => {
    if (invoices.length === 0) {
      return {
        low: 0,
        medium: 0,
        high: 0,
      };
    }

    const low = invoices.filter(
      (invoice) =>
        invoice.risk.toLowerCase() === "low",
    ).length;

    const medium = invoices.filter(
      (invoice) =>
        invoice.risk.toLowerCase() === "medium",
    ).length;

    const high = invoices.filter(
      (invoice) =>
        invoice.risk.toLowerCase() === "high",
    ).length;

    return {
      low,
      medium,
      high,
    };
  }, [invoices]);

  const riskTotal =
    riskDistribution.low +
    riskDistribution.medium +
    riskDistribution.high;

  const lowPercentage =
    riskTotal > 0
      ? Math.round(
          (riskDistribution.low / riskTotal) * 100,
        )
      : 0;

  const mediumPercentage =
    riskTotal > 0
      ? Math.round(
          (riskDistribution.medium / riskTotal) *
            100,
        )
      : 0;

  const highPercentage =
    riskTotal > 0
      ? Math.round(
          (riskDistribution.high / riskTotal) *
            100,
        )
      : 0;

  async function handleUpload() {
    if (!selectedFile) {
      setUploadError("Please select an invoice file.");
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg",
    ];

    const extension =
      selectedFile.name
        .substring(
          selectedFile.name.lastIndexOf("."),
        )
        .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setUploadError(
        "Only PDF, PNG, JPG and JPEG files are supported.",
      );
      return;
    }

    const parsedAmount =
      uploadAmount.trim() === ""
        ? 0
        : Number(uploadAmount);

    if (
      Number.isNaN(parsedAmount) ||
      parsedAmount < 0
    ) {
      setUploadError(
        "Please enter a valid non-negative amount.",
      );
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadSuccess("");

      const result = await uploadInvoice(
        selectedFile,
        uploadVendor.trim(),
        parsedAmount,
      );

      setUploadSuccess(
        `Invoice ${result.invoice_number} uploaded successfully.`,
      );

      setSelectedFile(null);
      setUploadVendor("");
      setUploadAmount("");

      await Promise.all([
        loadDashboard(),
        loadInvoices(),
      ]);

      setTimeout(() => {
        setUploadOpen(false);
        setUploadSuccess("");
      }, 1200);
    } catch (err) {
      console.error(
        "Invoice upload failed:",
        err,
      );

      setUploadError(
        err instanceof Error
          ? err.message
          : "Invoice upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  function openUploadModal() {
    setUploadError("");
    setUploadSuccess("");
    setUploadOpen(true);
  }

  function closeUploadModal() {
    if (uploading) {
      return;
    }

    setUploadOpen(false);
    setSelectedFile(null);
    setUploadVendor("");
    setUploadAmount("");
    setUploadError("");
    setUploadSuccess("");
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setUploadError("");
  }

  return (
    <div className="app">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="brand">
          <div className="brand-logo">
            AI
          </div>

          <div className="brand-text">
            <h2>InvoiceAI</h2>

            <span>
              Intelligence Platform
            </span>
          </div>

          <button
            className="mobile-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            ×
          </button>
        </div>

        <div className="nav-section">
          <p className="nav-label">
            WORKSPACE
          </p>

          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activeMenu === item.name
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setActiveMenu(item.name);
                setSidebarOpen(false);
              }}
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span className="nav-name">
                {item.name}
              </span>

              {item.count !== undefined && (
                <span className="notification-count">
                  {item.count}
                </span>
              )}
            </button>
          ))}

          <p className="nav-label system-label">
            SYSTEM
          </p>

          <button className="nav-item">
            <span className="nav-icon">
              ⚙
            </span>

            <span className="nav-name">
              Settings
            </span>
          </button>

          <button className="nav-item">
            <span className="nav-icon">
              ?
            </span>

            <span className="nav-name">
              Help Center
            </span>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            AS
          </div>

          <div className="user-info">
            <strong>
              Anuj Pathak
            </strong>

            <span>  
              ML Engineer
            </span>
          </div>

          <span className="user-more">
            •••
          </span>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              ☰
            </button>

            <div>
              <h1>
                {activeMenu}
              </h1>

              <p>
                Monitor and manage your
                invoice intelligence
                platform.
              </p>
            </div>
          </div>

          <div className="topbar-right">
            <button
              className="top-icon"
              onClick={refreshData}
              title="Refresh"
            >
              ↻
            </button>

            <button
              className="top-icon notification"
              title="Notifications"
            >
              ♧
              <span />
            </button>

            <button
              className="upload-button"
              onClick={openUploadModal}
            >
              <span>+</span>
              Upload Invoice
            </button>
          </div>
        </header>

        <div className="page-content">
          {/* ================= PAGE TITLE ================= */}

          <div className="page-heading">
            <div>
              <h2>
                Invoice Intelligence
              </h2>

              <p>
                AI-powered invoice
                processing and risk
                monitoring.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={refreshData}
              disabled={refreshing}
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh Data"}
            </button>
          </div>

          {/* ================= STATS ================= */}

          <section className="stats-grid">
            <StatCard
              title="Total Invoices"
              value={
                dashboardLoading
                  ? "..."
                  : dashboard.total_invoices.toLocaleString(
                      "en-IN",
                    )
              }
              change="Live"
              text="from database"
              icon="▤"
              type="blue"
            />

            <StatCard
              title="Pending Approval"
              value={
                dashboardLoading
                  ? "..."
                  : dashboard.pending_approval.toLocaleString(
                      "en-IN",
                    )
              }
              change="Live"
              text="require attention"
              icon="◷"
              type="orange"
            />

            <StatCard
              title="Approved"
              value={
                dashboardLoading
                  ? "..."
                  : dashboard.approved.toLocaleString(
                      "en-IN",
                    )
              }
              change="Live"
              text="approved invoices"
              icon="✓"
              type="green"
            />

            <StatCard
              title="High Risk"
              value={
                dashboardLoading
                  ? "..."
                  : dashboard.high_risk.toLocaleString(
                      "en-IN",
                    )
              }
              change="Live"
              text="high risk invoices"
              icon="!"
              type="red"
            />
          </section>

          {dashboardError && (
            <div className="dashboard-warning">
              <strong>
                Dashboard warning:
              </strong>

              <span>
                {dashboardError}
              </span>
            </div>
          )}

          {/* ================= CHARTS ================= */}

          <section className="dashboard-grid">
            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <h3>
                    Invoice Volume
                  </h3>

                  <p>
                    Processing activity
                  </p>
                </div>

                <select defaultValue="12">
                  <option value="12">
                    Last 12 months
                  </option>

                  <option value="6">
                    Last 6 months
                  </option>

                  <option value="30">
                    Last 30 days
                  </option>
                </select>
              </div>

              <div className="chart-area">
                <div className="chart-y">
                  <span>1000</span>
                  <span>750</span>
                  <span>500</span>
                  <span>250</span>
                  <span>0</span>
                </div>

                <div className="chart-content">
                  <div className="chart-lines">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="bars">
                    {chartData.map(
                      (
                        height,
                        index,
                      ) => (
                        <div
                          className="bar-column"
                          key={index}
                        >
                          <div
                            className="bar"
                            style={{
                              height: `${height}%`,
                            }}
                          />

                          <small>
                            {months[index]}
                          </small>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI RISK */}

            <div className="card risk-card">
              <div className="card-header">
                <div>
                  <h3>
                    AI Risk Analysis
                  </h3>

                  <p>
                    Current database
                    classification
                  </p>
                </div>

                <span className="model-badge">
                  XGBoost
                </span>
              </div>

              <div className="risk-summary">
                <div className="risk-donut">
                  <div>
                    <strong>
                      {lowPercentage}%
                    </strong>

                    <span>
                      Low Risk
                    </span>
                  </div>
                </div>

                <div className="risk-total">
                  <strong>
                    {riskTotal}
                  </strong>

                  <span>
                    Classified
                  </span>
                </div>
              </div>

              <div className="risk-list">
                <RiskItem
                  label="Low Risk"
                  value={`${lowPercentage}%`}
                  className="low"
                />

                <RiskItem
                  label="Medium Risk"
                  value={`${mediumPercentage}%`}
                  className="medium"
                />

                <RiskItem
                  label="High Risk"
                  value={`${highPercentage}%`}
                  className="high"
                />
              </div>
            </div>
          </section>

          {/* ================= RECENT INVOICES ================= */}

          <section className="card invoices-card">
            <div className="card-header">
              <div>
                <h3>
                  Recent Invoices
                </h3>

                <p>
                  Latest invoices
                  processed by the
                  platform
                </p>
              </div>

              <button
                className="view-all"
                onClick={() =>
                  setActiveMenu(
                    "Invoices",
                  )
                }
              >
                View all →
              </button>
            </div>

            {loading && (
              <div className="invoice-loading">
                <div className="loading-spinner" />

                <p>
                  Loading invoices...
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="invoice-error">
                <div className="error-icon">
                  !
                </div>

                <h4>
                  Backend connection
                  failed
                </h4>

                <p>
                  {error}
                </p>

                <button
                  onClick={refreshData}
                >
                  Retry
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              invoices.length ===
                0 && (
                <div className="invoice-empty">
                  <div className="empty-icon">
                    ▤
                  </div>

                  <h4>
                    No invoices found
                  </h4>

                  <p>
                    Upload your first
                    invoice to begin
                    processing.
                  </p>

                  <button
                    className="empty-upload-button"
                    onClick={
                      openUploadModal
                    }
                  >
                    Upload Invoice
                  </button>
                </div>
              )}

            {!loading &&
              !error &&
              invoices.length >
                0 && (
                <>
                  <div className="invoice-table">
                    <table>
                      <thead>
                        <tr>
                          <th>
                            Invoice
                          </th>

                          <th>
                            Vendor
                          </th>

                          <th>
                            Amount
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Risk
                          </th>

                          <th>
                            Date
                          </th>

                          <th>
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {invoices
                          .slice(
                            0,
                            10,
                          )
                          .map(
                            (
                              invoice,
                            ) => (
                              <tr
                                key={
                                  invoice.id
                                }
                              >
                                <td>
                                  <strong>
                                    {
                                      invoice.invoice_number
                                    }
                                  </strong>
                                </td>

                                <td>
                                  <div className="vendor">
                                    <div className="vendor-avatar">
                                      {invoice.vendor
                                        .charAt(
                                          0,
                                        )
                                        .toUpperCase()}
                                    </div>

                                    <span>
                                      {
                                        invoice.vendor
                                      }
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  <strong>
                                    {
                                      invoice.currency
                                    }{" "}
                                    {Number(
                                      invoice.amount,
                                    ).toLocaleString(
                                      "en-IN",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}
                                  </strong>
                                </td>

                                <td>
                                  <span
                                    className={`status ${invoice.status.toLowerCase()}`}
                                  >
                                    {
                                      invoice.status
                                    }
                                  </span>
                                </td>

                                <td>
                                  <span
                                    className={`risk-badge ${invoice.risk.toLowerCase()}`}
                                  >
                                    <span />

                                    {
                                      invoice.risk
                                    }
                                  </span>
                                </td>

                                <td className="date">
                                  {formatDate(
                                    invoice.created_at,
                                  )}
                                </td>

                                <td>
                                  <button
                                    className="details-button"
                                    onClick={() =>
                                      setSelectedInvoice(
                                        invoice,
                                      )
                                    }
                                  >
                                    Details
                                  </button>
                                </td>
                              </tr>
                            ),
                          )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mobile-invoices">
                    {invoices
                      .slice(0, 10)
                      .map(
                        (
                          invoice,
                        ) => (
                          <div
                            className="mobile-invoice"
                            key={
                              invoice.id
                            }
                            onClick={() =>
                              setSelectedInvoice(
                                invoice,
                              )
                            }
                          >
                            <div className="mobile-invoice-top">
                              <strong>
                                {
                                  invoice.invoice_number
                                }
                              </strong>

                              <span
                                className={`status ${invoice.status.toLowerCase()}`}
                              >
                                {
                                  invoice.status
                                }
                              </span>
                            </div>

                            <div className="mobile-vendor">
                              <div className="vendor-avatar">
                                {invoice.vendor
                                  .charAt(
                                    0,
                                  )
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {
                                    invoice.vendor
                                  }
                                </strong>

                                <span>
                                  {formatDate(
                                    invoice.created_at,
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="mobile-invoice-bottom">
                              <strong>
                                {
                                  invoice.currency
                                }{" "}
                                {Number(
                                  invoice.amount,
                                ).toLocaleString(
                                  "en-IN",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}
                              </strong>

                              <span
                                className={`risk-badge ${invoice.risk.toLowerCase()}`}
                              >
                                <span />

                                {
                                  invoice.risk
                                }{" "}
                                Risk
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                  </div>
                </>
              )}
          </section>
        </div>
      </main>

      {/* ================= UPLOAD MODAL ================= */}

      {uploadOpen && (
        <div
          className="modal-backdrop"
          onClick={closeUploadModal}
        >
          <div
            className="modal upload-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  Upload Invoice
                </h2>

                <p>
                  Upload PDF or invoice
                  image for AI processing.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={
                  closeUploadModal
                }
                disabled={uploading}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <label className="file-dropzone">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={
                    handleFileChange
                  }
                />

                <div className="upload-icon">
                  ↑
                </div>

                <strong>
                  {selectedFile
                    ? selectedFile.name
                    : "Choose invoice file"}
                </strong>

                <span>
                  PDF, PNG, JPG or JPEG
                </span>
              </label>

              <div className="form-grid">
                <label className="form-field">
                  <span>
                    Vendor
                  </span>

                  <input
                    type="text"
                    value={
                      uploadVendor
                    }
                    onChange={(event) =>
                      setUploadVendor(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Optional — OCR will extract it"
                  />
                </label>

                <label className="form-field">
                  <span>
                    Amount
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      uploadAmount
                    }
                    onChange={(event) =>
                      setUploadAmount(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Optional — OCR will extract it"
                  />
                </label>
              </div>

              {uploadError && (
                <div className="upload-alert error">
                  <strong>
                    Upload failed
                  </strong>

                  <span>
                    {uploadError}
                  </span>
                </div>
              )}

              {uploadSuccess && (
                <div className="upload-alert success">
                  <strong>
                    Success
                  </strong>

                  <span>
                    {uploadSuccess}
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={
                  closeUploadModal
                }
                disabled={uploading}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={
                  handleUpload
                }
                disabled={
                  uploading ||
                  !selectedFile
                }
              >
                {uploading
                  ? "Processing..."
                  : "Upload & Analyze"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DETAILS MODAL ================= */}

      {selectedInvoice && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setSelectedInvoice(
              null,
            )
          }
        >
          <div
            className="modal detail-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  Invoice Details
                </h2>

                <p>
                  {
                    selectedInvoice.invoice_number
                  }
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedInvoice(
                    null,
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="detail-body">
              <div className="detail-top">
                <div>
                  <span className="detail-label">
                    Vendor
                  </span>

                  <strong>
                    {
                      selectedInvoice.vendor
                    }
                  </strong>
                </div>

                <span
                  className={`risk-large ${selectedInvoice.risk.toLowerCase()}`}
                >
                  {selectedInvoice.risk} Risk
                </span>
              </div>

              <div className="detail-grid">
                <DetailItem
                  label="Invoice Number"
                  value={
                    selectedInvoice.invoice_number
                  }
                />

                <DetailItem
                  label="Currency"
                  value={
                    selectedInvoice.currency
                  }
                />

                <DetailItem
                  label="Invoice Date"
                  value={formatDate(
                    selectedInvoice.invoice_date,
                  )}
                />

                <DetailItem
                  label="Due Date"
                  value={formatDate(
                    selectedInvoice.due_date,
                  )}
                />

                <DetailItem
                  label="Subtotal"
                  value={formatMoney(
                    selectedInvoice.subtotal,
                    selectedInvoice.currency,
                  )}
                />

                <DetailItem
                  label="Tax"
                  value={formatMoney(
                    selectedInvoice.tax_amount,
                    selectedInvoice.currency,
                  )}
                />

                <DetailItem
                  label="Total Amount"
                  value={formatMoney(
                    selectedInvoice.amount,
                    selectedInvoice.currency,
                  )}
                />

                <DetailItem
                  label="PO Number"
                  value={
                    selectedInvoice.po_number ||
                    "-"
                  }
                />

                <DetailItem
                  label="Tax ID / GSTIN"
                  value={
                    selectedInvoice.tax_id ||
                    "-"
                  }
                />

                <DetailItem
                  label="Payment Terms"
                  value={
                    selectedInvoice.payment_terms ||
                    "-"
                  }
                />

                <DetailItem
                  label="Risk Confidence"
                  value={`${(
                    selectedInvoice.confidence *
                    100
                  ).toFixed(1)}%`}
                />

                <DetailItem
                  label="Extraction Confidence"
                  value={`${(
                    selectedInvoice.extraction_confidence *
                    100
                  ).toFixed(1)}%`}
                />

                <DetailItem
                  label="Extraction Status"
                  value={
                    selectedInvoice.extraction_status
                  }
                />

                <DetailItem
                  label="Status"
                  value={
                    selectedInvoice.status
                  }
                />
              </div>

              <div className="detail-section">
                <div className="detail-section-header">
                  <h3>
                    Line Items
                  </h3>

                  <span>
                    {
                      selectedInvoice
                        .line_items
                        ?.length ?? 0
                    }{" "}
                    items
                  </span>
                </div>

                {selectedInvoice.line_items &&
                selectedInvoice.line_items
                  .length > 0 ? (
                  <div className="line-items-table">
                    {selectedInvoice.line_items.map(
                      (item) => (
                        <div
                          className="line-item-row"
                          key={item.id}
                        >
                          <div>
                            <strong>
                              {
                                item.description
                              }
                            </strong>

                            <span>
                              Qty:{" "}
                              {item.quantity ??
                                "-"}
                            </span>
                          </div>

                          <span>
                            {formatMoney(
                              item.total,
                              selectedInvoice.currency,
                            )}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="no-line-items">
                    No line items were
                    extracted.
                  </div>
                )}
              </div>

              {selectedInvoice.extracted_text && (
                <div className="detail-section">
                  <div className="detail-section-header">
                    <h3>
                      Extracted Text
                    </h3>
                  </div>

                  <pre className="extracted-text">
                    {
                      selectedInvoice.extracted_text
                    }
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  date?: string | null,
) {
  if (!date) {
    return "-";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return "-";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function formatMoney(
  value: number | null | undefined,
  currency = "INR",
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return `${currency} ${Number(
    value,
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  change,
  text,
  icon,
  type,
}: {
  title: string;
  value: string;
  change: string;
  text: string;
  icon: string;
  type: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span>
          {title}
        </span>

        <div
          className={`stat-icon ${type}`}
        >
          {icon}
        </div>
      </div>

      <h2>
        {value}
      </h2>

      <div
        className={`stat-change ${type}`}
      >
        <strong>
          {change}
        </strong>

        <span>
          {text}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   RISK ITEM
========================================================= */

function RiskItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="risk-item">
      <div>
        <span
          className={`risk-dot ${className}`}
        />

        {label}
      </div>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="detail-item">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

export default App;