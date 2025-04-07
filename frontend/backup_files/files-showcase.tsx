import React from 'react';
import { FileManager } from '../../components/files/FileManager';

export default function FilesShowcasePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">File Management System</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">File Manager</h2>
        <p className="text-gray-600 mb-4">
          Complete file management system with upload, preview, and deletion capabilities.
          Files are automatically organized by type for better browsing.
        </p>
        
        <div className="bg-white shadow rounded-lg p-6">
          <FileManager
            title="Project Files"
            entityType="project"
            entityId="demo-project"
            allowUpload={true}
            allowDelete={true}
            emptyMessage="No files yet. Upload some files to get started with your project."
            acceptedFileTypes={['image/*', 'application/pdf', 'video/*', 'audio/*', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Direct uploads to Google Cloud Storage</li>
            <li>Progress tracking for uploads</li>
            <li>Preview support for multiple file types:
              <ul className="list-circle pl-5 mt-1 space-y-1">
                <li>Images (jpg, png, gif, webp, etc.)</li>
                <li>Documents (pdf, doc, xls, ppt, etc.)</li>
                <li>Videos (mp4, webm, etc.)</li>
                <li>Audio files (mp3, wav, etc.)</li>
              </ul>
            </li>
            <li>Lightbox for image previews</li>
            <li>File management (upload, delete)</li>
            <li>Entity attachment system</li>
            <li>Adaptive layout for different screen sizes</li>
          </ul>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Details</h2>
          <div className="prose max-w-none">
            <p>
              The file management system is built on top of Google Cloud Storage with the following components:
            </p>
            
            <h3 className="text-lg font-medium mt-4">Frontend</h3>
            <ul className="list-disc pl-5">
              <li>React components for file upload, preview, and management</li>
              <li>Direct-to-cloud uploads using signed URLs</li>
              <li>Progress tracking with XMLHttpRequest</li>
              <li>Specialized preview components for different file types</li>
            </ul>
            
            <h3 className="text-lg font-medium mt-4">Backend</h3>
            <ul className="list-disc pl-5">
              <li>NestJS controllers for file management</li>
              <li>Google Cloud Storage service integration</li>
              <li>Signed URL generation for secure uploads</li>
              <li>File metadata tracking in Firestore</li>
            </ul>
            
            <h3 className="text-lg font-medium mt-4">Security</h3>
            <ul className="list-disc pl-5">
              <li>Authentication required for all operations</li>
              <li>File size limits and type validation</li>
              <li>Organization-based isolation of files</li>
              <li>Temporary signed URLs for secure access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}