import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export interface ParsedFileContent {
  text: string;
  isImage: boolean;
  base64?: string; // Only for images
  mimeType: string;
  filename: string;
}

export class FileParserService {
  /**
   * Parse a file based on its content type and return extracted text
   */
  async parseFile(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<ParsedFileContent | null> {
    try {
      // Determine file type from content type or extension
      const fileType = this.detectFileType(contentType, filename);

      console.log(`      📄 Parsing attachment: ${filename} (${fileType})`);

      switch (fileType) {
        case "pdf":
          return await this.parsePDF(buffer, filename, contentType);
        case "word":
          return await this.parseWord(buffer, filename, contentType);
        case "excel":
          return await this.parseExcel(buffer, filename, contentType);
        case "csv":
          return await this.parseCSV(buffer, filename, contentType);
        case "text":
          return await this.parseText(buffer, filename, contentType);
        case "image":
          return await this.parseImage(buffer, filename, contentType);
        default:
          console.log(`      ⚠️  Unsupported file type: ${fileType} for ${filename}`);
          return null;
      }
    } catch (error: any) {
      console.error(`      ❌ Error parsing file ${filename}:`, error.message);
      return null;
    }
  }

  /**
   * Parse PDF file and extract text
   */
  private async parsePDF(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<ParsedFileContent> {
    const pdfData = await pdfParse(buffer);
    return {
      text: pdfData.text,
      isImage: false,
      mimeType: contentType,
      filename,
    };
  }

  /**
   * Parse Word document (.docx) and extract text
   */
  private async parseWord(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<ParsedFileContent> {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      isImage: false,
      mimeType: contentType,
      filename,
    };
  }

  /**
   * Parse Excel file and extract data as formatted text
   */
  private async parseExcel(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<ParsedFileContent> {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    let text = "";

    // Process each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      if (index > 0) text += "\n\n"; // Separate sheets with blank lines
      text += `Sheet: ${sheetName}\n`;
      text += "=".repeat(50) + "\n";

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Format as readable text table
      if (jsonData.length > 0) {
        // First row as headers
        const headers = jsonData[0] as any[];
        const rows = jsonData.slice(1) as any[][];

        // Create table format
        if (headers && headers.length > 0) {
          text += headers.join(" | ") + "\n";
          text += "-".repeat(headers.join(" | ").length) + "\n";

          rows.forEach((row) => {
            if (row && row.length > 0) {
              text += row.map((cell) => (cell ?? "").toString()).join(" | ") + "\n";
            }
          });
        } else {
          // No headers, just print rows
          rows.forEach((row) => {
            if (row && row.length > 0) {
              text += row.map((cell) => (cell ?? "").toString()).join(" | ") + "\n";
            }
          });
        }
      }
    });

    return {
      text: text.trim(),
      isImage: false,
      mimeType: contentType,
      filename,
    };
  }

  /**
   * Parse CSV file and extract text
   */
  private async parseCSV(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<ParsedFileContent> {
    const text = buffer.toString("utf-8");
    return {
      text,
      isImage: false,
      mimeType: contentType,
      filename,
    };
  }

  /**
   * Parse plain text file
   */
  private async parseText(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<ParsedFileContent> {
    const text = buffer.toString("utf-8");
    return {
      text,
      isImage: false,
      mimeType: contentType,
      filename,
    };
  }

  /**
   * Parse image file and convert to base64 for Vision API
   */
  private async parseImage(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<ParsedFileContent> {
    const base64 = buffer.toString("base64");
    return {
      text: "", // Images don't have text, will use Vision API
      isImage: true,
      base64,
      mimeType: contentType,
      filename,
    };
  }

  /**
   * Detect file type from content type or filename extension
   */
  private detectFileType(contentType: string, filename: string): string {
    const lowerContentType = contentType.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Check content type first
    if (lowerContentType.includes("pdf")) return "pdf";
    if (
      lowerContentType.includes("wordprocessingml") ||
      lowerContentType.includes("msword") ||
      lowerContentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml")
    )
      return "word";
    if (
      lowerContentType.includes("spreadsheetml") ||
      lowerContentType.includes("excel") ||
      lowerContentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml")
    )
      return "excel";
    if (lowerContentType.includes("csv") || lowerContentType.includes("text/csv"))
      return "csv";
    if (lowerContentType.startsWith("text/")) return "text";
    if (lowerContentType.startsWith("image/")) return "image";

    // Fallback to filename extension
    if (lowerFilename.endsWith(".pdf")) return "pdf";
    if (lowerFilename.endsWith(".docx") || lowerFilename.endsWith(".doc")) return "word";
    if (
      lowerFilename.endsWith(".xlsx") ||
      lowerFilename.endsWith(".xls") ||
      lowerFilename.endsWith(".xlsm")
    )
      return "excel";
    if (lowerFilename.endsWith(".csv")) return "csv";
    if (
      lowerFilename.endsWith(".txt") ||
      lowerFilename.endsWith(".text") ||
      lowerFilename.endsWith(".log")
    )
      return "text";
    if (
      lowerFilename.endsWith(".png") ||
      lowerFilename.endsWith(".jpg") ||
      lowerFilename.endsWith(".jpeg") ||
      lowerFilename.endsWith(".gif") ||
      lowerFilename.endsWith(".webp") ||
      lowerFilename.endsWith(".bmp")
    )
      return "image";

    return "unknown";
  }
}

