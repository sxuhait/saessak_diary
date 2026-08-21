import { DAY_LABELS } from "@/lib/weekday";
import { ColorPicker } from "@/components/color-picker";
import { labelClass, fieldClass } from "@/components/ui/form";
import type { ClassColor } from "@/lib/class-colors";

const WEEKDAYS = [1, 2, 3, 4, 5]; // 월~금 -- schedule_items uses full 0~6 range in the DB, but the center only operates weekdays.

export function ScheduleItemFields({
  idPrefix,
  defaultValues,
}: {
  idPrefix: string;
  defaultValues?: {
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
    title?: string;
    subtitle?: string;
    color?: ClassColor;
  };
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="min-w-0">
          <label htmlFor={`${idPrefix}-day`} className={labelClass}>
            요일
          </label>
          <select
            id={`${idPrefix}-day`}
            name="day_of_week"
            defaultValue={defaultValues?.day_of_week ?? 1}
            className={fieldClass}
          >
            {WEEKDAYS.map((day) => (
              <option key={day} value={day}>
                {DAY_LABELS[day]}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor={`${idPrefix}-start`} className={labelClass}>
            시작 시간
          </label>
          <input
            id={`${idPrefix}-start`}
            name="start_time"
            type="time"
            required
            defaultValue={defaultValues?.start_time}
            className={fieldClass}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor={`${idPrefix}-end`} className={labelClass}>
            종료 시간
          </label>
          <input
            id={`${idPrefix}-end`}
            name="end_time"
            type="time"
            required
            defaultValue={defaultValues?.end_time}
            className={fieldClass}
          />
        </div>

        <div className="min-w-0">
          <label className={labelClass}>색</label>
          <ColorPicker name="color" defaultValue={defaultValues?.color ?? "sky"} />
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-title`} className={labelClass}>
          프로그램명
        </label>
        <input
          id={`${idPrefix}-title`}
          name="title"
          type="text"
          required
          placeholder="예: 로봇조립"
          defaultValue={defaultValues?.title}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-subtitle`} className={labelClass}>
          대상/장소 (선택)
        </label>
        <input
          id={`${idPrefix}-subtitle`}
          name="subtitle"
          type="text"
          placeholder="예: 대상: 연극부"
          defaultValue={defaultValues?.subtitle ?? ""}
          className={fieldClass}
        />
      </div>
    </>
  );
}
