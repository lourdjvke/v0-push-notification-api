'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

const FREE_USER_EMAIL = 'jvkechris@gmail.com';

export default function InternalPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<any>(null);
  const [expandedHistory, setExpandedHistory] = useState(false);

  useEffect(() => {
    // Redirect if not free user
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail !== FREE_USER_EMAIL) {
      router.replace('/');
      return;
    }
    setEmail(FREE_USER_EMAIL);
    fetchCurrentPrice();
  }, [router]);

  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch('/api/settings/apikey-pricing');
      const data = await response.json();
      setCurrentPrice(data);
      setNewPrice(data.displayAmount?.toString() || '5000');
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const handleVerify = () => {
    if (code === '988555') {
      setAuthorized(true);
      toast.success('Code verified!');
    } else {
      toast.error('Invalid code');
      setCode('');
    }
  };

  const handleUpdatePrice = async () => {
    if (!newPrice || Number(newPrice) <= 0) {
      toast.error('Invalid price');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/settings/apikey-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: FREE_USER_EMAIL,
          code: '988555',
          displayAmount: Number(newPrice),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Price updated successfully!');
        await fetchCurrentPrice();
      } else {
        toast.error(data.error || 'Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Admin Verification</CardTitle>
              <CardDescription>Enter your verification code to access admin settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={email} disabled className="mt-1" />
              </div>

              <div>
                <label className="text-sm font-medium">Secret Code</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type={showCode ? 'text' : 'password'}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter code"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleVerify();
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCode(!showCode)}
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={handleVerify} className="w-full">
                Verify
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage API key pricing and settings</p>
        </div>

        {/* Current Price */}
        {currentPrice && (
          <Card>
            <CardHeader>
              <CardTitle>Current API Key Price</CardTitle>
              <CardDescription>Price per month for non-free users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Display Amount (NGN)</p>
                  <p className="text-2xl font-bold">{currentPrice.displayAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Kobo</p>
                  <p className="text-2xl font-bold">{currentPrice.amount}</p>
                </div>
              </div>
              {currentPrice.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(currentPrice.updatedAt).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Update Price */}
        <Card>
          <CardHeader>
            <CardTitle>Update Price</CardTitle>
            <CardDescription>Set new price for API key registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Price (NGN)</label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="e.g., 5000"
                min="100"
                step="100"
                className="mt-1"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>This will convert to: <span className="font-mono font-bold">{Number(newPrice) * 100}</span> Kobo</p>
            </div>

            <Button
              onClick={handleUpdatePrice}
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? 'Updating...' : 'Update Price'}
            </Button>
          </CardContent>
        </Card>

        {/* Price History */}
        {currentPrice?.history && currentPrice.history.length > 0 && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setExpandedHistory(!expandedHistory)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Price Change History</CardTitle>
                  <CardDescription>Last {currentPrice.history.length} changes</CardDescription>
                </div>
                {expandedHistory ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </CardHeader>
            {expandedHistory && (
              <CardContent>
                <div className="space-y-3">
                  {currentPrice.history.map((entry: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono font-bold">{entry.displayAmount} NGN</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          by {entry.updatedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
