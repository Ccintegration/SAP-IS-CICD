import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Clock,
  TrendingUp,
  AlertCircle,
  FileCheck,
  Filter,
  Eye,
  BarChart3,
  PieChart,
  Target,
  Info,
  ChevronDown,
  Search,
  Zap,
  Activity,
  Settings,
  Bug,
  Layers,
  Download,
  FileSpreadsheet,
  Table as TableIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Pie,
  Treemap,
} from "recharts";

// Wrapper components to suppress defaultProps warnings
const SuppressedXAxis = (props: any) => (
  <XAxis orientation="bottom" type="category" {...props} />
);

const SuppressedYAxis = (props: any) => (
  <YAxis orientation="left" type="number" {...props} />
);

// Helper function to normalize ViolatedComponents
const normalizeViolatedComponents = (
  components: string[] | string | undefined,
): string[] => {
  if (!components) return [];
  
  // If it's already an array, return it
  if (Array.isArray(components)) {
    return components.filter(component => component && component.trim() !== "");
  }
  
  // If it's a string, handle different formats
  if (typeof components === "string") {
    try {
      // Try to parse as JSON array first
      const parsed = JSON.parse(components);
      if (Array.isArray(parsed)) {
        return parsed.filter(component => component && component.trim() !== "");
      }
      // If parsed but not an array, treat as single component
      return [String(parsed)];
    } catch {
      // If it's a comma-separated string, split it
      if (components.includes(",")) {
        return components
          .split(",")
          .map((c) => c.trim())
          .filter(component => component !== "");
      }
      // If it's a semicolon-separated string, split it
      if (components.includes(";")) {
        return components
          .split(";")
          .map((c) => c.trim())
          .filter(component => component !== "");
      }
      // If it's a pipe-separated string, split it
      if (components.includes("|")) {
        return components
          .split("|")
          .map((c) => c.trim())
          .filter(component => component !== "");
      }
      // Otherwise, treat as single component
      return components.trim() !== "" ? [components.trim()] : [];
    }
  }
  
  return [];
};

// Helper function to map API response to component interface
const mapApiResponseToInterface = (
  apiGuideline: any,
): DesignGuidelineResult => {
  // Map Compliance to Status
  const mapComplianceToStatus = (
    compliance: string,
  ): "PASSED" | "FAILED" | "WARNING" | "NOT_APPLICABLE" => {
    switch (compliance?.toLowerCase()) {
      case "compliant":
        return "PASSED";
      case "non-compliant":
        return "FAILED";
      case "partially compliant":
        return "WARNING";
      case "not applicable":
        return "NOT_APPLICABLE";
      default:
        return "NOT_APPLICABLE";
    }
  };

  return {
    RuleId: apiGuideline.GuidelineId || apiGuideline.RuleId || "",
    RuleName: apiGuideline.GuidelineName || apiGuideline.RuleName || "",
    Category: apiGuideline.Category || "",
    Severity: apiGuideline.Severity || "",
    Status: mapComplianceToStatus(
      apiGuideline.Compliance || apiGuideline.Status,
    ),
    Message: apiGuideline.Message || apiGuideline.ActualKPI || "",
    Description: apiGuideline.Description || apiGuideline.ExpectedKPI || "",
    ExecutionDate: apiGuideline.ExecutionDate || new Date().toISOString(),
    ExpectedKPI: apiGuideline.ExpectedKPI || "",
    ActualKPI: apiGuideline.ActualKPI || "",
    ViolatedComponents: apiGuideline.ViolatedComponents,
  };
};

// Helper function to calculate compliance by severity
const calculateComplianceBySeverity = (guidelines: DesignGuidelineResult[]) => {
  const severityData = {
    High: { total: 0, compliant: 0, percentage: 0 },
    Medium: { total: 0, compliant: 0, percentage: 0 },
    Low: { total: 0, compliant: 0, percentage: 0 },
  };

  guidelines.forEach((guideline) => {
    const severity = guideline.Severity as keyof typeof severityData;
    if (severityData[severity]) {
      severityData[severity].total++;
      if (guideline.Status === "PASSED") {
        severityData[severity].compliant++;
      }
    }
  });

  // Calculate percentages
  Object.keys(severityData).forEach((severity) => {
    const data = severityData[severity as keyof typeof severityData];
    data.percentage =
      data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0;
  });

  return severityData;
};

// Export helper functions
const exportToCSV = (
  validationResults: IFlowValidation[],
  packageNames: Record<string, string>,
) => {
  const headers = [
    "Package",
    "iFlow Name",
    "iFlow ID",
    "Version",
    "Rule ID",
    "Rule Name",
    "Category",
    "Severity",
    "Status",
    "Expected KPI",
    "Actual KPI",
    "Violated Components",
    "Execution Date",
  ];

  const rows = [headers.join(",")];

  validationResults.forEach((result) => {
    const packageName = packageNames[result.iflowId] || "Unknown Package";
    
    result.guidelines.forEach((guideline) => {
      const violatedComponents = normalizeViolatedComponents(
        guideline.ViolatedComponents,
      ).join("; ");

      const row = [
        `"${packageName}"`,
        `"${result.iflowName}"`,
        `"${result.iflowId}"`,
        `"${result.version}"`,
        `"${guideline.RuleId}"`,
        `"${guideline.RuleName}"`,
        `"${guideline.Category}"`,
        `"${guideline.Severity}"`,
        `"${guideline.Status}"`,
        `"${guideline.ExpectedKPI || ""}"`,
        `"${guideline.ActualKPI || ""}"`,
        `"${violatedComponents}"`,
        `"${guideline.ExecutionDate || ""}"`,
      ];

      rows.push(row.join(","));
    });
  });

  return rows.join("\n");
};

// Helper function to download file
const downloadFile = (
  content: string,
  filename: string,
  contentType: string,
) => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

interface DesignGuidelineResult {
  RuleId: string;
  RuleName: string;
  Category: string;
  Severity: string;
  Status: "PASSED" | "FAILED" | "WARNING" | "NOT_APPLICABLE";
  Message?: string;
  Description?: string;
  ExecutionDate?: string;
  ExpectedKPI?: string;
  ActualKPI?: string;
  ViolatedComponents?: string[] | string;
}

interface IFlowValidation {
  iflowId: string;
  iflowName: string;
  version: string;
  guidelines: DesignGuidelineResult[];
  totalRules: number;
  compliantRules: number;
  compliancePercentage: number;
  isCompliant: boolean;
  lastExecuted?: string;
  hasExecutionHistory: boolean;
  executionId?: string;
}

interface Stage4Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage4Validation: React.FC<Stage4Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [validationResults, setValidationResults] = useState<IFlowValidation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [executing, setExecuting] = useState<Record<string, boolean>>({});
  const [executed, setExecuted] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<
    "overview" | "detailed" | "summary"
  >("overview");
  const [selectedIFlow, setSelectedIFlow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Chart configuration
  const chartConfig = {
    compliant: {
      label: "Compliant",
      color: "#22c55e",
    },
    nonCompliant: {
      label: "Non-Compliant",
      color: "#ef4444",
    },
    warning: {
      label: "Warning",
      color: "#f59e0b",
    },
    notApplicable: {
      label: "Not Applicable",
      color: "#6b7280",
    },
  };

  // Status colors and icons
  const statusConfig = {
    PASSED: {
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-300",
      icon: CheckCircle,
      badgeStyle: "bg-green-100 text-green-800 border-green-300",
    },
    FAILED: {
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-red-300",
      icon: XCircle,
      badgeStyle: "bg-red-100 text-red-800 border-red-300",
    },
    WARNING: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      borderColor: "border-yellow-300",
      icon: AlertTriangle,
      badgeStyle: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    NOT_APPLICABLE: {
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-300",
      icon: Clock,
      badgeStyle: "bg-gray-100 text-gray-800 border-gray-300",
    },
  };

  const severityConfig = {
    High: { color: "text-red-600", bgColor: "bg-red-100", icon: AlertCircle },
    Medium: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      icon: AlertTriangle,
    },
    Low: { color: "text-blue-600", bgColor: "bg-blue-100", icon: Info },
  };

  useEffect(() => {
    loadValidationResults();
  }, [data.selectedIFlows]);

  // Computed values
  const overallMetrics = useMemo(() => {
    if (validationResults.length === 0)
      return {
        totalIFlows: 0,
        averageCompliance: 0,
        compliantIFlows: 0,
        nonCompliantIFlows: 0,
        totalRules: 0,
        totalCompliantRules: 0,
        highSeverityIssues: 0,
        mediumSeverityIssues: 0,
        lowSeverityIssues: 0,
      };

    const totalCompliance = validationResults.reduce(
      (sum, result) => sum + result.compliancePercentage,
      0,
    );
    const allGuidelines = validationResults.flatMap(
      (result) => result.guidelines,
    );

    return {
      totalIFlows: validationResults.length,
      averageCompliance: Math.round(totalCompliance / validationResults.length),
      compliantIFlows: validationResults.filter((r) => r.isCompliant).length,
      nonCompliantIFlows: validationResults.filter((r) => !r.isCompliant)
        .length,
      totalRules: validationResults.reduce(
        (sum, result) => sum + result.totalRules,
        0,
      ),
      totalCompliantRules: validationResults.reduce(
        (sum, result) => sum + result.compliantRules,
        0,
      ),
      highSeverityIssues: allGuidelines.filter(
        (g) => g.Severity === "High" && g.Status === "FAILED",
      ).length,
      mediumSeverityIssues: allGuidelines.filter(
        (g) => g.Severity === "Medium" && g.Status === "FAILED",
      ).length,
      lowSeverityIssues: allGuidelines.filter(
        (g) => g.Severity === "Low" && g.Status === "FAILED",
      ).length,
    };
  }, [validationResults]);

  // Chart data
  const complianceChartData = useMemo(
    () =>
      validationResults.map((result) => ({
        name: result.iflowName,
        compliance: result.compliancePercentage,
        nonCompliance: 100 - result.compliancePercentage,
        totalRules: result.totalRules,
        compliantRules: result.compliantRules,
      })),
    [validationResults],
  );

  const statusDistributionData = useMemo(() => {
    const allGuidelines = validationResults.flatMap(
      (result) => result.guidelines,
    );
    const statusCounts = allGuidelines.reduce(
      (acc, guideline) => {
        acc[guideline.Status] = (acc[guideline.Status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return [
      { name: "Passed", value: statusCounts.PASSED || 0, color: "#22c55e" },
      { name: "Failed", value: statusCounts.FAILED || 0, color: "#ef4444" },
      { name: "Warning", value: statusCounts.WARNING || 0, color: "#f59e0b" },
      {
        name: "Not Applicable",
        value: statusCounts.NOT_APPLICABLE || 0,
        color: "#6b7280",
      },
    ].filter((item) => item.value > 0);
  }, [validationResults]);

  const severityData = useMemo(() => {
    const allGuidelines = validationResults.flatMap(
      (result) => result.guidelines,
    );
    const severityCounts = allGuidelines.reduce(
      (acc, guideline) => {
        if (guideline.Status === "FAILED") {
          acc[guideline.Severity] = (acc[guideline.Severity] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return [
      { name: "High", value: severityCounts.High || 0, color: "#ef4444" },
      { name: "Medium", value: severityCounts.Medium || 0, color: "#f59e0b" },
      { name: "Low", value: severityCounts.Low || 0, color: "#3b82f6" },
    ].filter((item) => item.value > 0);
  }, [validationResults]);

  const categoryData = useMemo(() => {
    const allGuidelines = validationResults.flatMap(
      (result) => result.guidelines,
    );
    const categoryCounts = allGuidelines.reduce(
      (acc, guideline) => {
        acc[guideline.Category] = (acc[guideline.Category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(categoryCounts).map(([category, count]) => ({
      name: category,
      value: count,
      compliance: Math.round(
        (allGuidelines.filter(
          (g) => g.Category === category && g.Status === "PASSED",
        ).length /
          count) *
          100,
      ),
    }));
  }, [validationResults]);

  // Summary table data for table view
  const summaryTableData = useMemo(() => {
    return validationResults.map((result) => {
      const severityCompliance = calculateComplianceBySeverity(
        result.guidelines,
      );
      
      const packageName = data.selectedPackages?.find((pkg: any) =>
        pkg.integrationFlows?.some((iflow: any) => 
          iflow.id === result.iflowId || iflow.Id === result.iflowId
        )
      )?.name || "Unknown Package";

      return {
        packageName,
        iflowName: result.iflowName,
        iflowId: result.iflowId,
        high: severityCompliance.High.percentage,
        medium: severityCompliance.Medium.percentage,
        low: severityCompliance.Low.percentage,
        total: result.compliancePercentage,
        guidelines: result.guidelines,
        version: result.version,
      };
    });
  }, [validationResults, data.selectedPackages, data.iflowDetails]);

  // Filtered guidelines for detailed view
  const filteredGuidelines = useMemo(() => {
    const selectedResult = validationResults.find(
      (r) => r.iflowId === selectedIFlow,
    );
    if (!selectedResult) return [];

    return selectedResult.guidelines.filter((guideline) => {
      const matchesSearch =
        searchQuery === "" ||
        guideline.RuleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guideline.Description?.toLowerCase().includes(
          searchQuery.toLowerCase(),
        ) ||
        guideline.Category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(guideline.Category);
      const matchesSeverity =
        selectedSeverities.length === 0 ||
        selectedSeverities.includes(guideline.Severity);
      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(guideline.Status);

      return (
        matchesSearch && matchesCategory && matchesSeverity && matchesStatus
      );
    });
  }, [
    validationResults,
    selectedIFlow,
    searchQuery,
    selectedCategories,
    selectedSeverities,
    selectedStatuses,
  ]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const allGuidelines = validationResults.flatMap(
      (result) => result.guidelines,
    );
    return {
      categories: [...new Set(allGuidelines.map((g) => g.Category))],
      severities: [...new Set(allGuidelines.map((g) => g.Severity))],
      statuses: [...new Set(allGuidelines.map((g) => g.Status))],
    };
  }, [validationResults]);

  const loadValidationResults = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!data.selectedIFlows || data.selectedIFlows.length === 0) {
        setError(
          "No integration flows selected. Please go back and select iFlows.",
        );
        setLoading(false);
        return;
      }

      console.log(
        "🚀 [LoadValidation] Starting optimized validation process for iFlows:",
        data.selectedIFlows,
      );

      // Initialize results with basic iFlow information
      const initialResults = data.selectedIFlows.map((iflowId: string) => {
        const iflowDetails = data.iflowDetails?.find(
          (iflow: any) => iflow.id === iflowId || iflow.Id === iflowId,
        );

        const iflowVersion =
          iflowDetails?.version || iflowDetails?.Version || "active";
        const iflowName =
          iflowDetails?.name || iflowDetails?.Name || `iFlow ${iflowId}`;

        return {
          iflowId,
          iflowName,
          version: iflowVersion,
          guidelines: [],
          totalRules: 0,
          compliantRules: 0,
          compliancePercentage: 0,
          isCompliant: false,
          hasExecutionHistory: false,
        };
      });

      setValidationResults(initialResults);

      // Auto-select first iFlow for detailed view
      if (initialResults.length > 0 && !selectedIFlow) {
        setSelectedIFlow(initialResults[0].iflowId);
      }

      // Execute guidelines for all iFlows
      for (const iflowId of data.selectedIFlows) {
        if (!executed[iflowId]) {
          const iflowDetails = data.iflowDetails?.find(
            (iflow: any) => iflow.id === iflowId || iflow.Id === iflowId,
          );
          const iflowVersion =
            iflowDetails?.version || iflowDetails?.Version || "active";

          try {
            // Execute design guidelines
            const executeUrl = `http://localhost:8000/api/sap/iflows/${iflowId}/execute-guidelines?version=${iflowVersion}`;
            const executeResponse = await fetch(executeUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });

            if (!executeResponse.ok) {
              throw new Error(
                `Failed to execute design guidelines for ${iflowId}: ${executeResponse.status}`,
              );
            }

            const executeResult = await executeResponse.json();
            const executionId = executeResult.data?.execution_id;

            // Mark as executed
            setExecuted((prev) => ({ ...prev, [iflowId]: true }));

            // Wait for execution to complete
            await new Promise((resolve) => setTimeout(resolve, 8000));

            // Get results
            let fetchUrl = `http://localhost:8000/api/sap/iflows/${iflowId}/design-guidelines?version=${iflowVersion}`;
            if (executionId) {
              fetchUrl += `&execution_id=${executionId}`;
            }

            const fetchResponse = await fetch(fetchUrl);

            if (fetchResponse.ok) {
              const fetchResult = await fetchResponse.json();
              const validationData = fetchResult.data;

              // Map API response to component interface
              const mappedGuidelines = (validationData.guidelines || []).map(
                mapApiResponseToInterface,
              );

              // Calculate metrics from mapped guidelines
              const totalRules = mappedGuidelines.length;
              const compliantRules = mappedGuidelines.filter(
                (g) => g.Status === "PASSED",
              ).length;
              const compliancePercentage =
                totalRules > 0
                  ? Math.round((compliantRules / totalRules) * 100)
                  : 0;
              const isCompliant = compliancePercentage === 100;

              // Update results for this specific iFlow
              setValidationResults((prev) =>
                prev.map((result) =>
                  result.iflowId === iflowId
                    ? {
                        ...result,
                        guidelines: mappedGuidelines,
                        totalRules,
                        compliantRules,
                        compliancePercentage,
                        isCompliant,
                        hasExecutionHistory: mappedGuidelines.length > 0,
                        lastExecuted:
                          validationData.last_executed ||
                          new Date().toISOString(),
                        executionId: validationData.execution_id,
                      }
                    : result,
                ),
              );
            }
          } catch (error) {
            console.error(
              `❌ [LoadValidation] Error processing ${iflowId}:`,
              error,
            );
            // Continue with other iFlows even if one fails
          }
        }
      }
    } catch (error) {
      console.error(
        "❌ [LoadValidation] Failed to load validation results:",
        error,
      );
      setError("Failed to load design validation results");
    } finally {
      setLoading(false);
    }
  };

  const refreshValidationResults = async () => {
    setRefreshing(true);
    setError(null);

    try {
      if (!data.selectedIFlows || data.selectedIFlows.length === 0) {
        setError(
          "No integration flows selected. Please go back and select iFlows.",
        );
        setRefreshing(false);
        return;
      }

      for (const iflowId of data.selectedIFlows) {
        try {
          const iflowDetails = data.iflowDetails?.find(
            (iflow: any) => iflow.id === iflowId || iflow.Id === iflowId,
          );
          const iflowVersion =
            iflowDetails?.version || iflowDetails?.Version || "active";

          let fetchUrl = `http://localhost:8000/api/sap/iflows/${iflowId}/design-guidelines?version=${iflowVersion}`;
          const fetchResponse = await fetch(fetchUrl);

          if (fetchResponse.ok) {
            const fetchResult = await fetchResponse.json();
            const validationData = fetchResult.data;

            const refreshMappedGuidelines = (
              validationData.guidelines || []
            ).map(mapApiResponseToInterface);

            const refreshTotalRules = refreshMappedGuidelines.length;
            const refreshCompliantRules = refreshMappedGuidelines.filter(
              (g) => g.Status === "PASSED",
            ).length;
            const refreshCompliancePercentage =
              refreshTotalRules > 0
                ? Math.round((refreshCompliantRules / refreshTotalRules) * 100)
                : 0;
            const refreshIsCompliant = refreshCompliancePercentage === 100;

            setValidationResults((prev) =>
              prev.map((result) =>
                result.iflowId === iflowId
                  ? {
                      ...result,
                      guidelines: refreshMappedGuidelines,
                      totalRules: refreshTotalRules,
                      compliantRules: refreshCompliantRules,
                      compliancePercentage: refreshCompliancePercentage,
                      isCompliant: refreshIsCompliant,
                      hasExecutionHistory: refreshMappedGuidelines.length > 0,
                      lastExecuted:
                        fetchResult.data.last_executed ||
                        new Date().toISOString(),
                      executionId: fetchResult.data.execution_id,
                    }
                  : result,
              ),
            );
          }
        } catch (error) {
          console.error(`Failed to refresh validation for ${iflowId}:`, error);
        }
      }
    } catch (error) {
      console.error("Failed to refresh validation results:", error);
      setError(
        `Failed to refresh validation results: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleNext = () => {
    // Pass validation results to next stage
    onComplete({
      ...data,
      validationResults,
      validationComplete: true,
    });
    onNext();
  };

  const handleExportCSV = () => {
    const packageNames: Record<string, string> = {};
    data.selectedPackages?.forEach((pkg: any) => {
      pkg.integrationFlows?.forEach((iflow: any) => {
        packageNames[iflow.id || iflow.Id] = pkg.name;
      });
    });

    const csvContent = exportToCSV(validationResults, packageNames);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    downloadFile(
      csvContent,
      `design-validation-report-${timestamp}.csv`,
      "text/csv",
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-600">
              Loading design validation results...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="py-12">
          <Alert className="border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={loadValidationResults} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-green-800">
                    Design Guidelines Validation
                  </CardTitle>
                  <p className="text-green-600 mt-1">
                    Interactive analytical overview of design guidelines
                    execution results
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        activeView === "overview" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setActiveView("overview")}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Overview
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Analytical overview with charts and metrics</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === "summary" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("summary")}
                    >
                      <TableIcon className="w-4 h-4 mr-2" />
                      Summary
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tabular summary with compliance by severity</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        activeView === "detailed" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setActiveView("detailed")}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detailed
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Detailed guidelines with filtering and drill-down</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
        </Card>

        {activeView === "overview" ? (
          /* Overview Dashboard */
          <div className="space-y-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span>Key Metrics Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {overallMetrics.totalIFlows}
                    </div>
                    <div className="text-sm text-blue-700">Total iFlows</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div
                      className={`text-2xl font-bold ${
                        overallMetrics.averageCompliance >= 80
                          ? "text-green-600"
                          : overallMetrics.averageCompliance >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {overallMetrics.averageCompliance}%
                    </div>
                    <div className="text-sm text-green-700">Avg Compliance</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {overallMetrics.compliantIFlows}
                    </div>
                    <div className="text-sm text-green-700">Compliant</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {overallMetrics.nonCompliantIFlows}
                    </div>
                    <div className="text-sm text-red-700">Non-Compliant</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {overallMetrics.totalRules}
                    </div>
                    <div className="text-sm text-purple-700">Total Rules</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {overallMetrics.highSeverityIssues}
                    </div>
                    <div className="text-sm text-red-700">High Issues</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {overallMetrics.mediumSeverityIssues}
                    </div>
                    <div className="text-sm text-yellow-700">Medium Issues</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {overallMetrics.lowSeverityIssues}
                    </div>
                    <div className="text-sm text-blue-700">Low Issues</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance by iFlow Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span>Compliance by iFlow</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={complianceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <SuppressedXAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <SuppressedYAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="compliance" fill="#22c55e" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Status Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-cyan-600" />
                    <span>Status Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={statusDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Category Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>Compliance by Category</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryData.map((category) => (
                    <div
                      key={category.name}
                      className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {category.name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {category.value} rules
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <div
                            className={`text-2xl font-bold ${
                              category.compliance >= 80
                                ? "text-green-600"
                                : category.compliance >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {category.compliance}%
                          </div>
                          <div className="text-xs text-gray-500">
                            compliance
                          </div>
                        </div>
                        <div className="w-20">
                          <Progress
                            value={category.compliance}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* iFlow Summary Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-cyan-600" />
                  <span>iFlow Validation Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {validationResults.map((result) => (
                    <Tooltip key={result.iflowId}>
                      <TooltipTrigger asChild>
                        <Card
                          className={`cursor-pointer transition-all hover:shadow-lg ${
                            result.isCompliant
                              ? "border-green-200 bg-green-50/50"
                              : "border-red-200 bg-red-50/50"
                          }`}
                          onClick={() => {
                            setSelectedIFlow(result.iflowId);
                            setActiveView("detailed");
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 truncate">
                                {result.iflowName}
                              </h4>
                              {result.isCompliant ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Compliance:
                                </span>
                                <span
                                  className={`font-medium ${
                                    result.compliancePercentage >= 80
                                      ? "text-green-600"
                                      : result.compliancePercentage >= 60
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {result.compliancePercentage}%
                                </span>
                              </div>
                              <Progress
                                value={result.compliancePercentage}
                                className="h-2"
                              />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>
                                  {result.compliantRules}/{result.totalRules}{" "}
                                  rules
                                </span>
                                <span>v{result.version}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <div className="p-2">
                          <p className="font-medium">{result.iflowName}</p>
                          <p>Click to view detailed analysis</p>
                          <p className="text-xs text-gray-500">
                            {
                              result.guidelines.filter(
                                (g) => g.Status === "FAILED",
                              ).length
                            }{" "}
                            failed rules
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeView === "summary" ? (
          /* Summary Table View */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TableIcon className="w-5 h-5 text-indigo-600" />
                  <span>Compliance Summary by iFlow</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryTableData.length > 0 ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Package</TableHead>
                          <TableHead>iFlow</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead className="text-center">High (%)</TableHead>
                          <TableHead className="text-center">Medium (%)</TableHead>
                          <TableHead className="text-center">Low (%)</TableHead>
                          <TableHead className="text-center">Overall (%)</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summaryTableData.map((row) => (
                          <TableRow key={row.iflowId}>
                            <TableCell className="font-medium">
                              {row.packageName}
                            </TableCell>
                            <TableCell>{row.iflowName}</TableCell>
                            <TableCell>{row.version}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={
                                  row.high >= 80
                                    ? "bg-green-100 text-green-800"
                                    : row.high >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }
                              >
                                {row.high}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={
                                  row.medium >= 80
                                    ? "bg-green-100 text-green-800"
                                    : row.medium >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }
                              >
                                {row.medium}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={
                                  row.low >= 80
                                    ? "bg-green-100 text-green-800"
                                    : row.low >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }
                              >
                                {row.low}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={
                                  row.total >= 80
                                    ? "bg-green-100 text-green-800"
                                    : row.total >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }
                              >
                                {row.total}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {row.total === 100 ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {summaryTableData.length}
                        </div>
                        <div className="text-sm text-blue-700">Total iFlows</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(
                            summaryTableData.reduce(
                              (sum, row) => sum + row.total,
                              0,
                            ) / summaryTableData.length,
                          )}
                          %
                        </div>
                        <div className="text-sm text-green-700">
                          Average Compliance
                        </div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {Math.round(
                            summaryTableData.reduce(
                              (sum, row) => sum + row.high,
                              0,
                            ) / summaryTableData.length,
                          )}
                          %
                        </div>
                        <div className="text-sm text-red-700">
                          Avg High Compliance
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {validationResults.reduce(
                            (sum, result) => sum + result.guidelines.length,
                            0,
                          )}
                        </div>
                        <div className="text-sm text-yellow-700">Total Rules</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      No validation data available. Please execute validation
                      first.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Detailed View */
          <div className="space-y-6">
            {/* iFlow Selection and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span>Detailed Analysis Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* iFlow Selection */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select iFlow for Analysis
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {selectedIFlow
                            ? validationResults.find(
                                (r) => r.iflowId === selectedIFlow,
                              )?.iflowName
                            : "Select iFlow"}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        {validationResults.map((result) => (
                          <DropdownMenuItem
                            key={result.iflowId}
                            onClick={() => setSelectedIFlow(result.iflowId)}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{result.iflowName}</span>
                              <Badge
                                className={
                                  statusConfig[
                                    result.isCompliant ? "PASSED" : "FAILED"
                                  ]?.badgeStyle
                                }
                              >
                                {result.compliancePercentage}%
                              </Badge>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Guidelines
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by rule name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <span>
                            {selectedCategories.length > 0
                              ? `${selectedCategories.length} selected`
                              : "All Categories"}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Categories</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {filterOptions.categories.map((category) => (
                          <DropdownMenuCheckboxItem
                            key={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategories([
                                  ...selectedCategories,
                                  category,
                                ]);
                              } else {
                                setSelectedCategories(
                                  selectedCategories.filter(
                                    (c) => c !== category,
                                  ),
                                );
                              }
                            }}
                          >
                            {category}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Severity Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <span>
                            {selectedSeverities.length > 0
                              ? `${selectedSeverities.length} selected`
                              : "All Severities"}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Severities</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {filterOptions.severities.map((severity) => (
                          <DropdownMenuCheckboxItem
                            key={severity}
                            checked={selectedSeverities.includes(severity)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSeverities([
                                  ...selectedSeverities,
                                  severity,
                                ]);
                              } else {
                                setSelectedSeverities(
                                  selectedSeverities.filter(
                                    (s) => s !== severity,
                                  ),
                                );
                              }
                            }}
                          >
                            {severity}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Export Actions */}
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Guidelines */}
            {selectedIFlow && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                      <span>
                        Detailed Guidelines:{" "}
                        {
                          validationResults.find(
                            (r) => r.iflowId === selectedIFlow,
                          )?.iflowName
                        }
                      </span>
                    </div>
                    <Badge className="text-xs">
                      {filteredGuidelines.length} of{" "}
                      {
                        validationResults.find(
                          (r) => r.iflowId === selectedIFlow,
                        )?.guidelines.length
                      }{" "}
                      guidelines
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredGuidelines.map((guideline, index) => {
                      const StatusIcon = statusConfig[guideline.Status]?.icon;
                      return (
                        <Card
                          key={`${guideline.RuleId}-${index}`}
                          className={`border-l-4 ${
                            guideline.Status === "FAILED"
                              ? "border-l-red-500 bg-red-50/30"
                              : guideline.Status === "WARNING"
                                ? "border-l-yellow-500 bg-yellow-50/30"
                                : guideline.Status === "PASSED"
                                  ? "border-l-green-500 bg-green-50/30"
                                  : "border-l-gray-500 bg-gray-50/30"
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <StatusIcon
                                    className={`w-5 h-5 ${statusConfig[guideline.Status]?.color}`}
                                  />
                                  <h4 className="font-semibold text-gray-900">
                                    {guideline.RuleName}
                                  </h4>
                                  <Badge
                                    className={
                                      statusConfig[guideline.Status]
                                        ?.badgeStyle
                                    }
                                  >
                                    {guideline.Status}
                                  </Badge>
                                </div>

                                <p className="text-gray-700 mb-4">
                                  {guideline.Description || guideline.Message}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-600">
                                      Category:
                                    </span>
                                    <Badge variant="outline">
                                      {guideline.Category}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-600">
                                      Severity:
                                    </span>
                                    <Badge
                                      className={
                                        guideline.Severity === "High"
                                          ? "bg-red-100 text-red-800"
                                          : guideline.Severity === "Medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-blue-100 text-blue-800"
                                      }
                                    >
                                      {guideline.Severity}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-600">
                                      Rule ID:
                                    </span>
                                    <span className="text-sm text-gray-500 font-mono">
                                      {guideline.RuleId}
                                    </span>
                                  </div>
                                  {guideline.ExecutionDate && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-600">
                                        Executed:
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(
                                          guideline.ExecutionDate,
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* KPI Details */}
                                {(guideline.ExpectedKPI ||
                                  guideline.ActualKPI) && (
                                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                    <h5 className="font-medium text-gray-800 mb-2">
                                      KPI Details
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      {guideline.ExpectedKPI && (
                                        <div>
                                          <span className="font-medium text-gray-600">
                                            Expected KPI:
                                          </span>
                                          <p className="text-gray-800">
                                            {guideline.ExpectedKPI}
                                          </p>
                                        </div>
                                      )}
                                      {guideline.ActualKPI && (
                                        <div>
                                          <span className="font-medium text-gray-600">
                                            Actual KPI:
                                          </span>
                                          <p className="text-gray-800">
                                            {guideline.ActualKPI}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Violated Components */}
                                {(() => {
                                  const violatedComponents =
                                    normalizeViolatedComponents(
                                      guideline.ViolatedComponents,
                                    );
                                  return (
                                    violatedComponents.length > 0 && (
                                      <div className="bg-red-50 p-4 rounded-lg">
                                        <h5 className="font-medium text-red-800 mb-2 flex items-center">
                                          <Bug className="w-4 h-4 mr-2" />
                                          Violated Components
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                          {violatedComponents.map(
                                            (component, idx) => (
                                              <Badge
                                                key={idx}
                                                variant="outline"
                                                className="text-red-700 border-red-300"
                                              >
                                                {component}
                                              </Badge>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )
                                  );
                                })()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {filteredGuidelines.length === 0 && (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          No guidelines match the current filters.
                        </p>
                        <Button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategories([]);
                            setSelectedSeverities([]);
                            setSelectedStatuses([]);
                          }}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Overall Status Alert */}
        {overallMetrics.nonCompliantIFlows > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Compliance Issues Detected</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="text-sm">
                  {overallMetrics.nonCompliantIFlows} iFlow
                  {overallMetrics.nonCompliantIFlows === 1 ? "" : "s"}{" "}
                  {overallMetrics.nonCompliantIFlows === 1 ? "has" : "have"}{" "}
                  compliance issues. Total severity breakdown:{" "}
                  {overallMetrics.highSeverityIssues} High,{" "}
                  {overallMetrics.mediumSeverityIssues} Medium,{" "}
                  {overallMetrics.lowSeverityIssues} Low.
                </p>
                <p className="text-sm">
                  Review the detailed analysis and consider addressing these
                  issues before proceeding to deployment.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            onClick={onPrevious}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous: Configuration</span>
          </Button>

          <div className="flex space-x-4">
            <Button
              onClick={refreshValidationResults}
              variant="outline"
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{refreshing ? "Refreshing..." : "Refresh Results"}</span>
            </Button>

            <Button
              onClick={handleNext}
              className="flex items-center space-x-2"
            >
              <span>Next: Dependencies</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Stage4Validation;