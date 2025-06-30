export interface ExportOptions {
  filename: string;
  contentType?: string;
}

export function exportToJson<T>(data: T[], options: ExportOptions): void {
  const { filename, contentType = 'application/json' } = options;

  try {
    const jsonData = JSON.stringify(data, null, 2);
    downloadFile(jsonData, filename, contentType);
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw new Error('JSONエクスポートに失敗しました');
  }
}

export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): void {
  const { filename, contentType = 'text/csv' } = options;

  try {
    if (data.length === 0) {
      throw new Error('エクスポートするデータがありません');
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row)
        .map((value) =>
          typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : String(value)
        )
        .join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    downloadFile(csvContent, filename, contentType);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('CSVエクスポートに失敗しました');
  }
}

function downloadFile(
  content: string,
  filename: string,
  contentType: string
): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function createExportFilename(
  prefix: string,
  extension: string
): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
  return `${prefix}_${timestamp}.${extension}`;
}
