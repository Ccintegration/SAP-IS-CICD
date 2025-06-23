// File Path: src/lib/package-pagination-service.ts
// Filename: package-pagination-service.ts

import { backendClient } from "./backend-client";
import { Package, transformSAPPackageToPackage, SAPPackage } from '../components/pipeline/types/PackageTypes';
import { SortField, SortDirection } from '../components/pipeline/components/PackageTable';
import { IntegrationPackage } from './types';

export interface PackagePaginationRequest {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

export interface PackagePaginationResponse {
  packages: Package[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class PackagePaginationService {
  private static cache = new Map<string, { data: PackagePaginationResponse; timestamp: number }>();
  private static allPackagesCache: { data: Package[]; timestamp: number } | null = null;
  private static cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from request parameters
   */
  private static getCacheKey(request: PackagePaginationRequest): string {
    return `${request.page}-${request.pageSize}-${request.searchTerm || ''}-${request.sortField}-${request.sortDirection}`;
  }

  /**
   * Check if cached data is still valid
   */
  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  /**
   * Clear all caches
   */
  static clearCache(): void {
    this.cache.clear();
    this.allPackagesCache = null;
  }

  /**
   * Get all packages from backend with caching
   */
  private static async getAllPackages(): Promise<Package[]> {
    // Return cached data if valid
    if (this.allPackagesCache && this.isCacheValid(this.allPackagesCache.timestamp)) {
      console.log('📦 Using cached all packages data');
      return this.allPackagesCache.data;
    }

    try {
      console.log('📦 Fetching all packages from backend...');
      const allPackages = await backendClient.getIntegrationPackages();
      
      // Transform packages with proper type handling
      const transformedPackages = allPackages.map((pkg: IntegrationPackage) => {
        // DEBUG: Log the raw package data to see what we're getting
        console.log('🔍 [Debug] Raw package from backend:', {
          id: pkg.id,
          name: pkg.name,
          lastModified: pkg.lastModified,
          modifiedDate: (pkg as any).modifiedDate,
          allFields: Object.keys(pkg)
        });

        // Helper function to convert Date to string safely
        const dateToString = (date: Date | string | any): string => {
          if (date instanceof Date) {
            return date.toISOString();
          }
          if (typeof date === 'string') {
            return date;
          }
          return new Date().toISOString(); // fallback
        };

        // Convert IntegrationPackage to SAPPackage format first
        const sapPackage: SAPPackage = {
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          version: pkg.version,
          // FIXED: Specifically look for modifiedDate field from your backend
          modifiedDate: (pkg as any).modifiedDate || dateToString(pkg.lastModified),
          lastModified: (pkg as any).modifiedDate || dateToString(pkg.lastModified),
          modifiedBy: (pkg as any).modifiedBy || (pkg as any).author || 'Unknown User',
          author: (pkg as any).author || (pkg as any).modifiedBy || 'Unknown User',
          createdDate: (pkg as any).createdDate ? dateToString((pkg as any).createdDate) : ((pkg as any).modifiedDate || dateToString(pkg.lastModified)),
          createdBy: (pkg as any).createdBy || (pkg as any).modifiedBy || (pkg as any).author || 'Unknown User',
          status: (pkg as any).status || 'active' as "active" | "draft" | "deprecated"
        };
        
        // DEBUG: Log the transformed package
        console.log('🔍 [Debug] Transformed package:', {
          id: sapPackage.id,
          name: sapPackage.name,
          modifiedDate: sapPackage.modifiedDate
        });
        
        // Then transform to Package format
        return transformSAPPackageToPackage(sapPackage);
      });
      
      // Cache the results
      this.allPackagesCache = {
        data: transformedPackages,
        timestamp: Date.now()
      };

      console.log(`📦 Loaded ${transformedPackages.length} packages from backend`);
      return transformedPackages;
    } catch (error) {
      console.error('❌ Failed to fetch packages from backend:', error);
      throw error;
    }
  }

  /**
   * Improved search function - case-insensitive wildcard matching
   */
  private static filterPackages(packages: Package[], searchTerm: string): Package[] {
    if (!searchTerm || !searchTerm.trim()) {
      return packages;
    }

    const searchLower = searchTerm.trim().toLowerCase();
    console.log(`🔍 Searching packages with term: "${searchLower}"`);

    const filteredPackages = packages.filter(pkg => {
      // Case-insensitive wildcard matching across multiple fields
      const nameMatch = pkg.name.toLowerCase().includes(searchLower);
      const descriptionMatch = pkg.description.toLowerCase().includes(searchLower);
      const versionMatch = pkg.version.toLowerCase().includes(searchLower);
      const authorMatch = (pkg.modifiedBy || '').toLowerCase().includes(searchLower);
      const createdByMatch = (pkg.createdBy || '').toLowerCase().includes(searchLower);
      const idMatch = pkg.id.toLowerCase().includes(searchLower);

      return nameMatch || descriptionMatch || versionMatch || authorMatch || createdByMatch || idMatch;
    });

    console.log(`🔍 Found ${filteredPackages.length} packages matching "${searchTerm}"`);
    return filteredPackages;
  }

  /**
   * Sort packages based on field and direction
   */
  private static sortPackages(packages: Package[], sortField: SortField, sortDirection: SortDirection): Package[] {
    return [...packages].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'modifiedDate':
          // FIXED: Handle modifiedDate field properly for sorting
          console.log(`🔄 [Sort] Sorting by modifiedDate: a="${a.modifiedDate}" b="${b.modifiedDate}"`);
          
          // Convert modifiedDate strings to timestamps for proper numerical sorting
          aValue = a.modifiedDate ? this.parseTimestamp(a.modifiedDate) : 0;
          bValue = b.modifiedDate ? this.parseTimestamp(b.modifiedDate) : 0;
          
          console.log(`🔄 [Sort] Converted timestamps: a=${aValue} b=${bValue}`);
          break;
        case 'modifiedBy':
          aValue = (a.modifiedBy || '').toLowerCase();
          bValue = (b.modifiedBy || '').toLowerCase();
          break;
        case 'createdDate':
          // Handle createdDate field
          aValue = a.createdDate ? this.parseTimestamp(a.createdDate) : this.parseTimestamp(a.modifiedDate);
          bValue = b.createdDate ? this.parseTimestamp(b.createdDate) : this.parseTimestamp(b.modifiedDate);
          break;
        case 'createdBy':
          aValue = (a.createdBy || a.modifiedBy || '').toLowerCase();
          bValue = (b.createdBy || b.modifiedBy || '').toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      // Perform comparison
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Helper function to parse timestamp from various formats
   */
  private static parseTimestamp(dateString: string): number {
    try {
      if (!dateString || dateString === 'Not available') {
        return 0; // Put invalid dates at the beginning
      }

      const dateStr = String(dateString).trim();
      
      // Handle 13-digit Unix timestamp (milliseconds)
      if (dateStr.match(/^\d{13}$/)) {
        return parseInt(dateStr, 10);
      }
      
      // Handle 10-digit Unix timestamp (seconds) - convert to milliseconds
      if (dateStr.match(/^\d{10}$/)) {
        return parseInt(dateStr, 10) * 1000;
      }
      
      // Handle ISO date strings
      if (dateStr.includes('T') || dateStr.includes('Z')) {
        return new Date(dateStr).getTime();
      }
      
      // Try to parse as regular date
      const parsed = new Date(dateStr).getTime();
      return isNaN(parsed) ? 0 : parsed;
      
    } catch (error) {
      console.warn('❌ [Sort] Error parsing timestamp:', dateString, error);
      return 0;
    }
  }

  /**
   * Get paginated packages with improved search and sorting
   */
  static async getPaginatedPackages(request: PackagePaginationRequest): Promise<PackagePaginationResponse> {
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);

    // Return cached data if valid
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('📦 Using cached paginated package data');
      return cached.data;
    }

    try {
      // Get all packages (from cache or backend)
      const allPackages = await this.getAllPackages();
      
      // Step 1: Apply search filter across ALL packages (not just current page)
      const filteredPackages = this.filterPackages(allPackages, request.searchTerm || '');
      
      // Step 2: Sort the filtered results
      const sortedPackages = this.sortPackages(filteredPackages, request.sortField, request.sortDirection);
      
      // Step 3: Calculate pagination
      const totalCount = sortedPackages.length;
      const totalPages = Math.ceil(totalCount / request.pageSize);
      const currentPage = Math.max(1, Math.min(request.page, totalPages));
      const startIndex = (currentPage - 1) * request.pageSize;
      const endIndex = Math.min(startIndex + request.pageSize, totalCount);
      
      // Step 4: Get the page slice
      const pagePackages = sortedPackages.slice(startIndex, endIndex);
      
      const response: PackagePaginationResponse = {
        packages: pagePackages,
        totalCount,
        totalPages: totalPages || 1,
        currentPage,
        pageSize: request.pageSize,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      console.log(`📦 Paginated packages: page ${currentPage}/${totalPages}, showing ${pagePackages.length}/${totalCount} packages`);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to get paginated packages:', error);
      throw error;
    }
  }

  /**
   * Prefetch next page for better UX
   */
  static async prefetchNextPage(request: PackagePaginationRequest): Promise<void> {
    const nextPageRequest = { ...request, page: request.page + 1 };
    try {
      await this.getPaginatedPackages(nextPageRequest);
      console.log(`📦 Prefetched page ${nextPageRequest.page}`);
    } catch (error) {
      console.warn('⚠️ Failed to prefetch next page:', error);
    }
  }
}