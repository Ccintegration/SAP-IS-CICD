import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  GitBranch,
  Upload,
  TestTube,
} from "lucide-react";

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: "deployment",
      status: "success",
      message: "Customer Integration Package deployed successfully",
      user: "John Smith",
      timestamp: "2024-01-20 16:30",
      pipeline: "PL-001",
    },
    {
      id: 2,
      type: "test",
      status: "success",
      message: "Test suite completed for Order Management iFlows",
      user: "Jane Doe",
      timestamp: "2024-01-20 16:15",
      pipeline: "PL-002",
    },
    {
      id: 3,
      type: "validation",
      status: "warning",
      message: "Design validation warnings for Payment Processing Suite",
      user: "Mike Johnson",
      timestamp: "2024-01-20 15:45",
      pipeline: "PL-003",
    },
    {
      id: 4,
      type: "upload",
      status: "success",
      message: "Artifacts uploaded to Integration Suite",
      user: "Sarah Wilson",
      timestamp: "2024-01-20 15:30",
      pipeline: "PL-004",
    },
    {
      id: 5,
      type: "deployment",
      status: "error",
      message: "Deployment failed due to connection timeout",
      user: "Robert Chen",
      timestamp: "2024-01-20 14:50",
      pipeline: "PL-005",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "deployment":
        return GitBranch;
      case "test":
        return TestTube;
      case "upload":
        return Upload;
      case "validation":
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      error: "destructive",
      warning: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.type);

            return (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <ActivityIcon className="w-5 h-5 text-sap-blue" />
                  {getStatusIcon(activity.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    {getStatusBadge(activity.status)}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {activity.user}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.timestamp}
                    </div>
                    <div className="flex items-center">
                      <GitBranch className="w-3 h-3 mr-1" />
                      {activity.pipeline}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
