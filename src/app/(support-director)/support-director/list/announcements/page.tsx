"use client";
import { useState } from "react";
import { useSDAnnouncements } from "@/hooks/useSupportDirector";
import { SDTable, SDPagination, SDSearch } from "@/components/SDTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AnnouncementsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data, isLoading, error, refetch } = useSDAnnouncements({ search, page });

  const handleCreate = async (formData: FormData) => {
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    };

    try {
      const res = await fetch("/api/support-director/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      toast.success("Announcement created successfully");
      setIsCreateOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create announcement");
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editingAnnouncement) return;

    const data = {
      id: editingAnnouncement.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    };

    try {
      const res = await fetch("/api/support-director/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      toast.success("Announcement updated successfully");
      setIsEditOpen(false);
      setEditingAnnouncement(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update announcement");
    }
  };

  const handleArchive = async (id: number) => {
    try {
      const res = await fetch(`/api/support-director/announcements?id=${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      toast.success("Announcement archived successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to archive announcement");
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await fetch("/api/support-director/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      toast.success("Announcement restored successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to restore announcement");
    }
  };

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setIsEditOpen(true);
  };

  if (error) return <div className="p-4">Error: {error.message}</div>;

  const columns = [
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    { key: "createdAt", label: "Created", render: (announcement: any) => new Date(announcement.createdAt).toLocaleDateString() },
    {
      key: "actions",
      label: "Actions",
      render: (announcement: any) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleEdit(announcement)}>Edit</Button>
          {announcement.archivedAt ? (
            <Button size="sm" variant="outline" onClick={() => handleRestore(announcement.id)}>Restore</Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => handleArchive(announcement.id)}>Archive</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger>
            <Button>Create Announcement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input name="title" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" rows={4} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <SDSearch value={search} onChange={setSearch} placeholder="Search announcements..." />
      
      <SDTable 
        data={data?.announcements || []} 
        columns={columns} 
        isLoading={isLoading}
      />
      
      <SDPagination 
        currentPage={page} 
        totalPages={data?.totalPages || 1} 
        onPageChange={setPage} 
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          {editingAnnouncement && (
            <form action={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input name="title" defaultValue={editingAnnouncement.title} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" defaultValue={editingAnnouncement.description} rows={4} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}