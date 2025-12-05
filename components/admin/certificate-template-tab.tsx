"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

export function CertificateTemplateTab({ settings, updateSetting }: { settings: any; updateSetting: any }) {
  const template = settings.certificateTemplate || {}

  const handleTemplateChange = (part: string, value: string) => {
    updateSetting("certificateTemplate", part, value)
  }

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

  const insertVariable = (part: keyof typeof template, variable: string) => {
    const currentContent = template[part] || ""
    const textarea = document.getElementById(`cert-${part}`) as HTMLTextAreaElement

    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = currentContent.substring(0, start) + `{{${variable}}}` + currentContent.substring(end)
      handleTemplateChange(part, newContent)

      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = start + variable.length + 4
        textarea.selectionEnd = start + variable.length + 4
      }, 0)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Certificate Template
        </CardTitle>
        <CardDescription>
          Customize the content of the generated Certificate PDF. Use the available variables to dynamically
          insert policy data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="cert-page1">Page 1 Content (HTML)</Label>
          <Textarea
            id="cert-page1"
            value={template.page1 || ""}
            onChange={(e) => handleTemplateChange("page1", e.target.value)}
            rows={20}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor="cert-page1_footer">Page 1 Footer (HTML)</Label>
          <Textarea
            id="cert-page1_footer"
            value={template.page1_footer || ""}
            onChange={(e) => handleTemplateChange("page1_footer", e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor="cert-page2">Page 2 Content (HTML)</Label>
          <Textarea
            id="cert-page2"
            value={template.page2 || ""}
            onChange={(e) => handleTemplateChange("page2", e.target.value)}
            rows={20}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label>Available Variables</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {availableVariables.map((variable) => (
              <Badge
                key={variable}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => {
                  const activeElementId = document.activeElement?.id
                  if (activeElementId && activeElementId.startsWith("cert-")) {
                    const part = activeElementId.replace("cert-", "")
                    insertVariable(part as keyof typeof template, variable)
                  }
                }}
              >
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click inside a text area, then click a variable to insert it at your cursor&apos;s position.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
