import styles from "./MonthRangeSelect.module.css";

export type MonthOption = {
  value: string;
  label: string;
};

type MonthRangeSelectProps = {
  fromMonth: string;
  toMonth: string;
  options: MonthOption[];
  onRangeChange: (range: { fromMonth: string; toMonth: string }) => void;
};

const MonthRangeSelect = ({
  fromMonth,
  toMonth,
  options,
  onRangeChange,
}: MonthRangeSelectProps) => {
  const handleFromMonthChange = (nextFromMonth: string) => {
    const nextToMonth = nextFromMonth > toMonth ? nextFromMonth : toMonth;
    onRangeChange({
      fromMonth: nextFromMonth,
      toMonth: nextToMonth,
    });
  };

  const handleToMonthChange = (nextToMonth: string) => {
    const nextFromMonth = nextToMonth < fromMonth ? nextToMonth : fromMonth;
    onRangeChange({
      fromMonth: nextFromMonth,
      toMonth: nextToMonth,
    });
  };

  return (
    <div className={styles.dateRangeFields}>
      <label className={styles.dateRangeField}>
        <span className={styles.dateRangeLabelText}>From</span>
        <select
          value={fromMonth}
          onChange={(event) => handleFromMonthChange(event.target.value)}
          className={styles.dateRangeFromSelect}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.dateRangeField}>
        <span className={styles.dateRangeLabelText}>To</span>
        <select
          value={toMonth}
          onChange={(event) => handleToMonthChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default MonthRangeSelect;
