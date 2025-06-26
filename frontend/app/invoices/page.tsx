// frontend/app/(dashboard)/invoices/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api';

interface Invoice {
  id: number;
  client_id: number;
  client_name?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
}

interface ApiError {
  error: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // State for Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setPageError(null);
    const requestUrl = `${API_BASE_URL}/invoices`;
    console.log('Fetching invoices from:', requestUrl); // For debugging

    try {
      const response = await fetch(requestUrl);
      console.log('Fetch invoices response status:', response.status); // For debugging

      if (!response.ok) {
        let errorDetail = `Status: ${response.status}`;
        try {
          const errorData: ApiError = await response.json();
          errorDetail = errorData.error || errorDetail;
        } catch (jsonError) {
          // If response is not JSON, use the status text
          errorDetail = `Failed to fetch invoices: ${
            response.statusText || response.status
          }`;
        }
        throw new Error(errorDetail);
      }
      const data: Invoice[] = await response.json();
      setInvoices(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred while fetching invoices.';
      setPageError(errorMessage);
      console.error('Fetch invoices error details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateString; // Fallback if date is not parsable
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
        return 'warning'; // Ensure you have a 'warning' variant or adjust
      case 'overdue':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const openDeleteDialog = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    const deleteUrl = `${API_BASE_URL}/invoices/${invoiceToDelete.id}`;
    console.log('Attempting to delete invoice from:', deleteUrl); // For debugging

    try {
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });
      console.log('Delete invoice response status:', response.status); // For debugging

      if (!response.ok) {
        let errorDetail = `Status: ${response.status}`;
        try {
          const errorData: ApiError = await response.json();
          errorDetail = errorData.error || errorDetail;
        } catch (jsonError) {
          errorDetail = `Failed to delete invoice: ${
            response.statusText || response.status
          }`;
        }
        throw new Error(errorDetail);
      }
      setIsDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices(); // Refresh the list
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred while deleting the invoice.';
      setDeleteError(errorMessage);
      console.error('Delete invoice error details:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Invoices</CardTitle>
            <Link href="/invoices/new" passHref>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
              </Button>
            </Link>
          </div>
          {pageError && (
            <CardDescription className="text-red-500 mt-2 flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" /> {pageError}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading &&
            invoices.length > 0 && ( // Subtle loading indicator when refreshing
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="ml-2 text-muted-foreground">
                  Refreshing invoices...
                </p>
              </div>
            )}
          {!isLoading && invoices.length === 0 && !pageError ? (
            <p className="text-center text-muted-foreground py-4">
              No invoices found. Create your first invoice!
            </p>
          ) : invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number || 'N/A'}
                    </TableCell>
                    <TableCell>{invoice.client_name || 'N/A'}</TableCell>
                    <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(invoice.status)}
                        className="capitalize"
                      >
                        {invoice.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">
                              Open menu for invoice {invoice.invoice_number}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() =>
                              router.push(`/invoices/${invoice.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive hover:!text-destructive focus:!text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10"
                            onSelect={() => openDeleteDialog(invoice)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
        {invoices.length > 0 && !isLoading && (
          <CardFooter className="text-sm text-muted-foreground">
            Showing {invoices.length} invoice{invoices.length === 1 ? '' : 's'}.
          </CardFooter>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice "
              {invoiceToDelete?.invoice_number}"
              {invoiceToDelete?.client_name
                ? ` for ${invoiceToDelete.client_name}`
                : ''}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md my-2 flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" />{' '}
              {deleteError}
            </p>
          )}
          <DialogFooter className="sm:justify-end space-x-2 pt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteInvoice}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
