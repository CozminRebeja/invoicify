// frontend/app/(dashboard)/overview/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { IncomeBarChart } from '@/components/charts/income-bar-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DollarSign,
  Users,
  CreditCard,
  PlusCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api';

interface DashboardStats {
  yearly_revenue: number;
  total_outstanding: number;
  total_clients: number;
  monthly_revenue: { name: string; total: number }[];
}

interface Client {
  id: number;
  name: string;
  email: string;
}

const formatCurrency = (amount: number | undefined) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatCurrencyShort = (amount: number | undefined) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [statsResponse, clientsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard-stats`),
          fetch(`${API_BASE_URL}/clients?limit=10`),
        ]);

        if (!statsResponse.ok || !clientsResponse.ok) {
          const statsError = !statsResponse.ok
            ? `Stats: ${statsResponse.statusText}`
            : '';
          const clientsError = !clientsResponse.ok
            ? `Clients: ${clientsResponse.statusText}`
            : '';
          throw new Error(
            `Failed to fetch dashboard data. ${statsError} ${clientsError}`.trim()
          );
        }

        const statsData = await statsResponse.json();
        const clientsData = await clientsResponse.json();

        setStats(statsData);
        setClients(clientsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred.'
        );
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateInvoice = (clientId: number) => {
    router.push(`/invoices/new?clientId=${clientId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle /> Error
            </CardTitle>
            <CardDescription>Could not load dashboard data.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3 h-dvh">
      <main className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        {/* Top Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Annual Revenue (Paid)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.yearly_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total from paid invoices this year
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Outstanding Revenue
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.total_outstanding)}
              </div>
              <p className="text-xs text-muted-foreground">
                In unpaid and overdue invoices
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Clients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                +{stats?.total_clients ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                All-time client count
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart Card */}
        <Card className="h-fit p-2 pt-8">
          <CardHeader>
            <CardTitle>Income Overview</CardTitle>
            <CardDescription>
              Monthly paid revenue for the last 12 months.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <IncomeBarChart
              data={stats?.monthly_revenue || []}
            ></IncomeBarChart>
          </CardContent>
        </Card>
      </main>

      {/* Right Column - Clients Card */}
      <aside className="grid auto-rows-max items-start gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Invoice</CardTitle>
            <CardDescription>
              Select a client to create an invoice.
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[700px] overflow-y-auto">
            <div className="flex flex-col gap-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage
                        src={`/avatars/placeholder.jpg`}
                        alt={client.name}
                      />{' '}
                      {/* Using a placeholder */}
                      <AvatarFallback>
                        {client.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none">
                        {client.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {client.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreateInvoice(client.id)}
                    aria-label={`Create invoice for ${client.name}`}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {clients.length === 0 && !isLoading && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No clients found.{' '}
                  <Link
                    href="/clients"
                    className="text-primary underline font-medium"
                  >
                    Add one
                  </Link>{' '}
                  to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
