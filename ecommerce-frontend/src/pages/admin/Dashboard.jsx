import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDashboardOverview,
  getOrdersByMonth,
  getSalesByMonth,
  getTopProducts,
  getLowStockProducts,
  getOrderStatusSummary,
  getSalesByCategory,
  getTopCustomers,
  getUserGrowthByMonth,
  getRecentOrders,
} from "../../api/adminApi";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import "../../styles/admin-dashboard.css";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#0891b2", "#7c3aed", "#ec4899", "#8b5cf6"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) => currencyFormatter.format(toNumber(value));
const formatNumber = (value) => numberFormatter.format(toNumber(value));
const formatCompact = (value) => compactFormatter.format(toNumber(value));

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getMonthIndex = (month) =>
  MONTH_NAMES.findIndex(
    (name) => name.toLowerCase() === String(month).slice(0, 3).toLowerCase()
  );

const generateSalesForecast = (salesData, months = 3) => {
  const normalized = normalizeList(salesData).map((item) => {
    const grossRevenue = toNumber(item.grossRevenue);
    const netRevenue = toNumber(item.netRevenue);

    return {
      ...item,
      grossRevenue,
      netRevenue,
      actualRevenue: grossRevenue,
      forecastRevenue: null,
      predicted: false,
    };
  });

  if (normalized.length < 2) return normalized;

  const forecast = normalized.map((item, index) => ({
    ...item,
    forecastRevenue: index === normalized.length - 1 ? item.grossRevenue : null,
  }));

  const lastIndex = normalized.length - 1;
  const lastRevenue = normalized[lastIndex].grossRevenue;
  const prevRevenue = normalized[lastIndex - 1].grossRevenue;
  const trend = lastRevenue - prevRevenue;

  const lastMonthIndex = getMonthIndex(normalized[lastIndex].month);
  const startMonthIndex = lastMonthIndex >= 0 ? lastMonthIndex : new Date().getMonth();

  let predictedRevenue = lastRevenue;

  for (let i = 1; i <= months; i += 1) {
    predictedRevenue = Math.max(0, predictedRevenue + trend);

    forecast.push({
      month: MONTH_NAMES[(startMonthIndex + i) % 12],
      grossRevenue: Math.round(predictedRevenue),
      netRevenue: null,
      actualRevenue: null,
      forecastRevenue: Math.round(predictedRevenue),
      predicted: true,
    });
  }

  return forecast;
};

const Dashboard = () => {
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [overview, setOverview] = useState({});
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  
  // --- New SaaS Data States ---
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const yearOptions = useMemo(
    () => Array.from({ length: 4 }, (_, index) => currentYear - index),
    [currentYear]
  );

  const fetchAll = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);

        const [
          overviewRes, ordersRes, salesRes, topRes, lowStockRes, statusRes,
          categoryRes, customersRes, growthRes, recentRes
        ] = await Promise.all([
          getDashboardOverview(),
          getOrdersByMonth(selectedYear),
          getSalesByMonth(selectedYear),
          getTopProducts(selectedYear, 5),
          getLowStockProducts(10, 1, 5),
          getOrderStatusSummary(selectedYear),
          getSalesByCategory(selectedYear),
          getTopCustomers(5),
          getUserGrowthByMonth(selectedYear),
          getRecentOrders(5)
        ]);

        setOverview(overviewRes?.data?.data || {});
        setOrders(normalizeList(ordersRes?.data?.data));
        setSales(normalizeList(salesRes?.data?.data));
        setTopProducts(normalizeList(topRes?.data?.data));
        setLowStock(normalizeList(lowStockRes?.data?.data));
        setOrderStatus(normalizeList(statusRes?.data?.data));
        
        // Populate new states
        setSalesByCategory(normalizeList(categoryRes?.data?.data));
        setTopCustomers(normalizeList(customersRes?.data?.data));
        setUserGrowth(normalizeList(growthRes?.data?.data));
        setRecentOrders(normalizeList(recentRes?.data?.data));

        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedYear]
  );

  useEffect(() => {
    fetchAll(false);
  }, [fetchAll]);

  const forecastSales = useMemo(() => generateSalesForecast(sales, 3), [sales]);

  const currentRevenue = toNumber(overview?.grossRevenue);
  const previousRevenue = toNumber(overview?.previousGrossRevenue);
  const netRevenue = toNumber(overview?.netRevenue);
  const totalGST = Math.max(0, currentRevenue - netRevenue);
  const totalNewUsersThisYear = userGrowth.reduce((sum, item) => sum + toNumber(item.newUsers), 0);

  const growth =
    previousRevenue === 0
      ? 0
      : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

  const salesWithGST = useMemo(
    () =>
      sales.map((item) => ({
        ...item,
        gst: Math.max(0, toNumber(item.grossRevenue) - toNumber(item.netRevenue)),
      })),
    [sales]
  );

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <main className="admin-dashboard">
        <div className="dashboard-state dashboard-error">
          <span>Dashboard unavailable</span>
          <p>{error}</p>
          <button type="button" onClick={() => fetchAll(false)}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Admin Dashboard</p>
          <h1>Command Center</h1>
          <p className="dashboard-subtitle">
            Track revenue, customer growth, product performance, and live operations.
          </p>
        </div>

        <div className="dashboard-actions">
          <label className="year-control" htmlFor="dashboard-year">
            <span>Year</span>
            <select
              id="dashboard-year"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="refresh-button"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing" : "Refresh Data"}
          </button>
        </div>
      </header>

      <div className="dashboard-meta">
        <span>Displaying metrics for {selectedYear}</span>
        {lastUpdated && (
          <span>
            Last synced at {lastUpdated.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <section className="dashboard-cards" aria-label="Dashboard key metrics">
        <KpiCard title="Total Users" value={overview?.totalUsers} data={userGrowth} dataKey="newUsers" tone="blue" />
        <KpiCard title="New Signups (YTD)" value={totalNewUsersThisYear} data={userGrowth} dataKey="newUsers" tone="cyan" />
        <KpiCard title="Total Orders" value={overview?.totalOrders} data={orders} dataKey="totalOrders" tone="violet" />
        <KpiCard title="Gross Revenue" value={currentRevenue} currency data={sales} dataKey="grossRevenue" tone="green" />
        <KpiCard title="Net Revenue" value={netRevenue} currency data={sales} dataKey="netRevenue" tone="amber" />
        <RevenueCompareCard current={currentRevenue} previous={previousRevenue} growth={growth} />
      </section>

      {/* Row 1: Primary Trends */}
      <section className="chart-grid">
        <ChartCard title="Revenue Forecaster" meta="Actual revenue with a 3-month projection">
          {forecastSales.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={forecastSales} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                <Legend />
                <Line type="monotone" dataKey="actualRevenue" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} name="Actual" />
                <Line type="monotone" dataKey="forecastRevenue" stroke="#dc2626" strokeDasharray="6 6" strokeWidth={3} dot={{ r: 3 }} connectNulls name="Forecast" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No revenue data available for this period." />
          )}
        </ChartCard>

        <ChartCard title="User Acquisition" meta="Monthly new user registrations">
          {userGrowth.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={userGrowth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [formatNumber(value), "New Users"]} />
                <Area type="monotone" dataKey="newUsers" stroke="#2563eb" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No user growth data available." />
          )}
        </ChartCard>
      </section>

      {/* Row 2: Breakdowns & Distributions */}
      <section className="insight-grid">
        <ChartCard title="Sales by Category" meta="Revenue drivers">
          {salesByCategory.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={salesByCategory}
                  dataKey="grossRevenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {salesByCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(value), "Revenue"]} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No category data available." />
          )}
        </ChartCard>

        <ChartCard title="Fulfilment Status" meta="Current active order states">
          {orderStatus.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={orderStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {orderStatus.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatNumber(value), "Orders"]} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Order status data is not available yet." />
          )}
        </ChartCard>

        <ChartCard title="Financial Breakdown" meta="Gross, net, and GST splits">
          <RevenueBreakdown gross={currentRevenue} net={netRevenue} gst={totalGST} />
        </ChartCard>
      </section>

      {/* Row 3: Live Feed & CRM */}
      <section className="table-grid">
        <TableSection
          title="Recent Transactions"
          meta="Live order feed"
          data={recentOrders}
          columns={[
            { key: "user", label: "Customer", render: (row) => <UserCell name={row.userId?.name} email={row.userId?.email} /> },
            { key: "totalAmount", label: "Amount", currency: true },
            { key: "paymentStatus", label: "Payment", render: (row) => <StatusBadge status={row.paymentStatus} type="payment" /> },
            { key: "orderStatus", label: "Fulfillment", render: (row) => <StatusBadge status={row.orderStatus} type="order" /> },
          ]}
          emptyMessage="No recent orders."
        />

        <TableSection
          title="Top Customers"
          meta="Highest lifetime value (LTV)"
          data={topCustomers}
          columns={[
            { key: "user", label: "Customer", render: (row) => <UserCell name={row.name} email={row.email} /> },
            { key: "totalOrders", label: "Orders", numeric: true },
            { key: "lifetimeSpent", label: "Total Spent", currency: true },
          ]}
          emptyMessage="No customer data yet."
        />
      </section>

      {/* Row 4: Inventory Insights */}
      <section className="table-grid">
        <TableSection
          title="Top Selling Products"
          meta="Best performing stock"
          data={topProducts}
          columns={[
            { key: "name", label: "Product" },
            { key: "soldQuantity", label: "Units Sold", numeric: true },
            { key: "grossRevenue", label: "Revenue Generated", currency: true },
          ]}
          emptyMessage="No top products to show yet."
        />

        <TableSection
          title="Low Stock Alerts"
          meta="Items requiring restock"
          data={lowStock}
          columns={[
            { key: "name", label: "Product" },
            { key: "brand", label: "Brand" },
            { key: "stock", label: "Stock Level", numeric: true },
          ]}
          highlightLowStock
          emptyMessage="Inventory levels look good."
        />
      </section>
    </main>
  );
};

// --- Subcomponents ---

const KpiCard = ({ title, value = 0, currency = false, data = [], dataKey, tone = "blue" }) => {
  const numericValue = toNumber(value);
  const [display, setDisplay] = useState(numericValue);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setDisplay(numericValue);
      return;
    }
    let frameId;
    const startedAt = window.performance.now();
    const duration = 700;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setDisplay(Math.round(numericValue * progress));
      if (progress < 1) frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [numericValue]);

  return (
    <article className={`dashboard-card kpi-card tone-${tone}`}>
      <div className="kpi-top"><span>{title}</span></div>
      <strong className="dashboard-card-value">
        {currency ? formatCurrency(display) : formatNumber(display)}
      </strong>
      <div className="sparkline" aria-hidden="true">
        {data.length ? (
          <ResponsiveContainer width="100%" height={56}>
            <LineChart data={data}>
              <Line dataKey={dataKey} stroke="var(--accent)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="sparkline-empty" />
        )}
      </div>
    </article>
  );
};

const RevenueCompareCard = ({ current, previous, growth }) => {
  const isPositive = growth >= 0;
  return (
    <article className="dashboard-card revenue-card">
      <div className="kpi-top"><span>Period Compare (YOY)</span></div>
      <strong className="dashboard-card-value">{formatCurrency(current)}</strong>
      <div className={`revenue-growth ${isPositive ? "positive" : "negative"}`}>
        {isPositive ? "↑ " : "↓ "}
        {Math.abs(growth).toFixed(1)}%
        <span> vs last year</span>
      </div>
      <p className="previous-revenue">Previous: {formatCurrency(previous)}</p>
    </article>
  );
};

const ChartCard = ({ title, meta, children }) => (
  <article className="chart-section">
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {meta && <p>{meta}</p>}
      </div>
    </div>
    {children}
  </article>
);

const RevenueBreakdown = ({ gross, net, gst }) => {
  const safeGross = Math.max(toNumber(gross), 1);
  const rows = [
    { label: "Net revenue", value: net, tone: "net" },
    { label: "GST collected", value: gst, tone: "gst" },
  ];

  return (
    <div className="revenue-breakdown">
      <div className="gross-total">
        <span>Gross Revenue</span>
        <strong>{formatCurrency(gross)}</strong>
      </div>
      <div className="breakdown-list">
        {rows.map((row) => {
          const width = Math.min((toNumber(row.value) / safeGross) * 100, 100);
          return (
            <div className="breakdown-row" key={row.label}>
              <div className="breakdown-label">
                <span>{row.label}</span>
                <strong>{formatCurrency(row.value)}</strong>
              </div>
              <div className="breakdown-track">
                <div className={`breakdown-fill ${row.tone}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Custom Cell Renderers ---
const UserCell = ({ name, email }) => (
  <div className="user-cell">
    <div className="user-avatar">{name ? name.charAt(0).toUpperCase() : "U"}</div>
    <div className="user-info">
      <span className="user-name">{name || "Unknown User"}</span>
      <span className="user-email">{email || "No email provided"}</span>
    </div>
  </div>
);

const StatusBadge = ({ status, type }) => {
  const normalized = String(status || "unknown").toLowerCase();
  let statusClass = "status-neutral";

  if (["paid", "delivered", "completed", "captured"].includes(normalized)) statusClass = "status-success";
  else if (["pending", "processing", "shipped"].includes(normalized)) statusClass = "status-warning";
  else if (["failed", "cancelled", "refunded"].includes(normalized)) statusClass = "status-danger";

  return <span className={`status-badge ${statusClass}`}>{status || "N/A"}</span>;
};

// --- Dynamic Table Section ---
const TableSection = ({ title, meta, data, columns, highlightLowStock, emptyMessage }) => {
  const rows = normalizeList(data);

  return (
    <article className="table-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {meta && <p>{meta}</p>}
        </div>
      </div>
      {rows.length ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={col.key || idx} className={col.numeric || col.currency ? "table-number" : undefined}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row?._id || row?.id || `${title}-${index}`}>
                  {columns.map((col, idx) => (
                    <td key={col.key || idx} className={col.numeric || col.currency ? "table-number" : undefined}>
                      {renderCell(row, col, highlightLowStock)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState compact message={emptyMessage} />
      )}
    </article>
  );
};

const renderCell = (row, col, highlightLowStock) => {
  if (col.render) return col.render(row);
  const value = row?.[col.key];

  if (highlightLowStock && col.key === "stock") {
    const stock = toNumber(value);
    return <span className={`stock-pill ${stock <= 5 ? "critical" : "low"}`}>{formatNumber(stock)}</span>;
  }

  if (col.currency) return formatCurrency(value);
  if (col.numeric) return formatNumber(value);

  return value ?? "-";
};

const EmptyState = ({ message, compact = false }) => (
  <div className={`empty-state ${compact ? "compact" : ""}`}>
    <span>No data available</span>
    <p>{message}</p>
  </div>
);

const DashboardSkeleton = () => (
  <main className="admin-dashboard">
    <div className="dashboard-header">
      <div>
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-subtitle" />
      </div>
    </div>
    <div className="dashboard-cards">
      {Array.from({ length: 6 }).map((_, i) => <div className="skeleton skeleton-card" key={i} />)}
    </div>
    <div className="chart-grid">
      <div className="skeleton skeleton-panel" />
      <div className="skeleton skeleton-panel" />
    </div>
  </main>
);

export default Dashboard;