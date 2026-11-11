'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  GraduationCap,
  Building2,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Loader2,
  RotateCcw,
  Sparkles,
  School,
  FileText
} from 'lucide-react';

interface Faculty {
  id: number;
  name: string;
  designation: string;
  email: string;
  feedback_type: string;
}

interface Branch {
  id: number;
  code: string;
  name: string;
}

export default function StudentFeedbackPage() {
  // Form State
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const [campus, setCampus] = useState<'KIET' | 'KIETW' | ''>('');
  const [branch, setBranch] = useState('');
  const [feedbackType, setFeedbackType] = useState<'FRM' | 'SRM' | ''>('');

  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<number[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // 3 Questions
  const [q1SubjectChallenges, setQ1SubjectChallenges] = useState('');
  const [q2Improvements, setQ2Improvements] = useState('');
  const [q3AdditionalComments, setQ3AdditionalComments] = useState('');

  // UI Flow State
  const [currentStep, setCurrentStep] = useState<'form' | 'review' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionSuccessId, setSubmissionSuccessId] = useState<number | null>(null);

  // Load branches when campus changes
  useEffect(() => {
    if (!campus) {
      setAvailableBranches([]);
      setBranch('');
      return;
    }

    async function fetchBranches() {
      setLoadingBranches(true);
      try {
        const res = await fetch(`/api/branches?college=${campus}`);
        const data = await res.json();
        if (data.branches) {
          setAvailableBranches(data.branches);
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      } finally {
        setLoadingBranches(false);
      }
    }

    fetchBranches();
  }, [campus]);

  // Load faculty when campus, branch, and feedbackType are all chosen
  // Changing campus, branch, or type clears faculty selection and reloads
  useEffect(() => {
    setSelectedFacultyIds([]);
    setErrorMessage(null);

    if (campus && branch && feedbackType) {
      async function fetchFaculty() {
        setLoadingFaculty(true);
        try {
          const res = await fetch(
            `/api/faculty?college=${campus}&branch=${branch}&type=${feedbackType}`
          );
          const data = await res.json();
          if (data.faculty) {
            setFacultyList(data.faculty);
          } else {
            setFacultyList([]);
          }
        } catch (err) {
          console.error('Failed to load faculty:', err);
          setFacultyList([]);
        } finally {
          setLoadingFaculty(false);
        }
      }

      fetchFaculty();
    } else {
      setFacultyList([]);
    }
  }, [campus, branch, feedbackType]);

  // Handlers for campus, branch, type changes
  const handleCampusChange = (val: 'KIET' | 'KIETW' | '') => {
    setCampus(val);
    setBranch('');
    setSelectedFacultyIds([]);
  };

  const handleBranchChange = (val: string) => {
    setBranch(val);
    setSelectedFacultyIds([]);
  };

  const handleFeedbackTypeChange = (val: 'FRM' | 'SRM' | '') => {
    setFeedbackType(val);
    setSelectedFacultyIds([]);
  };

  const toggleFacultySelection = (facultyId: number) => {
    setSelectedFacultyIds(prev =>
      prev.includes(facultyId) ? prev.filter(id => id !== facultyId) : [...prev, facultyId]
    );
  };

  const selectAllFaculty = () => {
    if (selectedFacultyIds.length === facultyList.length) {
      setSelectedFacultyIds([]);
    } else {
      setSelectedFacultyIds(facultyList.map(f => f.id));
    }
  };

  // Validation function
  const validateForm = (): string | null => {
    if (!studentName.trim() || studentName.trim().length < 2) {
      return 'Please enter your full name.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!studentEmail.trim() || !emailRegex.test(studentEmail.trim())) {
      return 'Please enter a valid email address.';
    }
    const cleanPhone = studentPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return 'Student phone must be exactly 10 digits.';
    }
    if (!rollNumber.trim() || rollNumber.trim().length < 3) {
      return 'Please enter your valid Roll Number.';
    }
    if (!campus) {
      return 'Please select your Campus (KIET or KIET-W).';
    }
    if (!branch) {
      return 'Please select your Branch.';
    }
    if (!feedbackType) {
      return 'Please select Feedback Type (FRM or SRM).';
    }
    if (selectedFacultyIds.length === 0) {
      return 'Please select at least one faculty member from the list.';
    }
    if (!q1SubjectChallenges.trim() || q1SubjectChallenges.trim().length < 5) {
      return 'Please answer Question 1: Difficult subject and challenging topics.';
    }
    if (!q2Improvements.trim() || q2Improvements.trim().length < 5) {
      return 'Please answer Question 2: Expected improvements from faculty.';
    }
    if (!q3AdditionalComments.trim() || q3AdditionalComments.trim().length < 2) {
      return 'Please answer Question 3: Additional comments or suggestions.';
    }
    return null;
  };

  // Proceed to Review Screen with duplicate pre-check
  const handleProceedToReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check duplicate on frontend via backend validation API
    setDuplicateChecking(true);
    try {
      const res = await fetch('/api/feedback/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: rollNumber.trim(),
          feedbackType,
          facultyIds: selectedFacultyIds,
        }),
      });
      const data = await res.json();
      if (data.isDuplicate) {
        setErrorMessage(data.message || 'Duplicate submission detected for selected faculty.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setCurrentStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error pre-checking duplicate:', err);
      // Still allow review, backend will enforce transactionally
      setCurrentStep('review');
    } finally {
      setDuplicateChecking(false);
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        studentName: studentName.trim(),
        email: studentEmail.trim(),
        phone: studentPhone.replace(/\D/g, ''),
        rollNumber: rollNumber.trim().toUpperCase(),
        campus,
        branch,
        feedbackType,
        facultyIds: selectedFacultyIds,
        q1SubjectChallenges: q1SubjectChallenges.trim(),
        q2Improvements: q2Improvements.trim(),
        q3AdditionalComments: q3AdditionalComments.trim(),
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to submit feedback. Please check your information and try again.');
        setCurrentStep('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setSubmissionSuccessId(data.submissionId);
      setCurrentStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage('Network or server error while submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form for new submission
  const handleReset = () => {
    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
    setRollNumber('');
    setCampus('');
    setBranch('');
    setFeedbackType('');
    setSelectedFacultyIds([]);
    setFacultyList([]);
    setQ1SubjectChallenges('');
    setQ2Improvements('');
    setQ3AdditionalComments('');
    setErrorMessage(null);
    setCurrentStep('form');
  };

  const isFacultySelectorDisabled = !campus || !branch || !feedbackType;
  const selectedFacultyObjects = facultyList.filter(f => selectedFacultyIds.includes(f.id));

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between">
      {/* Institution Header */}
      <header className="bg-[#123B70] text-white shadow-md border-b-4 border-[#2563EB]">
        <div className="max-w-4xl mx-auto px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 shadow-inner">
              <School className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                KIET &amp; KIET Women’s College
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 font-medium">
                Official Student Academic Feedback Portal • Secure &amp; Direct Feedback
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 sm:px-6 flex-1">
        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Please Review</h3>
                <p className="text-sm text-red-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: FORM */}
        {currentStep === 'form' && (
          <form onSubmit={handleProceedToReview} className="space-y-8">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#172B4D]">Student Feedback Form</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Fields marked with <span className="text-red-500 font-bold">*</span> are required. Submissions are strictly verified.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#123B70] text-xs font-semibold border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                  No Student Login Needed
                </div>
              </div>

              {/* 1. Student Details (Name, Email, Phone, Roll Number) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#123B70]">
                  <GraduationCap className="w-4 h-4 text-[#2563EB]" />
                  <span>1. Student Identity &amp; Contact Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Student Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                      Student Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition"
                    />
                  </div>

                  {/* Student Email */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                      Student Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={e => setStudentEmail(e.target.value)}
                      placeholder="e.g. student@kiet.edu"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition"
                    />
                  </div>

                  {/* Student Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                      Student Phone Number (10 Digits) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-medium text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={studentPhone}
                        onChange={e => setStudentPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full pl-12 pr-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition"
                      />
                    </div>
                  </div>

                  {/* Roll Number */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                      Roll Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={e => setRollNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 21B91A0501"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm font-mono uppercase transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Campus, 3. Branch, 4. Feedback Type Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#123B70] border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span>2. Campus, Branch &amp; Feedback Classification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 2. Campus Dropdown: KIET or KIETW */}
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                    Campus <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={campus}
                    onChange={e => handleCampusChange(e.target.value as 'KIET' | 'KIETW' | '')}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition"
                  >
                    <option value="">-- Select Campus --</option>
                    <option value="KIET">KIET (Main Campus)</option>
                    <option value="KIETW">KIETW (Women’s College)</option>
                  </select>
                </div>

                {/* 3. Branch Dropdown: strictly CYBER, AID, CSM, CAI, CSD */}
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={branch}
                    onChange={e => handleBranchChange(e.target.value)}
                    required
                    disabled={!campus || loadingBranches}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition ${
                      !campus
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent'
                    }`}
                  >
                    <option value="">
                      {!campus
                        ? 'Select Campus first'
                        : loadingBranches
                        ? 'Loading branches...'
                        : '-- Select Branch --'}
                    </option>
                    {availableBranches.map(b => (
                      <option key={b.code} value={b.code}>
                        {b.code} - {b.name.replace(` (${b.code})`, '')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Feedback Type: FRM or SRM */}
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1">
                    Feedback Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFeedbackTypeChange('FRM')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition text-center ${
                        feedbackType === 'FRM'
                          ? 'bg-[#123B70] text-white border-[#123B70] shadow-sm ring-2 ring-blue-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      FRM
                      <span className="block text-[10px] font-normal opacity-80">Faculty Review</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedbackTypeChange('SRM')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition text-center ${
                        feedbackType === 'SRM'
                          ? 'bg-[#123B70] text-white border-[#123B70] shadow-sm ring-2 ring-blue-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      SRM
                      <span className="block text-[10px] font-normal opacity-80">Student Review</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Faculty Selector Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#123B70]">
                  <UserCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>
                    5. Faculty Selection{' '}
                    <span className="text-red-500 font-bold">*</span>
                  </span>
                </div>
                {!isFacultySelectorDisabled && facultyList.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">
                      {selectedFacultyIds.length} of {facultyList.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={selectAllFaculty}
                      className="text-xs font-semibold text-[#2563EB] hover:text-[#123B70] underline cursor-pointer"
                    >
                      {selectedFacultyIds.length === facultyList.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                )}
              </div>

              {/* State 1: Disabled until Campus, Branch, Feedback Type are chosen */}
              {isFacultySelectorDisabled && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                  <div className="w-12 h-12 bg-slate-200/70 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">Faculty Selector Locked</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Please select your <strong className="text-slate-700">Campus</strong>, <strong className="text-slate-700">Branch</strong>, and <strong className="text-slate-700">Feedback Type (FRM/SRM)</strong> above. The faculty list will automatically load matching active faculty.
                  </p>
                </div>
              )}

              {/* State 2: Loading Faculty */}
              {!isFacultySelectorDisabled && loadingFaculty && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="w-7 h-7 text-[#2563EB] animate-spin mb-2" />
                  <p className="text-sm">Loading active faculty for {campus} • {branch} • {feedbackType}...</p>
                </div>
              )}

              {/* State 3: Loaded Faculty Cards */}
              {!isFacultySelectorDisabled && !loadingFaculty && facultyList.length === 0 && (
                <div className="p-6 text-center bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  <p className="font-semibold">No active faculty found for {campus} - {branch} ({feedbackType}).</p>
                  <p className="text-xs text-amber-700 mt-1">Please verify your campus, branch, and feedback type selection, or contact administration.</p>
                </div>
              )}

              {!isFacultySelectorDisabled && !loadingFaculty && facultyList.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-2">
                    Showing only active <strong className="text-blue-700">{feedbackType}</strong> faculty in{' '}
                    <strong className="text-blue-700">{campus}</strong> ({branch}). Select one or more faculty to evaluate:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {facultyList.map(fac => {
                      const isSelected = selectedFacultyIds.includes(fac.id);
                      return (
                        <div
                          key={fac.id}
                          onClick={() => toggleFacultySelection(fac.id)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                            isSelected
                              ? 'bg-blue-50/70 border-[#2563EB] shadow-sm ring-1 ring-[#2563EB]'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by div click
                            className="mt-1 w-4 h-4 text-[#2563EB] rounded border-slate-300 focus:ring-[#2563EB] cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-semibold text-[#172B4D] truncate">
                                {fac.name}
                              </h5>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-[#123B70]">
                                {fac.feedback_type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              {fac.designation}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {fac.email}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Three Questions as Multiline Text Areas */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#123B70] border-b border-slate-100 pb-3">
                <BookOpen className="w-4 h-4 text-[#2563EB]" />
                <span>6. Academic Questions &amp; Detailed Feedback</span>
              </div>

              {/* Question 1 */}
              <div>
                <label className="block text-sm font-semibold text-[#172B4D] mb-1.5 leading-snug">
                  1) Which subject are you finding most difficult, and which topics are challenging?{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={q1SubjectChallenges}
                  onChange={e => setQ1SubjectChallenges(e.target.value)}
                  placeholder="Specify the subject name (e.g. Cryptography & Network Security) and describe the specific units or topics you find hard to comprehend..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition"
                />
              </div>

              {/* Question 2 */}
              <div>
                <label className="block text-sm font-semibold text-[#172B4D] mb-1.5 leading-snug">
                  2) What is the most important improvement you expect from your faculty?{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={q2Improvements}
                  onChange={e => setQ2Improvements(e.target.value)}
                  placeholder="Explain constructive expectations (e.g. practical demonstrations, real-world examples, pace of lecturing, clearer study materials, doubt clearance sessions)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition"
                />
              </div>

              {/* Question 3 */}
              <div>
                <label className="block text-sm font-semibold text-[#172B4D] mb-1.5 leading-snug">
                  3) Any additional comments or suggestions?{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={q3AdditionalComments}
                  onChange={e => setQ3AdditionalComments(e.target.value)}
                  placeholder="Share any other feedback, lab equipment concerns, textbook availability, or institutional recommendations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            {/* Form Footer Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-500">
                You will have an opportunity to review all answers before final submission.
              </p>
              <button
                type="submit"
                disabled={duplicateChecking}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#123B70] hover:bg-[#0E2E57] text-white font-semibold text-sm shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {duplicateChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking Eligibility...
                  </>
                ) : (
                  <>
                    Review Feedback
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: REVIEW SCREEN */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#172B4D]">Review Your Feedback</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Please carefully check all details below before finalizing. Submissions cannot be edited or deleted once saved.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                  Pre-Submission Review
                </span>
              </div>

              {/* Student Details Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F4F7FB] border border-slate-200 mb-6">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Student Name</span>
                  <p className="text-sm font-semibold text-[#172B4D]">{studentName}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Roll Number</span>
                  <p className="text-sm font-mono font-bold text-[#123B70]">{rollNumber}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Email</span>
                  <p className="text-sm text-[#172B4D] truncate">{studentEmail}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Phone</span>
                  <p className="text-sm text-[#172B4D]">+91 {studentPhone}</p>
                </div>
              </div>

              {/* Academic Program Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 mb-6">
                <div>
                  <span className="text-[11px] font-bold text-blue-700 uppercase">Campus</span>
                  <p className="text-sm font-bold text-[#123B70]">
                    {campus === 'KIET' ? 'KIET (Main Campus)' : 'KIETW (Women’s College)'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-700 uppercase">Branch</span>
                  <p className="text-sm font-bold text-[#123B70]">{branch}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-700 uppercase">Feedback Type</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded text-xs font-extrabold bg-[#123B70] text-white">
                    {feedbackType}
                  </span>
                </div>
              </div>

              {/* Selected Faculty List */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Selected Faculty ({selectedFacultyObjects.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedFacultyObjects.map(f => (
                    <div key={f.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#172B4D]">{f.name}</p>
                        <p className="text-xs text-slate-500">{f.designation}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {f.feedback_type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Answers to the 3 Questions */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="text-xs font-bold text-[#123B70] uppercase tracking-wider mb-1">
                    1) Difficult Subject &amp; Challenging Topics:
                  </h5>
                  <p className="text-sm text-[#172B4D] whitespace-pre-wrap leading-relaxed">
                    {q1SubjectChallenges}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="text-xs font-bold text-[#123B70] uppercase tracking-wider mb-1">
                    2) Expected Improvements from Faculty:
                  </h5>
                  <p className="text-sm text-[#172B4D] whitespace-pre-wrap leading-relaxed">
                    {q2Improvements}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="text-xs font-bold text-[#123B70] uppercase tracking-wider mb-1">
                    3) Additional Comments &amp; Suggestions:
                  </h5>
                  <p className="text-sm text-[#172B4D] whitespace-pre-wrap leading-relaxed">
                    {q3AdditionalComments}
                  </p>
                </div>
              </div>

              {/* Review Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep('form')}
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Edit Feedback
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Confirm &amp; Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS MESSAGE */}
        {currentStep === 'success' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-lg border border-slate-200 text-center max-w-2xl mx-auto my-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            {/* Exact Required Success Message */}
            <h2 className="text-2xl sm:text-3xl font-bold text-[#172B4D] tracking-tight mb-3">
              Thank you! Your feedback has been submitted successfully.
            </h2>

            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              Your academic feedback for Roll Number{' '}
              <strong className="text-[#123B70] font-mono">{rollNumber}</strong> has been securely recorded in the official database.
            </p>

            <div className="bg-[#F4F7FB] border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left mb-8 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Submission Reference:</span>
                <span className="font-mono font-bold text-[#123B70]">
                  #{submissionSuccessId ? String(submissionSuccessId).padStart(6, '0') : 'CONFIRMED'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Campus:</span>
                <span className="font-semibold text-slate-800">{campus}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Branch:</span>
                <span className="font-semibold text-slate-800">{branch}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Feedback Type:</span>
                <span className="font-semibold text-slate-800">{feedbackType}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-400 text-center">
                Submissions are permanent and cannot be modified or deleted.
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#123B70] font-semibold text-sm shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Submit Another Feedback
            </button>
          </div>
        )}
      </main>

      {/* Public Footer: Clean and has NO link to /admin */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4">
          <p>© {new Date().getFullYear()} KIET &amp; KIET Women’s College (KIET-W). All rights reserved.</p>
          <p className="mt-1 text-slate-400">
            Kakinada Institute of Engineering &amp; Technology • Internal Quality Assurance Cell (IQAC)
          </p>
        </div>
      </footer>
    </div>
  );
}
