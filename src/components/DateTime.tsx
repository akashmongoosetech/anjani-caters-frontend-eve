import React from "react";

interface DateTimeProps {
  value: string | Date;
  className?: string;
}

const formatDateTime = (value: string | Date): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

return date.toLocaleString("en-IN", {
     day: "2-digit",
     month: "short",
     year: "numeric",
     hour: "numeric",
     minute: "2-digit",
     hour12: true,
   });
};

const DateTime: React.FC<DateTimeProps> = ({ value, className }) => {
  return <span className={className}>{formatDateTime(value)}</span>;
};

export default DateTime;

export { formatDateTime };