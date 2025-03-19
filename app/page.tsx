"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import {
  Download,
  Copy,
  Printer,
  RotateCcw,
  SplitSquareVertical,
  AlignJustify,
} from "lucide-react";
import TextInputArea from "@/components/text-input-area";
import DiffViewer from "@/components/diff-viewer";
import { calculateDiff } from "@/lib/diff-utils";

// Storage keys for localStorage
const STORAGE_KEYS = {
  ORIGINAL_TEXT: "shams-text-diff-original",
  MODIFIED_TEXT: "shams-text-diff-modified",
  VIEW_MODE: "shams-text-diff-view-mode",
  IGNORE_WHITESPACE: "shams-text-diff-ignore-whitespace",
  IGNORE_CASE: "shams-text-diff-ignore-case",
  DETECT_MOVED: "shams-text-diff-detect-moved",
};

export default function Home() {
  const [originalText, setOriginalText] = useState("");
  const [modifiedText, setModifiedText] = useState("");
  const [diffResult, setDiffResult] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [detectMoved, setDetectMoved] = useState(false);
  const diffViewerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const compareTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved data from localStorage on initial render
  useEffect(() => {
    // Use try-catch to handle potential localStorage errors
    try {
      // Load text inputs
      const savedOriginalText = localStorage.getItem(
        STORAGE_KEYS.ORIGINAL_TEXT
      );
      const savedModifiedText = localStorage.getItem(
        STORAGE_KEYS.MODIFIED_TEXT
      );

      // Load view preferences
      const savedViewMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as
        | "unified"
        | "split"
        | null;
      const savedIgnoreWhitespace = localStorage.getItem(
        STORAGE_KEYS.IGNORE_WHITESPACE
      );
      const savedIgnoreCase = localStorage.getItem(STORAGE_KEYS.IGNORE_CASE);
      const savedDetectMoved = localStorage.getItem(STORAGE_KEYS.DETECT_MOVED);

      // Apply saved values if they exist
      if (savedOriginalText) setOriginalText(savedOriginalText);
      if (savedModifiedText) setModifiedText(savedModifiedText);
      if (savedViewMode) setViewMode(savedViewMode);
      if (savedIgnoreWhitespace)
        setIgnoreWhitespace(savedIgnoreWhitespace === "true");
      if (savedIgnoreCase) setIgnoreCase(savedIgnoreCase === "true");
      if (savedDetectMoved) setDetectMoved(savedDetectMoved === "true");
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }, []);

  // Save text inputs to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORIGINAL_TEXT, originalText);
      localStorage.setItem(STORAGE_KEYS.MODIFIED_TEXT, modifiedText);
    } catch (error) {
      console.error("Error saving text inputs:", error);
    }
  }, [originalText, modifiedText]);

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
      localStorage.setItem(
        STORAGE_KEYS.IGNORE_WHITESPACE,
        String(ignoreWhitespace)
      );
      localStorage.setItem(STORAGE_KEYS.IGNORE_CASE, String(ignoreCase));
      localStorage.setItem(STORAGE_KEYS.DETECT_MOVED, String(detectMoved));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }, [viewMode, ignoreWhitespace, ignoreCase, detectMoved]);

  // Memoize the comparison function to avoid recreating it on every render
  const performComparison = useCallback(() => {
    if (!originalText.trim() && !modifiedText.trim()) {
      return;
    }

    // Clear any existing timeout
    if (compareTimeoutRef.current) {
      clearTimeout(compareTimeoutRef.current);
    }

    // Use setTimeout to debounce and allow UI to update before heavy computation
    compareTimeoutRef.current = setTimeout(() => {
      try {
        const result = calculateDiff(originalText, modifiedText, {
          ignoreWhitespace,
          ignoreCase,
          detectMoved,
        });
        setDiffResult(result);

        // Only scroll to results if this is the first comparison
        if (!diffResult && diffViewerRef.current) {
          diffViewerRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } catch (error) {
        toast({
          title: "Comparison error",
          description:
            "An error occurred while comparing the texts. Please try again.",
          variant: "destructive",
        });
        console.error("Diff calculation error:", error);
      } finally {
        compareTimeoutRef.current = null;
      }
    }, 300); // 300ms debounce
  }, [
    originalText,
    modifiedText,
    ignoreWhitespace,
    ignoreCase,
    detectMoved,
    toast,
    diffResult,
  ]);

  // Effect to trigger comparison when options change
  useEffect(() => {
    // Only perform comparison if we have text to compare
    if (originalText.trim() || modifiedText.trim()) {
      performComparison();
    }

    // Cleanup timeout on unmount
    return () => {
      if (compareTimeoutRef.current) {
        clearTimeout(compareTimeoutRef.current);
      }
    };
  }, [ignoreWhitespace, ignoreCase, detectMoved, viewMode, performComparison]);

  // Effect to trigger comparison when text changes (with debounce)
  useEffect(() => {
    // Only perform comparison if we have text to compare
    if (originalText.trim() || modifiedText.trim()) {
      // Clear any existing timeout
      if (compareTimeoutRef.current) {
        clearTimeout(compareTimeoutRef.current);
      }

      // Set a longer debounce for text changes to avoid too frequent updates
      compareTimeoutRef.current = setTimeout(() => {
        performComparison();
        compareTimeoutRef.current = null;
      }, 800); // 800ms debounce for text changes
    }

    return () => {
      if (compareTimeoutRef.current) {
        clearTimeout(compareTimeoutRef.current);
      }
    };
  }, [originalText, modifiedText, performComparison]);

  const handleReset = () => {
    setOriginalText("");
    setModifiedText("");
    setDiffResult(null);

    // Clear localStorage when resetting
    try {
      localStorage.removeItem(STORAGE_KEYS.ORIGINAL_TEXT);
      localStorage.removeItem(STORAGE_KEYS.MODIFIED_TEXT);
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }

    toast({
      title: "Reset complete",
      description: "All text inputs have been cleared.",
    });
  };

  const handleExportHtml = () => {
    if (!diffResult) return;

    const htmlContent = document.getElementById("diff-content")?.innerHTML;
    if (!htmlContent) return;

    const blob = new Blob(
      [
        `
      <html>
        <head>
          <title>ShamsTextDiff - Exported Diff</title>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.5; }
            .diff-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .diff-line { white-space: pre-wrap; }
            .diff-added { background-color: #e6ffec; color: #24292f; }
            .diff-deleted { background-color: #ffebe9; color: #24292f; }
            .diff-marker-added { color: #1a7f37; }
            .diff-marker-deleted { color: #cf222e; }
            .line-number { color: #6e7781; text-align: right; padding-right: 10px; user-select: none; }
          </style>
        </head>
        <body>
          <div class="diff-container">
            <h1>Text Difference Comparison</h1>
            <div>${htmlContent}</div>
          </div>
        </body>
      </html>
    `,
      ],
      { type: "text/html" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "text-diff-export.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Diff results exported as HTML.",
    });
  };

  const handleCopyToClipboard = () => {
    if (!diffResult) return;

    const diffText = document.getElementById("diff-content")?.textContent;
    if (!diffText) return;

    navigator.clipboard
      .writeText(diffText)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Diff results copied to clipboard.",
        });
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard. Please try again.",
          variant: "destructive",
        });
      });
  };

  const handlePrint = () => {
    if (!diffResult) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Print failed",
        description:
          "Unable to open print window. Please check your popup settings.",
        variant: "destructive",
      });
      return;
    }

    const htmlContent = document.getElementById("diff-content")?.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>ShamsTextDiff - Print</title>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.5; }
            .diff-container { max-width: 100%; padding: 20px; }
            .diff-line { white-space: pre-wrap; }
            .diff-added { background-color: #e6ffec !important; -webkit-print-color-adjust: exact; }
            .diff-deleted { background-color: #ffebe9 !important; -webkit-print-color-adjust: exact; }
            .diff-marker-added { color: #1a7f37; }
            .diff-marker-deleted { color: #cf222e; }
            .line-number { color: #6e7781; text-align: right; padding-right: 10px; }
            @media print {
              .diff-added { background-color: #e6ffec !important; -webkit-print-color-adjust: exact; }
              .diff-deleted { background-color: #ffebe9 !important; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="diff-container">
            <h1>Text Difference Comparison</h1>
            <div>${htmlContent || "No diff content available"}</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-center mb-8">ShamsTextDiff</h1>
      <p className="text-center text-muted-foreground mb-8">
        Compare two text inputs and visualize the differences in a GitHub-like
        interface.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <TextInputArea
          label="Original Text"
          value={originalText}
          onChange={setOriginalText}
          placeholder="Paste your original text here..."
        />
        <TextInputArea
          label="Modified Text"
          value={modifiedText}
          onChange={setModifiedText}
          placeholder="Paste your modified text here..."
        />
      </div>

      {diffResult && (
        <div ref={diffViewerRef}>
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportHtml}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Export as HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2"
              >
                <Copy size={16} />
                Copy to Clipboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer size={16} />
                Print
              </Button>
            </div>
          </Card>

          <Card className="p-4 mb-8">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-5">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-medium whitespace-nowrap">View:</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "unified" ? "default" : "outline"}
                    size="xs"
                    onClick={() => setViewMode("unified")}
                    className="h-7 px-2 text-xs flex items-center gap-1"
                  >
                    <AlignJustify size={14} />
                    Unified
                  </Button>
                  <Button
                    variant={viewMode === "split" ? "default" : "outline"}
                    size="xs"
                    onClick={() => setViewMode("split")}
                    className="h-7 px-2 text-xs flex items-center gap-1"
                  >
                    <SplitSquareVertical size={14} />
                    Split
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <h3 className="text-sm font-medium whitespace-nowrap">
                  Ignore:
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      id="ignore-whitespace"
                      checked={ignoreWhitespace}
                      onCheckedChange={setIgnoreWhitespace}
                      className="scale-75"
                    />
                    <Label htmlFor="ignore-whitespace" className="text-xs">
                      Whitespace
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      id="ignore-case"
                      checked={ignoreCase}
                      onCheckedChange={setIgnoreCase}
                      className="scale-75"
                    />
                    <Label htmlFor="ignore-case" className="text-xs">
                      Case
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Switch
                  id="detect-moved"
                  checked={detectMoved}
                  onCheckedChange={setDetectMoved}
                  className="scale-75"
                />
                <Label htmlFor="detect-moved" className="text-xs">
                  Detect moved blocks
                </Label>
              </div>

              <div className="ml-auto">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex items-center gap-1 h-7 px-2 text-xs"
                  size="xs"
                >
                  <RotateCcw size={14} />
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          <DiffViewer diffResult={diffResult} viewMode={viewMode} />
        </div>
      )}

      <Toaster />
    </main>
  );
}
