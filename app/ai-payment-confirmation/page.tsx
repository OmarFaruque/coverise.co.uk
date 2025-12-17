"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Download } from 'lucide-react';

export default function AIPaymentConfirmationPage() {
  const [documentType, setDocumentType] = useState('');
  const [documentUuid, setDocumentUuid] = useState('');

  useEffect(() => {
    const type = localStorage.getItem("aiDocumentType");
    const uuid = localStorage.getItem("aiDocumentUuid");
    if (type) {
      setDocumentType(type);
    }
    if (uuid) {
      setDocumentUuid(uuid);
    }
  }, []);

  const handleDownload = () => {
    if (documentUuid) {
      window.location.href = `/api/ai-documents/download-pdf/${documentUuid}`;
    }
  };

  return (
    <div className={`get-quote-dark min-h-screen flex flex-col relative overflow-hidden text-white`}>
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900 -z-10" />
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md max-w-lg w-full text-center border border-gray-700">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-300 mb-6">Your AI-generated document is ready to be downloaded.</p>
        
        <div className="bg-gray-700 p-4 rounded-lg text-left mb-6">
          <p className="text-sm text-gray-300">Document Type:</p>
          <p className="font-semibold text-white">{documentType}</p>
        </div>

        <Button onClick={handleDownload} className="w-full bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2">
          <Download className="w-5 h-5 mr-2" />
          Download Document
        </Button>

        <Link href="/dashboard">
          <Button variant="outline" className="w-full text-white border-gray-600">
            Go to Dashboard
          </Button>
        </Link>
        </div>
      </div>
    </div>
  );
}