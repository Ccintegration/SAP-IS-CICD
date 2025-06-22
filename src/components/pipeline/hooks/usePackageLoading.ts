import { useState, useRef, useCallback } from 'react';
import { Package, transformSAPPackageToPackage } from '../types/PackageTypes';
import { PipelineSAPService } from '@/lib/pipeline-sap-service';

// ✅ SIMPLIFIED: Removed all iFlow counting logic
export const usePackageLoading = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Load packages from SAP Integration Suite (no iFlow counts)
   */
  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const sapPackages = await PipelineSAPService.getIntegrationPackages();
      const transformedPackages = sapPackages.map(transformSAPPackageToPackage);
      setPackages(transformedPackages);
    } catch (error) {
      console.error("Failed to load packages:", error);
      setError(error instanceof Error ? error.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    packages,
    setPackages,
    loading,
    error,
    loadPackages,
    cleanup,
  };
};