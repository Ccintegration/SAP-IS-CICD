// File Path: src/pages/CICDPipeline.tsx
// Filename: CICDPipeline.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Settings,
  Shield,
  Link as LinkIcon,
  Upload,
  Rocket,
  TestTube,
  ArrowRight,
  History,
  Sparkles,
  ChevronRight,
  List,
} from "lucide-react";

import Stage1PackageList from "@/components/pipeline/Stage1PackageList";
import Stage2IFlowList from "@/components/pipeline/Stage2IFlowList";
import Stage3Configuration from "@/components/pipeline/Stage3Configuration";
import Stage4Validation from "@/components/pipeline/Stage4Validation";
import Stage5Dependencies from "@/components/pipeline/Stage5Dependencies";
import Stage6Deploy from "@/components/pipeline/Stage6Deploy";
import Stage7Testing from "@/components/pipeline/Stage7Testing";

const CICDPipeline = () => {
  const [currentStage, setCurrentStage] = useState(1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [pipelineData, setPipelineData] = useState({
    selectedPackages: [],
    selectedIFlows: [],
    configurations: {},
    validationResults: {},
    dependencies: {},
    uploadStatus: {},
    deploymentStatus: {},
    testResults: {},
  });
  const [pipelineCompleted, setPipelineCompleted] = useState(false);

  const stages = [
    {
      id: 1,
      title: "Package Selection",
      shortTitle: "Packages",
      description: "Select integration packages from sandbox tenant",
      icon: Package,
      component: Stage1PackageList,
      color: "from-blue-500 to-blue-600",
      lightColor: "from-blue-50 to-blue-100",
    },
    {
      id: 2,
      title: "iFlow Selection",
      shortTitle: "iFlows",
      description: "Choose specific iFlows for deployment",
      icon: List,
      component: Stage2IFlowList,
      color: "from-indigo-500 to-indigo-600",
      lightColor: "from-indigo-50 to-indigo-100",
    },
    {
      id: 3,
      title: "Configuration",
      shortTitle: "Config",
      description: "Configure environment-specific settings",
      icon: Settings,
      component: Stage3Configuration,
      color: "from-purple-500 to-purple-600",
      lightColor: "from-purple-50 to-purple-100",
    },
    {
      id: 4,
      title: "Design Validation",
      shortTitle: "Validation",
      description: "Validate against design guidelines",
      icon: Shield,
      component: Stage4Validation,
      color: "from-pink-500 to-pink-600",
      lightColor: "from-pink-50 to-pink-100",
    },
    {
      id: 5,
      title: "Dependencies",
      shortTitle: "Dependencies",
      description: "Validate interface dependencies",
      icon: LinkIcon,
      component: Stage5Dependencies,
      color: "from-red-500 to-red-600",
      lightColor: "from-red-50 to-red-100",
    },
    {
      id: 6,
      title: "Deploy",
      shortTitle: "Deploy",
      description: "Upload and deploy to SAP Integration Suite",
      icon: Rocket,
      component: Stage6Deploy,
      color: "from-yellow-500 to-yellow-600",
      lightColor: "from-yellow-50 to-yellow-100",
    },
    {
      id: 7,
      title: "Testing",
      shortTitle: "Testing",
      description: "Execute test suite and generate report",
      icon: TestTube,
      component: Stage7Testing,
      color: "from-green-500 to-green-600",
      lightColor: "from-green-50 to-green-100",
    },
  ];

  const getStageStatus = (stageId: number) => {
    if (completedStages.includes(stageId)) return "completed";
    if (stageId === currentStage) return "active";
    if (stageId < currentStage) return "completed";
    return "pending";
  };

  const progressPercentage = Math.floor((completedStages.length / stages.length) * 100);

  const handleStageComplete = (stageId: number, data: any) => {
    setCompletedStages((prev) => [...prev, stageId]);
    if (stageId === 6 && data.deploymentStatus) {
      setPipelineData((prev) => ({ ...prev, ...data, deploymentResults: data.deploymentStatus }));
    } else {
      setPipelineData((prev) => ({ ...prev, ...data }));
    }
    if (stageId < stages.length) {
      setCurrentStage(stageId + 1);
    } else if (stageId === stages.length) {
      setPipelineCompleted(true);
    }
  };

  const handleStageNavigation = (stageId: number) => {
    if (stageId <= currentStage || completedStages.includes(stageId)) {
      setCurrentStage(stageId);
    }
  };

  const CurrentStageComponent = stages[currentStage - 1]?.component;

  if (pipelineCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-3xl font-bold mb-2">Pipeline Completed!</h2>
        <p className="text-lg text-gray-700 mb-6">
          All stages of your SAP CI/CD pipeline have been successfully completed.
        </p>
        {/* Optionally, add a button to start a new pipeline or view results */}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Rocket className="w-8 h-8" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Enterprise Pipeline
              </Badge>
            </div>
            <h1 className="text-4xl font-black mb-2">
              SAP CI/CD Pipeline Automation
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl">
              Streamline your SAP Integration Suite deployments with automated
              pipeline management, validation, and testing.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {Math.min(progressPercentage, 100)}%
                </div>
                <div className="text-sm text-blue-100">Complete</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Progress */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-blue-50">
        <CardContent className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                Pipeline Progress
              </h3>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                Stage {currentStage} of {stages.length}
              </Badge>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-700 shadow-lg opacity-90"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Single Row Stage Navigation - Increased Width */}
          <div className="relative">
            <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const status = getStageStatus(stage.id);
                const isLast = index === stages.length - 1;

                return (
                  <div
                    key={stage.id}
                    className="flex items-center flex-shrink-0"
                  >
                    <button
                      onClick={() => handleStageNavigation(stage.id)}
                      className={cn(
                        "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-500 min-w-[110px] w-[110px] group transform hover:scale-105",
                        status === "completed" &&
                          "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 text-green-800 shadow-lg shadow-green-500/20",
                        status === "active" &&
                          `border-blue-300 bg-gradient-to-br ${stage.lightColor} text-blue-800 shadow-xl shadow-blue-500/30`,
                        status === "pending" &&
                          "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 hover:border-gray-300 hover:shadow-md",
                        (status === "active" || status === "completed") &&
                          "cursor-pointer",
                      )}
                      disabled={status === "pending"}
                    >
                      {/* Glow effect for active/completed */}
                      {(status === "active" || status === "completed") && (
                        <div
                          className={cn(
                            "absolute inset-0 rounded-xl blur-lg opacity-15",
                            status === "completed"
                              ? "bg-green-500"
                              : "bg-blue-500",
                          )}
                        ></div>
                      )}

                      {/* Icon */}
                      <div className="relative mb-2">
                        <Icon
                          className={cn(
                            "w-6 h-6 transition-all duration-300",
                            status === "completed"
                              ? "text-green-600"
                              : status === "active"
                                ? "text-blue-600"
                                : "text-gray-400",
                          )}
                        />
                        {status === "completed" && (
                          <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-green-500 bg-white rounded-full" />
                        )}
                      </div>

                      {/* Stage Title */}
                      <div className="text-center">
                        <div className="text-xs font-semibold leading-tight mb-1">
                          {stage.shortTitle}
                        </div>
                        <div className="text-[10px] leading-tight opacity-80 line-clamp-2">
                          {stage.description}
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            status === "completed"
                              ? "bg-green-500"
                              : status === "active"
                                ? "bg-blue-500"
                                : "bg-gray-300",
                          )}
                        />
                      </div>
                    </button>

                    {/* Arrow connector between stages */}
                    {!isLast && (
                      <div className="flex-shrink-0 mx-1">
                        <ChevronRight
                          className={cn(
                            "w-4 h-4 transition-colors duration-300",
                            status === "completed"
                              ? "text-green-500"
                              : status === "active"
                                ? "text-blue-500"
                                : "text-gray-300",
                          )}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Stage Content */}
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
        <div
          className={`h-2 bg-gradient-to-r ${stages[currentStage - 1]?.color}`}
        ></div>
        <CardHeader className="bg-gradient-to-r from-gray-50/50 to-blue-50/50">
          <div className="flex items-center space-x-4">
            <div
              className={`p-4 rounded-2xl bg-gradient-to-br ${stages[currentStage - 1]?.color} shadow-lg`}
            >
              {React.createElement(stages[currentStage - 1]?.icon, {
                className: "w-8 h-8 text-white",
              })}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                Stage {currentStage}: {stages[currentStage - 1]?.title}
              </CardTitle>
              <CardDescription className="text-lg">
                {stages[currentStage - 1]?.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {CurrentStageComponent && (
            <CurrentStageComponent
              data={pipelineData}
              onComplete={(data: any) =>
                handleStageComplete(currentStage, data)
              }
              onNext={() =>
                setCurrentStage(Math.min(currentStage + 1, stages.length))
              }
              {...(currentStage > 1 ? { onPrevious: () => setCurrentStage(Math.max(currentStage - 1, 1)) } : {})}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CICDPipeline;