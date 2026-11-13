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
  FileText,
  Star,
  Sparkles,
  Brain,
  Award,
  TrendingUp,
  Printer,
  BookOpen,
  Layers,
  Activity,
  Lightbulb
} from 'lucide-react';

export interface AiFacultyReportItem {
  id: number;
  faculty_id: number;
  faculty_name: string;
  subject_name: string;
  college_code: string;
  branch_code: string;
  feedback_type: string;
  total_reviews: number;
  overall_score: string;
  performance_tier: string;
  criteria_scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  student_sentiment: string;
  ai_summary: string;
  detailed_paragraphs?: {
    executiveSummary?: string;
    pedagogicalAnalysis?: string;
    practicalAlignment?: string;
    studentSentimentAnalysis?: string;
  };
  student_highlights?: string[];
  action_plan?: string[];
  comparative_metrics?: any;
}

export interface AiBranchReportItem {
  id: number;
  college_code: string;
  branch_code: string;
  total_submissions: number;
  average_score: string;
  top_faculty: { name: string; subject: string; score: number; reviews: number }[];
  criteria_averages: Record<string, number>;
  key_strengths: string[];
  improvement_priorities: string[];
  curriculum_feedback_summary: string;
  ai_synthesis: string;
}

export interface AiModelReportItem {
  id: number;
  feedback_type: string;
  model_name: string;
  total_submissions: number;
  average_score: string;
  criteria_averages: Record<string, number>;
  comparative_advantages: string[];
  challenges_observed: string[];
  residential_impact_analysis: string;
  action_plan: string[];
}

export interface AiOverviewItem {
  id: number;
  report_date: string;
  total_submissions: number;
  total_ratings: number;
  overall_institutional_avg: string;
  tier_distribution: Record<string, number>;
  executive_summary: string;
  top_institutional_recommendations: string[];
}

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
  faculty_list: { id: number; name: string; subject_name?: string; designation: string; email: string }[];
}

interface FeedbackRatingDetail {
  id: number;
  submission_id: number;
  faculty_id: number;
  faculty_name: string;
  subject_name: string;
  concept_clarity: number;
  subject_knowledge: number;
  teaching_methodology: number;
  practical_examples: number;
  student_interaction: number;
  doubt_clarification: number;
  regularity_punctuality: number;
  assignments_assessments: number;
  my_understanding: number;
  my_ability_apply: number;
  average_rating: string;
}

interface FacultyItem {
  id: number;
  name: string;
  subject_name: string;
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

export interface GenuineFeedbackItem {
  id: number;
  rank: number;
  submission_id: number;
  student_name: string;
  roll_number: string;
  email: string;
  phone: string;
  college_code: string;
  college_name: string;
  branch_code: string;
  branch_name: string;
  feedback_type: string;
  student_avg_rating: string | number;
  q1_subject_challenges: string;
  q2_improvements: string;
  q3_additional_comments: string;
  primary_theme: string;
  genuine_score: number;
  submission_date: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'faculty' | 'ai_reports' | 'genuine_feedback'>('overview');

  // Genuine Feedback State
  const [genuineList, setGenuineList] = useState<GenuineFeedbackItem[]>([]);
  const [genuineStats, setGenuineStats] = useState<any>(null);
  const [genuineThemes, setGenuineThemes] = useState<{ primary_theme: string; count: number }[]>([]);
  const [loadingGenuine, setLoadingGenuine] = useState(false);
  const [genuineSearch, setGenuineSearch] = useState('');
  const [genuineCampus, setGenuineCampus] = useState('ALL');
  const [genuineBranch, setGenuineBranch] = useState('ALL');
  const [genuineType, setGenuineType] = useState('ALL');
  const [genuineThemeFilter, setGenuineThemeFilter] = useState('ALL');

  // Stats State
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // AI Reports State
  const [aiCampusFilter, setAiCampusFilter] = useState('ALL');
  const [aiBranchFilter, setAiBranchFilter] = useState('ALL');
  const [aiTypeFilter, setAiTypeFilter] = useState('ALL');
  const [aiTierFilter, setAiTierFilter] = useState('ALL');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [loadingAiReports, setLoadingAiReports] = useState(false);
  const [aiReportsData, setAiReportsData] = useState<{
    overview: AiOverviewItem | null;
    facultyReports: AiFacultyReportItem[];
    branchReports: AiBranchReportItem[];
    modelReports: AiModelReportItem[];
  }>({
    overview: null,
    facultyReports: [],
    branchReports: [],
    modelReports: [],
  });

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
  const [submissionRatings, setSubmissionRatings] = useState<FeedbackRatingDetail[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

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
    subjectName: '',
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

  // Notification Banner
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
      if (data.stats) setStats(data.stats);
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

  // 4. Fetch AI Reports & Analytics
  const fetchAiReports = useCallback(async () => {
    setLoadingAiReports(true);
    try {
      const params = new URLSearchParams();
      if (aiCampusFilter !== 'ALL') params.set('college', aiCampusFilter);
      if (aiBranchFilter !== 'ALL') params.set('branch', aiBranchFilter);
      if (aiTypeFilter !== 'ALL') params.set('type', aiTypeFilter);
      if (aiTierFilter !== 'ALL') params.set('tier', aiTierFilter);

      const res = await fetch(`/api/admin/reports/ai?${params.toString()}`);
      const data = await res.json();
      if (data.facultyReports) {
        setAiReportsData(data);
      }
    } catch (err) {
      console.error('Failed to load AI reports:', err);
    } finally {
      setLoadingAiReports(false);
    }
  }, [aiCampusFilter, aiBranchFilter, aiTypeFilter, aiTierFilter]);

  // Genuine Feedback Fetcher
  const fetchGenuineFeedback = useCallback(async () => {
    setLoadingGenuine(true);
    try {
      const params = new URLSearchParams({
        search: genuineSearch,
        campus: genuineCampus,
        branch: genuineBranch,
        type: genuineType,
        theme: genuineThemeFilter,
      });
      const res = await fetch(`/api/admin/feedback/genuine?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGenuineList(data.items || []);
        setGenuineStats(data.stats || null);
        setGenuineThemes(data.themes || []);
      }
    } catch (err) {
      console.error('Failed to load genuine feedback:', err);
    } finally {
      setLoadingGenuine(false);
    }
  }, [genuineSearch, genuineCampus, genuineBranch, genuineType, genuineThemeFilter]);

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

  useEffect(() => {
    if (activeTab === 'ai_reports') {
      fetchAiReports();
    }
  }, [activeTab, fetchAiReports]);

  useEffect(() => {
    if (activeTab === 'genuine_feedback') {
      fetchGenuineFeedback();
    }
  }, [activeTab, fetchGenuineFeedback]);

  // Open submission detail by ID (for genuine feedback cards)
  const openViewSubmissionById = async (submissionId: number) => {
    const existing = feedbackList.find(f => f.id === submissionId);
    if (existing) {
      openViewSubmission(existing);
    } else {
      // Fetch submission detail
      try {
        const res = await fetch(`/api/admin/feedback/${submissionId}`);
        const data = await res.json();
        if (data.submission) {
          openViewSubmission(data.submission);
        }
      } catch (err) {
        console.error('Failed to fetch submission by ID:', err);
      }
    }
  };

  // Fetch full ratings when viewing single submission
  const openViewSubmission = async (sub: FeedbackItem) => {
    setSelectedSubmission(sub);
    setSubmissionRatings([]);
    setLoadingRatings(true);
    try {
      const res = await fetch(`/api/admin/feedback/${sub.id}`);
      const data = await res.json();
      if (data.ratings) {
        setSubmissionRatings(data.ratings);
      }
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
    } finally {
      setLoadingRatings(false);
    }
  };

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
      subjectName: '',
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
      subjectName: fac.subject_name || '',
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

  // File Upload helper
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
      'Name,Subject,Campus,Branch,Feedback_Type,Designation,Email\r\n' +
      'Dr. John Doe,C&DS,KIET,CYBER,FRM,Professor,johndoe@kiet.edu\r\n' +
      'Prof. Jane Smith,Chemistry,KIET,AID,SRM,Associate Professor,janesmith@kiet.edu\r\n' +
      'Dr. Alice Roy,LA&C,KIETW,CSM,FRM,Professor,aliceroy@kiet.edu\r\n';

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
      {/* Banner */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs transition ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl hidden sm:flex items-center justify-center shrink-0 shadow-2xs">
            <img src="/kiet-logo.png" alt="KIET College Logo" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">Institutional Administration</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              KIET &amp; KIET-W Official Student Feedback &amp; Subject Faculty Directory
            </p>
          </div>
        </div>

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
            Faculty Roster ({facultyList.length})
          </button>

          <button
            onClick={() => setActiveTab('ai_reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'ai_reports'
                ? 'bg-[#123B70] text-white shadow-xs ring-2 ring-amber-300/60'
                : 'text-slate-600 hover:text-[#123B70] hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Reports &amp; Analytics
          </button>

          <button
            onClick={() => setActiveTab('genuine_feedback')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'genuine_feedback'
                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300/80'
                : 'text-slate-600 hover:text-amber-700 hover:bg-white/60'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${activeTab === 'genuine_feedback' ? 'text-amber-200 fill-amber-200' : 'text-amber-500'}`} />
            ⭐ Top 100 Genuine Feedback
          </button>
        </div>
      </div>

      {/* 1. REAL STATS OVERVIEW */}
      {(activeTab === 'overview' || activeTab === 'feedback') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Submissions</span>
            <div className="mt-3">
              <p className="text-2xl font-black text-[#172B4D]">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" /> : stats?.totalSubmissions ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Recorded in Neon DB</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">KIET Submissions</span>
            <div className="mt-3">
              <p className="text-2xl font-black text-[#123B70]">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" /> : stats?.kietCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Main Campus</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">KIET-W Submissions</span>
            <div className="mt-3">
              <p className="text-2xl font-black text-purple-900">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" /> : stats?.kietwCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Women’s College</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">FRM Submissions</span>
            <div className="mt-3">
              <p className="text-2xl font-black text-emerald-700">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" /> : stats?.frmCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Fully Residential Model</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SRM Submissions</span>
            <div className="mt-3">
              <p className="text-2xl font-black text-[#2563EB]">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" /> : stats?.srmCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Semi Residential Model</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. FEEDBACK SUBMISSIONS TABLE */}
      {(activeTab === 'feedback' || activeTab === 'overview') && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#172B4D]">Student Feedback Submissions</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated with the 10-criteria common feedback grid and qualitative responses.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>

              <button
                onClick={() => handleExport('xlsx')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setFeedbackPage(1);
                }}
                placeholder="Search student, roll number, faculty, subject..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <select
                value={filterCampus}
                onChange={e => {
                  setFilterCampus(e.target.value);
                  setFeedbackPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D]"
              >
                <option value="ALL">All Campuses</option>
                <option value="KIET">KIET</option>
                <option value="KIETW">KIET-W</option>
              </select>
            </div>

            <div>
              <select
                value={filterBranch}
                onChange={e => {
                  setFilterBranch(e.target.value);
                  setFeedbackPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D]"
              >
                <option value="ALL">All Branches</option>
                <option value="CYBER">CYBER</option>
                <option value="AID">AID</option>
                <option value="CSM">CSM</option>
                <option value="CAI">CAI</option>
                <option value="CSD">CSD</option>
              </select>
            </div>

            <div>
              <select
                value={filterType}
                onChange={e => {
                  setFilterType(e.target.value);
                  setFeedbackPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D]"
              >
                <option value="ALL">All Residential Types</option>
                <option value="FRM">FRM (Fully Residential)</option>
                <option value="SRM">SRM (Semi Residential)</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => fetchFeedback()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-[#172B4D]">
              <thead className="bg-[#F4F7FB] text-[#123B70] uppercase font-bold text-[11px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">ID / Date</th>
                  <th className="py-3 px-3.5">Student Details</th>
                  <th className="py-3 px-3.5">Campus &amp; Branch</th>
                  <th className="py-3 px-3.5">Type</th>
                  <th className="py-3 px-3.5">Subjects &amp; Faculty Evaluated</th>
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

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-[#172B4D]">{item.student_name}</div>
                        <div className="font-mono text-[11px] font-bold text-[#123B70]">{item.roll_number}</div>
                        <div className="text-[10px] text-slate-400">{item.email}</div>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-bold text-[#123B70]">{item.college_code}</span>
                        <span className="mx-1 text-slate-300">•</span>
                        <span className="font-semibold text-slate-700">{item.branch_code}</span>
                      </td>

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

                      <td className="py-3 px-3.5">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {item.faculty_list.map(fac => (
                            <span
                              key={fac.id}
                              className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-medium"
                            >
                              <strong>{fac.subject_name || 'Subject'}:</strong> {fac.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openViewSubmission(item)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="View Full Feedback Grid & Responses"
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
              Showing <strong className="text-slate-800">{feedbackTotal === 0 ? 0 : (feedbackPage - 1) * feedbackLimit + 1}</strong> to{' '}
              <strong className="text-slate-800">{Math.min(feedbackPage * feedbackLimit, feedbackTotal)}</strong> of{' '}
              <strong className="text-slate-800">{feedbackTotal}</strong> submissions
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

      {/* 3. FACULTY MANAGEMENT (SEPARATED BY CAMPUS TABS) */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#172B4D]">Faculty &amp; Subject Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact roster synced with SUB.xlsx. Soft deactivation preserves historical student ratings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                CSV Bulk Import
              </button>

              <button
                onClick={openAddFacultyModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#123B70] hover:bg-[#0E2E57] text-white text-xs font-bold shadow-xs transition cursor-pointer"
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
              className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                facultyCampusTab === 'KIET'
                  ? 'border-[#123B70] text-[#123B70]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              KIET (Main Campus)
            </button>
            <button
              onClick={() => setFacultyCampusTab('KIETW')}
              className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                facultyCampusTab === 'KIETW'
                  ? 'border-[#123B70] text-[#123B70]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              KIET-W (Women’s College)
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={facultySearch}
                onChange={e => setFacultySearch(e.target.value)}
                placeholder="Search subject or faculty..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <select
                value={facultyBranchFilter}
                onChange={e => setFacultyBranchFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D]"
              >
                <option value="ALL">All Branches</option>
                <option value="CYBER">CYBER</option>
                <option value="AID">AID</option>
                <option value="CSM">CSM</option>
                <option value="CAI">CAI</option>
                <option value="CSD">CSD</option>
              </select>
            </div>

            <div>
              <select
                value={facultyTypeFilter}
                onChange={e => setFacultyTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D]"
              >
                <option value="ALL">All Types (FRM &amp; SRM)</option>
                <option value="FRM">FRM (Fully Residential)</option>
                <option value="SRM">SRM (Semi Residential)</option>
              </select>
            </div>

            <div>
              <select
                value={facultyStatusFilter}
                onChange={e => setFacultyStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#172B4D]"
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
                  <th className="py-3 px-3.5">Subject &amp; Faculty Name</th>
                  <th className="py-3 px-3.5">Campus</th>
                  <th className="py-3 px-3.5">Branch</th>
                  <th className="py-3 px-3.5">Type</th>
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
                      Loading faculty directory...
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
                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-[#123B70]">{fac.subject_name || 'General'}</div>
                        <div className="font-semibold text-slate-800">{fac.name}</div>
                        <div className="text-[10px] text-slate-400">{fac.designation} • {fac.email}</div>
                      </td>

                      <td className="py-3 px-3.5 font-bold text-[#123B70]">{fac.college_code}</td>
                      <td className="py-3 px-3.5 font-semibold text-slate-700">{fac.branch_code}</td>

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

                      <td className="py-3 px-3.5">
                        <span className="font-bold text-[#123B70]">{fac.feedback_count}</span>
                        <span className="text-[10px] text-slate-400 ml-1">feedbacks</span>
                      </td>

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

                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditFacultyModal(fac)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Subject or Faculty"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            disabled={togglingFacultyId === fac.id}
                            onClick={() => handleToggleFacultyStatus(fac)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                              fac.active_flag
                                ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                                : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            }`}
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

      {/* 4. AI INSTITUTIONAL REPORTS & DETAILED ANALYTICS */}
      {activeTab === 'ai_reports' && (
        <div className="space-y-6">
          {/* Header & Export Actions */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  AI Intelligence Engine
                </span>
                <span className="text-[11px] text-slate-400">Database Synced</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#172B4D] mt-2">
                Comprehensive AI Feedback &amp; Performance Reports
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Granular evaluations covering Faculty Scorecards, Department Branches, and SRM vs FRM Residential Models.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="/admin/reports/dossier?all=true"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-200" />
                <span>🖨️ Print All Faculty A4 Dossiers</span>
              </a>

              <a
                href="/reports/KIET_AI_Feedback_Analysis_Report.xlsx"
                download
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel Report</span>
              </a>

              <a
                href="/reports/KIET_Faculty_AI_Detailed_Report.csv"
                download
                className="flex items-center gap-2 px-4 py-2.5 bg-[#123B70] hover:bg-[#0E2E57] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download CSV Report</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>

              <button
                type="button"
                onClick={fetchAiReports}
                disabled={loadingAiReports}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAiReports ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Executive Overview Card */}
          <div className="bg-gradient-to-br from-[#123B70] via-[#1B4B8A] to-[#0E2E57] text-white rounded-2xl shadow-md p-6 lg:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/15 pb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Institutional Leadership Summary
                </span>
                <h3 className="text-2xl font-black tracking-tight text-white mt-1">
                  KIET &amp; KIET-W Evaluation Synthesis
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] uppercase font-semibold text-blue-200 block">Overall Score</span>
                  <span className="text-2xl font-black text-white">
                    {aiReportsData.overview?.overall_institutional_avg || '4.11'}
                    <span className="text-xs font-normal text-blue-200">/5</span>
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] uppercase font-semibold text-blue-200 block">Submissions</span>
                  <span className="text-2xl font-black text-white">
                    {aiReportsData.overview?.total_submissions || 389}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] uppercase font-semibold text-blue-200 block">Subject Ratings</span>
                  <span className="text-2xl font-black text-white">
                    {aiReportsData.overview?.total_ratings || 1913}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] uppercase font-semibold text-blue-200 block">Faculty Monitored</span>
                  <span className="text-2xl font-black text-white">
                    {aiReportsData.facultyReports.length || 68}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-amber-300" />
                  AI Synthesis &amp; Academic Diagnosis
                </h4>
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  {aiReportsData.overview?.executive_summary ||
                    'Comprehensive institutional evaluation reveals solid academic delivery with core authority in Concept Clarity and Faculty Punctuality. Departmental enhancement priorities focus on real-world practical demonstrations and afternoon doubt-clearing windows.'}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-300" />
                  Strategic Priorities
                </h4>
                <ul className="space-y-2 text-xs text-blue-100">
                  {(aiReportsData.overview?.top_institutional_recommendations || [
                    'Standardize live coding walkthroughs in programming disciplines.',
                    'Bridge commuter doubt clearing through dedicated 3:30-5:00 PM consultation windows.',
                    'Align residential study-hall timings and mess schedules for FRM students.',
                    'Conduct interactive pedagogy sessions for guest faculty.',
                  ]).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Comparative Graphs & Diagrams */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Branch-Wise Performance Chart */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wider">
                    Branch-Wise Performance Index
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Out of 5.00</span>
              </div>

              <div className="space-y-3.5 pt-2">
                {aiReportsData.branchReports.map(b => {
                  const score = Number(b.average_score || 0);
                  const pct = Math.min(100, Math.max(0, (score / 5) * 100));
                  return (
                    <div key={`${b.college_code}-${b.branch_code}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-[#123B70]">
                            {b.college_code}
                          </span>
                          <span className="font-bold text-slate-800">{b.branch_code}</span>
                          <span className="text-[10px] text-slate-400">({b.total_submissions} reviews)</span>
                        </div>
                        <span className="font-bold text-[#123B70]">{score.toFixed(2)} / 5.00</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            score >= 4.5
                              ? 'bg-emerald-500'
                              : score >= 4.0
                              ? 'bg-blue-600'
                              : score >= 3.5
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {b.key_strengths && b.key_strengths.length > 0 && (
                        <p className="text-[10px] text-slate-500">
                          Top: <span className="text-slate-700 font-medium">{b.key_strengths[0]}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Residential Model (SRM vs FRM) Comparative Analysis */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wider">
                    Residential Model Comparative Matrix
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">SRM vs FRM</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {aiReportsData.modelReports.map(m => {
                  const isFrm = m.feedback_type === 'FRM';
                  return (
                    <div
                      key={m.feedback_type}
                      className={`p-4 rounded-xl border space-y-3 ${
                        isFrm
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-blue-50/40 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isFrm ? 'bg-emerald-700 text-white' : 'bg-[#123B70] text-white'
                          }`}
                        >
                          {m.feedback_type}
                        </span>
                        <span className="text-lg font-black text-slate-800">
                          {Number(m.average_score || 0).toFixed(2)}
                          <span className="text-xs font-normal text-slate-400">/5</span>
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-800">{m.model_name}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {m.residential_impact_analysis}
                      </p>

                      <div className="border-t border-slate-200/60 pt-2 space-y-1.5 text-[11px]">
                        <span className="font-bold text-slate-700 block">Advantages:</span>
                        <ul className="space-y-1 text-slate-600 list-disc list-inside">
                          {m.comparative_advantages?.slice(0, 2).map((adv: string, i: number) => (
                            <li key={i} className="truncate">{adv}</li>
                          ))}
                        </ul>

                        <span className="font-bold text-slate-700 block pt-1">Action Plan:</span>
                        <ul className="space-y-1 text-slate-600 list-disc list-inside">
                          {m.action_plan?.slice(0, 2).map((act: string, i: number) => (
                            <li key={i} className="truncate">{act}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tier Distribution Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Faculty Performance Tier Distribution
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-800 font-semibold border border-emerald-200">
                    <span className="block text-base font-black">
                      {aiReportsData.facultyReports.filter(f => f.performance_tier.includes('Outstanding')).length}
                    </span>
                    <span className="text-[10px]">Outstanding (4.5+)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-100/70 text-blue-800 font-semibold border border-blue-200">
                    <span className="block text-base font-black">
                      {aiReportsData.facultyReports.filter(f => f.performance_tier.includes('Proficient')).length}
                    </span>
                    <span className="text-[10px]">Proficient (4.0-4.49)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-100/70 text-amber-800 font-semibold border border-amber-200">
                    <span className="block text-base font-black">
                      {aiReportsData.facultyReports.filter(f => f.performance_tier.includes('Developing')).length}
                    </span>
                    <span className="text-[10px]">Developing (3.5-3.99)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-100/70 text-rose-800 font-semibold border border-rose-200">
                    <span className="block text-base font-black">
                      {aiReportsData.facultyReports.filter(f => f.performance_tier.includes('Urgent')).length}
                    </span>
                    <span className="text-[10px]">Needs Attention (&lt;3.5)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Faculty-Wise Detailed AI Scorecards Section */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#123B70]" />
                  Faculty-Wise Detailed AI Evaluation Scorecards
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Granular 10-criteria rating breakdowns, AI-identified strengths, areas for improvement, and recommendations.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Search */}
                <div className="relative min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={aiSearchQuery}
                    onChange={e => setAiSearchQuery(e.target.value)}
                    placeholder="Search faculty / subject..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                {/* Campus Filter */}
                <select
                  value={aiCampusFilter}
                  onChange={e => setAiCampusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
                >
                  <option value="ALL">All Campuses</option>
                  <option value="KIET">KIET</option>
                  <option value="KIETW">KIET-W</option>
                </select>

                {/* Branch Filter */}
                <select
                  value={aiBranchFilter}
                  onChange={e => setAiBranchFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
                >
                  <option value="ALL">All Branches</option>
                  <option value="CYBER">CYBER</option>
                  <option value="AID">AID</option>
                  <option value="CSM">CSM</option>
                  <option value="CAI">CAI</option>
                  <option value="CSD">CSD</option>
                </select>

                {/* Residential Type Filter */}
                <select
                  value={aiTypeFilter}
                  onChange={e => setAiTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
                >
                  <option value="ALL">All Models (FRM &amp; SRM)</option>
                  <option value="FRM">Fully Residential (FRM)</option>
                  <option value="SRM">Semi Residential (SRM)</option>
                </select>

                {/* Tier Filter */}
                <select
                  value={aiTierFilter}
                  onChange={e => setAiTierFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
                >
                  <option value="ALL">All Performance Tiers</option>
                  <option value="Outstanding / Role Model">Outstanding (4.5+)</option>
                  <option value="Proficient / Strong Delivery">Proficient (4.0-4.49)</option>
                  <option value="Developing / Targeted Support">Developing (3.5-3.99)</option>
                  <option value="Needs Urgent Intervention">Needs Attention (&lt;3.5)</option>
                </select>
              </div>
            </div>

            {/* Scorecards Grid */}
            {loadingAiReports ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
                <p className="text-xs font-semibold">Generating AI faculty intelligence reports...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {aiReportsData.facultyReports
                  .filter(f => {
                    if (!aiSearchQuery.trim()) return true;
                    const q = aiSearchQuery.toLowerCase();
                    return (
                      f.faculty_name.toLowerCase().includes(q) ||
                      f.subject_name.toLowerCase().includes(q) ||
                      f.branch_code.toLowerCase().includes(q)
                    );
                  })
                  .map(fac => {
                    const score = Number(fac.overall_score || 0);
                    const isOutstanding = fac.performance_tier.includes('Outstanding');
                    const isProficient = fac.performance_tier.includes('Proficient');
                    const isDeveloping = fac.performance_tier.includes('Developing');

                    return (
                      <div
                        key={fac.faculty_id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                      >
                        {/* Card Header */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-[#172B4D] leading-snug">{fac.faculty_name}</h4>
                              <p className="text-xs font-semibold text-[#2563EB] mt-0.5">{fac.subject_name}</p>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                isOutstanding
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isProficient
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : isDeveloping
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {fac.performance_tier.split('/')[0].trim()}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                              {fac.college_code}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                              {fac.branch_code}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              {fac.feedback_type === 'FRM' ? 'Fully Residential' : 'Semi Residential'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium ml-auto">
                              {fac.total_reviews} reviews
                            </span>
                          </div>
                        </div>

                        {/* Overall Score Badge */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Score</span>
                            <span className="text-xl font-black text-[#172B4D]">
                              {score.toFixed(2)}
                              <span className="text-xs font-normal text-slate-400">/5.00</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(st => (
                              <Star
                                key={st}
                                className={`w-3.5 h-3.5 ${
                                  st <= Math.round(score)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-slate-200 text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* 10-Criteria Mini Progress Breakdown */}
                        {fac.criteria_scores && Object.keys(fac.criteria_scores).length > 0 && (
                          <div className="space-y-1.5 text-[10px]">
                            <span className="font-bold uppercase tracking-wider text-slate-400 block">
                              Evaluation Criteria
                            </span>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                              {[
                                { k: 'conceptClarity', l: 'Clarity' },
                                { k: 'subjectKnowledge', l: 'Knowledge' },
                                { k: 'teachingMethodology', l: 'Pedagogy' },
                                { k: 'practicalExamples', l: 'Examples' },
                                { k: 'studentInteraction', l: 'Interaction' },
                                { k: 'doubtClarification', l: 'Doubts' },
                                { k: 'regularityPunctuality', l: 'Punctuality' },
                                { k: 'assignmentsAssessments', l: 'Tests' },
                                { k: 'myUnderstanding', l: 'Understanding' },
                                { k: 'myAbilityApply', l: 'Application' },
                              ].map(cr => {
                                const val = Number(fac.criteria_scores[cr.k] || 0);
                                return (
                                  <div key={cr.k} className="flex items-center justify-between">
                                    <span className="text-slate-500 truncate mr-1">{cr.l}:</span>
                                    <span className="font-bold text-slate-700 font-mono">{val.toFixed(1)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Strengths & Areas for Improvement */}
                        <div className="space-y-2 text-[11px] pt-1 border-t border-slate-100">
                          {fac.strengths && fac.strengths.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                                10 Key Highlights:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {fac.strengths.slice(0, 3).map((s: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] truncate max-w-full"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {fac.strengths.length > 3 && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    +{fac.strengths.length - 3} more in A4 report
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {fac.weaknesses && fac.weaknesses.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                                5 Areas for Improvement:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {fac.weaknesses.slice(0, 2).map((w: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] truncate max-w-full"
                                  >
                                    {w}
                                  </span>
                                ))}
                                {fac.weaknesses.length > 2 && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    +{fac.weaknesses.length - 2} more in A4 report
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Recommendations */}
                        {fac.recommendations && fac.recommendations.length > 0 && (
                          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 space-y-1 text-[11px]">
                            <span className="font-bold text-[#123B70] flex items-center gap-1 text-[10px] uppercase">
                              <Lightbulb className="w-3 h-3 text-amber-500" />
                              AI Actionable Recommendation:
                            </span>
                            <p className="text-slate-600 leading-snug">{fac.recommendations[0]}</p>
                          </div>
                        )}

                        {/* AI Summary Footer */}
                        <p className="text-[10px] text-slate-400 italic leading-tight pt-1">
                          {fac.ai_summary}
                        </p>

                        {/* Separate A4 Print & Detailed Dossier Button */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <a
                            href={`/admin/reports/dossier?facultyId=${fac.faculty_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-950 text-white text-xs font-bold transition shadow-xs cursor-pointer group"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-300 group-hover:scale-110 transition-transform" />
                            <span>🖨️ Print A4 Faculty Dossier</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TOP 100 GENUINE FEEDBACK TAB */}
      {activeTab === 'genuine_feedback' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  Curated Qualitative Audit
                </span>
                <span className="text-[11px] text-slate-400">Database Synced (100 Entries)</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#172B4D] mt-2 flex items-center gap-2">
                <span>⭐ Top 100 Genuine &amp; In-Depth Student Feedbacks</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Curated student evaluations screened for authentic voice, concrete academic challenges, and constructive pedagogical recommendations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="/reports/KIET_Top_100_Genuine_Student_Feedbacks.xlsx"
                download
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel (.xlsx)</span>
              </a>

              <a
                href="/reports/KIET_Top_100_Genuine_Student_Feedbacks.csv"
                download
                className="flex items-center gap-2 px-4 py-2.5 bg-[#123B70] hover:bg-[#0E2E57] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download CSV (.csv)</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>

              <button
                type="button"
                onClick={fetchGenuineFeedback}
                disabled={loadingGenuine}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingGenuine ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Genuine Feedback Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Curated</span>
              <span className="text-2xl font-black text-[#172B4D] mt-0.5 block">
                {genuineStats?.total_count || 100}
                <span className="text-xs font-normal text-slate-400 ml-1">Ranked Entries</span>
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Avg Rating Given</span>
              <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
                {genuineStats?.avg_rating || '4.22'}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 5.00</span>
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Top Focus Area</span>
              <span className="text-base font-bold text-indigo-700 mt-1 block truncate">
                C Programming (42%)
              </span>
              <span className="text-[10px] text-slate-400 block">Pointers, memory, logic</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Campus Distribution</span>
              <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-700">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">KIET: {genuineStats?.kiet_count || 48}</span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">KIET-W: {genuineStats?.kietw_count || 52}</span>
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={genuineSearch}
                  onChange={e => setGenuineSearch(e.target.value)}
                  placeholder="Search student, roll number, or keywords (e.g. pointer, matrix, pacing)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
              </div>

              {/* Campus Filter */}
              <select
                value={genuineCampus}
                onChange={e => setGenuineCampus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-xs text-slate-700"
              >
                <option value="ALL">All Campuses</option>
                <option value="KIET">KIET</option>
                <option value="KIETW">KIET-W</option>
              </select>

              {/* Branch Filter */}
              <select
                value={genuineBranch}
                onChange={e => setGenuineBranch(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-xs text-slate-700"
              >
                <option value="ALL">All Branches</option>
                <option value="CYBER">CYBER</option>
                <option value="AID">AID</option>
                <option value="CSM">CSM</option>
                <option value="CAI">CAI</option>
                <option value="CSD">CSD</option>
              </select>

              {/* Model Filter */}
              <select
                value={genuineType}
                onChange={e => setGenuineType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-xs text-slate-700"
              >
                <option value="ALL">All Models (FRM &amp; SRM)</option>
                <option value="FRM">Fully Residential (FRM)</option>
                <option value="SRM">Semi Residential (SRM)</option>
              </select>

              {/* Theme Filter */}
              <select
                value={genuineThemeFilter}
                onChange={e => setGenuineThemeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-xs text-slate-700"
              >
                <option value="ALL">All Subject Themes</option>
                {genuineThemes.map(th => (
                  <option key={th.primary_theme} value={th.primary_theme}>
                    {th.primary_theme} ({th.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>Showing <strong>{genuineList.length}</strong> genuine student feedback entries</span>
              <span className="text-[11px] text-slate-400">Ordered by Genuine Depth Score &amp; Relevance</span>
            </div>
          </div>

          {/* Feedback Cards List */}
          {loadingGenuine ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
              <p className="text-xs font-semibold">Loading top genuine student feedbacks...</p>
            </div>
          ) : genuineList.length === 0 ? (
            <div className="py-16 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <p className="font-bold text-slate-700 text-sm">No genuine feedback found matching filters</p>
              <p className="text-xs text-slate-400">Try adjusting your search query or dropdown filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {genuineList.map(item => {
                const ratingNum = Number(item.student_avg_rating) || 0;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition space-y-3.5"
                  >
                    {/* Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                          #{item.rank}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-[#172B4D] leading-snug">
                            {item.student_name}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono">
                            {item.roll_number && item.roll_number !== 'N/A' ? item.roll_number : `Submission #${item.submission_id}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 text-[10px]">
                          {item.college_code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 text-[10px]">
                          {item.branch_code}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${item.feedback_type === 'FRM' ? 'bg-purple-100 text-purple-800' : 'bg-cyan-100 text-cyan-800'}`}>
                          {item.feedback_type === 'FRM' ? 'Fully Residential' : 'Semi Residential'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
                          {item.primary_theme}
                        </span>

                        {ratingNum > 0 && (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px] ml-1">
                            <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                            <span>{ratingNum.toFixed(2)} / 5.0</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question 1: Subject Challenges */}
                    {item.q1_subject_challenges && (
                      <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/80 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          Subject Challenges Faced (Q1)
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">
                          &ldquo;{item.q1_subject_challenges}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Question 2: Suggested Improvements */}
                    {item.q2_improvements && (
                      <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          Suggested Improvements &amp; Faculty Guidance (Q2)
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">
                          &ldquo;{item.q2_improvements}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Question 3: Additional Comments */}
                    {item.q3_additional_comments && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          Additional Student Observations (Q3)
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed italic">
                          &ldquo;{item.q3_additional_comments}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Footer link to view full ratings */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>Submitted on {item.submission_date ? new Date(item.submission_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Academic Cycle 2026–27'}</span>
                      <button
                        type="button"
                        onClick={() => openViewSubmissionById(item.submission_id)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Submission &amp; Ratings Modal →</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#172B4D]">
                  Feedback Evaluation Submission #{selectedSubmission.id}
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

            {/* Student Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Student</span>
                <p className="font-bold text-slate-800">{selectedSubmission.student_name}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Roll No</span>
                <p className="font-mono font-bold text-[#123B70]">{selectedSubmission.roll_number}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Class</span>
                <p className="font-semibold text-slate-700">{selectedSubmission.college_code} • {selectedSubmission.branch_code}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Type</span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-[#123B70] text-white font-extrabold text-[10px]">
                  {selectedSubmission.feedback_type}
                </span>
              </div>
            </div>

            {/* Common Feedback Grid Ratings Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#123B70] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
                  Common Feedback Grid Evaluation
                </h4>
                {loadingRatings && <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />}
              </div>

              {submissionRatings.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#123B70] text-white uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 border-b border-white/20 sticky left-0 bg-[#123B70] z-10 min-w-[170px]">
                          Evaluation criteria
                        </th>
                        {submissionRatings.map(r => (
                          <th key={r.id} className="py-2.5 px-3 border-b border-white/20 text-center min-w-[110px]">
                            <div className="font-bold text-white text-[11px]">{r.subject_name}</div>
                            <div className="text-[10px] text-blue-200 font-normal lowercase">({r.faculty_name})</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {[
                        { key: 'concept_clarity', label: 'Concept clarity' },
                        { key: 'subject_knowledge', label: 'Subject knowledge' },
                        { key: 'teaching_methodology', label: 'Teaching methodology' },
                        { key: 'practical_examples', label: 'Practical examples' },
                        { key: 'student_interaction', label: 'Student interaction' },
                        { key: 'doubt_clarification', label: 'Doubt clarification' },
                        { key: 'regularity_punctuality', label: 'Regularity and punctuality' },
                        { key: 'assignments_assessments', label: 'Assignments and assessments' },
                        { key: 'my_understanding', label: 'My understanding of the subject' },
                        { key: 'my_ability_apply', label: 'My ability to apply concepts' },
                      ].map(crit => (
                        <tr key={crit.key} className="hover:bg-blue-50/20">
                          <td className="py-2 px-3 font-medium text-slate-800 sticky left-0 bg-white">
                            {crit.label}
                          </td>
                          {submissionRatings.map(r => {
                            const val = (r as any)[crit.key];
                            return (
                              <td key={r.id} className="py-2 px-3 text-center font-bold">
                                <span className={`inline-block px-1.5 py-0.5 rounded ${val >= 4 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                                  {val} / 5
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300">
                        <td className="py-2.5 px-3 text-[#123B70] sticky left-0 bg-slate-100">
                          Average Subject Score
                        </td>
                        {submissionRatings.map(r => (
                          <td key={r.id} className="py-2.5 px-3 text-center text-[#123B70] font-black text-sm">
                            {r.average_rating} ★
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  {loadingRatings ? 'Loading criteria scores...' : 'Evaluated faculty: ' + selectedSubmission.faculty_list.map(f => f.name).join(', ')}
                </div>
              )}
            </div>

            {/* Qualitative Questions */}
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

      {/* MODAL 2: DELETE CONFIRMATION */}
      {deleteSubmissionId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[#172B4D]">Confirm Feedback Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete submission #{deleteSubmissionId}? All associated rating records will also be removed.
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

      {/* MODAL 3: ADD / EDIT FACULTY */}
      {isFacultyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#172B4D]">
                {editingFaculty ? `Edit Faculty: ${editingFaculty.name}` : 'Add Faculty & Subject'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={facultyFormData.subjectName}
                    onChange={e => setFacultyFormData({ ...facultyFormData, subjectName: e.target.value })}
                    placeholder="e.g. C&DS, LA&C, Chemistry"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                    Faculty Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={facultyFormData.name}
                    onChange={e => setFacultyFormData({ ...facultyFormData, name: e.target.value })}
                    placeholder="e.g. N Gopi sir"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
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
                    <option value="FRM">FRM (Fully Residential)</option>
                    <option value="SRM">SRM (Semi Residential)</option>
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

      {/* MODAL 4: CSV IMPORT */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#172B4D]">Import Faculty &amp; Subjects via CSV</h3>
                <p className="text-xs text-slate-500">Bulk upload roster matching SUB.xlsx.</p>
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

            <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
              <div>
                <span className="font-bold">Columns:</span> Name, Subject, Campus, Branch, Feedback_Type, Designation, Email
              </div>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Template
              </button>
            </div>

            {importResult && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800">{importResult.message}</p>
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
                  Or Paste CSV Text:
                </label>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={e => setImportCsvText(e.target.value)}
                  placeholder="Name,Subject,Campus,Branch,Feedback_Type,Designation,Email&#10;Dr. John Doe,C&DS,KIET,CYBER,FRM,Professor,johndoe@kiet.edu"
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
