import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  date?: string;
  time?: string;
  successful?: number;
  failed?: number;
  duration?: number;
}

interface SimpleBarChartProps {
  data: ChartData[];
  successKey: string;
  failKey: string;
}

interface SimpleLineChartProps {
  data: ChartData[];
  valueKey: string;
  labelKey: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  successKey,
  failKey,
}) => {
  const maxValue = Math.max(
    ...data.map((item) => (item[successKey] || 0) + (item[failKey] || 0)),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">Successful</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-600">Failed</span>
        </div>
      </div>

      <div className="h-64 flex items-end justify-between space-x-2 px-4">
        {data.map((item, index) => {
          const successValue = item[successKey] || 0;
          const failValue = item[failKey] || 0;
          const totalValue = successValue + failValue;
          const successHeight =
            maxValue > 0 ? (successValue / maxValue) * 200 : 0;
          const failHeight = maxValue > 0 ? (failValue / maxValue) * 200 : 0;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center space-y-2 group"
            >
              <div className="w-full max-w-8 flex flex-col items-center">
                <div
                  className="w-full bg-red-500 rounded-t transition-all duration-300 group-hover:opacity-80 relative"
                  style={{ height: `${failHeight}px` }}
                  title={`Failed: ${failValue}`}
                >
                  {failValue > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      {failValue}
                    </div>
                  )}
                </div>
                <div
                  className="w-full bg-green-500 transition-all duration-300 group-hover:opacity-80 relative"
                  style={{
                    height: `${successHeight}px`,
                    borderRadius: failValue > 0 ? "0" : "0.25rem 0.25rem 0 0",
                  }}
                  title={`Successful: ${successValue}`}
                >
                  {successValue > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      {successValue}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center transform -rotate-45 origin-center whitespace-nowrap">
                {item.date ? item.date.split("-").slice(1).join("/") : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  valueKey,
  labelKey,
}) => {
  const maxValue = Math.max(...data.map((item) => item[valueKey] || 0));
  const minValue = Math.min(...data.map((item) => item[valueKey] || 0));
  const range = maxValue - minValue;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-2 text-sm">
        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
        <span className="text-gray-600">Deployment Duration (minutes)</span>
      </div>

      <div className="h-64 relative px-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
          <span>{maxValue.toFixed(1)}</span>
          <span>{((maxValue + minValue) / 2).toFixed(1)}</span>
          <span>{minValue.toFixed(1)}</span>
        </div>

        {/* Chart area */}
        <div className="ml-8 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute w-full border-t border-gray-200 opacity-50"
                style={{ top: `${i * 25}%` }}
              />
            ))}
          </div>

          {/* Line chart */}
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            {/* Line path */}
            <polyline
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="0.5"
              points={data
                .map((item, index) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y =
                    range > 0
                      ? ((maxValue - (item[valueKey] || 0)) / range) * 100
                      : 50;
                  return `${x},${y}`;
                })
                .join(" ")}
            />

            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y =
                range > 0
                  ? ((maxValue - (item[valueKey] || 0)) / range) * 100
                  : 50;
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="1"
                    fill="#3b82f6"
                    className="hover:r-2 transition-all duration-200"
                  />
                  <title>{`${item[labelKey]}: ${item[valueKey]} min`}</title>
                </g>
              );
            })}
          </svg>

          {/* X-axis labels */}
          <div className="absolute -bottom-6 left-0 w-full flex justify-between text-xs text-gray-500">
            {data.map((item, index) => (
              <span key={index} className="text-center">
                {item[labelKey]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SimpleCharts = () => {
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
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-red-50">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Deployment Success Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <SimpleBarChart
            data={deploymentData}
            successKey="successful"
            failKey="failed"
          />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Average Deployment Time
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <SimpleLineChart
            data={performanceData}
            valueKey="duration"
            labelKey="time"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleCharts;
