import type { ImportedAnnotation, ImportedBook, ReadestBook } from './types';

function record(value: unknown, field: string): Record<string, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error(`${field} must be an object.`);
	}

	return value as Record<string, unknown>;
}

function text(value: unknown, field: string, trim = true): string | undefined {
	if (value == null) {
		return undefined;
	}

	if (typeof value !== 'string') {
		throw new Error(`${field} must be a string.`);
	}

	return trim ? value.trim() || undefined : value;
}

function stringList(value: unknown, field: string): string[] {
	if (value == null) {
		return [];
	}

	const values: unknown[] =
		typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];

	if (typeof value !== 'string' && !Array.isArray(value)) {
		throw new Error(`${field} must be a string or an array of strings.`);
	}

	const result: string[] = [];

	for (const item of values) {
		if (typeof item !== 'string') {
			throw new Error(`${field} must contain only strings.`);
		}

		const cleaned = item.trim();

		if (cleaned && !result.includes(cleaned)) {
			result.push(cleaned);
		}
	}

	return result;
}

function identifier(value: unknown, field: string): string {
	if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
		throw new Error(
			`${field} must be a non-empty identifier containing only letters, numbers, underscores, or hyphens.`,
		);
	}

	return value;
}

function optionalNumber(value: unknown, field: string): number | undefined {
	if (value == null) {
		return undefined;
	}

	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
		throw new Error(`${field} must be a finite, non-negative number.`);
	}

	return value;
}

function progress(value: unknown): [number, number] | undefined {
	if (!Array.isArray(value) || value.length !== 2) {
		return undefined;
	}

	const values: unknown[] = value;
	const current = values[0];
	const total = values[1];

	if (
		typeof current !== 'number' ||
		typeof total !== 'number' ||
		!Number.isFinite(current) ||
		!Number.isFinite(total) ||
		current < 0 ||
		total <= 0
	) {
		return undefined;
	}

	return [current, total];
}

export function parseReadestBook(value: unknown): ReadestBook {
	const data = record(value, 'Book');
	const hash = identifier(data.hash, 'Book hash');

	const metadata =
		data.metadata == null ? {} : record(data.metadata, 'Book metadata');

	const metadataTitle = text(metadata.title, 'Metadata title');

	return {
		hash,
		metaHash: text(data.metaHash, 'Book metaHash'),
		title:
			text(data.title, 'Book title') ??
			metadataTitle ??
			text(data.sourceTitle, 'Book sourceTitle') ??
			`Untitled (${hash})`,
		author: stringList(data.author, 'Book author'),
		format: text(data.format, 'Book format'),
		progress: progress(data.progress),
		metadata: {
			title: metadataTitle,
			author: stringList(metadata.author, 'Metadata author'),
			publisher: text(metadata.publisher, 'Metadata publisher'),
			published: text(metadata.published, 'Metadata published'),
			description: text(metadata.description, 'Metadata description'),
		},
	};
}

export function normalizeReadestBook(
	book: ReadestBook,
	configValue?: unknown,
): ImportedBook {
	const config =
		configValue === undefined ? {} : record(configValue, 'Book config');

	if (
		config.schemaVersion != null &&
		(typeof config.schemaVersion !== 'number' ||
			!Number.isInteger(config.schemaVersion) ||
			config.schemaVersion < 1)
	) {
		throw new Error('Config schemaVersion must be a positive integer.');
	}

	if (config.booknotes != null && !Array.isArray(config.booknotes)) {
		throw new Error('Config booknotes must be an array.');
	}

	const entries: unknown[] = Array.isArray(config.booknotes)
		? config.booknotes
		: [];

	const annotations: ImportedAnnotation[] = [];
	const annotationIds = new Set<string>();

	for (const [index, value] of entries.entries()) {
		const field = `Annotation ${index + 1}`;
		const annotation = record(value, field);

		if (annotation.deletedAt != null) {
			continue;
		}

		const id = identifier(annotation.id, `${field} ID`);

		if (annotationIds.has(id)) {
			throw new Error(`Duplicate active annotation ID: ${id}.`);
		}

		if (annotation.bookHash != null && annotation.bookHash !== book.hash) {
			throw new Error(`${field} belongs to a different book.`);
		}

		annotationIds.add(id);

		annotations.push({
			id,
			text: text(annotation.text, `${field} text`, false) ?? '',
			note: text(annotation.note, `${field} note`, false) ?? '',
			page: optionalNumber(annotation.page, `${field} page`),
			cfi: text(annotation.cfi, `${field} CFI`),
			color: text(annotation.color, `${field} color`),
			style: text(annotation.style, `${field} style`),
			createdAt: optionalNumber(
				annotation.createdAt,
				`${field} createdAt`,
			),
			updatedAt: optionalNumber(
				annotation.updatedAt,
				`${field} updatedAt`,
			),
		});
	}

	const metadataAuthors = stringList(
		book.metadata?.author,
		'Metadata author',
	);
	const rawProgress = progress(config.progress) ?? book.progress;

	return {
		bookHash: book.hash,
		metaHash: book.metaHash,
		title: book.title,
		authors:
			metadataAuthors.length > 0
				? metadataAuthors
				: stringList(book.author, 'Book author'),
		format: book.format,
		published: book.metadata?.published,
		publisher: book.metadata?.publisher,
		description: book.metadata?.description,
		progress: rawProgress
			? {
					current: rawProgress[0],
					total: rawProgress[1],
				}
			: undefined,
		annotations,
	};
}
