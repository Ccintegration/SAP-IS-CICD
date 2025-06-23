// File Path: src/components/pipeline/utils/IFlowHelpers.ts
// Filename: IFlowHelpers.ts

import { IFlow } from '../types/IFlowTypes';

/**
 * Format smart date for iFlow last modified date
 */
export const formatIFlowModifiedDate = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown';
  }
};

/**
 * Get exact date string for tooltip
 */
export const getIFlowExactDateString = (dateString: string): string => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    console.error('Error formatting exact date:', error);
    return 'Unknown date';
  }
};

/**
 * Format version display
 */
export const formatVersion = (version: string): string => {
  if (!version) return '1.0.0';
  return version.startsWith('Version : ') ? version : `Version : ${version}`;
};

/**
 * Format author/email display
 */
export const formatAuthor = (author: string): string => {
  if (!author) return 'Unknown User';
  return author;
};

/**
 * Get status icon class for styling
 */
export const getStatusIconClass = (status: string): string => {
  switch (status) {
    case "active":
      return "text-green-500";
    case "draft":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

/**
 * Filter iFlows based on search term
 */
export const filterIFlows = (iflows: IFlow[], searchTerm: string): IFlow[] => {
  if (!searchTerm.trim()) return iflows;
  
  const term = searchTerm.toLowerCase();
  return iflows.filter(iflow =>
    iflow.name.toLowerCase().includes(term) ||
    iflow.description.toLowerCase().includes(term) ||
    iflow.id.toLowerCase().includes(term) ||
    iflow.version.toLowerCase().includes(term) ||
    iflow.author.toLowerCase().includes(term)
  );
};

/**
 * Get pagination info for package iFlows
 */
export const getPaginationInfo = (
  currentPage: number,
  itemsPerPage: number,
  totalItems: number
): { start: number; end: number; totalPages: number } => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const end = Math.min(start + itemsPerPage, totalItems);
  
  return { start, end, totalPages };
};

/**
 * Get display text for pagination
 */
export const getPaginationDisplayText = (
  currentPage: number,
  itemsPerPage: number,
  totalItems: number,
  isFiltered: boolean = false,
  originalTotal?: number
): string => {
  const { start, end } = getPaginationInfo(currentPage, itemsPerPage, totalItems);
  
  if (totalItems === 0) {
    return isFiltered ? "No matching iFlows found" : "No iFlows available";
  }
  
  const baseText = `Showing ${start + 1} to ${end} of ${totalItems} iFlow${totalItems === 1 ? '' : 's'}`;
  
  if (isFiltered && originalTotal) {
    return `${baseText} (filtered from ${originalTotal} total)`;
  }
  
  return baseText;
};

/**
 * Save configuration to backend directory structure
 */
export const saveIFlowConfiguration = async (
  packageName: string,
  iflowName: string,
  version: string,
  parameters: Array<{ parameterName: string; parameterValue: string }>
): Promise<boolean> => {
  try {
    // Create directory path: backend/configurations/<<Package name>>/<<iflow name>>/<<version>>/
    const directoryPath = `backend/configurations/${packageName}/${iflowName}/${version}/`;
    const fileName = `${packageName}_${iflowName}_Parameters.csv`;
    
    // Convert parameters to CSV format
    const csvHeader = 'Parameter Name,Parameter Value\n';
    const csvData = parameters
      .map(param => `"${param.parameterName}","${param.parameterValue}"`)
      .join('\n');
    const csvContent = csvHeader + csvData;
    
    // In a real implementation, this would call a backend API to save the file
    console.log('Saving configuration to:', directoryPath + fileName);
    console.log('CSV Content:', csvContent);
    
    // Simulate API call - replace with actual backend call
    // await fetch('/api/configurations/save', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     directoryPath,
    //     fileName,
    //     content: csvContent
    //   })
    // });
    
    return true;
  } catch (error) {
    console.error('Error saving configuration:', error);
    return false;
  }
};

/**
 * Generate confirmation message for next step navigation
 */
export const getNextStepConfirmationMessage = (): string => {
  return "Ensure to modify and save the correct configurations as per next Environment before going to Next step. Are you sure to goto next step?";
};