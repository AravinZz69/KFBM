'use client';

import React, { useState, useEffect } from 'react';
import {
  School,
  GraduationCap,
  Building2,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Loader2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Star,
  Check,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface FacultySubject {
  id: number;
  name: string;
  subject_name: string;
  designation: string;
  email: string;
  feedback_type: string;
}

interface Branch {
  id: number;
  code: string;
  name: string;
}

// The 10 official evaluation criteria from the institutional grid
const EVALUATION_CRITERIA = [
  { key: 'conceptClarity', label: 'Concept clarity', desc: 'Clarity in explaining fundamental concepts and principles' },
  { key: 'subjectKnowledge', label: 'Subject knowledge', desc: 'Depth of mastery and technical expertise in the subject' },
  { key: 'teachingMethodology', label: 'Teaching methodology', desc: 'Effective instructional pace, slides, board work & pedagogy' },
  { key: 'practicalExamples', label: 'Practical examples', desc: 'Real-world applications, industry relevance & case studies' },
  { key: 'studentInteraction', label: 'Student interaction', desc: 'Encouraging questions, two-way dialogue & active classroom engagement' },
  { key: 'doubtClarification', label: 'Doubt clarification', desc: 'Patience and thoroughness in addressing student queries' },
  { key: 'regularityPunctuality', label: 'Regularity and punctuality', desc: 'Adherence to schedule, timely syllabus coverage & class discipline' },
  { key: 'assignmentsAssessments', label: 'Assignments and assessments', desc: 'Quality of homework, mock tests, fair grading & constructive feedback' },
  { key: 'myUnderstanding', label: 'My understanding of the subject', desc: 'How well the faculty helps me personally grasp challenging topics' },
  { key: 'myAbilityApply', label: 'My ability to apply concepts', desc: 'Empowering problem-solving, laboratory work & project skills' },
] as const;

type CriteriaKey = typeof EVALUATION_CRITERIA[number]['key'];

interface SubjectRatingRecord {
  facultyId: number;
  facultyName: string;
  subjectName: string;
  ratings: Record<CriteriaKey, number>;
}

export default function StudentFeedbackPortal() {
  // Step navigation: 'details' -> 'onboarding' -> 'questions' -> 'review' -> 'success'
  const [currentStep, setCurrentStep] = useState<'details' | 'onboarding' | 'questions' | 'review' | 'success'>('details');

  // Student Details
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [campus, setCampus] = useState<'KIET' | 'KIETW' | ''>('');
  const [branch, setBranch] = useState('');
  const [feedbackType, setFeedbackType] = useState<'FRM' | 'SRM' | ''>('');

  // Available Branches for selected campus
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Faculty and Subjects mapped from database
  const [facultyList, setFacultyList] = useState<FacultySubject[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  // Onboarding ratings state: Record<facultyId, SubjectRatingRecord>
  const [subjectRatings, setSubjectRatings] = useState<Record<number, SubjectRatingRecord>>({});
  // Current active subject index in onboarding wizard (0 .. facultyList.length - 1)
  const [currentSubjectIdx, setCurrentSubjectIdx] = useState(0);

  // 3 Qualitative Questions
  const [q1SubjectChallenges, setQ1SubjectChallenges] = useState('');
  const [q2Improvements, setQ2Improvements] = useState('');
  const [q3AdditionalComments, setQ3AdditionalComments] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionSuccessId, setSubmissionSuccessId] = useState<number | null>(null);

  // Animation direction state ('forward' | 'backward')
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');

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

  // Load faculty & subjects when campus, branch, and feedback type are chosen
  useEffect(() => {
    setErrorMessage(null);
    setFacultyList([]);
    setSubjectRatings({});
    setCurrentSubjectIdx(0);

    if (campus && branch && feedbackType) {
      async function fetchFaculty() {
        setLoadingFaculty(true);
        try {
          const res = await fetch(
            `/api/faculty?college=${campus}&branch=${branch}&type=${feedbackType}`
          );
          const data = await res.json();
          if (data.faculty && data.faculty.length > 0) {
            setFacultyList(data.faculty);

            // Initialize ratings with default values (5 = Excellent)
            const initialMap: Record<number, SubjectRatingRecord> = {};
            data.faculty.forEach((f: FacultySubject) => {
              const defaultRatings: Record<CriteriaKey, number> = {
                conceptClarity: 5,
                subjectKnowledge: 5,
                teachingMethodology: 5,
                practicalExamples: 5,
                studentInteraction: 5,
                doubtClarification: 5,
                regularityPunctuality: 5,
                assignmentsAssessments: 5,
                myUnderstanding: 5,
                myAbilityApply: 5,
              };
              initialMap[f.id] = {
                facultyId: f.id,
                facultyName: f.name,
                subjectName: f.subject_name || 'General',
                ratings: defaultRatings,
              };
            });
            setSubjectRatings(initialMap);
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
    }
  }, [campus, branch, feedbackType]);

  // Validate step 1 (Student details & Course selection)
  const validateStep1 = (): string | null => {
    if (!studentName.trim() || studentName.trim().length < 2) {
      return 'Please enter your Full Name.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!studentEmail.trim() || !emailRegex.test(studentEmail.trim())) {
      return 'Please enter a valid email address.';
    }
    const cleanPhone = studentPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return 'Student phone must be a valid 10-digit mobile number.';
    }
    if (!rollNumber.trim() || rollNumber.trim().length < 3) {
      return 'Please enter your Roll Number.';
    }
    if (!campus) {
      return 'Please select Campus (KIET or KIET-W).';
    }
    if (!branch) {
      return 'Please select your Branch.';
    }
    if (!feedbackType) {
      return 'Please select Feedback Type (FRM or SRM).';
    }
    if (facultyList.length === 0) {
      return `No active subjects or faculty found for ${campus} • ${branch} • ${feedbackType}. Please verify selection.`;
    }
    return null;
  };

  // Start Onboarding Flow (Proceed from Step 1 to Step 2)
  const handleStartOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const error = validateStep1();
    if (error) {
      setErrorMessage(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Pre-check duplicates before starting questions
    setCheckingDuplicates(true);
    try {
      const res = await fetch('/api/feedback/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: rollNumber.trim(),
          feedbackType,
          facultyIds: facultyList.map(f => f.id),
        }),
      });
      const data = await res.json();
      if (data.isDuplicate) {
        setErrorMessage(data.message || 'Duplicate submission detected for this roll number and faculty.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setCurrentSubjectIdx(0);
      setSlideDirection('forward');
      setCurrentStep('onboarding');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Duplicate pre-check error:', err);
      setCurrentStep('onboarding');
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Rating updates for current subject
  const updateCriteriaRating = (facultyId: number, criteria: CriteriaKey, score: number) => {
    setSubjectRatings(prev => {
      const current = prev[facultyId];
      if (!current) return prev;
      return {
        ...prev,
        [facultyId]: {
          ...current,
          ratings: {
            ...current.ratings,
            [criteria]: score,
          },
        },
      };
    });
  };

  // Quick helper to rate all 10 criteria for current subject at once
  const setAllCriteriaForSubject = (facultyId: number, score: number) => {
    setSubjectRatings(prev => {
      const current = prev[facultyId];
      if (!current) return prev;
      const updated: Record<CriteriaKey, number> = {
        conceptClarity: score,
        subjectKnowledge: score,
        teachingMethodology: score,
        practicalExamples: score,
        studentInteraction: score,
        doubtClarification: score,
        regularityPunctuality: score,
        assignmentsAssessments: score,
        myUnderstanding: score,
        myAbilityApply: score,
      };
      return {
        ...prev,
        [facultyId]: {
          ...current,
          ratings: updated,
        },
      };
    });
  };

  // Navigate between subjects in Onboarding wizard
  const handleNextSubject = () => {
    if (currentSubjectIdx < facultyList.length - 1) {
      setSlideDirection('forward');
      setCurrentSubjectIdx(idx => idx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Finished all subjects -> proceed to the 3 qualitative questions
      setSlideDirection('forward');
      setCurrentStep('questions');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSubject = () => {
    if (currentSubjectIdx > 0) {
      setSlideDirection('backward');
      setCurrentSubjectIdx(idx => idx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentStep('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Validate 3 questions and proceed to Review screen
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!q1SubjectChallenges.trim() || q1SubjectChallenges.trim().length < 3) {
      setErrorMessage('Please specify which subject you find most difficult and the challenging topics.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!q2Improvements.trim() || q2Improvements.trim().length < 3) {
      setErrorMessage('Please specify the most important improvement you expect from your faculty.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!q3AdditionalComments.trim() || q3AdditionalComments.trim().length < 2) {
      setErrorMessage('Please provide any additional comments or suggestions.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Build ratings payload array
      const ratingsPayload = facultyList.map(f => {
        const item = subjectRatings[f.id];
        return {
          facultyId: f.id,
          subjectName: f.subject_name,
          conceptClarity: item?.ratings.conceptClarity || 5,
          subjectKnowledge: item?.ratings.subjectKnowledge || 5,
          teachingMethodology: item?.ratings.teachingMethodology || 5,
          practicalExamples: item?.ratings.practicalExamples || 5,
          studentInteraction: item?.ratings.studentInteraction || 5,
          doubtClarification: item?.ratings.doubtClarification || 5,
          regularityPunctuality: item?.ratings.regularityPunctuality || 5,
          assignmentsAssessments: item?.ratings.assignmentsAssessments || 5,
          myUnderstanding: item?.ratings.myUnderstanding || 5,
          myAbilityApply: item?.ratings.myAbilityApply || 5,
        };
      });

      const payload = {
        studentName: studentName.trim(),
        email: studentEmail.trim(),
        phone: studentPhone.replace(/\D/g, ''),
        rollNumber: rollNumber.trim().toUpperCase(),
        campus,
        branch,
        feedbackType,
        facultyIds: facultyList.map(f => f.id),
        ratings: ratingsPayload,
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
        setErrorMessage(data.error || 'Failed to submit feedback. Please check your inputs and try again.');
        setCurrentStep('details');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setSubmissionSuccessId(data.submissionId);
      setCurrentStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage('Network or server connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
    setRollNumber('');
    setCampus('');
    setBranch('');
    setFeedbackType('');
    setFacultyList([]);
    setSubjectRatings({});
    setCurrentSubjectIdx(0);
    setQ1SubjectChallenges('');
    setQ2Improvements('');
    setQ3AdditionalComments('');
    setErrorMessage(null);
    setCurrentStep('details');
  };

  // Helpers for current subject in onboarding
  const activeFaculty = facultyList[currentSubjectIdx];
  const activeRatingRecord = activeFaculty ? subjectRatings[activeFaculty.id] : null;

  // Calculate subject average score
  const calculateSubjectAvg = (ratings?: Record<CriteriaKey, number>) => {
    if (!ratings) return '5.0';
    const values = Object.values(ratings);
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between">
      {/* Header with Institutional Branding */}
      <header className="bg-[#123B70] text-white shadow-md border-b-4 border-[#2563EB] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 shadow-inner">
              <School className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                KIET &amp; KIET Women’s College (KIET-W)
              </h1>
              <p className="text-[11px] sm:text-xs text-blue-100 font-medium">
                Academic &amp; Faculty Feedback Portal • Official Evaluation System
              </p>
            </div>
          </div>

          {currentStep !== 'details' && currentStep !== 'success' && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {rollNumber} • {campus} ({branch})
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 sm:px-6 flex-1">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-xs animate-shake">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider">Attention Required</h3>
                <p className="text-xs text-red-700 mt-0.5 font-medium">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: STUDENT IDENTITY & COURSE SELECTION                    */}
        {/* ============================================================== */}
        {currentStep === 'details' && (
          <form onSubmit={handleStartOnboarding} className="space-y-6">
            {/* Introduction Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#172B4D]">Student Academic Evaluation</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Please provide your student details and select your registered class. All fields marked with{' '}
                    <span className="text-red-500 font-bold">*</span> are required.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#123B70] text-xs font-semibold border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                  No Student Login Needed
                </div>
              </div>

              {/* 1. Student Identity Fields (Name, Email, Phone, Roll Number) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B70]">
                  <GraduationCap className="w-4 h-4 text-[#2563EB]" />
                  <span>1. Student Identity &amp; Contact Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
                      Student Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      placeholder="e.g. Ananya Rao"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-xs transition"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
                      Student Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={e => setStudentEmail(e.target.value)}
                      placeholder="e.g. ananya@kiet.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-xs transition"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
                      Phone Number (10 Digits) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={studentPhone}
                        onChange={e => setStudentPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-xs transition font-mono"
                      />
                    </div>
                  </div>

                  {/* Roll Number */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
                      Roll Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={e => setRollNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 22B91A0501"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-xs font-mono uppercase transition font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Campus, 3. Branch, 4. Feedback Type Selection */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B70]">
                  <Building2 className="w-4 h-4 text-[#2563EB]" />
                  <span>2. Campus, Branch &amp; Feedback Classification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Campus */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
                      Campus <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={campus}
                      onChange={e => {
                        setCampus(e.target.value as 'KIET' | 'KIETW' | '');
                        setBranch('');
                      }}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-xs transition font-semibold"
                    >
                      <option value="">-- Select Campus --</option>
                      <option value="KIET">KIET (Main Campus)</option>
                      <option value="KIETW">KIETW (Women’s College)</option>
                    </select>
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                      required
                      disabled={!campus || loadingBranches}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition font-semibold ${
                        !campus
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]'
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

                  {/* Feedback Type: FRM or SRM */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
                      Feedback Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFeedbackType('FRM')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition text-center cursor-pointer ${
                          feedbackType === 'FRM'
                            ? 'bg-[#123B70] text-white border-[#123B70] shadow-xs ring-2 ring-blue-300'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        FRM
                        <span className="block text-[10px] font-normal opacity-80">Faculty Review</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackType('SRM')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition text-center cursor-pointer ${
                          feedbackType === 'SRM'
                            ? 'bg-[#123B70] text-white border-[#123B70] shadow-xs ring-2 ring-blue-300'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        SRM
                        <span className="block text-[10px] font-normal opacity-80">Student Review</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Faculty & Subject Mapping Status Banner */}
                {campus && branch && feedbackType && (
                  <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {loadingFaculty ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {facultyList.length}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-[#123B70]">
                          {loadingFaculty
                            ? 'Loading faculty and subject roster from official database...'
                            : `${facultyList.length} Subjects & Faculty Loaded for ${campus} • ${branch} • ${feedbackType}`}
                        </p>
                        {!loadingFaculty && facultyList.length > 0 && (
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Subjects:{' '}
                            <strong className="text-[#172B4D]">
                              {facultyList.map(f => `${f.subject_name} (${f.name})`).join(', ')}
                            </strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={checkingDuplicates || loadingFaculty || !campus || !branch || !feedbackType || facultyList.length === 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#123B70] hover:bg-[#0E2E57] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {checkingDuplicates ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying Roll Number...
                    </>
                  ) : (
                    <>
                      Start Faculty Feedback Questions
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 2: ONBOARDING QUESTIONS (SUBJECT BY SUBJECT)               */}
        {/* ============================================================== */}
        {currentStep === 'onboarding' && activeFaculty && (
          <div className="space-y-6">
            {/* Top Stepper Navigation */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Faculty Evaluation Progress
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#123B70] text-[11px] font-extrabold">
                    Subject {currentSubjectIdx + 1} of {facultyList.length}
                  </span>
                </div>

                {/* Quick Autofill Helper */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Quick rate:</span>
                  <button
                    type="button"
                    onClick={() => setAllCriteriaForSubject(activeFaculty.id, 5)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition"
                  >
                    ★ Rate All 5s (Excellent)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllCriteriaForSubject(activeFaculty.id, 4)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer transition"
                  >
                    Rate All 4s (Very Good)
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#123B70] to-[#2563EB] h-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentSubjectIdx + 1) / facultyList.length) * 100}%` }}
                />
              </div>

              {/* Subject Indicator Pills */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                {facultyList.map((f, idx) => {
                  const isDone = idx < currentSubjectIdx;
                  const isCurrent = idx === currentSubjectIdx;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSlideDirection(idx > currentSubjectIdx ? 'forward' : 'backward');
                        setCurrentSubjectIdx(idx);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#123B70] text-white shadow-xs'
                          : isDone
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {isDone ? <Check className="w-3 h-3 text-emerald-600" /> : <span>{idx + 1}.</span>}
                      <span>{f.subject_name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Subject & Faculty Card */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden transition-all duration-300">
              {/* Subject Title Banner */}
              <div className="bg-gradient-to-r from-[#123B70] to-[#1D4ED8] p-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                      Evaluated Subject
                    </span>
                    <h2 className="text-2xl font-black text-white mt-0.5 tracking-tight">
                      {activeFaculty.subject_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-blue-100 font-medium">Faculty In-Charge:</span>
                      <span className="text-sm font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-lg border border-white/20">
                        {activeFaculty.name}
                      </span>
                      <span className="text-xs text-blue-200">({activeFaculty.designation})</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-blue-200 uppercase font-bold block">Current Average Score</span>
                    <div className="text-3xl font-black text-white mt-0.5 flex items-center justify-end gap-1">
                      <span>{calculateSubjectAvg(activeRatingRecord?.ratings)}</span>
                      <span className="text-xs text-blue-200 font-normal">/ 5.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 10 Evaluation Criteria Questions */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wider">
                      Evaluation Criteria (Rate 1 to 5)
                    </h3>
                    <p className="text-xs text-slate-500">
                      1 = Unsatisfactory • 2 = Fair • 3 = Good • 4 = Very Good • 5 = Excellent
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {EVALUATION_CRITERIA.map((criteria, cIdx) => {
                    const currentScore = activeRatingRecord?.ratings[criteria.key] || 5;

                    return (
                      <div
                        key={criteria.key}
                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-200 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="max-w-md">
                            <h4 className="text-xs font-bold text-[#172B4D]">
                              {cIdx + 1}. {criteria.label}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {criteria.desc}
                            </p>
                          </div>

                          {/* 1-5 Rating Button Group */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {[1, 2, 3, 4, 5].map(score => {
                              const isSelected = currentScore === score;
                              return (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() => updateCriteriaRating(activeFaculty.id, criteria.key, score)}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-bold text-xs transition cursor-pointer flex flex-col items-center justify-center shadow-2xs ${
                                    isSelected
                                      ? 'bg-[#123B70] text-white ring-2 ring-[#2563EB] shadow-xs scale-105'
                                      : 'bg-white border border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                  }`}
                                  title={`Rate ${score} of 5`}
                                >
                                  <span>{score}</span>
                                  {score === 5 && <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300 -mt-0.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons for Wizard */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handlePrevSubject}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {currentSubjectIdx === 0 ? 'Back to Setup' : 'Previous Subject'}
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSubject}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    {currentSubjectIdx === facultyList.length - 1 ? (
                      <>
                        Comprehensive Questions
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Next Subject ({currentSubjectIdx + 2} of {facultyList.length})
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: THREE QUALITATIVE QUESTIONS                            */}
        {/* ============================================================== */}
        {currentStep === 'questions' && (
          <form onSubmit={handleProceedToReview} className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Step 3 of 4: Academic Observations
                </span>
                <h2 className="text-xl font-bold text-[#172B4D] mt-2">
                  Academic Improvement &amp; Subjective Feedback
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Your detailed answers help the Academic Dean and Department Heads address specific curriculum challenges.
                </p>
              </div>

              {/* Question 1 */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172B4D] mb-1.5 leading-snug">
                  1) Which subject are you finding most difficult, and which topics are challenging?{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={q1SubjectChallenges}
                  onChange={e => setQ1SubjectChallenges(e.target.value)}
                  placeholder="Specify the subject name (e.g. C&DS or LA&C) and describe the specific units or topics you find hard to comprehend..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-xs transition"
                />
              </div>

              {/* Question 2 */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172B4D] mb-1.5 leading-snug">
                  2) What is the most important improvement you expect from your faculty?{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={q2Improvements}
                  onChange={e => setQ2Improvements(e.target.value)}
                  placeholder="Explain constructive expectations (e.g. practical demonstrations, real-world examples, pace of lecturing, clearer study materials, doubt clearance sessions)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-xs transition"
                />
              </div>

              {/* Question 3 */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172B4D] mb-1.5 leading-snug">
                  3) Any additional comments or suggestions?{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={q3AdditionalComments}
                  onChange={e => setQ3AdditionalComments(e.target.value)}
                  placeholder="Share any other feedback, lab equipment concerns, textbook availability, or institutional recommendations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-xs transition"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSubjectIdx(facultyList.length - 1);
                    setCurrentStep('onboarding');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Faculty Ratings
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#123B70] hover:bg-[#0E2E57] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  Review Complete Feedback
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 4: REVIEW SCREEN (WITH COMMON FEEDBACK GRID TABLE)         */}
        {/* ============================================================== */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    Final Review
                  </span>
                  <h2 className="text-xl font-bold text-[#172B4D] mt-2">
                    Review Your Feedback Submission
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify all student information and the common criteria evaluation grid below before final submission.
                  </p>
                </div>
              </div>

              {/* Student Details Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#F4F7FB] border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Student Name</span>
                  <p className="font-bold text-[#172B4D]">{studentName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Roll Number</span>
                  <p className="font-mono font-bold text-[#123B70]">{rollNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Campus &amp; Branch</span>
                  <p className="font-bold text-slate-700">{campus} • {branch}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Feedback Type</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-[#123B70] text-white font-extrabold text-[11px]">
                    {feedbackType}
                  </span>
                </div>
              </div>

              {/* The Common Feedback Grid (Matching the User's Image!) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#123B70]">
                    Second: Common Feedback Grid
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#123B70] text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3.5 border-b border-white/20 sticky left-0 bg-[#123B70] z-10 min-w-[200px]">
                          Evaluation criteria
                        </th>
                        {facultyList.map((f, i) => (
                          <th key={f.id} className="py-3 px-3.5 border-b border-white/20 text-center min-w-[120px]">
                            <div className="font-bold text-white text-[11px]">{f.subject_name}</div>
                            <div className="text-[10px] text-blue-200 font-normal lowercase tracking-normal">
                              ({f.name})
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {EVALUATION_CRITERIA.map(c => (
                        <tr key={c.key} className="hover:bg-blue-50/30 transition">
                          <td className="py-2.5 px-3.5 font-medium text-slate-800 sticky left-0 bg-white">
                            {c.label}
                          </td>
                          {facultyList.map(f => {
                            const score = subjectRatings[f.id]?.ratings[c.key] || 5;
                            return (
                              <td key={f.id} className="py-2.5 px-3.5 text-center font-bold">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded font-mono ${
                                    score >= 4
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : score === 3
                                      ? 'bg-blue-50 text-blue-800'
                                      : 'bg-amber-50 text-amber-800'
                                  }`}
                                >
                                  {score} / 5
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Summary Average Row */}
                      <tr className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300">
                        <td className="py-3 px-3.5 text-[#123B70] sticky left-0 bg-slate-100">
                          Average Subject Score
                        </td>
                        {facultyList.map(f => (
                          <td key={f.id} className="py-3 px-3.5 text-center text-[#123B70] font-black text-sm">
                            {calculateSubjectAvg(subjectRatings[f.id]?.ratings)} ★
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Answers to the 3 Qualitative Questions */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-[#123B70] block mb-1">
                    1) Which subject are you finding most difficult, and which topics are challenging?
                  </span>
                  <p className="text-slate-700 whitespace-pre-wrap">{q1SubjectChallenges}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-[#123B70] block mb-1">
                    2) What is the most important improvement you expect from your faculty?
                  </span>
                  <p className="text-slate-700 whitespace-pre-wrap">{q2Improvements}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-[#123B70] block mb-1">
                    3) Any additional comments or suggestions?
                  </span>
                  <p className="text-slate-700 whitespace-pre-wrap">{q3AdditionalComments}</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep('questions')}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Edit Answers
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving to Database...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Confirm &amp; Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 5: SUCCESS CONFIRMATION                                   */}
        {/* ============================================================== */}
        {currentStep === 'success' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-lg border border-slate-200 text-center max-w-2xl mx-auto my-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            {/* Exact Required Success Message */}
            <h2 className="text-2xl sm:text-3xl font-black text-[#172B4D] tracking-tight mb-3">
              Thank you! Your feedback has been submitted successfully.
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              Your feedback for Roll Number <strong className="text-[#123B70] font-mono">{rollNumber}</strong> at{' '}
              <strong className="text-[#123B70]">{campus}</strong> ({branch} - {feedbackType}) has been permanently recorded in Neon Database.
            </p>

            <div className="bg-[#F4F7FB] border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left mb-8 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Reference ID:</span>
                <span className="font-mono font-bold text-[#123B70]">
                  #{submissionSuccessId ? String(submissionSuccessId).padStart(6, '0') : 'CONFIRMED'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Subjects Evaluated:</span>
                <span className="font-semibold text-slate-800">{facultyList.length} Subjects</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Evaluation Model:</span>
                <span className="font-semibold text-slate-800">10 Common Criteria Grid</span>
              </div>
              <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-400 text-center">
                Submissions are final and cannot be modified or deleted.
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#123B70] font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Submit Another Feedback
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
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
