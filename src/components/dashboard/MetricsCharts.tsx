import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const MetricsCharts = () => {
  const deploymentData = [
    { date: "2024-01-14", successful: 12, failed: 1 },
    { date: "2024-01-15", successful: 15, failed: 2 },
    { date: "2024-01-16", successful: 10, failed: 0 },
    { date: "2024-01-17", successful: 18, failed: 1 },
    { date: "2024-01-18", successful: 14, failed: 3 },
    { date: "2024-01-19", successful: 16, failed: 1 },
    { date: "2024-01-20", successful: 8, failed: 0 },
  ];

  const performanceData = [
    { time: "00:00", duration: 4.2 },
    { time: "04:00", duration: 3.8 },
    { time: "08:00", duration: 5.1 },
    { time: "12:00", duration: 4.7 },
    { time: "16:00", duration: 3.9 },
    { time: "20:00", duration: 4.3 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Deployment Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={deploymentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e4e7"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                domain={[0, "dataMax + 2"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e0e4e7",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "#374151", fontWeight: "bold" }}
              />
              <Bar
                dataKey="successful"
                fill="#30914c"
                name="Successful"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="failed"
                fill="#e52222"
                name="Failed"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Deployment Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={performanceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e4e7"
                opacity={0.5}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                domain={["dataMin - 0.5", "dataMax + 0.5"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e0e4e7",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "#374151", fontWeight: "bold" }}
                formatter={(value: number) => [`${value} min`, "Duration"]}
              />
              <Line
                type="monotone"
                dataKey="duration"
                stroke="#0070f3"
                strokeWidth={3}
                name="Duration (min)"
                dot={{ fill: "#0070f3", strokeWidth: 2, r: 6 }}
                activeDot={{
                  r: 8,
                  stroke: "#0070f3",
                  strokeWidth: 2,
                  fill: "#ffffff",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsCharts;
