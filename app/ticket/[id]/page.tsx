'use client'

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Paperclip,
  Send,
  Download,
  Eye,
  X,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  FileText,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useSettings } from "@/context/settings";
import { useToast } from "@/hooks/use-toast";

export default function TicketPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const settings = useSettings();
  const { toast } = useToast();

  useEffect(() => {
    if (!params.id) {
      setLoading(false);
      return;
    }

    const fetchTicket = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tickets/${params.id}`);
        if (!response.ok) {
          throw new Error('Ticket not found');
        }
        const data = await response.json();
        setTicket(data);
      } catch (error) {
        console.error("Failed to fetch ticket:", error);
        setTicket(null); // Ensure not-found UI is shown
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [params.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [ticket?.messages])

  const handleSubmitMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return

    setIsSubmitting(true)

    const formData = new FormData();
    formData.append('message', newMessage);
    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      const response = await fetch(`/api/tickets/${params.id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit message');
      }

      const newMsg = await response.json();

      setTicket((prevTicket: any) => ({
        ...prevTicket,
        messages: [...prevTicket.messages, newMsg],
        updatedAt: new Date().toISOString(),
      }));

      setNewMessage("")
      setAttachments([])
      setSubmitSuccess(true)

      setTimeout(() => {
        setSubmitSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error("Failed to submit message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not send your reply. Please try again.",
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments([...attachments, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    const statusColor = getStatusColor(status)
    return <Badge className={statusColor}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityColor = getPriorityColor(priority)
    return <Badge className={priorityColor}>{priority}</Badge>
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      case "in progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "closed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-4 text-lg text-gray-300">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          Loading Support Ticket...
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Header />

        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md shadow-2xl border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Support Ticket Not Found</h2>
              <p className="text-gray-400 mb-6">
                The support ticket you're looking for doesn't exist or the link may have expired.
              </p>
              <div className="space-y-3">
                <Link href="/contact">
                  <Button className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold">
                    Submit New Support Request
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent">
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000" />
      </div>

      {/* Breadcrumb */}
      <div className="relative bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center text-sm text-gray-400">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/contact" className="hover:text-cyan-400 transition-colors">
              Support
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white font-medium">Ticket {ticket.id}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-6xl mx-auto px-4 py-8 flex-1">
        <div className="grid gap-8">
          {/* Back Button */}
          <div>
            <Link href="/contact">
              <Button
                variant="outline"
                className="mb-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contact
              </Button>
            </Link>
          </div>

          {/* Ticket Header */}
          <Card className="shadow-2xl border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    Support Ticket #{ticket.id}
                  </CardTitle>
                  <CardDescription className="text-cyan-100 mt-2 text-lg">{ticket.subject}</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Customer Information</h4>
                  <div className="space-y-2 text-gray-300">
                    <p>
                      <span className="font-medium text-gray-100">Name:</span> {ticket.customer.name}
                    </p>
                    <p>
                      <span className="font-medium text-gray-100">Email:</span> {ticket.customer.email}
                    </p>
                    <p>
                      <span className="font-medium text-gray-100">Category:</span> {ticket.category}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Ticket Details</h4>
                  <div className="space-y-2 text-gray-300">
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      <span className="font-medium text-gray-100">Created:</span> {formatDate(ticket.createdAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      <span className="font-medium text-gray-100">Last Updated:</span> {formatDate(ticket.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="shadow-2xl border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
                Conversation History
              </CardTitle>
              <CardDescription className="text-gray-400">
                You can reply to this conversation and our {settings?.general?.siteName} support team will be notified immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6 mb-8">
                {ticket.messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "admin" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${
                        message.sender === "admin"
                          ? "bg-gradient-to-br from-cyan-600/20 to-teal-600/20 border border-cyan-500/30"
                          : "bg-gradient-to-br from-gray-800 to-gray-800/80 border border-gray-700"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              message.sender === "admin"
                                ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                                : "bg-gray-700 text-white"
                            }`}
                          >
                            {message.sender === "admin"
                              ? "CS"
                              : ticket.customer.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                          </div>
                          <span className="font-semibold text-sm text-white">
                            {message.sender === "admin" ? 'Coverise Support' : ticket.customer.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded-full">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-gray-200 leading-relaxed">{message.content}</p>

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Attachments:
                          </div>
                          {message.attachments.map((attachment: any) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700 shadow-sm"
                            >
                              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                <FileText className="h-4 w-4 text-cyan-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{attachment.name}</p>
                                <p className="text-xs text-gray-500">{attachment.size}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-cyan-500/20 text-cyan-400"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-cyan-500/20 text-cyan-400"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Success Message */}
              {submitSuccess && (
                <Alert className="mb-6 bg-green-500/20 border-green-500/30 shadow-lg">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300">
                    <strong>Message sent successfully!</strong> Our Coverise support team will respond soon.
                  </AlertDescription>
                </Alert>
              )}

              {/* Reply Form */}
              {ticket.status.toLowerCase() !== "closed" && (
                <div className="space-y-6 border-t border-gray-800 pt-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Send a Reply</h3>
                    <div>
                      <Label htmlFor="reply-message" className="text-sm font-medium text-gray-300">
                        Your Message
                      </Label>
                      <Textarea
                        id="reply-message"
                        placeholder="Type your message here... Our support team will be notified immediately."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="mt-2 min-h-[120px] bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:ring-cyan-500 focus:border-cyan-500"
                        rows={5}
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Attachments (optional)</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Add Files
                      </Button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                      <span className="text-sm text-gray-500">Maximum 10MB per file</span>
                    </div>

                    {/* Attachment Preview */}
                    {attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700"
                          >
                            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                              <FileText className="h-4 w-4 text-cyan-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitMessage}
                      disabled={(!newMessage.trim() && attachments.length === 0) || isSubmitting}
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 px-8 py-2 text-white font-medium shadow-lg"
                      size="lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Sending Reply..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              )}

              {ticket.status.toLowerCase() === "closed" && (
                <Alert className="border-amber-500/30 bg-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-amber-300">
                    <strong>This support ticket has been closed.</strong> If you need further assistance, please{" "}
                    <Link href="/contact" className="underline font-medium hover:text-amber-200">
                      submit a new support request
                    </Link>
                    .
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}