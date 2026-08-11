interface TestimonialAvatarProps {
  name?: string;
  image?: string;
  className?: string;
  textClass?: string;
}

function getInitials(name?: string): string {
  const cleaned = (name || '').trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function TestimonialAvatar({
  name,
  image,
  className = 'w-10 h-10',
  textClass = 'text-xs',
}: TestimonialAvatarProps) {
  if (image) {
    return (
      <div className={`overflow-hidden shrink-0 ${className}`}>
        <img
          src={image}
          alt={name || 'Testimonial'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden shrink-0 flex items-center justify-center bg-primary/15 text-primary font-serif font-bold ${className}`}
    >
      <span className={`${textClass} leading-none`}>{getInitials(name)}</span>
    </div>
  );
}
