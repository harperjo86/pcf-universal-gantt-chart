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
  onFilterChange: (filterValues: { [fieldName: string]: string }) => void;
}> = ({ filterColumns, onFilterChange }) => {
  const [selectedFilters, setSelectedFilters] = React.useState<{
    [fieldName: string]: string;
  }>({});

  const handleFilterChange = (fieldName: string, value: string) => {
    const newFilters = {
      ...selectedFilters,
      [fieldName]: value,
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
        alignItems: "center",
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
          <select
            value={selectedFilters[col.fieldName] || ""}
            onChange={(e) => handleFilterChange(col.fieldName, e.target.value)}
            style={{
              padding: "6px 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "13px",
              minWidth: "150px",
              cursor: "pointer",
            }}
          >
            <option value="">All</option>
            {col.distinctValues.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {Object.keys(selectedFilters).some((key) => selectedFilters[key]) && (
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
