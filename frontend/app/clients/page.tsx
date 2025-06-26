// frontend/app/(dashboard)/clients/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api';

interface Client {
  id: number;
  name: string;
  email: string;
}

interface ApiError {
  error: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null); // For errors outside dialogs
  const [formError, setFormError] = useState<string | null>(null); // For errors inside dialogs

  // State for Add/Edit Dialog
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client> | null>(
    null
  );
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/clients`);
      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({
            error: `Failed to fetch clients: ${response.statusText}`,
          }));
        throw new Error(errorData.error);
      }
      const data: Client[] = await response.json();
      setClients(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setPageError(errorMessage);
      console.error('Fetch clients error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenFormDialog = (mode: 'add' | 'edit', client?: Client) => {
    setDialogMode(mode);
    setCurrentClient(mode === 'add' ? { name: '', email: '' } : { ...client }); // Use spread for edit to avoid direct state mutation if client is from state
    setIsFormDialogOpen(true);
    setFormError(null); // Clear previous dialog errors
  };

  const handleDialogSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentClient || !currentClient.name || !currentClient.email) {
      setFormError('Name and Email are required.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    const method = dialogMode === 'add' ? 'POST' : 'PUT';
    const url =
      dialogMode === 'add'
        ? `${API_BASE_URL}/clients`
        : `${API_BASE_URL}/clients/${currentClient.id}`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentClient.name,
          email: currentClient.email,
        }),
      });
      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({
            error: `Failed to ${dialogMode} client. Status: ${response.statusText}`,
          }));
        throw new Error(errorData.error);
      }
      setIsFormDialogOpen(false);
      fetchClients(); // Refresh the list
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `An unknown error occurred while ${dialogMode}ing client.`;
      setFormError(errorMessage);
      console.error(`${dialogMode} client error:`, err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
    setFormError(null); // Clear errors from other dialogs
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/clients/${clientToDelete.id}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({ error: 'Failed to delete client.' }));
        throw new Error(errorData.error || 'Failed to delete client');
      }
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
      fetchClients(); // Refresh list
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred while deleting client.';
      setFormError(errorMessage); // Show error in the delete dialog
      console.error('Delete client error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && clients.length === 0) {
    // Show full page loader only on initial load
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {' '}
      {/* Removed p-4, dashboard layout should handle padding */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Manage Clients</CardTitle>
            <Button onClick={() => handleOpenFormDialog('add')}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
            </Button>
          </div>
          {pageError && (
            <CardDescription className="text-red-500 mt-2 flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" /> {pageError}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading &&
            clients.length > 0 && ( // Show subtle loading indicator when refreshing
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="ml-2 text-muted-foreground">
                  Refreshing clients...
                </p>
              </div>
            )}
          {!isLoading && clients.length === 0 && !pageError ? (
            <p className="text-center text-muted-foreground py-4">
              No clients found. Add your first client!
            </p>
          ) : clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenFormDialog('edit', client)}
                      >
                        <Edit className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(client)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
        {clients.length > 0 && (
          <CardFooter className="text-sm text-muted-foreground">
            Showing {clients.length} client{clients.length === 1 ? '' : 's'}.
          </CardFooter>
        )}
      </Card>
      {/* Add/Edit Client Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? 'Add New Client' : 'Edit Client'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'add'
                ? 'Enter the details for the new client.'
                : "Update the client's details."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDialogSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={currentClient?.name || ''}
                  onChange={(e) =>
                    setCurrentClient((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="col-span-3"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={currentClient?.email || ''}
                  onChange={(e) =>
                    setCurrentClient((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="col-span-3"
                  required
                  disabled={isSubmitting}
                />
              </div>
              {formError && (
                <p className="col-span-4 text-red-500 text-sm flex items-center p-2 bg-red-500/10 rounded-md">
                  <AlertTriangle className="mr-2 h-4 w-4" /> {formError}
                </p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {dialogMode === 'add' ? 'Add Client' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete client "{clientToDelete?.name}"?
              This action cannot be undone. Associated invoices might also be
              affected or deleted.
            </DialogDescription>
          </DialogHeader>
          {formError &&
            isDeleteDialogOpen && ( // Only show error if this dialog is open
              <p className="text-red-500 text-sm mb-4 flex items-center p-2 bg-red-500/10 rounded-md">
                <AlertTriangle className="mr-2 h-4 w-4" /> {formError}
              </p>
            )}
          <DialogFooter className="sm:justify-end space-x-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setFormError(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
