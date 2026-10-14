import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Sparkles,
  Check,
  X,
  Star,
  Flag,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { doc, setDoc, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LoadingState } from '../../components/States';
import { novelService } from '../../services/novelService';
import { visitorService } from '../../services/visitorService';
import { reviewService } from '../../services/reviewService';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedNovelField } from '../../i18n/translations';
import {
  UserProfile,
  Novel,
  Review,
  ModerationReport,
  AuditLogEntry,
  AccountStatus,
  SiteSettings,
} from '../../types';

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin, profile: adminProfile } = useAuth();
  const { t, language, rtl } = useLanguage();

  const [activeTab, setActiveTab] = useState<'visitors' | 'moderation' | 'reports' | 'settings'>('visitors');

  // Visitors State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersCursor, setUsersCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected User Modals
  const [managingAccessUser, setManagingAccessUser] = useState<UserProfile | null>(null);
  const [managingStatusUser, setManagingStatusUser] = useState<UserProfile | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [viewingUserReviews, setViewingUserReviews] = useState<UserProfile | null>(null);
  const [userReviewsList, setUserReviewsList] = useState<Review[]>([]);
  const [loadingUserReviews, setLoadingUserReviews] = useState(false);

  // Status Change Modal Inputs
  const [newStatus, setNewStatus] = useState<AccountStatus>('active');
  const [restrictionReason, setRestrictionReason] = useState('');

  // Access Grant Inputs (Existing functionality)
  const [selectedNovelId, setSelectedNovelId] = useState('');
  const [entType, setEntType] = useState<'novel' | 'book'>('novel');
  const [subMonths, setSubMonths] = useState(1);

  // Review Moderation State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedNovelFilter, setSelectedNovelFilter] = useState<string>('all');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all');
  const [selectedReviewStatusFilter, setSelectedReviewStatusFilter] = useState<string>('all');
  const [hidingReviewTarget, setHidingReviewTarget] = useState<Review | null>(null);
  const [moderationReasonInput, setModerationReasonInput] = useState('');
  const [modifyingReviewId, setModifyingReviewId] = useState<string | null>(null);

  // Moderation Reports State
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');

  // Settings & Audit Log State
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  // General Notification
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const adminEmail = currentAdmin?.email || adminProfile?.email || 'admin@habr.app';
  const adminUid = currentAdmin?.uid || 'admin';

  const showToast = (type: 'success' | 'error', msg: string) => {
    setActionNotice({ type, msg });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // 1. Fetch Visitors & Novels
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const page = await visitorService.getVisitorsPage();
      setUsers(page.users);
      setUsersCursor(page.lastDoc);
      setHasMoreUsers(page.hasMore);
      const nList = await novelService.getNovels();
      setNovels(nList);
      if (nList.length > 0) setSelectedNovelId(nList[0].id);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Error fetching visitors:', e);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Loads the next 50 users from the server (never the whole collection at once)
  const handleLoadMoreUsers = async () => {
    if (!usersCursor || loadingMoreUsers) return;
    try {
      setLoadingMoreUsers(true);
      const page = await visitorService.getVisitorsPage(usersCursor);
      setUsers(prev => [...prev, ...page.users]);
      setUsersCursor(page.lastDoc);
      setHasMoreUsers(page.hasMore);
    } finally {
      setLoadingMoreUsers(false);
    }
  };

  // 2. Fetch Moderation Reviews
  const fetchModerationReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const data = await reviewService.getAdminReviews({
        novelId: selectedNovelFilter !== 'all' ? selectedNovelFilter : undefined,
        rating: selectedRatingFilter !== 'all' ? Number(selectedRatingFilter) : undefined,
        status: selectedReviewStatusFilter !== 'all' ? selectedReviewStatusFilter : undefined,
      });
      setReviews(data);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Error fetching reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  }, [selectedNovelFilter, selectedRatingFilter, selectedReviewStatusFilter]);

  // 3. Fetch Reports
  const fetchReports = useCallback(async () => {
    try {
      setLoadingReports(true);
      const data = await reviewService.getModerationReports(reportStatusFilter);
      setReports(data);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Error fetching reports:', e);
    } finally {
      setLoadingReports(false);
    }
  }, [reportStatusFilter]);

  // 4. Fetch Settings & Audit Logs
  const fetchSettingsAndAudit = useCallback(async () => {
    try {
      const s = await settingsService.getSettings();
      setSiteSettings(s);
      const logs = await visitorService.getAuditLogs(50);
      setAuditLogs(logs);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Error fetching settings/logs:', e);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (activeTab === 'moderation') fetchModerationReviews();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'settings') fetchSettingsAndAudit();
  }, [activeTab, fetchModerationReviews, fetchReports, fetchSettingsAndAudit]);

  // Handle Account Status Modification
  const handleOpenStatusModal = (u: UserProfile) => {
    setManagingStatusUser(u);
    setNewStatus(u.status || 'active');
    setRestrictionReason(u.restrictedReason || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingStatusUser) return;
    try {
      const res = await visitorService.updateAccountStatus(
        managingStatusUser.uid,
        newStatus,
        restrictionReason,
        adminUid,
        adminEmail
      );
      if (res.success) {
        showToast('success', res.message);
        setManagingStatusUser(null);
        await fetchUsers();
      } else {
        showToast('error', res.message);
      }
    } catch {
      showToast('error', t.common.error);
    }
  };

  // Handle Safe Account Deletion
  const handleConfirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    try {
      const res = await visitorService.deleteAccountSafely(
        deleteTargetUser.uid,
        adminUid,
        adminEmail
      );
      if (res.success) {
        showToast('success', res.message);
        setDeleteTargetUser(null);
        await fetchUsers();
      } else {
        showToast('error', res.message);
      }
    } catch {
      showToast('error', t.common.error);
    }
  };

  // View User Reviews
  const handleViewUserReviews = async (u: UserProfile) => {
    setViewingUserReviews(u);
    try {
      setLoadingUserReviews(true);
      const revs = await visitorService.getUserReviews(u.uid);
      setUserReviewsList(revs);
    } finally {
      setLoadingUserReviews(false);
    }
  };

  // Moderate Review Actions (Hide, Publish, Delete)
  const handleHideReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hidingReviewTarget) return;
    if (!moderationReasonInput.trim()) {
      showToast('error', t.visitorManagement.moderationReasonLabel);
      return;
    }
    try {
      setModifyingReviewId(hidingReviewTarget.id);
      const res = await reviewService.moderateReview(
        hidingReviewTarget.id,
        'hide',
        moderationReasonInput.trim(),
        adminUid,
        adminEmail
      );
      if (res.success) {
        showToast('success', res.message);
        setHidingReviewTarget(null);
        setModerationReasonInput('');
        await fetchModerationReviews();
      } else {
        showToast('error', res.message);
      }
    } finally {
      setModifyingReviewId(null);
    }
  };

  const handlePublishReview = async (review: Review) => {
    try {
      setModifyingReviewId(review.id);
      const res = await reviewService.moderateReview(
        review.id,
        'publish',
        'تمت الموافقة بعد المراجعة',
        adminUid,
        adminEmail
      );
      if (res.success) {
        showToast('success', res.message);
        await fetchModerationReviews();
      } else {
        showToast('error', res.message);
      }
    } finally {
      setModifyingReviewId(null);
    }
  };

  const handleDeleteReview = async (review: Review) => {
    if (!window.confirm(t.visitorManagement.confirmDeleteModReview)) return;
    try {
      setModifyingReviewId(review.id);
      const res = await reviewService.moderateReview(
        review.id,
        'delete',
        'حذف نهائي بواسطة المسؤول',
        adminUid,
        adminEmail
      );
      if (res.success) {
        showToast('success', res.message);
        await fetchModerationReviews();
      } else {
        showToast('error', res.message);
      }
    } finally {
      setModifyingReviewId(null);
    }
  };

  // Report Resolution
  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    const ok = await reviewService.resolveReport(reportId, status, '', adminUid, adminEmail);
    if (ok) {
      showToast('success', t.common.success);
      await fetchReports();
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    try {
      setSavingSettings(true);
      await settingsService.updateSettings(siteSettings);
      showToast('success', t.visitorManagement.settingsSavedSuccess);
      await fetchSettingsAndAudit();
    } catch {
      showToast('error', t.common.error);
    } finally {
      setSavingSettings(false);
    }
  };

  // Existing Grant Subscription / Entitlement handlers
  const handleGrantSubscription = async () => {
    if (!managingAccessUser) return;
    try {
      const expiresAt = Date.now() + subMonths * 30 * 24 * 60 * 60 * 1000;
      await setDoc(
        doc(db, 'users', managingAccessUser.uid),
        {
          subscription: {
            planId: 'admin_grant',
            planName: `${t.adminUsers.modalTitle} (${subMonths}m)`,
            expiresAt,
          },
        },
        { merge: true }
      );
      showToast('success', t.adminUsers.grantSuccess);
      await fetchUsers();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      showToast('error', t.common.error);
    }
  };

  const handleRevokeSubscription = async () => {
    if (!managingAccessUser) return;
    if (!window.confirm('هل أنت متأكد من إلغاء اشتراك المستخدم؟')) return;
    try {
      await setDoc(
        doc(db, 'users', managingAccessUser.uid),
        { subscription: null },
        { merge: true }
      );
      showToast('success', t.common.success);
      await fetchUsers();
    } catch {
      showToast('error', t.common.error);
    }
  };

  const handleGrantEntitlement = async () => {
    if (!managingAccessUser || !selectedNovelId) return;
    try {
      await setDoc(
        doc(db, 'users', managingAccessUser.uid, 'entitlements', selectedNovelId),
        {
          novelId: selectedNovelId,
          type: entType,
          grantedAt: new Date(),
          orderId: 'admin_manual_grant',
        },
        { merge: true }
      );
      showToast('success', t.adminUsers.grantSuccess);
    } catch {
      showToast('error', t.common.error);
    }
  };

  // Filtered and Paginated Users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.uid.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' ||
      (u.status || 'active') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Stats calculation
  const totalUsersCount = users.length;
  const activeCount = users.filter(u => !u.status || u.status === 'active').length;
  const restrictedCount = users.filter(u => u.status === 'restricted').length;
  const deactivatedCount = users.filter(u => u.status === 'deactivated').length;

  const PageChevronLeft = rtl ? ChevronRight : ChevronLeft;
  const PageChevronRight = rtl ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-medium">{t.visitorManagement.pageTitle}</h2>
        <p className="text-xs text-[var(--muted)]">{t.visitorManagement.pageSubtitle}</p>
      </div>

      {actionNotice && (
        <div
          className={`p-3 border text-xs flex items-center gap-2 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          {actionNotice.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
          <span>{actionNotice.msg}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-[var(--line)] gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('visitors')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'visitors'
              ? 'border-[var(--green)] text-[var(--green)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-stone-900'
          }`}
        >
          <Users size={14} />
          {t.visitorManagement.tabVisitors} ({totalUsersCount})
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'moderation'
              ? 'border-[var(--green)] text-[var(--green)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-stone-900'
          }`}
        >
          <Star size={14} />
          {t.visitorManagement.tabModeration}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-[var(--green)] text-[var(--green)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-stone-900'
          }`}
        >
          <Flag size={14} />
          {t.visitorManagement.tabReports}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'border-[var(--green)] text-[var(--green)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-stone-900'
          }`}
        >
          <Settings size={14} />
          {t.visitorManagement.tabSettingsAudit}
        </button>
      </div>

      {/* TAB 1: VISITORS & USERS */}
      {activeTab === 'visitors' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-[var(--line)]">
              <span className="block text-[11px] text-[var(--muted)]">{t.visitorManagement.totalVisitors}</span>
              <b className="font-serif text-2xl text-[var(--green)]">{totalUsersCount}</b>
            </div>
            <div className="p-3.5 bg-white border border-[var(--line)]">
              <span className="block text-[11px] text-emerald-700">{t.visitorManagement.activeVisitors}</span>
              <b className="font-serif text-2xl text-emerald-800">{activeCount}</b>
            </div>
            <div className="p-3.5 bg-white border border-[var(--line)]">
              <span className="block text-[11px] text-amber-700">{t.visitorManagement.restrictedVisitors}</span>
              <b className="font-serif text-2xl text-amber-800">{restrictedCount}</b>
            </div>
            <div className="p-3.5 bg-white border border-[var(--line)]">
              <span className="block text-[11px] text-stone-500">{t.visitorManagement.deactivatedVisitors}</span>
              <b className="font-serif text-2xl text-stone-700">{deactivatedCount}</b>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="search-field w-full sm:w-80">
              <Search size={15} />
              <input
                type="text"
                placeholder={t.adminUsers.searchPlaceholder}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="filter-select">
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">{t.visitorManagement.filterStatusAll}</option>
                <option value="active">{t.visitorManagement.statusActive}</option>
                <option value="restricted">{t.visitorManagement.statusRestricted}</option>
                <option value="deactivated">{t.visitorManagement.statusDeactivated}</option>
              </select>
            </div>
          </div>

          {/* Visitors Table */}
          {loadingUsers ? (
            <LoadingState message={t.common.loading} />
          ) : (
            <div className="admin-panel table-panel">
              <table>
                <thead>
                  <tr>
                    <th>{t.adminUsers.colUser}</th>
                    <th>{t.adminUsers.colEmail}</th>
                    <th>{t.visitorManagement.colStatus}</th>
                    <th>{t.adminUsers.colSub}</th>
                    <th>{t.adminUsers.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-[var(--muted)]">
                        {t.common.empty}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map(u => {
                      const st = u.status || 'active';
                      return (
                        <tr key={u.uid}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-[var(--paper)] text-[var(--green)] border border-[var(--line)] flex items-center justify-center font-serif text-xs font-bold">
                                {u.name ? u.name[0] : 'ق'}
                              </span>
                              <div>
                                <b className="block text-xs">{u.name || 'قارئ حبر'}</b>
                                <small className="text-[10px] text-[var(--muted)] font-mono">{u.uid.slice(0, 8)}...</small>
                              </div>
                            </div>
                          </td>
                          <td className="font-mono text-xs text-[var(--muted)]">{u.email || '—'}</td>
                          <td>
                            {st === 'active' ? (
                              <span className="status-pill done flex items-center gap-1 w-fit">
                                <ShieldCheck size={11} /> {t.visitorManagement.statusActive}
                              </span>
                            ) : st === 'restricted' ? (
                              <span
                                className="status-pill flex items-center gap-1 w-fit text-amber-800 bg-amber-100"
                                title={u.restrictedReason}
                              >
                                <ShieldAlert size={11} /> {t.visitorManagement.statusRestricted}
                              </span>
                            ) : (
                              <span className="status-pill flex items-center gap-1 w-fit text-stone-600 bg-stone-200">
                                <UserX size={11} /> {t.visitorManagement.statusDeactivated}
                              </span>
                            )}
                          </td>
                          <td>
                            {u.subscription && u.subscription.expiresAt > Date.now() ? (
                              <span className="text-xs text-[var(--green)] font-medium block">
                                {u.subscription.planName || 'مشترك'}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--muted)]">{t.adminUsers.noSub}</span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              {/* View Reviews */}
                              <button
                                onClick={() => handleViewUserReviews(u)}
                                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] rounded"
                                title={t.visitorManagement.viewDetailsAndReviews}
                              >
                                <MessageSquare size={12} className="inline me-1" />
                                {t.visitorManagement.viewDetailsAndReviews}
                              </button>

                              {/* Change Status */}
                              <button
                                onClick={() => handleOpenStatusModal(u)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] rounded"
                                title={t.visitorManagement.editStatusTitle}
                              >
                                <Shield size={12} className="inline me-1" />
                                {t.visitorManagement.colStatus}
                              </button>

                              {/* Manage Access/Subscription */}
                              <button
                                onClick={() => setManagingAccessUser(u)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] rounded"
                                title={t.adminUsers.manageAccess}
                              >
                                <Sparkles size={12} className="inline me-1" />
                                {t.adminUsers.colSub}
                              </button>

                              {/* Safe Delete */}
                              <button
                                onClick={() => setDeleteTargetUser(u)}
                                className="p-1 hover:text-red-700 text-stone-400"
                                title={t.visitorManagement.deleteAccountBtn}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-[var(--line)] text-xs text-[var(--muted)]">
                  <span>
                    {t.visitorManagement.pageInfo
                      .replace('{page}', String(currentPage))
                      .replace('{totalPages}', String(totalPages))}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 border border-[var(--line)] disabled:opacity-40"
                    >
                      <PageChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 border border-[var(--line)] disabled:opacity-40"
                    >
                      <PageChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Server-side paging: search and counters cover the users loaded so far */}
              {hasMoreUsers && (
                <div className="text-center p-3 border-t border-[var(--line)]">
                  <button
                    type="button"
                    onClick={handleLoadMoreUsers}
                    disabled={loadingMoreUsers}
                    className="outline-button small"
                  >
                    {loadingMoreUsers ? t.common.loading : t.common.loadMoreUsers}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REVIEW MODERATION */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          {/* Strict Policy Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2.5 rounded-sm">
            <ShieldCheck size={18} className="shrink-0 text-emerald-700 mt-0.5" />
            <div>
              <b>{t.visitorManagement.moderationPolicyNotice}</b>
              <p className="mt-0.5 text-stone-600">
                منصة حَبْر تحترم حق القارئ الكامل في النقد الموضوعي والتقييمات الصادقة (سواء 1 أو 5 نجوم). لا يتم حجب أي مراجعة إلا في حالات السب أو الإعلانات أو المحتوى غير القانوني.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Novel Filter */}
            <div className="filter-select">
              <select
                value={selectedNovelFilter}
                onChange={e => setSelectedNovelFilter(e.target.value)}
              >
                <option value="all">{t.visitorManagement.filterByNovel}</option>
                {novels.map(n => (
                  <option key={n.id} value={n.id}>
                    {getLocalizedNovelField(n, 'title', language)}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="filter-select">
              <select
                value={selectedRatingFilter}
                onChange={e => setSelectedRatingFilter(e.target.value)}
              >
                <option value="all">{t.visitorManagement.filterByRating}</option>
                <option value="5">5 ★★★★★</option>
                <option value="4">4 ★★★★</option>
                <option value="3">3 ★★★</option>
                <option value="2">2 ★★</option>
                <option value="1">1 ★</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-select">
              <select
                value={selectedReviewStatusFilter}
                onChange={e => setSelectedReviewStatusFilter(e.target.value)}
              >
                <option value="all">{t.visitorManagement.filterByStatus}</option>
                <option value="published">{t.visitorManagement.statusPublished}</option>
                <option value="hidden">{t.visitorManagement.statusHidden}</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {loadingReviews ? (
            <LoadingState message={t.common.loading} />
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--line)] bg-white">
              {t.common.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div
                  key={r.id}
                  className={`p-4 border bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    r.status === 'hidden' ? 'border-amber-300 bg-amber-50/40' : 'border-[var(--line)]'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-[var(--green)]">
                        {r.novelTitle || r.novelId}
                      </span>
                      <span className="text-[11px] text-[var(--muted)]">·</span>
                      <span className="text-xs font-medium text-stone-800">{r.userName}</span>
                      <span className="font-mono text-[10px] text-[var(--muted)]">({r.userEmail || r.userId})</span>
                      <div className="flex items-center gap-0.5 ms-2">
                        {[1, 2, 3, 4, 5].map(st => (
                          <Star
                            key={st}
                            size={12}
                            className={
                              st <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'
                            }
                          />
                        ))}
                        <span className="font-mono text-xs font-bold text-amber-700 ms-1">{r.rating}★</span>
                      </div>
                      {r.status === 'hidden' && (
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded">
                          {t.visitorManagement.statusHidden}: {r.moderationReason}
                        </span>
                      )}
                      {(r.reportCount || 0) > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded flex items-center gap-1">
                          <Flag size={10} /> {r.reportCount} {t.visitorManagement.reportsCount}
                        </span>
                      )}
                    </div>
                    {r.reviewText && (
                      <p className="text-xs text-stone-700 whitespace-pre-line font-serif leading-relaxed">
                        {r.reviewText}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {r.status === 'published' ? (
                      <button
                        onClick={() => {
                          setHidingReviewTarget(r);
                          setModerationReasonInput('');
                        }}
                        disabled={modifyingReviewId === r.id}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs flex items-center gap-1 rounded"
                      >
                        <EyeOff size={12} />
                        {t.visitorManagement.hideReviewBtn}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublishReview(r)}
                        disabled={modifyingReviewId === r.id}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs flex items-center gap-1 rounded"
                      >
                        <Eye size={12} />
                        {t.visitorManagement.publishReviewBtn}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteReview(r)}
                      disabled={modifyingReviewId === r.id}
                      className="px-2 py-1.5 text-stone-500 hover:text-red-700 text-xs"
                      title={t.visitorManagement.deleteReviewBtn}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MODERATION REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-lg font-medium">{t.visitorManagement.reportsPageTitle}</h3>
            <div className="filter-select">
              <select
                value={reportStatusFilter}
                onChange={e => setReportStatusFilter(e.target.value as 'all' | 'pending' | 'resolved' | 'dismissed')}
              >
                <option value="all">{t.visitorManagement.filterStatusAll}</option>
                <option value="pending">{t.visitorManagement.statusPending}</option>
                <option value="resolved">{t.visitorManagement.statusResolved}</option>
                <option value="dismissed">{t.visitorManagement.statusDismissed}</option>
              </select>
            </div>
          </div>

          {loadingReports ? (
            <LoadingState message={t.common.loading} />
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--line)] bg-white">
              {t.visitorManagement.noReportsFound}
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(rep => (
                <div key={rep.id} className="p-4 bg-white border border-[var(--line)] space-y-2">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-red-700 flex items-center gap-1">
                          <Flag size={12} /> {rep.reason.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">·</span>
                        <span className="text-xs text-stone-700">
                          {t.visitorManagement.reportedUser}: <strong>{rep.reportedUserName || rep.reportedUserId}</strong>
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">·</span>
                        <span className="text-xs text-stone-500">
                          {t.visitorManagement.reporter}: {rep.reporterName}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 italic">
                        "{rep.details || 'بدون تفاصيل إضافية'}"
                      </p>
                      {rep.reviewExcerpt && (
                        <div className="mt-2 p-2 bg-stone-50 border border-stone-200 text-xs font-serif text-stone-700">
                          مقتطف المراجعة: "{rep.reviewExcerpt}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        rep.status === 'pending'
                          ? 'bg-amber-100 text-amber-900'
                          : rep.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {rep.status === 'pending'
                          ? t.visitorManagement.statusPending
                          : rep.status === 'resolved'
                          ? t.visitorManagement.statusResolved
                          : t.visitorManagement.statusDismissed}
                      </span>

                      {rep.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'resolved')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded"
                          >
                            {t.visitorManagement.resolveBtn}
                          </button>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'dismissed')}
                            className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs rounded"
                          >
                            {t.visitorManagement.dismissBtn}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS & AUDIT LOG */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* Rating Platform Settings Form */}
          {siteSettings && (
            <div className="p-6 bg-white border border-[var(--line)] space-y-4 max-w-2xl">
              <h3 className="font-serif text-lg font-medium text-[var(--ink)]">
                {t.visitorManagement.ratingSettingsTitle}
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* Require Auth */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="requireAuth"
                    className="mt-1"
                    checked={siteSettings.ratingsRequireAuth !== false}
                    onChange={e =>
                      setSiteSettings({ ...siteSettings, ratingsRequireAuth: e.target.checked })
                    }
                  />
                  <div>
                    <label htmlFor="requireAuth" className="text-xs font-semibold cursor-pointer block">
                      {t.visitorManagement.requireAuthLabel}
                    </label>
                    <small className="text-[11px] text-[var(--muted)]">
                      {t.visitorManagement.requireAuthHelp}
                    </small>
                  </div>
                </div>

                {/* Global Enable */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="globalEnable"
                    className="mt-1"
                    checked={siteSettings.globalRatingsEnabled !== false}
                    onChange={e =>
                      setSiteSettings({ ...siteSettings, globalRatingsEnabled: e.target.checked })
                    }
                  />
                  <div>
                    <label htmlFor="globalEnable" className="text-xs font-semibold cursor-pointer block">
                      {t.visitorManagement.globalEnableLabel}
                    </label>
                    <small className="text-[11px] text-[var(--muted)]">
                      {t.visitorManagement.globalEnableHelp}
                    </small>
                  </div>
                </div>

                {/* Max Reviews Per Day */}
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {t.visitorManagement.maxReviewsPerDayLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={siteSettings.maxReviewsPerDayPerUser || 5}
                    onChange={e =>
                      setSiteSettings({
                        ...siteSettings,
                        maxReviewsPerDayPerUser: Number(e.target.value),
                      })
                    }
                    className="w-36 p-1.5 border border-[var(--line)] text-xs bg-white"
                  />
                  <small className="block text-[11px] text-[var(--muted)] mt-1">
                    {t.visitorManagement.maxReviewsPerDayHelp}
                  </small>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="primary-button small"
                >
                  {savingSettings ? t.common.loading : t.visitorManagement.saveSettingsBtn}
                </button>
              </form>
            </div>
          )}

          {/* Audit Log Table */}
          <div className="admin-panel table-panel">
            <h3 className="font-serif text-lg font-medium mb-3">
              {t.visitorManagement.auditLogTitle}
            </h3>

            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--muted)]">
                {t.visitorManagement.emptyAuditLogs}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t.visitorManagement.colTimestamp}</th>
                    <th>{t.visitorManagement.colAdmin}</th>
                    <th>{t.visitorManagement.colAction}</th>
                    <th>{t.visitorManagement.colTarget}</th>
                    <th>{t.visitorManagement.colDetails}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => {
                    const ts = log.timestamp as { toDate?: () => Date } | null;
                    const timeStr = ts?.toDate
                      ? ts.toDate().toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')
                      : 'الآن';

                    return (
                      <tr key={log.id}>
                        <td className="font-mono text-[11px] text-[var(--muted)] whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="font-mono text-xs">{log.adminEmail}</td>
                        <td>
                          <span className="font-semibold text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                        </td>
                        <td className="text-xs">{log.targetLabel || log.targetId}</td>
                        <td className="text-xs text-[var(--muted)]">
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '—')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT VISITOR ACCOUNT STATUS */}
      {managingStatusUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-[var(--line)] shadow-xl animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-medium text-[var(--ink)]">
                {t.visitorManagement.editStatusTitle}
              </h3>
              <button onClick={() => setManagingStatusUser(null)}>
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] mb-4">
              {managingStatusUser.name} · {managingStatusUser.email}
            </p>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t.visitorManagement.statusSelectLabel}
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as AccountStatus)}
                  className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                >
                  <option value="active">{t.visitorManagement.statusActive}</option>
                  <option value="restricted">{t.visitorManagement.statusRestricted}</option>
                  <option value="deactivated">{t.visitorManagement.statusDeactivated}</option>
                </select>
              </div>

              {newStatus === 'restricted' && (
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {t.visitorManagement.restrictionReasonLabel}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={restrictionReason}
                    onChange={e => setRestrictionReason(e.target.value)}
                    placeholder="مثال: مخالفة آداب النشر أو كتابة تعليقات مكررة غير لائقة..."
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setManagingStatusUser(null)}
                  className="outline-button small"
                >
                  {t.common.cancel}
                </button>
                <button type="submit" className="primary-button small">
                  {t.visitorManagement.saveStatusBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SAFE ACCOUNT DELETION */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-red-300 shadow-xl animate-in fade-in">
            <h3 className="font-serif text-lg font-bold text-red-900 mb-2">
              {t.visitorManagement.confirmDeleteAccount}
            </h3>
            <p className="text-xs text-stone-700 mb-3">
              {deleteTargetUser.name} ({deleteTargetUser.email})
            </p>
            <div className="p-3 bg-red-50 text-red-800 text-xs border border-red-200 mb-4">
              {t.visitorManagement.deleteAccountWarning}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="outline-button small"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded"
              >
                {t.visitorManagement.deleteAccountBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: USER SUBMITTED REVIEWS */}
      {viewingUserReviews && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 border border-[var(--line)] shadow-xl max-h-[85vh] overflow-y-auto animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-medium">
                {t.visitorManagement.userReviewsModalTitle}
              </h3>
              <button onClick={() => setViewingUserReviews(null)}>
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-4">
              {viewingUserReviews.name} · {viewingUserReviews.email}
            </p>

            {loadingUserReviews ? (
              <LoadingState message={t.common.loading} />
            ) : userReviewsList.length === 0 ? (
              <p className="text-xs text-center py-6 text-[var(--muted)]">
                {t.visitorManagement.noUserReviews}
              </p>
            ) : (
              <div className="space-y-3">
                {userReviewsList.map(r => (
                  <div key={r.id} className="p-3 bg-stone-50 border border-stone-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <b className="text-[var(--green)]">{r.novelTitle || r.novelId}</b>
                      <span className="font-mono text-amber-700 font-bold">{r.rating} ★</span>
                    </div>
                    {r.reviewText && (
                      <p className="text-stone-700 font-serif whitespace-pre-line">{r.reviewText}</p>
                    )}
                    <div className="text-[10px] text-[var(--muted)] flex justify-between pt-1">
                      <span>الحالة: {r.status}</span>
                      {r.moderationReason && <span>السبب: {r.moderationReason}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: HIDE REVIEW MODERATION REASON */}
      {hidingReviewTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-amber-300 shadow-xl animate-in fade-in">
            <h3 className="font-serif text-lg font-medium text-amber-950 mb-2">
              {t.visitorManagement.hideReviewModalTitle}
            </h3>
            <p className="text-xs text-[var(--muted)] mb-3">
              {hidingReviewTarget.userName} · {hidingReviewTarget.novelTitle} ({hidingReviewTarget.rating}★)
            </p>

            <div className="p-2.5 bg-amber-50 text-amber-900 border border-amber-200 text-[11px] mb-4">
              {t.visitorManagement.moderationPolicyNotice}
            </div>

            <form onSubmit={handleHideReview} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t.visitorManagement.moderationReasonLabel}
                </label>
                <textarea
                  rows={2}
                  required
                  value={moderationReasonInput}
                  onChange={e => setModerationReasonInput(e.target.value)}
                  placeholder="حدد سبب الإخفاء (مثال: محتوى إعلاني مكرر، ألفاظ غير لائقة...)"
                  className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setHidingReviewTarget(null)}
                  className="outline-button small"
                >
                  {t.common.cancel}
                </button>
                <button type="submit" className="primary-button small">
                  {t.visitorManagement.confirmHideReview}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE ACCESS (SUBSCRIPTION & ENTITLEMENTS) - Preserved */}
      {managingAccessUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-[var(--line)] shadow-xl animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-medium">{t.adminUsers.modalTitle}</h3>
              <button onClick={() => setManagingAccessUser(null)}>
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-4">
              {managingAccessUser.name} · {managingAccessUser.email}
            </p>

            {/* Grant Subscription */}
            <div className="p-3 bg-stone-50 border border-stone-200 mb-4 space-y-2">
              <span className="block text-xs font-semibold">{t.adminUsers.grantSubSection}</span>
              <div className="flex items-center gap-2">
                <label className="text-xs">{t.adminUsers.durationMonths}</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={subMonths}
                  onChange={e => setSubMonths(Number(e.target.value))}
                  className="w-16 p-1 border text-xs bg-white"
                />
                <button
                  onClick={handleGrantSubscription}
                  className="primary-button small ms-auto text-xs"
                >
                  {t.adminUsers.grantSubBtn}
                </button>
              </div>
              {managingAccessUser.subscription && (
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-xs">
                  <span className="text-emerald-700">اشتراك مفعل</span>
                  <button
                    onClick={handleRevokeSubscription}
                    className="text-red-600 hover:underline text-[11px]"
                  >
                    إلغاء الاشتراك
                  </button>
                </div>
              )}
            </div>

            {/* Grant Novel Access */}
            <div className="p-3 bg-stone-50 border border-stone-200 space-y-2">
              <span className="block text-xs font-semibold">{t.adminUsers.grantNovelSection}</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] mb-1">{t.adminUsers.selectNovel}</label>
                  <select
                    value={selectedNovelId}
                    onChange={e => setSelectedNovelId(e.target.value)}
                    className="w-full p-1.5 border text-xs bg-white"
                  >
                    {novels.map(n => (
                      <option key={n.id} value={n.id}>
                        {getLocalizedNovelField(n, 'title', language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] mb-1">{t.adminUsers.entType}</label>
                  <select
                    value={entType}
                    onChange={e => setEntType(e.target.value as 'novel' | 'book')}
                    className="w-full p-1.5 border text-xs bg-white"
                  >
                    <option value="novel">{t.adminUsers.typeNovel}</option>
                    <option value="book">{t.adminUsers.typeBook}</option>
                  </select>
                </div>
                <button
                  onClick={handleGrantEntitlement}
                  className="primary-button small w-full text-xs"
                >
                  {t.adminUsers.grantNovelBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
