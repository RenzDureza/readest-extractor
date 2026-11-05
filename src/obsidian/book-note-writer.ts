import { normalizePath, Vault, TFile, MetadataCache } from "obsidian";
import { ImportedBook } from "../readest/types";

type BookNoteWriteResult = {
  status: "created" | "already-imported" | "filename-collision";
  path: string;
};

export class BookNoteWriter {
  private readonly createdNotes: Map<string, string> = new Map();
  constructor(
    private readonly vault: Vault,
    private readonly metadataCache: MetadataCache,
    private readonly outputFolder = "Books",
  ) {}

  async createBookNote(
    book: ImportedBook,
    content: string,
  ): Promise<BookNoteWriteResult> {
    const rememberedPath = this.createdNotes.get(book.bookHash);
    if (rememberedPath) {
      return {
        status: "already-imported",
        path: rememberedPath,
      };
    }

    await this.ensureOutputFolder();

    const filename = this.sanitizeFilename(book.title);
    const filePath = normalizePath(`${this.outputFolder}/${filename}.md`);
    const existingBookNotes = this.findBookNotes(book.bookHash);

    if (existingBookNotes.length > 1) {
      throw new Error(
        "[Readest Extractor] Multiple notes share this book hash",
      );
    }

    const existingBookNote = existingBookNotes[0];

    if (existingBookNote) {
      return {
        status: "already-imported",
        path: existingBookNote.path,
      };
    }

    const existingFile = this.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      return {
        status: "filename-collision",
        path: filePath,
      };
    }

    await this.vault.create(filePath, content);
    this.createdNotes.set(book.bookHash, filePath);

    return {
      status: "created",
      path: filePath,
    };
  }

  private async ensureOutputFolder(): Promise<void> {
    const folder = this.vault.getAbstractFileByPath(this.outputFolder);

    if (!folder) {
      await this.vault.createFolder(this.outputFolder);
    }
  }

  private sanitizeFilename(title: string): string {
    const cleanedTitle = title
      // eslint-disable-next-line no-control-regex -- basta
      .replace(/[\\/:*?"<>|\x00-\x1F\x7F]/g, "-")
      .trim()
      .replace(/[ .]+$/g, "");

    if (!cleanedTitle) {
      return "Untitled";
    }

    const nameBeforeDot = cleanedTitle.split(".")[0] ?? "";

    if (
      [
        "CON",
        "PRN",
        "AUX",
        "NUL",
        "COM1",
        "COM2",
        "COM3",
        "COM4",
        "COM5",
        "COM6",
        "COM7",
        "COM8",
        "COM9",
        "LPT1",
        "LPT2",
        "LPT3",
        "LPT4",
        "LPT5",
        "LPT6",
        "LPT7",
        "LPT8",
        "LPT9",
      ].includes(nameBeforeDot.toUpperCase())
    ) {
      return `_${cleanedTitle}`;
    }

    return cleanedTitle;
  }

  private findBookNotes(bookHash: string): TFile[] {
    const markdownFiles = this.vault.getMarkdownFiles();

    return markdownFiles.filter((file) => {
      const cache = this.metadataCache.getFileCache(file);

      return cache?.frontmatter?.readest_book_hash === bookHash;
    });
  }

  private findAnnotation(annotationId: string): TFile | undefined {
    const markdownFiles = this.vault.getMarkdownFiles();

    return markdownFiles.find((file) => {
      const cache = this.metadataCache.getFileCache(file);
      return cache?.frontmatter?.readest_book_hash === annotationId;
    });
  }
}
