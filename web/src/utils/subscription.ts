import axios from 'axios';

// Check if we're using a test/placeholder key (for development)
const isDevelopmentKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('xxxx') || 
                         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('dummy') ||
                         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_example';

// Check if a user has a Pro subscription
export async function hasProSubscription(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  
  // In development mode with placeholder keys, simulate free tier
  if (isDevelopmentKey) {
    return false; // Return false to simulate free tier (or true for pro tier testing)
  }
  
  try {
    // In a real implementation, this would call an API to check the subscription status
    const response = await axios.get(`/api/user-subscription?userId=${userId}`);
    return response.data.hasPro === true;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Calculate the total size of all files in bytes
export function calculateTotalFileSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

// Check if the upload exceeds free plan limits
export function exceedsFreeLimit(files: File[]): boolean {
  const MAX_FREE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
  const MAX_FREE_FILES = 3;
  
  const totalSize = calculateTotalFileSize(files);
  return totalSize > MAX_FREE_SIZE_BYTES || files.length > MAX_FREE_FILES;
}