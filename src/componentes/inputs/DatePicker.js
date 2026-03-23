// src/componentes/inputs/DatePicker.jsx
import ReactDatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("es", es);

const DatePicker = ({ value, onChange, placeholder = "dd/mm/yyyy", className = "", minDate = null }) => {
    const dateValue = value ? new Date(value + "T00:00:00") : null;

    const handleChange = (date) => {
        if (!date) { onChange(""); return; }
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        onChange(`${yyyy}-${mm}-${dd}`);
    };

    return (
        <ReactDatePicker
            selected={dateValue}
            onChange={handleChange}
            dateFormat="dd/MM/yyyy"
            locale="es"
            placeholderText={placeholder}
            className={`hs-datepicker-input ${className}`}
            calendarClassName="hs-datepicker-calendar"
            wrapperClassName="hs-datepicker-wrapper"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            isClearable
            autoComplete="off"
            minDate={minDate}
            popperProps={{ strategy: "fixed" }}
            popperPlacement="bottom-start"
            portalId="datepicker-portal"
        />
    );
};

export default DatePicker;