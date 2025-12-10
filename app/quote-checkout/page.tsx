'use client';

import React from 'react';
import DOMPurify from 'dompurify';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Shield, Lock, ArrowLeft, Info, Loader2, CreditCard, Landmark, Car, FileText, Clock, User, Building2 } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import usePaddle from '@/hooks/use-paddle';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useSettings } from '@/context/settings';
import { Elements, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import Loading from './loading';
import { useQuoteExpiration } from '@/hooks/use-quote-expiration.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


// Dynamically import heavy payment components
const PaymentForm = dynamic(() => import('react-square-web-payments-sdk').then(mod => mod.PaymentForm), { ssr: false, loading: () => <Loader2 className="w-5 h-5 animate-spin" /> });
const SquareCreditCard = dynamic(() => import('react-square-web-payments-sdk').then(mod => mod.CreditCard), { ssr: false });
const SquareGooglePay = dynamic(() => import('react-square-web-payments-sdk').then(mod => mod.GooglePay), { ssr: false });
const SquareApplePay = dynamic(() => import('react-square-web-payments-sdk').then(mod => mod.ApplePay), { ssr: false });

interface QuoteData {
  id?: string;
  total: number;
  startTime: string;
  expiryTime: string;
  breakdown: {
    duration: string;
    reason: string;
  };
  customerData: {
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    phoneNumber: string;
    occupation: string;
    address: string;
    licenseType: string;
    licenseHeld: string;
    vehicleValue: string;
    reason: string;
    duration: string;
    registration: string;
    vehicle: {
      make: string;
      model: string;
      year: string;
    };
  };
  promoCode?: string;
}

const StripePayment = React.forwardRef(({ quoteData, user, quote, onProcessingChange }, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  React.useImperativeHandle(ref, () => ({
    async handlePayment() {
      if (!stripe || !elements) {
        toast({ variant: "destructive", title: "Payment Error", description: "Stripe is not available." });
        onProcessingChange(false);
        return;
      }
      onProcessingChange(true);
      try {
        const response = await fetch("/api/quote-checkout/create-stripe-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteData: { ...quoteData, id: quote.id, total: quoteData?.total },
            user: user,
          }),
        });
        const { clientSecret, error: clientSecretError } = await response.json();
        if (clientSecretError) throw new Error(clientSecretError.message || "Could not initiate Stripe payment.");
        
        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement) throw new Error("Card element not found.");

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardNumberElement },
        });
        if (error) throw error;
        if (paymentIntent.status === "succeeded") {
          toast({ title: "Payment Successful", description: "Your payment has been processed." });
          localStorage.removeItem('quoteCreationTimestamp');
          window.location.href = "/payment-confirmation";
        }
      } catch (error: any) {
        toast({ variant: "destructive", title: "Payment Error", description: error.message });
        onProcessingChange(false);
      }
    }
  }));

  const inputClass = "h-11 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 p-3 rounded-lg";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-300">
          Card Number
        </Label>
        <div className="relative">
            <CardNumberElement id="cardNumber" className={inputClass} options={{style: {base: {fontSize: '16px', color: '#ffffff'}}}} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiry" className="text-sm font-medium text-gray-300">
            Expiry Date
          </Label>
          <CardExpiryElement id="expiry" className={inputClass} options={{style: {base: {fontSize: '16px', color: '#ffffff'}}}} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv" className="text-sm font-medium text-gray-300">
            CVV
          </Label>
          <CardCvcElement id="cvv" className={inputClass} options={{style: {base: {fontSize: '16px', color: '#ffffff'}}}} />
        </div>
      </div>
    </div>
  );
});
StripePayment.displayName = 'StripePayment';

const StripeApplePayButton = ({ quoteData, user, quote, onProcessingChange, allTermsAccepted, settings }) => {
    const stripe = useStripe();
    const { toast } = useToast();
    const [paymentRequest, setPaymentRequest] = useState(null);

    useEffect(() => {
        if (stripe) {
            const pr = stripe.paymentRequest({
                country: 'GB',
                currency: (settings?.general?.currency || 'GBP').toLowerCase(),
                total: {
                    label: 'Total',
                    amount: Math.round(quoteData.total * 100),
                },
                requestPayerName: true,
                requestPayerEmail: true,
            });

            pr.canMakePayment().then(result => {
              if (result) {
                setPaymentRequest(pr);
              }
            }).catch(error => {
              console.error('Error checking canMakePayment for Apple Pay:', error);
            });
        }

    }, [stripe, quoteData.total, settings]);

    useEffect(() => {
        let mounted = true;
        if (paymentRequest) {
            paymentRequest.on('paymentmethod', async (ev) => {
                if (!allTermsAccepted) {
                    toast({ variant: 'destructive', title: 'Missing Information', description: 'Please accept all the terms and conditions.' });
                    ev.complete('fail');
                    return;
                }
                onProcessingChange(true);

                const handleSuccess = () => {
                    toast({ title: "Payment Successful", description: "Your payment has been processed." });
                    localStorage.removeItem('quoteCreationTimestamp');
                    window.location.href = "/payment-confirmation";
                };

                try {
                    const response = await fetch("/api/quote-checkout/create-stripe-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            quoteData: { ...quoteData, id: quote.id, total: quoteData?.total },
                            user: user,
                        }),
                    });
                    const { clientSecret, error: clientSecretError } = await response.json();
                    if (!mounted) return;
                    if (clientSecretError) throw new Error(clientSecretError.message || "Could not initiate Stripe payment.");

                    const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
                        clientSecret,
                        { payment_method: ev.paymentMethod.id },
                        { handleActions: false }
                    );

                    if (!mounted) return;
                    if (confirmError) {
                        ev.complete('fail');
                        throw confirmError;
                    }

                    if (paymentIntent.status === "succeeded") {
                        ev.complete('success');
                        handleSuccess();
                    } else if (paymentIntent.status === "requires_action") {
                        ev.complete('success');
                        const { error } = await stripe.confirmCardPayment(clientSecret);
                        if (!mounted) return;
                        if (error) {
                            throw error;
                        }
                        handleSuccess();
                    } else {
                        ev.complete('fail');
                        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
                    }
                } catch (error: any) {
                    if (!mounted) return;
                    ev.complete('fail');
                    toast({ variant: "destructive", title: "Payment Error", description: error.message });
                    onProcessingChange(false);
                }
            });
        }
        return () => {
            mounted = false;
            if (paymentRequest) {
                paymentRequest.off('paymentmethod');
            }
        };
    }, [paymentRequest, stripe, allTermsAccepted, quoteData, quote, user, onProcessingChange, toast]);

    if (paymentRequest) {
        return (
            <>
                <div className="relative my-4 flex items-center">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-xs text-gray-400">OR</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>
          		<PaymentRequestButtonElement options={{ paymentRequest, style: { paymentRequestButton: { height: '56px', theme: 'dark' } } }} className="w-full" />
          </>
        );
    }

    return null;
};


const PaddleCheckoutButton = ({ quoteData, user, discountedTotal, disabled }) => {
  const { paddle, loading: isPaddleLoading } = usePaddle();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaddlePayment = async () => {
    if (!paddle) {
      toast({ variant: "destructive", title: "Payment Error", description: "Paddle is not available." });
      return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteData: { ...quoteData, total: discountedTotal },
          user: user,
        }),
      });
      const data = await response.json();
      if (data.priceId) {
        paddle.Checkout.open({ items: [{ priceId: data.priceId, quantity: 1 }] });
      } else {
        throw new Error(data.error || "Could not initiate Paddle payment.");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Payment Error", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isPaddleLoading || isProcessing;

  return (
    <Button 
        onClick={handlePaddlePayment} 
        className="h-14 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
        disabled={disabled || isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
      {isLoading ? 'Processing...' : `Pay £${discountedTotal.toFixed(2)}`}
    </Button>
  );
};


function QuoteCheckoutPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const settings = useSettings();
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [quote, setQuote] = useState<any>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentView, setPaymentView] = useState<"selection" | "card-details" | "bank-details">("selection");
  const [checkboxContent, setCheckboxContent] = useState<string[]>([]);
  const [checkboxStates, setCheckboxStates] = useState<boolean[]>([]);


  const paymentProvider = settings?.paymentProvider?.activeProcessor;
  const bankPaymentEnabled = settings?.bank?.show;
  const squareAppId = settings?.square?.appId;
  const squareLocationId = settings?.square?.appLocationId;

  const airwallexCardRef = useRef(null);
  const stripePaymentRef = useRef<{ handlePayment: () => Promise<void> }>(null);
  const [airwallexElement, setAirwallexElement] = useState<any>(null);

  const paymentMethods = [];
  if (paymentProvider) {
    paymentMethods.push({
      id: paymentProvider,
      title: `Credit or Debit Card`,
      description: 'Visa, Mastercard, Amex accepted',
      icon: <CreditCard className="h-5 w-5 text-cyan-400" />,
      type: 'card'
    });
  }
  if (paymentProvider === 'stripe') { // Special case for Stripe to show Apple Pay
    paymentMethods.push({
      id: 'stripe_apple_pay',
      title: 'Apple Pay',
      description: 'Pay instantly with saved cards',
      icon: <svg className="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>,
      type: 'apple'
    });
  }
  if (bankPaymentEnabled) {
    paymentMethods.push({
      id: 'bank',
      title: 'Bank Transfer',
      description: 'Secure direct payment from your bank',
      icon: <Building2 className="h-5 w-5 text-cyan-400" />,
      type: 'bank'
    });
  }



  useEffect(() => {
    if (authLoading) {
      return; // Wait for authentication to be determined
    }

    if (!isAuthenticated) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to access this page.' });
      router.push('/');
      return;
    }

    const storedQuoteData = localStorage.getItem('quoteData');
    if (storedQuoteData) {
      const parsed = JSON.parse(storedQuoteData);
      const data = typeof parsed.quoteData === 'string' ? JSON.parse(parsed.quoteData) : parsed.quoteData;
      setQuoteData(data);
      setQuote(parsed);
    } else {
      router.push('/get-quote');
    }
    if (settings?.general) {
      let content = settings.general.checkoutCheckboxContent ? settings.general.checkoutCheckboxContent.split('||') : [];
      if (content.length === 0 || (content.length === 1 && content[0].trim() === '')) {
        content = [
          'I confirm I\'ve read and agree to the <a href="/terms-of-services" target="_blank" class="font-medium text-cyan-400 hover:underline">Terms of Service</a> and understand this is a non-refundable digital document service. *',
          'I acknowledge that all purchases are final and the information I have entered is accurate *'
        ];
      }
      setCheckboxContent(content);
      setCheckboxStates(Array(content.length).fill(false));
    }
  }, [isAuthenticated, authLoading, router, settings, toast]);

  useEffect(() => {
    if (selectedPaymentMethod === 'airwallex' && isAuthenticated && quoteData) {
      const initAirwallex = async () => {
        try {
          const Airwallex = (await import('airwallex-payment-elements')).default;
          await Airwallex.loadAirwallex({ env: 'demo' });
          const response = await fetch('/api/quote-checkout/create-airwallex-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quoteData: { ...quoteData, total: quoteData?.total },
              user: user,
            }),
          });
          const { clientSecret, intentId } = await response.json();
          const cardElement = Airwallex.createElement('card', {
            intent: { id: intentId, client_secret: clientSecret },
          });
          cardElement.mount(airwallexCardRef.current!);
          setAirwallexElement(cardElement);
        } catch (error) {
          console.error('Airwallex initialization failed:', error);
          toast({ variant: 'destructive', title: 'Payment Error', description: 'Failed to initialize Airwallex.' });
        }
      };
      initAirwallex();
    }
  }, [selectedPaymentMethod, isAuthenticated, toast, quoteData, user]);

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const newStates = [...checkboxStates];
    newStates[index] = checked;
    setCheckboxStates(newStates);
  };

  const handleCompletePayment = async () => {
    if (!checkboxStates.every(c => c)) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please accept all the terms and conditions.' });
      return;
    }
    setIsProcessingPayment(true);

    switch (selectedPaymentMethod) {
      case 'mollie':
        try {
            const response = await fetch('/api/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteData: { ...quoteData, id: quote.id, policyNumber: quote.policyNumber, total: quoteData?.total },
                    user: user,
                }),
            });
            const data = await response.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error(data.error || 'Could not initiate payment.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
            setIsProcessingPayment(false);
        }
        break;

      case 'stripe':
        if (stripePaymentRef.current) {
          await stripePaymentRef.current.handlePayment();
        } else {
            toast({ variant: 'destructive', title: 'Payment Error', description: 'Stripe component not ready.' });
            setIsProcessingPayment(false);
        }
        break;

      case 'airwallex':
        if (!airwallexElement) {
          toast({ variant: 'destructive', title: 'Payment Error', description: 'Airwallex is not ready.' });
          setIsProcessingPayment(false);
          return;
        }
        try {
          const Airwallex = (await import('airwallex-payment-elements')).default;
          await Airwallex.confirmPaymentIntent({
            element: airwallexElement,
            id: airwallexElement.intent.id,
            client_secret: airwallexElement.intent.client_secret,
          });
          toast({ title: 'Payment Processing', description: 'Your payment is processing. You will receive an email confirmation shortly.' });
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
          setIsProcessingPayment(false);
        }
        break;

      case 'bank':
        try {
          const response = await fetch('/api/quote-checkout/update-payment-method', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              policyNumber: quote?.policyNumber,
              paymentMethod: 'bank_transfer',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update payment method');
          }

          localStorage.removeItem('quoteCreationTimestamp');
          router.push(`/bank-payment-details?policynumber=${quote?.policyNumber}`);
        } catch (error) {
          console.error('Error updating payment method:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'There was an error updating the payment method. Please try again.',
          });
        } finally {
          setIsProcessingPayment(false);
        }
        break;

      default:
        toast({ variant: 'destructive', title: 'Invalid Payment Method', description: 'Please select a valid payment method.' });
        setIsProcessingPayment(false);
    }
  };

  const handleSquarePayment = async (token: any) => {
    if (!token) return;
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/quote-checkout/create-square-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: token.token,
          quoteData: { ...quoteData, id: quote.id, total: quoteData?.total },
          user: user,
        }),
      });
      if (response.ok) {
        toast({ title: 'Payment Successful', description: 'Your payment has been processed.' });
        localStorage.removeItem('quoteCreationTimestamp');
        window.location.href = '/payment-confirmation';
      } else {
        const error = await response.json();
        throw new Error(error.details || 'Square payment failed.');
      }
    } catch (error: any)
		{
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const createPaymentRequest = () => ({
    countryCode: 'GB',
    currencyCode: settings?.general?.currency || 'GBP',
    total: {
      amount: (quoteData?.total ?? 0).toFixed(2),
      label: 'Total',
    },
  });

  const { ExpirationDialog } = useQuoteExpiration(quote, selectedPaymentMethod);

  if (!quoteData) {
    return <Loading />; 
  }
  const allTermsAccepted = checkboxStates.every(c => c);

  const handlePaymentView = (method) => {
    setSelectedPaymentMethod(method.id);
    if (method.id === 'stripe_apple_pay') {
      // Special handling for apple pay button which is inside the selection view
    } else if (method.type === 'card') {
      setPaymentView('card-details');
    } else {
      setPaymentView('bank-details');
    }
  }

  return (
    <div className="min-h-screen bg-black">
       <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 top-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute -right-48 top-2/3 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl animate-pulse delay-1000" />
      </div>
      <ExpirationDialog />
      <header className="relative border-b border-gray-800/50 bg-black/80 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-lg font-bold tracking-wide bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
            {settings?.general?.siteName || 'COVERISE'}
          </Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-6 py-6">
        <Button variant="ghost" size="sm" className="gap-2 text-gray-400 hover:text-white hover:bg-gray-800/50" onClick={() => {
                if (quoteData?.customerData?.registration) {
                  router.push(`/get-quote?reg=${quoteData.customerData.registration}&view=review`);
                } else {
                  router.push('/'); // Fallback to home if reg is not found
                }
              }} >
          <ArrowLeft className="h-4 w-4" />
          Back to Quote
        </Button>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-cyan-500/20 bg-gray-900/50 backdrop-blur-sm px-6 py-5 shadow-lg shadow-cyan-500/10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                <Lock className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Secure Checkout</h1>
                <p className="text-sm text-gray-400">Your payment information is protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="relative mx-auto max-w-7xl px-6 pb-12">
        <div className="mx-auto max-w-2xl">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-cyan-500/20 bg-gray-900/50 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
              <div className="h-1 bg-gradient-to-r from-cyan-500/80 to-teal-500/80" />

              <div className="border-b border-gray-800 bg-gray-900/80 px-6 py-4">
                <h2 className="text-sm font-semibold text-white">Docs Summary</h2>
              </div>
              <div className="divide-y divide-gray-800 p-6">
                <div className="flex items-center gap-4 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                    <FileText className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-400">Registration</div>
                    <div className="text-base font-semibold text-white">{quoteData.customerData.registration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                    <Car className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-400">Vehicle</div>
                    <div className="text-base font-semibold text-white">{quoteData.customerData.vehicle.make} {quoteData.customerData.vehicle.model}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                    <Clock className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-400">Duration</div>
                    <div className="text-base font-semibold text-white">{quoteData.breakdown.duration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                    <User className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-400">Name</div>
                    <div className="text-base font-semibold text-white">{quoteData.customerData.firstName} {quoteData.customerData.lastName}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-cyan-500/20 bg-gray-900/50 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
              <div className="h-1 bg-gradient-to-r from-cyan-500/80 to-teal-500/80" />

              <div className="p-6">
                <div className="mb-6 flex items-center gap-3 border-b border-gray-800 pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                    <CreditCard className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Payment Method</h2>
                </div>

                <div className="mb-6 rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 p-5 text-center">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Amount Due
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">£{(quoteData.total).toFixed(2)}</div>
                </div>

                {paymentView === "selection" && (
                  <>
                    <h3 className="mb-4 text-sm font-medium text-white">Select Payment Method</h3>

                    <div className="space-y-3">
                      {paymentMethods.filter(m => m.id !== 'stripe_apple_pay').map(method => (
                          <button
                            key={method.id}
                            onClick={() => handlePaymentView(method)}
                            className="w-full rounded-lg border border-gray-700/50 bg-gray-800/50 p-4 text-left transition-all hover:border-cyan-500/50 hover:bg-gray-800/80"
                          >
                            <div className="flex items-center gap-3">
                              {method.icon}
                              <div className="flex-1">
                                <div className="font-medium text-white">{method.title}</div>
                                <div className="text-sm text-gray-400">{method.description}</div>
                              </div>
                              <ArrowLeft className="h-5 w-5 rotate-180 text-gray-400" />
                            </div>
                          </button>
                      ))}
                      {paymentProvider === 'stripe' && (
                        <div className="mt-2">
                          <StripeApplePayButton
                              quoteData={quoteData}
                              user={user}
                              quote={quote}
                              onProcessingChange={setIsProcessingPayment}
                              allTermsAccepted={allTermsAccepted}
                              settings={settings}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(paymentView === "card-details" || paymentView === "bank-details") && (
                  <div className="space-y-6">
                    {paymentView === "card-details" && (
                      <div className="flex items-center gap-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 p-4">
                        <CreditCard className="h-5 w-5 text-cyan-400" />
                        <div>
                          <div className="font-medium text-white">Credit or Debit Card</div>
                          <div className="text-sm text-gray-400">Enter your card details below</div>
                        </div>
                      </div>
                    )}
                    {paymentView === "bank-details" && (
                      <div className="flex items-center gap-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 p-4">
                        <Building2 className="h-5 w-5 text-cyan-400" />
                        <div>
                          <div className="font-medium text-white">Bank Transfer</div>
                          <div className="text-sm text-gray-400">Direct payment from your bank</div>
                        </div>
                      </div>
                    )}
                    
                    {paymentView === "card-details" && (
                      <>
                        {selectedPaymentMethod === 'stripe' && (
                          <StripePayment
                            ref={stripePaymentRef}
                            quoteData={quoteData}
                            user={user}
                            quote={quote}
                            onProcessingChange={setIsProcessingPayment}
                          />
                        )}
                        {selectedPaymentMethod === 'airwallex' && (
                            <div id="airwallex-card-element" ref={airwallexCardRef} className="border border-gray-700 rounded-lg p-4 mb-6"></div>
                        )}
                        {selectedPaymentMethod === 'square' && squareAppId && squareLocationId && (settings?.square?.paymentMethods?.card || settings?.square?.paymentMethods?.googlePay || settings?.square?.paymentMethods?.applePay) && (
                            allTermsAccepted ? (
                                <PaymentForm
                                    applicationId={squareAppId}
                                    locationId={squareLocationId}
                                    cardTokenizeResponseReceived={handleSquarePayment}
                                    createPaymentRequest={createPaymentRequest}
                                >
                                    <div className="space-y-4 my-4">
                                    {settings?.square?.paymentMethods?.googlePay && <SquareGooglePay />}
                                    {settings?.square?.paymentMethods?.applePay && <SquareApplePay />}
                                    {settings?.square?.paymentMethods?.card && (
                                        <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                                            <SquareCreditCard />
                                        </div>
                                    )}
                                    </div>
                                </PaymentForm>
                            ) : (
                                <div className="rounded-lg border border-dashed border-yellow-500 bg-yellow-500/10 p-6 text-center">
                                    <p className="text-sm font-medium leading-relaxed text-yellow-300">
                                        Please accept all terms and conditions above to proceed with payment.
                                    </p>
                                </div>
                            )
                        )}
                        {(selectedPaymentMethod === 'mollie' || selectedPaymentMethod === 'paddle') && (
                            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 text-center">
                                <p className="text-sm leading-relaxed text-gray-400">
                                    You will be redirected to our payment processor's secure page to complete your payment.
                                </p>
                            </div>
                        )}
                      </>
                    )}
                    {paymentView === 'bank-details' && (
                       <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 text-center">
                        <p className="text-sm leading-relaxed text-gray-400">
                          Once you confirm your order, we'll provide complete bank transfer instructions including all
                          account details needed to complete your payment securely.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3 pt-2">
                        {checkboxContent.map((content, index) => (
                            <div className="flex items-start space-x-3" key={index}>
                                <Checkbox
                                  id={`checkout-checkbox-${index}`}
                                  checked={checkboxStates[index] || false}
                                  onCheckedChange={(c) => handleCheckboxChange(index, c as boolean)}
                                  className="mt-0.5 border-gray-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                />
                                <label
                                  htmlFor={`checkout-checkbox-${index}`}
                                  className="text-sm text-gray-400 richtext-label"
                                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                                />
                            </div>
                        ))}
                    </div>
                    
                    {selectedPaymentMethod === 'paddle' ? (
                        <PaddleCheckoutButton
                            quoteData={quoteData}
                            user={user}
                            discountedTotal={quoteData.total}
                            disabled={!allTermsAccepted}
                        />
                    ) : selectedPaymentMethod !== 'square' && (
                        <Button
                          onClick={handleCompletePayment}
                          className="h-14 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                          disabled={!allTermsAccepted || isProcessingPayment}
                        >
                          {isProcessingPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                          {isProcessingPayment ? 'Processing...' : `Pay £${(quoteData.total).toFixed(2)}`}
                        </Button>
                    )}

                    <Button variant="outline" onClick={() => setPaymentView("selection")} className="w-full gap-2 border-gray-700 bg-gray-800/50 text-white hover:bg-gray-800">
                      <ArrowLeft className="h-4 w-4" />
                      Return to Payment Methods
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Shield className="h-4 w-4 text-cyan-400" />
                      <span>Secure & Encrypted</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-gray-900/50 backdrop-blur-sm p-6 shadow-lg shadow-cyan-500/10">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                  <Shield className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Technical Support & Refunds</h3>
                  <p className="text-sm leading-relaxed text-gray-400">
                    If you experience any technical issues during your payment or delivery, please contact our support
                    team immediately. Refunds are available if any issues occur during the delivery process that prevent
                    you from using the service as intended.
                  </p>
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-1 text-sm font-medium text-cyan-400 hover:underline"
                  >
                    Contact Support
                    <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {isProcessingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center" style={{ zIndex: 999 }}>
            <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
            <p className="mt-4 text-lg font-semibold text-gray-200">Processing...</p>
            <p className="text-sm text-gray-400">Please do not close this window.</p>
        </div>
      )}
    </div>
  );
}

const DynamicQuoteCheckoutPage = dynamic(() => Promise.resolve(QuoteCheckoutPage), { ssr: false });

export default function QuoteCheckoutPageWrapper() {
  const settings = useSettings();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  const paymentProvider = settings?.paymentProvider?.activeProcessor;

  useEffect(() => {
    if (paymentProvider === 'stripe' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY));
    }
  }, [paymentProvider, settings]);

  if (!settings) {
    return <Loading />; 
  }

  const page = <DynamicQuoteCheckoutPage />;

  if (paymentProvider === 'stripe' && stripePromise) {
    return <Elements stripe={stripePromise}>{page}</Elements>;
  }

  return page;
}
