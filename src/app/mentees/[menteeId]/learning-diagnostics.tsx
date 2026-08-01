import {
  diagnoseLearning,
  type AttendanceInput,
  type DiagnosticSeverity,
  type SessionLogInput,
} from "@/lib/learning-diagnostics";

const SEVERITY_STYLES: Record<
  DiagnosticSeverity,
  { card: string; badge: string; label: string }
> = {
  critical: {
    card: "border-red-200 bg-red-50",
    badge: "bg-red-100 text-red-700",
    label: "경고",
  },
  warning: {
    card: "border-amber-200 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    label: "주의",
  },
  info: {
    card: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    label: "정상",
  },
};

export function LearningDiagnostics({
  logs,
  attendance,
}: {
  logs: SessionLogInput[];
  attendance: AttendanceInput[];
}) {
  const findings = diagnoseLearning({ logs, attendance });

  return (
    <div className="w-full rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-medium text-stone-500">학습 진단</h2>

      <div className="mt-3 flex flex-col gap-2">
        {findings.map((finding) => {
          const style = SEVERITY_STYLES[finding.severity];
          return (
            <div key={finding.id} className={`rounded-lg border p-3 ${style.card}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
                >
                  {style.label}
                </span>
                <p className="text-sm font-medium text-stone-900">{finding.title}</p>
              </div>
              <p className="mt-1 text-xs text-stone-600">{finding.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
