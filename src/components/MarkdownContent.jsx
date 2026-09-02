import ReactMarkdown from 'react-markdown';

// Isolated so react-markdown loads only when AI background is actually shown,
// instead of riding along with the modal chunk.
const COMPONENTS = {
  h1: ({ children }) => <h1 className="mb-2 mt-4 text-lg font-bold text-slate-900 dark:text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold text-slate-900 dark:text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-medium text-slate-900 dark:text-white">{children}</h3>,
  p: ({ children }) => <p className="mb-2">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
  li: ({ children }) => <li className="text-slate-700 dark:text-slate-300">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-4 border-slate-300 dark:border-slate-700 pl-4 italic text-slate-600 dark:text-slate-400">
      {children}
    </blockquote>
  )
};

const MarkdownContent = ({ children }) => (
  <ReactMarkdown components={COMPONENTS}>{children}</ReactMarkdown>
);

export default MarkdownContent;
