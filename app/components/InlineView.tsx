"use client";

import React, { useState } from "react";
import { LineChange, WordChange } from "../utils/diffUtils";

interface InlineViewProps {
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

export default function InlineView({
  changes,
  searchTerm,
  searchResults,
  currentSearchIndex,
  collapseUnchanged,
  searchRefs,
}: InlineViewProps) {
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

  const renderChange = (change: LineChange, idx: number) => {
    let bgColor = "bg-white";
    let icon = "";
    const isSearchMatch = searchResults?.includes(idx);
    const isCurrentMatch =
      isSearchMatch &&
      searchResults &&
      searchResults[currentSearchIndex || 0] === idx;

    if (change.type === "added") {
      bgColor = "bg-green-100";
      icon = "+";
    } else if (change.type === "removed") {
      bgColor = "bg-red-100";
      icon = "-";
    } else if (change.type === "modified") {
      bgColor = "bg-yellow-50";
      icon = "~";
    }

    if (isCurrentMatch) {
      bgColor = "bg-yellow-200 ring-2 ring-yellow-400";
    } else if (isSearchMatch) {
      bgColor = "bg-yellow-50 ring-1 ring-yellow-300";
    }

    return (
      <div
        key={idx}
        ref={(el) => {
          if (el && searchRefs) {
            searchRefs.current.set(idx, el);
          }
        }}
        className={`${bgColor} border-b border-gray-200 p-2`}
      >
        <div className="flex">
          {icon && (
            <span className="text-gray-500 mr-2 font-bold select-none w-4 text-center flex-shrink-0">
              {icon}
            </span>
          )}
          <span className="text-gray-400 mr-3 select-none w-8 text-right flex-shrink-0">
            {change.lineNumber}
          </span>
          <span className="flex-1 whitespace-pre-wrap break-words">
            {change.type === "modified" && change.wordChanges ? (
              renderWordChanges(change.wordChanges, searchTerm)
            ) : change.type === "removed" ? (
              <span className="text-red-900">
                {highlightText(change.oldContent || "", searchTerm)}
              </span>
            ) : change.type === "added" ? (
              <span className="text-green-900">
                {highlightText(change.newContent || "", searchTerm)}
              </span>
            ) : (
              highlightText(
                change.oldContent || change.newContent || "",
                searchTerm
              )
            )}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="font-mono text-sm bg-white rounded-lg shadow-sm border border-gray-200">
      {groupedChanges.map((group, groupIdx) => {
        if (group.type === "collapsed") {
          const isExpanded = expandedSections.has(groupIdx);
          const lineCount = group.changes.length;
          const firstLine = group.changes[0].lineNumber;
          const lastLine = group.changes[lineCount - 1].lineNumber;

          return (
            <div key={`group-${groupIdx}`}>
              {!isExpanded ? (
                <div
                  className="bg-gray-100 border-b border-gray-300 p-2 flex items-center justify-between hover:bg-gray-200 cursor-pointer"
                  onClick={() => toggleSection(groupIdx)}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-600"
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
                      {lineCount} unchanged lines (lines {firstLine}-{lastLine})
                      - Click to expand
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="bg-gray-100 border-b border-gray-300 p-2 flex items-center justify-between hover:bg-gray-200 cursor-pointer"
                    onClick={() => toggleSection(groupIdx)}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      <span className="text-gray-600 text-xs">
                        Click to collapse {lineCount} unchanged lines
                      </span>
                    </div>
                  </div>
                  {group.changes.map((change, idx) =>
                    renderChange(change, group.startIndex + idx)
                  )}
                </>
              )}
            </div>
          );
        } else {
          return renderChange(group.changes[0], group.startIndex);
        }
      })}
    </div>
  );
}
