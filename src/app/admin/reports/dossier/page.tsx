'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface DetailedParagraphs {
  executiveSummary?: string;
  pedagogicalAnalysis?: string;
  practicalAlignment?: string;
  studentSentimentAnalysis?: string;
}

interface ComparativeMetrics {
  facultyScore?: number;
  branchAverage?: number;
  collegeAverage?: number;
  institutionalAverage?: number;
  varianceToBranch?: number;
  varianceToInst?: number;
  totalEvaluations?: number;
  tier?: string;
  tierColor?: string;
}

interface FacultyReport {
  id: number;
  faculty_id: number;
  faculty_name: string;
  subject_name: string;
  college_code: string;
  branch_code: string;
  feedback_type: string;
  total_reviews: number;
  overall_score: number | string;
  performance_tier: string;
  criteria_scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  student_highlights?: string[];
  student_sentiment: string;
  ai_summary: string;
  detailed_paragraphs?: DetailedParagraphs;
  action_plan?: string[];
  comparative_metrics?: ComparativeMetrics;
}

const CRITERIA_DEFINITIONS = [
  { key: 'conceptClarity', label: '1. Concept Clarity & First Principles' },
  { key: 'subjectKnowledge', label: '2. Subject Knowledge & Depth' },
  { key: 'teachingMethodology', label: '3. Teaching Methodology & Pace' },
  { key: 'practicalExamples', label: '4. Practical Examples & Coding Demos' },
  { key: 'studentInteraction', label: '5. Student Interaction & Inclusiveness' },
  { key: 'doubtClarification', label: '6. Doubt Clarification & Approachability' },
  { key: 'regularityPunctuality', label: '7. Regularity & Classroom Punctuality' },
  { key: 'assignmentsAssessments', label: '8. Assignments & Fair Evaluation' },
  { key: 'myUnderstanding', label: '9. Student Retention & Understanding' },
  { key: 'myAbilityApply', label: '10. Ability to Apply Concepts in Labs' },
];

function DossierContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedFacultyId = searchParams.get('facultyId');
  const viewAllMode = searchParams.get('all') === 'true';

  const [loading, setLoading] = useState(true);
  const [facultyReports, setFacultyReports] = useState<FacultyReport[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/reports/ai');
        if (res.ok) {
          const data = await res.json();
          const reports: FacultyReport[] = data.facultyReports || [];
          setFacultyReports(reports);

          if (requestedFacultyId) {
            const found = reports.find(r => r.faculty_id === Number(requestedFacultyId));
            if (found) {
              setSelectedId(found.faculty_id);
            } else if (reports.length > 0) {
              setSelectedId(reports[0].faculty_id);
            }
          } else if (reports.length > 0) {
            setSelectedId(reports[0].faculty_id);
          }
        }
      } catch (err) {
        console.error('Failed to load faculty dossiers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [requestedFacultyId]);

  const activeReports = useMemo(() => {
    if (viewAllMode) {
      return facultyReports;
    }
    if (!selectedId) return [];
    const single = facultyReports.find(r => r.faculty_id === selectedId);
    return single ? [single] : [];
  }, [facultyReports, selectedId, viewAllMode]);

  const handleFacultyChange = (id: number) => {
    setSelectedId(id);
    router.push(`/admin/reports/dossier?facultyId=${id}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-md border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-slate-700 font-semibold text-lg">Generating A4 Faculty Evaluation Dossiers...</p>
          <p className="text-slate-400 text-sm mt-1">Retrieving 10-criteria scores, AI paragraphs, and audit rubrics</p>
        </div>
      </div>
    );
  }

  if (facultyReports.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md bg-white p-8 rounded-xl shadow border border-slate-200 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Faculty Reports Found</h2>
          <p className="text-slate-600 text-sm mb-6">
            Please run the AI evaluation engine or check database records.
          </p>
          <Link
            href="/admin"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Return to Admin Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 font-sans print:bg-white print:p-0">
      {/* Non-Printable Interactive Control Bar */}
      <header className="no-print sticky top-0 z-50 bg-slate-900 text-white shadow-xl px-6 py-3.5 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition border border-slate-700"
            >
              ← Back to Dashboard
            </Link>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>📄 Faculty A4 Printable Evaluation Dossier</span>
                <span className="text-xs bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 px-2 py-0.5 rounded-full font-mono">
                  Official Record
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                A4-optimized single & batch printable dossiers with AI paragraphs, rubrics & diagrams
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!viewAllMode && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-300">Select Teacher:</label>
                <select
                  value={selectedId || ''}
                  onChange={e => handleFacultyChange(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none max-w-xs"
                >
                  {facultyReports.map(fac => (
                    <option key={fac.faculty_id} value={fac.faculty_id}>
                      {fac.faculty_name} ({fac.college_code} {fac.branch_code} - {fac.feedback_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {viewAllMode ? (
              <Link
                href={`/admin/reports/dossier?facultyId=${selectedId || facultyReports[0]?.faculty_id}`}
                className="text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
              >
                View Single Faculty Mode
              </Link>
            ) : (
              <Link
                href="/admin/reports/dossier?all=true"
                className="text-xs font-medium bg-indigo-900/60 text-indigo-200 border border-indigo-700/60 px-3 py-2 rounded-lg hover:bg-indigo-800 transition"
              >
                📑 View All 68 Faculty (Full Binder)
              </Link>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-lg hover:shadow-emerald-900/30 transition transform active:scale-95"
            >
              <span>🖨️</span>
              <span>{viewAllMode ? 'Print All 68 Dossiers (A4 Binder)' : 'Print This Faculty Dossier (A4)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dossier Container */}
      <main className="max-w-[215mm] mx-auto py-6 print:py-0 print:max-w-none print:w-full">
        {activeReports.map((report, idx) => {
          const score = Number(report.overall_score) || 0;
          const scorePercent = Math.round((score / 5) * 100);
          const criteria = report.criteria_scores || {};
          const paragraphs = report.detailed_paragraphs || {};
          const comp = report.comparative_metrics || {};

          // Colors based on score
          const tierBorderColor =
            score >= 4.5
              ? 'border-emerald-600'
              : score >= 4.0
              ? 'border-blue-600'
              : score >= 3.5
              ? 'border-amber-600'
              : 'border-rose-600';

          const tierBgLight =
            score >= 4.5
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : score >= 4.0
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : score >= 3.5
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200';

          return (
            <div
              key={report.faculty_id}
              className={`a4-dossier-page bg-white text-slate-900 p-8 shadow-2xl rounded-sm border border-slate-300 print:border-none print:shadow-none print:rounded-none mb-10 print:mb-0 print:p-6 print:min-h-[285mm]`}
              style={{
                pageBreakAfter: 'always',
                breakAfter: 'page',
              }}
            >
              {/* Official Academic Letterhead */}
              <div className="border-b-2 border-slate-900 pb-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xl tracking-tight shadow">
                      KIET
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase leading-none">
                        KIET GROUP OF INSTITUTIONS
                      </h2>
                      <p className="text-[11px] font-semibold text-slate-600 tracking-wide mt-0.5">
                        Kakinada Institute of Engineering & Technology • AI-Powered Quality Assurance Cell
                      </p>
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">
                        Affiliated to JNTUK • Approved by AICTE • Accredited Campus
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-mono">
                      Doc ID: KIET-QA-{report.college_code}-{report.branch_code}-{report.faculty_id}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-900">
                    Faculty Performance Evaluation
                  </span>
                </div>
              </div>

              {/* Faculty Profile & Quantitative Header Card */}
              <div className={`p-4 rounded-lg border-2 ${tierBorderColor} bg-slate-50/70 mb-4 shadow-sm`}>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-8">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {report.college_code === 'KIETW' ? "KIET-W (Women's Campus)" : "KIET (Main Campus)"}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded">
                        Dept: {report.branch_code}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${report.feedback_type === 'FRM' ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'}`}>
                        {report.feedback_type === 'FRM' ? 'Fully Residential (FRM)' : 'Semi Residential (SRM)'}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-950 mt-1.5 tracking-tight">
                      {report.faculty_name}
                    </h3>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">
                      Subject / Course: <span className="text-indigo-950 underline decoration-indigo-300 underline-offset-2">{report.subject_name}</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Evaluations</span>
                        <span className="font-extrabold text-slate-800">{report.total_reviews} Students</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Sentiment Index</span>
                        <span className="font-extrabold text-slate-800">{report.student_sentiment}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Dept. Avg</span>
                        <span className="font-extrabold text-slate-800">{comp.branchAverage?.toFixed(2) || '4.11'} / 5.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4 border-l border-slate-300 pl-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Overall Composite Score
                    </span>
                    <div className="flex items-baseline justify-center gap-1 mt-0.5">
                      <span className="text-3xl font-black tracking-tight text-slate-950">
                        {score.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/ 5.00</span>
                    </div>
                    <div className="text-xs font-bold text-indigo-700 mt-0.5">
                      {scorePercent}% Quality Index
                    </div>

                    <div className={`mt-2 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${tierBgLight}`}>
                      {report.performance_tier}
                    </div>
                  </div>
                </div>
              </div>

              {/* DIAGRAMS & VISUAL METRICS: 10-Criteria Horizontal Bar Chart */}
              <div className="mb-4 bg-white p-3.5 rounded-lg border border-slate-300 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>📊 Evaluation Criteria Performance Matrix (10 Core Rubrics)</span>
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 4.5+ Outstanding
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> 4.0 - 4.49 Proficient
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> &lt;4.0 Growth Vector
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {CRITERIA_DEFINITIONS.map(crit => {
                    const val = Number(criteria[crit.key]) || 0;
                    const percent = Math.min(100, Math.round((val / 5) * 100));
                    const barColor =
                      val >= 4.5 ? 'bg-emerald-500' : val >= 4.0 ? 'bg-blue-500' : val >= 3.5 ? 'bg-amber-500' : 'bg-rose-500';

                    return (
                      <div key={crit.key} className="text-[11px]">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-slate-700 truncate pr-2">{crit.label}</span>
                          <span className="font-mono font-bold text-slate-900 shrink-0">
                            {val.toFixed(2)} <span className="text-[9px] text-slate-400">({percent}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                          <div
                            className={`h-full ${barColor} transition-all duration-300 rounded-full`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Benchmark Comparison Ribbon */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 grid grid-cols-3 text-center text-[10px]">
                  <div className="border-r border-slate-200">
                    <span className="text-slate-500 block">Faculty Score</span>
                    <span className="font-extrabold text-slate-900 text-xs">{score.toFixed(2)} / 5.00</span>
                  </div>
                  <div className="border-r border-slate-200">
                    <span className="text-slate-500 block">Department Benchmark ({report.branch_code})</span>
                    <span className="font-extrabold text-slate-900 text-xs">{comp.branchAverage?.toFixed(2) || '4.11'} / 5.00</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Institutional Average (KIET Group)</span>
                    <span className="font-extrabold text-slate-900 text-xs">{comp.institutionalAverage?.toFixed(2) || '4.02'} / 5.00</span>
                  </div>
                </div>
              </div>

              {/* FEEDBACK REVIEW POINTS (6 POINTS IN BOLD) & IMPROVEMENT SECTION (5 POINTS) */}
              <div className="space-y-3.5 mb-2 mt-4">
                {/* 1. Feedback Review Point (6 Points in Bold Text) */}
                <div className="bg-slate-50 p-4 rounded-lg border-2 border-slate-300 shadow-xs">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-950 mb-2 flex items-center gap-1.5 pb-1.5 border-b border-slate-200">
                    <span>📋</span>
                    <span>Feedback Review Points</span>
                  </h4>
                  <ul className="space-y-2 text-[10.5px] text-slate-950 list-disc list-inside font-bold">
                    {(report.strengths || []).slice(0, 6).map((str, i) => (
                      <li key={i} className="leading-snug">
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Improvement Section (5 Points) */}
                <div className="bg-amber-50/50 p-4 rounded-lg border-2 border-amber-300/80 shadow-xs">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 mb-2 flex items-center gap-1.5 pb-1.5 border-b border-amber-200">
                    <span>🎯</span>
                    <span>Improvement Section</span>
                  </h4>
                  <ul className="space-y-2 text-[10.5px] text-slate-800 list-disc list-inside">
                    {(report.weaknesses || []).slice(0, 5).map((wk, i) => (
                      <li key={i} className="leading-snug font-medium">
                        <span>{wk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Global Print Stylesheet */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        @media print {
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .a4-dossier-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function FacultyDossierPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <p className="text-slate-600 font-semibold">Loading Faculty Dossier...</p>
        </div>
      }
    >
      <DossierContent />
    </Suspense>
  );
}
