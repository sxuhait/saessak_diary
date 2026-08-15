import { DAY_LABELS } from "@/lib/weekday";
import { labelClass } from "@/components/ui/form";

export function DayOfWeekCheckboxes({
  idPrefix,
  defaultValues = [],
}: {
  idPrefix: string;
  defaultValues?: number[];
}) {
  return (
    <fieldset>
      <legend className={labelClass}>요일 (여러 개 선택 가능)</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {DAY_LABELS.map((label, index) => (
          <label
            key={label}
            htmlFor={`${idPrefix}-day-${index}`}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-stone-300 px-2 py-2.5 text-sm text-stone-700 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700"
          >
            <input
              id={`${idPrefix}-day-${index}`}
              type="checkbox"
              name="day_of_week"
              value={index}
              defaultChecked={defaultValues.includes(index)}
              className="accent-emerald-600"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
