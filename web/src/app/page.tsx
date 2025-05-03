'use client';

import React, { useState } from 'react';
import FileDropzone from '@/components/FileDropzone';
import JobStatus from '@/components/JobStatus';

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);

  const handleJobCreated = (id: string) => {
    setJobId(id);
  };

  const handleReset = () => {
    setJobId(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">PDFBooker</h1>
        <p className="mt-2 text-lg text-gray-600">
          Merge multiple PDFs into one document with page numbers
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {!jobId ? (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upload PDFs</h2>
            <FileDropzone onJobCreated={handleJobCreated} />
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Processing</h2>
            <JobStatus jobId={jobId} onReset={handleReset} />
          </div>
        )}
      </div>

      <footer className="mt-10 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} PDFBooker. All rights reserved.</p>
      </footer>
    </div>
  );
}