import { useState, useRef, useCallback } from 'react';

// Inject Google Fonts once
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Pacifico&family=Space+Mono:wght@400;700&display=swap';

if (typeof document !== 'undefined' && !document.getElementById('vibe-google-fonts')) {
  const link = document.createElement('link');
  link.id = 'vibe-google-fonts';
  link.rel = 'stylesheet';
  link.href = GOOGLE_FONTS_URL;
  document.head.appendChild(link);
}
import { VibeComponent } from '../../types/site.types';

// ─── Hero ────────────────────────────────────────────────────────────────────
export const HeroComponent = ({
  component,
  isEditing = false,
  onPositionChange,
}: {
  component: VibeComponent;
  isEditing?: boolean;
  onPositionChange?: (yPercent: number) => void;
}) => {
  const p = component.Props as {
    heading?: string;
    subheading?: string;
    subheadingColor?: string;
    bgColor?: string;
    textColor?: string;
    imageUrl?: string;
    imageYPercent?: number;
    imageOpacity?: number;
    ctaText?: string;
    ctaLink?: string;
    ctaBgColor?: string;
    ctaTextColor?: string;
    ctaSize?: 'sm' | 'md' | 'lg';
    ctaRounded?: 'sm' | 'md' | 'full';
    ctaFontFamily?: string;
    headingFontFamily?: string;
    subheadingFontFamily?: string;
  };

  const imageYPercent = p.imageYPercent !== undefined ? p.imageYPercent : 50;
  const imageOpacity = p.imageOpacity !== undefined ? p.imageOpacity / 100 : 1;

  // ── Drag-to-reposition state ──────────────────────────────────────────────
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [localY, setLocalY] = useState(imageYPercent);
  const dragStartY = useRef<number>(0);
  const dragStartPercent = useRef<number>(imageYPercent);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCoverMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditing || !p.imageUrl) return;
      e.preventDefault();
      e.stopPropagation(); // prevent canvas deselect / dnd-kit interference

      setIsDraggingCover(true);
      dragStartY.current = e.clientY;
      dragStartPercent.current = localY;

      const containerHeight = containerRef.current?.offsetHeight || 360;

      const onMouseMove = (me: MouseEvent) => {
        // Drag down → image shifts up → yPercent decreases
        const deltaY = me.clientY - dragStartY.current;
        const deltaPercent = (deltaY / containerHeight) * 100;
        const next = Math.min(100, Math.max(0, dragStartPercent.current - deltaPercent));
        setLocalY(next);
      };

      const onMouseUp = (me: MouseEvent) => {
        setIsDraggingCover(false);
        const deltaY = me.clientY - dragStartY.current;
        const deltaPercent = (deltaY / containerHeight) * 100;
        const final = Math.min(100, Math.max(0, dragStartPercent.current - deltaPercent));
        setLocalY(final);
        onPositionChange?.(Math.round(final)); // persists to DB via handleComponentChange
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [isEditing, localY, p.imageUrl, onPositionChange]
  );

  // While dragging use localY for instant feedback; otherwise use saved prop
  const displayY = isDraggingCover ? localY : imageYPercent;

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden flex flex-col items-center justify-center text-center px-8 group"
      style={{ minHeight: '360px' }}
    >
      {/* ── Solid background color layer ── */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{ backgroundColor: p.bgColor || '#1e293b' }}
      />

      {/* ── Background image layer ── */}
      {p.imageUrl && (
        <div
          onMouseDown={handleCoverMouseDown}
          className={`absolute inset-0 w-full h-full select-none ${
            isEditing
              ? isDraggingCover
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : ''
          }`}
          style={{
            backgroundImage: `url(${p.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: `center ${displayY}%`,
            backgroundRepeat: 'no-repeat',
            WebkitMaskImage: `linear-gradient(rgba(0,0,0,${imageOpacity}), rgba(0,0,0,${imageOpacity}))`,
            maskImage: `linear-gradient(rgba(0,0,0,${imageOpacity}), rgba(0,0,0,${imageOpacity}))`,
          }}
        />
      )}

      {/* ── "Drag to reposition" pill — editor only ── */}
      {isEditing && p.imageUrl && (
        <div
          className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg pointer-events-none transition-all duration-200 ${
            isDraggingCover
              ? 'opacity-100 bg-blue-600 text-white scale-105'
              : 'opacity-0 group-hover:opacity-100 bg-black/55 text-white'
          }`}
        >
          {/* up-down arrows icon */}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          {isDraggingCover ? 'Repositioning…' : 'Drag to reposition'}
        </div>
      )}

      {/* ── Content layer ── */}
      <div className="relative z-10 flex flex-col items-center gap-4 w-full py-24 pointer-events-none">
        <h1
          className="text-4xl font-bold drop-shadow-sm"
          style={{
            color: p.textColor || '#ffffff',
            fontFamily: p.headingFontFamily || 'inherit',
          }}
        >
          {p.heading || 'Your Headline Here'}
        </h1>
        {p.subheading && (
          <p
            className="text-lg max-w-xl drop-shadow-sm"
            style={{
              color: p.subheadingColor || '#ffffff',
              opacity: 0.9,
              fontFamily: p.subheadingFontFamily || 'inherit',
            }}
          >
            {p.subheading}
          </p>
        )}
        {p.ctaText && (
          <a
            href={p.ctaLink || '#'}
            className={{
              sm: 'mt-4 inline-block px-4 py-2 text-sm font-semibold hover:opacity-90 transition pointer-events-auto',
              md: 'mt-4 inline-block px-6 py-3 text-base font-semibold hover:opacity-90 transition pointer-events-auto',
              lg: 'mt-4 inline-block px-8 py-4 text-lg font-semibold hover:opacity-90 transition pointer-events-auto',
            }[(p.ctaSize as string) || 'md']}
            style={{
              backgroundColor: p.ctaBgColor || '#ffffff',
              color: p.ctaTextColor || '#0f172a',
              borderRadius: { sm: '4px', md: '8px', full: '9999px' }[(p.ctaRounded as string) || 'md'],
              fontFamily: p.ctaFontFamily || 'inherit',
            }}
          >
            {p.ctaText}
          </a>
        )}
      </div>
    </div>
  );
};

// ─── Text Block ──────────────────────────────────────────────────────────────
export const TextBlockComponent = ({ component }: { component: VibeComponent }) => {
  const p = component.Props as {
    content?: string;
    fontSize?: string;
    textAlign?: string;
    color?: string;
    fontFamily?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  return (
    <div
      className="w-full px-8 py-6"
      style={{
        fontSize: p.fontSize || '16px',
        textAlign: (p.textAlign as any) || 'left',
        color: p.color || 'inherit',
        fontFamily: (p.fontFamily as string) || 'inherit',
        fontWeight: p.bold ? 'bold' : 'normal',
        fontStyle: p.italic ? 'italic' : 'normal',
        textDecoration: p.underline ? 'underline' : 'none',
      }}
    >
      <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{p.content || 'Add your text here...'}</p>
    </div>
  );
};

// ─── Heading ─────────────────────────────────────────────────────────────────
export const HeadingComponent = ({ component }: { component: VibeComponent }) => {
  const p = component.Props as {
    text?: string;
    level?: 'h1' | 'h2' | 'h3';
    color?: string;
    textAlign?: string;
    fontFamily?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };

  const sizeMap = { h1: '2.25rem', h2: '1.75rem', h3: '1.35rem' };
  const level = p.level || 'h2';

  return (
    <div
      className="w-full px-8 py-4"
      style={{
        fontSize: sizeMap[level],
        fontWeight: p.bold === false ? 'normal' : 'bold',
        fontStyle: p.italic ? 'italic' : 'normal',
        textDecoration: p.underline ? 'underline' : 'none',
        textAlign: (p.textAlign as any) || 'left',
        color: p.color || '#0f172a',
        fontFamily: p.fontFamily || 'inherit',
      }}
    >
      <span className="break-words">{p.text || 'Section Title'}</span>
    </div>
  );
};
export const ImageComponent = ({ component }: { component: VibeComponent }) => {
  const p = component.Props as {
    imageUrl?: string;
    alt?: string;
    width?: string;
    caption?: string;
  };
  return (
    <div className="w-full px-8 py-4 flex flex-col items-center gap-2">
      {p.imageUrl ? (
        <img
          src={p.imageUrl}
          alt={p.alt || ''}
          className="rounded-lg max-w-full"
          style={{ width: p.width || '100%' }}
        />
      ) : (
        <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
          No image selected
        </div>
      )}
      {p.caption && <p className="text-sm text-muted-foreground">{p.caption}</p>}
    </div>
  );
};

// ─── Image Gallery ───────────────────────────────────────────────────────────
export const ImageGalleryComponent = ({ component }: { component: VibeComponent }) => {
  const p = component.Props as {
    images?: { url: string; alt: string }[];
    columns?: number;
    gap?: number;
  };
  const images = p.images || [];
  const cols = p.columns || 3;
  return (
    <div
      className="w-full px-8 py-6"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: `${p.gap || 12}px`,
      }}
    >
      {images.length === 0 ? (
        <div className="col-span-full h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
          No images added
        </div>
      ) : (
        images.map((img, i) => (
          <img key={i} src={img.url} alt={img.alt} className="w-full h-40 object-cover rounded-lg" />
        ))
      )}
    </div>
  );
};

// ─── Contact Form ─────────────────────────────────────────────────────────────
export const ContactFormComponent = ({
  component,
  siteId,
  siteSlug,
}: {
  component: VibeComponent;
  siteId?: string;
  siteSlug?: string;
}) => {
  const p = component.Props as {
    submitText?: string;
    submitBgColor?: string;
    submitTextColor?: string;
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email address';
    if (!message.trim()) e.message = 'Message is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    setSubmitError('');

    try {
      const BLOCKS_API = import.meta.env.VITE_BLOCKS_API_URL || 'https://api.seliseblocks.com';
      const BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY;
      const PROJECT_SLUG = import.meta.env.VITE_PROJECT_SLUG;

      const mutation = `
        mutation InsertVibeFormSubmission($input: VibeFormSubmissionInsertInput!) {
          insertVibeFormSubmission(input: $input) {
            itemId
            acknowledged
          }
        }
      `;

      const res = await fetch(`${BLOCKS_API}/uds/v1/${PROJECT_SLUG}/gateway`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-blocks-key': BLOCKS_KEY,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              SiteId: siteId || '',
              SiteSlug: siteSlug || '',
              Name: name.trim(),
              Email: email.trim(),
              Message: message.trim(),
              SubmittedAt: new Date().toISOString(),
            },
          },
        }),
      });

      const data = await res.json();
      if (data?.data?.insertVibeFormSubmission?.acknowledged) {
        setSubmitted(true);
        setName(''); setEmail(''); setMessage('');
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } catch {
      setSubmitError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-400 transition";
  const errorClass = "text-xs text-red-500 mt-0.5";

  if (submitted) {
    return (
      <div className="w-full px-8 py-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-slate-800">Message sent!</p>
        <p className="text-sm text-slate-500">Thank you for reaching out. We will get back to you soon.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-xs text-blue-600 hover:underline mt-1"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-8 py-6 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={`${inputClass} ${errors.name ? 'border-red-400' : 'border-input'}`}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              className={`${inputClass} ${errors.email ? 'border-red-400' : 'border-input'}`}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className={errorClass}>{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Message <span className="text-red-500">*</span></label>
            <textarea
              className={`${inputClass} ${errors.message ? 'border-red-400' : 'border-input'} resize-none h-28`}
              placeholder="Your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {errors.message && <p className={errorClass}>{errors.message}</p>}
          </div>

          {submitError && (
            <p className="text-sm text-red-500 text-center">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              backgroundColor: p.submitBgColor || '#0f172a',
              color: p.submitTextColor || '#ffffff',
            }}
          >
            {submitting && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {submitting ? 'Sending...' : (p.submitText || 'Send Message')}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Divider ─────────────────────────────────────────────────────────────────
export const DividerComponent = ({ component }: { component: VibeComponent }) => {
  const p = component.Props as { color?: string; thickness?: number; margin?: number };
  return (
    <div style={{ padding: `${p.margin || 16}px 32px` }}>
      <hr style={{ borderColor: p.color || 'currentColor', borderTopWidth: p.thickness || 1 }} />
    </div>
  );
};

// ─── Spacer ──────────────────────────────────────────────────────────────────
export const SpacerComponent = ({ component }: { component: VibeComponent }) => {
  const p = component.Props as { height?: number };
  return <div style={{ height: `${p.height || 40}px` }} />;
};

// ─── Button ──────────────────────────────────────────────────────────────────
export const ButtonComponent = ({ component }: { component: VibeComponent }) => {
  const p = component.Props as {
    text?: string;
    link?: string;
    bgColor?: string;
    textColor?: string;
    size?: 'sm' | 'md' | 'lg';
    align?: 'left' | 'center' | 'right';
    rounded?: 'sm' | 'md' | 'full';
    fontFamily?: string;
  };

  const sizeClass = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }[p.size || 'md'];

  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-lg',
    full: 'rounded-full',
  }[p.rounded || 'md'];

  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[p.align || 'center'];

  return (
    <div className={`w-full px-8 py-4 flex ${alignClass}`}>
      <a
        href={p.link || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block font-semibold hover:opacity-90 transition ${sizeClass} ${roundedClass}`}
        style={{
          backgroundColor: p.bgColor || '#1e293b',
          color: p.textColor || '#ffffff',
          fontFamily: p.fontFamily || 'inherit',
        }}
      >
        {p.text || 'Click Me'}
      </a>
    </div>
  );
};

// ─── Two Column ──────────────────────────────────────────────────────────────
export const TwoColumnComponent = ({
  component,
  isEditing = false,
  onComponentChange,
  onNestedSelect,
  onColumnAdd,
  selectedColumnSide,
  onDeselect,
}: {
  component: VibeComponent;
  isEditing?: boolean;
  onComponentChange?: (updated: VibeComponent) => void;
  onNestedSelect?: (parentId: string, side: 'left' | 'right', componentId: string) => void;
  onColumnAdd?: (parentId: string, side: 'left' | 'right') => void;
  selectedColumnSide?: 'left' | 'right' | null;
  onDeselect?: () => void;
}) => {
  const p = component.Props as {
    leftWidth?: number; // percentage, e.g. 50
    gap?: number;
    bgColor?: string;
    padding?: number;
  };

  const leftWidth = p.leftWidth || 50;
  const rightWidth = 100 - leftWidth;
  const gap = p.gap || 16;

  const updateLeft = (updated: VibeComponent) => {
    const newLeft = (component.LeftComponents || []).map((c) =>
      c.Id === updated.Id ? updated : c
    );
    onComponentChange?.({ ...component, LeftComponents: newLeft });
  };

  const updateRight = (updated: VibeComponent) => {
    const newRight = (component.RightComponents || []).map((c) =>
      c.Id === updated.Id ? updated : c
    );
    onComponentChange?.({ ...component, RightComponents: newRight });
  };



  const deleteFromColumn = (side: 'left' | 'right', id: string) => {
    if (side === 'left') {
      onComponentChange?.({
        ...component,
        LeftComponents: (component.LeftComponents || []).filter((c) => c.Id !== id),
      });
    } else {
      onComponentChange?.({
        ...component,
        RightComponents: (component.RightComponents || []).filter((c) => c.Id !== id),
      });
    }
  };

  const ColumnSlot = ({
    components,
    side,
  }: {
    components: VibeComponent[];
    side: 'left' | 'right';
  }) => (
    <div className="flex flex-col gap-2 h-full overflow-visible min-h-[56px] flex-1">
      {components.map((comp) => (
        <div
            key={comp.Id}
            className="relative group/col cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onNestedSelect?.(component.Id, side, comp.Id); }}
          >
          {isEditing && (
            <div className="absolute top-1 right-1 z-20 opacity-0 group-hover/col:opacity-100 transition-opacity">
              <button
                onClick={() => deleteFromColumn(side, comp.Id)}
                className="w-5 h-5 rounded bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {renderComponent(
            comp,
            isEditing,
            side === 'left' ? updateLeft : updateRight,
            onNestedSelect
          )}
        </div>
      ))}

      {isEditing && components.length === 0 && (
        <div
          data-column-slot
          onClick={(e) => { e.stopPropagation(); onColumnAdd?.(component.Id, side); }}
          className="w-full flex-1 min-h-[56px] border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Click to select, then pick from sidebar
        </div>
      )}
    </div>
  );

  return (
    <div
      className="w-full"
      onClick={(e) => { e.stopPropagation(); onDeselect?.(); }}
      style={{
        backgroundColor: p.bgColor || 'transparent',
        padding: p.padding ? `${p.padding}px` : '16px',
        minHeight: '80px',
      }}
    >
      <div className="flex w-full items-stretch" style={{ gap: `${gap}px` }}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ width: `${leftWidth}%`, minWidth: 0 }}
          className={`rounded-lg transition-all overflow-hidden flex flex-col ${
            isEditing && selectedColumnSide === 'left'
              ? 'ring-2 ring-blue-500 ring-offset-2'
              : ''
          }`}
        >
          <ColumnSlot components={component.LeftComponents || []} side="left" />
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ width: `${rightWidth}%`, minWidth: 0 }}
          className={`rounded-lg transition-all overflow-hidden flex flex-col ${
            isEditing && selectedColumnSide === 'right'
              ? 'ring-2 ring-blue-500 ring-offset-2'
              : ''
          }`}
        >
          <ColumnSlot components={component.RightComponents || []} side="right" />
        </div>
      </div>
    </div>
  );
};



// ─── Renderer map ────────────────────────────────────────────────────────────
// Pass isEditing=true from editor.tsx to enable the drag-to-reposition handle.
// Pass onComponentChange so the new yPercent is saved to state → auto-saved to DB.
export const renderComponent = (
  component: VibeComponent,
  isEditing = false,
  onComponentChange?: (updated: VibeComponent) => void,
  onNestedSelect?: (parentId: string, side: 'left' | 'right', componentId: string) => void,
  onColumnAdd?: (parentId: string, side: 'left' | 'right') => void,
  selectedColumnSide?: 'left' | 'right' | null,
  onDeselect?: () => void,
  siteId?: string,
  siteSlug?: string,
) => {
  switch (component.Type) {
    case 'hero':
      return (
        <HeroComponent
          key={component.Id}
          component={component}
          isEditing={isEditing}
          onPositionChange={(yPercent) => {
            onComponentChange?.({
              ...component,
              Props: { ...component.Props, imageYPercent: yPercent },
            });
          }}
        />
      );
    case 'text-block':
      return <TextBlockComponent key={component.Id} component={component} />;
    case 'heading':
      return <HeadingComponent key={component.Id} component={component} />;
    case 'image':
      return <ImageComponent key={component.Id} component={component} />;
    case 'image-gallery':
      return <ImageGalleryComponent key={component.Id} component={component} />;
    case 'contact-form':
      return <ContactFormComponent key={component.Id} component={component} siteId={siteId} siteSlug={siteSlug} />;
    case 'divider':
      return <DividerComponent key={component.Id} component={component} />;
    case 'spacer':
      return <SpacerComponent key={component.Id} component={component} />;
    case 'button':
      return <ButtonComponent key={component.Id} component={component} />;
    case 'two-column':
      return (
        <TwoColumnComponent
          key={component.Id}
          component={component}
          isEditing={isEditing}
          onComponentChange={onComponentChange}
          onNestedSelect={onNestedSelect}
          onColumnAdd={onColumnAdd}
          selectedColumnSide={selectedColumnSide}
          onDeselect={onDeselect}
        />
      );
    default:
      return null;
  }
};
