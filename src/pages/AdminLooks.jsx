import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, GripVertical, Image, LayoutDashboard, X, Upload, Sparkles, Eye, DollarSign, Copy, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function AdminLooks() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLook, setEditingLook] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: looks = [], isLoading } = useQuery({
    queryKey: ['admin-looks'],
    queryFn: () => base44.entities.Look.list('sort_order', 100)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: bloggers = [] } = useQuery({
    queryKey: ['all-bloggers'],
    queryFn: () => base44.entities.Blogger.list()
  });

  const [copiedLookId, setCopiedLookId] = React.useState(null);

  const copyLookLink = (look) => {
    const bloggerId = look.blogger_id || '';
    const url = `${window.location.origin}/LookDetail?id=${look.id}${bloggerId ? `&ref=${bloggerId}` : ''}`;
    navigator.clipboard.writeText(url);
    setCopiedLookId(look.id);
    setTimeout(() => setCopiedLookId(null), 2000);
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Look.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-looks'] })
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderedLooks) => {
      await Promise.all(
        reorderedLooks.map((look, index) =>
          base44.entities.Look.update(look.id, { sort_order: index })
        )
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-looks'] })
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(looks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderMutation.mutate(items);
  };

  const handleEdit = (look) => {
    setEditingLook(look);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingLook(null);
    setIsDialogOpen(true);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LayoutDashboard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-white">
              Manage Looks
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Drag to reorder • Create outfit combinations for customers
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Look
          </Button>
        </div>

        {isLoading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        ) : looks.length === 0 ? (
          <div className="text-center py-12 border dark:border-gray-800 rounded-lg">
            <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No looks created yet</p>
            <Button onClick={handleAdd}>Create Your First Look</Button>
          </div>
        ) : (
          <div className="border dark:border-gray-800 rounded-lg overflow-hidden">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="looks">
                {(provided) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="w-24">Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Blogger</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                      {looks.map((look, index) => (
                        <Draggable key={look.id} draggableId={look.id} index={index}>
                          {(provided, snapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={snapshot.isDragging ? 'bg-gray-50 dark:bg-gray-800' : ''}
                            >
                              <TableCell>
                                <div {...provided.dragHandleProps} className="cursor-grab">
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="w-16 h-20 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                                  <img
                                    src={look.images?.[0] || look.image}
                                    alt={look.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{look.title}</TableCell>
                              <TableCell>
                                {look.blogger_id ? (
                                  <div className="flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-purple-500" />
                                    <span className="text-sm">
                                      {bloggers.find(b => b.id === look.blogger_id)?.name || 'Unknown'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>{look.product_ids?.length || 0} items</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {look.views || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    €{((look.revenue_cents || 0) / 100).toFixed(0)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  look.is_active 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                  {look.is_active ? 'Published' : 'Draft'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyLookLink(look)}
                                    title="Copy share link"
                                  >
                                    {copiedLookId === look.id ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(look)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteMutation.mutate(look.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TableBody>
                  </Table>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingLook ? 'Edit Look' : 'Create Look'}</DialogTitle>
            </DialogHeader>
            <LookForm
              look={editingLook}
              products={products}
              bloggers={bloggers}
              onClose={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function LookForm({ look, products, bloggers, onClose }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(look?.title || '');
  const [description, setDescription] = useState(look?.description || '');
  const [images, setImages] = useState(look?.images || (look?.image ? [look.image] : []));
  const [tags, setTags] = useState(look?.tags?.join(', ') || '');
  const [selectedProducts, setSelectedProducts] = useState(look?.product_ids || []);
  const [bloggerId, setBloggerId] = useState(look?.blogger_id || '');
  const [isActive, setIsActive] = useState(look?.is_active ?? true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title,
        description,
        images,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        product_ids: selectedProducts,
        blogger_id: bloggerId || null,
        is_active: isActive,
        sort_order: look?.sort_order ?? 0
      };

      if (look) {
        return base44.entities.Look.update(look.id, data);
      } else {
        return base44.entities.Look.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-looks'] });
      onClose();
    }
  });

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      });
      const newUrls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setMainImage = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      const [moved] = newImages.splice(index, 1);
      newImages.unshift(moved);
      return newImages;
    });
  };

  const toggleProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Search by name, SKU, or ID
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.title_en?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query) ||
      p.id?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summer Vibes Look"
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch checked={isActive} onCheckedChange={setIsActive} id="published" />
          <Label htmlFor="published">Published</Label>
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this look..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tags (comma separated)</Label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="summer, casual, beach"
          />
        </div>
        <div>
          <Label>Assign to Blogger (optional)</Label>
          <Select value={bloggerId} onValueChange={setBloggerId}>
            <SelectTrigger>
              <SelectValue placeholder="No blogger assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>No blogger</SelectItem>
              {bloggers.map(blogger => (
                <SelectItem key={blogger.id} value={blogger.id}>
                  {blogger.name} {blogger.instagram_handle && `(@${blogger.instagram_handle})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Images (first is main)</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <div className={`w-20 h-24 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden ${idx === 0 ? 'ring-2 ring-blue-500' : ''}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {idx !== 0 && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={() => setMainImage(idx)}>
                    ★
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={() => removeImage(idx)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {idx === 0 && (
                <Badge className="absolute -top-1 -left-1 text-[10px] px-1">Main</Badge>
              )}
            </div>
          ))}
          <label className="w-20 h-24 border-2 border-dashed dark:border-gray-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
        {isUploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
      </div>

      <div className="flex-1 min-h-0">
        <Label>Select Products ({selectedProducts.length} selected, 3-8 recommended)</Label>
        <Input
          placeholder="Search by name, SKU, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2 mb-2"
        />
        <ScrollArea className="h-40 border dark:border-gray-800 rounded-lg">
          <div className="p-2 space-y-1">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  selectedProducts.includes(product.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => toggleProduct(product.id)}
              >
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => toggleProduct(product.id)}
                />
                <div className="w-10 h-12 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.title_en}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">${product.price?.toFixed(2)}</p>
                    {product.sku && (
                      <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!title || images.length === 0 || selectedProducts.length === 0 || saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : look ? 'Update Look' : 'Create Look'}
        </Button>
      </div>
    </div>
  );
}