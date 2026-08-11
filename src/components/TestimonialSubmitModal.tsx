import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Send, CheckCircle2, AlertCircle, User, Upload } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

interface TestimonialSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EVENT_TYPES = [
  { value: 'Weddings', label: 'Royal Wedding' },
  { value: 'Corporate Events', label: 'Corporate Gala' },
  { value: 'Birthday Parties', label: 'Birthday Celebration' },
  { value: 'Anniversary Celebrations', label: 'Anniversary Sangeet' },
  { value: 'Housewarming', label: 'Griha Pravesh' },
  { value: 'Festival Catering', label: 'Festival Prasad' },
  { value: 'Reception Events', label: 'Reception Buffet' },
];

export default function TestimonialSubmitModal({ isOpen, onClose }: TestimonialSubmitModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [eventType, setEventType] = useState('Weddings');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [photoError, setPhotoError] = useState('');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError(t('formPhotoSize'));
      return;
    }
    setPhotoError('');
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setAvatarPreview('');
  };

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setCity('');
      setEventType('Weddings');
      setRating(5);
      setComment('');
      setError('');
      setSuccess(false);
      setPhoto(null);
      setAvatarPreview('');
      setPhotoError('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      setError(t('formRequired'));
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('formEmailInvalid'));
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      let avatarUrl = '';
      if (photo) {
        const uploadRes = await api.uploadPublicFile(photo);
        if (!uploadRes.success || !uploadRes.data?.url) {
          setError(uploadRes.error || t('formError'));
          setIsSubmitting(false);
          return;
        }
        avatarUrl = uploadRes.data.url;
      }
      const res = await api.submitTestimonial({
        name: name.trim(),
        email: email.trim(),
        city: city.trim(),
        eventType,
        rating,
        comment: comment.trim(),
        avatar: avatarUrl,
      });
      if (!res.success) {
        throw new Error(res.error || 'Submission failed');
      }
      setSuccess(true);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Failed to submit review', err);
      setIsSubmitting(false);
      setError(t('formError'));
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-primary text-secondary font-semibold placeholder-slate-400 text-xs sm:text-sm';
  const labelClass = 'text-xs font-bold text-slate-500';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-secondary/50 backdrop-blur-sm font-sans"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-cream rounded-3xl border border-accent/20 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {success ? (
              <div className="p-8 sm:p-10 text-center relative">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-secondary">
                  {t('formSuccessTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-3 leading-relaxed max-w-sm mx-auto">
                  {t('formSuccessMessage')}
                </p>
                <button
                  onClick={onClose}
                  className="mt-7 w-full py-3.5 bg-secondary text-white font-bold rounded-2xl shadow-md hover:bg-slate-800 transition-all cursor-pointer text-xs sm:text-sm"
                >
                  {t('formClose')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 relative">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Send className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-secondary">
                    {t('shareYourExperience')}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold font-sans mt-1 max-w-[340px]">
                    {t('modalSubtitle')}
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs sm:text-sm font-bold text-rose-600 flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelClass}>{t('formName')}</label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('formNamePlaceholder')}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>{t('formEmail')}</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('formEmailPlaceholder')}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelClass}>{t('formCity')}</label>
                      <input
                        type="text"
                        maxLength={100}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('formCityPlaceholder')}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>{t('formEventType')}</label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className={`${inputClass} cursor-pointer`}
                      >
                        {EVENT_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>{t('formRating')}</label>
                      <div className="flex items-center gap-1.5 py-2.5 px-3 bg-white border border-slate-200 rounded-2xl">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => setRating(i + 1)}
                            className="text-primary hover:scale-110 transition-transform cursor-pointer"
                            aria-label={`${i + 1} star${i === 0 ? '' : 's'}`}
                          >
                            <Star className={`w-5 h-5 ${rating > i ? 'fill-primary text-primary' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>{t('formPhoto')}</label>
                    <div className="flex items-center gap-3">
                      {avatarPreview ? (
                        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-primary/30 shrink-0 bg-slate-100">
                          <img src={avatarPreview} alt="Profile preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 shrink-0">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                          <Upload className="w-4 h-4" />
                          {avatarPreview ? t('formPhotoChange') : t('formPhotoUpload')}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoSelect}
                          />
                        </label>
                        {avatarPreview && (
                          <button type="button" onClick={removePhoto} className="text-[11px] font-bold text-rose-500 hover:text-rose-700 text-left cursor-pointer">
                            {t('formPhotoRemove')}
                          </button>
                        )}
                      </div>
                    </div>
                    {photoError && (
                      <p className="text-[11px] font-bold text-rose-500">{photoError}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>{t('formComment')}</label>
                    <textarea
                      required
                      rows={4}
                      maxLength={1000}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('formCommentPlaceholder')}
                      className={`${inputClass} leading-relaxed`}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-secondary text-white font-bold rounded-2xl shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('formSubmitting')}
                      </span>
                    ) : (
                      <span>{t('formSubmit')}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
