import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProgressCharts } from "./progress-charts";
import { progressDataService, type ProgressMetrics } from "../services/progress-data";

export function ProgressAnalytics() {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
  
  // Fetch progress data using our new service
  const { data: progressMetrics, isLoading, error } = useQuery<ProgressMetrics>({
    queryKey: ["progress-metrics", timeRange],
    queryFn: () => progressDataService.getProgressMetrics(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleTimeRangeChange = (range: '1M' | '3M' | '6M' | '1Y') => {
    setTimeRange(range);
  };

  const handleExport = async () => {
    try {
      await progressDataService.exportProgressData(timeRange);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading progress analytics...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-destructive">Failed to load progress data. Using demo data.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!progressMetrics) {
    return null;
  }

  return (
    <section className="bg-muted/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProgressCharts
          data={progressMetrics}
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onExport={handleExport}
        />
      </div>
    </section>
  );
}
