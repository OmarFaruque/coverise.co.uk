"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

const availableVariables = [
  "docNumber",
  "registrationMark",
  "descriptionOfVehicles",
  "make",
  "model",
  "name",
  "dob",
  "license",
  "effectiveDate",
  "expiryDate",
  "address",
  "premium",
  "excess",
]

export function CertificateTemplateTab({ settings, updateSetting }) {
  const handleContentChange = (page: "page1" | "page2" | "page1_footer", value: string) => {
    updateSetting("certificateTemplate", page, value)
  }

  const insertVariable = (page: "page1" | "page2" | "page1_footer", variable: string) => {
    const textarea = document.getElementById(`certificate-${page}-content`) as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentContent = settings.certificateTemplate[page]
    const newContent = currentContent.substring(0, start) + `{{${variable}}}` + currentContent.substring(end)

    handleContentChange(page, newContent)

    // Focus and set cursor position after state update
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + variable.length + 4
      textarea.selectionStart = newCursorPos
      textarea.selectionEnd = newCursorPos
    }, 0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Certificate Template
        </CardTitle>
        <CardDescription>
          Edit the HTML content for the downloadable PDF certificate. Use HTML tags like &lt;b&gt; for bold and
          &lt;div&gt; for structure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Available Variables</Label>
          <div className="flex flex-wrap gap-2 mt-2 rounded-md border p-3 bg-gray-50">
            {availableVariables.map((variable) => (
              <Badge key={variable} variant="secondary" className="font-mono">
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click a variable below to insert it into the active editor.
          </p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="certificate-page1-content" className="text-lg font-semibold">
            Page 1 Content (HTML)
          </Label>
          <Textarea
            id="certificate-page1-content"
            value={settings.certificateTemplate.page1}
            onChange={(e) => handleContentChange("page1", e.target.value)}
            placeholder="Enter HTML for page 1..."
            rows={15}
            className="font-mono text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {availableVariables.map((variable) => (
              <Badge key={variable} variant="outline" className="cursor-pointer" onClick={() => insertVariable("page1", variable)}>
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="certificate-page2-content" className="text-lg font-semibold">
            Page 2 Content (HTML)
          </Label>
          <Textarea
            id="certificate-page2-content"
            value={settings.certificateTemplate.page2}
            onChange={(e) => handleContentChange("page2", e.target.value)}
            placeholder="Enter HTML for page 2..."
            rows={15}
            className="font-mono text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {availableVariables.map((variable) => (
              <Badge key={variable} variant="outline" className="cursor-pointer" onClick={() => insertVariable("page2", variable)}>
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="certificate-page1-footer-content" className="text-lg font-semibold">
            Page 1 Footer Content (HTML)
          </Label>
          <Textarea
            id="certificate-page1-footer-content"
            value={settings.certificateTemplate.page1_footer}
            onChange={(e) => handleContentChange("page1_footer", e.target.value)}
            placeholder="Enter HTML for page 1 footer..."
            rows={15}
            className="font-mono text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {availableVariables.map((variable) => (
              <Badge key={variable} variant="outline" className="cursor-pointer" onClick={() => insertVariable("page1_footer", variable)}>
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}