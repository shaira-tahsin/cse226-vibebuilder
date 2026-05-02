import { useRef, useState } from 'react';
import { VibeComponent } from '../../types/site.types';
import { uploadImage } from '../../services/sites.service';
import { Input } from '@/components/ui-kit/input';
import { Label } from '@/components/ui-kit/label';
import { Button } from '@/components/ui-kit/button';
import { Textarea } from '@/components/ui-kit/textarea';
import { X, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PropertyPanelProps {
  component: VibeComponent;
  onChange: (updated: VibeComponent) => void;
  onClose: () => void;
}

// ─── Reusable field components ────────────────────────────────────────────────

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8 text-sm"
    />
  </div>
);

const TextareaField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm min-h-[80px]"
    />
  </div>
);

// ─── Image upload field ───────────────────────────────────────────────────────
const ImageUploadField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (fileId: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileId = await uploadImage(file);
      onChange(fileId);
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="File ID or URL"
          className="h-8 text-sm flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 shrink-0"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      {value && (
        <img
          src={value}
          alt="preview"
          className="w-full h-24 object-cover rounded-md mt-1 border"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const update = (component: VibeComponent, key: string, value: unknown): VibeComponent => ({
  ...component,
  Props: { ...component.Props, [key]: value },
});

// ─── Main Panel ───────────────────────────────────────────────────────────────

export const PropertyPanel = ({ component, onChange, onClose }: PropertyPanelProps) => {
  const p = component.Props;
  const set = (key: string) => (val: unknown) => onChange(update(component, key, val));

  const renderFields = () => {
    switch (component.Type) {
      case 'hero':
        return (
          <>
            <Field
              label="Heading"
              value={(p.heading as string) || ''}
              onChange={set('heading')}
              placeholder="Your Headline"
            />
            <Field
              label="Subheading"
              value={(p.subheading as string) || ''}
              onChange={set('subheading')}
              placeholder="Subtitle text"
            />
            {!(p.imageUrl as string) && (
              <Field
                label="Background Color"
                value={(p.bgColor as string) || '#1e293b'}
                onChange={set('bgColor')}
                type="color"
              />
            )}
            <Field
              label="Heading Color"
              value={(p.textColor as string) || '#ffffff'}
              onChange={set('textColor')}
              type="color"
            />
            <Field
              label="Subheading Color"
              value={(p.subheadingColor as string) || '#ffffff'}
              onChange={set('subheadingColor')}
              type="color"
            />
            <div className="space-y-1">
              <Label className="text-xs">Heading Font</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.headingFontFamily as string) || 'inherit'}
                onChange={(e) => set('headingFontFamily')(e.target.value)}
              >
                <option value="inherit">Default</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'Lato', sans-serif">Lato</option>
                <option value="'Merriweather', serif">Merriweather</option>
                <option value="'Pacifico', cursive">Pacifico</option>
                <option value="'Space Mono', monospace">Space Mono</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Subheading Font</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.subheadingFontFamily as string) || 'inherit'}
                onChange={(e) => set('subheadingFontFamily')(e.target.value)}
              >
                <option value="inherit">Default</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'Lato', sans-serif">Lato</option>
                <option value="'Merriweather', serif">Merriweather</option>
                <option value="'Pacifico', cursive">Pacifico</option>
                <option value="'Space Mono', monospace">Space Mono</option>
              </select>
            </div>

            <ImageUploadField
              label="Background Image"
              value={(p.imageUrl as string) || ''}
              onChange={set('imageUrl')}
            />
            <Field
              label="Image Opacity (%)"
              value={String(p.imageOpacity ?? 100)}
              onChange={(v) => set('imageOpacity')(Math.min(100, Math.max(0, Number(v))))}
              type="number"
              placeholder="100"
            />
            <Field
              label="CTA Button Text"
              value={(p.ctaText as string) || ''}
              onChange={set('ctaText')}
              placeholder="Get Started"
            />
            <Field
              label="CTA Link"
              value={(p.ctaLink as string) || ''}
              onChange={set('ctaLink')}
              placeholder="https://..."
            />
            <Field
              label="Button Background"
              value={(p.ctaBgColor as string) || '#ffffff'}
              onChange={set('ctaBgColor')}
              type="color"
            />
            <Field
              label="Button Text Color"
              value={(p.ctaTextColor as string) || '#0f172a'}
              onChange={set('ctaTextColor')}
              type="color"
            />
            <div className="space-y-1">
              <Label className="text-xs">Button Size</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.ctaSize as string) || 'md'}
                onChange={(e) => set('ctaSize')(e.target.value)}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Button Border Radius</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.ctaRounded as string) || 'md'}
                onChange={(e) => set('ctaRounded')(e.target.value)}
              >
                <option value="sm">Sharp</option>
                <option value="md">Rounded</option>
                <option value="full">Pill</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Button Font</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.ctaFontFamily as string) || 'inherit'}
                onChange={(e) => set('ctaFontFamily')(e.target.value)}
              >
                <option value="inherit">Default</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'Lato', sans-serif">Lato</option>
                <option value="'Merriweather', serif">Merriweather</option>
                <option value="'Pacifico', cursive">Pacifico</option>
                <option value="'Space Mono', monospace">Space Mono</option>
              </select>
            </div>
          </>
        );

      case 'heading':
        return (
          <>
            <Field
              label="Text"
              value={(p.text as string) || ''}
              onChange={set('text')}
              placeholder="Section Title"
            />
            <div className="space-y-1">
              <Label className="text-xs">Level</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.level as string) || 'h2'}
                onChange={(e) => set('level')(e.target.value)}
              >
                <option value="h1">H1 — Page Title</option>
                <option value="h2">H2 — Section Title</option>
                <option value="h3">H3 — Subsection</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Text Align</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.textAlign as string) || 'left'}
                onChange={(e) => set('textAlign')(e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <Field
              label="Color"
              value={(p.color as string) || '#0f172a'}
              onChange={set('color')}
              type="color"
            />
            <div className="space-y-1">
              <Label className="text-xs">Font Family</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.fontFamily as string) || 'inherit'}
                onChange={(e) => set('fontFamily')(e.target.value)}
              >
                <option value="inherit">Default</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'Lato', sans-serif">Lato</option>
                <option value="'Merriweather', serif">Merriweather</option>
                <option value="'Pacifico', cursive">Pacifico</option>
                <option value="'Space Mono', monospace">Space Mono</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Style</Label>
              <div className="flex gap-1">
                {[
                  { key: 'bold', label: 'B', style: 'font-bold', defaultOn: true },
                  { key: 'italic', label: 'I', style: 'italic', defaultOn: false },
                  { key: 'underline', label: 'U', style: 'underline decoration-current', defaultOn: false },
                ].map(({ key, label, style, defaultOn }) => {
                  const val = p[key as keyof typeof p];
                  const isOn = val === undefined ? defaultOn : !!val;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set(key)(!isOn)}
                      className={`w-8 h-8 rounded border text-sm transition-colors ${
                        isOn
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-background text-foreground border-input hover:bg-muted'
                      } ${style}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        );

      case 'text-block':
        return (
          <>
            <TextareaField
              label="Content"
              value={(p.content as string) || ''}
              onChange={set('content')}
            />
            <Field
              label="Font Size"
              value={(p.fontSize as string) || '16px'}
              onChange={set('fontSize')}
              placeholder="16px"
            />
            <div className="space-y-1">
              <Label className="text-xs">Text Align</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.textAlign as string) || 'left'}
                onChange={(e) => set('textAlign')(e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Font Family</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.fontFamily as string) || 'inherit'}
                onChange={(e) => set('fontFamily')(e.target.value)}
              >
                <option value="inherit">Default</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'Lato', sans-serif">Lato</option>
                <option value="'Merriweather', serif">Merriweather</option>
                <option value="'Pacifico', cursive">Pacifico</option>
                <option value="'Space Mono', monospace">Space Mono</option>
              </select>
            </div>
            <Field
              label="Text Color"
              value={(p.color as string) || '#000000'}
              onChange={set('color')}
              type="color"
            />
            <div className="space-y-1">
              <Label className="text-xs">Text Style</Label>
              <div className="flex gap-1">
                {[
                  { key: 'bold', label: 'B', style: 'font-bold' },
                  { key: 'italic', label: 'I', style: 'italic' },
                  { key: 'underline', label: 'U', style: 'underline decoration-current' },
                ].map(({ key, label, style }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set(key)(!(p[key as keyof typeof p] as boolean))}
                    className={`w-8 h-8 rounded border text-sm transition-colors ${
                      p[key as keyof typeof p]
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-background text-foreground border-input hover:bg-muted'
                    } ${style}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case 'image':
        return (
          <>
            <ImageUploadField
              label="Image"
              value={(p.imageUrl as string) || ''}
              onChange={set('imageUrl')}
            />
            <Field
              label="Alt Text"
              value={(p.alt as string) || ''}
              onChange={set('alt')}
              placeholder="Image description"
            />
            <div className="space-y-1">
              <Label className="text-xs">Width — {(p.width as string) || '100%'}</Label>
              <input
                type="range"
                min={10}
                max={100}
                value={parseInt((p.width as string) || '100')}
                onChange={(e) => set('width')(`${e.target.value}%`)}
                className="w-full accent-blue-600"
              />
            </div>
            <Field
              label="Caption"
              value={(p.caption as string) || ''}
              onChange={set('caption')}
              placeholder="Optional caption"
            />
          </>
        );

      case 'image-gallery':
        return (
          <>
            <Field
              label="Columns"
              value={String(p.columns || 3)}
              onChange={(v) => set('columns')(Number(v))}
              type="number"
              placeholder="3"
            />
            <Field
              label="Gap (px)"
              value={String(p.gap || 12)}
              onChange={(v) => set('gap')(Number(v))}
              type="number"
              placeholder="12"
            />
            <GalleryImagesEditor
              images={(p.images as { url: string; alt: string }[]) || []}
              onChange={set('images')}
            />
          </>
        );

      case 'contact-form':
        return (
          <>
            <Field
              label="Submit Button Text"
              value={(p.submitText as string) || 'Send Message'}
              onChange={set('submitText')}
            />
            <Field
              label="Button Background"
              value={(p.submitBgColor as string) || '#0f172a'}
              onChange={set('submitBgColor')}
              type="color"
            />
            <Field
              label="Button Text Color"
              value={(p.submitTextColor as string) || '#ffffff'}
              onChange={set('submitTextColor')}
              type="color"
            />
            <p className="text-xs text-muted-foreground">
              Fields: Name, Email, Message (pre-configured)
            </p>
          </>
        );

      case 'divider':
        return (
          <>
            <Field
              label="Color"
              value={(p.color as string) || '#e2e8f0'}
              onChange={set('color')}
              type="color"
            />
            <Field
              label="Thickness (px)"
              value={String(p.thickness || 1)}
              onChange={(v) => set('thickness')(Number(v))}
              type="number"
            />
            <Field
              label="Margin (px)"
              value={String(p.margin || 16)}
              onChange={(v) => set('margin')(Number(v))}
              type="number"
            />
          </>
        );

      case 'spacer':
        return (
          <Field
            label="Height (px)"
            value={String(p.height || 40)}
            onChange={(v) => set('height')(Number(v))}
            type="number"
          />
        );

      case 'button':
        return (
          <>
            <Field
              label="Button Text"
              value={(p.text as string) || ''}
              onChange={set('text')}
              placeholder="Click Me"
            />
            <Field
              label="Link"
              value={(p.link as string) || ''}
              onChange={set('link')}
              placeholder="https://..."
            />
            <Field
              label="Background Color"
              value={(p.bgColor as string) || '#1e293b'}
              onChange={set('bgColor')}
              type="color"
            />
            <Field
              label="Text Color"
              value={(p.textColor as string) || '#ffffff'}
              onChange={set('textColor')}
              type="color"
            />
            <div className="space-y-1">
              <Label className="text-xs">Size</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.size as string) || 'md'}
                onChange={(e) => set('size')(e.target.value)}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Alignment</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.align as string) || 'center'}
                onChange={(e) => set('align')(e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Border Radius</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.rounded as string) || 'md'}
                onChange={(e) => set('rounded')(e.target.value)}
              >
                <option value="sm">Sharp</option>
                <option value="md">Rounded</option>
                <option value="full">Pill</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Font Family</Label>
              <select
                className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                value={(p.fontFamily as string) || 'inherit'}
                onChange={(e) => set('fontFamily')(e.target.value)}
              >
                <option value="inherit">Default</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'Lato', sans-serif">Lato</option>
                <option value="'Merriweather', serif">Merriweather</option>
                <option value="'Pacifico', cursive">Pacifico</option>
                <option value="'Space Mono', monospace">Space Mono</option>
              </select>
            </div>
          </>
        );

      case 'two-column':
        return (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Left Column Width — {p.leftWidth || 50}%</Label>
              <input
                type="range"
                min={20}
                max={80}
                value={(p.leftWidth as number) || 50}
                onChange={(e) => set('leftWidth')(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Left: {p.leftWidth || 50}%</span>
                <span>Right: {100 - ((p.leftWidth as number) || 50)}%</span>
              </div>
            </div>
            <Field
              label="Gap (px)"
              value={String(p.gap || 16)}
              onChange={(v) => set('gap')(Number(v))}
              type="number"
              placeholder="16"
            />
            <Field
              label="Padding (px)"
              value={String(p.padding || 16)}
              onChange={(v) => set('padding')(Number(v))}
              type="number"
              placeholder="16"
            />
            <Field
              label="Background Color"
              value={(p.bgColor as string) || '#ffffff'}
              onChange={set('bgColor')}
              type="color"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Use the + buttons inside each column to add components.
            </p>
          </>
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">No properties available</p>
        );
    }
  };

  const typeLabel: Record<string, string> = {
    hero: 'Hero Section',
    'text-block': 'Text Block',
    image: 'Image',
    'image-gallery': 'Image Gallery',
    'contact-form': 'Contact Form',
    divider: 'Divider',
    spacer: 'Spacer',
    heading: 'Heading',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h3 className="font-semibold text-sm">{typeLabel[component.Type] || component.Type}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">{renderFields()}</div>
    </div>
  );
};

// ─── Gallery image manager ────────────────────────────────────────────────────

const GalleryImagesEditor = ({
  images,
  onChange,
}: {
  images: { url: string; alt: string }[];
  onChange: (val: unknown) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const fileId = await uploadImage(file);
          return { url: fileId, alt: file.name };
        })
      );
      onChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} image(s) added`);
    } catch {
      toast.error('One or more uploads failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Gallery Images</Label>
      <div className="space-y-1">
        {images.map((img, i) => (
          <div key={i} className="flex items-center gap-2">
            <img
              src={img.url}
              alt={img.alt}
              className="w-10 h-10 object-cover rounded border shrink-0"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <span className="text-xs text-muted-foreground flex-1 truncate">{img.alt}</span>
            <button
              onClick={() => removeImage(i)}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full h-8 text-xs"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading...</>
        ) : (
          <><Upload className="w-3.5 h-3.5 mr-1.5" /> Add Images</>
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
};
