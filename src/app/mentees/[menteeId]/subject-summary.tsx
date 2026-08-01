type SessionLog = {
  session_date: string;
  subject: string | null;
  progress: string | null;
};

type SubjectRow = {
  subject: string;
  lastDate: Date;
  daysAgo: number;
  lastProgress: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(from: Date, to: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toMidnight.getTime() - fromMidnight.getTime()) / msPerDay);
}

const STALE_THRESHOLD_DAYS = 14;

export function SubjectSummary({ logs }: { logs: SessionLog[] }) {
  const today = new Date();
  const rows: SubjectRow[] = [];
  const seen = new Set<string>();

  // logs is expected sorted by session_date desc, so the first log we see
  // for a subject is that subject's most recent one.
  for (const log of logs) {
    if (!log.subject || seen.has(log.subject)) continue;
    seen.add(log.subject);
    const lastDate = parseLocalDate(log.session_date);
    rows.push({
      subject: log.subject,
      lastDate,
      daysAgo: daysBetween(lastDate, today),
      lastProgress: log.progress,
    });
  }

  rows.sort((a, b) => a.daysAgo - b.daysAgo);

  return (
    <div className="w-full rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-medium text-stone-500">과목별 학습 현황</h2>

      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">
          과목이 기록된 일지가 아직 없습니다.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                <th className="py-2 pr-3 font-medium">과목</th>
                <th className="py-2 pr-3 font-medium">마지막 학습일</th>
                <th className="py-2 pr-3 font-medium">경과</th>
                <th className="py-2 font-medium">최근 진도</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const stale = row.daysAgo >= STALE_THRESHOLD_DAYS;
                return (
                  <tr
                    key={row.subject}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <td className="py-2 pr-3 font-medium text-stone-900">
                      {row.subject}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-stone-700">
                      {dateFormatter.format(row.lastDate)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className="text-stone-700">
                        {row.daysAgo === 0 ? "오늘" : `${row.daysAgo}일 전`}
                      </span>
                      {stale && (
                        <span className="ml-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          {Math.floor(row.daysAgo / 7)}주째 안 함
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-stone-700">
                      {row.lastProgress ?? (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
