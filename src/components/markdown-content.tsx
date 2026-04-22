interface MarkdownContentProps {
  html: string;
}

export function MarkdownContent({ html }: MarkdownContentProps) {
  return (
    <div
      className="article"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
