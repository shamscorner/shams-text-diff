"use client"

import type React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TextInputAreaProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const TextInputArea: React.FC<TextInputAreaProps> = ({ label, value, onChange, placeholder }) => {
  // Handle paste to preserve formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Let the default paste happen, but we'll ensure formatting is preserved
    // The monospace font and whitespace-pre-wrap styling will handle most of the formatting
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          className="min-h-[300px] font-mono text-sm resize-y whitespace-pre-wrap"
          spellCheck={false}
          wrap="off"
          style={{ overflowX: "auto" }}
        />
      </CardContent>
    </Card>
  )
}

export default TextInputArea

