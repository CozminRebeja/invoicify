// frontend/app/invoices/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Printer,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api';

interface LineItemDetail {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface InvoiceDetail {
  id: number;
  client_id: number;
  client_name?: string;
  client_email?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  service_items: LineItemDetail[];
  notes?: string;
  payment_terms?: string;
}

interface ApiError {
  error: string;
}

const formatCurrency = (amount: number | undefined) => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
};

const getStatusBadgeVariant = (
  status: string | undefined
): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'default';
    case 'sent':
      return 'secondary';
    case 'unpaid':
      return 'warning';
    case 'overdue':
      return 'destructive';
    case 'draft':
      return 'outline';
    default:
      return 'outline';
  }
};

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();

  const getInvoiceId = () => {
    if (params?.id) {
      return Array.isArray(params.id) ? params.id[0] : params.id;
    }
    return null;
  };
  const invoiceId = getInvoiceId();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      setPageError('Invoice ID is missing or invalid.');
      setIsLoading(false);
      return;
    }

    const fetchInvoiceDetails = async () => {
      setIsLoading(true);
      setPageError(null);
      const requestUrl = `${API_BASE_URL}/invoices/${invoiceId}`;

      try {
        const response = await fetch(requestUrl);
        if (!response.ok) {
          let errorDetail = `Status: ${response.status} ${response.statusText}`;
          try {
            const errorData: ApiError = await response.json();
            errorDetail = errorData.error || errorDetail;
          } catch (jsonError) {
            console.error('Could not parse error response as JSON:', jsonError);
          }
          throw new Error(`Failed to fetch invoice. ${errorDetail}`);
        }
        const data: InvoiceDetail = await response.json();
        setInvoice(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'An unknown error occurred during fetch.';
        setPageError(errorMessage);
        console.error('Fetch invoice error details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [invoiceId]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!invoiceId) {
      setPageError('Cannot update status: Invoice ID is missing.');
      return;
    }
    setIsUpdatingStatus(true);
    setPageError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/${invoiceId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to update status.`);
      }

      const updatedInvoice: InvoiceDetail = await response.json();
      setInvoice(updatedInvoice);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setPageError(errorMessage);
      console.error('Update status error:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoiceId) {
      setPageError('Cannot download PDF: Invoice ID is missing.');
      return;
    }
    setIsDownloading(true);
    setPageError(null);
    const pdfUrl = `${API_BASE_URL}/invoices/${invoiceId}/pdf`;

    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        let errorMsg = `Failed to download PDF. Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = `Failed to download PDF: ${
            response.statusText || response.status
          }`;
        }
        throw new Error(errorMsg);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const disposition = response.headers.get('Content-Disposition');
      let filename = `invoice_${invoice?.invoice_number || invoiceId}.pdf`;
      if (disposition && disposition.includes('attachment')) {
        const filenameMatch = disposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'PDF download failed.';
      setPageError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading invoice details...</p>
      </div>
    );
  }

  if (pageError && !invoice) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{pageError}</p>
            <Button
              onClick={() => router.push('/invoices')}
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Invoice Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested invoice could not be found.</p>
            <Button
              onClick={() => router.push('/invoices')}
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const yourCompany = {
    name: 'Your Company LLC',
    address: '123 Main St, Anytown, USA',
    email: 'contact@yourcompany.com',
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {pageError && (
          <div className="text-sm text-red-600 p-2 bg-red-500/10 rounded-md flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" /> {pageError}
          </div>
        )}
        <div className="flex space-x-2">
          {invoice.status.toLowerCase() !== 'paid' && (
            <Button
              onClick={() => handleUpdateStatus('paid')}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark as Paid
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.print()}
            disabled={isDownloading || isUpdatingStatus}
          >
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={isDownloading || isLoading || isUpdatingStatus}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden" id="invoice-to-print">
        <CardHeader className="bg-muted/30 p-6 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">INVOICE</h1>
              <p className="text-muted-foreground">
                Invoice #: {invoice.invoice_number}
              </p>
            </div>
            <div className="text-left md:text-right">
              <h2 className="text-xl font-semibold">{yourCompany.name}</h2>
              <p className="text-sm text-muted-foreground">
                {yourCompany.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {yourCompany.email}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
            <div>
              <h3 className="font-semibold mb-1 text-muted-foreground">
                BILLED TO:
              </h3>
              <p className="font-medium">{invoice.client_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">
                {invoice.client_email || ''}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="mb-1">
                <span className="font-semibold text-muted-foreground">
                  Issue Date:{' '}
                </span>
                {formatDate(invoice.issue_date)}
              </div>
              <div className="mb-1">
                <span className="font-semibold text-muted-foreground">
                  Due Date:{' '}
                </span>
                {formatDate(invoice.due_date)}
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">
                  Status:{' '}
                </span>
                <Badge
                  variant={getStatusBadgeVariant(invoice.status)}
                  className="text-sm capitalize ml-1"
                >
                  {invoice.status}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%] sm:w-[60%]">
                    Description
                  </TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.service_items && invoice.service_items.length > 0 ? (
                  invoice.service_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No line items for this invoice.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>
                  {formatCurrency(
                    invoice.service_items?.reduce(
                      (sum, item) => sum + item.subtotal,
                      0
                    )
                  )}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>TOTAL:</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="pt-6 border-t">
              <h4 className="font-semibold mb-1 text-muted-foreground">
                Notes:
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          )}
          {invoice.payment_terms && (
            <div className="pt-4">
              <h4 className="font-semibold mb-1 text-muted-foreground">
                Payment Terms:
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {invoice.payment_terms}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 border-t text-center text-xs text-muted-foreground">
          Thank you for your business!
        </CardFooter>
      </Card>
    </div>
  );
}
