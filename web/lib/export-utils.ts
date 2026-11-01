import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  key: keyof T;
  header: string;
  formatter?: (value: any) => string | number;
}

export interface SheetData<T> {
  data: T[];
  columns: ExportColumn<T>[];
  sheetName: string;
}

// Apply professional styling to a worksheet
function applyProfessionalStyling<T>(worksheet: XLSX.WorkSheet, columns: ExportColumn<T>[], data: T[]) {
  // Get the range of data
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  
  // Apply professional formatting to header row (row 1)
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    // Professional header styling with gradient-like appearance
    worksheet[cellAddress].s = {
      fill: {
        fgColor: { rgb: "2E5BBA" } // Professional blue background
      },
      font: {
        bold: true,
        sz: 14, // Larger font for headers
        color: { rgb: "FFFFFF" }, // White text
        name: "Arial" // Professional font
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true
      },
      border: {
        top: { style: "medium", color: { rgb: "1F4788" } },
        bottom: { style: "medium", color: { rgb: "1F4788" } },
        left: { style: "thin", color: { rgb: "1F4788" } },
        right: { style: "thin", color: { rgb: "1F4788" } }
      }
    };
  }

  // Apply professional formatting to data rows
  for (let row = 1; row <= range.e.r; row++) {
    const isEvenRow = row % 2 === 0;
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) continue;
      
      // Alternating row colors for better readability
      worksheet[cellAddress].s = {
        fill: {
          fgColor: { rgb: isEvenRow ? "F8F9FA" : "FFFFFF" } // Light gray for even rows, white for odd
        },
        font: {
          sz: 11,
          name: "Arial",
          color: { rgb: "212529" } // Professional dark gray text
        },
        alignment: {
          horizontal: "left",
          vertical: "center",
          wrapText: true
        },
        border: {
          top: { style: "thin", color: { rgb: "DEE2E6" } },
          bottom: { style: "thin", color: { rgb: "DEE2E6" } },
          left: { style: "thin", color: { rgb: "DEE2E6" } },
          right: { style: "thin", color: { rgb: "DEE2E6" } }
        }
      };
    }
  }

  // Enhanced column width calculations based on content
  const exportData = data.map(item => {
    const row: Record<string, any> = {};
    columns.forEach(column => {
      const value = item[column.key];
      row[column.header] = column.formatter ? column.formatter(value) : value;
    });
    return row;
  });

  const columnWidths = columns.map((col) => {
    // Calculate maximum content length for this column
    const maxContentLength = Math.max(
      col.header.length,
      ...exportData.map(row => {
        const value = row[col.header];
        return value ? String(value).length : 0;
      })
    );
    
    // Set minimum and maximum widths with smart defaults
    const minWidth = 12;
    const maxWidth = 50;
    const calculatedWidth = Math.min(Math.max(maxContentLength + 2, minWidth), maxWidth);
    
    return { wch: calculatedWidth };
  });
  
  worksheet['!cols'] = columnWidths;

  // Set row heights for better appearance
  const rowHeights = [];
  for (let row = 0; row <= range.e.r; row++) {
    rowHeights[row] = { hpx: row === 0 ? 25 : 20 }; // Taller header row
  }
  worksheet['!rows'] = rowHeights;

  // Add freeze panes to keep header visible
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  // Add autofilter for professional data management
  worksheet['!autofilter'] = { ref: `A1:${XLSX.utils.encode_cell({ r: range.e.r, c: range.e.c })}` };
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  // Transform data based on columns configuration
  const exportData = data.map(item => {
    const row: Record<string, any> = {};
    columns.forEach(column => {
      const value = item[column.key];
      row[column.header] = column.formatter ? column.formatter(value) : value;
    });
    return row;
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Apply professional styling
  applyProfessionalStyling(worksheet, columns, data);

  // Ensure sheet name doesn't exceed Excel's 31 character limit
  const safeSheetName = sheetName.length > 31 ? sheetName.substring(0, 31) : sheetName;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  // Generate and download file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Export multiple sheets to a single Excel file
export function exportMultipleSheetsToExcel<T>(
  sheets: SheetData<any>[],
  filename: string
) {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ data, columns, sheetName }) => {
    // Transform data based on columns configuration
    const exportData = data.map(item => {
      const row: Record<string, any> = {};
      columns.forEach(column => {
        const value = item[column.key];
        row[column.header] = column.formatter ? column.formatter(value) : value;
      });
      return row;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Apply professional styling
    applyProfessionalStyling(worksheet, columns, data);

    // Ensure sheet name doesn't exceed Excel's 31 character limit
    const safeSheetName = sheetName.length > 31 ? sheetName.substring(0, 31) : sheetName;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  });

  // Generate and download file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Helper function to format dates consistently
export function formatDateForExport(date: Date | string | null): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN') + ' ' + dateObj.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// Helper function to format currency
export function formatCurrencyForExport(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}