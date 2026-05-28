'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from './CodeBlock';

interface PayloadViewerProps {
  title: string;
  description?: string;
  request: Record<string, any>;
  response: Record<string, any>;
  endpoint: string;
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT';
  notes?: string;
  curl?: string;
}

export function PayloadViewer({
  title,
  description,
  request,
  response,
  endpoint,
  method = 'POST',
  notes,
  curl,
}: PayloadViewerProps) {
  const [showCurl, setShowCurl] = useState(false);

  const requestJson = JSON.stringify(request, null, 2);
  const responseJson = JSON.stringify(response, null, 2);

  const curlCommand = curl || 
    `curl -X ${method} https://v0-push-notification-api.vercel.app${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-api-key-12345" \\
  -d '${JSON.stringify(request)}'`;

  return (
    <div className="space-y-4 border rounded-lg p-6 bg-slate-50">
      <div>
        <h3 className="font-bold text-lg text-slate-900">{title}</h3>
        {description && (
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        )}
        <div className="mt-3 inline-block bg-white border rounded px-3 py-1">
          <span className="font-mono text-sm text-slate-700">
            <span className="font-bold text-blue-600">{method}</span> {endpoint}
          </span>
        </div>
      </div>

      <Tabs defaultValue="request" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="request">Request</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
          <TabsTrigger value="curl">cURL</TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-2">
          <CodeBlock
            code={requestJson}
            language="json"
            title="Request Body"
            description="Copy this JSON and send it with your API request"
          />
        </TabsContent>

        <TabsContent value="response" className="space-y-2">
          <CodeBlock
            code={responseJson}
            language="json"
            title="Expected Response"
            description="This is what you'll receive from the API"
          />
        </TabsContent>

        <TabsContent value="curl" className="space-y-2">
          <CodeBlock
            code={curlCommand}
            language="bash"
            title="cURL Command"
            description="Copy and paste this into your terminal to test the endpoint"
          />
        </TabsContent>
      </Tabs>

      {notes && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">{notes}</p>
        </div>
      )}
    </div>
  );
}
