/**
 * Chart Visualization Type Definitions
 * 
 * Type-safe interfaces for data visualization components
 */

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'bubble' | 'scatter';

export type ChartPaletteName = 'default' | 'vibrant' | 'pastel' | 'dark' | 'monochrome' | 'categorical';

export type ChartAnimationType = 'none' | 'fade' | 'slide' | 'stagger' | 'progressive';

export type ChartLegendPosition = 'top' | 'bottom' | 'left' | 'right';

export type ChartLegendAlign = 'start' | 'center' | 'end';

export type ChartTooltipMode = 'index' | 'nearest' | 'point' | 'dataset' | 'x' | 'y';

export type ChartAxisType = 'linear' | 'logarithmic' | 'category' | 'time';

export interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartDataset {
  label: string;
  data: number[] | ChartDataPoint[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  pointStyle?: 'circle' | 'cross' | 'crossRot' | 'dash' | 'line' | 'rect' | 'rectRounded' | 'rectRot' | 'star' | 'triangle';
  borderDash?: number[];
  hidden?: boolean;
  stack?: string;
  order?: number;
}

export interface ChartLegendConfig {
  display: boolean;
  position: ChartLegendPosition;
  align: ChartLegendAlign;
  labels?: {
    color?: string;
    font?: ChartFontConfig;
    padding?: number;
    usePointStyle?: boolean;
    pointStyle?: string;
    boxWidth?: number;
    boxHeight?: number;
  };
}

export interface ChartTooltipConfig {
  enabled: boolean;
  mode?: ChartTooltipMode;
  backgroundColor?: string;
  titleColor?: string;
  bodyColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  cornerRadius?: number;
  displayColors?: boolean;
  titleFont?: ChartFontConfig;
  bodyFont?: ChartFontConfig;
  callbacks?: {
    title?: (context: any) => string | string[];
    label?: (context: any) => string | string[];
    footer?: (context: any) => string | string[];
  };
}

export interface ChartFontConfig {
  family?: string;
  size?: number;
  weight?: number | string;
  style?: 'normal' | 'italic' | 'oblique';
  lineHeight?: number | string;
}

export interface ChartGridConfig {
  display: boolean;
  color?: string;
  drawBorder?: boolean;
  drawTicks?: boolean;
  tickLength?: number;
  offset?: boolean;
  lineWidth?: number;
  borderDash?: number[];
}

export interface ChartTickConfig {
  color?: string;
  font?: ChartFontConfig;
  padding?: number;
  callback?: (value: any, index: number, ticks: any[]) => string;
  display?: boolean;
  autoSkip?: boolean;
  maxRotation?: number;
  minRotation?: number;
}

export interface ChartScaleConfig {
  type?: ChartAxisType;
  display?: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
  grid?: ChartGridConfig;
  ticks?: ChartTickConfig;
  title?: {
    display?: boolean;
    text?: string;
    color?: string;
    font?: ChartFontConfig;
    padding?: number;
  };
  border?: {
    display?: boolean;
    color?: string;
    width?: number;
  };
  stacked?: boolean;
  beginAtZero?: boolean;
  min?: number;
  max?: number;
  suggestedMin?: number;
  suggestedMax?: number;
}

export interface ChartAnimationConfig {
  duration?: number;
  easing?: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInQuart' | 'easeOutQuart' | 'easeInOutQuart';
  delay?: number;
  loop?: boolean;
  onComplete?: () => void;
  onProgress?: (animation: any) => void;
}

export interface ChartInteractionConfig {
  mode?: ChartTooltipMode;
  intersect?: boolean;
  axis?: 'x' | 'y' | 'xy' | 'r';
}

export interface ChartPluginConfig {
  legend?: ChartLegendConfig;
  tooltip?: ChartTooltipConfig;
  title?: {
    display?: boolean;
    text?: string | string[];
    color?: string;
    font?: ChartFontConfig;
    padding?: number;
    align?: 'start' | 'center' | 'end';
  };
  subtitle?: {
    display?: boolean;
    text?: string | string[];
    color?: string;
    font?: ChartFontConfig;
    padding?: number;
    align?: 'start' | 'center' | 'end';
  };
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
  resizeDelay?: number;
  devicePixelRatio?: number;
  plugins?: ChartPluginConfig;
  scales?: {
    x?: ChartScaleConfig;
    y?: ChartScaleConfig;
    [key: string]: ChartScaleConfig | undefined;
  };
  animation?: ChartAnimationConfig | boolean;
  interaction?: ChartInteractionConfig;
  onClick?: (event: any, elements: any[]) => void;
  onHover?: (event: any, elements: any[]) => void;
  locale?: string;
}

export interface ChartConfig {
  type: ChartType;
  labels: string[];
  datasets: ChartDataset[];
  options?: ChartOptions;
}

export interface ChartExportOptions {
  filename?: string;
  format?: 'svg' | 'png' | 'jpeg' | 'webp';
  quality?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export interface ChartTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    neutral: string;
    accent: string;
  };
  textColor: string;
  gridColor: string;
  borderColor: string;
  backgroundColor: string;
  tooltipBackground: string;
  tooltipText: string;
}

export interface ChartKPI {
  label: string;
  value: string | number;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
  description?: string;
  color?: string;
}

export interface ChartFilterConfig {
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  minValue?: number;
  maxValue?: number;
  aggregation?: 'sum' | 'average' | 'count' | 'min' | 'max';
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface ChartDataTransform {
  filter?: (data: any[]) => any[];
  map?: (data: any[]) => any[];
  reduce?: (data: any[], initial: any) => any;
  sort?: (a: any, b: any) => number;
  aggregate?: (data: any[], key: string) => any;
}

export interface ChartMetadata {
  title?: string;
  subtitle?: string;
  description?: string;
  source?: string;
  lastUpdated?: Date;
  author?: string;
  tags?: string[];
}

export interface ChartEventData {
  event: MouseEvent | TouchEvent;
  elements: any[];
  dataset?: ChartDataset;
  dataIndex?: number;
  value?: number;
  label?: string;
}

export interface ChartColorScheme {
  name: string;
  colors: string[];
  alphaColors?: string[];
  accessible: boolean;
  wcagLevel: 'AA' | 'AAA';
  darkMode?: boolean;
}

export interface ChartSeriesConfig {
  name: string;
  type?: ChartType;
  data: number[] | ChartDataPoint[];
  color?: string;
  visible?: boolean;
  yAxisID?: string;
  stack?: string;
}

export interface ChartAxisFormatter {
  format: (value: any) => string;
  parse?: (value: string) => any;
}

export interface ChartAnnotation {
  type: 'line' | 'box' | 'point' | 'label';
  xMin?: number | string;
  xMax?: number | string;
  yMin?: number;
  yMax?: number;
  borderColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  label?: {
    content?: string;
    enabled?: boolean;
    position?: 'start' | 'center' | 'end';
  };
}

export interface ChartLoadingState {
  loading: boolean;
  progress?: number;
  message?: string;
}

export interface ChartErrorState {
  error: boolean;
  message?: string;
  code?: string;
  retryable?: boolean;
}

export interface ChartEmptyState {
  title?: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const DEFAULT_CHART_OPTIONS: Partial<ChartOptions> = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'start'
    },
    tooltip: {
      enabled: true,
      mode: 'index'
    }
  },
  interaction: {
    mode: 'index',
    intersect: false
  }
};

export const CHART_COLOR_PALETTE: Record<string, string> = {
  primary: 'rgba(44, 90, 160, 1)',
  secondary: 'rgba(66, 136, 206, 1)',
  success: 'rgba(117, 199, 127, 1)',
  warning: 'rgba(240, 201, 115, 1)',
  error: 'rgba(237, 127, 127, 1)',
  info: 'rgba(125, 184, 238, 1)',
  neutral: 'rgba(158, 158, 158, 1)',
  accent: 'rgba(171, 130, 255, 1)'
};

export const CHART_ANIMATION_PRESETS: Record<string, ChartAnimationConfig> = {
  none: { duration: 0 },
  fast: { duration: 400, easing: 'easeOutQuart' },
  normal: { duration: 750, easing: 'easeInOutQuart' },
  slow: { duration: 1200, easing: 'easeInOutCubic' }
};

export const CHART_ASPECT_RATIOS: Record<string, number> = {
  ultrawide: 21 / 9,
  wide: 16 / 9,
  standard: 4 / 3,
  square: 1,
  portrait: 3 / 4
};
