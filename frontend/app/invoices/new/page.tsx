// frontend/app/(dashboard)/invoices/new/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'; // Import Dialog components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PlusCircle,
  Trash2,
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api';

interface Client {
  id: number;
  name: string;
  email: string;
}
interface LineItem {
  id: string | number;
  description: string;
  quantity: number;
  unit_price: number;
}
interface NewInvoicePayload {
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  service_items: Omit<LineItem, 'id'>[];
}
interface ApiError {
  error: string;
}
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    amount
  );

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');

  // Main Form States
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientId, setClientId] = useState<string>(preselectedClientId || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 },
  ]);

  // States for the "Add New Client" Dialog
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [clientDialogError, setClientDialogError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchClientsData = async () => {
      setIsLoadingClients(true);
      try {
        const response = await fetch(`${API_BASE_URL}/clients`);
        if (!response.ok) throw new Error('Failed to fetch clients');
        const data: Client[] = await response.json();
        setClients(data);
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : 'Could not load clients.'
        );
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchClientsData();
  }, []);

  useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
    }
  }, [preselectedClientId]);

  // --- New Client Creation Handler ---
  const handleCreateNewClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingClient(true);
    setClientDialogError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClientName, email: newClientEmail }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create client.');
      }
      const newClient: Client = await response.json();

      // Add new client to the list, select it automatically, and close the dialog
      setClients((prev) => [...prev, newClient]);
      setClientId(String(newClient.id));
      setIsClientDialogOpen(false);
      setNewClientName('');
      setNewClientEmail('');
    } catch (err) {
      setClientDialogError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setIsCreatingClient(false);
    }
  };

  // --- Line Item and Total Calculation Handlers (no changes) ---
  const addLineItem = () =>
    setLineItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 },
    ]);
  const removeLineItem = (id: string | number) =>
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  const handleLineItemChange = (
    id: string | number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const numValue =
            name === 'quantity' || name === 'unit_price'
              ? parseFloat(value) || 0
              : value;
          return { ...item, [name]: numValue };
        }
        return item;
      })
    );
  };
  const calculateLineItemTotal = (item: LineItem) =>
    (item.quantity || 0) * (item.unit_price || 0);
  const subTotal = lineItems.reduce(
    (sum, item) => sum + calculateLineItemTotal(item),
    0
  );
  const grandTotal = subTotal; // Expand later if needed

  // --- Main Form Submit Handler (no changes) ---
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!clientId || !issueDate || !dueDate) {
      setFormError('Client, Issue Date, and Due Date are required.');
      setIsSubmitting(false);
      return;
    }
    const itemsToSubmit = lineItems
      .filter((item) => item.description.trim() !== '')
      .map(({ id, ...rest }) => rest);
    if (itemsToSubmit.length === 0) {
      setFormError('At least one line item with a description is required.');
      setIsSubmitting(false);
      return;
    }

    const payload: Omit<NewInvoicePayload, 'status'> = {
      client_id: clientId,
      invoice_number: invoiceNumber,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      service_items: itemsToSubmit,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create invoice.');
      }
      router.push('/invoices');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Create New Invoice</CardTitle>
            <Link href="/invoices" passHref>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Invoices
              </Button>
            </Link>
          </div>
          <CardDescription>
            Fill in the details below to create a new invoice.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            {/* Client and Invoice Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <div className="flex space-x-2">
                  <Select
                    value={clientId}
                    onValueChange={setClientId}
                    disabled={isLoadingClients || isSubmitting}
                  >
                    <SelectTrigger id="client_id">
                      <SelectValue
                        placeholder={
                          isLoadingClients
                            ? 'Loading clients...'
                            : 'Select a client'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={String(client.id)}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* --- NEW: Add Client Button and Dialog --- */}
                  <Dialog
                    open={isClientDialogOpen}
                    onOpenChange={setIsClientDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Add new client"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                        <DialogDescription>
                          Create a new client profile. You can add more details
                          later.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={handleCreateNewClient}
                        className="space-y-4 py-2"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="new-client-name">Client Name</Label>
                          <Input
                            id="new-client-name"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            required
                            disabled={isCreatingClient}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-client-email">Client Email</Label>
                          <Input
                            id="new-client-email"
                            type="email"
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            required
                            disabled={isCreatingClient}
                          />
                        </div>
                        {clientDialogError && (
                          <p className="text-sm text-destructive">
                            {clientDialogError}
                          </p>
                        )}
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={isCreatingClient}
                            >
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button type="submit" disabled={isCreatingClient}>
                            {isCreatingClient && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Create Client
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number</Label>
                <Input
                  id="invoice_number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV-001"
                  disabled={isSubmitting}
                />
              </div>
              <div> {/* Spacer */} </div>
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <DatePicker
                  date={issueDate}
                  setDate={setIssueDate}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <DatePicker
                  date={dueDate}
                  setDate={setDueDate}
                  disabled={isSubmitting}
                  placeholder="Select due date"
                />
              </div>
            </div>

            {/* Line Items Section (no changes) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%] md:w-[50%]">
                      Description
                    </TableHead>
                    <TableHead className="w-[15%] md:w-[10%]">
                      Quantity
                    </TableHead>
                    <TableHead className="w-[20%] md:w-[15%]">
                      Unit Price
                    </TableHead>
                    <TableHead className="text-right w-[20%] md:w-[15%]">
                      Total
                    </TableHead>
                    <TableHead className="w-auto p-1 md:p-2"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="pr-1 md:pr-2">
                        <Input
                          name="description"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(item.id, e)}
                          placeholder="Service or product"
                          disabled={isSubmitting}
                        />
                      </TableCell>
                      <TableCell className="px-1 md:px-2">
                        <Input
                          name="quantity"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(item.id, e)}
                          className="w-full min-w-[60px]"
                          disabled={isSubmitting}
                          min="0"
                        />
                      </TableCell>
                      <TableCell className="px-1 md:px-2">
                        <Input
                          name="unit_price"
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleLineItemChange(item.id, e)}
                          className="w-full min-w-[80px]"
                          disabled={isSubmitting}
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-right pl-1 md:pl-2">
                        {formatCurrency(calculateLineItemTotal(item))}
                      </TableCell>
                      <TableCell className="p-1 md:p-2">
                        {(lineItems.length > 1 ||
                          item.description.trim() !== '' ||
                          item.quantity !== 1 ||
                          item.unit_price !== 0) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(item.id)}
                            disabled={isSubmitting}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                disabled={isSubmitting}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>

            {/* Totals and Error Section (no changes) */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(subTotal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
            {formError && (
              <div className="p-3 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md">
                <AlertTriangle className="h-5 w-5" />
                <p>{formError}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-between md:justify-end items-center space-x-2">
            <Link href="/invoices" passHref>
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || isLoadingClients}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Invoice
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
