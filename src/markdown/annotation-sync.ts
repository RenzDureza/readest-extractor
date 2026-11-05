export function replaceAnnotationBlock(
  existingMarkdown: string,
  annotationID: string,
  generatedContent: string,
): string | undefined {
  const startMarker = `<!-- READEST:ANNOTATION:${annotationID}:START -->`;
  const endMarker = `<!-- READEST:ANNOTATION:${annotationID}:END -->`;

  const startPosition = existingMarkdown.indexOf(startMarker);
  const endPosition = existingMarkdown.indexOf(endMarker);

  if (startPosition === -1 || endPosition === -1 || endPosition < startPosition) {
    return undefined;
  }

  return existingMarkdown;
}
