import React, { useState, useEffect, useCallback } from 'react';
import { Star, Flag, Trash2, Edit3, MessageSquare, AlertCircle, Check, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Novel, Review, RatingDistribution } from '../types';
import { reviewService } from '../services/reviewService';
import { DocumentSnapshot } from 'firebase/firestore';

interface NovelReviewsProps {
  novel: Novel;
  onRatingUpdated?: () => void;
}

export const NovelReviews: React.FC<NovelReviewsProps> = ({ novel, onRatingUpdated }) => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  // User's own review
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Report Modal
  const [reportingReview, setReportingReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState<'spam' | 'harassment' | 'unlawful' | 'other'>('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Distribution & aggregates
  const visitorAvg = novel.visitorRatingAverage || 0;
  const visitorCount = novel.visitorRatingCount || 0;
  const dist: RatingDistribution = novel.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const isUserRestricted = profile?.status === 'restricted' || profile?.status === 'deactivated';
  const isNovelRatingDisabled = novel.ratingsEnabled === false;

  const fetchReviews = useCallback(async (filterRating: number | null) => {
    try {
      setLoading(true);
      const res = await reviewService.getNovelReviews({
        novelId: novel.id,
        ratingFilter: filterRating || undefined,
        pageSize: 6,
      });
      setReviews(res.reviews);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('fetchReviews error:', err);
    } finally {
      setLoading(false);
    }
  }, [novel.id]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await reviewService.getNovelReviews({
        novelId: novel.id,
        ratingFilter: starFilter || undefined,
        pageSize: 6,
        lastDoc,
      });
      setReviews(prev => [...prev, ...res.reviews]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('loadMore error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(starFilter);
  }, [fetchReviews, starFilter]);

  // Check user review on mount
  useEffect(() => {
    async function loadUserReview() {
      if (!user) {
        setUserReview(null);
        return;
      }
      const existing = await reviewService.getUserReviewForNovel(novel.id, user.uid);
      if (existing) {
        setUserReview(existing);
        setSelectedRating(existing.rating);
        setReviewText(existing.reviewText || '');
      } else {
        setUserReview(null);
        setSelectedRating(5);
        setReviewText('');
      }
    }
    loadUserReview();
  }, [novel.id, user]);

  const handleStartEditing = () => {
    if (userReview) {
      setSelectedRating(userReview.rating);
      setReviewText(userReview.reviewText || '');
    }
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    if (userReview) {
      setSelectedRating(userReview.rating);
      setReviewText(userReview.reviewText || '');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSubmitting(true);
      setActionNotice(null);
      const res = await reviewService.submitOrUpdateReview({
        novelId: novel.id,
        novelTitle: novel.title,
        userId: user.uid,
        userName: profile?.name || user.displayName || user.email?.split('@')[0] || 'قارئ حبر',
        userEmail: user.email || '',
        rating: selectedRating,
        reviewText: reviewText.trim(),
      });

      if (!res.success) {
        setActionNotice({ type: 'error', msg: res.error || t.common.error });
        return;
      }

      setActionNotice({ type: 'success', msg: t.novelReviews.reviewSubmittedSuccess });
      setIsEditing(false);

      // Refresh user review and public list
      const updated = await reviewService.getUserReviewForNovel(novel.id, user.uid);
      setUserReview(updated);
      await fetchReviews(starFilter);
      if (onRatingUpdated) onRatingUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.common.error;
      setActionNotice({ type: 'error', msg });
    } finally {
      setSubmitting(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleDeleteUserReview = async () => {
    if (!user || !userReview) return;
    if (!window.confirm(t.novelReviews.confirmDeleteReview)) return;
    try {
      setSubmitting(true);
      setActionNotice(null);
      const ok = await reviewService.deleteUserReview(novel.id, user.uid);
      if (ok) {
        setUserReview(null);
        setIsEditing(false);
        setSelectedRating(5);
        setReviewText('');
        setActionNotice({ type: 'success', msg: t.novelReviews.reviewDeletedSuccess });
        await fetchReviews(starFilter);
        if (onRatingUpdated) onRatingUpdated();
      } else {
        setActionNotice({ type: 'error', msg: t.common.error });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.common.error;
      setActionNotice({ type: 'error', msg });
    } finally {
      setSubmitting(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleOpenReport = (review: Review) => {
    setReportingReview(review);
    setReportReason('spam');
    setReportDetails('');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportingReview) return;
    try {
      setSubmittingReport(true);
      const res = await reviewService.reportReview({
        reviewId: reportingReview.id,
        novelId: novel.id,
        novelTitle: novel.title,
        reportedUserId: reportingReview.userId,
        reportedUserName: reportingReview.userName,
        reporterUid: user.uid,
        reporterName: profile?.name || user.email?.split('@')[0] || 'قارئ',
        reason: reportReason,
        details: reportDetails,
        reviewExcerpt: reportingReview.reviewText,
        reviewRating: reportingReview.rating,
      });

      setActionNotice({ type: res.success ? 'success' : 'error', msg: res.message });
      setReportingReview(null);
    } finally {
      setSubmittingReport(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Render Star Bar
  const renderStarBar = (stars: 5 | 4 | 3 | 2 | 1) => {
    const count = dist[stars] || 0;
    const pct = visitorCount > 0 ? Math.round((count / visitorCount) * 100) : 0;
    const isSelected = starFilter === stars;

    return (
      <button
        key={stars}
        type="button"
        onClick={() => setStarFilter(isSelected ? null : stars)}
        className={`w-full flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-stone-100 transition ${
          isSelected ? 'bg-amber-50 font-bold text-amber-900' : 'text-stone-700'
        }`}
        title={`تصفية حسب ${stars} نجوم`}
      >
        <span className="w-12 text-start flex items-center gap-1 font-mono">
          <span>{stars}</span>
          <Star size={11} className="text-amber-500 fill-amber-500" />
        </span>
        <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-600 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-16 text-end text-[11px] text-[var(--muted)] font-mono">
          {count} ({pct}%)
        </span>
      </button>
    );
  };

  return (
    <section className="mt-16 pt-12 border-t border-[var(--line)]" id="reviews-section">
      <div className="mb-8">
        <span className="eyebrow">{t.novelReviews.sectionEyebrow}</span>
        <h2 className="font-serif text-3xl font-medium">{t.novelReviews.sectionTitle}</h2>
      </div>

      {actionNotice && (
        <div
          className={`mb-6 p-4 border text-xs flex items-center gap-2 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          {actionNotice.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{actionNotice.msg}</span>
        </div>
      )}

      {/* Rating Summary & Distribution Overview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10 p-6 bg-white border border-[var(--line)]">
        {/* Overall Score */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-e border-[var(--line)]">
          <div className="font-serif text-5xl font-bold text-[var(--green)] mb-2">
            {visitorCount > 0 ? visitorAvg.toFixed(1) : '—'}
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(st => (
              <Star
                key={st}
                size={18}
                className={
                  visitorCount > 0 && st <= Math.round(visitorAvg)
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-stone-300'
                }
              />
            ))}
          </div>
          <div className="text-xs text-[var(--ink)] font-medium">
            {t.novelReviews.genuineVisitorAverage}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            {visitorCount > 0
              ? t.novelReviews.basedOnRatings.replace('{count}', String(visitorCount))
              : t.novelReviews.noRatingsYet}
          </div>
        </div>

        {/* Breakdown Bars */}
        <div className="md:col-span-7 flex flex-col justify-center gap-1.5">
          <div className="flex justify-between items-center mb-1 text-xs text-[var(--muted)]">
            <span>{t.novelReviews.starsDistribution}</span>
            {starFilter !== null && (
              <button
                onClick={() => setStarFilter(null)}
                className="text-[11px] text-amber-700 hover:underline"
              >
                {t.novelReviews.filterAll}
              </button>
            )}
          </div>
          {renderStarBar(5)}
          {renderStarBar(4)}
          {renderStarBar(3)}
          {renderStarBar(2)}
          {renderStarBar(1)}
        </div>
      </div>

      {/* User Review Action Area */}
      <div className="mb-10 p-6 bg-[#faf9f5] border border-[var(--line)]">
        {!user ? (
          <div className="text-center py-4">
            <MessageSquare size={24} className="mx-auto text-amber-700 mb-2 opacity-80" />
            <p className="text-xs text-[var(--ink)] mb-3">{t.novelReviews.loginToReview}</p>
            <a
              href="/login"
              className="primary-button small inline-flex items-center gap-1.5"
            >
              <LogIn size={14} /> {t.common.login}
            </a>
          </div>
        ) : isUserRestricted ? (
          <div className="p-3 bg-amber-50 text-amber-800 border border-amber-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{t.novelReviews.accountRestrictedNotice}</span>
          </div>
        ) : isNovelRatingDisabled ? (
          <div className="p-3 bg-stone-100 text-stone-700 text-xs text-center">
            {t.novelReviews.ratingsDisabledNotice}
          </div>
        ) : userReview && !isEditing ? (
          /* User already reviewed — display their own review with edit/delete */
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[var(--green)] text-white text-[11px] font-medium rounded">
                  {t.novelReviews.yourReviewBadge}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(st => (
                    <Star
                      key={st}
                      size={14}
                      className={
                        st <= userReview.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-stone-300'
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartEditing}
                  className="text-xs text-stone-700 hover:text-[var(--green)] flex items-center gap-1"
                >
                  <Edit3 size={13} /> {t.common.edit}
                </button>
                <button
                  onClick={handleDeleteUserReview}
                  disabled={submitting}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 size={13} /> {t.common.delete}
                </button>
              </div>
            </div>
            {userReview.reviewText && (
              <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line bg-white p-3 border border-[var(--line)]">
                {userReview.reviewText}
              </p>
            )}
          </div>
        ) : (
          /* Submission or Editing Form */
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <h3 className="font-serif text-lg font-medium text-[var(--ink)]">
              {userReview ? t.novelReviews.editReviewTitle : t.novelReviews.writeReviewTitle}
            </h3>

            {/* Interactive Stars */}
            <div>
              <label className="block text-xs text-[var(--muted)] mb-2 font-medium">
                {t.novelReviews.starSelectLabel}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedRating(st)}
                    onMouseEnter={() => setHoverRating(st)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={`${st} stars`}
                  >
                    <Star
                      size={26}
                      className={
                        st <= (hoverRating || selectedRating)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-stone-300 hover:text-amber-300'
                      }
                    />
                  </button>
                ))}
                <span className="text-sm font-bold text-amber-700 ms-2 font-mono">
                  {hoverRating || selectedRating} / 5
                </span>
              </div>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                rows={3}
                maxLength={1000}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder={t.novelReviews.reviewTextPlaceholder}
                className="w-full p-3 border border-[var(--line)] text-xs bg-white focus:outline-none focus:border-[var(--green)] resize-y"
              />
              <div className="text-end text-[10px] text-[var(--muted)]">
                {reviewText.length} / 1000
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="primary-button small"
              >
                {submitting
                  ? t.common.loading
                  : userReview
                  ? t.novelReviews.updateReviewBtn
                  : t.novelReviews.submitReviewBtn}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="outline-button small"
                >
                  {t.common.cancel}
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Reviews Filter Chips & List Header */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-6 pb-2 border-b border-[var(--line)]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStarFilter(null)}
            className={`px-3 py-1 text-xs border rounded-full transition ${
              starFilter === null
                ? 'bg-[var(--green)] text-white border-[var(--green)]'
                : 'border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--green)]'
            }`}
          >
            {t.novelReviews.filterAll} ({visitorCount})
          </button>
          {[5, 4, 3, 2, 1].map(st => (
            <button
              key={st}
              onClick={() => setStarFilter(st)}
              className={`px-2.5 py-1 text-xs border rounded-full flex items-center gap-1 transition ${
                starFilter === st
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-[var(--line)] bg-white text-[var(--muted)] hover:border-amber-700'
              }`}
            >
              <span>{st}</span>
              <Star size={10} className={starFilter === st ? 'fill-white' : 'fill-amber-500 text-amber-500'} />
              <span>({dist[st as 1 | 2 | 3 | 4 | 5] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Public Reviews List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[var(--muted)]">
          {t.common.loading}
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-[var(--line)] p-6 bg-white">
          <MessageSquare size={32} className="mx-auto text-[var(--bronze)] mb-2 opacity-60" />
          <h4 className="text-sm font-medium text-[var(--ink)] mb-1">
            {t.novelReviews.noReviewsYet}
          </h4>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(rev => (
            <article
              key={rev.id}
              className="p-5 bg-white border border-[var(--line)] hover:border-stone-300 transition"
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 font-serif font-bold text-sm flex items-center justify-center">
                    {rev.userName ? rev.userName[0] : 'ق'}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--ink)]">
                      {rev.userName}
                    </h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map(st => (
                        <Star
                          key={st}
                          size={12}
                          className={
                            st <= rev.rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-stone-200'
                          }
                        />
                      ))}
                      <span className="text-[10px] text-[var(--muted)] ms-1 font-mono">
                        {rev.rating}.0
                      </span>
                    </div>
                  </div>
                </div>

                {/* Report button */}
                {user && user.uid !== rev.userId && (
                  <button
                    onClick={() => handleOpenReport(rev)}
                    className="text-[11px] text-[var(--muted)] hover:text-amber-800 flex items-center gap-1"
                    title={t.novelReviews.reportBtn}
                  >
                    <Flag size={12} />
                    <span className="hidden sm:inline">{t.novelReviews.reportBtn}</span>
                  </button>
                )}
              </div>

              {rev.reviewText && (
                <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line mt-3 font-serif">
                  {rev.reviewText}
                </p>
              )}
            </article>
          ))}

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="outline-button small"
              >
                {loadingMore ? t.common.loading : t.novelReviews.loadMoreReviews}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reporting Modal */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-[var(--line)] shadow-xl animate-in fade-in">
            <h3 className="font-serif text-lg font-medium text-[var(--ink)] mb-2">
              {t.novelReviews.reportModalTitle}
            </h3>
            <p className="text-xs text-[var(--muted)] mb-4">
              {reportingReview.userName} · {reportingReview.rating}★
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  {t.visitorManagement.reasonLabel}
                </label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value as 'spam' | 'harassment' | 'unlawful' | 'other')}
                  className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                >
                  <option value="spam">{t.novelReviews.reportReasonSpam}</option>
                  <option value="harassment">{t.novelReviews.reportReasonHarassment}</option>
                  <option value="unlawful">{t.novelReviews.reportReasonUnlawful}</option>
                  <option value="other">{t.novelReviews.reportReasonOther}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">
                  {t.visitorManagement.detailsLabel}
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                  placeholder={t.novelReviews.reportDetailsPlaceholder}
                  className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setReportingReview(null)}
                  className="outline-button small"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="primary-button small"
                >
                  {submittingReport ? t.common.loading : t.novelReviews.submitReportBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
