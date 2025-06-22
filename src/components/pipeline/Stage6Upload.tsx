import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Package,
  Clock,
} from "lucide-react";

interface UploadItem {
  id: string;
  iflowId: string;
  iflowName: string;
  artifactType: "iflow" | "configuration" | "dependency";
  fileName: string;
  fileSize: string;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
  uploadTime?: string;
  errorMessage?: string;
}

interface Stage6Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage6Upload: React.FC<Stage6Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Generate upload items based on previous data
  useEffect(() => {
    const selectedIFlows = data.selectedIFlows || [];
    const iflowNames = {
      "iflow-001": "Customer Master Data Sync",
      "iflow-002": "Customer Address Validation",
      "iflow-003": "Order Processing Workflow",
      "iflow-004": "Order Status Updates",
      "iflow-005": "Inventory Sync",
      "iflow-006": "Financial Data Export",
      "iflow-007": "GL Account Mapping",
    };

    const items: UploadItem[] = [];

    selectedIFlows.forEach((iflowId: string) => {
      const iflowName = iflowNames[iflowId] || `iFlow ${iflowId}`;

      // Add iFlow artifact
      items.push({
        id: `upload-${iflowId}-iflow`,
        iflowId,
        iflowName,
        artifactType: "iflow",
        fileName: `${iflowId}_integration_flow.iflw`,
        fileSize: `${Math.floor(Math.random() * 500 + 100)}KB`,
        status: "pending",
        progress: 0,
      });

      // Add configuration artifact
      items.push({
        id: `upload-${iflowId}-config`,
        iflowId,
        iflowName,
        artifactType: "configuration",
        fileName: `${iflowId}_configuration.properties`,
        fileSize: `${Math.floor(Math.random() * 50 + 10)}KB`,
        status: "pending",
        progress: 0,
      });

      // Add dependency artifact (sometimes)
      if (Math.random() > 0.5) {
        items.push({
          id: `upload-${iflowId}-dep`,
          iflowId,
          iflowName,
          artifactType: "dependency",
          fileName: `${iflowId}_dependencies.xml`,
          fileSize: `${Math.floor(Math.random() * 100 + 20)}KB`,
          status: "pending",
          progress: 0,
        });
      }
    });

    setUploadItems(items);
  }, [data.selectedIFlows]);

  const startUpload = async () => {
    setIsUploading(true);

    for (let i = 0; i < uploadItems.length; i++) {
      const item = uploadItems[i];

      // Update status to uploading
      setUploadItems((prev) =>
        prev.map((uploadItem) =>
          uploadItem.id === item.id
            ? { ...uploadItem, status: "uploading", progress: 0 }
            : uploadItem,
        ),
      );

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));

        setUploadItems((prev) =>
          prev.map((uploadItem) =>
            uploadItem.id === item.id
              ? { ...uploadItem, progress }
              : uploadItem,
          ),
        );
      }

      // Simulate upload result (mostly success, some failures)
      const uploadSuccess = Math.random() > 0.1; // 90% success rate

      setUploadItems((prev) =>
        prev.map((uploadItem) =>
          uploadItem.id === item.id
            ? {
                ...uploadItem,
                status: uploadSuccess ? "completed" : "failed",
                progress: 100,
                uploadTime: uploadSuccess
                  ? new Date().toLocaleString()
                  : undefined,
                errorMessage: uploadSuccess
                  ? undefined
                  : "Network timeout during upload",
              }
            : uploadItem,
        ),
      );

      // Update overall progress
      setOverallProgress(Math.round(((i + 1) / uploadItems.length) * 100));
    }

    setIsUploading(false);
    setUploadComplete(true);
  };

  const retryFailedUploads = async () => {
    const failedItems = uploadItems.filter((item) => item.status === "failed");

    for (const item of failedItems) {
      setUploadItems((prev) =>
        prev.map((uploadItem) =>
          uploadItem.id === item.id
            ? { ...uploadItem, status: "uploading", progress: 0 }
            : uploadItem,
        ),
      );

      // Simulate retry upload
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        setUploadItems((prev) =>
          prev.map((uploadItem) =>
            uploadItem.id === item.id
              ? { ...uploadItem, progress }
              : uploadItem,
          ),
        );
      }

      // Retry usually succeeds
      const retrySuccess = Math.random() > 0.3;

      setUploadItems((prev) =>
        prev.map((uploadItem) =>
          uploadItem.id === item.id
            ? {
                ...uploadItem,
                status: retrySuccess ? "completed" : "failed",
                uploadTime: retrySuccess
                  ? new Date().toLocaleString()
                  : undefined,
                errorMessage: retrySuccess
                  ? undefined
                  : "Authentication failed - check credentials",
              }
            : uploadItem,
        ),
      );
    }
  };

  const handleContinue = () => {
    const uploadSummary = {
      totalArtifacts: uploadItems.length,
      completedUploads: uploadItems.filter(
        (item) => item.status === "completed",
      ).length,
      failedUploads: uploadItems.filter((item) => item.status === "failed")
        .length,
      uploadedIFlows: [
        ...new Set(
          uploadItems
            .filter((item) => item.status === "completed")
            .map((item) => item.iflowId),
        ),
      ].length,
      uploadTime: new Date().toLocaleString(),
    };

    onComplete({ uploadStatus: uploadSummary });
    onNext();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "uploading":
        return (
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-gray-100 text-gray-800",
      uploading: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case "iflow":
        return <Package className="w-4 h-4 text-blue-500" />;
      case "configuration":
        return <FileText className="w-4 h-4 text-purple-500" />;
      case "dependency":
        return <Upload className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const completedCount = uploadItems.filter(
    (item) => item.status === "completed",
  ).length;
  const failedCount = uploadItems.filter(
    (item) => item.status === "failed",
  ).length;
  const pendingCount = uploadItems.filter(
    (item) => item.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center space-x-3 mb-4">
          <Upload className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-bold text-orange-900">
            Upload Artifacts to SAP Integration Suite
          </h3>
        </div>
        <p className="text-orange-700 mb-4">
          Upload your configured iFlow artifacts to the SAP Integration Suite
          tenant for deployment.
        </p>
        <div className="flex items-center space-x-4 text-sm text-orange-600">
          <span>📦 Total Artifacts: {uploadItems.length}</span>
          <span>✅ Completed: {completedCount}</span>
          <span>❌ Failed: {failedCount}</span>
          <span>⏳ Pending: {pendingCount}</span>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload Progress
            </span>
            <Badge
              className={
                uploadComplete
                  ? "bg-green-100 text-green-800"
                  : isUploading
                    ? "bg-orange-100 text-orange-800"
                    : "bg-gray-100 text-gray-800"
              }
            >
              {uploadComplete
                ? "Complete"
                : isUploading
                  ? "Uploading"
                  : "Ready"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-bold text-gray-900">
                {overallProgress}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {uploadItems.length}
                </div>
                <div className="text-sm text-gray-600">Total Artifacts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {completedCount}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {failedCount}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {pendingCount}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>

            {!isUploading && !uploadComplete && (
              <div className="flex justify-center">
                <Button
                  onClick={startUpload}
                  className="flex items-center bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Start Upload
                </Button>
              </div>
            )}

            {failedCount > 0 && uploadComplete && (
              <div className="flex justify-center">
                <Button
                  onClick={retryFailedUploads}
                  variant="outline"
                  className="flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Retry Failed Uploads
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Items List */}
      <div className="space-y-4">
        {uploadItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    {getArtifactIcon(item.artifactType)}
                    {getStatusIcon(item.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.fileName}
                      </h4>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">iFlow:</span>{" "}
                        {item.iflowName}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span>
                          <span className="font-medium">Size:</span>{" "}
                          {item.fileSize}
                        </span>
                        <span>
                          <span className="font-medium">Type:</span>{" "}
                          {item.artifactType}
                        </span>
                        {item.uploadTime && (
                          <span>
                            <span className="font-medium">Uploaded:</span>{" "}
                            {item.uploadTime}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.status === "uploading" && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Uploading...</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    )}

                    {item.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{item.errorMessage}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Summary */}
      {uploadComplete && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Upload Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-orange-700">
                Upload process completed. {completedCount} of{" "}
                {uploadItems.length} artifacts uploaded successfully.
              </div>

              {failedCount > 0 && (
                <div className="text-sm text-red-700">
                  ⚠️ {failedCount} artifacts failed to upload. Please retry or
                  check your connection.
                </div>
              )}

              <div className="text-sm text-orange-700">
                ✅ All artifacts are now available in the SAP Integration Suite
                design workspace and ready for deployment.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          Back to Dependencies
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!uploadComplete || failedCount > 0}
          className="flex items-center"
        >
          Continue to Deploy
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Stage6Upload;
