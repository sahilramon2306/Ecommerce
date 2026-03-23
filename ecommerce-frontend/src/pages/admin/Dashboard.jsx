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

const COLORS = ["#4f46e5","#22c55e","#f59e0b","#ef4444","#06b6d4","#a855f7"];

/* ---------------- SALES FORECAST ---------------- */

const generateSalesForecast = (salesData, months = 3) => {

  if (!salesData || salesData.length < 2) return salesData;

  const forecast = [...salesData];

  const lastIndex = salesData.length - 1;

  const lastRevenue = salesData[lastIndex].grossRevenue;
  const prevRevenue = salesData[lastIndex - 1].grossRevenue;

  const trend = lastRevenue - prevRevenue;

  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  let lastMonthIndex = monthNames.indexOf(
    salesData[lastIndex].month
  );

  let predictedRevenue = lastRevenue;

  for (let i = 1; i <= months; i++) {

    predictedRevenue += trend;

    const nextMonth =
      monthNames[(lastMonthIndex + i) % 12];

    forecast.push({
      month: nextMonth,
      grossRevenue: predictedRevenue,
      predicted: true
    });

  }

  return forecast;
};


/* ---------------- DASHBOARD ---------------- */

const Dashboard = () => {

  const year = new Date().getFullYear();

  const [range,setRange] = useState("year");

  const [overview,setOverview] = useState({});
  const [orders,setOrders] = useState([]);
  const [sales,setSales] = useState([]);
  const [topProducts,setTopProducts] = useState([]);
  const [lowStock,setLowStock] = useState([]);
  const [orderStatus,setOrderStatus] = useState([]);

  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);

  const fetchAll = useCallback(async()=>{

    try{

      const [
        overviewRes,
        ordersRes,
        salesRes,
        topRes,
        lowStockRes,
        statusRes
      ] = await Promise.all([
        getDashboardOverview(range),
        getOrdersByMonth(year),
        getSalesByMonth(year),
        getTopProducts(year,5),
        getLowStockProducts(10,1,5),
        getOrderStatusSummary(year)
      ]);

      setOverview(overviewRes.data.data);
      setOrders(ordersRes.data.data);
      setSales(salesRes.data.data);
      setTopProducts(topRes.data.data);
      setLowStock(lowStockRes.data.data);
      setOrderStatus(statusRes.data.data);

    }
    catch(err){
      console.error(err);
      setError("Failed to load dashboard");
    }
    finally{
      setLoading(false);
    }

  },[year,range]);

  useEffect(()=>{
    fetchAll();
  },[fetchAll]);

  const forecastSales = generateSalesForecast(sales,3);

  if(loading) return <div className="dashboard-loading">Loading Dashboard...</div>;
  if(error) return <div className="dashboard-error">{error}</div>;

  /* ---------------- REVENUE CALCULATIONS ---------------- */

  const currentRevenue = overview?.grossRevenue || 0;
  const previousRevenue = overview?.previousGrossRevenue || 0;
  const netRevenue = overview?.netRevenue || 0;

  /* GST Calculation */
  const totalGST = currentRevenue - netRevenue;

  const growth =
    previousRevenue === 0
      ? 0
      : ((currentRevenue - previousRevenue) / previousRevenue) * 100;


  return (

    <div className="admin-dashboard">

      <div className="dashboard-header">

        <h1>Admin Analytics Dashboard</h1>
        
      </div>


      {/* KPI */}

      <div className="dashboard-cards">

        <KpiCard
          title="Total Users"
          value={overview?.totalUsers}
          data={orders}
          dataKey="totalOrders"
        />

        <KpiCard
          title="Total Orders"
          value={overview?.totalOrders}
          data={orders}
          dataKey="totalOrders"
        />

        <KpiCard
          title="Gross Revenue"
          value={overview?.grossRevenue}
          prefix="₹"
          data={sales}
          dataKey="grossRevenue"
        />

        <KpiCard
          title="Net Revenue"
          value={overview?.netRevenue}
          prefix="₹"
          data={sales}
          dataKey="netRevenue"
        />

        {/* GST KPI */}
        <KpiCard
          title="Total GST Collection"
          value={totalGST}
          prefix="₹"
          data={sales.map(item => ({
            ...item,
            gst: item.grossRevenue - item.netRevenue
          }))}
          dataKey="gst"
        />

        <RevenueCompareCard
          current={currentRevenue}
          previous={previousRevenue}
          growth={growth}
        />

      </div>


      {/* CHARTS */}

      <div className="chart-grid">

        <ChartCard title="Orders Growth">

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orders}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="month"/>
              <YAxis/>
              <Tooltip/>
              <Bar dataKey="totalOrders" fill="#4f46e5"/>
            </BarChart>
          </ResponsiveContainer>

        </ChartCard>


        <ChartCard title="Revenue Trend + AI Forecast">

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={forecastSales}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="month"/>
              <YAxis/>
              <Tooltip/>
              <Legend/>

              <Line
                dataKey="grossRevenue"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r:3 }}
                name="Revenue"
              />

              <Line
                dataKey="grossRevenue"
                stroke="#ef4444"
                strokeDasharray="6 6"
                strokeWidth={3}
                dot={{ r:4 }}
                name="AI Forecast"
              />

            </LineChart>
          </ResponsiveContainer>

        </ChartCard>

      </div>


      {/* ORDER STATUS */}

      <ChartCard title="Order Status Distribution">

        <ResponsiveContainer width="100%" height={320}>
          <PieChart>

            <Pie
              data={orderStatus}
              dataKey="count"
              nameKey="status"
              outerRadius={110}
              label
            >
              {orderStatus.map((_,index)=>(
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip/>

          </PieChart>
        </ResponsiveContainer>

      </ChartCard>


      {/* TABLES */}

      <div className="table-grid">

        <TableSection
          title="Top Selling Products"
          data={topProducts}
          columns={[
            {key:"name",label:"Product"},
            {key:"soldQuantity",label:"Sold"},
            {key:"grossRevenue",label:"Revenue",currency:true}
          ]}
        />

        <TableSection
          title="Low Stock Products"
          data={lowStock}
          columns={[
            {key:"name",label:"Product"},
            {key:"stock",label:"Stock"},
            {key:"brand",label:"Brand"}
          ]}
          highlightLowStock
        />

      </div>

    </div>

  );

};


/* ---------------- KPI CARD ---------------- */

const KpiCard = ({title,value=0,prefix="",data,dataKey})=>{

  const [display,setDisplay] = useState(0);

  useEffect(()=>{

    let start=0;
    const step=value/40;

    const timer=setInterval(()=>{

      start+=step;

      if(start>=value){
        start=value;
        clearInterval(timer);
      }

      setDisplay(Math.floor(start));

    },20);

    return ()=>clearInterval(timer);

  },[value]);

  return(

    <div className="dashboard-card">

      <div className="dashboard-card-title">{title}</div>

      <div className="dashboard-card-value">
        {prefix}{display.toLocaleString()}
      </div>

      <div className="sparkline">

        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={data}>
            <Line
              dataKey={dataKey}
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

      </div>

    </div>

  );

};


/* ---------------- REVENUE COMPARE ---------------- */

const RevenueCompareCard = ({current,previous,growth})=>(

  <div className="dashboard-card revenue-card" id="Revenue-Comparison">

    <div className="dashboard-card-title">Revenue Comparison</div>

    <div className="dashboard-card-value">
      ₹{current?.toLocaleString()}
    </div>

    <div className={`revenue-growth ${growth>=0?"positive":"negative"}`}>

      {growth>=0?"▲":"▼"} {Math.abs(growth).toFixed(1)}%

      <span> vs last period</span>

    </div>

  </div>

);


/* ---------------- CHART CARD ---------------- */

const ChartCard = ({title,children})=>(
  <div className="chart-section">
    <h2>{title}</h2>
    {children}
  </div>
);


/* ---------------- TABLE ---------------- */

const TableSection = ({title,data,columns,highlightLowStock})=>(

  <div className="table-section">

    <h2>{title}</h2>

    <div className="table-wrapper">

      <table>

        <thead>
          <tr>
            {columns.map(col=>(
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>

          {data.map((row,index)=>(

            <tr key={index}>

              {columns.map(col=>(
                <td
                  key={col.key}
                  className={
                    highlightLowStock && col.key==="stock"
                      ?"low-stock"
                      :""
                  }
                >
                  {col.currency
                    ?`₹${row[col.key]}`
                    :row[col.key]}
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