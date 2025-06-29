import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { transportReleaseService, TransportRelease, TransportArtifact } from '@/lib/transport-release-service';

interface TransportReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransportReleaseSelect: (data: any) => void;
}

export const TransportReleaseDialog: React.FC<TransportReleaseDialogProps> = ({
  open,
  onOpenChange,
  onTransportReleaseSelect,
}) => {
  const [transportReleases, setTransportReleases] = useState<TransportRelease[]>([]);
  const [selectedTransportRelease, setSelectedTransportRelease] = useState<TransportRelease | null>(null);
  const [artifacts, setArtifacts] = useState<TransportArtifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load transport releases when dialog opens
  useEffect(() => {
    if (open) {
      loadTransportReleases();
    }
  }, [open]);

  const loadTransportReleases = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await transportReleaseService.getTransportReleases();
      setTransportReleases(result.transport_releases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transport releases');
    } finally {
      setLoading(false);
    }
  };

  const loadArtifacts = async (transportRelease: TransportRelease) => {
    setLoadingArtifacts(true);
    setError(null);
    try {
      const result = await transportReleaseService.getTransportReleaseArtifacts(transportRelease.id);
      setArtifacts(result.artifacts);
      setSelectedTransportRelease(transportRelease);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load artifacts');
    } finally {
      setLoadingArtifacts(false);
    }
  };

  const handleTransportReleaseSelect = (transportRelease: TransportRelease) => {
    loadArtifacts(transportRelease);
  };

  const handleConfirmSelection = () => {
    if (selectedTransportRelease && artifacts.length > 0) {
      const pipelineData = transportReleaseService.convertArtifactsToPipelineData(artifacts);
      onTransportReleaseSelect(pipelineData);
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    setSelectedTransportRelease(null);
    setArtifacts([]);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedTransportRelease) {
    // Show artifacts view
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBack} className="p-0 h-auto">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Button>
              Transport Release: {selectedTransportRelease.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Transport Release Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transport Release Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedTransportRelease.name}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className={`ml-2 ${getStatusColor(selectedTransportRelease.status)}`}>
                      {selectedTransportRelease.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(selectedTransportRelease.created_date)}
                  </div>
                  <div>
                    <span className="font-medium">Created By:</span> {selectedTransportRelease.created_by}
                  </div>
                  <div>
                    <span className="font-medium">Source Environment:</span> {selectedTransportRelease.source_environment}
                  </div>
                  <div>
                    <span className="font-medium">Target Environment:</span> {selectedTransportRelease.target_environment}
                  </div>
                  {selectedTransportRelease.description && (
                    <div className="col-span-2">
                      <span className="font-medium">Description:</span> {selectedTransportRelease.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Artifacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  iFlow Artifacts ({artifacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingArtifacts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading artifacts...
                  </div>
                ) : artifacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No artifacts found in this transport release.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {artifacts.map((artifact) => (
                      <div key={artifact.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{artifact.iflow_name}</h4>
                            <p className="text-sm text-gray-600">
                              Package: {artifact.package_name} • Version: {artifact.version}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {artifact.iflow_id}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(artifact.status)}>
                              {artifact.status}
                            </Badge>
                            {artifact.deployment_order && (
                              <p className="text-xs text-gray-500 mt-1">
                                Order: {artifact.deployment_order}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleBack}>
                Back to Transport Releases
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={artifacts.length === 0}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Use This Transport Release ({artifacts.length} artifacts)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show transport releases list
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Transport Release</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              <span>Loading transport releases...</span>
            </div>
          ) : transportReleases.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Transport Releases Found</h3>
              <p>No transport releases are available in the database.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transportReleases.map((transportRelease) => (
                <Card 
                  key={transportRelease.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTransportReleaseSelect(transportRelease)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{transportRelease.name}</h3>
                        {transportRelease.description && (
                          <p className="text-sm text-gray-600 mt-1">{transportRelease.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Created: {formatDate(transportRelease.created_date)}</span>
                          <span>By: {transportRelease.created_by}</span>
                          <span>
                            {transportRelease.source_environment} → {transportRelease.target_environment}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(transportRelease.status)}>
                          {transportRelease.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {transportRelease.total_artifacts} artifact{transportRelease.total_artifacts !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 