import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface JobStatusProps {
  jobId: string;
  onReset: () => void;
}

interface JobResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  pages?: number;
  error?: string;
}

const JobStatus: React.FC<JobStatusProps> = ({ jobId, onReset }) => {
  const [result, setResult] = useState<JobResult | null>(null);
  const [polling, setPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!jobId || !polling) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/status/${jobId}`);
        const data = response.data;
        
        setResult(data);
        setPollCount(prev => prev + 1);
        
        // Stop polling if job is completed or failed, or after 60 attempts (5 minutes)
        if (data.status === 'completed' || data.status === 'failed' || pollCount > 60) {
          setPolling(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        
        // Stop polling after too many failures
        if (pollCount > 10) {
          setPolling(false);
          setResult({
            status: 'failed',
            error: 'Failed to get job status. Please try again.'
          });
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, polling, pollCount]);

  const getStatusDisplay = () => {
    if (!result) return 'Initializing...';
    
    switch (result.status) {
      case 'pending':
        return 'Waiting to process...';
      case 'processing':
        return 'Processing your PDFs...';
      case 'completed':
        return `Completed! ${result.pages} pages merged.`;
      case 'failed':
        return `Failed: ${result.error || 'Unknown error'}`;
      default:
        return 'Checking status...';
    }
  };

  return (
    <div className="w-full">
      <div className="p-6 border rounded-lg">
        <h3 className="text-lg font-medium mb-2">Job Status</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Job ID: {jobId}</p>
          
          <div className="mt-2">
            <p className="font-medium">{getStatusDisplay()}</p>
            
            {polling && (
              <div className="mt-2 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                <span className="text-sm text-gray-600">Checking for updates...</span>
              </div>
            )}
          </div>
        </div>
        
        {result?.status === 'completed' && result.url && (
          <div className="mt-4">
            <a 
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-primary-600 text-white rounded font-medium hover:bg-primary-700"
            >
              Download Merged PDF
            </a>
          </div>
        )}
        
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50"
        >
          Create New Merge
        </button>
      </div>
    </div>
  );
};

export default JobStatus;