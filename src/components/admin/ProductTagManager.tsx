import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ProductTagManagerProps {
  productTags: string[];
  onProductTagsChange: (tags: string[]) => void;
}

export function ProductTagManager({ productTags, onProductTagsChange }: ProductTagManagerProps) {
  const [newTag, setNewTag] = useState('');
  const { toast } = useToast();

  const addProductTag = () => {
    const tagToAdd = newTag.trim().toLowerCase();
    
    if (!tagToAdd) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen Tag-Namen ein.",
        variant: "destructive"
      });
      return;
    }

    if (productTags.includes(tagToAdd)) {
      toast({
        title: "Fehler", 
        description: "Dieser Product-Tag existiert bereits.",
        variant: "destructive"
      });
      return;
    }

    onProductTagsChange([...productTags, tagToAdd]);
    setNewTag('');
    
    toast({
      title: "Erfolgreich",
      description: `Product-Tag "${tagToAdd}" wurde hinzugefügt.`
    });
  };

  const removeProductTag = (tagToRemove: string) => {
    // Prevent removing core system tags
    if (['core', 'shyftplanner', 'shyftskills'].includes(tagToRemove)) {
      toast({
        title: "Fehler",
        description: "System-Tags können nicht gelöscht werden.",
        variant: "destructive"
      });
      return;
    }

    onProductTagsChange(productTags.filter(tag => tag !== tagToRemove));
    
    toast({
      title: "Erfolgreich",
      description: `Product-Tag "${tagToRemove}" wurde entfernt.`
    });
  };

  const systemTags = ['core', 'shyftplanner', 'shyftskills'];
  const customTags = productTags.filter(tag => !systemTags.includes(tag));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product-Tags Verwalten</CardTitle>
        <CardDescription>
          Verwalten Sie die verfügbaren Product-Tags für Vertragsmodule. System-Tags können nicht geändert werden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new tag */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="newTag">Neuer Product-Tag</Label>
            <Input
              id="newTag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="z.B. shyftanalytics"
              onKeyPress={(e) => e.key === 'Enter' && addProductTag()}
            />
          </div>
          <Button onClick={addProductTag} className="mt-6">
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </div>

        {/* System tags */}
        <div>
          <Label className="text-sm font-medium">System-Tags (nicht änderbar)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {systemTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                {tag === 'core' && <span className="text-xs">(immer enthalten)</span>}
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom tags */}
        {customTags.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Benutzerdefinierte Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {customTags.map((tag) => (
                <Badge key={tag} variant="outline" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => removeProductTag(tag)}
                    className="ml-1 hover:text-destructive"
                    title="Tag entfernen"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}