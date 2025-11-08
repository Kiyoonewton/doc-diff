"use client";

import React, { useState, useEffect, useRef } from "react";
import SideBySideView from "./components/SideBySideView";
import InlineView from "./components/InlineView";
import { computeDiff, LineChange } from "./utils/diffUtils";

export default function Home() {
  const [viewMode, setViewMode] = useState<"side-by-side" | "inline">(
    "side-by-side"
  );
  const [changes, setChanges] = useState<LineChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [file1Name, setFile1Name] = useState("version1.txt");
  const [file2Name, setFile2Name] = useState("version2.txt");
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [collapseUnchanged, setCollapseUnchanged] = useState(false);
  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);
  const searchRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    async function loadFiles() {
      try {
        const [version1Response, version2Response] = await Promise.all([
          fetch("/version1.txt"),
          fetch("/version2.txt"),
        ]);

        const version1Text = await version1Response.text();
        const version2Text = await version2Response.text();

        const diff = computeDiff(version1Text, version2Text);
        setChanges(diff);

        setLoading(false);
      } catch (error) {
        console.error("Error loading files:", error);
        setLoading(false);
      }
    }

    loadFiles();
  }, []);

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file1Input = file1InputRef.current;
    const file2Input = file2InputRef.current;

    if (!file1Input?.files?.[0] || !file2Input?.files?.[0]) {
      alert("Please select both files");
      return;
    }

    setLoading(true);

    try {
      const file1Text = await file1Input.files[0].text();
      const file2Text = await file2Input.files[0].text();

      setFile1Name(file1Input.files[0].name);
      setFile2Name(file2Input.files[0].name);

      const diff = computeDiff(file1Text, file2Text);
      setChanges(diff);

      setShowUpload(false);
      setLoading(false);
    } catch (error) {
      console.error("Error reading files:", error);
      alert("Error reading files");
      setLoading(false);
    }
  };

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results: number[] = [];
    const term = searchTerm.toLowerCase();

    changes.forEach((change, index) => {
      const content = (change.oldContent || "") + (change.newContent || "");
      if (content.toLowerCase().includes(term)) {
        results.push(index);
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [searchTerm, changes]);

  // Navigate to search result
  useEffect(() => {
    if (
      searchResults.length > 0 &&
      searchResults[currentSearchIndex] !== undefined
    ) {
      const element = searchRefs.current.get(searchResults[currentSearchIndex]);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentSearchIndex, searchResults]);

  const nextSearchResult = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    }
  };

  const prevSearchResult = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex(
        (prev) => (prev - 1 + searchResults.length) % searchResults.length
      );
    }
  };

  // Export to HTML
  const exportToHTML = () => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diff Report: ${file1Name} vs ${file2Name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; background: #f9fafb; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #111827; margin-bottom: 20px; }
    .stats { display: flex; gap: 20px; margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 6px; }
    .stat { display: flex; align-items: center; gap: 8px; }
    .badge { padding: 4px 8px; border-radius: 4px; font-weight: 600; }
    .added { background: #d1fae5; color: #065f46; }
    .removed { background: #fee2e2; color: #991b1b; }
    .modified { background: #fef3c7; color: #92400e; }
    .unchanged { background: #f3f4f6; color: #374151; }
    .diff-line { padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: 'Courier New', monospace; font-size: 13px; }
    .diff-line.added-line { background: #d1fae5; }
    .diff-line.removed-line { background: #fee2e2; }
    .diff-line.modified-line { background: #fef9e7; }
    .line-number { color: #9ca3af; margin-right: 16px; user-select: none; }
    .highlight-added { background: #86efac; color: #065f46; }
    .highlight-removed { background: #fca5a5; color: #991b1b; text-decoration: line-through; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Diff Report</h1>
    <p><strong>Comparing:</strong> ${file1Name} vs ${file2Name}</p>
    <div class="stats">
      <div class="stat"><span class="badge added">${
        stats.added
      } Added</span></div>
      <div class="stat"><span class="badge removed">${
        stats.removed
      } Removed</span></div>
      <div class="stat"><span class="badge modified">${
        stats.modified
      } Modified</span></div>
      <div class="stat"><span class="badge unchanged">${
        stats.unchanged
      } Unchanged</span></div>
    </div>
    <div class="diff-content">
      ${changes
        .map((change) => {
          let className = "";
          let content = change.oldContent || change.newContent || "";

          if (change.type === "added") className = "added-line";
          else if (change.type === "removed") className = "removed-line";
          else if (change.type === "modified") className = "modified-line";

          if (change.type === "modified" && change.wordChanges) {
            content = change.wordChanges
              .map((w) => {
                if (w.added)
                  return `<span class="highlight-added">${w.value}</span>`;
                if (w.removed)
                  return `<span class="highlight-removed">${w.value}</span>`;
                return w.value;
              })
              .join("");
          }

          return `<div class="diff-line ${className}">
          <span class="line-number">${change.lineNumber}</span>${content}
        </div>`;
        })
        .join("")}
    </div>
    <footer style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
      Generated on ${new Date().toLocaleString()}
    </footer>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diff-report-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export to PDF (via print)
  const exportToPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
        <div className="text-center">
          <div className="spinner border-blue-600 w-12 h-12 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">
            Loading diff...
          </div>
          <div className="text-sm text-gray-500 mt-2">Analyzing changes</div>
        </div>
      </div>
    );
  }

  const stats = {
    added: changes.filter((c) => c.type === "added").length,
    removed: changes.filter((c) => c.type === "removed").length,
    modified: changes.filter((c) => c.type === "modified").length,
    unchanged: changes.filter((c) => c.type === "unchanged").length,
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Text Diff Viewer
            </h1>
            <p className="text-gray-600 text-sm sm:text-base flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Comparing{" "}
              <span className="font-semibold text-gray-800">{file1Name}</span>{" "}
              and{" "}
              <span className="font-semibold text-gray-800">{file2Name}</span>
            </p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="btn-primary px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-2">
              {showUpload ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Files
                </>
              )}
            </span>
          </button>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 mb-6 animate-slide-in no-print">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Your Files
              </h2>
            </div>
            <form onSubmit={handleFileUpload} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original File
                  </label>
                  <input
                    ref={file1InputRef}
                    type="file"
                    accept=".txt,.js,.jsx,.ts,.tsx,.json,.md,.css,.html,.xml,.yaml,.yml"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modified File
                  </label>
                  <input
                    ref={file2InputRef}
                    type="file"
                    accept=".txt,.js,.jsx,.ts,.tsx,.json,.md,.css,.html,.xml,.yaml,.yml"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Compare Files
                </span>
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 mb-6 card-hover">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <div className="stat-badge bg-green-50 text-green-700 border border-green-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-bold">{stats.added}</span>
              <span className="text-xs opacity-90">additions</span>
            </div>
            <div className="stat-badge bg-red-50 text-red-700 border border-red-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-bold">{stats.removed}</span>
              <span className="text-xs opacity-90">deletions</span>
            </div>
            <div className="stat-badge bg-yellow-50 text-yellow-700 border border-yellow-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span className="font-bold">{stats.modified}</span>
              <span className="text-xs opacity-90">modifications</span>
            </div>
            <div className="stat-badge bg-gray-50 text-gray-700 border border-gray-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-bold">{stats.unchanged}</span>
              <span className="text-xs opacity-90">unchanged</span>
            </div>
          </div>
        </div>

        {/* Toolbar: View Toggle, Search, Export, Collapse */}
        <div className="mb-6 space-y-4 no-print">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="inline-flex rounded-lg border-2 border-gray-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode("side-by-side")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  viewMode === "side-by-side"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 4H5a2 2 0 00-2 2v14a2 2 0 002 2h4m6-16h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"
                    />
                  </svg>
                  Side-by-Side
                </span>
              </button>
              <button
                onClick={() => setViewMode("inline")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  viewMode === "inline"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  Inline
                </span>
              </button>
            </div>

            {/* Collapse Toggle */}
            <button
              onClick={() => setCollapseUnchanged(!collapseUnchanged)}
              className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-semibold shadow-sm hover:shadow-md ${
                collapseUnchanged
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2">
                {collapseUnchanged ? (
                  <svg
                    className="w-4 h-4"
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
                ) : (
                  <svg
                    className="w-4 h-4"
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
                )}
                {collapseUnchanged ? "Show All Lines" : "Collapse Unchanged"}
              </span>
            </button>

            {/* Export Buttons */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={exportToHTML}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export HTML
                </span>
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print/PDF
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 items-center bg-white border-2 border-gray-200 rounded-xl p-3 shadow-sm focus-within:border-blue-400 focus-within:shadow-md transition-all duration-200">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in diff..."
              className="flex-1 outline-none text-sm font-medium text-gray-700 placeholder-gray-400"
            />
            {searchResults.length > 0 && (
              <div className="flex items-center gap-2 border-l-2 border-gray-200 pl-3">
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                <button
                  onClick={prevSearchResult}
                  className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  aria-label="Previous result"
                >
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={nextSearchResult}
                  className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  aria-label="Next result"
                >
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
            {searchTerm && searchResults.length === 0 && (
              <span className="text-sm text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-md">
                No results
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-sm font-bold text-gray-800">Legend</h3>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-green-200 text-green-900 px-3 py-1 rounded-md font-semibold shadow-sm">
                text
              </span>
              <span className="text-gray-700 font-medium">Added content</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-200 text-red-900 px-3 py-1 rounded-md line-through font-semibold shadow-sm">
                text
              </span>
              <span className="text-gray-700 font-medium">Removed content</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-50 px-3 py-1 rounded-md border-2 border-yellow-300 font-semibold shadow-sm">
                line
              </span>
              <span className="text-gray-700 font-medium">Modified line</span>
            </div>
          </div>
        </div>

        {/* Diff View */}
        <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden view-transition">
          {viewMode === "side-by-side" ? (
            <SideBySideView
              changes={changes}
              searchTerm={searchTerm}
              searchResults={searchResults}
              currentSearchIndex={currentSearchIndex}
              collapseUnchanged={collapseUnchanged}
              searchRefs={searchRefs}
            />
          ) : (
            <InlineView
              changes={changes}
              searchTerm={searchTerm}
              searchResults={searchResults}
              currentSearchIndex={currentSearchIndex}
              collapseUnchanged={collapseUnchanged}
              searchRefs={searchRefs}
            />
          )}
        </div>
      </div>
    </main>
  );
}
