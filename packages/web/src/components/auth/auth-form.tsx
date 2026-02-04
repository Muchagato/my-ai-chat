'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KeyIcon, LogOutIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface AuthStatus {
  authenticated: boolean;
  preview?: string | null;
  error?: string | null;
}

interface AuthFormProps {
  onAuthenticated: () => void;
  initialStatus?: AuthStatus;
}

export function AuthForm({ onAuthenticated, initialStatus }: AuthFormProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus | null>(initialStatus || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data: AuthStatus = await response.json();

      if (data.authenticated) {
        setStatus(data);
        setToken('');
        onAuthenticated();
      } else {
        setError(data.error || 'Failed to authenticate');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/auth/token`, { method: 'DELETE' });
      setStatus({ authenticated: false });
    } catch (err) {
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  if (status?.authenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircleIcon className="size-5 text-green-600" />
            Authenticated
          </CardTitle>
          <CardDescription>
            Connected to your Claude account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">Token:</span>
            <code className="text-sm">{status.preview}</code>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={loading}
          >
            <LogOutIcon className="size-4 mr-2" />
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyIcon className="size-5" />
          Connect to Claude
        </CardTitle>
        <CardDescription>
          Use your personal Claude account with a setup token
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Alert>
              <AlertCircleIcon className="size-4" />
              <AlertTitle>How to get your token</AlertTitle>
              <AlertDescription className="text-sm">
                Run <code className="bg-muted px-1 rounded">claude setup-token</code> in your terminal and paste the generated token below.
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-2">
            <Input
              type="password"
              placeholder="sk-ant-oat01-..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading || !token.trim()}>
            {loading ? 'Connecting...' : 'Connect'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/status`);
    return await response.json();
  } catch {
    return { authenticated: false };
  }
}
