import { diffLines, diffWordsWithSpace } from "diff"

interface DiffOptions {
  ignoreWhitespace?: boolean
  ignoreCase?: boolean
  detectMoved?: boolean
}

export function calculateDiff(originalText: string, modifiedText: string, options: DiffOptions = {}) {
  const { ignoreWhitespace, ignoreCase, detectMoved } = options

  // Prepare texts based on options
  let oldText = originalText
  let newText = modifiedText

  if (ignoreCase) {
    oldText = oldText.toLowerCase()
    newText = newText.toLowerCase()
  }

  // Only replace consecutive whitespace with a single space if ignoreWhitespace is true
  // This preserves indentation and formatting when not ignoring whitespace
  if (ignoreWhitespace) {
    oldText = oldText.replace(/\s+/g, " ").trim()
    newText = newText.replace(/\s+/g, " ").trim()
  }

  // Perform line-by-line diff with options that preserve formatting
  const lineDiff = diffLines(oldText, newText, {
    ignoreWhitespace: ignoreWhitespace,
    ignoreCase: ignoreCase,
    newlineIsToken: true, // Treat newlines as separate tokens to better preserve formatting
  })

  // Process for unified view
  const unifiedView = processUnifiedView(lineDiff, originalText, modifiedText, options)

  // Process for split view
  const splitView = processSplitView(lineDiff, originalText, modifiedText, options)

  // If detect moved blocks is enabled, try to identify moved content
  if (detectMoved) {
    detectMovedBlocks(unifiedView.unified)
    detectMovedBlocks(splitView.left)
    detectMovedBlocks(splitView.right)
  }

  return {
    unified: unifiedView.unified,
    split: {
      left: splitView.left,
      right: splitView.right,
    },
  }
}

function processUnifiedView(lineDiff: any[], originalText: string, modifiedText: string, options: DiffOptions) {
  let lineNumber = 1
  const unified: any[] = []

  lineDiff.forEach((part) => {
    const lines = part.value.split("\n")
    // Remove the last empty line that comes from splitting
    if (lines[lines.length - 1] === "") {
      lines.pop()
    }

    lines.forEach((line) => {
      // Handle empty lines properly
      const lineObj: any = {
        type: part.added ? "added" : part.removed ? "deleted" : "unchanged",
        content: line, // Keep the original content with formatting
        lineNumber: part.added || part.removed ? "-" : lineNumber++,
      }

      unified.push(lineObj)
    })
  })

  // Add character-level highlighting for adjacent added/deleted lines
  addCharacterLevelHighlighting(unified, options)

  return { unified }
}

function processSplitView(lineDiff: any[], originalText: string, modifiedText: string, options: DiffOptions) {
  let leftLineNumber = 1
  let rightLineNumber = 1
  const left: any[] = []
  const right: any[] = []

  lineDiff.forEach((part) => {
    const lines = part.value.split("\n")
    // Remove the last empty line that comes from splitting
    if (lines[lines.length - 1] === "") {
      lines.pop()
    }

    lines.forEach((line) => {
      if (part.added) {
        right.push({
          type: "added",
          content: line, // Keep the original content with formatting
          lineNumber: rightLineNumber++,
        })
      } else if (part.removed) {
        left.push({
          type: "deleted",
          content: line, // Keep the original content with formatting
          lineNumber: leftLineNumber++,
        })
      } else {
        left.push({
          type: "unchanged",
          content: line, // Keep the original content with formatting
          lineNumber: leftLineNumber++,
        })
        right.push({
          type: "unchanged",
          content: line, // Keep the original content with formatting
          lineNumber: rightLineNumber++,
        })
      }
    })
  })

  // Add character-level highlighting
  addCharacterLevelHighlighting(left, options)
  addCharacterLevelHighlighting(right, options)

  return { left, right }
}

function addCharacterLevelHighlighting(lines: any[], options: DiffOptions) {
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i]
    const nextLine = lines[i + 1]

    // Only process adjacent deleted/added lines
    if (
      (currentLine.type === "deleted" && nextLine.type === "added") ||
      (currentLine.type === "added" && nextLine.type === "deleted")
    ) {
      const deletedLine = currentLine.type === "deleted" ? currentLine : nextLine
      const addedLine = currentLine.type === "added" ? currentLine : nextLine

      // Perform character-level diff that preserves whitespace
      const charDiff = diffWordsWithSpace(deletedLine.content, addedLine.content)

      // Create arrays to store the highlighted segments
      deletedLine.segments = []
      addedLine.segments = []

      // Process the diff to create segments with highlighting information
      let deletedPos = 0
      let addedPos = 0

      charDiff.forEach((part) => {
        if (part.removed) {
          // This part was removed
          deletedLine.segments.push({
            text: part.value,
            highlight: true,
            start: deletedPos,
            end: deletedPos + part.value.length,
          })
          deletedPos += part.value.length
        } else if (part.added) {
          // This part was added
          addedLine.segments.push({
            text: part.value,
            highlight: true,
            start: addedPos,
            end: addedPos + part.value.length,
          })
          addedPos += part.value.length
        } else {
          // This part is unchanged
          deletedLine.segments.push({
            text: part.value,
            highlight: false,
            start: deletedPos,
            end: deletedPos + part.value.length,
          })
          addedLine.segments.push({
            text: part.value,
            highlight: false,
            start: addedPos,
            end: addedPos + part.value.length,
          })
          deletedPos += part.value.length
          addedPos += part.value.length
        }
      })

      // Skip the next line since we've already processed it
      i++
    }
  }
}

function detectMovedBlocks(lines: any[]) {
  // This is a simplified implementation of moved block detection
  // A more sophisticated algorithm would be needed for production

  // Map of content to line indices
  const contentMap = new Map()

  // First pass: collect all deleted lines
  lines.forEach((line, index) => {
    if (line.type === "deleted") {
      const content = line.content.trim()
      if (!contentMap.has(content)) {
        contentMap.set(content, [])
      }
      contentMap.get(content).push(index)
    }
  })

  // Second pass: check if any added lines match deleted lines
  lines.forEach((line, index) => {
    if (line.type === "added") {
      const content = line.content.trim()
      if (contentMap.has(content) && contentMap.get(content).length > 0) {
        // This is a moved line
        const deletedIndex = contentMap.get(content).shift()
        line.type = "moved"
        line.movedFrom = deletedIndex

        // Also mark the original deleted line as moved
        if (lines[deletedIndex]) {
          lines[deletedIndex].type = "moved"
          lines[deletedIndex].movedTo = index
        }
      }
    }
  })
}

