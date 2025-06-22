import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
} from "lucide-react";

interface Pipeline {
  id: string;
  name: string;
  status: string;
  stage: string;
  startTime: string;
  progress: number;
  estimatedCompletion?: string;
  endTime?: string;
  duration?: string;
  author: string;
  errorMessage?: string;
}

interface PipelineStatusProps {
  pipelines: Pipeline[];
  type: "active" | "completed";
}

const PipelineStatus: React.FC<PipelineStatusProps> = ({ pipelines, type }) => {
  const [showAll, setShowAll] = useState(false);

  const displayLimit = 3;
  const displayedPipelines = showAll
    ? pipelines
    : pipelines.slice(0, displayLimit);
  const hasMore = pipelines.length > displayLimit;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Play className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      failed: "destructive",
      running: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (pipelines.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-12 h-12 mx-auto mb-4 opacity-50">
          {type === "active" ? (
            <Play className="w-full h-full" />
          ) : (
            <CheckCircle className="w-full h-full" />
          )}
        </div>
        <p>No {type} pipelines found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedPipelines.map((pipeline) => (
        <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(pipeline.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {pipeline.name}
                    </h4>
                    <p className="text-sm text-gray-500">{pipeline.id}</p>
                  </div>
                </div>
                {getStatusBadge(pipeline.status)}
              </div>

              {/* Progress Bar for Active Pipelines */}
              {type === "active" && pipeline.status === "running" && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">{pipeline.stage}</span>
                    <span className="font-medium">{pipeline.progress}%</span>
                  </div>
                  <Progress value={pipeline.progress} className="h-2" />
                </div>
              )}

              {/* Pipeline Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <User className="w-3 h-3 mr-1" />
                  <span className="font-medium mr-1">Author:</span>
                  <span>{pipeline.author}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span className="font-medium mr-1">Started:</span>
                  <span>{pipeline.startTime}</span>
                </div>

                {type === "active" && pipeline.estimatedCompletion && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    <span className="font-medium mr-1">ETA:</span>
                    <span>{pipeline.estimatedCompletion}</span>
                  </div>
                )}

                {type === "completed" && pipeline.duration && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    <span className="font-medium mr-1">Duration:</span>
                    <span>{pipeline.duration}</span>
                  </div>
                )}

                {type === "completed" && pipeline.endTime && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="font-medium mr-1">Completed:</span>
                    <span>{pipeline.endTime}</span>
                  </div>
                )}

                <div className="flex items-center text-gray-600 col-span-full">
                  <span className="font-medium mr-1">Stage:</span>
                  <span>{pipeline.stage}</span>
                </div>
              </div>

              {/* Error Message for Failed Pipelines */}
              {pipeline.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-800 font-medium">
                        Error Details:
                      </p>
                      <p className="text-sm text-red-700">
                        {pipeline.errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message for Completed Pipelines */}
              {type === "completed" && pipeline.status === "completed" && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-800">
                      Pipeline completed successfully in {pipeline.duration}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Show More/Less Button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center space-x-2"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Show More ({pipelines.length - displayLimit} more)</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Summary Footer */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Total {type === "active" ? "Active" : "Recent"}: {pipelines.length}
          </span>
          {type === "completed" && (
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>
                  {pipelines.filter((p) => p.status === "completed").length}{" "}
                  Successful
                </span>
              </span>
              <span className="flex items-center space-x-1">
                <XCircle className="w-3 h-3 text-red-500" />
                <span>
                  {pipelines.filter((p) => p.status === "failed").length} Failed
                </span>
              </span>
            </div>
          )}
          {type === "active" && (
            <span className="flex items-center space-x-1">
              <Play className="w-3 h-3 text-blue-500" />
              <span>All pipelines running</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineStatus;
