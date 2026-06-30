'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Play, ChevronDown, ChevronUp } from 'lucide-react';

const FREE_USER_EMAIL = 'jvkechris@gmail.com';

interface Automation {
  id: string;
  name: string;
  firebasePath: string;
  fieldMapping: {
    subscriptionId: string;
    message: string;
    type?: string;
    image?: string;
    statusField?: string;
  };
  enabled: boolean;
  createdAt: string;
  lastRun?: string;
  runCount: number;
}

export default function AutomationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedAutomation, setExpandedAutomation] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPath, setFormPath] = useState('');
  const [formSubscriptionId, setFormSubscriptionId] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formStatus, setFormStatus] = useState('');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    setLoading(true);
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      setLoading(false);
      return; // Show email input form
    }

    setEmail(userEmail);

    // Check if user has access (free user or has active payment)
    try {
      // Check if user has access to automation
      const accessResponse = await fetch(`/api/pay/check-access?email=${encodeURIComponent(userEmail)}`);
      const accessData = await accessResponse.json();

      if (accessData.hasAccess) {
        setHasAccess(true);
        loadAutomations(userEmail);
      } else {
        toast({ description: 'Payment required to access automation', variant: 'destructive' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Access check failed:', error);
      toast({ description: 'Failed to check access', variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      toast({ description: 'Please enter your email', variant: 'destructive' });
      return;
    }

    localStorage.setItem('userEmail', emailInput);
    setEmail(emailInput);
    setLoading(true);

    // Check access
    try {
      const accessResponse = await fetch(`/api/pay/check-access?email=${encodeURIComponent(emailInput)}`);
      const accessData = await accessResponse.json();

      if (accessData.hasAccess) {
        setHasAccess(true);
        loadAutomations(emailInput);
        // Load API keys
        await loadApiKeys(emailInput);
      } else {
        toast({ description: 'Payment required to access automation', variant: 'destructive' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Access check failed:', error);
      toast({ description: 'Failed to check access', variant: 'destructive' });
      setLoading(false);
    }
  };

  const loadAutomations = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/automations?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setAutomations(data.automations || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load automations:', error);
      setLoading(false);
    }
  };

  const loadApiKeys = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/keys?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleCreateAutomation = async () => {
    if (!formName || !formPath || !formSubscriptionId || !formMessage) {
      toast({ description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: formName,
          firebasePath: formPath,
          fieldMapping: {
            subscriptionId: formSubscriptionId,
            message: formMessage,
            type: formType || undefined,
            image: formImage || undefined,
            statusField: formStatus || undefined,
          },
        }),
      });

      if (response.ok) {
        toast({ description: 'Automation created!' });
        setShowForm(false);
        loadAutomations(email);
        // Reset form
        setFormName('');
        setFormPath('');
        setFormSubscriptionId('');
        setFormMessage('');
        setFormType('');
        setFormImage('');
        setFormStatus('');
      } else {
        const data = await response.json();
        toast({ description: data.error || 'Failed to create automation', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Create automation error:', error);
      toast({ description: 'Failed to create automation', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutomation = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (response.ok) {
        await loadAutomations(email);
        toast.success(`Automation ${!enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      toast.error('Failed to toggle automation');
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    if (!confirm('Delete this automation?')) return;

    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ description: 'Automation deleted' });
        loadAutomations(email);
      } else {
        toast({ description: 'Failed to delete automation', variant: 'destructive' });
      }
    } catch (error) {
      toast.error('Failed to delete automation');
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormPath('');
    setFormSubscriptionId('');
    setFormMessage('');
    setFormType('');
    setFormImage('');
    setFormStatus('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-lg font-medium">Loading automation page...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Firebase Automation Setup</CardTitle>
            <CardDescription>Enter your email to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-4">
              If you don't have API keys yet, you can create one after entering your email
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payment Required</CardTitle>
            <CardDescription>To access Firebase automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This feature requires an active payment. Please make a payment to access automation features.
            </p>
            <Button onClick={() => window.location.href = '/api/pay?amount=500000'} className="w-full">
              Make Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Firebase Automations</h1>
            <p className="text-muted-foreground">
              Listen to Firebase changes and automatically send notifications
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Automation
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Create New Automation</CardTitle>
              <CardDescription>
                Set up Firebase listener and field mapping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="text-sm font-medium">Automation Name</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., User Order Notifications"
                  className="mt-1"
                />
              </div>

              {/* Firebase Path */}
              <div>
                <label className="text-sm font-medium">Firebase Path (with wildcards)</label>
                <Input
                  value={formPath}
                  onChange={(e) => setFormPath(e.target.value)}
                  placeholder="e.g., notifications/{notificationId}/ or orders/{userId}/"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {'{id}'} or {'{userId}'} for dynamic parts
                </p>
              </div>

              {/* Field Mapping */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-4">Field Mapping (Required)</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Subscription ID Field Path</label>
                    <Input
                      value={formSubscriptionId}
                      onChange={(e) => setFormSubscriptionId(e.target.value)}
                      placeholder="e.g., data.subscriptionId or subscriptionId"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Message Field Path</label>
                    <Input
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      placeholder="e.g., data.message or message"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-4">Optional Fields</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Type/Tag Field Path</label>
                    <Input
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      placeholder="e.g., data.type"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Image Field Path</label>
                    <Input
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="e.g., data.imageUrl"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Status Field Path</label>
                    <Input
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      placeholder="e.g., status (will be marked as 'success')"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateAutomation}
                  disabled={loading}
                  className="flex-1 md:flex-none"
                >
                  {loading ? 'Creating...' : 'Create Automation'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 md:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Automations List */}
        <div className="space-y-4">
          {automations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No automations yet. Create one to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            automations.map((automation) => (
              <Card key={automation.id}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    setExpandedAutomation(
                      expandedAutomation === automation.id ? null : automation.id
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{automation.name}</CardTitle>
                      <CardDescription>{automation.firebasePath}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAutomation(automation.id, automation.enabled);
                        }}
                      >
                        {automation.enabled ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                      {expandedAutomation === automation.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedAutomation === automation.id && (
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Subscription ID Field</p>
                        <p className="font-mono text-sm">{automation.fieldMapping.subscriptionId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Message Field</p>
                        <p className="font-mono text-sm">{automation.fieldMapping.message}</p>
                      </div>
                      {automation.fieldMapping.type && (
                        <div>
                          <p className="text-sm text-muted-foreground">Type Field</p>
                          <p className="font-mono text-sm">{automation.fieldMapping.type}</p>
                        </div>
                      )}
                      {automation.fieldMapping.image && (
                        <div>
                          <p className="text-sm text-muted-foreground">Image Field</p>
                          <p className="font-mono text-sm">{automation.fieldMapping.image}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>Created: {new Date(automation.createdAt).toLocaleString()}</p>
                      {automation.lastRun && (
                        <p>Last run: {new Date(automation.lastRun).toLocaleString()}</p>
                      )}
                      <p>Run count: {automation.runCount}</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAutomation(automation.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
