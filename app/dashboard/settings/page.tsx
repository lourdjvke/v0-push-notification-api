'use client';

import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your push notification service</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
            <CardDescription>
              Complete reference for integrating push notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Endpoints</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <code className="bg-muted px-2 py-1 rounded">POST /api/subscribe</code>
                  <p className="text-muted-foreground">Subscribe a device to push notifications</p>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded">POST /api/send</code>
                  <p className="text-muted-foreground">Send notifications to subscriptions</p>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded">DELETE /api/unsubscribe</code>
                  <p className="text-muted-foreground">Unsubscribe a device</p>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded">GET /api/analytics</code>
                  <p className="text-muted-foreground">Get subscription analytics</p>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded">GET /api/connection</code>
                  <p className="text-muted-foreground">Test CORS connectivity</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">Authentication</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Use your API key in two ways:
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>Header:</strong> <code className="bg-muted px-2 py-1 rounded">Authorization: Bearer sk_...</code>
                </li>
                <li>
                  <strong>Query Param:</strong> <code className="bg-muted px-2 py-1 rounded">?apikey=sk_...</code>
                </li>
              </ul>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">CORS Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                All endpoints support CORS for use in browser-based applications. Make sure to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Use the init.js script for automatic subscription handling</li>
                <li>Test connectivity with /api/connection endpoint</li>
                <li>Handle preflight OPTIONS requests automatically</li>
              </ul>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">Best Practices</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Never expose API keys in client-side code - use query params for tests only</li>
                <li>Store API keys securely in environment variables</li>
                <li>Use unique subscription IDs returned from the subscribe endpoint</li>
                <li>Monitor analytics to track engagement rates</li>
                <li>Test with the /api/connection endpoint before production</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support & Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Documentation</h4>
              <p className="text-sm text-muted-foreground">
                Check the /docs and /api-reference pages for detailed documentation.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Demo</h4>
              <p className="text-sm text-muted-foreground">
                Visit /demo to see a working example of the push notification system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
