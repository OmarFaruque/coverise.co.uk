"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, User, ArrowRight, ShieldCheck, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/context/settings"
import { useToast } from "@/hooks/use-toast";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onSuccess: () => void;
  disableRedirect?: boolean;
}

export function AuthDialog({
  isOpen,
  onClose,
  title,
  description,
  onSuccess,
  disableRedirect = false,
}: AuthDialogProps) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    agreeToTerms: false,
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const settings = useSettings()
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showVerification && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setCanResend(true);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showVerification, timeLeft]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.email) {
        // Replace showError with a more appropriate notification for the dialog
        console.error("Missing Information", "Please fill in all required fields.");
        setIsLoading(false);
        return;
      }

      if (!isLogin) {
        if (!formData.agreeToTerms) {
          // Replace showWarning with a more appropriate notification for the dialog
          console.warn("Terms Required", "Please agree to the Terms of Service and Privacy Policy.");
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
          }),
        });

        if (!response.ok) {
          // Replace showError with a more appropriate notification for the dialog
          console.error("Registration Failed", "An unknown error occurred.");
        } else {
          // Replace showInfo with a more appropriate notification for the dialog
          console.info("Verification Required", "Please check your email for a 6-digit verification code to complete your registration.");
          setUserEmail(formData.email);
          setShowVerification(true);
          setTimeLeft(300);
          setCanResend(false);
        }
      } else {
        if (!formData.email) {
          // Replace showError with a more appropriate notification for the dialog
          console.error("Missing Information", "Please fill in your email address.");
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/auth/request-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
          }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            toast({
              variant: "destructive",
              title: "Email Not Found",
              description: "This email is not registered. Please sign up or try a different email.",
            });
          } else {
            const errorData = await response.json().catch(() => ({}));
            toast({
              variant: "destructive",
              title: "Authentication Failed",
              description: errorData.error || "An unknown error occurred. Please try again.",
            });
          }
        } else {
          // Replace showInfo with a more appropriate notification for the dialog
          console.info("Verification Required", "Please check your email for a 6-digit verification code to sign in.");
          setUserEmail(formData.email);
          setShowVerification(true);
          setTimeLeft(300);
          setCanResend(false);
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      // Replace showError with a more appropriate notification for the dialog
      console.error("Error", "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerificationKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (/^\d{6}$/.test(pastedText)) {
      const newCode = pastedText.split('');
      setVerificationCode(newCode);
      const lastInput = document.getElementById('code-5');
      lastInput?.focus();
    }
  };



  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");

    if (code.length !== 6) {
      // Replace showWarning with a more appropriate notification for the dialog
      console.warn("Incomplete Code", "Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Replace showError with a more appropriate notification for the dialog
        console.error("Verification Failed", "An unknown error occurred.");
        setVerificationCode(["", "", "", "", "", ""]);
        document.getElementById("code-0")?.focus();
      } else {
        login({ user: data.user, token: data.token }, { redirect: !disableRedirect });
        // Replace showSuccess with a more appropriate notification for the dialog
        // console.log("Email Verified!", "Your account is now active. Proceeding...");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Verification submission error:", error);
      // Replace showError with a more appropriate notification for the dialog
      console.error("Error", "An error occurred during verification.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!userEmail) return;
    try {
      await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      setTimeLeft(300);
      setCanResend(false);
      setVerificationCode(["", "", "", "", "", ""]);
      // Replace showInfo with a more appropriate notification for the dialog
      console.info("Verification Code Resent", "A new verification code has been sent to your email.");
    } catch (error) {
      // Replace showError with a more appropriate notification for the dialog
      console.error("Error", "Failed to resend code. Please try again.");
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      agreeToTerms: false,
    });
    setShowVerification(false);
    setRememberMe(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md p-0">
        <div className="bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-black/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-cyan-500/20 overflow-hidden relative">
            {/* Decorative top border glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

            {/* Form Header */}
            <div className="relative bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800 px-6 py-8 text-white text-center overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">{isLogin ? "Welcome Back" : `Join ${settings?.general?.siteName || 'COVERISE'}`}</h2>
                <p className="text-cyan-50 text-sm">{isLogin ? "Sign in to your account" : "Create your account to get started"}</p>
              </div>
            </div>

            {/* Form Content */}
            {!showVerification ? (
            <div className="px-6 py-8 relative">
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">First Name</label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                        <Input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder="John"
                          className="pl-11 h-12 bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 text-white placeholder:text-gray-500 rounded-xl transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Last Name</label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                        <Input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder="Doe"
                          className="pl-11 h-12 bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 text-white placeholder:text-gray-500 rounded-xl transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your@email.com"
                      className="pl-11 h-12 bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 text-white placeholder:text-gray-500 rounded-xl transition-all"
                      required
                    />
                  </div>
                </div>

                {isLogin && (
                  <div className="relative overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-cyan-800/10" />
                    <div className="relative flex items-center space-x-3 bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                      <input
                        type="checkbox"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-5 w-5 text-cyan-600 border-2 border-gray-600 rounded focus:ring-cyan-500 bg-gray-700 cursor-pointer"
                      />
                      <label htmlFor="remember-me" className="text-sm font-medium text-gray-300 cursor-pointer flex-1">
                        Keep me signed in
                      </label>
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms-agreement"
                      checked={formData.agreeToTerms}
                      onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                      className="mt-1 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 flex-shrink-0"
                      required
                    />
                    <label htmlFor="terms-agreement" className="text-sm text-gray-400 leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms-of-services" className="text-cyan-400 hover:text-cyan-300 underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white h-13 font-bold shadow-lg shadow-cyan-900/30 hover:shadow-cyan-600/50 transition-all duration-300 flex items-center justify-center space-x-2 rounded-xl text-base"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? "Sign In" : "Create Account"}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button onClick={toggleMode} className="text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-cyan-500/50 underline-offset-2 transition-colors">
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="px-6 py-8 relative">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-600/30 relative">
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-2xl blur animate-pulse" />
                  <ShieldCheck className="w-10 h-10 text-white relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Verify Your Email</h3>
                <p className="text-gray-400 text-sm">We've sent a 6-digit verification code to:</p>
                <p className="font-semibold text-cyan-400 mt-2 break-all text-base">{userEmail}</p>
              </div>

              <form onSubmit={handleVerificationSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                    Enter Verification Code
                  </label>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {verificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleVerificationKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-12 h-14 text-center text-2xl font-bold bg-gray-800/50 backdrop-blur-sm border-2 border-gray-600/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/30 rounded-xl text-white transition-all shadow-lg focus:shadow-cyan-500/20"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-cyan-500/50 flex items-center justify-center space-x-2 mx-auto text-sm transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Resend Code</span>
                    </button>
                  ) : (
                    <p className="text-gray-500 text-sm flex items-center justify-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Resend available in {formatTime(timeLeft)}</span>
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white h-12 font-bold shadow-lg shadow-cyan-900/30 hover:shadow-cyan-600/50 transition-all duration-300 rounded-xl"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowVerification(false)}
                  className="text-gray-400 hover:text-gray-300 text-sm underline decoration-gray-500/50 transition-colors"
                >
                  Cancel and go back
                </button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}