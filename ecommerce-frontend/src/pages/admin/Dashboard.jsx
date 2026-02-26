import { useEffect, useState, useCallback } from "react";
import {
  getDashboardOverview,
  getOrdersByMonth,
  getSalesByMonth,
  getTopProducts,
  getLowStockProducts,
  getOrderStatusSummary,
} from "../../api/adminApi";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF0000", "#A020F0"];

const Dashboard = () => {
  const year = new Date().getFullYear();

  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        overviewRes,
        ordersRes,
        salesRes,
        topRes,
        lowStockRes,
        statusRes,
      ] = await Promise.all([
        getDashboardOverview(),
        getOrdersByMonth(year),
        getSalesByMonth(year),
        getTopProducts(year, 5),
        getLowStockProducts(10, 1, 5),
        getOrderStatusSummary(year),
      ]);

      setOverview(overviewRes.data.data);
      setOrders(ordersRes.data.data);
      setSales(salesRes.data.data);
      setTopProducts(topRes.data.data);
      setLowStock(lowStockRes.data.data);
      setOrderStatus(statusRes.data.data);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading)
    return <div className="dashboard-loading">Loading Dashboard...</div>;

  if (error)
    return <div className="dashboard-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* ================= Overview Cards ================= */}
      <div className="dashboard-cards">
        <Card title="Total users" value={overview?.totalUsers} />
        <Card title="Total Orders" value={overview?.totalOrders} />
        <Card title="Gross Revenue" value={`₹${overview?.grossRevenue}`} />
        <Card title="Net Revenue" value={`₹${overview?.netRevenue}`} />
        <Card title="GST Collected" value={`₹${overview?.gstCollected}`} />
      </div>

      {/* ================= Orders By Month ================= */}
      <div className="chart-section">
        <h2>Orders By Month</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orders}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalOrders" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ================= Sales By Month ================= */}
      <div className="chart-section">
        <h2>Sales By Month (Gross Revenue)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="grossRevenue"
              stroke="#82ca9d"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ================= Top Products ================= */}
      <TableSection
        title="Top Selling Products"
        data={topProducts}
        columns={[
          { key: "name", label: "Product Name" },
          { key: "soldQuantity", label: "Sold Quantity" },
          { key: "grossRevenue", label: "Revenue", currency: true },
        ]}
      />

      {/* ================= Low Stock ================= */}
      <TableSection
        title="Low Stock Products"
        data={lowStock}
        columns={[
          { key: "name", label: "Product Name" },
          { key: "stock", label: "Stock" },
          { key: "brand", label: "Brand" },
        ]}
        highlightLowStock
      />

      {/* ================= Order Status ================= */}
      <div className="chart-section">
        <h2>Order Status Summary</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={orderStatus}
              dataKey="count"
              nameKey="status"
              outerRadius={100}
              label
            >
              {orderStatus.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ================= Reusable Components ================= */

const Card = ({ title, value }) => (
  <div className="dashboard-card">
    <div className="dashboard-card-title">{title}</div>
    <div className="dashboard-card-value">{value}</div>
  </div>
);

const TableSection = ({ title, data, columns, highlightLowStock }) => (
  <div className="table-section">
    <h2>{title}</h2>

    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={
                    highlightLowStock && col.key === "stock"
                      ? "low-stock"
                      : ""
                  }
                >
                  {col.currency
                    ? `₹${row[col.key]}`
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Dashboard;