'use client';

import { useState } from 'react';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PaymentAPIDocsPage() {
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: 'Copied to clipboard' });
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Payment API Documentation</h1>
          <p className="text-muted-foreground">
            Generic payment processor API using Paystack for flexible payment handling
          </p>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleSection('overview')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overview</CardTitle>
                <CardDescription>How the payment API works</CardDescription>
              </div>
              {expandedSections.has('overview') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has('overview') && (
            <CardContent className="space-y-4">
              <p className="text-sm">
                The payment API is a generic payment processor that allows you to initiate payments through Paystack and verify their status. It's designed to be flexible and can be used for any type of payment.
              </p>
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Key Features:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">
                  <li>Initiate payments with dynamic amounts</li>
                  <li>Automatic Paystack webhook verification</li>
                  <li>Real-time payment status checking</li>
                  <li>No user authentication required</li>
                  <li>Automatic status updates via webhooks</li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Endpoint 1: Initiate Payment */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleSection('endpoint1')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Endpoint 1: Initiate Payment</CardTitle>
                <CardDescription>GET /api/pay?amount=500</CardDescription>
              </div>
              {expandedSections.has('endpoint1') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has('endpoint1') && (
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Description</p>
                <p className="text-sm text-muted-foreground">
                  Initiates a new payment and returns a Paystack checkout URL. User visits this URL to complete payment.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Request</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  GET {baseUrl}/api/pay?amount=500000
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Query Parameters</p>
                <div className="bg-muted p-3 rounded text-xs space-y-1">
                  <div><span className="font-semibold">amount</span> (required): Amount in Kobo (e.g., 500000 = ₦5,000)</div>
                  <div><span className="font-semibold">metadata</span> (optional): JSON stringified custom data</div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Success Response (200)</p>
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <pre className="text-xs overflow-x-auto">
{`{
  "success": true,
  "transactionId": "TX_1704067200000_a1b2c3d4",
  "amount": 500000,
  "currency": "NGN",
  "reference": "PAY-1704067200000",
  "authorizationUrl": "https://checkout.paystack.com/...",
  "accessCode": "abcd1234",
  "expiresIn": 3600,
  "createdAt": "2024-01-01T12:00:00Z"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Usage Steps</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Call this endpoint with desired amount in Kobo</li>
                  <li>User receives response with <code className="bg-muted px-1 rounded">authorizationUrl</code></li>
                  <li>User visits the <code className="bg-muted px-1 rounded">authorizationUrl</code> to pay on Paystack</li>
                  <li>Save the <code className="bg-muted px-1 rounded">transactionId</code> for later verification</li>
                  <li>Our backend automatically verifies payment via Paystack webhook</li>
                  <li>Check status using the <code className="bg-muted px-1 rounded">transactionId</code></li>
                </ol>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Endpoint 2: Check Payment Status */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleSection('endpoint2')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Endpoint 2: Check Payment Status</CardTitle>
                <CardDescription>GET /api/pay/verify?id=TX_ID</CardDescription>
              </div>
              {expandedSections.has('endpoint2') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has('endpoint2') && (
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Description</p>
                <p className="text-sm text-muted-foreground">
                  Check the status of a payment. Status is automatically updated by our backend when Paystack webhook is received.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Request</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  GET {baseUrl}/api/pay/verify?id=TX_1704067200000_a1b2c3d4
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Query Parameters</p>
                <div className="bg-muted p-3 rounded text-xs space-y-1">
                  <div><span className="font-semibold">id</span> (required): The transactionId from initiate payment</div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Response (Pending)</p>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <pre className="text-xs overflow-x-auto">
{`{
  "transactionId": "TX_1704067200000_a1b2c3d4",
  "status": "pending",
  "amount": 500000,
  "currency": "NGN",
  "reference": "PAY-1704067200000",
  "message": "Waiting for payment"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Response (Success)</p>
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <pre className="text-xs overflow-x-auto">
{`{
  "transactionId": "TX_1704067200000_a1b2c3d4",
  "status": "success",
  "amount": 500000,
  "currency": "NGN",
  "reference": "PAY-1704067200000",
  "verifiedAt": "2024-01-01T12:05:00Z",
  "message": "Payment verified successfully"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Response (Failed)</p>
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <pre className="text-xs overflow-x-auto">
{`{
  "transactionId": "TX_1704067200000_a1b2c3d4",
  "status": "failed",
  "amount": 500000,
  "currency": "NGN",
  "reference": "PAY-1704067200000",
  "message": "Payment failed"
}`}
                  </pre>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Auto-Verification</p>
                <p className="text-sm text-blue-900">
                  When user completes payment on Paystack, our backend automatically receives a webhook and updates the payment status to "success". You don't need to manually verify - just check the status with this endpoint.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Complete Example */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleSection('example')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Complete Example</CardTitle>
                <CardDescription>Step-by-step integration guide</CardDescription>
              </div>
              {expandedSections.has('example') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has('example') && (
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Step 1: Initiate Payment</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`const response = await fetch('/api/pay?amount=500000');
const data = await response.json();
console.log('Payment URL:', data.authorizationUrl);
console.log('Transaction ID:', data.transactionId);`)}
                    className="mb-2"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <pre>{`const response = await fetch('/api/pay?amount=500000');
const data = await response.json();
console.log('Payment URL:', data.authorizationUrl);
console.log('Transaction ID:', data.transactionId);`}</pre>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Step 2: Redirect User to Payment</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`window.location.href = data.authorizationUrl;`)}
                    className="mb-2"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <pre>{`window.location.href = data.authorizationUrl;`}</pre>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Step 3: Check Payment Status</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`// After user returns, check status
const verifyResponse = await fetch(\`/api/pay/verify?id=\${data.transactionId}\`);
const status = await verifyResponse.json();

if (status.status === 'success') {
  console.log('Payment verified!');
} else if (status.status === 'pending') {
  console.log('Still waiting for payment...');
} else {
  console.log('Payment failed');
}`)}
                    className="mb-2"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <pre>{`// After user returns, check status
const verifyResponse = await fetch(\`/api/pay/verify?id=\${data.transactionId}\`);
const status = await verifyResponse.json();

if (status.status === 'success') {
  console.log('Payment verified!');
} else if (status.status === 'pending') {
  console.log('Still waiting for payment...');
} else {
  console.log('Payment failed');
}`}</pre>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-sm font-medium text-green-900">Payment Flow Summary</p>
                <p className="text-sm text-green-900 mt-2">
                  1. Call /api/pay to get checkout URL → 2. User visits URL and pays → 3. Our backend auto-verifies via webhook → 4. Check /api/pay/verify to see updated status (success/failed/pending)
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Important Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="text-red-600 font-bold">•</div>
              <p className="text-sm">
                <span className="font-medium">No Authentication Required:</span> The /api/pay endpoints don't require user authentication. Any amount can be initiated.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-red-600 font-bold">•</div>
              <p className="text-sm">
                <span className="font-medium">Automatic Verification:</span> When user completes payment on Paystack, our server automatically receives a webhook and updates the status. No manual verification needed.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-red-600 font-bold">•</div>
              <p className="text-sm">
                <span className="font-medium">Amounts in Kobo:</span> All amounts must be in Kobo (1 NGN = 100 Kobo). So 5000 NGN = 500000 Kobo.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-red-600 font-bold">•</div>
              <p className="text-sm">
                <span className="font-medium">Internal Redirect:</span> No popups - user is redirected directly to Paystack checkout page. After payment, Paystack redirects back to your app.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-red-600 font-bold">•</div>
              <p className="text-sm">
                <span className="font-medium">Payment Expiry:</span> Payments expire after 1 hour. Status will show "expired" if not completed within this window.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
