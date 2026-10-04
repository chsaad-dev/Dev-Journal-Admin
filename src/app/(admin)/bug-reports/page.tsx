"use client";

import { useEffect, useState, useMemo } from "react";
import { BugReport, BugReportStatus } from "@/types/bugReport";
import { subscribeToAllBugReports, updateBugReportStatus } from "@/lib/bugReports";
import {
  Search,
  Bug,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Smartphone,
  Calendar,
  User,
  X,
  FileText,
  Save,
  ImageIcon
} from "lucide-react";

type FilterStatus = "All" | "Open" | "In Progress" | "Resolved" | "Won't Fix";

export default function BugReportsPage() {
  const [reports, setReports] = useState<BugReport[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("All");
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Note editing state for detail modal
  const [editingNotes, setEditingNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAllBugReports((data) => {
      setReports(data);
      // If modal is open, keep selected report updated
      setSelectedReport((prev) => {
        if (!prev) return null;
        return data.find((r) => r.id === prev.id) || null;
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedReport) {
      setEditingNotes(selectedReport.adminNotes || "");
    }
  }, [selectedReport?.id]);

  const filteredReports = useMemo(() => {
    if (!reports) return null;
    return reports.filter((report) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        report.title?.toLowerCase().includes(query) ||
        report.description?.toLowerCase().includes(query) ||
        report.userEmail?.toLowerCase().includes(query) ||
        report.deviceInfo?.toLowerCase().includes(query);

      let matchesFilter = true;
      if (filter === "Open") matchesFilter = report.status === "open";
      if (filter === "In Progress") matchesFilter = report.status === "in_progress";
      if (filter === "Resolved") matchesFilter = report.status === "resolved";
      if (filter === "Won't Fix") matchesFilter = report.status === "wont_fix";

      return matchesSearch && matchesFilter;
    });
  }, [reports, searchQuery, filter]);

  const handleStatusChange = async (reportId: string, newStatus: BugReportStatus) => {
    try {
      await updateBugReportStatus(reportId, newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReport) return;
    setIsSavingNotes(true);
    try {
      await updateBugReportStatus(selectedReport.id, selectedReport.status, editingNotes);
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date } | Date | string | null | undefined) => {
    if (!timestamp) return "N/A";
    const date =
      typeof timestamp === "object" && timestamp !== null && "toDate" in timestamp && typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp as string | Date);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderStatusBadge = (status: BugReportStatus) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-error-container text-error border border-error/20">
            <AlertCircle className="w-3 h-3 mr-1" /> Open
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-tertiary)]/10 text-[var(--color-tertiary)] border border-[var(--color-tertiary)]/20">
            <Clock className="w-3 h-3 mr-1" /> In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success-container text-success border border-success/20">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
          </span>
        );
      case "wont_fix":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant">
            <XCircle className="w-3 h-3 mr-1" /> Won't Fix
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Bug Reports</h1>
          {reports && (
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium border border-outline-variant">
              {reports.length}
            </span>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap bg-surface-container border border-outline-variant rounded-lg p-1">
          {(["All", "Open", "In Progress", "Resolved", "Won't Fix"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === f
                  ? "bg-primary-container text-on-surface shadow"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search title, email, device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors"
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-container-high border-b border-outline-variant text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-medium">Issue Title</th>
                <th className="px-6 py-4 font-medium">User Email</th>
                <th className="px-6 py-4 font-medium">Screenshot</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Device & App</th>
                <th className="px-6 py-4 font-medium">Submitted</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {/* Loading State */}
              {!filteredReports && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-48 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-32 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-10 h-10 bg-surface-container-high rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="w-20 h-5 bg-surface-container-high rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="w-36 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-24 h-8 bg-surface-container-high rounded ml-auto"></div></td>
                  </tr>
                ))
              )}

              {/* Empty State */}
              {filteredReports && filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center">
                        <Bug className="w-8 h-8 text-on-surface-variant" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-on-surface">No bug reports found</h3>
                        <p className="text-on-surface-variant text-sm mt-1">
                          {reports?.length === 0
                            ? "All clear! There are currently no user-submitted bug reports."
                            : "No bug reports match the selected filters."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {filteredReports &&
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-surface-container-high/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    {/* Title */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col max-w-[240px] lg:max-w-[320px]">
                        <span className="font-semibold text-on-surface group-hover:text-[var(--color-tertiary)] truncate transition-colors">
                          {report.title || "Untitled Issue"}
                        </span>
                        <span className="text-xs text-on-surface-variant truncate mt-0.5">
                          {report.description}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <span className="text-on-surface-variant font-mono text-xs">
                        {report.userEmail || "anonymous"}
                      </span>
                    </td>

                    {/* Screenshot */}
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {report.screenshotUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(report.screenshotUrl!)}
                          className="relative group/thumb block rounded-lg overflow-hidden border border-outline-variant hover:border-[var(--color-tertiary)] transition-colors"
                        >
                          <img
                            src={report.screenshotUrl}
                            alt="Screenshot"
                            className="w-12 h-12 object-cover bg-surface-container-high"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-xs text-on-surface-variant/50 italic">None</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">{renderStatusBadge(report.status)}</td>

                    {/* Device & App */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-on-surface-variant max-w-[200px] truncate">
                        <span className="truncate">{report.deviceInfo || "Unknown Device"}</span>
                        <span className="text-[11px] opacity-75">v{report.appVersion || "1.0"}</span>
                      </div>
                    </td>

                    {/* Submitted Date */}
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {formatDate(report.createdAt)}
                    </td>

                    {/* Actions: Status dropdown */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusChange(report.id, e.target.value as BugReportStatus)}
                        className="bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-medium focus:outline-none focus:border-primary-container transition-colors cursor-pointer"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="wont_fix">Won't Fix</option>
                      </select>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal / Drawer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {renderStatusBadge(selectedReport.status)}
                  <span className="text-xs text-on-surface-variant font-mono">ID: {selectedReport.id}</span>
                </div>
                <h2 className="text-xl font-bold text-on-surface">{selectedReport.title}</h2>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-container-high/60 p-3 rounded-xl border border-outline-variant text-xs">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <User className="w-4 h-4 text-primary-container" />
                <span className="truncate">{selectedReport.userEmail || "anonymous"}</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Smartphone className="w-4 h-4 text-[var(--color-tertiary)]" />
                <span className="truncate">{selectedReport.deviceInfo}</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Calendar className="w-4 h-4 text-success" />
                <span>{formatDate(selectedReport.createdAt)}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Issue Description
              </h4>
              <div className="bg-surface-container-high p-4 rounded-xl text-sm text-on-surface whitespace-pre-wrap leading-relaxed border border-outline-variant/60 font-sans">
                {selectedReport.description}
              </div>
            </div>

            {/* Screenshot if available */}
            {selectedReport.screenshotUrl && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Attached Screenshot
                </h4>
                <div
                  onClick={() => setPreviewImageUrl(selectedReport.screenshotUrl!)}
                  className="cursor-pointer group relative rounded-xl overflow-hidden border border-outline-variant max-h-60 bg-black/30"
                >
                  <img
                    src={selectedReport.screenshotUrl}
                    alt="Bug Screenshot"
                    className="w-full h-auto object-contain max-h-60"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-xs font-medium text-white bg-black/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" /> View Full Resolution
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Change & Admin Notes */}
            <div className="space-y-4 pt-2 border-t border-outline-variant">
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Update Status:
                </label>
                <select
                  value={selectedReport.status}
                  onChange={(e) => handleStatusChange(selectedReport.id, e.target.value as BugReportStatus)}
                  className="bg-surface-container-high border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface font-medium focus:outline-none focus:border-primary-container transition-colors cursor-pointer"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="wont_fix">Won't Fix</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                  <span>Admin Triage Notes</span>
                  {selectedReport.resolvedAt && (
                    <span className="text-[11px] text-success normal-case font-normal">
                      Resolved: {formatDate(selectedReport.resolvedAt)}
                    </span>
                  )}
                </label>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Add internal notes about this bug, root cause, reproduction, or fix commit..."
                  rows={3}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl p-3 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-primary-container hover:bg-[#4338ca] text-on-surface transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Size Image Lightbox Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImageUrl}
              alt="Screenshot full size"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-outline-variant/40"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
