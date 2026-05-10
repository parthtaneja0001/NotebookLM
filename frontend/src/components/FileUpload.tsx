import { useState, useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  onUpload: (file: File, collectionId: string) => void;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const validTypes = ['application/pdf', 'text/plain', 'text/csv'];
    if (!validTypes.includes(file.type)) {
      alert("Only PDF, TXT and CSV files are allowed.");
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading file...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api';
      const response = await fetch(`${backendUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { collectionId, status } = await response.json();

      if (status === 'processing') {
        setUploadStatus('Indexing document...');
        
        // Start polling
        const intervalId = setInterval(async () => {
          try {
            const statusRes = await fetch(`${backendUrl}/status/${collectionId}`);
            const statusData = await statusRes.json();
            
            if (statusData.status === 'ready') {
              clearInterval(intervalId);
              setIsUploading(false);
              setUploadStatus('');
              onUpload(file, collectionId);
            } else if (statusData.status === 'error') {
              clearInterval(intervalId);
              setIsUploading(false);
              setUploadStatus('');
              alert('Error occurred during indexing.');
            }
          } catch (err) {
            console.error('Error checking status:', err);
          }
        }, 2000);
      } else if (status === 'ready') {
        setIsUploading(false);
        setUploadStatus('');
        onUpload(file, collectionId);
      }
    } catch (err) {
      console.error('Error uploading:', err);
      setIsUploading(false);
      setUploadStatus('');
      alert('Failed to upload file. Please check if backend is running.');
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-32 px-4 py-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer text-center",
        isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-accent/50",
        isUploading && "opacity-70 pointer-events-none"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.txt,.csv"
        onChange={handleFileChange}
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm font-medium text-muted-foreground">{uploadStatus}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="p-2 bg-accent rounded-full">
            <UploadCloud className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Click or drag & drop</p>
            <p className="text-xs text-muted-foreground mt-1">PDF or TXT</p>
          </div>
        </div>
      )}
    </div>
  );
}
