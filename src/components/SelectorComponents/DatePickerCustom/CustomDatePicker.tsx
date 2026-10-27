import React from 'react';
import { Select } from 'antd';
import { CookieSharp } from '@mui/icons-material';

const { Option } = Select;

interface CustomDatePickerProps {
  // year: number | undefined;
  // setYear: React.Dispatch<React.SetStateAction<number | undefined>>;
  // month: string | undefined;
  // setMonth: React.Dispatch<React.SetStateAction<string | undefined>>;
  // day: number | undefined;
  // setDay: React.Dispatch<React.SetStateAction<number | undefined>>;
  onDateChange: (formattedDate: string) => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  // year,
  // setYear,
  // month,
  // setMonth,
  // day,
  // setDay,
  onDateChange,
}) => {
  const months = [
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ];

  const handleDateChange = () => {
    // console.log({ year, month, day })
    // if (year && month && day) {
    //     const formattedDate = `${year}-${month}-${String(day).padStart(2, "0")}`;
    //     onDateChange(formattedDate);
    // } else {
    //     onDateChange("");
    // }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <Select
          placeholder="Year"
          // value={year}
          // onChange={(value) => {
          //     setYear(value);
          //     handleDateChange();
          // }}
          style={{ width: '120px' }}
          allowClear
        >
          {Array.from({ length: 368 }, (_, i) => 1500 + i).map((y) => (
            <Select.Option key={y} value={y}>
              {y}
            </Select.Option>
          ))}
        </Select>

        <Select
          placeholder="Month"
          // value={month}
          // onChange={(value) => {
          //     setMonth(value);
          //     handleDateChange();
          // }}
          style={{ width: '140px' }}
          allowClear
        >
          {months.map((m) => (
            <Select.Option key={m.value} value={m.value}>
              {m.label}
            </Select.Option>
          ))}
        </Select>

        <Select
          placeholder="Day"
          // value={day}
          // onChange={(value) => {
          //     setDay(value); // Directly setting the value
          //     handleDateChange(); // Call handleDateChange to update formatted date
          // }}
          style={{ width: '100px' }}
          allowClear
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <Select.Option key={d} value={d}>
              {d}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default CustomDatePicker;

// import React, { useState } from "react";
// import { DatePicker } from "antd";
// import dayjs from "dayjs";

// const CustomDatePicker: React.FC = () => {
//     // Initialize the date state with a valid dayjs object
//     const [date, setDate] = useState<dayjs.Dayjs | null>(dayjs('1501-01-01', 'YYYY-MM-DD'));

//     const handleDateChange = (value: dayjs.Dayjs | null) => {
//         setDate(value);
//         if (value) {
//             const formattedDate = value.format("YYYY-MMM-DD");
//         }
//     };

//     const disabledDate = (current: dayjs.Dayjs) => {
//         return current.year() < 1500 || current.year() > 1867;
//     };

//     return (
//         <div>
//             <div></div>
//             <DatePicker
//                 placeholder="Year in the range 1500 - 1867"
//                 value={date}
//                 onChange={handleDateChange}
//                 format="YYYY-MMMM-DD"
//                 disabledDate={disabledDate} // Disable dates outside the range
//                 style={{ width: "300px" }}
//                 allowClear
//             />
//         </div>
//     );
// };

// export default CustomDatePicker;
