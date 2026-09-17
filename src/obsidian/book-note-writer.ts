import { normalizePath, Vault, TFile } from 'obsidian';
import { ImportedBook } from '../readest/types';
import { title } from 'process';

export class BookNoteWriter {
	constructor(
		private readonly vault: Vault,
		private readonly outputFolder = 'Books',
	) {}

	async createBookNote(
		book: ImportedBook,
		content: string,
	): Promise<TFile | undefined> {
		await this.ensureOutputFolder();

		const filename = this.sanitizeFilename(book.title);
		const filePath = normalizePath(`${this.outputFolder}/${filename}.md`);

		const existingFile = this.vault.getAbstractFileByPath(filePath);
		if (existingFile) {
			console.info(
				`[Readest Extractor] Note already exists: ${filePath}`,
			);
			return undefined;
		}
		return await this.vault.create(filePath, content);
	}

	private async ensureOutputFolder(): Promise<void> {
		const folder = this.vault.getAbstractFileByPath(this.outputFolder);

		if (!folder) {
			await this.vault.createFolder(this.outputFolder);
		}
	}

	private sanitizeFilename(title: string): string {
		return title.replace(/[\\/:*?"<>|]/g, '-').trim();
	}
}
