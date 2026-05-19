import React from "react";
import { ITransactionFilters } from "../models/Transaction.model";
import Button from "./Button";

export interface ITransactionsFilterProps {
  filters: ITransactionFilters;
  onFilterChange: (filters: ITransactionFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

const filterContainerStyle: React.CSSProperties = {
  background: "#f9fafb",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "20px",
  border: "1px solid #e5e7eb"
};

const inputRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "12px"
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  flex: "1 1 140px"
};

const TransactionsFilter: React.FC<ITransactionsFilterProps> = ({
  filters,
  onFilterChange,
  onApply,
  onClear
}) => {
  const handleChange = (key: keyof ITransactionFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div style={filterContainerStyle}>
      <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>Filter Transactions</h3>
      
      <div style={inputRowStyle}>
        <input 
          type="date" 
          value={filters.dateFrom || ""} 
          onChange={(e) => handleChange("dateFrom", e.target.value)} 
          style={inputStyle}
          placeholder="From Date"
        />
        <input 
          type="date" 
          value={filters.dateTo || ""} 
          onChange={(e) => handleChange("dateTo", e.target.value)} 
          style={inputStyle}
          placeholder="To Date"
        />
        <select 
          value={filters.status || ""} 
          onChange={(e) => handleChange("status", e.target.value)}
          style={inputStyle}
        >
          <option value="">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Denied">Denied</option>
          <option value="Void">Void</option>
        </select>
      </div>

      <div style={inputRowStyle}>
        <input 
          type="number" 
          value={filters.minAmount || ""} 
          onChange={(e) => handleChange("minAmount", e.target.value ? Number(e.target.value) : undefined)} 
          style={inputStyle}
          placeholder="Min Amount"
        />
        <input 
          type="number" 
          value={filters.maxAmount || ""} 
          onChange={(e) => handleChange("maxAmount", e.target.value ? Number(e.target.value) : undefined)} 
          style={inputStyle}
          placeholder="Max Amount"
        />
        <input 
          type="text" 
          value={filters.keyword || ""} 
          onChange={(e) => handleChange("keyword", e.target.value)} 
          style={{ ...inputStyle, flex: "2 1 200px" }}
          placeholder="Search description..."
        />
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={onClear}>Clear</Button>
        <Button variant="primary" onClick={onApply}>Apply Filters</Button>
      </div>
    </div>
  );
};

export default TransactionsFilter;
