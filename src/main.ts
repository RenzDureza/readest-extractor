import { Notice, Plugin } from "obsidian";
import { ReadestLibraryReader } from "./readest/library-reader";
import { ReadestImporter } from "./readest/importer";
import { DEFAULT_SETTINGS } from "./settings";
import { BookNoteWriter } from "./obsidian/book-note-writer";
import { renderBookNote } from "./markdown/book-renderer";

export default class ReadestExtractorPlugin extends Plugin {
  private isImporting = false;
  onload(): void {
    this.addCommand({
      id: "scan-readest-library",
      name: "Scan Readest library",
      callback: async () => {
        await this.scanReadestLibrary();
      },
    });

    this.addCommand({
      id: "import-readest-library",
      name: "Import Readest library",
      callback: async () => {
        await this.importReadestLibrary();
      },
    });
  }

  private async importReadestLibrary(): Promise<void> {
    if (this.isImporting) {
      new Notice("Readest import already running", 10000);
      return;
    }

    this.isImporting = true;
    try {
      const reader = new ReadestLibraryReader(
        DEFAULT_SETTINGS.readestLibraryPath,
      );
      const importer = new ReadestImporter(reader);
      const writer = new BookNoteWriter(this.app.vault, this.app.metadataCache);

      const result = await importer.importBooks();

      let failedCount = result.failedBookCount;
      let createdCount = 0;
      let alreadyImportedCount = 0;
      let collisionCount = 0;

      for (const book of result.books) {
        try {
          const content = renderBookNote(book);
          const outcome = await writer.createBookNote(book, content);

          if (outcome.status === "created") {
            createdCount++;
          } else if (outcome.status === "already-imported") {
            alreadyImportedCount++;
          } else if (outcome.status === "filename-collision") {
            collisionCount++;
          }
        } catch (error) {
          console.error(
            `[Readest Extractor] failed to import: ${book.title} : ${book.bookHash}`,
            error,
          );
          failedCount++;
        }
      }

      const skippedCount = alreadyImportedCount + collisionCount;

      const summary = [
        `Readest import: ${createdCount} created`,
        `${skippedCount} skipped (${alreadyImportedCount} already imported and ${collisionCount} filename collision)`,
        `${failedCount} failed`,
      ].join("; ");

      const errorHint =
        failedCount > 0 ? " See the developer console for details." : "";

      new Notice(`${summary}.${errorHint}`, 10000);
    } catch (error) {
      console.error(`[Readest Extractor] Library import failure.`, error);
      const message = error instanceof Error ? error.message : "Unknown error";
      new Notice(`Readest import failed: ${message}`, 10000);
    } finally {
      this.isImporting = false;
    }
  }

  private async scanReadestLibrary(): Promise<void> {
    const reader = new ReadestLibraryReader(
      DEFAULT_SETTINGS.readestLibraryPath,
    );
    const importer = new ReadestImporter(reader);

    try {
      const result = await importer.importBooks();

      const annotationCount = result.books.reduce(
        (total, book) => total + book.annotations.length,
        0,
      );

      const summary = [
        `Readest scan: ${result.activeBookCount} active books`,
        `${result.books.length} scanned successfully`,
        `${annotationCount} active annotations read`,
        `${result.missingConfigCount} missing configurations`,
        `${result.failedBookCount} failed books`,
      ].join("; ");

      const errorHint =
        result.failedBookCount > 0
          ? " See the developer console for details."
          : "";

      new Notice(`${summary}.${errorHint}`, 10000);
    } catch (error) {
      console.error("[Readest Extractor] Library scan failed.", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      new Notice(`Readest scan failed: ${message}`, 10000);
    }
  }
}
