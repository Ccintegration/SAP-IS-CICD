import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Rocket,
  CheckCircle,
  XCircle,
  PlayCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileText,
  Package,
  Clock,
  Settings,
  Database,
} from "lucide-react";

interface ArtifactStatus {
  iflowId: string;
  iflowName: string;
  version: string;
  packageId: string;
  packageName: string;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadProgress: number;
  configureStatus: 'pending' | 'configuring' | 'completed' | 'failed';
  configureProgress: number;
  deployStatus: 'pending' | 'deploying' | 'completed' | 'failed';
  deployProgress: number;
  overallStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
  message: string;
  errorMessage?: string;
  startTime?: string;
  endTime?: string;
}

interface DeploymentResponse {
  deployment_id: string;
  target_environment: string;
  total_artifacts: number;
  status: string;
  progress: ArtifactStatus[];
  start_time: string;
  estimated_completion?: string;
}

interface Stage6Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage6Deploy: React.FC<Stage6Props> = ({ data, onComplete, onNext, onPrevious }) => {
  const [artifacts, setArtifacts] = useState<ArtifactStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processComplete, setProcessComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState("CCCI_PROD");
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<string>("pending");

  // Initialize artifacts from selected iFlows
  useEffect(() => {
    const selectedIFlows = data.selectedIFlows || [];
    const iflowDetails = data.iflowDetails || [];
    
    const artifactList: ArtifactStatus[] = selectedIFlows.map((iflowId: string) => {
      const iflowDetail = iflowDetails.find((iflow: any) => 
        iflow.id === iflowId || iflow.iflowId === iflowId
      ) || { 
        id: iflowId, 
        name: `iFlow ${iflowId}`, 
        version: "1.0.0",
        packageId: iflowId,
        packageName: "Unknown Package"
      };

      return {
        iflowId,
        iflowName: iflowDetail.name || iflowDetail.iflowName || `iFlow ${iflowId}`,
        version: iflowDetail.version || "1.0.0",
        packageId: iflowDetail.packageId,
        packageName: iflowDetail.packageName || "Unknown Package",
        uploadStatus: 'pending',
        uploadProgress: 0,
        configureStatus: 'pending',
        configureProgress: 0,
        deployStatus: 'pending',
        deployProgress: 0,
        overallStatus: 'pending',
        message: 'Ready for deployment',
      };
    });

    setArtifacts(artifactList);
  }, [data.selectedIFlows, data.iflowDetails]);

  // Poll deployment status when deployment is in progress
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (deploymentId && (deploymentStatus === "initialized" || deploymentStatus === "in-progress")) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/sap/deploy/status/${deploymentId}`);
          if (response.ok) {
            const deploymentData: DeploymentResponse = await response.json();
            setArtifacts(deploymentData.progress);
            setDeploymentStatus(deploymentData.status);
            
            if (deploymentData.status === "completed" || deploymentData.status === "failed" || deploymentData.status === "partial") {
              setProcessComplete(true);
              setIsProcessing(false);
              clearInterval(intervalId);
            }
          }
        } catch (error) {
          console.error("Failed to fetch deployment status:", error);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [deploymentId, deploymentStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
      case 'configuring':
      case 'deploying':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 text-xs">Failed</Badge>;
      case 'uploading':
      case 'configuring':
      case 'deploying':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Pending</Badge>;
    }
  };

  const getOverallStatusBadge = (artifact: ArtifactStatus) => {
    if (artifact.overallStatus === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Deployed</Badge>;
    } else if (artifact.overallStatus === 'failed') {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    } else if (artifact.overallStatus === 'in-progress') {
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  const startDeployment = async () => {
    setIsProcessing(true);
    setError(null);
    setProcessComplete(false);

    try {
      // Prepare deployment request
      const deploymentRequest = {
        artifacts: artifacts.map(artifact => ({
          iflowId: artifact.iflowId,
          iflowName: artifact.iflowName,
          version: artifact.version,
          packageId: artifact.packageId,
          packageName: artifact.packageName
        })),
        target_environment: selectedEnvironment
      };

      console.log("🚀 Starting real deployment to CCCI_PROD:", deploymentRequest);

      // Call backend batch deployment API
      const response = await fetch("http://localhost:8000/api/sap/deploy/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deploymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const deploymentData: DeploymentResponse = await response.json();
      
      console.log("✅ Deployment initiated:", deploymentData);
      
      setDeploymentId(deploymentData.deployment_id);
      setDeploymentStatus(deploymentData.status);
      setArtifacts(deploymentData.progress);

      // The polling effect will handle status updates

    } catch (error) {
      console.error("❌ Deployment failed:", error);
      setError(error instanceof Error ? error.message : "Deployment failed");
      setIsProcessing(false);
    }
  };

  const getOverallProgress = () => {
    if (artifacts.length === 0) return 0;
    const totalProgress = artifacts.reduce((sum, artifact) => {
      const avgProgress = (artifact.uploadProgress + artifact.configureProgress + artifact.deployProgress) / 3;
      return sum + avgProgress;
    }, 0);
    return Math.round(totalProgress / artifacts.length);
  };

  const getCompletedCount = () => artifacts.filter(a => a.overallStatus === 'completed').length;
  const getFailedCount = () => artifacts.filter(a => a.overallStatus === 'failed').length;
  const getInProgressCount = () => artifacts.filter(a => a.overallStatus === 'in-progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Rocket className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-gray-900">Deploy Artifacts</CardTitle>
              <p className="text-gray-600 mt-1">
                Upload, configure, and deploy integration flows to the target environment
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Target Environment:</span>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {selectedEnvironment}
              </Badge>
              {deploymentId && (
                <span className="text-sm text-gray-500">
                  Deployment ID: {deploymentId}
                </span>
              )}
            </div>
            <Button 
              onClick={startDeployment} 
              disabled={isProcessing || processComplete}
              className="flex items-center space-x-2"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              <span>{isProcessing ? "Deploying..." : "Start Deployment"}</span>
            </Button>
          </div>

          {/* Progress Overview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-bold text-gray-900">{getOverallProgress()}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-3" />
            
            <div className="grid grid-cols-4 gap-4 mt-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{artifacts.length}</div>
                <div className="text-sm text-gray-600">Total iFlows</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{getCompletedCount()}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{getInProgressCount()}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{getFailedCount()}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          </div>

          {/* Artifacts Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">iFlow Artifact</TableHead>
                  <TableHead className="font-semibold text-center">Upload</TableHead>
                  <TableHead className="font-semibold text-center">Configure</TableHead>
                  <TableHead className="font-semibold text-center">Deploy</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold">Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artifacts.map((artifact) => (
                  <TableRow key={artifact.iflowId} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1 text-left">
                        <div className="text-xs text-gray-500 break-words whitespace-normal max-w-[30ch]">
                          <span className="font-semibold">Package Name:</span> {artifact.packageName}
                        </div>
                        <div className="text-sm text-gray-900 break-words whitespace-normal max-w-[30ch]">
                          <span className="font-semibold">iFlow Name:</span> {artifact.iflowName}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold">Version:</span> {artifact.version}
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Upload Column */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center space-y-1">
                        {getStatusIcon(artifact.uploadStatus)}
                        <Progress value={artifact.uploadProgress} className="w-16 h-2" />
                        {getStatusBadge(artifact.uploadStatus)}
                      </div>
                    </TableCell>
                    
                    {/* Configure Column */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center space-y-1">
                        {getStatusIcon(artifact.configureStatus)}
                        <Progress value={artifact.configureProgress} className="w-16 h-2" />
                        {getStatusBadge(artifact.configureStatus)}
                      </div>
                    </TableCell>
                    
                    {/* Deploy Column */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center space-y-1">
                        {getStatusIcon(artifact.deployStatus)}
                        <Progress value={artifact.deployProgress} className="w-16 h-2" />
                        {getStatusBadge(artifact.deployStatus)}
                      </div>
                    </TableCell>
                    
                    {/* Overall Status */}
                    <TableCell className="text-center">
                      {getOverallStatusBadge(artifact)}
                    </TableCell>
                    
                    {/* Message */}
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate" title={artifact.message}>
                        {artifact.message}
                      </div>
                      {artifact.errorMessage && (
                        <div className="text-xs text-red-600 mt-1" title={artifact.errorMessage}>
                          Error: {artifact.errorMessage}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="mt-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Completion Status */}
          {processComplete && (
            <div className="flex justify-center mt-4">
              <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                Deployment Process Complete
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button onClick={onPrevious} variant="outline" className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Previous: Dependencies</span>
        </Button>
        <Button
          onClick={() => {
            onComplete({ 
              deploymentStatus: { 
                complete: processComplete,
                artifacts: artifacts,
                environment: selectedEnvironment,
                deploymentId: deploymentId
              } 
            });
            onNext();
          }}
          disabled={!processComplete}
          className="flex items-center"
        >
          Next: Testing
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Stage6Deploy; 