'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  description?: string;
}

export function CodeBlock({
  code,
  language = 'javascript',
  title,
  description,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-slate-900">{title}</h4>
          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
            {language}
          </span>
        </div>
      )}
      {description && (
        <p className="text-sm text-slate-600">{description}</p>
      )}
      <div className="relative">
        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
          <code>{code}</code>
        </pre>
        <Button
          onClick={handleCopy}
          size="sm"
          variant="outline"
          className="absolute top-2 right-2 bg-slate-800 border-slate-700 hover:bg-slate-700"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
