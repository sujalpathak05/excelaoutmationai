export interface ExcelData {
  headers: string[];
  rows: any[][];
  sheetName: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'combo' | 'histogram' | 'scatter';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      type?: string;
      yAxisID?: string;
      pointStyle?: string;
      pointRadius?: number;
      fill?: boolean;
      tension?: number;
    }[];
  };
  options: {
    responsive: boolean;
    maintainAspectRatio?: boolean;
    interaction?: {
      intersect: boolean;
      mode: string;
    };
    plugins: {
      title: {
        display: boolean;
        text: string;
        font?: {
          size: number;
          weight: string;
        };
        padding?: number;
      };
      legend: {
        display: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
        labels?: {
          usePointStyle?: boolean;
          padding?: number;
        };
      };
      tooltip?: {
        callbacks?: any;
      };
      annotation?: {
        annotations?: any;
      };
    };
    scales?: {
      x?: {
        display?: boolean;
        title?: {
          display: boolean;
          text: string;
        };
        grid?: {
          display: boolean;
        };
      };
      y?: {
        beginAtZero?: boolean;
        title?: {
          display: boolean;
          text: string;
        };
        grid?: {
          display: boolean;
        };
        position?: string;
      };
      y1?: {
        type: string;
        position: string;
        beginAtZero?: boolean;
        title?: {
          display: boolean;
          text: string;
        };
        grid?: {
          drawOnChartArea: boolean;
        };
      };
    };
  };
}

export interface ChartAnnotation {
  type: 'line' | 'box' | 'point' | 'label';
  value?: number;
  label?: string;
  color?: string;
  position?: string;
}

export interface AIAnalysis {
  chartType: string;
  title: string;
  description: string;
  insights: string[];
  config: ChartConfig;
  annotations?: ChartAnnotation[];
  statistics?: {
    mean?: number;
    median?: number;
    max?: number;
    min?: number;
    stdDev?: number;
    total?: number;
  };
}