import type React from "react"
import { Card } from "@/components/ui/card"

interface DiffViewerProps {
  diffResult: any
  viewMode: "unified" | "split"
}

const DiffViewer: React.FC<DiffViewerProps> = ({ diffResult, viewMode }) => {
  if (!diffResult) return null

  return (
    <Card className="overflow-hidden">
      <div className="bg-muted p-4 border-b">
        <h2 className="text-xl font-semibold">Diff Results</h2>
      </div>

      <div className="p-4 overflow-x-auto">
        {viewMode === "unified" ? (
          <UnifiedDiffView diffResult={diffResult} />
        ) : (
          <SplitDiffView diffResult={diffResult} />
        )}
      </div>
    </Card>
  )
}

const renderLineContent = (line: any) => {
  if (!line.segments) {
    // If no segments, just return the content as is
    return <span>{line.content}</span>
  }

  // Render with highlighted segments
  return line.segments.map((segment: any, index: number) => {
    if (segment.highlight) {
      return (
        <span
          key={index}
          className={
            line.type === "added"
              ? "bg-green-200 dark:bg-green-800/50"
              : line.type === "deleted"
                ? "bg-red-200 dark:bg-red-800/50"
                : ""
          }
        >
          {segment.text}
        </span>
      )
    }
    return <span key={index}>{segment.text}</span>
  })
}

const UnifiedDiffView: React.FC<{ diffResult: any }> = ({ diffResult }) => {
  return (
    <div id="diff-content" className="font-mono text-sm">
      <table className="w-full border-collapse">
        <tbody>
          {diffResult.unified.map((line: any, index: number) => {
            let lineClass = ""
            let marker = " "

            if (line.type === "added") {
              lineClass = "diff-added"
              marker = "+"
            } else if (line.type === "deleted") {
              lineClass = "diff-deleted"
              marker = "-"
            }

            return (
              <tr key={index} className={lineClass}>
                <td className="line-number pr-4 text-right select-none text-muted-foreground w-12">
                  {line.lineNumber}
                </td>
                <td className="w-6 select-none">
                  <span
                    className={
                      line.type === "added"
                        ? "diff-marker-added text-green-600"
                        : line.type === "deleted"
                          ? "diff-marker-deleted text-red-600"
                          : ""
                    }
                  >
                    {marker}
                  </span>
                </td>
                <td className="diff-line whitespace-pre-wrap break-words">{renderLineContent(line)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const SplitDiffView: React.FC<{ diffResult: any }> = ({ diffResult }) => {
  return (
    <div id="diff-content" className="font-mono text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Original</h3>
          <table className="w-full border-collapse">
            <tbody>
              {diffResult.split.left.map((line: any, index: number) => {
                const lineClass = line.type === "deleted" ? "diff-deleted" : ""

                return (
                  <tr key={index} className={lineClass}>
                    <td className="line-number pr-4 text-right select-none text-muted-foreground w-12">
                      {line.lineNumber}
                    </td>
                    <td className="w-6 select-none">
                      {line.type === "deleted" && <span className="diff-marker-deleted text-red-600">-</span>}
                    </td>
                    <td className="diff-line whitespace-pre-wrap break-words">{renderLineContent(line)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Modified</h3>
          <table className="w-full border-collapse">
            <tbody>
              {diffResult.split.right.map((line: any, index: number) => {
                const lineClass = line.type === "added" ? "diff-added" : ""

                return (
                  <tr key={index} className={lineClass}>
                    <td className="line-number pr-4 text-right select-none text-muted-foreground w-12">
                      {line.lineNumber}
                    </td>
                    <td className="w-6 select-none">
                      {line.type === "added" && <span className="diff-marker-added text-green-600">+</span>}
                    </td>
                    <td className="diff-line whitespace-pre-wrap break-words">{renderLineContent(line)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DiffViewer

