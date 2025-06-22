export interface SAPPackage {
  id: string;
  name: string;
  description: string;
  version: string;
  modifiedDate?: string; // ✅ Support both field names from backend
  lastModified?: string; // ✅ Legacy support
  modifiedBy?: string;   // ✅ Support both field names from backend
  author?: string;       // ✅ Legacy support
  createdDate?: string;  // ✅ New field for created date
  createdBy?: string;    // ✅ New field for created by
  status: "active" | "draft" | "deprecated";
}

// Frontend interface (what we use in UI) - REMOVED iFlow count fields
export interface Package {
  id: string;
  name: string;
  description: string;
  version: string;
  modifiedDate: string;  // ✅ Standardized field names
  modifiedBy: string;    // ✅ Standardized field names
  createdDate?: string;  // ✅ New optional field
  createdBy?: string;    // ✅ New optional field
  status: "active" | "draft" | "deprecated";
  // ✅ REMOVED: iflowCount, iflowCountLoaded, iflowCountLoading
}

// Helper function to transform backend data to frontend format
export const transformSAPPackageToPackage = (sapPackage: SAPPackage): Package => {
  return {
    id: sapPackage.id,
    name: sapPackage.name,
    description: sapPackage.description,
    version: sapPackage.version,
    modifiedDate: sapPackage.modifiedDate || sapPackage.lastModified || new Date().toISOString(),
    modifiedBy: sapPackage.modifiedBy || sapPackage.author || 'Unknown User',
    createdDate: sapPackage.createdDate,
    createdBy: sapPackage.createdBy,
    status: sapPackage.status,
  };
};

export interface Stage1Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
}