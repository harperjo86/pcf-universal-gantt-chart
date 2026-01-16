import * as React from "react";

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterColumnInfo = {
  name: string;
  fieldName: string;
  distinctValues: FilterOption[];
};

export const FilterHeader: React.FunctionComponent<{
  filterColumns?: FilterColumnInfo[];
  onFilterChange: (filterValues: { [fieldName: string]: string[] }) => void;
}> = ({ filterColumns, onFilterChange }) => {
  const [selectedFilters, setSelectedFilters] = React.useState<{
    [fieldName: string]: string[];
  }>({});
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const handleCheckboxChange = (fieldName: string, value: string, checked: boolean) => {
    const currentValues = selectedFilters[fieldName] || [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter((v) => v !== value);
    }
    
    const newFilters = {
      ...selectedFilters,
      [fieldName]: newValues,
    };
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setSelectedFilters({});
    onFilterChange({});
  };

  if (!filterColumns || filterColumns.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "12px",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #e0e0e0",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {filterColumns.map((col) => (
        <div
          key={col.fieldName}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            position: "relative",
          }}
        >
          <label
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            {col.name}
          </label>
          <button
            onClick={() =>
              setOpenDropdown(
                openDropdown === col.fieldName ? null : col.fieldName
              )
            }
            style={{
              padding: "6px 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "13px",
              minWidth: "150px",
              cursor: "pointer",
              backgroundColor: "white",
              textAlign: "left",
            }}
          >
            {(selectedFilters[col.fieldName]?.length || 0) > 0
              ? `${selectedFilters[col.fieldName].length} selected`
              : "All"}
          </button>
          {openDropdown === col.fieldName && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                zIndex: 1000,
                minWidth: "150px",
                maxHeight: "250px",
                overflowY: "auto",
                marginTop: "4px",
              }}
            >
              {col.distinctValues.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                    fontSize: "13px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedFilters[col.fieldName]?.includes(opt.value) || false
                    }
                    onChange={(e) =>
                      handleCheckboxChange(col.fieldName, opt.value, e.target.checked)
                    }
                    style={{
                      marginRight: "8px",
                      cursor: "pointer",
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      {Object.keys(selectedFilters).some(
        (key) => (selectedFilters[key]?.length || 0) > 0
      ) && (
        <button
          onClick={handleClearFilters}
          style={{
            marginTop: "24px",
            padding: "6px 12px",
            backgroundColor: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
