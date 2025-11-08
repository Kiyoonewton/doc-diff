"use client";

import React, { useState } from "react";
import { LineChange, WordChange } from "../utils/diffUtils";

interface SideBySideViewProps {
  changes: LineChange[];
  searchTerm?: string;
  searchResults?: number[];
  currentSearchIndex?: number;
  collapseUnchanged?: boolean;
  searchRefs?: React.MutableRefObject<Map<number, HTMLDivElement>>;
}

function renderWordChanges(wordChanges: WordChange[], searchTerm?: string) {
  return wordChanges.map((change, idx) => {
    if (change.added) {
      return (
        <span key={idx} className="bg-green-200 text-green-900">
          {highlightText(change.value, searchTerm)}
        </span>
      );
    } else if (change.removed) {
      return (
        <span key={idx} className="bg-red-200 text-red-900 line-through">
          {highlightText(change.value, searchTerm)}
        </span>
      );
    }
    return <span key={idx}>{highlightText(change.value, searchTerm)}</span>;
  });
}

function highlightText(text: string, searchTerm?: string) {
  if (!searchTerm || !text) return text;

  const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <mark key={i} className="bg-yellow-300 font-semibold">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function SideBySideView({
  changes,
  searchTerm,
  searchResults,
  currentSearchIndex,
  collapseUnchanged,
  searchRefs,
}: SideBySideViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  // Group consecutive unchanged lines
  const groupedChanges: Array<{
    type: "change" | "collapsed";
    changes: LineChange[];
    startIndex: number;
  }> = [];
  let unchangedBuffer: LineChange[] = [];
  let bufferStartIndex = 0;

  changes.forEach((change, idx) => {
    if (change.type === "unchanged" && collapseUnchanged) {
      if (unchangedBuffer.length === 0) {
        bufferStartIndex = idx;
      }
      unchangedBuffer.push(change);
    } else {
      if (unchangedBuffer.length > 3) {
        groupedChanges.push({
          type: "collapsed",
          changes: unchangedBuffer,
          startIndex: bufferStartIndex,
        });
        unchangedBuffer = [];
      } else if (unchangedBuffer.length > 0) {
        unchangedBuffer.forEach((c, i) => {
          groupedChanges.push({
            type: "change",
            changes: [c],
            startIndex: bufferStartIndex + i,
          });
        });
        unchangedBuffer = [];
      }
      groupedChanges.push({
        type: "change",
        changes: [change],
        startIndex: idx,
      });
    }
  });

  // Handle remaining unchanged lines
  if (unchangedBuffer.length > 3) {
    groupedChanges.push({
      type: "collapsed",
      changes: unchangedBuffer,
      startIndex: bufferStartIndex,
    });
  } else if (unchangedBuffer.length > 0) {
    unchangedBuffer.forEach((c, i) => {
      groupedChanges.push({
        type: "change",
        changes: [c],
        startIndex: bufferStartIndex + i,
      });
    });
  }

  const renderRow = (change: LineChange, idx: number) => {
    const isSearchMatch = searchResults?.includes(idx);
    const isCurrentMatch =
      isSearchMatch &&
      searchResults &&
      searchResults[currentSearchIndex || 0] === idx;

    let oldBgColor = "bg-white";
    let newBgColor = "bg-white";

    if (change.type === "removed") {
      oldBgColor = "bg-red-100";
    } else if (change.type === "added") {
      newBgColor = "bg-green-100";
    } else if (change.type === "modified") {
      oldBgColor = "bg-yellow-50";
      newBgColor = "bg-yellow-50";
    }

    if (isCurrentMatch) {
      oldBgColor = "bg-yellow-200 ring-2 ring-yellow-400";
      newBgColor = "bg-yellow-200 ring-2 ring-yellow-400";
    } else if (isSearchMatch) {
      oldBgColor =
        oldBgColor === "bg-white"
          ? "bg-yellow-50 ring-1 ring-yellow-300"
          : oldBgColor;
      newBgColor =
        newBgColor === "bg-white"
          ? "bg-yellow-50 ring-1 ring-yellow-300"
          : newBgColor;
    }

    return (
      <React.Fragment key={idx}>
        {/* Left side (old) */}
        <div
          ref={(el) => {
            if (
              el &&
              searchRefs &&
              (change.type === "removed" ||
                change.type === "modified" ||
                change.type === "unchanged")
            ) {
              searchRefs.current.set(idx, el);
            }
          }}
          className={`p-2 border-b border-gray-200 min-h-[2rem] ${oldBgColor}`}
        >
          {(change.type === "removed" ||
            change.type === "modified" ||
            change.type === "unchanged") && (
            <div className="flex">
              <span className="text-gray-400 mr-3 select-none w-8 text-right flex-shrink-0">
                {change.lineNumber}
              </span>
              <span className="flex-1 whitespace-pre-wrap break-words">
                {change.type === "modified" && change.wordChanges
                  ? renderWordChanges(
                      change.wordChanges.filter((w) => !w.added),
                      searchTerm
                    )
                  : highlightText(change.oldContent || "", searchTerm)}
              </span>
            </div>
          )}
        </div>

        {/* Right side (new) */}
        <div
          className={`p-2 border-b border-gray-200 min-h-[2rem] ${newBgColor}`}
        >
          {(change.type === "added" ||
            change.type === "modified" ||
            change.type === "unchanged") && (
            <div className="flex">
              <span className="text-gray-400 mr-3 select-none w-8 text-right flex-shrink-0">
                {change.lineNumber}
              </span>
              <span className="flex-1 whitespace-pre-wrap break-words">
                {change.type === "modified" && change.wordChanges
                  ? renderWordChanges(
                      change.wordChanges.filter((w) => !w.removed),
                      searchTerm
                    )
                  : highlightText(
                      change.newContent || change.oldContent || "",
                      searchTerm
                    )}
              </span>
            </div>
          )}
        </div>
      </React.Fragment>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-0 font-mono text-sm">
      {/* Headers */}
      <div className="bg-red-50 border-b-2 border-red-300 p-3 font-bold text-red-900">
        Original (version1.txt)
      </div>
      <div className="bg-green-50 border-b-2 border-green-300 p-3 font-bold text-green-900">
        Modified (version2.txt)
      </div>

      {/* Content */}
      {groupedChanges.map((group, groupIdx) => {
        if (group.type === "collapsed") {
          const isExpanded = expandedSections.has(groupIdx);
          const lineCount = group.changes.length;
          const firstLine = group.changes[0].lineNumber;
          const lastLine = group.changes[lineCount - 1].lineNumber;

          return (
            <React.Fragment key={`group-${groupIdx}`}>
              <div
                className="col-span-2 bg-gray-100 border-b border-gray-300 p-2 flex items-center justify-between hover:bg-gray-200 cursor-pointer"
                onClick={() => toggleSection(groupIdx)}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span className="text-gray-600 text-xs">
                    {isExpanded
                      ? `Click to collapse ${lineCount} unchanged lines`
                      : `${lineCount} unchanged lines (lines ${firstLine}-${lastLine}) - Click to expand`}
                  </span>
                </div>
              </div>
              {isExpanded &&
                group.changes.map((change, idx) =>
                  renderRow(change, group.startIndex + idx)
                )}
            </React.Fragment>
          );
        } else {
          return renderRow(group.changes[0], group.startIndex);
        }
      })}
    </div>
  );
}
