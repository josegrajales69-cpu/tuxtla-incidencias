import { 
  DashboardAnalyticsResponse, 
  IAnalyticsRepository, 
  AnalyticsRange 
} from '../ports/IAnalyticsRepository';

export class GetAnalyticsUseCase {
  constructor(private readonly analyticsRepo: IAnalyticsRepository) {}

  async execute(range?: AnalyticsRange, granularity: 'day' | 'week' | 'month' = 'day'): Promise<DashboardAnalyticsResponse> {
    return this.analyticsRepo.getSummaryMetrics(range, granularity);
  }
}
