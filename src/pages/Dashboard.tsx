import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  History,
} from "lucide-react";

import PipelineStatus from "@/components/dashboard/PipelineStatus";
import SimpleCharts from "@/components/dashboard/SimpleCharts";
import RecentActivity from "@/components/dashboard/RecentActivity";

const Dashboard = () => {
  const [showPipelineHistory, setShowPipelineHistory] = useState(false);

  // Mock data - in real app this would come from APIs
  const stats = {
    totalPipelines: 156,
    activePipelines: 12,
    successfulDeployments: 142,
    failedDeployments: 8,
    avgDeploymentTime: "4.2 min",
    uptime: "99.8%",
  };

  // Extended pipeline data for Active Pipelines
  const activePipelines = [
    {
      id: "PL-001",
      name: "Customer Integration Package",
      status: "running",
      stage: "Stage 6: Upload Artifacts",
      startTime: "2024-01-20 14:30",
      progress: 75,
      estimatedCompletion: "2024-01-20 15:15",
      author: "John Smith",
    },
    {
      id: "PL-007",
      name: "Financial Data Synchronization",
      status: "running",
      stage: "Stage 3: Configuration",
      startTime: "2024-01-20 14:45",
      progress: 35,
      estimatedCompletion: "2024-01-20 16:30",
      author: "Mike Johnson",
    },
    {
      id: "PL-012",
      name: "Inventory Management Suite",
      status: "running",
      stage: "Stage 8: Testing",
      startTime: "2024-01-20 13:20",
      progress: 95,
      estimatedCompletion: "2024-01-20 15:10",
      author: "Sarah Wilson",
    },
    {
      id: "PL-015",
      name: "Employee Onboarding Workflow",
      status: "running",
      stage: "Stage 2: iFlow Selection",
      startTime: "2024-01-20 14:50",
      progress: 25,
      estimatedCompletion: "2024-01-20 17:00",
      author: "Robert Chen",
    },
    {
      id: "PL-018",
      name: "Product Catalog Integration",
      status: "running",
      stage: "Stage 5: Dependencies",
      startTime: "2024-01-20 14:20",
      progress: 60,
      estimatedCompletion: "2024-01-20 16:00",
      author: "Lisa Anderson",
    },
    {
      id: "PL-021",
      name: "Supplier Portal Connect",
      status: "running",
      stage: "Stage 7: Deploy",
      startTime: "2024-01-20 13:00",
      progress: 85,
      estimatedCompletion: "2024-01-20 15:30",
      author: "David Kim",
    },
  ];

  // Extended pipeline data for Recent Completions
  const recentCompletions = [
    {
      id: "PL-002",
      name: "Order Management iFlows",
      status: "completed",
      stage: "Completed",
      startTime: "2024-01-20 13:15",
      endTime: "2024-01-20 14:22",
      progress: 100,
      author: "Jane Doe",
      duration: "1h 7m",
    },
    {
      id: "PL-003",
      name: "Payment Processing Suite",
      status: "failed",
      stage: "Stage 4: Design Validation",
      startTime: "2024-01-20 12:45",
      endTime: "2024-01-20 13:10",
      progress: 40,
      author: "Alex Brown",
      duration: "25m",
      errorMessage: "Design validation failed - security compliance issues",
    },
    {
      id: "PL-004",
      name: "Customer Service Integration",
      status: "completed",
      stage: "Completed",
      startTime: "2024-01-20 11:30",
      endTime: "2024-01-20 12:45",
      progress: 100,
      author: "Emma Davis",
      duration: "1h 15m",
    },
    {
      id: "PL-005",
      name: "Marketing Automation Flow",
      status: "completed",
      stage: "Completed",
      startTime: "2024-01-20 10:15",
      endTime: "2024-01-20 11:20",
      progress: 100,
      author: "Tom Wilson",
      duration: "1h 5m",
    },
    {
      id: "PL-006",
      name: "HR Data Migration",
      status: "failed",
      stage: "Stage 6: Upload Artifacts",
      startTime: "2024-01-20 09:30",
      endTime: "2024-01-20 10:05",
      progress: 70,
      author: "Maria Garcia",
      duration: "35m",
      errorMessage: "Network timeout during artifact upload",
    },
    {
      id: "PL-008",
      name: "Sales Performance Analytics",
      status: "completed",
      stage: "Completed",
      startTime: "2024-01-19 16:45",
      endTime: "2024-01-19 17:50",
      progress: 100,
      author: "Chris Johnson",
      duration: "1h 5m",
    },
    {
      id: "PL-009",
      name: "Quality Management System",
      status: "completed",
      stage: "Completed",
      startTime: "2024-01-19 15:20",
      endTime: "2024-01-19 16:30",
      progress: 100,
      author: "Nina Patel",
      duration: "1h 10m",
    },
    {
      id: "PL-010",
      name: "Compliance Reporting Suite",
      status: "failed",
      stage: "Stage 7: Deploy",
      startTime: "2024-01-19 14:00",
      endTime: "2024-01-19 14:45",
      progress: 80,
      author: "James Lee",
      duration: "45m",
      errorMessage: "Deployment failed - target environment unavailable",
    },
  ];

  // Pipeline History - last 30 pipelines
  const pipelineHistory = [
    ...activePipelines,
    ...recentCompletions,
    // Additional historical data
    {
      id: "PL-011",
      name: "Legacy System Bridge",
      status: "completed",
      stage: "Completed",
      startTime: "2024-01-19 13:00",
      endTime: "2024-01-19 14:15",
      progress: 100,
      author: "Kevin Zhang",
      duration: "1h 15m",
    },
    {
      id: "PL-013",
      name: "Document Management Flow",
      status: "completed",
      stage: "Completed",
      startTime: "2024-01-19 11:30",
      endTime: "2024-01-19 12:40",
      progress: 100,
      author: "Laura Martinez",
      duration: "1h 10m",
    },
    {
      id: "PL-014",
      name: "Training Portal Integration",
      status: "failed",
      stage: "Stage 3: Configuration",
      startTime: "2024-01-19 10:00",
      endTime: "2024-01-19 10:30",
      progress: 30,
      author: "Ryan O'Connor",
      duration: "30m",
      errorMessage: "Configuration validation failed",
    },
    {
      id: "PL-016",
      name: "Budget Planning Workflow",
      status: "completed",
      stage: "Completed",
      startTime: "2024-01-18 16:00",
      endTime: "2024-01-18 17:20",
      progress: 100,
      author: "Sophie Turner",
      duration: "1h 20m",
    },
    {
      id: "PL-017",
      name: "Vendor Management System",
      status: "completed",
      stage: "Completed",
      startTime: "2024-01-18 14:30",
      endTime: "2024-01-18 15:45",
      progress: 100,
      author: "Michael Brown",
      duration: "1h 15m",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Monitor and manage your CI/CD pipelines
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPipelineHistory(true)}
          >
            <History className="w-4 h-4 mr-2" />
            Pipeline History
          </Button>
          <Button>
            <GitBranch className="w-4 h-4 mr-2" />
            New Pipeline
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pipelines
            </CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPipelines}</div>
            <p className="text-xs text-muted-foreground">+12 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Pipelines
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.activePipelines}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94.7%</div>
            <p className="text-xs text-muted-foreground">
              +2.4% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Deploy Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDeploymentTime}</div>
            <p className="text-xs text-muted-foreground">
              -0.8 min from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pipelines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipelines">Pipeline Status</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Pipelines */}
            <Card>
              <CardHeader>
                <CardTitle>Active Pipelines</CardTitle>
                <CardDescription>
                  Currently running pipeline executions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PipelineStatus pipelines={activePipelines} type="active" />
              </CardContent>
            </Card>

            {/* Recent Completions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Completions</CardTitle>
                <CardDescription>
                  Latest completed and failed pipelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PipelineStatus
                  pipelines={recentCompletions}
                  type="completed"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <SimpleCharts />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <RecentActivity />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <GitBranch className="w-6 h-6" />
              <span>Start New Pipeline</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Users className="w-6 h-6" />
              <span>Manage Environments</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Zap className="w-6 h-6" />
              <span>View System Health</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline History Dialog */}
      <Dialog open={showPipelineHistory} onOpenChange={setShowPipelineHistory}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Pipeline History</span>
            </DialogTitle>
            <DialogDescription>
              Complete history of all pipeline executions (last 30 runs)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {pipelineHistory.map((pipeline) => (
              <div
                key={pipeline.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    {pipeline.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : pipeline.status === "failed" ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {pipeline.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {pipeline.id}
                      </Badge>
                      <Badge
                        variant={
                          pipeline.status === "completed"
                            ? "default"
                            : pipeline.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {pipeline.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Author:</span>{" "}
                        {pipeline.author}
                      </div>
                      <div>
                        <span className="font-medium">Started:</span>{" "}
                        {pipeline.startTime}
                      </div>
                      {pipeline.duration && (
                        <div>
                          <span className="font-medium">Duration:</span>{" "}
                          {pipeline.duration}
                        </div>
                      )}
                      {pipeline.status === "running" ? (
                        <div>
                          <span className="font-medium">Progress:</span>{" "}
                          {pipeline.progress}%
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium">Stage:</span>{" "}
                          {pipeline.stage}
                        </div>
                      )}
                    </div>

                    {pipeline.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        {pipeline.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
