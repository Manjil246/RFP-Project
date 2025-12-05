import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient, type Vendor } from "@/lib/api";
import { Loader2, Plus, Edit, Trash2, Users, Mail, Phone } from "lucide-react";

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAllVendors();
      setVendors(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      // Build contactInfo object from individual fields
      const contactInfoObj: Record<string, string> = {};
      if (formData.phone) contactInfoObj.phone = formData.phone;
      if (formData.address) contactInfoObj.address = formData.address;
      if (formData.company) contactInfoObj.company = formData.company;

      const contactInfo = Object.keys(contactInfoObj).length > 0 ? contactInfoObj : undefined;

      if (editingVendor) {
        await apiClient.updateVendor(editingVendor.id, {
          name: formData.name,
          email: formData.email,
          contactInfo: contactInfo,
        });
      } else {
        await apiClient.createVendor({
          name: formData.name,
          email: formData.email,
          contactInfo: contactInfo,
        });
      }

      resetForm();
      loadVendors();
    } catch (err: any) {
      setError(err.message || "Failed to save vendor");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddVendor = () => {
    setEditingVendor(null);
    setFormData({ name: "", email: "", phone: "", address: "", company: "" });
    setError(null);
    setShowDialog(true);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    const contactInfo = (vendor.contactInfo as Record<string, any>) || {};
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: contactInfo.phone || "",
      address: contactInfo.address || "",
      company: contactInfo.company || "",
    });
    setError(null);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      await apiClient.deleteVendor(id);
      loadVendors();
    } catch (err: any) {
      setError(err.message || "Failed to delete vendor");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", address: "", company: "" });
    setEditingVendor(null);
    setShowDialog(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground mt-1">
            Manage your vendor contacts
          </p>
        </div>
        <Button onClick={handleAddVendor}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {error && !showDialog && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vendor List</CardTitle>
          <CardDescription>
            {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} in your
            database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No vendors yet. Add your first vendor to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{vendor.name}</h3>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground ml-6">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {vendor.email}
                      </div>
                      {vendor.contactInfo && (
                        <>
                          {(vendor.contactInfo as any)?.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {(vendor.contactInfo as any).phone}
                            </div>
                          )}
                          {(vendor.contactInfo as any)?.company && (
                            <div className="text-xs">
                              {(vendor.contactInfo as any).company}
                            </div>
                          )}
                          {(vendor.contactInfo as any)?.address && (
                            <div className="text-xs">
                              {(vendor.contactInfo as any).address}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(vendor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(vendor.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
            <DialogDescription>
              {editingVendor
                ? "Update vendor information"
                : "Add a new vendor to your contact list"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Vendor name"
                  required
                  disabled={formLoading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="vendor@example.com"
                  required
                  disabled={formLoading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone (optional)</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+91 9876543210"
                  disabled={formLoading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Company (optional)</label>
                <Input
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Company name"
                  disabled={formLoading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address (optional)</label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Main St, City, State, ZIP"
                  disabled={formLoading}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingVendor ? "Update" : "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
