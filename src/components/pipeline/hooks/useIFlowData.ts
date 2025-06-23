// File Path: src/components/pipeline/hooks/useIFlowData.ts
// Filename: useIFlowData.ts

import { useState, useEffect, useRef } from 'react';
import { PipelineSAPService } from "@/lib/pipeline-sap-service";
import { IFlow, PackageWithIFlows, UseIFlowDataReturn } from '../types/IFlowTypes';

export const useIFlowData = (selectedPackages: string[]): UseIFlowDataReturn => {
  const [iFlows, setIFlows] = useState<IFlow[]>([]);
  const [packagesByIFlows, setPackagesByIFlows] = useState<PackageWithIFlows[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate API calls
  const lastCallRef = useRef<number>(0);
  const isLoadingRef = useRef(false);
  const selectedPackagesRef = useRef<string[]>([]);

  const loadIFlows = async () => {
    const now = Date.now();
    const currentSelectedPackages = selectedPackages || [];
    
    // Prevent duplicate calls within 500ms
    if (isLoadingRef.current || (now - lastCallRef.current) < 500) {
      console.log("⚠️ Skipping iFlows API call - too recent or already loading", {
        isLoading: isLoadingRef.current,
        timeSinceLastCall: now - lastCallRef.current
      });
      return;
    }

    // Check if packages changed
    const packagesChanged = JSON.stringify(selectedPackagesRef.current) !== JSON.stringify(currentSelectedPackages);
    if (!packagesChanged && lastCallRef.current > 0) {
      console.log("⚠️ Skipping iFlows API call - selectedPackages haven't changed");
      return;
    }

    lastCallRef.current = now;
    isLoadingRef.current = true;
    selectedPackagesRef.current = [...currentSelectedPackages];
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("📡 Making iFlows API call to /api/sap/iflows", {
        timestamp: new Date().toISOString(),
        selectedPackages: currentSelectedPackages,
        packageIds: currentSelectedPackages.length > 0 ? currentSelectedPackages : ["all"]
      });

      const selectedPackageIds = currentSelectedPackages.length > 0 
        ? currentSelectedPackages 
        : ["all"];

      const iflowsData = await PipelineSAPService.getIntegrationFlows(selectedPackageIds);
      
      console.log("✅ iFlows API call successful", {
        timestamp: new Date().toISOString(),
        iflowsCount: iflowsData.length,
        firstFewIFlows: iflowsData.slice(0, 3).map(i => ({ id: i.id, name: i.name, packageId: i.packageId }))
      });

      // Transform SAPIFlow to IFlow format
      const transformedIFlows: IFlow[] = iflowsData.map(sapIFlow => ({
        id: sapIFlow.id,
        name: sapIFlow.name,
        description: sapIFlow.description,
        packageId: sapIFlow.packageId,
        packageName: (sapIFlow as any).packageName || sapIFlow.packageId, // Handle missing packageName
        status: sapIFlow.status,
        lastModified: sapIFlow.lastModified,
        version: sapIFlow.version,
        author: sapIFlow.author,
        type: sapIFlow.type as "http" | "mail" | "sftp" | "database" | "integration flow"
      }));

      setIFlows(transformedIFlows);

      // Group iFlows by package
      const packageMap = new Map<string, PackageWithIFlows>();
      
      transformedIFlows.forEach(iflow => {
        const packageId = iflow.packageId;
        const packageName = iflow.packageName || packageId;
        
        if (!packageMap.has(packageId)) {
          packageMap.set(packageId, {
            packageId,
            packageName,
            iflows: []
          });
        }
        
        packageMap.get(packageId)!.iflows.push(iflow);
      });

      const packagesByIFlowsArray = Array.from(packageMap.values());
      setPackagesByIFlows(packagesByIFlowsArray);

      console.log("📦 Packages organized", {
        packagesCount: packagesByIFlowsArray.length,
        packages: packagesByIFlowsArray.map(pkg => ({
          id: pkg.packageId,
          name: pkg.packageName,
          iflowCount: pkg.iflows.length
        }))
      });

    } catch (error: any) {
      console.error("❌ Failed to load iFlows:", error);
      
      let errorMessage = "Failed to load integration flows. Please try again.";
      
      if (error.message) {
        if (error.message.includes("No registered tenant found")) {
          errorMessage = "No SAP Integration Suite tenant registered. Please register your tenant in the Administration tab first.";
        } else if (error.message.includes("Backend URL not configured")) {
          errorMessage = "Backend URL not configured. Please configure your Python FastAPI backend URL in the Administration tab.";
        } else if (error.message.includes("Cannot connect to backend")) {
          errorMessage = `Backend connection failed: ${error.message}. Please ensure your Python FastAPI backend is running and accessible.`;
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Effect to load data when packages change
  useEffect(() => {
    console.log("🔄 useIFlowData useEffect triggered", {
      selectedPackages: selectedPackages,
      hasChanged: JSON.stringify(selectedPackagesRef.current) !== JSON.stringify(selectedPackages || [])
    });
    
    loadIFlows();
  }, [selectedPackages]); // Only depend on selectedPackages

  return {
    iFlows,
    packagesByIFlows,
    loading,
    error,
    loadIFlows
  };
};