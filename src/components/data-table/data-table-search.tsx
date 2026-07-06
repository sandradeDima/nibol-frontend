"use client";

import { SearchField } from "@/components/ui/search-field";

type DataTableSearchProps = {
  isBusy?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

/**
 * Shared global-search input used by every module table.
 */
export function DataTableSearch({
  isBusy = false,
  onChange,
  placeholder = "Search records",
  value,
}: DataTableSearchProps) {
  return (
    <SearchField
      isBusy={isBusy}
      onChange={onChange}
      placeholder={placeholder}
      value={value}
    />
  );
}
