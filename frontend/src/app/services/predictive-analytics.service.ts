import { Injectable } from '@angular/core';

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictions: number[];
}

export interface PipelineForecast {
  date: string;
  predictedValue: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface CloseProbability {
  dossierId: number;
  probability: number;
  factors: {
    responseTime: number;
    stageProgression: number;
    engagement: number;
    source: number;
  };
  recommendation: string;
}

@Injectable({
  providedIn: 'root'
})
export class PredictiveAnalyticsService {

  constructor() { /* no-op */ }

  performLinearRegression(xValues: number[], yValues: number[]): LinearRegressionResult {
    if (xValues.length !== yValues.length || xValues.length === 0) {
      throw new Error('Invalid input data for regression');
    }

    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictions = xValues.map(x => slope * x + intercept);
    const meanY = sumY / n;
    const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
    const ssResidual = yValues.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    return { slope, intercept, rSquared, predictions };
  }

  forecastPipelineValue(historicalData: { date: string; value: number }[], daysAhead: number): PipelineForecast[] {
    if (historicalData.length < 2) {
      return [];
    }

    const xValues = historicalData.map((_, i) => i);
    const yValues = historicalData.map(d => d.value);

    const regression = this.performLinearRegression(xValues, yValues);
    
    const stdDev = this.calculateStdDev(yValues, regression.predictions.slice(0, yValues.length));
    
    const forecasts: PipelineForecast[] = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);

    for (let i = 1; i <= daysAhead; i++) {
      const xValue = historicalData.length + i - 1;
      const predictedValue = regression.slope * xValue + regression.intercept;
      
      const confidence = Math.max(0, Math.min(100, regression.rSquared * 100));
      
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);

      const uncertaintyFactor = Math.sqrt(i);
      forecasts.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedValue: Math.max(0, predictedValue),
        confidence,
        upperBound: Math.max(0, predictedValue + stdDev * uncertaintyFactor),
        lowerBound: Math.max(0, predictedValue - stdDev * uncertaintyFactor)
      });
    }

    return forecasts;
  }

  calculateCloseProbability(dossier: {
    id: number;
    averageResponseTimeHours: number;
    daysInCurrentStage: number;
    messageCount: number;
    appointmentCount: number;
    source: string;
    status: string;
  }): CloseProbability {
    let probability = 50;

    const responseTimeFactor = this.scoreResponseTime(dossier.averageResponseTimeHours);
    const stageProgressionFactor = this.scoreStageProgression(dossier.status, dossier.daysInCurrentStage);
    const engagementFactor = this.scoreEngagement(dossier.messageCount, dossier.appointmentCount);
    const sourceFactor = this.scoreSource(dossier.source);

    probability += responseTimeFactor * 0.25;
    probability += stageProgressionFactor * 0.30;
    probability += engagementFactor * 0.30;
    probability += sourceFactor * 0.15;

    probability = Math.max(0, Math.min(100, probability));

    const recommendation = this.generateRecommendation(probability, {
      responseTimeFactor,
      stageProgressionFactor,
      engagementFactor,
      sourceFactor
    });

    return {
      dossierId: dossier.id,
      probability,
      factors: {
        responseTime: responseTimeFactor,
        stageProgression: stageProgressionFactor,
        engagement: engagementFactor,
        source: sourceFactor
      },
      recommendation
    };
  }

  private calculateStdDev(actual: number[], predicted: number[]): number {
    const residuals = actual.map((y, i) => y - predicted[i]);
    const sumSquaredResiduals = residuals.reduce((sum, r) => sum + r * r, 0);
    return Math.sqrt(sumSquaredResiduals / actual.length);
  }

  private scoreResponseTime(avgResponseTimeHours: number): number {
    if (avgResponseTimeHours <= 1) return 20;
    if (avgResponseTimeHours <= 4) return 10;
    if (avgResponseTimeHours <= 24) return 0;
    if (avgResponseTimeHours <= 48) return -10;
    return -20;
  }

  private scoreStageProgression(status: string, daysInStage: number): number {
    const stageWeights: Record<string, number> = {
      'NEW': 0,
      'QUALIFYING': 10,
      'QUALIFIED': 20,
      'APPOINTMENT': 30,
      'PROPOSAL': 35,
      'NEGOTIATION': 40,
      'WON': 50,
      'LOST': -50
    };

    let score = stageWeights[status] || 0;

    if (daysInStage > 30) {
      score -= 15;
    } else if (daysInStage > 14) {
      score -= 10;
    } else if (daysInStage > 7) {
      score -= 5;
    }

    return score;
  }

  private scoreEngagement(messageCount: number, appointmentCount: number): number {
    let score = 0;

    if (messageCount > 10) {
      score += 20;
    } else if (messageCount > 5) {
      score += 15;
    } else if (messageCount > 2) {
      score += 10;
    } else if (messageCount > 0) {
      score += 5;
    }

    if (appointmentCount > 2) {
      score += 15;
    } else if (appointmentCount > 1) {
      score += 10;
    } else if (appointmentCount > 0) {
      score += 5;
    }

    return score;
  }

  private scoreSource(source: string): number {
    const sourceWeights: Record<string, number> = {
      'REFERRAL': 15,
      'WEBSITE': 10,
      'SOCIAL_MEDIA': 5,
      'PHONE': 5,
      'EMAIL': 3,
      'WALK_IN': 0,
      'OTHER': 0
    };

    return sourceWeights[source] || 0;
  }

  private generateRecommendation(probability: number, factors: any): string {
    if (probability >= 80) {
      return 'High probability - Schedule final negotiation';
    } else if (probability >= 60) {
      return 'Good probability - Continue nurturing with regular follow-ups';
    } else if (probability >= 40) {
      if (factors.responseTimeFactor < 0) {
        return 'Medium probability - Improve response time to increase chances';
      } else if (factors.engagementFactor < 5) {
        return 'Medium probability - Increase engagement through appointments';
      } else {
        return 'Medium probability - Address any concerns and provide additional value';
      }
    } else if (probability >= 20) {
      return 'Low probability - Re-qualify lead and adjust strategy';
    } else {
      return 'Very low probability - Consider reassigning or archiving';
    }
  }

  calculateTeamPerformanceTrend(
    performanceData: { date: string; metric: number }[],
    metricName: string
  ): { trend: 'improving' | 'declining' | 'stable'; changeRate: number } {
    if (performanceData.length < 2) {
      return { trend: 'stable', changeRate: 0 };
    }

    const xValues = performanceData.map((_, i) => i);
    const yValues = performanceData.map(d => d.metric);

    const regression = this.performLinearRegression(xValues, yValues);
    
    const avgMetric = yValues.reduce((a, b) => a + b, 0) / yValues.length;
    const changeRate = avgMetric !== 0 ? (regression.slope / avgMetric) * 100 : 0;

    let trend: 'improving' | 'declining' | 'stable';
    if (changeRate > 5) {
      trend = 'improving';
    } else if (changeRate < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return { trend, changeRate };
  }

  predictMarketTrend(
    historicalPrices: { date: string; avgPrice: number }[],
    forecastMonths: number
  ): { date: string; predictedPrice: number; confidence: number }[] {
    if (historicalPrices.length < 3) {
      return [];
    }

    const xValues = historicalPrices.map((_, i) => i);
    const yValues = historicalPrices.map(d => d.avgPrice);

    const regression = this.performLinearRegression(xValues, yValues);
    
    const predictions: { date: string; predictedPrice: number; confidence: number }[] = [];
    const lastDate = new Date(historicalPrices[historicalPrices.length - 1].date);

    for (let i = 1; i <= forecastMonths; i++) {
      const xValue = historicalPrices.length + i - 1;
      const predictedPrice = regression.slope * xValue + regression.intercept;
      
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(lastDate.getMonth() + i);

      const confidence = Math.max(0, Math.min(100, regression.rSquared * 100 * (1 - i * 0.05)));

      predictions.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedPrice: Math.max(0, predictedPrice),
        confidence
      });
    }

    return predictions;
  }
}
