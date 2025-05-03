import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { exceedsFreeLimit, hasProSubscription } from '@/utils/subscription';
import ProUpgradeModal from './ProUpgradeModal';

// Check if we're using a test/placeholder key (for development)
const isDevelopmentKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('xxxx') || 
                         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('dummy') ||
                         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_example';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FileDropzoneProps {
  onJobCreated: (jobId: string) => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onJobCreated }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProModal, setShowProModal] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  
  // Use mock auth data in development mode
  const mockAuth = { userId: 'dev-user-123', isSignedIn: true };
  const { userId, isSignedIn } = isDevelopmentKey ? mockAuth : useAuth();

  // Check subscription status when component mounts or userId changes
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (userId) {
          const hasPro = await hasProSubscription(userId);
          setIsProUser(hasPro);
        } else {
          setIsProUser(false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setIsProUser(false);
      }
    };
    
    checkSubscription();
  }, [userId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for PDFs only
    const pdfFiles = acceptedFiles.filter(file => 
      file.type === 'application/pdf'
    );
    
    if (pdfFiles.length < acceptedFiles.length) {
      setError('Only PDF files are accepted');
    } else {
      setError(null);
    }
    
    setFiles(current => [...current, ...pdfFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(current => current.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please add at least one PDF file');
      return;
    }

    // Check for Pro plan requirements
    if (!isProUser && exceedsFreeLimit(files)) {
      setShowProModal(true);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // Add user ID if signed in
      if (userId) {
        formData.append('userId', userId);
      }

      const response = await axios.post(`${API_URL}/merge`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.job_id) {
        onJobCreated(response.data.job_id);
        setFiles([]);
      } else {
        throw new Error('No job ID in response');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}`}
        style={{cursor: 'pointer'}}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? 'Drop PDFs here' : 'Drag PDFs here or click to browse'}
          </p>
          
          <div className="text-sm text-gray-500">
            <p>Only PDF files are accepted</p>
            {!isProUser && (
              <p className="mt-1">
                Free plan: Up to 3 files, max 20MB total
                {isSignedIn && (
                  <span className="ml-1 text-primary-600 hover:underline cursor-pointer" onClick={() => window.location.href = '/pricing'}>
                    Upgrade for more
                  </span>
                )}
              </p>
            )}
            {isProUser && (
              <p className="mt-1 text-primary-600">Pro plan: Up to 100MB total</p>
            )}
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-medium mb-2">Selected files ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex-1 truncate mr-4">
                  <span className="font-medium">{file.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                  disabled={uploading}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          
          <div className="mt-2 text-sm">
            <p className="text-gray-600">
              Total size: {(files.reduce((total, file) => total + file.size, 0) / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        onClick={uploadFiles}
        disabled={files.length === 0 || uploading}
        className={`mt-4 px-4 py-2 rounded font-medium text-white 
          ${files.length === 0 || uploading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-primary-600 hover:bg-primary-700'}`}
        style={{
          cursor: files.length === 0 || uploading ? 'not-allowed' : 'pointer',
          backgroundColor: files.length === 0 || uploading ? '#9ca3af' : '#0ea5e9'
        }}
      >
        {uploading ? 'Uploading...' : 'Merge PDFs'}
      </button>
      
      <ProUpgradeModal 
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        fileSize={files.reduce((total, file) => total + file.size, 0)}
        fileCount={files.length}
      />
    </div>
  );
};

export default FileDropzone;