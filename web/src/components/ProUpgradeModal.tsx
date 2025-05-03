import React from 'react';
import Link from 'next/link';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileSize: number;
  fileCount: number;
}

const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ 
  isOpen, 
  onClose, 
  fileSize, 
  fileCount 
}) => {
  if (!isOpen) return null;
  
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <svg className="mx-auto h-16 w-16 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h3 className="text-2xl font-semibold mt-4">Upgrade to Pro</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Your current upload exceeds our free plan limits:
          </p>
          <ul className="list-disc pl-5 text-gray-600 mb-4">
            <li className="mb-2">
              <span className="font-medium">File size:</span> {fileSizeMB}MB 
              <span className="text-red-500 ml-1">(exceeds 20MB limit)</span>
            </li>
            {fileCount > 3 && (
              <li className="mb-2">
                <span className="font-medium">Number of files:</span> {fileCount} 
                <span className="text-red-500 ml-1">(exceeds 3 file limit)</span>
              </li>
            )}
          </ul>
          <p className="text-gray-600">
            Upgrade to our Pro plan for unlimited file merges up to 100MB total, advanced page numbering, and watermark removal.
          </p>
        </div>

        <div className="flex justify-between space-x-4">
          <button 
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <Link
            href="/pricing"
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 text-center"
          >
            See Plans
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProUpgradeModal;