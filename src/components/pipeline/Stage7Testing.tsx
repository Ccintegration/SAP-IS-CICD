import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  PlayCircle,
  FileText,
  Activity,
  Zap,
  Globe,
  Package,
  Download,
  Eye,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TestCase {
  id: string;
  name: string;
  type: "functional" | "performance" | "integration" | "security";
  description: string;
  expectedResult: string;
}

interface TestResult {
  iflowId: string;
  iflowName: string;
  version: string;
  status: "pending" | "running" | "passed" | "failed" | "warning";
  progress: number;
  testCases: {
    [key: string]: {
      status: "pending" | "running" | "passed" | "failed";
      executionTime?: number;
      result?: string;
      error?: string;
    };
  };
  overallScore: number;
  startTime?: string;
  endTime?: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  message?: string;
  targetEnvironment: string;
}

interface Stage8Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage7Testing: React.FC<Stage8Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState("development");
  const [error, setError] = useState<string | null>(null);
  const [testReport, setTestReport] = useState<string>("");

  const environments = [
    {
      id: "development",
      name: "Development",
      color: "bg-blue-100 text-blue-800",
      endpoint: "dev.company.com",
    },
    {
      id: "testing",
      name: "Testing",
      color: "bg-yellow-100 text-yellow-800",
      endpoint: "test.company.com",
    },
    {
      id: "production",
      name: "Production",
      color: "bg-green-100 text-green-800",
      endpoint: "prod.company.com",
    },
  ];

  const defaultTestCases: TestCase[] = [
    {
      id: "connectivity_test",
      name: "Connectivity Test",
      type: "functional",
      description: "Test basic connectivity to the integration flow endpoint",
      expectedResult: "HTTP 200 response with valid payload",
    },
    {
      id: "authentication_test",
      name: "Authentication Test",
      type: "security",
      description: "Verify authentication and authorization mechanisms",
      expectedResult: "Proper authentication handling",
    },
    {
      id: "data_transformation_test",
      name: "Data Transformation Test",
      type: "functional",
      description: "Test data mapping and transformation logic",
      expectedResult: "Correct data transformation according to mapping rules",
    },
    {
      id: "error_handling_test",
      name: "Error Handling Test",
      type: "functional",
      description: "Test error scenarios and exception handling",
      expectedResult: "Proper error responses and logging",
    },
    {
      id: "performance_test",
      name: "Performance Test",
      type: "performance",
      description: "Test response time and throughput under normal load",
      expectedResult: "Response time < 5 seconds, throughput > 100 TPS",
    },
    {
      id: "integration_test",
      name: "End-to-End Integration Test",
      type: "integration",
      description: "Test complete integration flow with real data",
      expectedResult: "Successful end-to-end data flow",
    },
  ];

  useEffect(() => {
    initializeTestResults();
  }, [data.deploymentResults]);

  const initializeTestResults = () => {
    // Use deployment results to get the environment and deployed iFlows
    const deploymentData = data.deploymentResults;
    if (!deploymentData) {
      setError(
        "No deployment results found. Please complete deployment first.",
      );
      return;
    }

    setSelectedEnvironment(deploymentData.environment || "development");

    // Filter only successfully deployed iFlows
    const deployedIFlows =
      deploymentData.results?.filter((r: any) => r.status === "deployed") || [];

    if (deployedIFlows.length === 0) {
      setError("No successfully deployed iFlows found for testing.");
      return;
    }

    const results: TestResult[] = deployedIFlows.map((deployment: any) => {
      const testCases: any = {};
      defaultTestCases.forEach((testCase) => {
        testCases[testCase.id] = {
          status: "pending",
        };
      });

      return {
        iflowId: deployment.iflowId,
        iflowName: deployment.iflowName,
        version: deployment.version,
        status: "pending" as const,
        progress: 0,
        testCases,
        overallScore: 0,
        totalTests: defaultTestCases.length,
        passedTests: 0,
        failedTests: 0,
        warningTests: 0,
        targetEnvironment: deploymentData.environment,
      };
    });

    setTestResults(results);
  };

  const runSingleTest = async (
    result: TestResult,
    testCase: TestCase,
  ): Promise<void> => {
    setTestResults((prev) =>
      prev.map((r) =>
        r.iflowId === result.iflowId
          ? {
              ...r,
              testCases: {
                ...r.testCases,
                [testCase.id]: {
                  ...r.testCases[testCase.id],
                  status: "running",
                },
              },
            }
          : r,
      ),
    );

    try {
      // Simulate test execution time
      const executionTime = Math.random() * 3000 + 1000; // 1-4 seconds
      await new Promise((resolve) => setTimeout(resolve, executionTime));

      // Simulate test results (80% pass rate)
      const success = Math.random() > 0.2;
      const isWarning = !success && Math.random() > 0.5;

      const testResult = {
        status: success
          ? ("passed" as const)
          : isWarning
            ? ("failed" as const)
            : ("failed" as const),
        executionTime: Math.round(executionTime),
        result: success
          ? `✓ ${testCase.expectedResult}`
          : `✗ Test failed: ${isWarning ? "Warning condition detected" : "Assertion failed"}`,
        error: success
          ? undefined
          : isWarning
            ? "Performance threshold not met"
            : "Unexpected response format",
      };

      setTestResults((prev) =>
        prev.map((r) =>
          r.iflowId === result.iflowId
            ? {
                ...r,
                testCases: {
                  ...r.testCases,
                  [testCase.id]: testResult,
                },
              }
            : r,
        ),
      );
    } catch (error) {
      setTestResults((prev) =>
        prev.map((r) =>
          r.iflowId === result.iflowId
            ? {
                ...r,
                testCases: {
                  ...r.testCases,
                  [testCase.id]: {
                    status: "failed",
                    error: `Test execution failed: ${error}`,
                  },
                },
              }
            : r,
        ),
      );
    }
  };

  const runTestsForIFlow = async (result: TestResult): Promise<void> => {
    setTestResults((prev) =>
      prev.map((r) =>
        r.iflowId === result.iflowId
          ? {
              ...r,
              status: "running",
              startTime: new Date().toISOString(),
              message: "Initializing test suite...",
            }
          : r,
      ),
    );

    // Run each test case sequentially
    for (let i = 0; i < defaultTestCases.length; i++) {
      const testCase = defaultTestCases[i];
      const progress = ((i + 1) / defaultTestCases.length) * 100;

      setTestResults((prev) =>
        prev.map((r) =>
          r.iflowId === result.iflowId
            ? {
                ...r,
                progress,
                message: `Running ${testCase.name}...`,
              }
            : r,
        ),
      );

      await runSingleTest(result, testCase);
    }

    // Calculate final results
    setTestResults((prev) =>
      prev.map((r) => {
        if (r.iflowId === result.iflowId) {
          const passedTests = Object.values(r.testCases).filter(
            (tc) => tc.status === "passed",
          ).length;
          const failedTests = Object.values(r.testCases).filter(
            (tc) => tc.status === "failed",
          ).length;
          const warningTests = 0; // For simplicity

          const overallScore = Math.round(
            (passedTests / defaultTestCases.length) * 100,
          );
          const finalStatus =
            overallScore >= 80
              ? ("passed" as const)
              : overallScore >= 60
                ? ("warning" as const)
                : ("failed" as const);

          return {
            ...r,
            status: finalStatus,
            progress: 100,
            overallScore,
            passedTests,
            failedTests,
            warningTests,
            endTime: new Date().toISOString(),
            message: `Testing completed with ${overallScore}% success rate`,
          };
        }
        return r;
      }),
    );
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setError(null);

    try {
      // Run tests for each iFlow sequentially
      for (const result of testResults) {
        await runTestsForIFlow(result);
      }

      generateTestReport();
      console.log(`Testing completed for ${testResults.length} iFlows`);
    } catch (error) {
      console.error("Testing process failed:", error);
      setError("Testing process failed. Please try again.");
    } finally {
      setIsTesting(false);
    }
  };

  const generateTestReport = () => {
    const timestamp = new Date().toLocaleString();
    const totalIFlows = testResults.length;
    const passedIFlows = testResults.filter(
      (r) => r.status === "passed",
    ).length;
    const failedIFlows = testResults.filter(
      (r) => r.status === "failed",
    ).length;

    let report = `
SAP Integration Suite CI/CD Pipeline - Test Report
================================================
Generated: ${timestamp}
Environment: ${environments.find((e) => e.id === selectedEnvironment)?.name}
Endpoint: ${environments.find((e) => e.id === selectedEnvironment)?.endpoint}

SUMMARY:
--------
Total iFlows Tested: ${totalIFlows}
Passed: ${passedIFlows}
Failed: ${failedIFlows}
Success Rate: ${Math.round((passedIFlows / totalIFlows) * 100)}%

DETAILED RESULTS:
----------------
`;

    testResults.forEach((result) => {
      report += `
${result.iflowName} (${result.iflowId})
${"=".repeat(result.iflowName.length + result.iflowId.length + 3)}
Status: ${result.status.toUpperCase()}
Score: ${result.overallScore}%
Duration: ${
        result.startTime && result.endTime
          ? Math.round(
              (new Date(result.endTime).getTime() -
                new Date(result.startTime).getTime()) /
                1000,
            )
          : "N/A"
      } seconds

Test Cases:
`;

      defaultTestCases.forEach((testCase) => {
        const testResult = result.testCases[testCase.id];
        report += `  • ${testCase.name}: ${testResult.status.toUpperCase()}`;
        if (testResult.executionTime) {
          report += ` (${testResult.executionTime}ms)`;
        }
        if (testResult.error) {
          report += ` - Error: ${testResult.error}`;
        }
        report += `\n`;
      });
    });

    setTestReport(report);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "running":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTestCaseIcon = (type: string) => {
    switch (type) {
      case "functional":
        return <Activity className="w-4 h-4 text-blue-500" />;
      case "performance":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "integration":
        return <Globe className="w-4 h-4 text-green-500" />;
      case "security":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <TestTube className="w-4 h-4 text-gray-500" />;
    }
  };

  const getOverallProgress = () => {
    if (testResults.length === 0) return 0;
    const totalProgress = testResults.reduce(
      (sum, result) => sum + result.progress,
      0,
    );
    return Math.round(totalProgress / testResults.length);
  };

  const getPassedCount = () => {
    return testResults.filter((result) => result.status === "passed").length;
  };

  const getFailedCount = () => {
    return testResults.filter((result) => result.status === "failed").length;
  };

  const getWarningCount = () => {
    return testResults.filter((result) => result.status === "warning").length;
  };

  const downloadReport = () => {
    const blob = new Blob([testReport], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sap-integration-test-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="flex items-center justify-center p-8">
          <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
          <div>
            <p className="text-lg font-medium text-red-800">{error}</p>
            <Button onClick={initializeTestResults} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-teal-100 rounded-full">
              <TestTube className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-teal-800">
                Integration Testing
              </CardTitle>
              <p className="text-teal-600 mt-1">
                Execute comprehensive test suites for deployed integration flows
                and generate detailed test reports.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total iFlows</p>
                <p className="text-2xl font-bold text-blue-600">
                  {testResults.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">
                  {getPassedCount()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {getWarningCount()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {getFailedCount()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {getOverallProgress()}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Test Environment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="p-6 rounded-lg border-2 border-teal-300 bg-teal-50">
              <div className="text-center">
                <Badge
                  className={
                    environments.find((e) => e.id === selectedEnvironment)
                      ?.color
                  }
                >
                  {environments.find((e) => e.id === selectedEnvironment)?.name}{" "}
                  Environment
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  {
                    environments.find((e) => e.id === selectedEnvironment)
                      ?.endpoint
                  }
                </p>
                <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <TestTube className="w-4 h-4" />
                    <span>Automated Testing</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="w-4 h-4" />
                    <span>Real-time Monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="w-5 h-5" />
              <span>Test Execution Progress</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {getOverallProgress()}% Complete
              </span>
              <Button
                onClick={runAllTests}
                disabled={isTesting || testResults.length === 0}
                className="flex items-center space-x-2"
              >
                {isTesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                <span>{isTesting ? "Testing..." : "Run All Tests"}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <Progress value={getOverallProgress()} className="w-full h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {getPassedCount()}/{testResults.length} passed
              </span>
              <span>
                Target:{" "}
                {environments.find((e) => e.id === selectedEnvironment)?.name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual iFlow Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>iFlow Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={testResults[0]?.iflowId} className="w-full">
            <TabsList
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${Math.min(testResults.length, 4)}, 1fr)`,
              }}
            >
              {testResults.slice(0, 4).map((result) => (
                <TabsTrigger
                  key={result.iflowId}
                  value={result.iflowId}
                  className="text-sm flex flex-col items-center p-2"
                >
                  <span className="truncate">{result.iflowName}</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusBadgeColor(result.status)}>
                      {result.status}
                    </Badge>
                    <Badge variant="secondary">{result.overallScore}%</Badge>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {testResults.map((result) => (
              <TabsContent
                key={result.iflowId}
                value={result.iflowId}
                className="space-y-4"
              >
                {/* iFlow Test Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        {result.iflowName}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <p>
                          <strong>ID:</strong> {result.iflowId}
                        </p>
                        <p>
                          <strong>Version:</strong> {result.version}
                        </p>
                        <p>
                          <strong>Passed Tests:</strong> {result.passedTests}/
                          {result.totalTests}
                        </p>
                        <p>
                          <strong>Duration:</strong>{" "}
                          {result.startTime && result.endTime
                            ? Math.round(
                                (new Date(result.endTime).getTime() -
                                  new Date(result.startTime).getTime()) /
                                  1000,
                              )
                            : "N/A"}{" "}
                          seconds
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-teal-600 mb-2">
                        {result.overallScore}%
                      </div>
                      <Progress value={result.progress} className="w-24" />
                      {result.message && (
                        <p className="text-xs text-gray-500 mt-2">
                          {result.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Test Cases */}
                <div className="space-y-3">
                  {defaultTestCases.map((testCase) => {
                    const testResult = result.testCases[testCase.id];
                    return (
                      <div
                        key={testCase.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          {getTestCaseIcon(testCase.type)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{testCase.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {testCase.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {testCase.description}
                            </p>
                            {testResult.result && (
                              <p className="text-xs text-gray-500 mt-1">
                                {testResult.result}
                              </p>
                            )}
                            {testResult.error && (
                              <p className="text-xs text-red-600 mt-1">
                                Error: {testResult.error}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {testResult.executionTime && (
                            <span className="text-xs text-gray-500">
                              {testResult.executionTime}ms
                            </span>
                          )}
                          <Badge
                            className={getStatusBadgeColor(testResult.status)}
                          >
                            {testResult.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Test Report */}
      {testReport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Test Report</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={downloadReport}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Report</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={testReport}
              readOnly
              className="w-full h-64 font-mono text-sm"
              placeholder="Test report will appear here after running tests..."
            />
          </CardContent>
        </Card>
      )}

      {/* Test Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Environment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Test Environment:</span>
                  <Badge
                    className={
                      environments.find((e) => e.id === selectedEnvironment)
                        ?.color
                    }
                  >
                    {
                      environments.find((e) => e.id === selectedEnvironment)
                        ?.name
                    }
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Endpoint:</span>
                  <span className="font-medium">
                    {
                      environments.find((e) => e.id === selectedEnvironment)
                        ?.endpoint
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Test Types:</span>
                  <span className="font-medium">6 Categories</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Test Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total iFlows:</span>
                  <span className="font-medium">{testResults.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Passed:</span>
                  <span className="font-medium text-green-600">
                    {getPassedCount()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-medium text-red-600">
                    {getFailedCount()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium">
                    {testResults.length > 0
                      ? Math.round(
                          (getPassedCount() / testResults.length) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {getFailedCount() > 0 && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">
                Test Failures Detected
              </AlertTitle>
              <AlertDescription className="text-red-700">
                {getFailedCount()} integration flow(s) failed testing. Please
                review the test results and address the issues before
                considering the deployment complete.
              </AlertDescription>
            </Alert>
          )}

          {getPassedCount() === testResults.length &&
            testResults.length > 0 && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">
                  All Tests Passed!
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  🎉 Congratulations! All {testResults.length} integration flows
                  have passed testing successfully. Your CI/CD pipeline is
                  complete and the integrations are ready for production use.
                </AlertDescription>
              </Alert>
            )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          onClick={onPrevious}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous: Deploy</span>
        </Button>

        <div className="flex space-x-4">
          <Button
            onClick={initializeTestResults}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Tests</span>
          </Button>

          <Button
            onClick={() => {
              onComplete({
                testResults: {
                  environment: selectedEnvironment,
                  results: testResults,
                  passedCount: getPassedCount(),
                  failedCount: getFailedCount(),
                  warningCount: getWarningCount(),
                  overallSuccessRate:
                    testResults.length > 0
                      ? Math.round(
                          (getPassedCount() / testResults.length) * 100,
                        )
                      : 0,
                  report: testReport,
                  timestamp: new Date().toISOString(),
                },
              });
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Complete Pipeline</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Stage7Testing;
