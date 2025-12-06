"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock, Home } from "lucide-react";
import { parseISO } from 'date-fns';

export function useQuoteExpiration(quote: any, paymentMethod?: string) {
  const [isExpired, setIsExpired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!quote || !quote.id || paymentMethod === 'bank_transfer') {
      return;
    }

    const quoteCreationTimestamp = localStorage.getItem('quoteCreationTimestamp');
    if (!quoteCreationTimestamp) {
      return; // No timestamp, so can't calculate expiration
    }

    let timeoutId: NodeJS.Timeout;

    try {
      const creationTime = parseInt(quoteCreationTimestamp, 10);
      const expirationTime = creationTime + 10 * 60 * 1000; // 10 minutes
      const now = new Date().getTime();

      const handleExpiration = () => {
        setIsExpired(true);
        if (quote && quote.id) {
          fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
        }
      };

      if (now >= expirationTime) {
        handleExpiration();
      } else {
        const remainingTime = expirationTime - now;
        timeoutId = setTimeout(handleExpiration, remainingTime);
      }
    } catch (error) {
      console.error("Error processing quote expiration timer:", error);
      return;
    }

    return () => clearTimeout(timeoutId);

  }, [quote, paymentMethod]);

  const ExpirationDialog = () => (
    <AlertDialog open={isExpired}>
      <AlertDialogContent className="bg-gray-900 border border-cyan-500/20 max-w-md p-0 overflow-hidden">
        <div>
          {/* Header with gradient */}
          <div className="h-1 bg-gradient-to-r from-cyan-600 to-teal-600" />
          
          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
                <Clock className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Quote Expired
            </h2>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-4" />

            {/* Description */}
            <p className="text-center text-gray-300 mb-8">
              Your quote session has expired after 10 minutes of inactivity. Please generate a new quote to continue.
            </p>

            {/* Action Button */}
            <Button
              onClick={() => {
                localStorage.removeItem("quoteData");
                localStorage.removeItem("quoteRestorationData");
                localStorage.removeItem("quoteCreationTimestamp");
                router.push('/');
              }}
              className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white h-12 font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go to Homepage
            </Button>

            {/* Footer note */}
            <p className="text-xs text-gray-500 text-center mt-6">
              You will be redirected to generate a new quote
            </p>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { ExpirationDialog };
}
