import { backendClient } from "./backend-client";
import { Package, transformSAPPackageToPackage } from '../components/pipeline/types/PackageTypes';
import { SortField, SortDirection } from '../components/pipeline/components/PackageTable';

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
   * Get paginated packages with server-side filtering and sorting
   */
  static async getPaginatedPackages(request: PackagePaginationRequest): Promise<PackagePaginationResponse> {
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);

    // Return cached data if valid
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('📦 Using cached package data');
      return cached.data;
    }

    try {
      console.log('📦 Fetching paginated packages from backend...');
      
      // For now, fetch all packages and do client-side pagination
      // TODO: Update backend to support server-side pagination
      const allPackages = await backendClient.getIntegrationPackages();
      
      // Transform packages
      const transformedPackages = allPackages.map(transformSAPPackageToPackage);
      
      // Apply search filter
      let filteredPackages = transformedPackages;
      if (request.searchTerm) {
        const searchLower = request.searchTerm.toLowerCase();
        filteredPackages = transformedPackages.filter(pkg =>
          pkg.name.toLowerCase().includes(searchLower) ||
          pkg.description.toLowerCase().includes(searchLower) ||
          pkg.modifiedBy.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply sorting
      filteredPackages.sort((a, b) => {
        let valueA: string | number;
        let valueB: string | number;
        
        switch (request.sortField) {
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'modifiedDate':
          case 'createdDate':
            valueA = parseInt(a.modifiedDate || '0', 10);
            valueB = parseInt(b.modifiedDate || '0', 10);
            break;
          case 'modifiedBy':
          case 'createdBy':
            valueA = (a.modifiedBy || '').toLowerCase();
            valueB = (b.modifiedBy || '').toLowerCase();
            break;
          default:
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
        }
        
        let comparison = 0;
        if (valueA < valueB) comparison = -1;
        else if (valueA > valueB) comparison = 1;
        
        return request.sortDirection === 'desc' ? -comparison : comparison;
      });
      
      // Apply pagination
      const totalCount = filteredPackages.length;
      const totalPages = Math.ceil(totalCount / request.pageSize);
      const startIndex = (request.page - 1) * request.pageSize;
      const endIndex = startIndex + request.pageSize;
      const paginatedPackages = filteredPackages.slice(startIndex, endIndex);
      
      const response: PackagePaginationResponse = {
        packages: paginatedPackages,
        totalCount,
        totalPages,
        currentPage: request.page,
        pageSize: request.pageSize,
        hasNextPage: request.page < totalPages,
        hasPreviousPage: request.page > 1,
      };
      
      // Cache the result
      this.cache.set(cacheKey, { data: response, timestamp: Date.now() });
      
      console.log(`📦 Loaded ${paginatedPackages.length} packages (page ${request.page} of ${totalPages})`);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to fetch paginated packages:', error);
      throw error;
    }
  }

  /**
   * Clear cache (call when packages are updated)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Prefetch next page for better UX
   */
  static async prefetchNextPage(request: PackagePaginationRequest): Promise<void> {
    if (request.page < 1) return;
    
    const nextPageRequest = { ...request, page: request.page + 1 };
    try {
      await this.getPaginatedPackages(nextPageRequest);
    } catch (error) {
      // Silently fail prefetch
      console.warn('Failed to prefetch next page:', error);
    }
  }
}