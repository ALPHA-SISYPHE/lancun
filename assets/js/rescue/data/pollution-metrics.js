export const getRescueStaticMetrics = () => window.LANCUN_DATA?.rescueStaticMetrics ?? [];
export const getRescueCharts = () => window.LANCUN_DATA?.rescueCharts ?? {};
export const getRescueEducation = () => window.LANCUN_DATA?.rescueEducation ?? null;
export const getRescueReportThesis = () =>
  window.LANCUN_DATA?.rescueReportThesis ??
  '全球海洋污染压力正在从局部问题转向系统性风险。';
export const getRescuePressureIndex = () =>
  window.LANCUN_DATA?.rescuePressureIndex ?? { value: 82, level: 'High' };
