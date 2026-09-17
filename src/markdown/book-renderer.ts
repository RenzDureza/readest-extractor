import { ImportedBook } from '../readest/types';

export function renderBookNote(book: ImportedBook): string {
	const progress = book.progress?.total
		? Math.round((book.progress.current / book.progress.total) * 100)
		: 0;

	const annotations = book.annotations
		.map((annotation) => {
			const page = annotation.page ?? 'Unknown';
			const text = annotation.text
				.split('\n')
				.map((line) => `> *"${line}"*`)
				.join('\n');

			return `> [!quote] Page ${page}\n${text}`;
		})
		.join('\n\n');

	const noteContent = `---
title: "${book.title}"
author: "${book.authors.join(', ')}"
publisher: "${book.publisher ?? ''}"
published: "${book.published?.slice(0, 10) ?? ''}"
progress_total: ${book.progress?.total ?? 0}
status: ${progress}
readest_book_hash: "${book.bookHash}"
---

***
## Summary


***
## Annotations

${annotations || 'No annotations found.'}

***
`;

	return noteContent;
}
