import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const SearchAndFilters = ({ 
  searchQuery, 
  onSearchChange, 
  dateRange, 
  onDateRangeChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'size-desc', label: 'Largest First' },
    { value: 'size-asc', label: 'Smallest First' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Main Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <div className="relative">
            <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search records by name, content, or doctor..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            iconName="Grid3X3"
            onClick={() => onViewModeChange('grid')}
            className="h-10 w-10"
          />
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            iconName="List"
            onClick={() => onViewModeChange('list')}
            className="h-10 w-10"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          iconName="Filter"
          iconPosition="left"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="whitespace-nowrap"
        >
          Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {isFilterOpen && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Filter */}
            <div>
              <Select
                label="Date Range"
                options={dateRangeOptions}
                value={dateRange}
                onChange={onDateRangeChange}
              />
            </div>

            {/* Sort Options */}
            <div>
              <Select
                label="Sort By"
                options={sortOptions}
                value={sortBy}
                onChange={onSortChange}
              />
            </div>

            {/* File Type Filter */}
            <div>
              <Select
                label="File Type"
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'pdf', label: 'PDF Documents' },
                  { value: 'image', label: 'Images' },
                  { value: 'document', label: 'Word Documents' }
                ]}
                value="all"
                onChange={() => {}}
              />
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="From Date"
                className="w-full"
              />
              <Input
                type="date"
                label="To Date"
                className="w-full"
              />
            </div>
          )}

          {/* Filter Actions */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              iconName="RotateCcw"
              iconPosition="left"
              onClick={() => {
                onSearchChange('');
                onDateRangeChange('all');
                onSortChange('date-desc');
              }}
            >
              Reset Filters
            </Button>
            <Button
              variant="default"
              size="sm"
              iconName="Search"
              iconPosition="left"
              onClick={() => setIsFilterOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;