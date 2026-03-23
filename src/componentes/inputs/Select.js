// src/componentes/inputs/SelectInput.jsx
import ReactSelect from "react-select";

const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: "38px",
        height: "38px",
        borderRadius: "8px",
        border: state.isFocused ? "1.5px solid #3b82f6" : "1.5px solid #e2e8f0",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(59,130,246,.1)" : "none",
        backgroundColor: "#fff",
        cursor: "pointer",
        transition: "border-color .2s",
        "&:hover": { borderColor: "#3b82f6" },
    }),
    valueContainer: (base) => ({
        ...base,
        height: "38px",
        padding: "0 10px",
    }),
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        color: "#374151",
        fontSize: ".85rem",
    }),
    singleValue: (base) => ({
        ...base,
        color: "#374151",
        fontSize: ".85rem",
    }),
    placeholder: (base) => ({
        ...base,
        color: "#94a3b8",
        fontSize: ".85rem",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
        ...base,
        color: "#94a3b8",
        padding: "0 8px",
        "&:hover": { color: "#3b82f6" },
    }),
    clearIndicator: (base) => ({
        ...base,
        color: "#94a3b8",
        padding: "0 4px",
        "&:hover": { color: "#dc2626" },
    }),
    menu: (base) => ({
        ...base,
        borderRadius: "10px",
        border: "1.5px solid #e2e8f0",
        boxShadow: "0 8px 24px rgba(0,0,0,.12)",
        zIndex: 9999,
        overflow: "hidden",
    }),
    menuList: (base) => ({
        ...base,
        padding: "4px",
    }),
    option: (base, state) => ({
        ...base,
        borderRadius: "6px",
        fontSize: ".85rem",
        color: state.isSelected ? "#fff" : "#374151",
        backgroundColor: state.isSelected
            ? "#3b82f6"
            : state.isFocused
                ? "#eff6ff"
                : "transparent",
        cursor: "pointer",
        "&:active": { backgroundColor: "#dbeafe" },
    }),
    noOptionsMessage: (base) => ({
        ...base,
        fontSize: ".85rem",
        color: "#94a3b8",
    }),
};

const SelectInput = ({
    options = [],          // [{ value, label }]
    value,                 // string o number — el value seleccionado
    onChange,              // (value) => void  — devuelve el value directo, no el objeto
    placeholder = "Seleccionar...",
    isClearable = true,
    isDisabled = false,
    minWidth,
}) => {
    const selected = options.find(o => String(o.value) === String(value)) || null;

    return (
        <ReactSelect
            options={options}
            value={selected}
            onChange={opt => onChange(opt ? opt.value : "")}
            placeholder={placeholder}
            isClearable={isClearable}
            isDisabled={isDisabled}
            styles={{
                ...selectStyles,
                container: (base) => ({
                    ...base,
                    minWidth: minWidth || "auto",
                }),
            }}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            noOptionsMessage={() => "Sin opciones"}
        />
    );
};

export default SelectInput;