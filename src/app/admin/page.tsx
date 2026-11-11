'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  MessageSquare,
  BarChart3,
  School,
  FileSpreadsheet,
  Download,
  Trash2,
  Eye,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Upload,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  FileText
} from 'lucide-react';

interface StatsData {
  totalSubmissions: number;
  kietCount: number;
  kietwCount: number;
  frmCount: number;
  srmCount: number;
  activeFacultyCount: number;
  inactiveFacultyCount: number;
  branchDistribution: { code: string; name: string; count: number }[];
}

interface FeedbackItem {
  id: number;
  student_name: string;
  email: string;
  phone: string;
  roll_number: string;
  college_code: string;
  college_name: string;
  branch_code: string;
  branch_name: string;
  feedback_type: string;
  q1_subject_challenges: string;
  q2_improvements: string;
  q3_additional_comments: string;
  created_at: string;
  faculty_list: { id: number; name: string; designation: string; email: string }[];
}

interface FacultyItem {
  id: number;
  name: string;
  college_code: string;
  college_name: string;
  branch_code: string;
  branch_name: string;
  feedback_type: string;
  designation: string;
  email: string;
  active_flag: boolean;
  feedback_count: string;
}

export default function AdminDashboardPage() {
  // Navigation Tabs: 'overview' | 'feedback' | 'faculty'
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'faculty'>('overview');

  // Stats State
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Feedback Table State
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackLimit] = useState(10);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Feedback Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCampus, setFilterCampus] = useState('ALL');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // View Feedback Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<FeedbackItem | null>(null);

  // Delete Feedback Modal State
  const [deleteSubmissionId, setDeleteSubmissionId] = useState<number | null>(null);
  const [deletingSubmission, setDeletingSubmission] = useState(false);

  // Faculty State
  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [facultyCampusTab, setFacultyCampusTab] = useState<'KIET' | 'KIETW'>('KIET');
  const [facultyBranchFilter, setFacultyBranchFilter] = useState('ALL');
  const [facultyTypeFilter, setFacultyTypeFilter] = useState('ALL');
  const [facultyStatusFilter, setFacultyStatusFilter] = useState('all');
  const [facultySearch, setFacultySearch] = useState('');

  // Add/Edit Faculty Modal State
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyItem | null>(null);
  const [facultyFormData, setFacultyFormData] = useState({
    name: '',
    collegeCode: 'KIET',
    branchCode: 'CYBER',
    feedbackType: 'FRM',
    designation: 'Assistant Professor',
    email: '',
  });
  const [savingFaculty, setSavingFaculty] = useState(false);
  const [facultyModalError, setFacultyModalError] = useState<string | null>(null);

  // Soft Deactivate / Reactivate Loading
  const [togglingFacultyId, setTogglingFacultyId] = useState<number | null>(null);

  // CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);
  const [importResult, setImportResult] = useState<{ message: string; errors?: any[] } | null>(null);

  // General Notification / Banner
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerMessage({ type, text });
    setTimeout(() => setBannerMessage(null), 5000);
  };

  // 1. Fetch Stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 2. Fetch Feedback Submissions
  const fetchFeedback = useCallback(async () => {
    setLoadingFeedback(true);
    try {
      const params = new URLSearchParams({
        page: String(feedbackPage),
        limit: String(feedbackLimit),
        search: searchQuery,
        campus: filterCampus,
        branch: filterBranch,
        type: filterType,
        startDate: filterStartDate,
        endDate: filterEndDate,
      });

      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      const data = await res.json();
      if (data.submissions) {
        setFeedbackList(data.submissions);
        setFeedbackTotal(data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoadingFeedback(false);
    }
  }, [feedbackPage, feedbackLimit, searchQuery, filterCampus, filterBranch, filterType, filterStartDate, filterEndDate]);

  // 3. Fetch Faculty
  const fetchFaculty = useCallback(async () => {
    setLoadingFaculty(true);
    try {
      const params = new URLSearchParams({
        campus: facultyCampusTab,
        branch: facultyBranchFilter,
        type: facultyTypeFilter,
        status: facultyStatusFilter,
        search: facultySearch,
      });

      const res = await fetch(`/api/admin/faculty?${params.toString()}`);
      const data = await res.json();
      if (data.faculty) {
        setFacultyList(data.faculty);
      }
    } catch (err) {
      console.error('Failed to load faculty:', err);
    } finally {
      setLoadingFaculty(false);
    }
  }, [facultyCampusTab, facultyBranchFilter, facultyTypeFilter, facultyStatusFilter, facultySearch]);

  // Initial Load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'feedback' || activeTab === 'overview') {
      fetchFeedback();
    }
  }, [activeTab, fetchFeedback]);

  useEffect(() => {
    if (activeTab === 'faculty') {
      fetchFaculty();
    }
  }, [activeTab, fetchFaculty]);

  // Delete Feedback Submission Handler
  const confirmDeleteSubmission = async () => {
    if (!deleteSubmissionId) return;
    setDeletingSubmission(true);
    try {
      const res = await fetch(`/api/admin/feedback/${deleteSubmissionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showBanner(`Feedback submission #${deleteSubmissionId} deleted successfully.`);
        setDeleteSubmissionId(null);
        fetchFeedback();
        fetchStats();
      } else {
        showBanner(data.error || 'Failed to delete submission.', 'error');
      }
    } catch (err) {
      showBanner('Network error deleting submission.', 'error');
    } finally {
      setDeletingSubmission(false);
    }
  };

  // Toggle Faculty Soft Deactivation / Reactivation
  const handleToggleFacultyStatus = async (faculty: FacultyItem) => {
    setTogglingFacultyId(faculty.id);
    const newStatus = !faculty.active_flag;
    try {
      const res = await fetch(`/api/admin/faculty/${faculty.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeFlag: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showBanner(data.message);
        fetchFaculty();
        fetchStats();
      } else {
        showBanner(data.error || 'Failed to update faculty status.', 'error');
      }
    } catch (err) {
      showBanner('Network error updating faculty.', 'error');
    } finally {
      setTogglingFacultyId(null);
    }
  };

  // Open Add Faculty Modal
  const openAddFacultyModal = () => {
    setEditingFaculty(null);
    setFacultyFormData({
      name: '',
      collegeCode: facultyCampusTab,
      branchCode: 'CYBER',
      feedbackType: 'FRM',
      designation: 'Assistant Professor',
      email: '',
    });
    setFacultyModalError(null);
    setIsFacultyModalOpen(true);
  };

  // Open Edit Faculty Modal
  const openEditFacultyModal = (fac: FacultyItem) => {
    setEditingFaculty(fac);
    setFacultyFormData({
      name: fac.name,
      collegeCode: fac.college_code,
      branchCode: fac.branch_code,
      feedbackType: fac.feedback_type,
      designation: fac.designation,
      email: fac.email,
    });
    setFacultyModalError(null);
    setIsFacultyModalOpen(true);
  };

  // Save Faculty (Create or Edit)
  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFaculty(true);
    setFacultyModalError(null);

    try {
      const url = editingFaculty ? `/api/admin/faculty/${editingFaculty.id}` : '/api/admin/faculty';
      const method = editingFaculty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facultyFormData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFacultyModalError(data.error || 'Failed to save faculty record.');
        setSavingFaculty(false);
        return;
      }

      showBanner(data.message || 'Faculty member saved successfully.');
      setIsFacultyModalOpen(false);
      fetchFaculty();
      fetchStats();
    } catch (err) {
      setFacultyModalError('Network error saving faculty.');
    } finally {
      setSavingFaculty(false);
    }
  };

  // Handle CSV Import
  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportingCsv(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/admin/faculty/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: importCsvText }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportResult({ message: data.error || 'Failed to process CSV file.' });
        setImportingCsv(false);
        return;
      }

      setImportResult({
        message: data.message,
        errors: data.errors,
      });

      showBanner(data.message);
      fetchFaculty();
      fetchStats();
      if (data.importedCount > 0 && (!data.errors || data.errors.length === 0)) {
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportCsvText('');
          setImportResult(null);
        }, 1500);
      }
    } catch (err) {
      setImportResult({ message: 'Network error during CSV upload.' });
    } finally {
      setImportingCsv(false);
    }
  };

  // Handle CSV file drop or input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (text) setImportCsvText(text);
    };
    reader.readAsText(file);
  };

  // Sample CSV Download Template
  const downloadSampleCsv = () => {
    const csvContent =
      'Name,Campus,Branch,Feedback_Type,Designation,Email\r\n' +
      'Dr. John Doe,KIET,CYBER,FRM,Professor & HOD,johndoe@kiet.edu\r\n' +
      'Prof. Jane Smith,KIET,AID,SRM,Associate Professor,janesmith@kiet.edu\r\n' +
      'Dr. Alice Roy,KIETW,CSM,FRM,Professor,aliceroy@kiet.edu\r\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Sample_Faculty_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Filtered Feedback
  const handleExport = (format: 'csv' | 'xlsx') => {
    const params = new URLSearchParams({
      format,
      search: searchQuery,
      campus: filterCampus,
      branch: filterBranch,
      type: filterType,
      startDate: filterStartDate,
      endDate: filterEndDate,
    });
    window.open(`/api/admin/feedback/export?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Banner Message */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm transition ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Tab Navigation */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">Institutional Administration</h1>
          <p className="text-xs text-slate-500 mt-1">
            KIET &amp; KIET-W Feedback Analytics, Student Submissions &amp; Faculty Roster
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-[#F4F7FB] p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#123B70] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#123B70] hover:bg-white/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-[#123B70] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#123B70] hover:bg-white/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Feedback Submissions
          </button>

          <button
            onClick={() => setActiveTab('faculty')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'faculty'
                ? 'bg-[#123B70] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#123B70] hover:bg-white/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Faculty Management
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW & REAL STATISTICS */}
      {(activeTab === 'overview' || activeTab === 'feedback') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total Submissions */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Submissions</span>
              <div className="p-2 bg-blue-50 text-[#123B70] rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-[#172B4D]">
                {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /> : stats?.totalSubmissions ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Recorded in Neon DB</p>
            </div>
          </div>

          {/* KIET Count */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">KIET Submissions</span>
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-[#123B70]">
                {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /> : stats?.kietCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Main Campus</p>
            </div>
          </div>

          {/* KIET-W Count */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">KIET-W Submissions</span>
              <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-purple-900">
                {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /> : stats?.kietwCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Women’s College</p>
            </div>
          </div>

          {/* FRM Count */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">FRM Feedback</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-emerald-700">
                {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /> : stats?.frmCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Faculty Review Metric</p>
            </div>
          </div>

          {/* SRM Count */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SRM Feedback</span>
              <div className="p-2 bg-blue-50 text-[#2563EB] rounded-xl">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-[#2563EB]">
                {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /> : stats?.srmCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Student Review Metric</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. FEEDBACK SUBMISSIONS SECTION */}
      {(activeTab === 'feedback' || activeTab === 'overview') && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#172B4D]">Student Feedback Records</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Search, filter, view complete responses, and export datasets.
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                title="Export filtered records to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                Export CSV
              </button>

              <button
                onClick={() => handleExport('xlsx')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Export filtered records to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                Export Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
            {/* Search Input: name, roll number, faculty */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setFeedbackPage(1);
                }}
                placeholder="Search student, roll number, faculty..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            {/* Campus Filter */}
            <div>
              <select
                value={filterCampus}
                onChange={e => {
                  setFilterCampus(e.target.value);
                  setFeedbackPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="ALL">All Campuses</option>
                <option value="KIET">KIET</option>
                <option value="KIETW">KIET-W</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={filterBranch}
                onChange={e => {
                  setFilterBranch(e.target.value);
                  setFeedbackPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="ALL">All Branches</option>
                <option value="CYBER">CYBER</option>
                <option value="AID">AID</option>
                <option value="CSM">CSM</option>
                <option value="CAI">CAI</option>
                <option value="CSD">CSD</option>
              </select>
            </div>

            {/* Feedback Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={e => {
                  setFilterType(e.target.value);
                  setFeedbackPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="ALL">All Feedback Types</option>
                <option value="FRM">FRM (Faculty Review)</option>
                <option value="SRM">SRM (Student Review)</option>
              </select>
            </div>

            {/* Refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchFeedback()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Date Filter:
            </span>
            <div className="flex items-center gap-2">
              <span>From</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={e => {
                  setFilterStartDate(e.target.value);
                  setFeedbackPage(1);
                }}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>To</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => {
                  setFilterEndDate(e.target.value);
                  setFeedbackPage(1);
                }}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
            {(filterStartDate || filterEndDate || searchQuery || filterCampus !== 'ALL' || filterBranch !== 'ALL' || filterType !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCampus('ALL');
                  setFilterBranch('ALL');
                  setFilterType('ALL');
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setFeedbackPage(1);
                }}
                className="ml-auto text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Feedback Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-[#172B4D]">
              <thead className="bg-[#F4F7FB] text-[#123B70] uppercase font-bold text-[11px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">ID / Date</th>
                  <th className="py-3 px-3.5">Student Details</th>
                  <th className="py-3 px-3.5">Campus &amp; Branch</th>
                  <th className="py-3 px-3.5">Type</th>
                  <th className="py-3 px-3.5">Faculty Evaluated</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingFeedback ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mx-auto mb-2" />
                      Loading submissions from Neon DB...
                    </td>
                  </tr>
                ) : feedbackList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No feedback submissions match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  feedbackList.map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition">
                      {/* ID / Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#123B70]">#{item.id}</span>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Student Details */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-[#172B4D]">{item.student_name}</div>
                        <div className="font-mono text-[11px] font-bold text-[#123B70]">{item.roll_number}</div>
                        <div className="text-[10px] text-slate-400">{item.email}</div>
                      </td>

                      {/* Campus & Branch */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-bold text-[#123B70]">{item.college_code}</span>
                        <span className="mx-1 text-slate-300">•</span>
                        <span className="font-semibold text-slate-700">{item.branch_code}</span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            item.feedback_type === 'FRM'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.feedback_type}
                        </span>
                      </td>

                      {/* Faculty Evaluated */}
                      <td className="py-3 px-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.faculty_list.map(fac => (
                            <span
                              key={fac.id}
                              className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                            >
                              {fac.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSubmission(item)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="View Full Submission"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteSubmissionId(item.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <div>
              Showing{' '}
              <strong className="text-slate-800">
                {feedbackTotal === 0 ? 0 : (feedbackPage - 1) * feedbackLimit + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {Math.min(feedbackPage * feedbackLimit, feedbackTotal)}
              </strong>{' '}
              of <strong className="text-slate-800">{feedbackTotal}</strong> submissions
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={feedbackPage <= 1}
                onClick={() => setFeedbackPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Page {feedbackPage} of {Math.max(1, Math.ceil(feedbackTotal / feedbackLimit))}
              </span>
              <button
                disabled={feedbackPage >= Math.ceil(feedbackTotal / feedbackLimit)}
                onClick={() => setFeedbackPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FACULTY MANAGEMENT SECTION */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#172B4D]">Faculty Directory &amp; Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage roster, soft-deactivate/reactivate (historical feedback preserved), add faculty, and import CSV.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                CSV Bulk Import
              </button>

              <button
                onClick={openAddFacultyModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#123B70] hover:bg-[#0E2E57] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                Add New Faculty
              </button>
            </div>
          </div>

          {/* Campus Tabs: KIET vs KIETW */}
          <div className="flex items-center border-b border-slate-200">
            <button
              onClick={() => setFacultyCampusTab('KIET')}
              className={`pb-3 px-6 text-sm font-bold border-b-2 transition cursor-pointer ${
                facultyCampusTab === 'KIET'
                  ? 'border-[#123B70] text-[#123B70]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              KIET (Main Campus)
            </button>
            <button
              onClick={() => setFacultyCampusTab('KIETW')}
              className={`pb-3 px-6 text-sm font-bold border-b-2 transition cursor-pointer ${
                facultyCampusTab === 'KIETW'
                  ? 'border-[#123B70] text-[#123B70]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              KIET-W (Women’s College)
            </button>
          </div>

          {/* Faculty Filters Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search */}
            <div className="sm:col-span-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={facultySearch}
                onChange={e => setFacultySearch(e.target.value)}
                placeholder="Search faculty name or email..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={facultyBranchFilter}
                onChange={e => setFacultyBranchFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="ALL">All Branches</option>
                <option value="CYBER">CYBER</option>
                <option value="AID">AID</option>
                <option value="CSM">CSM</option>
                <option value="CAI">CAI</option>
                <option value="CSD">CSD</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={facultyTypeFilter}
                onChange={e => setFacultyTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="ALL">All Types (FRM &amp; SRM)</option>
                <option value="FRM">FRM Only</option>
                <option value="SRM">SRM Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={facultyStatusFilter}
                onChange={e => setFacultyStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="all">All Statuses (Active &amp; Inactive)</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Faculty Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-[#172B4D]">
              <thead className="bg-[#F4F7FB] text-[#123B70] uppercase font-bold text-[11px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Faculty Name &amp; Designation</th>
                  <th className="py-3 px-3.5">Campus</th>
                  <th className="py-3 px-3.5">Branch</th>
                  <th className="py-3 px-3.5">Feedback Type</th>
                  <th className="py-3 px-3.5">Submissions</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingFaculty ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mx-auto mb-2" />
                      Loading faculty roster...
                    </td>
                  </tr>
                ) : facultyList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No faculty found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  facultyList.map(fac => (
                    <tr
                      key={fac.id}
                      className={`hover:bg-slate-50/70 transition ${
                        !fac.active_flag ? 'bg-slate-50/50 text-slate-400' : ''
                      }`}
                    >
                      {/* Name & Designation */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-[#172B4D]">{fac.name}</div>
                        <div className="text-[11px] text-slate-500">{fac.designation}</div>
                        <div className="text-[10px] text-slate-400">{fac.email}</div>
                      </td>

                      {/* Campus */}
                      <td className="py-3 px-3.5 font-semibold text-[#123B70]">
                        {fac.college_code}
                      </td>

                      {/* Branch */}
                      <td className="py-3 px-3.5 font-semibold text-slate-700">
                        {fac.branch_code}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            fac.feedback_type === 'FRM'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {fac.feedback_type}
                        </span>
                      </td>

                      {/* Submissions Count */}
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-[#123B70]">{fac.feedback_count}</span>
                        <span className="text-[10px] text-slate-400 ml-1">feedbacks</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        {fac.active_flag ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditFacultyModal(fac)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Faculty Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Soft Deactivate / Reactivate button */}
                          <button
                            disabled={togglingFacultyId === fac.id}
                            onClick={() => handleToggleFacultyStatus(fac)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                              fac.active_flag
                                ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                                : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={
                              fac.active_flag
                                ? 'Soft-deactivate faculty (keeps historical feedback intact)'
                                : 'Reactivate faculty for feedback'
                            }
                          >
                            {togglingFacultyId === fac.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : fac.active_flag ? (
                              'Deactivate'
                            ) : (
                              'Reactivate'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW FULL SUBMISSION DETAILS */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#172B4D]">
                  Feedback Submission #{selectedSubmission.id}
                </h3>
                <p className="text-xs text-slate-400">
                  Submitted on {new Date(selectedSubmission.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Name</span>
                <p className="font-semibold text-slate-800">{selectedSubmission.student_name}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Roll No</span>
                <p className="font-mono font-bold text-[#123B70]">{selectedSubmission.roll_number}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Email</span>
                <p className="text-slate-700 truncate">{selectedSubmission.email}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Phone</span>
                <p className="text-slate-700">+91 {selectedSubmission.phone}</p>
              </div>
            </div>

            {/* Academic Classification */}
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#123B70] font-bold border border-blue-200">
                {selectedSubmission.college_code} - {selectedSubmission.college_name}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                {selectedSubmission.branch_code}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-extrabold">
                {selectedSubmission.feedback_type}
              </span>
            </div>

            {/* Faculty Evaluated */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Faculty Members Evaluated ({selectedSubmission.faculty_list.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedSubmission.faculty_list.map(f => (
                  <div key={f.id} className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs">
                    <p className="font-bold text-[#172B4D]">{f.name}</p>
                    <p className="text-[11px] text-slate-500">{f.designation}</p>
                    <p className="text-[10px] text-slate-400">{f.email}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Answers */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-[#123B70] block mb-1">
                  1) Difficult Subject &amp; Challenging Topics:
                </span>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedSubmission.q1_subject_challenges}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-[#123B70] block mb-1">
                  2) Expected Improvements from Faculty:
                </span>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedSubmission.q2_improvements}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-[#123B70] block mb-1">
                  3) Additional Comments &amp; Suggestions:
                </span>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedSubmission.q3_additional_comments}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION MODAL */}
      {deleteSubmissionId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[#172B4D]">Confirm Feedback Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete submission #{deleteSubmissionId}? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteSubmissionId(null)}
                disabled={deletingSubmission}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSubmission}
                disabled={deletingSubmission}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingSubmission ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT FACULTY MODAL */}
      {isFacultyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#172B4D]">
                {editingFaculty ? `Edit Faculty: ${editingFaculty.name}` : 'Add New Faculty Member'}
              </h3>
              <button
                onClick={() => setIsFacultyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {facultyModalError && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs text-red-700 rounded-r-lg">
                {facultyModalError}
              </div>
            )}

            <form onSubmit={handleSaveFaculty} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                  Faculty Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={facultyFormData.name}
                  onChange={e => setFacultyFormData({ ...facultyFormData, name: e.target.value })}
                  placeholder="e.g. Dr. Sample Alpha"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                    Campus *
                  </label>
                  <select
                    value={facultyFormData.collegeCode}
                    onChange={e => setFacultyFormData({ ...facultyFormData, collegeCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="KIET">KIET (Main Campus)</option>
                    <option value="KIETW">KIETW (Women’s College)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                    Branch *
                  </label>
                  <select
                    value={facultyFormData.branchCode}
                    onChange={e => setFacultyFormData({ ...facultyFormData, branchCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="CYBER">CYBER</option>
                    <option value="AID">AID</option>
                    <option value="CSM">CSM</option>
                    <option value="CAI">CAI</option>
                    <option value="CSD">CSD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                    Feedback Type *
                  </label>
                  <select
                    value={facultyFormData.feedbackType}
                    onChange={e => setFacultyFormData({ ...facultyFormData, feedbackType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="FRM">FRM (Faculty Review Metric)</option>
                    <option value="SRM">SRM (Student Review Metric)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={facultyFormData.designation}
                    onChange={e => setFacultyFormData({ ...facultyFormData, designation: e.target.value })}
                    placeholder="e.g. Associate Professor"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={facultyFormData.email}
                  onChange={e => setFacultyFormData({ ...facultyFormData, email: e.target.value })}
                  placeholder="e.g. faculty.name@kiet.edu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFacultyModalOpen(false)}
                  disabled={savingFaculty}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFaculty}
                  className="px-5 py-2 rounded-xl bg-[#123B70] hover:bg-[#0E2E57] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingFaculty && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingFaculty ? 'Save Changes' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CSV IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#172B4D]">Import Faculty via CSV</h3>
                <p className="text-xs text-slate-500">Bulk upload faculty members with validation.</p>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResult(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download Prompt */}
            <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
              <div>
                <span className="font-bold">Required Columns:</span> Name, Campus, Branch, Feedback_Type, Designation, Email
              </div>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Sample Template
              </button>
            </div>

            {importResult && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800">{importResult.message}</p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <ul className="text-red-600 list-disc list-inside text-[11px] max-h-24 overflow-y-auto">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>Row {err.row}: {err.reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <form onSubmit={handleImportCsv} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Upload CSV File:
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#123B70] hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Or Paste CSV Text Directly:
                </label>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={e => setImportCsvText(e.target.value)}
                  placeholder="Name,Campus,Branch,Feedback_Type,Designation,Email&#10;Dr. John Doe,KIET,CYBER,FRM,Professor,johndoe@kiet.edu"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={importingCsv}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importingCsv || !importCsvText.trim()}
                  className="px-5 py-2 rounded-xl bg-[#123B70] hover:bg-[#0E2E57] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {importingCsv && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Process Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
