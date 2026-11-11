'use client';

import React, { useState, useEffect } from 'react';
import {
  School,
  GraduationCap,
  Building2,
  BookOpen,
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
  ShieldCheck,
  Lock,
  FileSpreadsheet,
  Info
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

// The 10 official evaluation criteria from institutional standard
const EVALUATION_CRITERIA = [
  { key: 'conceptClarity', label: 'Concept clarity', desc: 'Clarity in explaining fundamental concepts, definitions and principles' },
  { key: 'subjectKnowledge', label: 'Subject knowledge', desc: 'Depth of subject mastery, technical authority & syllabus coverage' },
  { key: 'teachingMethodology', label: 'Teaching methodology', desc: 'Effective instructional pace, clear presentation & pedagogy' },
  { key: 'practicalExamples', label: 'Practical examples', desc: 'Real-world application, industry case studies & live demonstrations' },
  { key: 'studentInteraction', label: 'Student interaction', desc: 'Encouraging questions, two-way dialogue & classroom engagement' },
  { key: 'doubtClarification', label: 'Doubt clarification', desc: 'Patience, availability & thoroughness in solving student queries' },
  { key: 'regularityPunctuality', label: 'Regularity and punctuality', desc: 'Class timing, adherence to schedule & disciplined attendance' },
  { key: 'assignmentsAssessments', label: 'Assignments and assessments', desc: 'Quality of tests, relevant practice problems & constructive remarks' },
  { key: 'myUnderstanding', label: 'My understanding of the subject', desc: 'How effectively the teaching helps me master difficult topics' },
  { key: 'myAbilityApply', label: 'My ability to apply concepts', desc: 'Empowering problem-solving, laboratory exercises & practical skills' },
] as const;

type CriteriaKey = typeof EVALUATION_CRITERIA[number]['key'];

interface SubjectRatingRecord {
  facultyId: number;
  facultyName: string;
  subjectName: string;
  ratings: Record<CriteriaKey, number>;
}

// Rating Scale Definitions with color schemes
const RATING_SCALE = [
  { score: 1, label: 'Unsatisfactory', color: 'bg-rose-50 text-rose-700 border-rose-300', activeColor: 'bg-rose-600 text-white ring-2 ring-rose-400' },
  { score: 2, label: 'Fair', color: 'bg-orange-50 text-orange-700 border-orange-300', activeColor: 'bg-orange-500 text-white ring-2 ring-orange-300' },
  { score: 3, label: 'Good', color: 'bg-amber-50 text-amber-800 border-amber-300', activeColor: 'bg-amber-500 text-white ring-2 ring-amber-300' },
  { score: 4, label: 'Very Good', color: 'bg-blue-50 text-blue-800 border-blue-300', activeColor: 'bg-[#2563EB] text-white ring-2 ring-blue-300' },
  { score: 5, label: 'Excellent', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', activeColor: 'bg-emerald-600 text-white ring-2 ring-emerald-400' },
];

export default function StudentFeedbackPortal() {
  // Steps: 'details' -> 'onboarding' -> 'questions' -> 'review' -> 'success'
  const [currentStep, setCurrentStep] = useState<'details' | 'onboarding' | 'questions' | 'review' | 'success'>('details');

  // Form State
  // Name is OPTIONAL; Roll Number is MANDATORY; Email & Phone REMOVED
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  // Course Setup
  const [campus, setCampus] = useState<'KIET' | 'KIETW' | ''>('');
  const [branch, setBranch] = useState('');
  const [feedbackType, setFeedbackType] = useState<'FRM' | 'SRM' | ''>('');

  // Available Branches
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Faculty and Subjects
  const [facultyList, setFacultyList] = useState<FacultySubject[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  // Onboarding ratings state
  const [subjectRatings, setSubjectRatings] = useState<Record<number, SubjectRatingRecord>>({});
  const [currentSubjectIdx, setCurrentSubjectIdx] = useState(0);

  // 3 Qualitative Questions
  const [q1SubjectChallenges, setQ1SubjectChallenges] = useState('');
  const [q2Improvements, setQ2Improvements] = useState('');
  const [q3AdditionalComments, setQ3AdditionalComments] = useState('');

  // UI Flow State
  const [submitting, setSubmitting] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionSuccessId, setSubmissionSuccessId] = useState<number | null>(null);

  // Fetch branches when campus changes
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

  // Fetch faculty and subjects when campus, branch, and Type are chosen
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

            // Initialize ratings with 0 (no default rating; student must select 1 to 5)
            const initialMap: Record<number, SubjectRatingRecord> = {};
            data.faculty.forEach((f: FacultySubject) => {
              const emptyRatings: Record<CriteriaKey, number> = {
                conceptClarity: 0,
                subjectKnowledge: 0,
                teachingMethodology: 0,
                practicalExamples: 0,
                studentInteraction: 0,
                doubtClarification: 0,
                regularityPunctuality: 0,
                assignmentsAssessments: 0,
                myUnderstanding: 0,
                myAbilityApply: 0,
              };
              initialMap[f.id] = {
                facultyId: f.id,
                facultyName: f.name,
                subjectName: f.subject_name || 'General',
                ratings: emptyRatings,
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

  // Validate Step 1 (Roll Number mandatory, Name optional)
  const validateStep1 = (): string | null => {
    if (!rollNumber.trim() || rollNumber.trim().length < 3) {
      return 'Please enter your Roll Number. Roll Number is mandatory.';
    }
    if (!campus) {
      return 'Please select your Campus (KIET or KIET-W).';
    }
    if (!branch) {
      return 'Please select your Branch.';
    }
    if (!feedbackType) {
      return 'Please select Type (FRM or SRM).';
    }
    if (facultyList.length === 0) {
      return `No active subjects or faculty found for ${campus} • ${branch} • ${feedbackType}.`;
    }
    return null;
  };

  // Start Onboarding
  const handleStartOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const error = validateStep1();
    if (error) {
      setErrorMessage(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.warn('Check duplicate returned non-JSON response:', res.status, text);
      }

      if (data?.isDuplicate) {
        setErrorMessage(data.message || 'Duplicate submission detected for this roll number and faculty.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setCurrentSubjectIdx(0);
      setCurrentStep('onboarding');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Duplicate pre-check error:', err);
      setCurrentStep('onboarding');
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Update criteria rating
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

  // Wizard navigation
  const handleNextSubject = () => {
    if (activeFaculty) {
      const activeRecord = subjectRatings[activeFaculty.id];
      const unrated = EVALUATION_CRITERIA.filter(
        c => !activeRecord?.ratings[c.key] || activeRecord.ratings[c.key] === 0
      );
      if (unrated.length > 0) {
        setErrorMessage(
          `Please rate all 10 criteria for "${activeFaculty.subject_name}" before continuing (${unrated.length} unrated).`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setErrorMessage(null);
    if (currentSubjectIdx < facultyList.length - 1) {
      setCurrentSubjectIdx(idx => idx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentStep('questions');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSubject = () => {
    setErrorMessage(null);
    if (currentSubjectIdx > 0) {
      setCurrentSubjectIdx(idx => idx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentStep('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Validate all ratings and 3 questions before Review
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Verify all subjects have all criteria rated
    for (let i = 0; i < facultyList.length; i++) {
      const fac = facultyList[i];
      const record = subjectRatings[fac.id];
      const unrated = EVALUATION_CRITERIA.filter(
        c => !record?.ratings[c.key] || record.ratings[c.key] === 0
      );
      if (unrated.length > 0) {
        setCurrentSubjectIdx(i);
        setCurrentStep('onboarding');
        setErrorMessage(
          `Please rate all 10 evaluation criteria for "${fac.subject_name}" (${unrated.length} unrated).`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (!q1SubjectChallenges.trim()) {
      setErrorMessage('Please answer Question 1: Difficult subject and challenging topics.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!q2Improvements.trim()) {
      setErrorMessage('Please answer Question 2: Expected improvements from faculty.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!q3AdditionalComments.trim()) {
      setErrorMessage('Please answer Question 3: Additional comments or suggestions.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submit to Neon DB
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Ensure all criteria are rated
      for (const fac of facultyList) {
        const item = subjectRatings[fac.id];
        const unrated = EVALUATION_CRITERIA.filter(
          c => !item?.ratings[c.key] || item.ratings[c.key] === 0
        );
        if (unrated.length > 0) {
          setErrorMessage(`Incomplete rating: Please rate all criteria for "${fac.subject_name}".`);
          setSubmitting(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      const ratingsPayload = facultyList.map(f => {
        const item = subjectRatings[f.id];
        return {
          facultyId: f.id,
          subjectName: f.subject_name,
          conceptClarity: item.ratings.conceptClarity,
          subjectKnowledge: item.ratings.subjectKnowledge,
          teachingMethodology: item.ratings.teachingMethodology,
          practicalExamples: item.ratings.practicalExamples,
          studentInteraction: item.ratings.studentInteraction,
          doubtClarification: item.ratings.doubtClarification,
          regularityPunctuality: item.ratings.regularityPunctuality,
          assignmentsAssessments: item.ratings.assignmentsAssessments,
          myUnderstanding: item.ratings.myUnderstanding,
          myAbilityApply: item.ratings.myAbilityApply,
        };
      });

      const payload = {
        studentName: studentName.trim() || 'Anonymous',
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

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Submission returned non-JSON error:', res.status, text);
        setErrorMessage(`Server error (${res.status}): Please check database connection in Vercel settings.`);
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to submit feedback. Please check your entries.');
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

  const activeFaculty = facultyList[currentSubjectIdx];
  const activeRatingRecord = activeFaculty ? subjectRatings[activeFaculty.id] : null;

  const calculateSubjectAvg = (ratings?: Record<CriteriaKey, number>) => {
    if (!ratings) return '--';
    const values = Object.values(ratings).filter(v => v > 0);
    if (values.length === 0) return '--';
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(1);
  };

  const getSubjectRatedCount = (ratings?: Record<CriteriaKey, number>) => {
    if (!ratings) return 0;
    return Object.values(ratings).filter(v => v > 0).length;
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between">
      {/* Header */}
      <header className="bg-[#123B70] text-white shadow-md border-b-4 border-[#2563EB] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3.5 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="bg-white px-2.5 py-1.5 rounded-xl shadow-xs border border-white/20 shrink-0 flex items-center justify-center">
              <img src="/kiet-logo.png" alt="KIET College Logo" className="h-8 sm:h-9 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white leading-tight">
                KIET &amp; KIET Women’s College (KIET-W)
              </h1>
              <p className="text-[11px] sm:text-xs text-blue-100 font-medium">
                Academic Student Evaluation Portal
              </p>
            </div>
          </div>

          {currentStep !== 'details' && currentStep !== 'success' && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Roll No: {rollNumber} • {campus} ({branch})
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 sm:px-6 flex-1">
        {/* Prominent Confidentiality Notice Banner (Visible while filling form) */}
        {currentStep !== 'success' && (
          <div className="mb-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300/80 p-4 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <h4 className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-sm">
                  <span>🔒 100% Confidential Evaluation</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Privacy Guaranteed
                  </span>
                </h4>
                <p className="text-emerald-900 mt-0.5 leading-relaxed font-medium">
                  Your feedback and ratings will <strong>NOT be visible to anyone</strong>, including your faculty or peers. All evaluations are encrypted and aggregated strictly for academic institutional improvement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-xs">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider">Please Check</h3>
                <p className="text-xs text-red-700 mt-0.5 font-medium">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: ROLL NUMBER (MANDATORY), NAME (OPTIONAL), & COURSE SETUP */}
        {/* ============================================================== */}
        {currentStep === 'details' && (
          <form onSubmit={handleStartOnboarding} className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#172B4D]">Student Academic Evaluation</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your Roll Number to begin. Student name is optional. Mail and phone number are not required.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#123B70] text-xs font-semibold border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                  Direct Student Access
                </div>
              </div>

              {/* 1. Student Identity (Roll Number Mandatory, Name Optional) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B70]">
                  <GraduationCap className="w-4 h-4 text-[#2563EB]" />
                  <span>1. Student Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Roll Number - MANDATORY */}
                  <div>
                    <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                      Roll Number <span className="text-red-500 font-black">* (Mandatory)</span>
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

                  {/* Student Name - OPTIONAL */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Student Name</span>
                      <span className="text-[10px] font-bold text-slate-400 lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      placeholder="Optional (leave blank to submit anonymously)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-xs transition"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Campus, Branch & Type Selection */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B70]">
                  <Building2 className="w-4 h-4 text-[#2563EB]" />
                  <span>2. Academic Campus &amp; Classification</span>
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

                  {/* Renamed Section to only "Type" */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
                      Type <span className="text-red-500">*</span>
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

              {/* Start Button */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={checkingDuplicates || loadingFaculty || !campus || !branch || !feedbackType || facultyList.length === 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#123B70] hover:bg-[#0E2E57] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {checkingDuplicates ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking Roll Number...
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
            {/* HIGHLIGHTED EVALUATION CRITERIA SCALE BANNER (AS REQUESTED) */}
            <div className="bg-gradient-to-r from-blue-900 via-[#123B70] to-indigo-900 text-white p-5 rounded-2xl shadow-lg border-2 border-blue-400/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-white/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-400 text-slate-900 font-black text-xs">
                    ★ SCALE
                  </span>
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                    Evaluation Criteria (Rate 1 to 5)
                  </h3>
                </div>
                <div className="text-[11px] text-blue-200 font-semibold">
                  Tap any number (1 to 5) below to rate each criteria
                </div>
              </div>

              {/* Colorful Highlighted Scale Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-rose-400/30 text-center">
                  <span className="inline-block w-6 h-6 rounded-lg bg-rose-500 text-white font-black text-xs leading-6 mb-1">
                    1
                  </span>
                  <p className="text-xs font-bold text-rose-200">Unsatisfactory</p>
                  <p className="text-[10px] text-white/70">Needs major work</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-orange-400/30 text-center">
                  <span className="inline-block w-6 h-6 rounded-lg bg-orange-500 text-white font-black text-xs leading-6 mb-1">
                    2
                  </span>
                  <p className="text-xs font-bold text-orange-200">Fair</p>
                  <p className="text-[10px] text-white/70">Partially meets</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-amber-400/30 text-center">
                  <span className="inline-block w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs leading-6 mb-1">
                    3
                  </span>
                  <p className="text-xs font-bold text-amber-200">Good</p>
                  <p className="text-[10px] text-white/70">Satisfactory</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-blue-400/30 text-center">
                  <span className="inline-block w-6 h-6 rounded-lg bg-blue-500 text-white font-black text-xs leading-6 mb-1">
                    4
                  </span>
                  <p className="text-xs font-bold text-blue-200">Very Good</p>
                  <p className="text-[10px] text-white/70">Above expectations</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-400/30 text-center col-span-2 sm:col-span-1">
                  <span className="inline-block w-6 h-6 rounded-lg bg-emerald-500 text-white font-black text-xs leading-6 mb-1">
                    5
                  </span>
                  <p className="text-xs font-bold text-emerald-300">Excellent ★</p>
                  <p className="text-[10px] text-white/70">Outstanding</p>
                </div>
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Faculty Evaluation Progress
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#123B70] text-[11px] font-extrabold">
                    Subject {currentSubjectIdx + 1} of {facultyList.length}
                  </span>
                </div>

                {/* Rated Criteria Status */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                      getSubjectRatedCount(activeRatingRecord?.ratings) === EVALUATION_CRITERIA.length
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {getSubjectRatedCount(activeRatingRecord?.ratings) === EVALUATION_CRITERIA.length ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>All 10 Criteria Rated</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span>
                          {getSubjectRatedCount(activeRatingRecord?.ratings)} / {EVALUATION_CRITERIA.length} Criteria Rated
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#123B70] via-[#2563EB] to-emerald-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentSubjectIdx + 1) / facultyList.length) * 100}%` }}
                />
              </div>

              {/* Subject Indicator Pills */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                {facultyList.map((f, idx) => {
                  const isComplete = getSubjectRatedCount(subjectRatings[f.id]?.ratings) === EVALUATION_CRITERIA.length;
                  const isCurrent = idx === currentSubjectIdx;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCurrentSubjectIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#123B70] text-white shadow-xs scale-102'
                          : isComplete
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isComplete ? <Check className="w-3 h-3 text-emerald-600" /> : <span>{idx + 1}.</span>}
                      <span>{f.subject_name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Subject & Faculty Card */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
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
                    <span className="text-[11px] text-blue-200 uppercase font-bold block">Current Subject Score</span>
                    <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 flex items-center justify-end gap-1">
                      <span>{calculateSubjectAvg(activeRatingRecord?.ratings)}</span>
                      {calculateSubjectAvg(activeRatingRecord?.ratings) !== '--' && (
                        <span className="text-xs text-blue-200 font-normal">/ 5.0</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 10 Evaluation Criteria Questions with Enhanced Interactive Styling */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-4">
                  {EVALUATION_CRITERIA.map((criteria, cIdx) => {
                    const currentScore = activeRatingRecord?.ratings[criteria.key] || 0;
                    const isRated = currentScore > 0;
                    const activeDef = RATING_SCALE.find(s => s.score === currentScore);

                    return (
                      <div
                        key={criteria.key}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                          isRated
                            ? 'bg-white border-slate-300 shadow-2xs'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="max-w-md">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                                  isRated ? 'bg-emerald-100 text-emerald-800 font-black' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isRated ? <Check className="w-3 h-3 text-emerald-600" /> : cIdx + 1}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-[#172B4D]">
                                {criteria.label}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 pl-7 leading-relaxed">
                              {criteria.desc}
                            </p>
                          </div>

                          {/* Interactive Score Selector */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 pl-7 lg:pl-0">
                            {/* Live Badge indicator */}
                            <span
                              className={`text-[11px] font-bold px-3 py-1 rounded-xl text-center border transition-all ${
                                isRated && activeDef
                                  ? activeDef.color
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {isRated && activeDef ? `${currentScore} • ${activeDef.label}` : 'Select Rating (1 to 5)'}
                            </span>

                            {/* 1-5 Button Row with Interactive Design */}
                            <div className="flex items-center gap-1.5">
                              {RATING_SCALE.map(({ score, label, activeColor }) => {
                                const isSelected = currentScore === score;
                                return (
                                  <button
                                    key={score}
                                    type="button"
                                    onClick={() => updateCriteriaRating(activeFaculty.id, criteria.key, score)}
                                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-black text-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center ${
                                      isSelected
                                        ? `${activeColor} shadow-md scale-110 -translate-y-0.5`
                                        : 'bg-white border border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50/60 hover:scale-105'
                                    }`}
                                    title={`${score} - ${label}`}
                                  >
                                    <span className="text-sm">{score}</span>
                                    {score === 5 && (
                                      <Star
                                        className={`w-2.5 h-2.5 -mt-0.5 ${
                                          isSelected ? 'text-amber-300 fill-amber-300' : 'text-slate-300'
                                        }`}
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
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
        {/* STEP 4: REVIEW SCREEN (COMMON FEEDBACK GRID TABLE)             */}
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
                    Verify your evaluation grid below before final submission. Submissions are strictly permanent.
                  </p>
                </div>
              </div>

              {/* Student Details Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#F4F7FB] border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Roll Number</span>
                  <p className="font-mono font-bold text-[#123B70]">{rollNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Student Name</span>
                  <p className="font-bold text-[#172B4D]">{studentName.trim() || 'Anonymous'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Campus &amp; Branch</span>
                  <p className="font-bold text-slate-700">{campus} • {branch}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Type</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-[#123B70] text-white font-extrabold text-[11px]">
                    {feedbackType}
                  </span>
                </div>
              </div>

              {/* Common Feedback Grid */}
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
                        {facultyList.map(f => (
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
                            const score = subjectRatings[f.id]?.ratings[c.key] || 0;
                            return (
                              <td key={f.id} className="py-2.5 px-3.5 text-center font-bold">
                                {score > 0 ? (
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded font-mono text-xs ${
                                      score === 5
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : score === 4
                                        ? 'bg-blue-50 text-blue-800'
                                        : score === 3
                                        ? 'bg-amber-50 text-amber-800'
                                        : 'bg-rose-50 text-rose-800'
                                    }`}
                                  >
                                    {score} / 5
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">Unrated</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Average Row */}
                      <tr className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300">
                        <td className="py-3 px-3.5 text-[#123B70] sticky left-0 bg-slate-100">
                          Average Subject Score
                        </td>
                        {facultyList.map(f => {
                          const avg = calculateSubjectAvg(subjectRatings[f.id]?.ratings);
                          return (
                            <td key={f.id} className="py-3 px-3.5 text-center text-[#123B70] font-black text-sm">
                              {avg !== '--' ? `${avg} ★` : '--'}
                            </td>
                          );
                        })}
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
            <div className="flex justify-center mb-5">
              <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs inline-flex items-center">
                <img src="/kiet-logo.png" alt="KIET College Logo" className="h-10 w-auto object-contain" />
              </div>
            </div>

            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#172B4D] tracking-tight mb-3">
              Thank you! Your feedback has been submitted successfully.
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              Your feedback for Roll Number <strong className="text-[#123B70] font-mono">{rollNumber}</strong> at{' '}
              <strong className="text-[#123B70]">{campus}</strong> ({branch} - {feedbackType}) has been permanently saved.
            </p>

            <div className="bg-[#F4F7FB] border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left mb-8 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Reference ID:</span>
                <span className="font-mono font-bold text-[#123B70]">
                  #{submissionSuccessId ? String(submissionSuccessId).padStart(6, '0') : 'CONFIRMED'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Student Name:</span>
                <span className="font-semibold text-slate-800">{studentName.trim() || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Subjects Evaluated:</span>
                <span className="font-semibold text-slate-800">{facultyList.length} Subjects</span>
              </div>
              <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-400 text-center">
                Submissions are permanent and cannot be modified or deleted.
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
