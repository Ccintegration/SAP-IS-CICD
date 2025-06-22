// File Path: src/components/pipeline/utils/DateUtils.ts
// Filename: DateUtils.ts

/**
 * Helper function to safely parse Unix timestamps and other date formats
 * Handles SAP's Unix timestamp format: "1712655437375" (13 digits)
 */
export const formatModifiedDate = (dateString: string | undefined | null): string => {
  try {
    if (!dateString || dateString === '' || dateString === 'null' || dateString === 'undefined') {
      return "Unknown";
    }

    const dateStr = String(dateString).trim();
    console.log(`🗓️ Parsing date: "${dateStr}"`); // Debug log
    
    let date: Date;
    
    // ✅ FIXED: Handle Unix timestamp in milliseconds (13 digits) - PRIMARY CASE for SAP
    if (dateStr.match(/^\d{13}$/)) {
      const timestamp = parseInt(dateStr, 10);
      date = new Date(timestamp);
      console.log(`📅 Unix timestamp ${dateStr} → ${date.toISOString()}`);
    }
    // Handle Unix timestamp in seconds (10 digits)
    else if (dateStr.match(/^\d{10}$/)) {
      const timestamp = parseInt(dateStr, 10) * 1000;
      date = new Date(timestamp);
      console.log(`📅 Unix seconds ${dateStr} → ${date.toISOString()}`);
    }
    // Handle ISO format
    else if (dateStr.includes('T') || dateStr.includes('Z')) {
      date = new Date(dateStr);
    }
    // Handle .NET JSON date format
    else if (dateStr.includes('/Date(')) {
      const timestamp = dateStr.match(/\/Date\((\d+)\)\//);
      if (timestamp) {
        date = new Date(parseInt(timestamp[1], 10));
      } else {
        throw new Error('Invalid .NET date format');
      }
    }
    // Handle simple date format: 2024-01-15
    else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      date = new Date(dateStr + 'T00:00:00.000Z');
    }
    // Handle US date format: 01/15/2024
    else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parts = dateStr.split('/');
      date = new Date(parseInt(parts[2], 10), parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
    }
    // Handle European date format: 15-01-2024
    else if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const parts = dateStr.split('-');
      date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    // Try other formats...
    else {
      date = new Date(dateStr);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('❌ Invalid date after parsing:', dateStr);
      return "Invalid Date";
    }

    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    
    // Handle future dates (shouldn't happen but just in case)
    if (diffTime < 0) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    console.log(`📊 Date diff: ${diffDays} days ago`); // Debug log

    // Return relative time for recent dates, absolute for older ones
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 1 ? "Just now" : `${diffMinutes}m ago`;
      }
      return diffHours === 1 ? "1h ago" : `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? "1 month ago" : `${months} months ago`;
    } else {
      // For dates older than a year, show the actual date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('❌ Error formatting date:', dateString, error);
    return "Date Error";
  }
};

/**
 * Helper function to get exact date string for tooltip
 */
export const getExactDateString = (dateString: string | undefined | null): string => {
  try {
    if (!dateString || dateString === '' || dateString === 'null' || dateString === 'undefined') {
      return "Unknown";
    }

    const dateStr = String(dateString).trim();
    let date: Date;
    
    if (dateStr.match(/^\d{13}$/)) {
      date = new Date(parseInt(dateStr, 10));
    } else if (dateStr.match(/^\d{10}$/)) {
      date = new Date(parseInt(dateStr, 10) * 1000);
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    console.error('Error getting exact date:', dateString, error);
    return "Unknown";
  }
};