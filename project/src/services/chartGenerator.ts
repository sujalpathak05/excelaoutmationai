import { ExcelData, ChartConfig, AIAnalysis, ChartAnnotation } from '../types';

export class ChartGenerator {
  // Mock OpenAI service - in production, this would call your backend API
  static async generateChartConfig(data: ExcelData): Promise<AIAnalysis> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const dataTypes = this.detectDataTypes(data);
    const analysis = this.analyzeData(data, dataTypes);
    
    return analysis;
  }

  private static detectDataTypes(data: ExcelData) {
    const types: { [key: string]: 'numeric' | 'text' | 'date' | 'percentage' } = {};
    
    data.headers.forEach((header, index) => {
      const sampleValues = data.rows.slice(0, 10).map(row => row[index]).filter(val => val != null);
      
      if (sampleValues.length === 0) {
        types[header] = 'text';
        return;
      }

      // Check for percentage values
      const percentageCount = sampleValues.filter(val => 
        String(val).includes('%') || (typeof val === 'number' && val <= 1 && val >= 0)
      ).length;

      const numericCount = sampleValues.filter(val => !isNaN(Number(val))).length;
      const dateCount = sampleValues.filter(val => !isNaN(Date.parse(val))).length;

      if (percentageCount / sampleValues.length > 0.6) {
        types[header] = 'percentage';
      } else if (numericCount / sampleValues.length > 0.8) {
        types[header] = 'numeric';
      } else if (dateCount / sampleValues.length > 0.8) {
        types[header] = 'date';
      } else {
        types[header] = 'text';
      }
    });

    return types;
  }

  private static analyzeData(data: ExcelData, dataTypes: { [key: string]: string }): AIAnalysis {
    const numericColumns = Object.entries(dataTypes)
      .filter(([_, type]) => type === 'numeric')
      .map(([header]) => header);
    
    const percentageColumns = Object.entries(dataTypes)
      .filter(([_, type]) => type === 'percentage')
      .map(([header]) => header);
    
    const textColumns = Object.entries(dataTypes)
      .filter(([_, type]) => type === 'text')
      .map(([header]) => header);

    // Determine the best chart type based on data characteristics
    if (numericColumns.length >= 2 && percentageColumns.length >= 1) {
      return this.createComboChart(data, textColumns[0], numericColumns, percentageColumns);
    } else if (numericColumns.length >= 2) {
      return this.createMultiSeriesChart(data, textColumns[0], numericColumns);
    } else if (numericColumns.length === 1) {
      return this.createSingleSeriesChart(data, textColumns[0], numericColumns[0]);
    } else {
      return this.createCountChart(data, textColumns[0]);
    }
  }

  private static createComboChart(data: ExcelData, labelColumn: string, numericColumns: string[], percentageColumns: string[]): AIAnalysis {
    const labelIndex = data.headers.indexOf(labelColumn);
    const primaryIndex = data.headers.indexOf(numericColumns[0]);
    const secondaryIndex = data.headers.indexOf(numericColumns[1] || numericColumns[0]);
    const percentageIndex = data.headers.indexOf(percentageColumns[0]);

    const labels = data.rows.map(row => String(row[labelIndex] || 'Unknown'));
    const primaryData = data.rows.map(row => Number(row[primaryIndex]) || 0);
    const secondaryData = data.rows.map(row => Number(row[secondaryIndex]) || 0);
    const percentageData = data.rows.map(row => {
      const val = row[percentageIndex];
      if (typeof val === 'string' && val.includes('%')) {
        return parseFloat(val.replace('%', ''));
      }
      return Number(val) * 100 || 0;
    });

    // Calculate statistics
    const statistics = {
      mean: primaryData.reduce((sum, val) => sum + val, 0) / primaryData.length,
      max: Math.max(...primaryData),
      min: Math.min(...primaryData),
      total: primaryData.reduce((sum, val) => sum + val, 0)
    };

    // Create annotations for highest and lowest points
    const maxIndex = primaryData.indexOf(statistics.max);
    const minIndex = primaryData.indexOf(statistics.min);

    const annotations: ChartAnnotation[] = [
      {
        type: 'point',
        value: maxIndex,
        label: 'Highest',
        color: '#10B981',
        position: 'top'
      },
      {
        type: 'point',
        value: minIndex,
        label: 'Lowest',
        color: '#EF4444',
        position: 'bottom'
      }
    ];

    const config: ChartConfig = {
      type: 'combo',
      data: {
        labels,
        datasets: [
          {
            label: numericColumns[0],
            data: primaryData,
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            borderWidth: 0,
            type: 'bar',
            yAxisID: 'y'
          },
          {
            label: numericColumns[1] || numericColumns[0],
            data: secondaryData,
            backgroundColor: '#F59E0B',
            borderColor: '#D97706',
            borderWidth: 0,
            type: 'bar',
            yAxisID: 'y'
          },
          {
            label: `${percentageColumns[0]} (%)`,
            data: percentageData,
            borderColor: '#10B981',
            backgroundColor: 'transparent',
            borderWidth: 3,
            type: 'line',
            yAxisID: 'y1',
            pointStyle: 'circle',
            pointRadius: 6,
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          title: {
            display: true,
            text: `${numericColumns[0]} and ${percentageColumns[0]} Analysis`,
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context: any) {
                if (context.datasetIndex === 2) {
                  return `Percentage: ${context.parsed.y.toFixed(1)}%`;
                }
                return `Value: ${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: labelColumn
            },
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: 'Values ($ billion)'
            },
            grid: {
              display: true
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Percentage (%)'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    };

    return {
      chartType: 'Combination Chart',
      title: `${numericColumns[0]} vs ${percentageColumns[0]} Analysis`,
      description: `This combination chart shows the relationship between ${numericColumns[0]}, ${numericColumns[1] || 'secondary values'}, and ${percentageColumns[0]} over time. The bars represent absolute values while the line shows percentage trends.`,
      insights: [
        `Highest ${numericColumns[0]}: ${statistics.max.toLocaleString()} (${labels[maxIndex]})`,
        `Lowest ${numericColumns[0]}: ${statistics.min.toLocaleString()} (${labels[minIndex]})`,
        `Average ${numericColumns[0]}: ${statistics.mean.toFixed(2)}`,
        `Total ${numericColumns[0]}: ${statistics.total.toLocaleString()}`,
        `Peak percentage: ${Math.max(...percentageData).toFixed(1)}%`,
        `Data points analyzed: ${labels.length}`
      ],
      config,
      annotations,
      statistics
    };
  }

  private static createMultiSeriesChart(data: ExcelData, labelColumn: string, numericColumns: string[]): AIAnalysis {
    const labelIndex = data.headers.indexOf(labelColumn);
    const labels = data.rows.map(row => String(row[labelIndex] || 'Unknown'));

    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
    ];

    const datasets = numericColumns.slice(0, 4).map((column, index) => {
      const columnIndex = data.headers.indexOf(column);
      const columnData = data.rows.map(row => Number(row[columnIndex]) || 0);
      
      return {
        label: column,
        data: columnData,
        backgroundColor: colors[index],
        borderColor: colors[index],
        borderWidth: 0
      };
    });

    // Find highest value across all series
    const allValues = datasets.flatMap(dataset => dataset.data);
    const maxValue = Math.max(...allValues);
    const maxIndex = allValues.indexOf(maxValue);

    const config: ChartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Multi-Series Analysis: ${numericColumns.slice(0, 4).join(', ')}`,
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: labelColumn
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Values'
            }
          }
        }
      }
    };

    return {
      chartType: 'Multi-Series Bar Chart',
      title: `Comparative Analysis: ${numericColumns.slice(0, 4).join(' vs ')}`,
      description: `This multi-series bar chart compares ${numericColumns.length} different metrics across ${labelColumn} categories, allowing for easy comparison of trends and patterns.`,
      insights: [
        `Highest overall value: ${maxValue.toLocaleString()}`,
        `Categories analyzed: ${labels.length}`,
        `Metrics compared: ${numericColumns.length}`,
        `Data series: ${datasets.length}`,
        `Total data points: ${datasets.reduce((sum, dataset) => sum + dataset.data.length, 0)}`
      ],
      config,
      statistics: {
        max: maxValue,
        min: Math.min(...allValues),
        mean: allValues.reduce((sum, val) => sum + val, 0) / allValues.length
      }
    };
  }

  private static createSingleSeriesChart(data: ExcelData, labelColumn: string, valueColumn: string): AIAnalysis {
    const labelIndex = data.headers.indexOf(labelColumn);
    const valueIndex = data.headers.indexOf(valueColumn);

    // Aggregate data by label
    const aggregated: { [key: string]: number[] } = {};
    
    data.rows.forEach(row => {
      const label = String(row[labelIndex] || 'Unknown');
      const value = Number(row[valueIndex]) || 0;
      
      if (!aggregated[label]) {
        aggregated[label] = [];
      }
      aggregated[label].push(value);
    });

    // Calculate averages
    const labels = Object.keys(aggregated);
    const values = labels.map(label => {
      const vals = aggregated[label];
      return vals.reduce((sum, val) => sum + val, 0) / vals.length;
    });

    // Determine chart type based on data distribution
    const uniqueLabels = labels.length;
    let chartType: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';
    
    if (uniqueLabels <= 6) {
      chartType = 'pie';
    } else if (uniqueLabels > 15) {
      chartType = 'line';
    }

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const maxIndex = values.indexOf(maxValue);
    const minIndex = values.indexOf(minValue);

    const isPieChart = chartType === 'pie' || chartType === 'doughnut';
    
    const config: ChartConfig = {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: valueColumn,
          data: values,
          backgroundColor: isPieChart 
            ? [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
              ].slice(0, labels.length)
            : '#3B82F6',
          borderColor: isPieChart ? '#ffffff' : '#2563EB',
          borderWidth: isPieChart ? 2 : 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${valueColumn} by ${labelColumn}`,
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          },
          legend: {
            display: isPieChart,
            position: isPieChart ? 'bottom' : 'top',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        },
        ...(isPieChart ? {} : {
          scales: {
            x: {
              title: {
                display: true,
                text: labelColumn
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: valueColumn
              }
            }
          }
        })
      }
    };

    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;

    return {
      chartType: chartType.charAt(0).toUpperCase() + chartType.slice(1) + ' Chart',
      title: `${valueColumn} Distribution Analysis`,
      description: `This ${chartType} chart visualizes the distribution of ${valueColumn} across different ${labelColumn} categories, highlighting patterns and outliers in your data.`,
      insights: [
        `Highest value: ${maxValue.toFixed(2)} (${labels[maxIndex]})`,
        `Lowest value: ${minValue.toFixed(2)} (${labels[minIndex]})`,
        `Average value: ${avgValue.toFixed(2)}`,
        `Total categories: ${labels.length}`,
        `Value range: ${(maxValue - minValue).toFixed(2)}`,
        `Standard deviation: ${Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / values.length).toFixed(2)}`
      ],
      config,
      statistics: {
        max: maxValue,
        min: minValue,
        mean: avgValue,
        total: values.reduce((sum, val) => sum + val, 0),
        stdDev: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / values.length)
      }
    };
  }

  private static createCountChart(data: ExcelData, labelColumn: string): AIAnalysis {
    const labelIndex = data.headers.indexOf(labelColumn);
    const counts: { [key: string]: number } = {};

    data.rows.forEach(row => {
      const label = String(row[labelIndex] || 'Unknown');
      counts[label] = (counts[label] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    const config: ChartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Frequency',
          data: values,
          backgroundColor: [
            '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
            '#6366F1', '#EC4899', '#14B8A6', '#F97316', '#84CC16'
          ].slice(0, labels.length),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${labelColumn} Distribution`,
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: labelColumn
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency'
            }
          }
        }
      }
    };

    const maxCount = Math.max(...values);
    const mostCommon = labels[values.indexOf(maxCount)];

    return {
      chartType: 'Frequency Distribution',
      title: `${labelColumn} Frequency Analysis`,
      description: `This frequency distribution chart shows how often each ${labelColumn.toLowerCase()} value appears in your dataset, helping identify the most and least common categories.`,
      insights: [
        `Most frequent: ${mostCommon} (${maxCount} occurrences)`,
        `Unique categories: ${labels.length}`,
        `Total records: ${data.rows.length}`,
        `Average frequency: ${(data.rows.length / labels.length).toFixed(1)}`,
        `Distribution spread: ${((maxCount - Math.min(...values)) / maxCount * 100).toFixed(1)}% variance`
      ],
      config,
      statistics: {
        max: maxCount,
        min: Math.min(...values),
        mean: data.rows.length / labels.length,
        total: data.rows.length
      }
    };
  }
}