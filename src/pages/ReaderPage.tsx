import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Bookmark,
  MoreHorizontal,
  Minus,
  Plus,
  Sun,
  Moon,
  Feather,
  Lock,
  ShoppingBag,
  Sparkles,
  Download,
  Send,
  EyeOff,
  Eye,
  Trash2,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { PageMeta } from '../components/PageMeta';
import { LoadingState, ErrorState } from '../components/States';
import { novelService } from '../services/novelService';
import { libraryService } from '../services/libraryService';
import { commentService } from '../services/commentService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { LIMITS } from '../config';
import { Novel, ChapterMeta, ChapterContent, Comment, ReaderSettings } from '../types';
import { getLocalizedNovelField, getLocalizedChapterTitle } from '../i18n/translations';
import { getFriendlyErrorMessage, getAdminErrorMessage } from '../lib/firebase';

export const ReaderPage: React.FC = () => {
  const { id: novelId, n: chapterNumberStr } = useParams<{ id: string; n: string }>();
  const chapterNumber = Number(chapterNumberStr) || 1;
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading: authLoading, sendVerificationEmail, emailVerified, reloadUser } = useAuth();
  const { addToCart } = useCart();
  const { t, language, rtl } = useLanguage();

  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [currentChapter, setCurrentChapter] = useState<ChapterMeta | null>(null);
  const [content, setContent] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [lastCommentDoc, setLastCommentDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendVerificationSent, setResendVerificationSent] = useState(false);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');

  // Directional icons
  const BackArrow = rtl ? ArrowRight : ArrowLeft;
  const PrevArrow = rtl ? ArrowRight : ArrowLeft;
  const NextArrow = rtl ? ArrowLeft : ArrowRight;

  // Reader Settings with persistence
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => {
    try {
      const saved = localStorage.getItem('hebr_reader_settings');
      return saved ? JSON.parse(saved) : { fontSize: 22, theme: 'warm', width: 'medium' };
    } catch {
      return { fontSize: 22, theme: 'warm', width: 'medium' };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hebr_reader_settings', JSON.stringify(readerSettings));
    } catch {
      // ignore storage error
    }
  }, [readerSettings]);

  useEffect(() => {
    async function loadReader() {
      if (!novelId || authLoading) return;
      try {
        setLoading(true);
        setLoadError('');
        // Comments are NOT fetched with the chapter: reset them and wait for the reader to ask.
        setComments([]);
        setLastCommentDoc(null);
        setHasMoreComments(false);
        setCommentsOpen(false);
        const novelData = await novelService.getNovelById(novelId);
        if (!novelData) {
          setNovel(null);
          setLoading(false);
          return;
        }
        setNovel(novelData);

        const allChapters = await novelService.getChapters(novelId, true);
        setChapters(allChapters);

        const ch = allChapters.find(c => c.number === chapterNumber) || allChapters[0];
        setCurrentChapter(ch);

        if (ch) {
          // Check unlock permission
          let entitlement = null;
          if (user) {
            entitlement = await libraryService.getUserEntitlement(user.uid, novelId);
          }

          const unlock = libraryService.checkChapterUnlocked(
            novelData,
            ch,
            profile,
            entitlement,
            isAdmin
          );

          if (unlock.isUnlocked) {
            // ONLY fetch protected content if unlocked
            const bodyData = await novelService.getChapterContent(ch.id);
            setContent(bodyData);

            // Record reading progress in library
            if (user) {
              await libraryService.updateLibraryProgress(user.uid, novelId, {
                lastChapter: ch.number,
              });
            }
          } else {
            // Locked: never fetch text
            setContent(null);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Reader load error:', err);
        setLoadError(getFriendlyErrorMessage(err, language));
      } finally {
        setLoading(false);
      }
    }

    loadReader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId, chapterNumber, user?.uid, isAdmin, profile?.subscription?.expiresAt, authLoading, reloadKey, language]);

  if (loading || authLoading) {
    return (
      <div className="reader-page">
        <LoadingState message={t.reader.loadingMessage} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="reader-page flex items-center justify-center p-8 min-h-[50vh]">
        <ErrorState
          title={t.common.error}
          error={loadError}
          onRetry={() => setReloadKey(k => k + 1)}
        />
      </div>
    );
  }

  if (!novel || !currentChapter) {
    return (
      <div className="reader-page">
        <ErrorState
          title={t.reader.notFoundTitle}
          onRetry={() => navigate(novelId ? `/novel/${novelId}` : '/browse')}
        />
      </div>
    );
  }

  const novelTitle = getLocalizedNovelField(novel, 'title', language);
  const novelAuthor = getLocalizedNovelField(novel, 'author', language);
  const currentChapterTitle = getLocalizedChapterTitle(currentChapter, language);

  const prevChapter = chapters.find(c => c.number === currentChapter.number - 1);
  const nextChapter = chapters.find(c => c.number === currentChapter.number + 1);

  const prevChapterTitle = prevChapter ? getLocalizedChapterTitle(prevChapter, language) : '';
  const nextChapterTitle = nextChapter ? getLocalizedChapterTitle(nextChapter, language) : '';

  const handleBookmarkToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const nextVal = !bookmarked;
    setBookmarked(nextVal);
    await libraryService.updateLibraryProgress(user.uid, novel.id, {
      bookmarked: nextVal,
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!emailVerified) {
      setCommentError(t.common.emailNotVerifiedComment);
      return;
    }
    const trimmed = newCommentText.trim();
    if (!trimmed || !currentChapter || !novel) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      novelId: novel.id,
      chapterId: currentChapter.id,
      userId: user.uid,
      userName: profile?.name || user.email?.split('@')[0] || (language === 'ar' ? 'قارئ' : 'Reader'),
      text: trimmed,
      hidden: false,
      createdAt: new Date(),
    };

    // Add new comment optimistically (only when the list is already on screen)
    const listWasOpen = commentsOpen;
    if (listWasOpen) setComments(prev => [optimisticComment, ...prev]);
    setNewCommentText('');
    setSubmittingComment(true);
    setCommentError('');

    try {
      const realId = await commentService.addComment(
        novel.id,
        currentChapter.id,
        user.uid,
        profile?.name || user.email?.split('@')[0] || (language === 'ar' ? 'قارئ' : 'Reader'),
        trimmed
      );
      if (listWasOpen) {
        setComments(prev => prev.map(c => c.id === tempId ? { ...c, id: realId } : c));
      } else {
        // First time the reader sees the list: load it so their new comment shows up.
        await handleShowComments();
      }
    } catch (err) {
      // Rollback optimistic comment
      setComments(prev => prev.filter(c => c.id !== tempId));
      setNewCommentText(trimmed);
      if (import.meta.env.DEV) console.warn('Comment error:', err);
      const msg = err instanceof Error ? err.message : '';
      const isOwnMessage = msg.startsWith('يرجى الانتظار') || msg.startsWith('التعليق لا يمكن');
      setCommentError(isOwnMessage ? msg : getFriendlyErrorMessage(err, language));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShowComments = async () => {
    if (!currentChapter || loadingComments) return;
    try {
      setLoadingComments(true);
      const res = await commentService.getChapterComments(currentChapter.id, isAdmin);
      setComments(res.comments);
      setLastCommentDoc(res.lastDoc);
      setHasMoreComments(res.hasMore);
      setCommentsOpen(true);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Show comments error:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLoadMoreComments = async () => {
    if (!currentChapter || !lastCommentDoc || loadingMoreComments) return;
    try {
      setLoadingMoreComments(true);
      const res = await commentService.getChapterComments(currentChapter.id, isAdmin, lastCommentDoc);
      setComments(prev => [...prev, ...res.comments]);
      setLastCommentDoc(res.lastDoc);
      setHasMoreComments(res.hasMore);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Load more comments error:', err);
    } finally {
      setLoadingMoreComments(false);
    }
  };

  const handleCheckVerified = async () => {
    setVerifyChecking(true);
    setVerifyMessage('');
    const ok = await reloadUser();
    setVerifyMessage(ok ? t.common.verifiedCheckSuccess : t.common.verifiedCheckStillNot);
    setVerifyChecking(false);
  };

  const handleResendVerification = async () => {
    try {
      setResendingVerification(true);
      await sendVerificationEmail();
      setResendVerificationSent(true);
      setTimeout(() => setResendVerificationSent(false), 5000);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Resend verification error:', err);
    } finally {
      setResendingVerification(false);
    }
  };

  const handleToggleHide = async (commentId: string, currentHidden: boolean) => {
    try {
      setCommentError('');
      await commentService.hideComment(commentId, !currentHidden, currentChapter?.id);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, hidden: !currentHidden } : c));
    } catch (err) {
      setCommentError(getAdminErrorMessage(err));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setCommentError('');
      await commentService.deleteComment(commentId, currentChapter?.id);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      setCommentError(getAdminErrorMessage(err));
    }
  };

  const isLocked = !content;

  return (
    <div className={`reader-page reader-${readerSettings.theme}`}>
      <PageMeta
        title={`${novelTitle} - ${t.novelDetail.chapterNumberPrefix} ${currentChapter.number}: ${currentChapterTitle}`}
        description={`${novelTitle} - ${novelAuthor}. ${currentChapterTitle}`}
      />

      {/* Reader Topbar */}
      <div className="reader-top">
        <button className="back-button" onClick={() => navigate(`/novel/${novel.id}`)}>
          <BackArrow size={17} /> {novelTitle}
        </button>

        <div className="reader-actions">
          <span>
            {t.novelDetail.chapterNumberPrefix} {currentChapter.number} {t.reader.chapterOf} {chapters.length || novel.chaptersCount}
          </span>
          <button
            className={bookmarked ? 'active icon-button' : 'icon-button'}
            onClick={handleBookmarkToggle}
            aria-label={t.reader.bookmarkTooltip}
            title={t.reader.bookmarkTooltip}
          >
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
          <button
            className="icon-button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-label={t.reader.settingsTooltip}
            title={t.reader.settingsTooltip}
          >
            <MoreHorizontal size={19} />
          </button>
        </div>
      </div>

      {/* Reader Settings Drawer/Box */}
      {settingsOpen && (
        <div className="reader-settings">
          <div>
            <span>{t.reader.fontSize}</span>
            <div className="setting-control">
              <button
                onClick={() =>
                  setReaderSettings(s => ({ ...s, fontSize: Math.max(16, s.fontSize - 1) }))
                }
              >
                <Minus size={15} />
              </button>
              <b>{readerSettings.fontSize}</b>
              <button
                onClick={() =>
                  setReaderSettings(s => ({ ...s, fontSize: Math.min(32, s.fontSize + 1) }))
                }
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <div>
            <span>{t.reader.theme}</span>
            <div className="theme-buttons">
              <button
                className={readerSettings.theme === 'light' ? 'active' : ''}
                onClick={() => setReaderSettings(s => ({ ...s, theme: 'light' }))}
              >
                <Sun size={15} /> {t.reader.themeLight}
              </button>
              <button
                className={readerSettings.theme === 'warm' ? 'active' : ''}
                onClick={() => setReaderSettings(s => ({ ...s, theme: 'warm' }))}
              >
                {t.reader.themeWarm}
              </button>
              <button
                className={readerSettings.theme === 'dark' ? 'active' : ''}
                onClick={() => setReaderSettings(s => ({ ...s, theme: 'dark' }))}
              >
                <Moon size={15} /> {t.reader.themeDark}
              </button>
            </div>
          </div>

          <div>
            <span>{t.reader.contentWidth}</span>
            <div className="theme-buttons">
              <button
                className={readerSettings.width === 'narrow' ? 'active' : ''}
                onClick={() => setReaderSettings(s => ({ ...s, width: 'narrow' }))}
              >
                {t.reader.widthNarrow}
              </button>
              <button
                className={readerSettings.width === 'medium' ? 'active' : ''}
                onClick={() => setReaderSettings(s => ({ ...s, width: 'medium' }))}
              >
                {t.reader.widthMedium}
              </button>
              <button
                className={readerSettings.width === 'wide' ? 'active' : ''}
                onClick={() => setReaderSettings(s => ({ ...s, width: 'wide' }))}
              >
                {t.reader.widthWide}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Progress Indicator */}
      <div className="reading-progress">
        <span
          style={{
            width: `${Math.round(
              (currentChapter.number / Math.max(1, chapters.length)) * 100
            )}%`,
          }}
        />
      </div>

      {/* Main Reading Column */}
      <article className={`reading-column width-${readerSettings.width}`}>
        <div className="reading-kicker">
          {novelTitle} · {t.novelDetail.chapterNumberPrefix} {currentChapter.number}
        </div>
        <h1>{currentChapterTitle}</h1>
        <div className="reading-rule">
          <span>✦</span>
        </div>

        {isLocked ? (
          /* Locked Paywall Box */
          <div className="p-8 my-8 border border-[var(--line)] bg-[rgba(169,138,99,0.06)] text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-[var(--green)] text-white rounded-full flex items-center justify-center">
              <Lock size={26} />
            </div>
            <h2 className="font-serif text-2xl font-medium mb-3">{t.reader.lockedTitle}</h2>
            <p className="text-sm text-[var(--muted)] max-w-md mx-auto mb-8 leading-relaxed">
              {t.reader.lockedDesc}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-start mb-6">
              {/* Option 1 */}
              <div className="p-4 bg-white border border-[var(--line)] flex flex-col justify-between">
                <div>
                  <span className="text-xs text-[var(--bronze)] font-semibold block mb-1">
                    {t.reader.optionOneEyebrow}
                  </span>
                  <h4 className="font-medium text-sm mb-1">{t.reader.optionOneTitle}</h4>
                  <p className="text-xs text-[var(--muted)] mb-3">
                    {t.reader.optionOneDesc}
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                  <b className="text-[var(--green)] text-base">{novel.novelPrice} {t.common.currency}</b>
                  <button
                    className="primary-button small"
                    onClick={() => {
                      addToCart({
                        id: `novel_${novel.id}`,
                        type: 'novel',
                        refId: novel.id,
                        title: novelTitle,
                        author: novelAuthor,
                        price: novel.novelPrice,
                      });
                      navigate('/cart');
                    }}
                  >
                    <ShoppingBag size={14} /> {t.novelDetail.acquireNovelBtn}
                  </button>
                </div>
              </div>

              {/* Option 2 */}
              {novel.bookPrice && (
                <div className="p-4 bg-white border border-[var(--line)] flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-[var(--bronze)] font-semibold block mb-1">
                      {t.reader.optionTwoEyebrow}
                    </span>
                    <h4 className="font-medium text-sm mb-1">{t.reader.optionTwoTitle}</h4>
                    <p className="text-xs text-[var(--muted)] mb-3">
                      {t.reader.optionTwoDesc}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                    <b className="text-[var(--green)] text-base">{novel.bookPrice} {t.common.currency}</b>
                    <button
                      className="primary-button small"
                      onClick={() => {
                        addToCart({
                          id: `book_${novel.id}`,
                          type: 'book',
                          refId: novel.id,
                          title: `${novelTitle} (${t.store.editionLabel})`,
                          author: novelAuthor,
                          price: novel.bookPrice!,
                        });
                        navigate('/cart');
                      }}
                    >
                      <Download size={14} /> {t.novelDetail.acquireBookBtn}
                    </button>
                  </div>
                </div>
              )}

              {/* Option 3 */}
              <div className="p-4 bg-[var(--green)] text-white flex flex-col justify-between">
                <div>
                  <span className="text-xs text-[#e4c99a] font-semibold block mb-1">
                    {t.reader.optionThreeEyebrow}
                  </span>
                  <h4 className="font-medium text-sm mb-1 text-white">{t.reader.optionThreeTitle}</h4>
                  <p className="text-xs text-[#c3d1cb] mb-3">
                    {t.reader.optionThreeDesc}
                  </p>
                </div>
                <div className="pt-2 border-t border-[rgba(255,255,255,0.2)] flex items-center justify-between">
                  <b className="text-[#ecd7ad] text-base">{t.reader.optionThreePricePrefix} 35 {t.common.currency}</b>
                  <Link to="/plans" className="light-button small">
                    <Sparkles size={14} /> {t.common.plans}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Unlocked Content */
          <>
            <div className="leading-relaxed">
              {content.body.split('\n\n').map((paragraph, idx) => (
                <p key={idx} style={{ fontSize: `${readerSettings.fontSize}px` }}>
                  {paragraph}
                </p>
              ))}
            </div>

            <aside className="author-note">
              <Feather size={18} />
              <div>
                <span>{t.reader.authorNoteTitle}</span>
                <p>{t.reader.authorNoteBody}</p>
              </div>
            </aside>

            <div className="reader-end">
              <span>{t.reader.chapterEnded} {currentChapter.number}</span>
            </div>
          </>
        )}
      </article>

      {/* Navigation Between Chapters */}
      <div className="reader-navigation">
        {prevChapter ? (
          <button
            onClick={() => navigate(`/novel/${novel.id}/chapter/${prevChapter.number}`)}
          >
            <PrevArrow size={17} /> {t.reader.prevChapter} ({prevChapterTitle})
          </button>
        ) : (
          <span />
        )}

        {nextChapter ? (
          <button
            onClick={() => navigate(`/novel/${novel.id}/chapter/${nextChapter.number}`)}
          >
            {t.reader.nextChapter} ({nextChapterTitle}) <NextArrow size={17} />
          </button>
        ) : (
          <button onClick={() => navigate(`/novel/${novel.id}`)}>
            {t.reader.endOfAvailableChapters} <NextArrow size={17} />
          </button>
        )}
      </div>

      {/* Chapter Comments Section */}
      {!isLocked && (
        <section className={`max-w-3xl mx-auto mt-16 px-6 pt-10 border-t border-[var(--line)] text-start`}>
          <h3 className="font-serif text-2xl mb-6">{t.reader.commentsTitle}</h3>

          {/* Email verification notice for commenting */}
          {user && !emailVerified && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-900 border border-amber-200 text-xs flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0 text-amber-700" />
                <span>{t.common.emailNotVerifiedComment}</span>
              </div>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="underline font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1"
              >
                <Mail size={12} />
                {resendingVerification
                  ? t.common.loading
                  : resendVerificationSent
                  ? t.common.verifyEmailSentSuccess
                  : t.common.verifyEmailResendBtn}
              </button>
              <button
                type="button"
                onClick={handleCheckVerified}
                disabled={verifyChecking}
                className="underline font-semibold text-amber-800 hover:text-amber-950"
              >
                {verifyChecking ? t.common.verifiedCheckChecking : t.common.verifiedCheckBtn}
              </button>
            </div>
          )}
          {user && verifyMessage && (
            <p className="mb-4 text-xs text-[var(--muted)]" role="status">{verifyMessage}</p>
          )}

          {/* Add comment form */}
          {user ? (
            <form onSubmit={handleAddComment} className="mb-8">
              {commentError && (
                <div className="mb-3 p-3 bg-red-50 text-red-800 text-xs border border-red-200" role="alert">
                  {commentError}
                </div>
              )}
              <textarea
                value={newCommentText}
                maxLength={LIMITS.commentMax}
                onChange={e => setNewCommentText(e.target.value)}
                placeholder={t.reader.commentPlaceholder}
                className="w-full p-3 border border-[var(--line)] bg-white text-sm outline-none focus:border-[var(--green)] min-h-[90px]"
                required
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-[11px] text-[var(--muted)]">
                  <bdi dir="ltr">{newCommentText.length} / {LIMITS.commentMax}</bdi>
                </span>
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="primary-button small"
                >
                  <Send size={14} /> {submittingComment ? t.reader.sendingComment : t.reader.sendComment}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-[var(--paper)] border border-[var(--line)] text-center text-xs mb-8">
              <Link to="/login" className="text-[var(--green)] font-semibold underline mx-1">
                {t.reader.loginLink}
              </Link>
              {t.reader.loginToCommentPrompt}
            </div>
          )}

          {/* Comments are loaded only when the reader asks (saves Firestore reads) */}
          {!commentsOpen && (
            <div className="text-center py-2">
              <button
                type="button"
                onClick={handleShowComments}
                disabled={loadingComments}
                className="outline-button small"
              >
                {loadingComments ? t.common.loading : t.common.showComments}
              </button>
            </div>
          )}

          {/* Comments List */}
          {commentsOpen && (
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-xs text-[var(--muted)] text-center py-4">
                {t.reader.noCommentsYet}
              </p>
            ) : (
              comments.map(c => (
                <div
                  key={c.id}
                  className={`p-4 border ${
                    c.hidden ? 'bg-red-50 border-red-200 opacity-60' : 'bg-white border-[var(--line)]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-xs text-[var(--green)]">{c.userName}</span>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleToggleHide(c.id, c.hidden)}
                            className="text-xs text-[var(--muted)] hover:text-black"
                            title={c.hidden ? t.reader.showPublic : t.reader.hidePublic}
                            aria-label={c.hidden ? t.reader.showPublic : t.reader.hidePublic}
                          >
                            {c.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                            title={t.reader.deleteComment}
                            aria-label={t.reader.deleteComment}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">{c.text}</p>
                </div>
              ))
            )}

            {/* Load More Comments */}
            {hasMoreComments && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={handleLoadMoreComments}
                  disabled={loadingMoreComments}
                  className="outline-button small"
                >
                  {loadingMoreComments ? t.common.loading : t.common.loadMoreComments}
                </button>
              </div>
            )}
          </div>
          )}
        </section>
      )}
    </div>
  );
};
