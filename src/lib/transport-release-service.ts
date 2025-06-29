/**
 * Transport Release Service
 * Handles communication with backend Transport Release APIs
 */

export interface TransportRelease {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_date: string;
  created_by: string;
  modified_date?: string;
  modified_by?: string;
  target_environment: string;
  source_environment: string;
  total_artifacts: number;
}

export interface TransportArtifact {
  id: string;
  transport_release_id: string;
  iflow_id: string;
  iflow_name: string;
  package_id: string;
  package_name: string;
  version: string;
  status: string;
  created_date: string;
  modified_date?: string;
  deployment_order?: number;
}

export interface TransportReleaseList {
  transport_releases: TransportRelease[];
  total_count: number;
}

export interface TransportArtifactList {
  artifacts: TransportArtifact[];
  total_count: number;
  transport_release?: TransportRelease;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: string;
}

class TransportReleaseService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: APIResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Request failed');
      }

      return result.data as T;
    } catch (error) {
      console.error('Transport Release Service Error:', error);
      throw error;
    }
  }

  /**
   * Get all transport releases
   */
  async getTransportReleases(): Promise<TransportReleaseList> {
    return this.makeRequest<TransportReleaseList>('/api/transport-releases');
  }

  /**
   * Get a specific transport release by ID
   */
  async getTransportRelease(id: string): Promise<TransportRelease> {
    return this.makeRequest<TransportRelease>(`/api/transport-releases/${id}`);
  }

  /**
   * Get all artifacts for a specific transport release
   */
  async getTransportReleaseArtifacts(transportReleaseId: string): Promise<TransportArtifactList> {
    return this.makeRequest<TransportArtifactList>(`/api/transport-releases/${transportReleaseId}/artifacts`);
  }

  /**
   * Convert transport artifacts to pipeline data format
   */
  convertArtifactsToPipelineData(artifacts: TransportArtifact[]) {
    const selectedPackages = [...new Set(artifacts.map(artifact => artifact.package_id))];
    const selectedIFlows = artifacts.map(artifact => artifact.iflow_id);
    
    // Create iflow details in the format expected by the pipeline
    const iflowDetails = artifacts.map(artifact => ({
      id: artifact.iflow_id,
      name: artifact.iflow_name,
      packageId: artifact.package_id,
      packageName: artifact.package_name,
      version: artifact.version,
      status: artifact.status,
      modifiedDate: artifact.modified_date || artifact.created_date,
      modifiedBy: 'Transport Release',
      description: `From Transport Release: ${artifact.transport_release_id}`,
      lastDeployed: null
    }));

    return {
      selectedPackages,
      selectedIFlows,
      iflowDetails,
      transportReleaseMode: true,
      transportReleaseArtifacts: artifacts
    };
  }
}

// Export singleton instance
export const transportReleaseService = new TransportReleaseService(); 