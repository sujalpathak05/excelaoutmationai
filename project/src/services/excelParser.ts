import * as XLSX from 'xlsx';
import { ExcelData } from '../types';

export class ExcelParser {
  static async parseFile(file: File): Promise<ExcelData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheets: ExcelData[] = [];
          
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 0) {
              const headers = (jsonData[0] as any[]).map(header => String(header || ''));
              const rows = jsonData.slice(1) as any[][];
              
              sheets.push({
                headers,
                rows: rows.filter(row => row.some(cell => cell !== undefined && cell !== '')),
                sheetName
              });
            }
          });
          
          resolve(sheets);
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  static detectDataTypes(data: ExcelData): {
    numeric: string[];
    text: string[];
    date: string[];
  } {
    const numeric: string[] = [];
    const text: string[] = [];
    const date: string[] = [];

    data.headers.forEach((header, index) => {
      const sampleValues = data.rows.slice(0, 10).map(row => row[index]).filter(val => val != null);
      
      if (sampleValues.length === 0) return;

      const numericCount = sampleValues.filter(val => !isNaN(Number(val))).length;
      const dateCount = sampleValues.filter(val => !isNaN(Date.parse(val))).length;

      if (numericCount / sampleValues.length > 0.7) {
        numeric.push(header);
      } else if (dateCount / sampleValues.length > 0.7) {
        date.push(header);
      } else {
        text.push(header);
      }
    });

    return { numeric, text, date };
  }
}