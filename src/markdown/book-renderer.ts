import { ImportedAnnotation, ImportedBook } from "../readest/types";

function yamlString(value: string): string {
  return JSON.stringify(value)
    .replace(/\u0085/g, "\\u0085")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function inlineMarkdown(value: string) {
  return value
    .replace(/[\r\n\u0085\u2028\u2029]+/g, " ")
    .replace(/[\\`*_[\]<>|]/g, "\\$&");
}

function publicationDate(value: string | undefined): string | undefined {
  const date = value?.match(/^\d{4}-\d{2}-\d{2}(?=$|T)/)?.[0];

  if (!date) {
    return undefined;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (!Number.isFinite(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString().slice(0, 10) === date ? date : undefined;
}

function groupAnnotationsByPage(
  annotations: readonly ImportedAnnotation[],
): Array<[number | undefined, ImportedAnnotation[]]> {
  const groups = new Map<number | undefined, ImportedAnnotation[]>();

  for (const annotation of annotations) {
    const page =
      typeof annotation.page === "number" &&
      Number.isFinite(annotation.page) &&
      annotation.page >= 0
        ? annotation.page
        : undefined;

    const group = groups.get(page);

    if (group) {
      group.push(annotation);
    } else {
      groups.set(page, [annotation]);
    }
  }
  return [...groups.entries()].sort(([left], [right]) => {
    if (left === right) {
      return 0;
    }

    if (left === undefined) {
      return 1;
    }

    if (right === undefined) {
      return -1;
    }

    return left - right;
  });
}

export function renderBookNote(book: ImportedBook): string {
  const progress = book.progress;
  const validProgress =
    progress !== undefined &&
    Number.isFinite(progress.current) &&
    Number.isFinite(progress.total) &&
    progress.current >= 0 &&
    progress.total > 0
      ? progress
      : undefined;

  const calculatedPercent = validProgress
    ? Math.round((validProgress.current / validProgress.total) * 100)
    : undefined;

  const progressPercent =
    calculatedPercent !== undefined && Number.isFinite(calculatedPercent)
      ? calculatedPercent
      : undefined;

  const published = publicationDate(book.published);

  const properties: string[] = [
    "type: book",
    `title: ${yamlString(book.title)}`,
  ];

  if (book.authors.length === 0) {
    properties.push("authors: []");
  } else {
    properties.push(
      "authors:",
      ...book.authors.map((author) => ` - ${yamlString(author)}`),
    );
  }

  const addStringProperty = (key: string, value: string | undefined): void => {
    if (value !== undefined && value.trim() !== "") {
      properties.push(`${key}: ${yamlString(value)}`);
    }
  };

  const progressText = validProgress
    ? `${validProgress.current} of ${validProgress.total}${
        progressPercent !== undefined ? ` (${progressPercent}%)` : ""
      }`
    : "Unknown";

  addStringProperty("format", book.format);
  addStringProperty("publisher", book.publisher);
  addStringProperty("published", published);
  addStringProperty("progress", progressText);

  properties.push(`readest_book_hash: ${yamlString(book.bookHash)}`);
  addStringProperty("readest_meta_hash", book.metaHash);

  const annotationGroups = groupAnnotationsByPage(book.annotations);

  const annotations = annotationGroups
    .map(([page, group]) => {
      const location = page === undefined ? "Unknown location" : `Page ${page}`;

      const passages = group
        .map((annotation) => {
          const text = annotation.text
            .split("\n")
            .map((line) => `> *"${line}"*`)
            .join("\n");

          return [
            `<!-- READEST:ANNOTATION:${annotation.id}:START -->`,
            `> [!quote] ${location}`,
            text,
            "",
            `<!-- READEST:ANNOTATION:${annotation.id}:END -->`,
            "",
            "#### Personal notes:",
            "",
            "<!-- Write your personal notes below this comment. -->",
            "",
          ].join("\n");
        })
        .join("\n\n");

      return [`### ${location}`, "", passages].join("\n");
    })
    .join("\n\n");

  return [
    "---",
    ...properties,
    "---",
    "",
    `# ${inlineMarkdown(book.title)}`,
    "",
    "## Summary",
    "",
    "",
    "***",
    "",
    "## Annotations",
    "",
    annotations || "No annotations found.",
    "",
    "***",
    "",
  ].join("\n");
}
