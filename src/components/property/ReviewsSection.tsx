import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { Review, getPropertyReviews, createReview } from '../../services/firebase/reviews';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

interface Props {
  propertyId: string;
  onReviewAdded: () => void;
}

export function ReviewsSection({ propertyId, onReviewAdded }: Props) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getPropertyReviews(propertyId);
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await createReview({
        propertyId,
        userId: user.uid,
        userName: user.displayName || 'User',
        userPhoto: '', // User type doesn't have photoURL
        rating,
        comment: comment.trim(),
      });
      
      setComment('');
      setRating(5);
      setShowForm(false);
      onReviewAdded();
      await fetchReviews();
      toast.success('Ulasan berhasil dikirim');
    } catch (error) {
      console.error('Failed to submit review', error);
      toast.error('Gagal mengirim ulasan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-xl"></div>;
  }

  return (
    <section className="mt-8 pt-8 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">Ulasan Tamu</h2>
        {user && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            Tulis Ulasan
          </button>
        )}
      </div>

      {showForm && user && (
        <form onSubmit={handleSubmit} className="bg-surface-alt p-4 rounded-xl mb-6 border border-border">
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">Penilaian Anda</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star className={`w-6 h-6 ${star <= rating ? 'fill-accent text-accent' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">Ulasan Anda</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              placeholder="Bagaimana pengalaman Anda menginap di sini?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-text-secondary text-sm italic">Belum ada ulasan untuk properti ini.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-surface p-4 rounded-xl border border-border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {review.userPhoto ? (
                      <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm">{review.userName}</h4>
                    <p className="text-xs text-text-muted">
                      {new Date(review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                  <span className="text-sm font-bold">{review.rating}</span>
                </div>
              </div>
              <p className="text-text-secondary text-sm mt-3 whitespace-pre-line">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
