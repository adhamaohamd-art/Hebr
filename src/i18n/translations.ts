import { Language } from '../types';

export interface Translations {
  // Common & Navigation
  common: {
    brandName: string;
    brandTagline: string;
    home: string;
    browse: string;
    store: string;
    plans: string;
    library: string;
    admin: string;
    cart: string;
    checkout: string;
    account: string;
    login: string;
    logout: string;
    search: string;
    searchPlaceholder: string;
    explore: string;
    viewAll: string;
    read: string;
    startReading: string;
    continueReading: string;
    currency: string;
    chapter: string;
    chapters: string;
    chaptersCount: string;
    author: string;
    status: string;
    genre: string;
    free: string;
    locked: string;
    rating: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    loading: string;
    error: string;
    success: string;
    empty: string;
    all: string;
    ongoing: string;
    completed: string;
    published: string;
    draft: string;
    openMenu: string;
    closeMenu: string;
    switchLanguage: string;
    drawerNote: string;
    unlockedForReading: string;
    requiresPurchaseOrSub: string;
    addToCart: string;
    addedToCart: string;
    subtotal: string;
    discount: string;
    total: string;
    percentOff: string;
    fixedOff: string;
    egp: string;
    siteBusy: string;
    verifyEmailNotice: string;
    verifyEmailResendBtn: string;
    verifyEmailSentSuccess: string;
    verifiedCheckBtn: string;
    verifiedCheckChecking: string;
    verifiedCheckStillNot: string;
    verifiedCheckSuccess: string;
    emailNotVerifiedComment: string;
    emailNotVerifiedOrder: string;
    loadMoreComments: string;
    showComments: string;
    loadMoreUsers: string;
  };
  genres: Record<string, string>;
  statusLabels: Record<string, string>;
  home: {
    heroEyebrow: string;
    heroTitlePart1: string;
    heroTitlePart2: string;
    heroDesc: string;
    heroStoreButton: string;
    statNovels: string;
    statNovelsCount: string;
    statAuthors: string;
    statAuthorsCount: string;
    statReaders: string;
    statReadersCount: string;
    heroArtCaption: string;
    heroScrollNote: string;
    curatedEyebrow: string;
    curatedTitle: string;
    loadingCurated: string;
    emptyCuratedTitle: string;
    emptyCuratedDesc: string;
    newShelfEyebrow: string;
    newShelfTitle: string;
    loadingNewShelf: string;
    allInFeaturedNote: string;
    quoteText: string;
    quoteEm: string;
    quoteAuthor: string;
    plansEyebrow: string;
    plansTitlePart1: string;
    plansTitlePart2: string;
    plansDesc: string;
    plansButton: string;
    circleRead: string;
    circleDiscover: string;
    circleShare: string;
  };
  browse: {
    pageTitle: string;
    pageMetaDesc: string;
    eyebrow: string;
    title: string;
    intro: string;
    asideTagline: string;
    allStatuses: string;
    novelsCountSingle: string;
    novelsCountPlural: string;
    loadingMessage: string;
    emptyTitle: string;
    emptyDesc: string;
    resetFilters: string;
  };
  novelDetail: {
    pageMetaDesc: string;
    backToNovels: string;
    byAuthor: string;
    freeChaptersStat: string;
    ratingStat: string;
    addedNovelToast: string;
    addedBookToast: string;
    acquireNovelBtn: string;
    acquireBookBtn: string;
    ownedBookBadge: string;
    ownedNovelBadge: string;
    chaptersEyebrow: string;
    chaptersTitle: string;
    noChaptersYet: string;
    availableNow: string;
    chapterNumberPrefix: string;
    aboutAuthorEyebrow: string;
    aboutAuthorBio: string;
    exploreMoreInHebr: string;
    notFoundTitle: string;
    notFoundDesc: string;
    downloadBookBtn: string;
    downloadBookMissing: string;
    bookEpubBtn: string;
    bookPdfBtn: string;
    bookPreparing: string;
    bookPreparingShort: string;
    bookPrepareFailed: string;
    bookPopupBlocked: string;
    bookPartial: string;
    bookNoChapters: string;
  };
  reader: {
    loadingMessage: string;
    notFoundTitle: string;
    backToNovel: string;
    chapterOf: string;
    bookmarkTooltip: string;
    settingsTooltip: string;
    fontSize: string;
    theme: string;
    themeLight: string;
    themeWarm: string;
    themeDark: string;
    contentWidth: string;
    widthNarrow: string;
    widthMedium: string;
    widthWide: string;
    chapterEnded: string;
    prevChapter: string;
    nextChapter: string;
    endOfAvailableChapters: string;
    lockedTitle: string;
    lockedDesc: string;
    optionOneEyebrow: string;
    optionOneTitle: string;
    optionOneDesc: string;
    optionTwoEyebrow: string;
    optionTwoTitle: string;
    optionTwoDesc: string;
    optionThreeEyebrow: string;
    optionThreeTitle: string;
    optionThreeDesc: string;
    optionThreePricePrefix: string;
    authorNoteTitle: string;
    authorNoteBody: string;
    commentsTitle: string;
    commentPlaceholder: string;
    sendComment: string;
    sendingComment: string;
    loginToCommentPrompt: string;
    loginLink: string;
    noCommentsYet: string;
    showPublic: string;
    hidePublic: string;
    deleteComment: string;
    commentCooldown: string;
    commentTooLong: string;
    charCounter: string;
  };
  store: {
    pageTitle: string;
    pageMetaDesc: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    badgeStamp: string;
    loadingMessage: string;
    editionLabel: string;
    featuresDesc: string;
    addedToast: string;
    addToCartBtn: string;
    emptyTitle: string;
    emptyDesc: string;
    browseNovelsBtn: string;
  };
  plans: {
    pageTitle: string;
    pageMetaDesc: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    monthly: string;
    yearly: string;
    saveTwoMonths: string;
    loadingMessage: string;
    mostChosenBadge: string;
    planPrefix: string;
    perMonth: string;
    perYear: string;
    includesAccessTo: string;
    selectPlanBtn: string;
    paymentNote: string;
  };
  library: {
    pageTitle: string;
    pageMetaDesc: string;
    eyebrow: string;
    welcomePrefix: string;
    subtitle: string;
    subscribedBadge: string;
    activateSubBtn: string;
    tabContinue: string;
    tabPurchased: string;
    tabBookmarks: string;
    tabOrders: string;
    currentlyReading: string;
    chapterOf: string;
    completedPercent: string;
    continueReadingBtn: string;
    noReadingStarted: string;
    exploreNovelsNow: string;
    recommendedTitle: string;
    purchasedEmptyTitle: string;
    purchasedEmptyDesc: string;
    visitStoreBtn: string;
    purchasedBookLabel: string;
    purchasedNovelLabel: string;
    readChaptersBtn: string;
    downloadPdfBtn: string;
    downloadPreparingAlert: string;
    bookmarksEmptyTitle: string;
    bookmarksEmptyDesc: string;
    ordersEmptyTitle: string;
    ordersEmptyDesc: string;
    orderNumberPrefix: string;
    statusPending: string;
    statusApproved: string;
    statusRejected: string;
    paymentMethodLabel: string;
    couponLabel: string;
    orderTotalLabel: string;
    adminNotePrefix: string;
    viewReceiptBtn: string;
    loadingMessage: string;
  };
  cart: {
    pageTitle: string;
    pageMetaDesc: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDesc: string;
    exploreNovelsBtn: string;
    itemNovelLabel: string;
    itemBookLabel: string;
    itemPlanLabel: string;
    removeItemTooltip: string;
    summaryEyebrow: string;
    couponPlaceholder: string;
    checkCouponBtn: string;
    checkingCoupon: string;
    appliedCouponPrefix: string;
    removeCouponBtn: string;
    couponAppliedSuccess: string;
    couponInvalidError: string;
    subtotalLabel: string;
    couponDiscountLabel: string;
    totalLabel: string;
    proceedCheckoutBtn: string;
    paymentMethodsHint: string;
  };
  checkout: {
    pageTitle: string;
    metaDesc: string;
    backToCart: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    step1Title: string;
    step2Title: string;
    step3Title: string;
    vodafoneCashTitle: string;
    instapayTitle: string;
    sendAmountPrompt: string;
    recipientNumber: string;
    instapayHandle: string;
    attachReceiptLabel: string;
    attachReceiptHint: string;
    receiptPreviewLabel: string;
    changeFile: string;
    missingReceiptError: string;
    submissionError: string;
    permissionError: string;
    confirmSubmitBtn: string;
    processingBtn: string;
    orderSuccessTitle: string;
    orderNumberLabel: string;
    orderSuccessDesc: string;
    statusUnderReview: string;
    goToLibraryBtn: string;
    continueBrowsingBtn: string;
    orderSummaryEyebrow: string;
    itemsCountLabel: string;
    senderPhoneLabel: string;
    senderPhonePlaceholder: string;
    senderPhoneHint: string;
    transactionRefLabel: string;
    transactionRefPlaceholder: string;
    transactionRefHint: string;
    noteLabel: string;
    notePlaceholder: string;
    maxPendingOrdersError: string;
    invalidSenderPhone: string;
    invalidTransactionRef: string;
  };
  login: {
    pageTitle: string;
    pageMetaDesc: string;
    badge: string;
    tabSignIn: string;
    tabSignUp: string;
    titleSignIn: string;
    titleSignUp: string;
    descSignIn: string;
    descSignUp: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submittingBtn: string;
    signInBtn: string;
    signUpBtn: string;
    orDivider: string;
    googleBtn: string;
    errNameRequired: string;
    errInvalidCreds: string;
    errEmailInUse: string;
    errWeakPassword: string;
    errPopupClosed: string;
    errGeneric: string;
    errUnauthorizedDomain: string;
    errOperationNotAllowed: string;
    errPopupBlocked: string;
    errInvalidApiKey: string;
  };
  notFound: {
    pageTitle: string;
    pageMetaDesc: string;
    errorCode: string;
    heading: string;
    desc: string;
    backHomeBtn: string;
  };
  admin: {
    sidebarHeader: string;
    portalTitle: string;
    viewAsReader: string;
    liveSystemLabel: string;
    navOverview: string;
    navNovels: string;
    navChapters: string;
    navBooks: string;
    navOrders: string;
    navUsers: string;
    navPlansCoupons: string;
    navRatings: string;
    navSettings: string;
    statsTotalNovels: string;
    statsTotalNovelsNote: string;
    statsPendingOrders: string;
    statsPendingOrdersNeedsReview: string;
    statsPendingOrdersCleared: string;
    statsTotalSales: string;
    statsTotalSalesNote: string;
    statsTotalChapters: string;
    statsTotalChaptersNote: string;
    recentPendingOrdersEyebrow: string;
    recentPendingOrdersTitle: string;
    viewAllOrdersBtn: string;
    noPendingOrders: string;
    receiptLink: string;
    approveBtn: string;
    rejectBtn: string;
    quickActionsEyebrow: string;
    quickActionsTitle: string;
    addNewNovelLink: string;
    editChaptersLink: string;
    createCouponLink: string;
    updatePaymentNumbersLink: string;
    registeredNovelsEyebrow: string;
    registeredNovelsTitle: string;
    manageNovelsBtn: string;
    colNovel: string;
    colAuthor: string;
    colGenre: string;
    colStatus: string;
    colChapters: string;
    colNovelPrice: string;
    colBookPrice: string;
    colPublishing: string;
    orderApprovedToast: string;
    orderRejectedToast: string;
    rebuildCatalogBtn: string;
    rebuildingCatalogBtn: string;
    rebuildCatalogSuccess: string;
    rebuildCatalogError: string;
  };
  adminNovels: {
    pageTitle: string;
    pageSubtitle: string;
    addNewBtn: string;
    editNovelTitle: string;
    newNovelTitle: string;
    titleAr: string;
    titleEn: string;
    authorAr: string;
    authorEn: string;
    genre: string;
    status: string;
    freeChapters: string;
    descAr: string;
    descEn: string;
    novelPrice: string;
    bookPrice: string;
    bookPricePlaceholder: string;
    colorPrimary: string;
    colorAccent: string;
    coverUrl: string;
    save: string;
    saving: string;
    cancel: string;
    deleteConfirm: string;
    published: string;
    draft: string;
    colCoverTitle: string;
    colAuthor: string;
    colGenre: string;
    colNovelPrice: string;
    colBookPrice: string;
    colFreeChapters: string;
    colStatus: string;
    colPublishing: string;
    colActions: string;
    firstNChaptersFree: string;
    chaptersSuffix: string;
  };
  adminChapters: {
    pageTitle: string;
    pageSubtitle: string;
    selectNovel: string;
    addNewBtn: string;
    bulkImportBtn: string;
    editModalTitle: string;
    newModalTitle: string;
    bulkModalTitle: string;
    bulkModalHelp: string;
    bulkStartBtn: string;
    colNumber: string;
    colTitle: string;
    colAccess: string;
    colPublished: string;
    colActions: string;
    freeBadge: string;
    lockedBadge: string;
    chapterNumber: string;
    chapterTitleAr: string;
    chapterTitleEn: string;
    isFreeLabel: string;
    publishLabel: string;
    bodyLabel: string;
    noChapters: string;
    deleteConfirm: string;
  };
  adminBooks: {
    pageTitle: string;
    pageSubtitle: string;
    hasBookBadge: string;
    noBookBadge: string;
    priceLabel: string;
    fileUrlLabel: string;
    fileAvailable: string;
    fileMissing: string;
    saveBtn: string;
    editBtn: string;
    successNotice: string;
    downloadUrlLabel: string;
    downloadUrlPlaceholder: string;
    downloadUrlHint: string;
  };
  adminOrders: {
    pageTitle: string;
    pageSubtitle: string;
    filterAll: string;
    filterPending: string;
    filterApproved: string;
    filterRejected: string;
    colOrderNum: string;
    colUser: string;
    colItems: string;
    colTotal: string;
    colMethod: string;
    colReceipt: string;
    colStatus: string;
    colActions: string;
    viewReceipt: string;
    noReceipt: string;
    approveBtn: string;
    rejectBtn: string;
    reviewModalTitle: string;
    adminNoteLabel: string;
    confirmApprove: string;
    confirmReject: string;
    receiptModalTitle: string;
    noOrdersFound: string;
    colSenderPhone: string;
    colTransactionRef: string;
    colNote: string;
    duplicateRefWarning: string;
    copiedToast: string;
    copyBtn: string;
  };
  adminUsers: {
    pageTitle: string;
    pageSubtitle: string;
    searchPlaceholder: string;
    colUser: string;
    colEmail: string;
    colSub: string;
    colActions: string;
    activeUntil: string;
    noSub: string;
    manageAccess: string;
    modalTitle: string;
    grantSubSection: string;
    durationMonths: string;
    grantSubBtn: string;
    grantNovelSection: string;
    selectNovel: string;
    entType: string;
    typeNovel: string;
    typeBook: string;
    grantNovelBtn: string;
    grantSuccess: string;
  };
  adminPlansCoupons: {
    pageTitle: string;
    pageSubtitle: string;
    plansTitle: string;
    couponsTitle: string;
    createCouponTitle: string;
    codeLabel: string;
    typeLabel: string;
    typePercent: string;
    typeFixed: string;
    valueLabel: string;
    maxUsesLabel: string;
    createCouponBtn: string;
    colCode: string;
    colDiscount: string;
    colUses: string;
    colStatus: string;
    colActions: string;
    active: string;
    inactive: string;
    editPlanTitle: string;
    addPlanTitle: string;
    addNewPlanBtn: string;
    mostChosen: string;
    perMonth: string;
    perYear: string;
    unlimited: string;
    confirmDeleteCoupon: string;
    confirmDeletePlan: string;
    featuresLabel: string;
    featureCheckLabel: string;
    couponPlaceholder: string;
    planName: string;
    planDesc: string;
    priceMonthly: string;
    priceYearly: string;
    savePlan: string;
  };
  adminSettings: {
    pageTitle: string;
    pageSubtitle: string;
    paymentConfigTitle: string;
    siteName: string;
    tagline: string;
    vodafoneCash: string;
    instapayHandle: string;
    instructions: string;
    contactEmail: string;
    saveBtn: string;
    saving: string;
    successNotice: string;
  };
  novelReviews: {
    sectionTitle: string;
    sectionEyebrow: string;
    genuineVisitorAverage: string;
    basedOnRatings: string;
    noRatingsYet: string;
    starsDistribution: string;
    editorialRatingBadge: string;
    editorialReviewTitle: string;
    writeReviewTitle: string;
    editReviewTitle: string;
    starSelectLabel: string;
    reviewTextPlaceholder: string;
    submitReviewBtn: string;
    updateReviewBtn: string;
    deleteReviewBtn: string;
    confirmDeleteReview: string;
    loginToReview: string;
    accountRestrictedNotice: string;
    ratingsDisabledNotice: string;
    filterAll: string;
    filterStars: string;
    loadMoreReviews: string;
    noReviewsYet: string;
    reportBtn: string;
    reportModalTitle: string;
    reportReasonSpam: string;
    reportReasonHarassment: string;
    reportReasonUnlawful: string;
    reportReasonOther: string;
    reportDetailsPlaceholder: string;
    submitReportBtn: string;
    reportSuccessToast: string;
    reviewSubmittedSuccess: string;
    reviewDeletedSuccess: string;
    yourReviewBadge: string;
  };
  visitorManagement: {
    pageTitle: string;
    pageSubtitle: string;
    tabVisitors: string;
    tabModeration: string;
    tabReports: string;
    tabSettingsAudit: string;
    totalVisitors: string;
    activeVisitors: string;
    restrictedVisitors: string;
    deactivatedVisitors: string;
    statusActive: string;
    statusRestricted: string;
    statusDeactivated: string;
    filterStatusAll: string;
    colJoinedAt: string;
    colStatus: string;
    colActivity: string;
    viewDetailsAndReviews: string;
    editStatusTitle: string;
    statusSelectLabel: string;
    restrictionReasonLabel: string;
    saveStatusBtn: string;
    deleteAccountBtn: string;
    confirmDeleteAccount: string;
    deleteAccountWarning: string;
    userReviewsModalTitle: string;
    noUserReviews: string;
    ratingsCountLabel: string;
    entitlementsCountLabel: string;
    prevPage: string;
    nextPage: string;
    pageInfo: string;
    modPageTitle: string;
    modPageSubtitle: string;
    filterByNovel: string;
    filterByRating: string;
    filterByStatus: string;
    statusPublished: string;
    statusHidden: string;
    hideReviewBtn: string;
    publishReviewBtn: string;
    deleteReviewBtn: string;
    hideReviewModalTitle: string;
    moderationReasonLabel: string;
    moderationPolicyNotice: string;
    confirmHideReview: string;
    confirmDeleteModReview: string;
    reportsCount: string;
    reportsPageTitle: string;
    reportsPageSubtitle: string;
    reporter: string;
    reportedUser: string;
    reasonLabel: string;
    detailsLabel: string;
    resolveBtn: string;
    dismissBtn: string;
    statusPending: string;
    statusResolved: string;
    statusDismissed: string;
    noReportsFound: string;
    ratingSettingsTitle: string;
    requireAuthLabel: string;
    requireAuthHelp: string;
    globalEnableLabel: string;
    globalEnableHelp: string;
    maxReviewsPerDayLabel: string;
    maxReviewsPerDayHelp: string;
    saveSettingsBtn: string;
    auditLogTitle: string;
    colTimestamp: string;
    colAdmin: string;
    colAction: string;
    colTarget: string;
    colDetails: string;
    settingsSavedSuccess: string;
    emptyAuditLogs: string;
  };
  ratingControls: {
    sectionTitle: string;
    sectionSubtitle: string;
    displayModeLabel: string;
    modeVisitor: string;
    modeVisitorDesc: string;
    modeEditorial: string;
    modeEditorialDesc: string;
    modeCustom: string;
    modeCustomDesc: string;
    modeCombined: string;
    modeBlended: string;
    modeBlendedDesc: string;
    blendedWeightLabel: string;
    blendedPreviewLabel: string;
    genuineVisitorAvgLabel: string;
    genuineVotesCount: string;
    editorialRatingInput: string;
    editorialReviewInput: string;
    customRatingInput: string;
    ratingsEnabledCheckbox: string;
    ratingsEnabledHelp: string;
    editorialNotice: string;
  };
  adminRatingManagement: {
    pageTitle: string;
    pageSubtitle: string;
    selectNovelPrompt: string;
    searchNovelPlaceholder: string;
    allNovels: string;
    selectedNovel: string;
    noNovelsFound: string;
    readerStatsTitle: string;
    readerStatsDesc: string;
    readerAverage: string;
    readerVotesCount: string;
    readerPoints: string;
    noReaderRatings: string;
    recalculateReaderStatsBtn: string;
    recalculating: string;
    recalculateSuccess: string;
    adminStatsTitle: string;
    adminStatsDesc: string;
    enableAdminContribution: string;
    enableAdminContributionHelp: string;
    star5Label: string;
    star4Label: string;
    star3Label: string;
    star2Label: string;
    star1Label: string;
    adminCountAuto: string;
    adminAverageAuto: string;
    adminPointsAuto: string;
    modeSectionTitle: string;
    modeVisitor: string;
    modeVisitorDetail: string;
    modeCombined: string;
    modeCombinedDetail: string;
    modeEditorial: string;
    modeEditorialDetail: string;
    modeCustom: string;
    modeCustomDetail: string;
    editorialRatingInput: string;
    editorialReviewInput: string;
    customRatingInput: string;
    ratingsEnabledCheckbox: string;
    ratingsEnabledHelp: string;
    previewTitle: string;
    previewCardHeader: string;
    previewDetailHeader: string;
    combinedFormulaExplanation: string;
    saveChangesBtn: string;
    saving: string;
    savedSuccess: string;
    resetAdminStatsBtn: string;
    resetConfirmTitle: string;
    resetConfirmDesc: string;
    confirmResetAction: string;
    cancel: string;
    quickNovelRatingsBtn: string;
  };
  footer: {
    brandQuote: string;
    exploreTitle: string;
    helpTitle: string;
    followTitle: string;
    allRightsReserved: string;
  };
}

export const translations: Record<Language, Translations> = {
  ar: {
    common: {
      brandName: 'حَبْر',
      brandTagline: 'منصة الحكايات',
      home: 'الرئيسية',
      browse: 'تصفح الروايات',
      store: 'الكتب الرقمية',
      plans: 'خطط القراءة',
      library: 'مكتبتي',
      admin: 'لوحة الإدارة',
      cart: 'السلة',
      checkout: 'الدفع والاقتناء',
      account: 'حسابي',
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      search: 'ابحث عن رواية أو كاتب',
      searchPlaceholder: 'ابحث باسم الرواية أو الكاتب...',
      explore: 'اكتشف الروايات',
      viewAll: 'عرض الكل',
      read: 'اقرأ',
      startReading: 'ابدأ القراءة',
      continueReading: 'متابعة القراءة',
      currency: 'ج.م',
      chapter: 'فصل',
      chapters: 'فصول',
      chaptersCount: 'فصل',
      author: 'الكاتب',
      status: 'الحالة',
      genre: 'التصنيف',
      free: 'متاح مجاناً',
      locked: 'مقفل',
      rating: 'التقييم',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      close: 'إغلاق',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
      loading: 'جاري التحميل...',
      error: 'حدث خطأ',
      success: 'تم بنجاح',
      empty: 'فارغ',
      all: 'الكل',
      ongoing: 'مستمرة',
      completed: 'مكتملة',
      published: 'منشورة',
      draft: 'مسودة',
      openMenu: 'فتح القائمة',
      closeMenu: 'إغلاق القائمة',
      switchLanguage: 'English',
      drawerNote: 'مساحة هادئة للقراءة،\nوحكايات تستحق أن تُروى.',
      unlockedForReading: 'متاح للقراءة الآن',
      requiresPurchaseOrSub: 'يتطلب اقتناء الرواية أو الاشتراك',
      addToCart: 'أضف للسلة',
      addedToCart: 'تمت الإضافة للسلة',
      subtotal: 'الإجمالي الفرعي',
      discount: 'الخصم',
      total: 'الإجمالي النهائي',
      percentOff: '٪',
      fixedOff: 'ج.م',
      egp: 'ج.م',
      siteBusy: 'الموقع مشغول حالياً، حاول بعد قليل',
      verifyEmailNotice: 'يرجى تأكيد بريدك الإلكتروني لتتمكن من إضافة التعليقات وإتمام طلبات الاقتناء.',
      verifyEmailResendBtn: 'إعادة إرسال رابط التأكيد',
      verifyEmailSentSuccess: 'تم إرسال رابط التأكيد إلى بريدك الإلكتروني',
      verifiedCheckBtn: 'لقد أكّدت بريدي',
      verifiedCheckChecking: 'جارٍ التحقق...',
      verifiedCheckStillNot: 'لم يتم التأكيد بعد. افتح الرابط المرسل إلى بريدك ثم أعد المحاولة.',
      verifiedCheckSuccess: 'تم تأكيد بريدك الإلكتروني بنجاح.',
      emailNotVerifiedComment: 'يجب تأكيد بريدك الإلكتروني أولاً لتتمكن من إضافة التعليقات.',
      emailNotVerifiedOrder: 'يجب تأكيد بريدك الإلكتروني أولاً قبل إتمام الطلب.',
      loadMoreComments: 'تحميل المزيد من التعليقات',
      showComments: 'عرض التعليقات',
      loadMoreUsers: 'تحميل المزيد من المستخدمين',
    },
    genres: {
      'الكل': 'الكل',
      'رومانسية': 'رومانسية',
      'دراما': 'دراما',
      'فانتازيا': 'فانتازيا',
      'أكشن': 'أكشن',
      'غموض': 'غموض',
      'اجتماعية': 'اجتماعية',
      'تشويق': 'تشويق',
      'تاريخي': 'تاريخي',
      'All': 'الكل',
      'Romance': 'رومانسية',
      'Drama': 'دراما',
      'Fantasy': 'فانتازيا',
      'Action': 'أكشن',
      'Mystery': 'غموض',
      'Social': 'اجتماعية',
      'Thriller': 'تشويق',
      'Historical': 'تاريخي',
    },
    statusLabels: {
      'الكل': 'كل الحالات',
      'مستمرة': 'مستمرة',
      'مكتملة': 'مكتملة',
      'All': 'كل الحالات',
      'Ongoing': 'مستمرة',
      'Completed': 'مكتملة',
    },
    home: {
      heroEyebrow: 'منصة الحكايات العربية',
      heroTitlePart1: 'لكل حكاية',
      heroTitlePart2: 'أثرٌ يبقى.',
      heroDesc: 'مساحة هادئة للروايات التي تستحق أن تُقرأ ببطء، وتُحفظ طويلاً في الذاكرة.',
      heroStoreButton: 'تصفح المتجر الرقمي',
      statNovels: 'رواية عربية',
      statNovelsCount: '٢٤٠+',
      statAuthors: 'كاتباً وكاتبة',
      statAuthorsCount: '٣٦',
      statReaders: 'قارئاً نشطاً',
      statReadersCount: '١٢k',
      heroArtCaption: 'حكايات مختارة بعناية',
      heroScrollNote: 'مرر لاكتشاف المزيد',
      curatedEyebrow: 'مختارات حبر',
      curatedTitle: 'حكايات نرشحها لك',
      loadingCurated: 'جاري استحضار الروايات المختارة...',
      emptyCuratedTitle: 'لا توجد روايات منشورة حالياً، عد قريباً.',
      emptyCuratedDesc: 'نعمل على إعداد مجموعة مميزة من أروع الحكايات العربية المنتقاة بعناية.',
      newShelfEyebrow: 'من الرف الجديد',
      newShelfTitle: 'وصل حديثاً',
      loadingNewShelf: 'جاري تجهيز الرف الجديد...',
      allInFeaturedNote: 'كل الروايات الحالية معروضة في قسم المختارات أعلاه.',
      quoteText: 'الكتب لا تغيّر العالم،',
      quoteEm: 'لكنها تغيّر الإنسان الذي يغيّره.',
      quoteAuthor: '— بول أوستر',
      plansEyebrow: 'نادي حبر',
      plansTitlePart1: 'لا تدع الحكاية',
      plansTitlePart2: 'تتوقف هنا.',
      plansDesc: 'اشترك في خطة قراءة تناسبك، واكتشف عالماً جديداً كل شهر بدون قيود.',
      plansButton: 'تعرف على الخطط',
      circleRead: 'اقرأ',
      circleDiscover: 'اكتشف',
      circleShare: 'شارك',
    },
    browse: {
      pageTitle: 'مكتبة الحكايات',
      pageMetaDesc: 'تصفح روايات عربية حصرية عبر تصنيفات متعددة وكتّاب متميزين.',
      eyebrow: 'فهرس الحكايات',
      title: 'مكتبة الحكايات',
      intro: 'ابحث عن صوتك القادم بين روايات عربية مختارة بعناية.',
      asideTagline: 'اقرأ ما يشبهك',
      allStatuses: 'كل الحالات',
      novelsCountSingle: 'رواية',
      novelsCountPlural: 'روايات',
      loadingMessage: 'جاري استحضار الروايات من المكتبة...',
      emptyTitle: 'لم نعثر على روايات تطابق بحثك',
      emptyDesc: 'جرّب البحث بكلمات أخرى أو اختر تصنيفاً وحالة مختلفين.',
      resetFilters: 'مسح المرشحات والبحث',
    },
    novelDetail: {
      pageMetaDesc: 'تفاصيل وفصول الرواية.',
      backToNovels: 'العودة إلى الروايات',
      byAuthor: 'بقلم',
      freeChaptersStat: 'فصول مجانية',
      ratingStat: 'التقييم',
      addedNovelToast: 'تمت إضافة الرواية للسلة بنجاح!',
      addedBookToast: 'تمت إضافة الكتاب الرقمي الكامل للسلة!',
      acquireNovelBtn: 'اقتناء الرواية',
      acquireBookBtn: 'اقتناء الكتاب الرقمي (PDF/EPUB)',
      ownedBookBadge: 'تملك النسخة الرقمية الكاملة',
      ownedNovelBadge: 'تم اقتناء الرواية',
      chaptersEyebrow: 'فصول الرواية',
      chaptersTitle: 'اقرأ على مهل',
      noChaptersYet: 'لم تُضَف فصول لهذه الرواية بعد.',
      availableNow: 'متاح للقراءة الآن',
      chapterNumberPrefix: 'الفصل',
      aboutAuthorEyebrow: 'عن الكاتب',
      aboutAuthorBio: 'صوت روائي عربي بارع، ينسج تفاصيل الذاكرة الإنسانية بأسلوب شجي يدعو للتأمل وإعادة قراءة الواقع.',
      exploreMoreInHebr: 'استكشف المزيد في حَبْر',
      notFoundTitle: 'لم يتم العثور على الرواية',
      notFoundDesc: 'قد تكون الرواية محذوفة أو غير منشورة حالياً.',
      downloadBookBtn: 'تحميل النسخة الرقمية (PDF)',
      downloadBookMissing: 'رابط التحميل غير متوفر حالياً، يرجى التواصل مع الإدارة',
      bookEpubBtn: 'تحميل EPUB',
      bookPdfBtn: 'تحميل PDF',
      bookPreparing: 'جاري تجهيز الكتاب... {done} / {total} فصل',
      bookPreparingShort: 'جاري تجهيز الكتاب، لحظات...',
      bookPrepareFailed: 'تعذّر تجهيز الكتاب الآن، حاول بعد قليل.',
      bookPopupBlocked: 'اسمح للموقع بفتح النوافذ المنبثقة ثم اضغط زر PDF مرة أخرى.',
      bookPartial: 'تم تجهيز الكتاب لكن تعذّر تحميل {n} فصل. حاول مرة أخرى أو تواصل مع الإدارة.',
      bookNoChapters: 'لا توجد فصول منشورة لهذه الرواية بعد.',
    },
    reader: {
      loadingMessage: 'جاري تجهيز صفحات الفصل وتنسيق الخطوط...',
      notFoundTitle: 'لم يتم العثور على الفصل المطلوب',
      backToNovel: 'العودة لتفاصيل الرواية',
      chapterOf: 'من',
      bookmarkTooltip: 'حفظ موضع القراءة',
      settingsTooltip: 'تخصيص الخط والمظهر',
      fontSize: 'حجم الخط',
      theme: 'المظهر',
      themeLight: 'أبيض',
      themeWarm: 'دافئ',
      themeDark: 'ليلي',
      contentWidth: 'عرض النص',
      widthNarrow: 'مريح',
      widthMedium: 'متوسط',
      widthWide: 'واسع',
      chapterEnded: 'انتهى الفصل',
      prevChapter: 'الفصل السابق',
      nextChapter: 'الفصل التالي',
      endOfAvailableChapters: 'نهاية الفصول المتاحة',
      lockedTitle: 'هذا الفصل مقفل',
      lockedDesc: 'لإكمال قراءة هذه الحكاية الرائعة، يمكنك اقتناء الرواية أو الاشتراك في نادي حَبْر للوصول لكافة فصول وروايات المنصة.',
      optionOneEyebrow: 'الخيار الأول',
      optionOneTitle: 'اقتناء هذه الرواية',
      optionOneDesc: 'فتح جميع فصول الرواية الحالية والمستقبلية مدى الحياة.',
      optionTwoEyebrow: 'الخيار الثاني',
      optionTwoTitle: 'الكتاب الرقمي الكامل',
      optionTwoDesc: 'فتح القراءة أونلاين وتحميل نسخة PDF/EPUB عالية الجودة.',
      optionThreeEyebrow: 'الأكثر تميزاً',
      optionThreeTitle: 'اشتراك نادي حَبْر',
      optionThreeDesc: 'وصول غير محدود لجميع الروايات والفصول دون أي قيود.',
      optionThreePricePrefix: 'يبدأ من',
      authorNoteTitle: 'ملاحظة من الكاتب',
      authorNoteBody: 'القراءة ليست مجرد استهلاكٍ للكلمات، بل هي بناءٌ لمشهدٍ روحي تشارك في صنعه مع الكاتب.',
      commentsTitle: 'انطباعات القراء حول هذا الفصل',
      commentPlaceholder: 'شارك رأيك أو شعورك حول هذا المشهد...',
      sendComment: 'إرسال التعليق',
      sendingComment: 'جاري الإرسال...',
      loginToCommentPrompt: 'لتتمكن من كتابة انطباعك والمشاركة في نقاش الفصل.',
      loginLink: 'سجل الدخول',
      noCommentsYet: 'كن أول من يترك أثراً وتعليقاً على هذا الفصل.',
      showPublic: 'إظهار للعامة',
      hidePublic: 'إخفاء',
      deleteComment: 'حذف التعليق',
      commentCooldown: 'يرجى الانتظار ٢٠ ثانية بين التعليقات',
      commentTooLong: 'التعليق يجب ألا يتجاوز ٥٠٠ حرف',
      charCounter: 'حرف',
    },
    store: {
      pageTitle: 'الكتب الرقمية',
      pageMetaDesc: 'إصدارات رقمية بصيغ PDF و EPUB عالية الجودة للقراءة على كل أجهزتك.',
      eyebrow: 'مكتبة حبر الرقمية',
      title: 'خذ الحكاية معك',
      subtitle: 'إصدارات رقمية مصممة لترافقك أينما ذهبت بصيغ جاهزة للأجهزة اللوحية والقارئات الإلكترونية.',
      badgeStamp: 'PDF · EPUB',
      loadingMessage: 'جاري استحضار الإصدارات الرقمية...',
      editionLabel: 'إصدار رقمي كامل',
      featuresDesc: 'تنزيل فوري بصيغتي PDF و EPUB + فتح كافة الفصول أونلاين.',
      addedToast: 'تمت الإضافة ✓',
      addToCartBtn: 'أضف للسلة',
      emptyTitle: 'لا توجد كتب رقمية متاحة حالياً',
      emptyDesc: 'يمكن إضافة كتب جديدة من لوحة الإدارة.',
      browseNovelsBtn: 'تصفح الروايات',
    },
    plans: {
      pageTitle: 'خطط القراءة',
      pageMetaDesc: 'اشترك في خطط القراءة بنادي حَبْر لتستمتع بوصول غير محدود لكل الروايات والقصص.',
      eyebrow: 'نادي حبر',
      title: 'اختر رفّك المفضل',
      subtitle: 'خطط بسيطة، وقراءات لا تنتهي. أنت من يحدد إيقاع الحكاية.',
      monthly: 'شهرياً',
      yearly: 'سنوياً',
      saveTwoMonths: 'وفر شهرين',
      loadingMessage: 'جاري تجهيز باقات الاشتراك...',
      mostChosenBadge: 'الأكثر اختياراً',
      planPrefix: 'خطة',
      perMonth: 'ج.م / شهر',
      perYear: 'ج.م / سنة',
      includesAccessTo: 'تشمل الوصول إلى',
      selectPlanBtn: 'اختيار الخطة',
      paymentNote: 'يمكن الدفع عبر محفظة فودافون كاش أو تطبيق إنستاباي بكل سهولة وتفعيل حسابك بعد مراجعة الإيصال.',
    },
    library: {
      pageTitle: 'مكتبتي',
      pageMetaDesc: 'مساحتك الخاصة لمتابعة قراءة رواياتك والاطلاع على محفوظاتك والكتب المقتناة.',
      eyebrow: 'مساحتك الخاصة',
      welcomePrefix: 'أهلاً،',
      subtitle: 'عد إلى الحكايات التي تركت علامة في وجدانك وتابع قراءتك من حيث توقفت.',
      subscribedBadge: 'مشترك في',
      activateSubBtn: 'تفعيل اشتراك',
      tabContinue: 'متابعة القراءة',
      tabPurchased: 'مقتنياتي الرقمية',
      tabBookmarks: 'المحفوظات',
      tabOrders: 'طلبات الاقتناء',
      currentlyReading: 'تتابع القراءة',
      chapterOf: 'من',
      completedPercent: '٪ مكتمل',
      continueReadingBtn: 'متابعة القراءة',
      noReadingStarted: 'لم تبدأ قراءة أي رواية بعد.',
      exploreNovelsNow: 'استكشف الروايات الآن',
      recommendedTitle: 'روايات تقترحها لك خوارزمية حَبْر',
      purchasedEmptyTitle: 'لم تقتنِ أي رواية أو كتاب رقمي بعد',
      purchasedEmptyDesc: 'اقتناء الروايات يمنحك وصولاً دائماً لجميع الفصول بدون أي قيود، مع نسخ للتحميل.',
      visitStoreBtn: 'زيارة المتجر الرقمي',
      purchasedBookLabel: 'الكتاب الرقمي الكامل',
      purchasedNovelLabel: 'رواية مقتناة',
      readChaptersBtn: 'قراءة الفصول',
      downloadPdfBtn: 'تحميل PDF',
      downloadPreparingAlert: 'جاري تجهيز وتنزيل النسخة الرقمية الخاصة بك...',
      bookmarksEmptyTitle: 'قائمة المحفوظات فارغة',
      bookmarksEmptyDesc: 'انقر على أيقونة الإشارة المرجعية على أي رواية لحفظها في هذه القائمة والرجوع إليها.',
      ordersEmptyTitle: 'لا توجد طلبات سابقة',
      ordersEmptyDesc: 'عند إرسال طلب اقتناء عبر فودافون كاش أو إنستاباي ستتمكن من متابعة حالة المراجعة هنا.',
      orderNumberPrefix: 'طلب #',
      statusPending: 'قيد المراجعة',
      statusApproved: 'تمت الموافقة وتفعيل الحساب',
      statusRejected: 'مرفوض',
      paymentMethodLabel: 'طريقة الدفع',
      couponLabel: 'كوبون',
      orderTotalLabel: 'الإجمالي',
      adminNotePrefix: 'ملاحظة الإدارة',
      viewReceiptBtn: 'معاينة الإيصال',
      loadingMessage: 'جاري تجهيز رفوف مكتبتك...',
    },
    cart: {
      pageTitle: 'سلة الحكايات',
      pageMetaDesc: 'سلة مشترياتك في منصة حَبْر لمراجعة الروايات والكتب الرقمية قبل إتمام الاقتناء.',
      eyebrow: 'خطوتك التالية',
      title: 'سلة الحكايات',
      subtitle: 'راجع اختياراتك قبل إرسال طلب الاقتناء وتأكيد الدفع.',
      emptyTitle: 'السلة فارغة',
      emptyDesc: 'ابدأ بإضافة رواية أو كتاب رقمي أو باقة قراءة من مكتبة حَبْر.',
      exploreNovelsBtn: 'اكتشف الروايات',
      itemNovelLabel: 'رواية كاملة',
      itemBookLabel: 'كتاب رقمي + PDF',
      itemPlanLabel: 'اشتراك نادي حَبْر',
      removeItemTooltip: 'حذف من السلة',
      summaryEyebrow: 'ملخص الطلب',
      couponPlaceholder: 'كود الخصم (مثال: HEBR20)',
      checkCouponBtn: 'تطبيق',
      checkingCoupon: 'فحص...',
      appliedCouponPrefix: 'تم تطبيق الكوبون:',
      removeCouponBtn: 'إلغاء',
      couponAppliedSuccess: 'تم تطبيق الخصم بنجاح',
      couponInvalidError: 'الكوبون غير صالح أو منتهي',
      subtotalLabel: 'الإجمالي الفرعي',
      couponDiscountLabel: 'خصم الكوبون',
      totalLabel: 'الإجمالي النهائي',
      proceedCheckoutBtn: 'متابعة الدفع والاقتناء',
      paymentMethodsHint: 'الدفع متاح عبر فودافون كاش وإنستاباي (فوري ومباشر).',
    },
    checkout: {
      pageTitle: 'تأكيد الدفع والاقتناء',
      metaDesc: 'تأكيد الدفع وإرفاق إيصال التحويل للاقتناء.',
      backToCart: 'العودة إلى السلة',
      eyebrow: 'إتمام الطلب',
      title: 'تأكيد الدفع والاقتناء',
      subtitle: 'اختر وسيلة الدفع المناسبة وأرفق إيصال التحويل لإكمال الاقتناء.',
      step1Title: '١. اختر وسيلة التحويل',
      step2Title: '٢. بيانات التحويل والمبلغ المطلوب',
      step3Title: '٣. أرفق صورة إيصال التحويل',
      vodafoneCashTitle: 'محفظة فودافون كاش',
      instapayTitle: 'تطبيق إنستاباي (InstaPay)',
      sendAmountPrompt: 'المبلغ المطلوب تحويله بدقة:',
      recipientNumber: 'رقم المحفظة للتحويل:',
      instapayHandle: 'عنوان الدفع اللحظي (IPA):',
      attachReceiptLabel: 'انقر لاختيار صورة إيصال التحويل أو اسحبها هنا',
      attachReceiptHint: 'صيغ مدعومة: JPG, PNG, WEBP (بحد أقصى 5 ميجابايت)',
      receiptPreviewLabel: 'تم اختيار الإيصال بنجاح',
      changeFile: 'تغيير الصورة',
      missingReceiptError: 'يرجى إرفاق صورة إيصال التحويل لإتمام تأكيد الطلب.',
      submissionError: 'تعذر إرسال الطلب حالياً، يرجى التحقق من الاتصال وإعادة المحاولة.',
      permissionError: 'تعذّر إرسال الطلب لأن حسابك غير مصرّح له بذلك الآن. تأكد من تأكيد بريدك الإلكتروني، ثم سجّل الخروج وادخل من جديد وأعد المحاولة. وإن استمرت المشكلة تواصل معنا.',
      confirmSubmitBtn: 'تأكيد وإرسال طلب الاقتناء',
      processingBtn: 'جاري إرسال الطلب ورفع الإيصال...',
      orderSuccessTitle: 'تم إرسال طلب الاقتناء بنجاح!',
      orderNumberLabel: 'رقم الطلب:',
      orderSuccessDesc: 'شكراً لك! تلقينا إيصال الدفع الخاص بك وسيتم مراجعته وتفعيل الروايات والاشتراك في حسابك فوراً. يمكنك متابعة حالة الطلب في صفحة مكتبتي.',
      statusUnderReview: 'قيد المراجعة',
      goToLibraryBtn: 'الانتقال إلى مكتبتي',
      continueBrowsingBtn: 'متابعة التصفح',
      orderSummaryEyebrow: 'عناصر الطلب',
      itemsCountLabel: 'عناصر',
      senderPhoneLabel: 'رقم الهاتف المحول منه (فودافون كاش أو إنستاباي)',
      senderPhonePlaceholder: '01xxxxxxxxx',
      senderPhoneHint: 'رقم هاتف مصري صالح مكون من ١١ رقماً يبدأ بـ 01',
      transactionRefLabel: 'الرقم المرجعي للتحويل / كود المعاملة',
      transactionRefPlaceholder: 'مثال: TXN-123456 أو كود العملية من التطبيق',
      transactionRefHint: 'من ٦ إلى ٣٠ حرفاً أو رقماً أو شرطة (-)',
      noteLabel: 'ملاحظات إضافية (اختياري)',
      notePlaceholder: 'أي تفاصيل تخص عملية التحويل...',
      maxPendingOrdersError: 'لديك ٣ طلبات معلقة بالفعل قيد المراجعة. يرجى انتظار معالجتها أولاً.',
      invalidSenderPhone: 'رقم الهاتف غير صالح. يجب أن يبدأ بـ 01 ويتكون من ١١ رقماً.',
      invalidTransactionRef: 'الرقم المرجعي غير صالح. يجب أن يتكون من ٦ إلى ٣٠ حرفاً أو رقماً.',
    },
    login: {
      pageTitle: 'تسجيل الدخول والاشتراك',
      pageMetaDesc: 'سجل دخولك أو أنشئ حساباً جديداً في حَبْر لمتابعة قراءة رواياتك المفضلة.',
      badge: 'بوابة القراء',
      tabSignIn: 'تسجيل الدخول',
      tabSignUp: 'حساب جديد',
      titleSignIn: 'مرحباً بعودتك إلى حَبْر',
      titleSignUp: 'انضم إلى رفقاء الحكاية',
      descSignIn: 'سجل دخولك للوصول إلى مكتبتك وفصولك المحفوظة ورواياتك المقتناة.',
      descSignUp: 'أنشئ حسابك لبدء رحلة القراءة والاحتفاظ بتقدمك في الفصول.',
      nameLabel: 'الاسم الكامل',
      namePlaceholder: 'مثال: أحمد عبد الله',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'name@example.com',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      submittingBtn: 'جاري المعالجة...',
      signInBtn: 'تسجيل الدخول',
      signUpBtn: 'إنشاء الحساب',
      orDivider: 'أو الاستمرار عبر',
      googleBtn: 'المتابعة بحساب Google',
      errNameRequired: 'يرجى إدخال اسمك الكامل.',
      errInvalidCreds: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      errEmailInUse: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.',
      errWeakPassword: 'كلمة المرور يجب ألا تقل عن 6 أحرف.',
      errPopupClosed: 'تم إغلاق نافذة تسجيل الدخول.',
      errGeneric: 'حدث خطأ أثناء تسجيل الدخول، يرجى إعادة المحاولة.',
      errUnauthorizedDomain: 'هذا النطاق غير مصرح به في Firebase. أضفه في النطاقات المصرح بها.',
      errOperationNotAllowed: 'تسجيل الدخول بجوجل غير مُفعّل حالياً.',
      errPopupBlocked: 'منع المتصفح النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة.',
      errInvalidApiKey: 'مفتاح Firebase غير صالح. راجع متغيرات البيئة.',
    },
    notFound: {
      pageTitle: 'الصفحة غير موجودة',
      pageMetaDesc: 'عذراً، الصفحة التي تبحث عنها غير متوفرة في منصة حَبْر.',
      errorCode: '٤٠٤',
      heading: 'الصفحة غير موجودة',
      desc: 'عذراً، الصفحة التي تحاول الوصول إليها قد تكون نُقلت أو لم تعد متوفرة.',
      backHomeBtn: 'العودة إلى الرئيسية',
    },
    admin: {
      sidebarHeader: 'لوحة التحكم',
      portalTitle: 'بوابة إدارة حَبْر',
      viewAsReader: 'عرض الموقع كقارئ',
      liveSystemLabel: 'نظام التشغيل الحي · Firestore',
      navOverview: 'نظرة عامة',
      navNovels: 'الروايات',
      navChapters: 'الفصول والمحتوى',
      navBooks: 'الكتب الرقمية',
      navOrders: 'طلبات الاقتناء',
      navUsers: 'المستخدمون',
      navPlansCoupons: 'الخطط والكوبونات',
      navRatings: 'إدارة تقييمات الروايات',
      navSettings: 'إعدادات المنصة',
      statsTotalNovels: 'إجمالي الروايات الحية',
      statsTotalNovelsNote: 'منشورة ومتاحة في المنصة',
      statsPendingOrders: 'طلبات بانتظار المراجعة',
      statsPendingOrdersNeedsReview: 'تحتاج فحص الإيصال',
      statsPendingOrdersCleared: 'تمت معالجة كل الطلبات',
      statsTotalSales: 'المبيعات المؤكدة',
      statsTotalSalesNote: 'طلب اقتناء ناجح',
      statsTotalChapters: 'إجمالي فصول الروايات',
      statsTotalChaptersNote: 'فصل مسجل',
      recentPendingOrdersEyebrow: 'المعاملات المالية',
      recentPendingOrdersTitle: 'الطلبات الحديثة بانتظار المراجعة',
      viewAllOrdersBtn: 'عرض كل الطلبات',
      noPendingOrders: 'لا توجد طلبات جديدة بانتظار المراجعة حالياً.',
      receiptLink: 'الإيصال',
      approveBtn: 'تفعيل',
      rejectBtn: 'رفض',
      quickActionsEyebrow: 'التحكم السريع',
      quickActionsTitle: 'إجراءات سريعة',
      addNewNovelLink: 'إضافة رواية جديدة',
      editChaptersLink: 'تحرير وإضافة فصول المحتوى',
      createCouponLink: 'إنشاء كوبون خصم جديد',
      updatePaymentNumbersLink: 'تعديل أرقام فودافون كاش وإنستاباي',
      registeredNovelsEyebrow: 'المحتوى',
      registeredNovelsTitle: 'الروايات المسجلة في النظام',
      manageNovelsBtn: 'إدارة الروايات',
      colNovel: 'الرواية',
      colAuthor: 'الكاتب',
      colGenre: 'التصنيف',
      colStatus: 'الحالة',
      colChapters: 'الفصول',
      colNovelPrice: 'سعر الرواية',
      colBookPrice: 'سعر الكتاب الرقمي',
      colPublishing: 'النشر',
      orderApprovedToast: 'تمت الموافقة وتفعيل الصلاحيات للطلب',
      orderRejectedToast: 'تم رفض الطلب',
      rebuildCatalogBtn: 'إعادة بناء الفهرس والملخصات',
      rebuildingCatalogBtn: 'جارٍ إعادة البناء...',
      rebuildCatalogSuccess: 'تمت إعادة بناء الفهرس وملخصات الفصول بنجاح!',
      rebuildCatalogError: 'حدث خطأ أثناء إعادة بناء الفهرس',
    },
    adminNovels: {
      pageTitle: 'إدارة الروايات',
      pageSubtitle: 'إضافة وتعديل وحذف الروايات وضبط الأسعار والفصول المجانية.',
      addNewBtn: 'إضافة رواية جديدة',
      editNovelTitle: 'تعديل الرواية',
      newNovelTitle: 'إضافة رواية جديدة',
      titleAr: 'عنوان الرواية (بالعربية)',
      titleEn: 'عنوان الرواية (بالإنجليزي - اختياري)',
      authorAr: 'اسم الكاتب / الكاتبة (بالعربية)',
      authorEn: 'اسم الكاتب (بالإنجليزي - اختياري)',
      genre: 'التصنيف',
      status: 'حالة العمل',
      freeChapters: 'عدد الفصول المجانية',
      descAr: 'وصف الرواية ومقدمتها (بالعربية)',
      descEn: 'وصف الرواية (بالإنجليزي - اختياري)',
      novelPrice: 'سعر اقتناء الرواية أونلاين (ج.م)',
      bookPrice: 'سعر الكتاب الرقمي الكامل + PDF (ج.م)',
      bookPricePlaceholder: 'اتركه فارغاً إذا لم يتوفر كتاب',
      colorPrimary: 'لون الغلاف الأساسي',
      colorAccent: 'لون التمييز (Accent)',
      coverUrl: 'رابط صورة الغلاف (اختياري)',
      save: 'حفظ الرواية',
      saving: 'جاري الحفظ...',
      cancel: 'إلغاء',
      deleteConfirm: 'هل أنت متأكد من حذف هذه الرواية وكافة فصولها؟',
      published: 'منشورة',
      draft: 'مسودة',
      colCoverTitle: 'الغلاف والاسم',
      colAuthor: 'الكاتب',
      colGenre: 'التصنيف',
      colNovelPrice: 'سعر الرواية',
      colBookPrice: 'سعر الكتاب الكامل',
      colFreeChapters: 'الفصول المجانية',
      colStatus: 'الحالة',
      colPublishing: 'النشر',
      colActions: 'إجراءات',
      firstNChaptersFree: 'أول {n} فصول',
      chaptersSuffix: 'فصل',
    },
    adminChapters: {
      pageTitle: 'إدارة الفصول والمحتوى',
      pageSubtitle: 'إضافة الفصول وتحرير نصوص القراءة والاستيراد الجماعي.',
      selectNovel: 'اختر الرواية لإدارة فصولها:',
      addNewBtn: 'إضافة فصل جديد',
      bulkImportBtn: 'استيراد فصول جماعي',
      editModalTitle: 'تعديل محتوى الفصل',
      newModalTitle: 'إضافة فصل جديد',
      bulkModalTitle: 'استيراد فصول متعددة بنص واحد',
      bulkModalHelp: 'الصق نص الرواية الكامل هنا. سيقوم النظام تلقائياً بتقسيم النص إلى فصول عند كل سطر يبدأ بكلمة "الفصل".',
      bulkStartBtn: 'بدء الاستيراد والتقسيم',
      colNumber: 'رقم الفصل',
      colTitle: 'عنوان الفصل',
      colAccess: 'نوع الوصول',
      colPublished: 'حالة النشر',
      colActions: 'إجراءات',
      freeBadge: 'مجاني للجميع',
      lockedBadge: 'مدفوع / مقفل',
      chapterNumber: 'رقم الفصل',
      chapterTitleAr: 'عنوان الفصل (بالعربية)',
      chapterTitleEn: 'عنوان الفصل (بالإنجليزي - اختياري)',
      isFreeLabel: 'متاح مجاناً للمعاينة بدون اشتراك',
      publishLabel: 'نشر الفصل فوراً وجعله متاحاً للقراء',
      bodyLabel: 'نص الفصل الأدبي (يدعم الفقرات والفواصل)',
      noChapters: 'لا توجد فصول مضافة لهذه الرواية بعد.',
      deleteConfirm: 'هل أنت متأكد من حذف هذا الفصل؟',
    },
    adminBooks: {
      pageTitle: 'الكتب الرقمية وإصدارات التحميل',
      pageSubtitle: 'تحديد سعر شراء الكتاب الرقمي الكامل وإرفاق رابط ملف الـ PDF/EPUB المحمي لكل رواية.',
      hasBookBadge: 'متاح ككتاب رقمي',
      noBookBadge: 'غير متوفر ككتاب',
      priceLabel: 'سعر النسخة الكاملة (ج.م):',
      fileUrlLabel: 'رابط ملف التحميل (Google Drive / Storage):',
      fileAvailable: 'متوفر ومحدد ✓',
      fileMissing: 'لم يُرفع ملف بعد',
      saveBtn: 'حفظ إعدادات الكتاب',
      editBtn: 'تعديل الكتاب الرقمي',
      successNotice: 'تم تحديث إعدادات الكتاب الرقمي بنجاح!',
      downloadUrlLabel: 'رابط التحميل المباشر للنسخة الإلكترونية (HTTPS):',
      downloadUrlPlaceholder: 'https://example.com/books/novel.pdf',
      downloadUrlHint: 'رابط آمن ومحمي يبدأ بـ https://، متاح فقط للمشترين المعتمدين.',
    },
    adminOrders: {
      pageTitle: 'إدارة طلبات الاقتناء والاشتراكات',
      pageSubtitle: 'فحص إيصالات فودافون كاش وإنستاباي وتأكيد الطلبات وتفعيل صلاحيات القراءة.',
      filterAll: 'جميع الطلبات',
      filterPending: 'بانتظار المراجعة',
      filterApproved: 'المؤكدة والمفعلة',
      filterRejected: 'المرفوضة',
      colOrderNum: 'رقم الطلب',
      colUser: 'المستخدم',
      colItems: 'العناصر المطلوبة',
      colTotal: 'المبلغ',
      colMethod: 'وسيلة التحويل',
      colReceipt: 'الإيصال',
      colStatus: 'الحالة',
      colActions: 'الإجراءات',
      viewReceipt: 'عرض الإيصال',
      noReceipt: 'بدون إيصال',
      approveBtn: 'موافقة وتفعيل',
      rejectBtn: 'رفض الطلب',
      reviewModalTitle: 'مراجعة طلب الاقتناء',
      adminNoteLabel: 'ملاحظة الإدارة للمستخدم (اختياري):',
      confirmApprove: 'تأكيد الموافقة وتفعيل الروايات',
      confirmReject: 'تأكيد رفض الطلب',
      receiptModalTitle: 'معاينة إيصال الدفع والتحويل',
      noOrdersFound: 'لا توجد طلبات تطابق هذا التصنيف حالياً.',
      colSenderPhone: 'رقم المحول منه',
      colTransactionRef: 'الرقم المرجعي',
      colNote: 'ملاحظة التحويل',
      duplicateRefWarning: '⚠️ تنبيه: الرقم المرجعي مكرر في طلبات أخرى!',
      copiedToast: 'تم النسخ بنجاح!',
      copyBtn: 'نسخ',
    },
    adminUsers: {
      pageTitle: 'إدارة المستخدمين والصلاحيات',
      pageSubtitle: 'استعراض القراء المسجلين ومنح الاشتراكات وإتاحة الروايات يدوياً.',
      searchPlaceholder: 'ابحث بالبريد الإلكتروني أو الاسم...',
      colUser: 'المستخدم',
      colEmail: 'البريد الإلكتروني',
      colSub: 'الاشتراك',
      colActions: 'الإجراءات',
      activeUntil: 'نشط حتى',
      noSub: 'بدون اشتراك نشط',
      manageAccess: 'منح اشتراك أو رواية',
      modalTitle: 'إدارة صلاحيات القارئ',
      grantSubSection: 'منح اشتراك زمني في المنصة',
      durationMonths: 'مدة الاشتراك (بالشهور):',
      grantSubBtn: 'تفعيل الاشتراك للمستخدم',
      grantNovelSection: 'منح اقتناء رواية أو كتاب محدد',
      selectNovel: 'اختر الرواية:',
      entType: 'نوع الاقتناء:',
      typeNovel: 'قراءة فصول الرواية كاملة',
      typeBook: 'النسخة الرقمية + تحميل PDF',
      grantNovelBtn: 'منح الصلاحية الآن',
      grantSuccess: 'تم تحديث صلاحيات المستخدم بنجاح!',
    },
    adminPlansCoupons: {
      pageTitle: 'خطط القراءة وكوبونات الخصم',
      pageSubtitle: 'إدارة باقات اشتراك نادي حَبْر وإنشاء كوبونات الخصم الترويجية.',
      plansTitle: 'باقات اشتراك المنصة الحالية',
      couponsTitle: 'كوبونات الخصم الترويجية',
      createCouponTitle: 'إنشاء كوبون خصم جديد',
      codeLabel: 'رمز الكوبون (Code):',
      typeLabel: 'نوع الخصم:',
      typePercent: 'نسبة مئوية (٪)',
      typeFixed: 'مبلغ ثابت (ج.م)',
      valueLabel: 'قيمة الخصم:',
      maxUsesLabel: 'أقصى عدد استخدامات:',
      createCouponBtn: 'إنشاء الكوبون',
      colCode: 'كود الخصم',
      colDiscount: 'الخصم',
      colUses: 'مرات الاستخدام',
      colStatus: 'الحالة',
      colActions: 'الإجراءات',
      active: 'نشط',
      inactive: 'معطل',
      editPlanTitle: 'تعديل باقة القراءة',
      addPlanTitle: 'إضافة خطة جديدة',
      addNewPlanBtn: 'إضافة خطة جديدة',
      mostChosen: 'الأكثر اختياراً',
      perMonth: '/ شهرياً',
      perYear: '/ سنوياً',
      unlimited: 'غير محدود',
      confirmDeleteCoupon: 'حذف كوبون {code}؟',
      confirmDeletePlan: 'حذف خطة {name}؟',
      featuresLabel: 'المميزات (مفصولة بفواصل)',
      featureCheckLabel: 'تمييز الخطة كـ "الأكثر اختياراً"',
      couponPlaceholder: 'مثال: SUMMER2024',
      planName: 'اسم الباقة',
      planDesc: 'الوصف الترويجي للباقة',
      priceMonthly: 'السعر الشهري (ج.م)',
      priceYearly: 'السعر السنوي (ج.م)',
      savePlan: 'حفظ باقة القراءة',
    },
    adminSettings: {
      pageTitle: 'إعدادات المنصة وبيانات الدفع',
      pageSubtitle: 'تعديل أرقام فودافون كاش، معرفات إنستاباي، وتعليمات الدفع الظاهرة للقراء في صفحة الدفع.',
      paymentConfigTitle: 'إعدادات الدفع والتحويل اليدوي',
      siteName: 'اسم المنصة الظاهر',
      tagline: 'الشعار النصي الفرعي',
      vodafoneCash: 'رقم محفظة فودافون كاش',
      instapayHandle: 'معرف إنستاباي (IPA Handle)',
      instructions: 'تعليمات التحويل الظاهرة في صفحة الدفع',
      contactEmail: 'بريد التواصل والدعم',
      saveBtn: 'حفظ الإعدادات وبيانات الدفع',
      saving: 'جاري الحفظ...',
      successNotice: 'تم حفظ الإعدادات وبيانات الدفع بنجاح!',
    },
    novelReviews: {
      sectionTitle: 'آراء وتقييمات القراء',
      sectionEyebrow: 'انطباعات حقيقية',
      genuineVisitorAverage: 'متوسط تقييم القراء الحقيقي',
      basedOnRatings: 'بناءً على {count} تقييم حقيقي',
      noRatingsYet: 'لا توجد تقييمات مسجلة بعد',
      starsDistribution: 'توزيع النجوم',
      editorialRatingBadge: 'تقييم هيئة التحرير',
      editorialReviewTitle: 'كلمة هيئة التحرير عن الرواية',
      writeReviewTitle: 'شاركنا رأيك وتقييمك الصادق',
      editReviewTitle: 'تعديل مراجعتك وتقييمك',
      starSelectLabel: 'اختر تقييمك (من 1 إلى 5 نجوم):',
      reviewTextPlaceholder: 'اكتب انطباعك الصادق عن الرواية، سواء بالإشادة أو النقد البنّاء...',
      submitReviewBtn: 'نشر التقييم والمراجعة',
      updateReviewBtn: 'تحديث التقييم',
      deleteReviewBtn: 'حذف مراجعتي',
      confirmDeleteReview: 'هل أنت متأكد من حذف تقييمك ومراجعتك لهذه الرواية؟',
      loginToReview: 'يرجى تسجيل الدخول لتتمكن من تقييم الرواية وكتابة مراجعتك.',
      accountRestrictedNotice: 'حسابك مقيد حالياً من نشر المراجعات والتقييمات.',
      ratingsDisabledNotice: 'التقييمات والمراجعات مغلقة حالياً لهذه الرواية.',
      filterAll: 'جميع التقييمات',
      filterStars: '{n} نجوم',
      loadMoreReviews: 'عرض المزيد من المراجعات',
      noReviewsYet: 'كن أول من يكتب مراجعة صادقة ويضع بصمته على هذه الرواية.',
      reportBtn: 'إبلاغ عن محتوى مخالف',
      reportModalTitle: 'إبلاغ عن مراجعة مخالفة للقواعد',
      reportReasonSpam: 'محتوى ترويجي مكرر أو إزعاج (Spam)',
      reportReasonHarassment: 'إساءة أو تنمر أو تحرش',
      reportReasonUnlawful: 'محتوى غير قانوني أو انتهاك صريح',
      reportReasonOther: 'سبب آخر يخالف شروط الاستخدام',
      reportDetailsPlaceholder: 'وضح باختصار سبب الإبلاغ...',
      submitReportBtn: 'إرسال البلاغ للإدارة',
      reportSuccessToast: 'تم إرسال البلاغ للإدارة للمراجعة، شكراً لحرصك.',
      reviewSubmittedSuccess: 'تم نشر تقييمك ومراجعتك بنجاح!',
      reviewDeletedSuccess: 'تم حذف مراجعتك وتحديث المتوسط بنجاح.',
      yourReviewBadge: 'مراجعتك',
    },
    visitorManagement: {
      pageTitle: 'إدارة الزوار والمجتمع',
      pageSubtitle: 'لوحة شاملة لمتابعة القراء والزوار، مراجعة المحتوى، وإدارة سياسات التقييم.',
      tabVisitors: 'الزوار والمستخدمون',
      tabModeration: 'إشراف المراجعات',
      tabReports: 'بلاغات المحتوى',
      tabSettingsAudit: 'الإعدادات وسجل التدقيق',
      totalVisitors: 'إجمالي الزوار المسجلين',
      activeVisitors: 'الحسابات النشطة',
      restrictedVisitors: 'الحسابات المقيدة',
      deactivatedVisitors: 'الحسابات المعطلة',
      statusActive: 'نشط',
      statusRestricted: 'مقيد',
      statusDeactivated: 'معطل',
      filterStatusAll: 'جميع الحالات',
      colJoinedAt: 'تاريخ الانضمام',
      colStatus: 'حالة الحساب',
      colActivity: 'النشاط والمشاركات',
      viewDetailsAndReviews: 'التفاصيل والمراجعات',
      editStatusTitle: 'تعديل حالة حساب القارئ',
      statusSelectLabel: 'الحالة الجديدة:',
      restrictionReasonLabel: 'سبب التقييد (يظهر للمستخدم):',
      saveStatusBtn: 'حفظ تغيير الحالة',
      deleteAccountBtn: 'حذف الحساب بأمان',
      confirmDeleteAccount: 'هل أنت متأكد تماماً من حذف هذا الحساب؟',
      deleteAccountWarning: 'سيؤدي الحذف إلى إزالة جميع مراجعات وتقييمات المستخدم، وإعادة احتساب متوسطات الروايات تلقائياً لضمان سلامة الإحصاءات.',
      userReviewsModalTitle: 'المراجعات المقدمة من المستخدم',
      noUserReviews: 'لم يقدم هذا المستخدم أي تقييمات أو مراجعات بعد.',
      ratingsCountLabel: 'مراجعة وتقييم',
      entitlementsCountLabel: 'روايات مقتناة',
      prevPage: 'السابق',
      nextPage: 'التالي',
      pageInfo: 'صفحة {page} من {totalPages}',
      modPageTitle: 'الإشراف على مراجعات القراء',
      modPageSubtitle: 'مراجعة آراء الزوار مع الالتزام التام بعدم حجب أي نقد بناء أو تقييم منخفض ما لم يخالف قواعد الآداب العامة.',
      filterByNovel: 'جميع الروايات',
      filterByRating: 'جميع النجوم',
      filterByStatus: 'حالة النشر',
      statusPublished: 'منشورة علناً',
      statusHidden: 'مخفية للإشراف',
      hideReviewBtn: 'إخفاء المراجعة',
      publishReviewBtn: 'نشر المراجعة',
      deleteReviewBtn: 'حذف نهائي',
      hideReviewModalTitle: 'إخفاء المراجعة وتسجيل السبب',
      moderationReasonLabel: 'سبب الإخفاء (مطلوب للتوثيق):',
      moderationPolicyNotice: 'تنبيه: يُمنع حجب المراجعات لمجرد احتوائها على نقد أو نجمة واحدة. الإشراف مخصص للمحتوى المسيء أو الإعلاني فقط.',
      confirmHideReview: 'تأكيد إخفاء المراجعة واستبعادها من المتوسط الحسابي',
      confirmDeleteModReview: 'هل أنت متأكد من الحذف النهائي لهذه المراجعة؟',
      reportsCount: 'بلاغات',
      reportsPageTitle: 'بلاغات المحتوى والمراجعات المخالفة',
      reportsPageSubtitle: 'استعراض البلاغات المرسلة من الزوار واتخاذ الإجراء المناسب بشأنها.',
      reporter: 'مقدم البلاغ',
      reportedUser: 'صاحب المراجعة',
      reasonLabel: 'سبب البلاغ',
      detailsLabel: 'التفاصيل',
      resolveBtn: 'قبول البلاغ وحله',
      dismissBtn: 'تجاهل البلاغ',
      statusPending: 'قيد المراجعة',
      statusResolved: 'تم التعامل معه',
      statusDismissed: 'تم التجاهل',
      noReportsFound: 'لا توجد بلاغات معلقة حالياً، المنصة هادئة ومنتظمة.',
      ratingSettingsTitle: 'إعدادات وسياسات التقييم والمراجعات',
      requireAuthLabel: 'إلزامية تسجيل الدخول للتقييم',
      requireAuthHelp: 'إذا تم التفعيل، يشترط وجود حساب موثق لكتابة مراجعة.',
      globalEnableLabel: 'تفعيل التقييمات والمراجعات عالمياً',
      globalEnableHelp: 'السماح للزوار بتقديم تقييمات جديدة على مستوى كامل الموقع.',
      maxReviewsPerDayLabel: 'الحد الأقصى للمراجعات يومياً لكل مستخدم',
      maxReviewsPerDayHelp: 'لحماية المنصة من الإغراق والتعليقات العشوائية (Spam).',
      saveSettingsBtn: 'حفظ إعدادات التقييم',
      auditLogTitle: 'سجل التدقيق الإداري (Audit Log)',
      colTimestamp: 'التاريخ والوقت',
      colAdmin: 'المسؤول',
      colAction: 'نوع الإجراء',
      colTarget: 'الهدف',
      colDetails: 'التفاصيل والسبب',
      settingsSavedSuccess: 'تم حفظ إعدادات التقييم بنجاح!',
      emptyAuditLogs: 'لا توجد إجراءات إدارية مسجلة بعد.',
    },
    ratingControls: {
      sectionTitle: 'التحكم بالتقييمات وطريقة العرض',
      sectionSubtitle: 'إدارة ظهور التقييمات للجمهور والتمييز بين تقييم القراء وتقييم التحرير.',
      displayModeLabel: 'طريقة عرض التقييم للجمهور:',
      modeVisitor: 'نمط تقييم القراء (Visitor Mode)',
      modeVisitorDesc: 'يعرض المتوسط الحسابي الصادق لاختيارات الزوار الحقيقيين.',
      modeEditorial: 'نمط تقييم التحرير (Editorial Mode)',
      modeEditorialDesc: 'يعرض تقييماً خاصاً بهيئة التحرير مع تمييزه بوضوح كتقييم تحريري.',
      modeCustom: 'نمط العرض المخصص (Custom Display Mode)',
      modeCustomDesc: 'يعرض رقماً تحدده أنت فقط، دون دمجه مع تقييمات القراء.',
      modeCombined: 'تقييم مدمج',
      modeBlended: 'تقييم مبدئي + تقييمات القراء',
      modeBlendedDesc: 'يمزج تقييمك المبدئي مع أصوات الزوار الحقيقية بوزن قابل للتحكم.',
      blendedWeightLabel: 'وزن التقييم المبدئي (يعادل عدد أصوات)',
      blendedPreviewLabel: 'التقييم المدمج التقريبي:',
      genuineVisitorAvgLabel: 'متوسط تقييم القراء الحقيقي:',
      genuineVotesCount: 'إجمالي أصوات الزوار الحقيقية: {count}',
      editorialRatingInput: 'تقييم هيئة التحرير (من 1.0 إلى 5.0):',
      editorialReviewInput: 'مراجعة أو كلمة هيئة التحرير (اختياري):',
      customRatingInput: 'التقييم المعروض المخصص (من 1.0 إلى 5.0):',
      ratingsEnabledCheckbox: 'السماح للزوار بتقديم تقييمات ومراجعات لهذه الرواية',
      ratingsEnabledHelp: 'يمكنك إيقاف تلقي تقييمات جديدة مؤقتاً لهذه الرواية بشكل مستقل.',
      editorialNotice: 'التقييمات المبدئية لا تُضاف إلى عدد أصوات الزوار الحقيقية. في وضع الدمج يظهر متوسط منفصل يجمعهما بوزن واضح، ويمكنك إيقافه لاحقاً.',
    },
    adminRatingManagement: {
      pageTitle: 'إدارة تقييمات الروايات',
      pageSubtitle: 'التحكم في إحصاءات التقييم التحريرية المستقلة، نمط العرض، وتوزيع النجوم لكل رواية.',
      selectNovelPrompt: 'اختر رواية للبدء في إدارة تقييماتها...',
      searchNovelPlaceholder: 'ابحث عن رواية بالعنوان أو اسم الكاتب...',
      allNovels: 'جميع الروايات',
      selectedNovel: 'الرواية المختارة',
      noNovelsFound: 'لا توجد روايات مطابقة للبحث الحالي.',
      readerStatsTitle: 'إحصاءات القراء الحقيقية',
      readerStatsDesc: 'بيانات موثوقة ومحسوبة مباشرة من تقييمات ومراجعات القراء الحقيقيين على المنصة.',
      readerAverage: 'متوسط تقييم القراء',
      readerVotesCount: 'عدد أصوات القراء',
      readerPoints: 'إجمالي نقاط القراء',
      noReaderRatings: 'لا توجد تقييمات من القراء حتى الآن.',
      recalculateReaderStatsBtn: 'إعادة حساب وتدقيق تقييمات القراء',
      recalculating: 'جارٍ إعادة الحساب...',
      recalculateSuccess: 'تمت إعادة حساب وتدقيق إحصاءات القراء بنجاح من المراجعات الحقيقية!',
      adminStatsTitle: 'إحصاءات التقييم التحريرية (المُدارة)',
      adminStatsDesc: 'أرقام إحصائية مستقلة يحددها المسؤول لكل مستوى نجوم بشكل منفصل، ولا تنشئ حسابات وهمية.',
      enableAdminContribution: 'تفعيل مساهمة الإحصاءات التحريرية في التقييم النهائي',
      enableAdminContributionHelp: 'عند تفعيلها مع النمط المدمج، يتم احتساب هذه الأصوات والنقاط في المتوسط الموزون.',
      star5Label: 'تقييمات 5 نجوم (ممتاز)',
      star4Label: 'تقييمات 4 نجوم (جيد جداً)',
      star3Label: 'تقييمات 3 نجوم (متوسط)',
      star2Label: 'تقييمات نجمتان (أقل من المتوقع)',
      star1Label: 'تقييمات نجمة واحدة (ضعيف)',
      adminCountAuto: 'إجمالي الأصوات التحريرية (محسوب تلقائياً)',
      adminAverageAuto: 'المتوسط التحريري (محسوب تلقائياً)',
      adminPointsAuto: 'إجمالي النقاط التحريرية',
      modeSectionTitle: 'نمط عرض التقييم للجمهور',
      modeVisitor: 'نمط القراء فقط (Visitor Mode)',
      modeVisitorDetail: 'يعرض فقط تقييمات القراء الحقيقيين ومتوسطهم الحسابي الفعلي، ولا تُحتسب أي أرقام تحريرية.',
      modeCombined: 'النمط المدمج (Combined Mode)',
      modeCombinedDetail: 'يدمج الإحصاءات التحريرية مع أصوات القراء بالمعادلة الموزونة: (نقاط التحرير + نقاط القراء) ÷ (عدد التحرير + عدد القراء).',
      modeEditorial: 'نمط التحرير (Editorial Mode)',
      modeEditorialDetail: 'يعرض تقييماً وكلمة رسمية من هيئة تحرير حَبْر بوسم خاص كتقييم تحريري مستقل.',
      modeCustom: 'نمط العرض المخصص (Custom Mode)',
      modeCustomDetail: 'يعرض درجة رقمية معتمدة تحددها للمنصة بشكل منفرد.',
      editorialRatingInput: 'تقييم هيئة التحرير (من 1.0 إلى 5.0):',
      editorialReviewInput: 'مراجعة أو كلمة هيئة التحرير (اختياري):',
      customRatingInput: 'التقييم المعروض المخصص (من 1.0 إلى 5.0):',
      ratingsEnabledCheckbox: 'السماح للزوار بتقديم تقييمات ومراجعات لهذه الرواية',
      ratingsEnabledHelp: 'يمكنك إيقاف تلقي تقييمات جديدة مؤقتاً لهذه الرواية دون التأثير على التقييمات السابقة.',
      previewTitle: 'معاينة حية للتقييم النهائي قبل الحفظ',
      previewCardHeader: 'المظهر في بطاقات الروايات والفهرس العام',
      previewDetailHeader: 'المظهر في صفحة تفاصيل الرواية للجمهور',
      combinedFormulaExplanation: 'تفاصيل المعادلة الموزونة الحسابية:',
      saveChangesBtn: 'حفظ إعدادات التقييم',
      saving: 'جارٍ الحفظ...',
      savedSuccess: 'تم حفظ وتحديث إعدادات التقييم بنجاح وتحديث الفهرس العام!',
      resetAdminStatsBtn: 'تصفير الإحصاءات التحريرية',
      resetConfirmTitle: 'تأكيد تصفير الإحصاءات التحريرية',
      resetConfirmDesc: 'سيؤدي هذا الإجراء إلى إعادة تعيين عدد النجوم التحريرية إلى 0 وإيقاف المساهمة التحريرية للرواية المختارة. نؤكد لك أن هذا الإجراء لن يمس أو يحذف أي تقييم أو مراجعة من مراجعات القراء الحقيقيين نهائياً.',
      confirmResetAction: 'نعم، صفّر الإحصاءات التحريرية فقط',
      cancel: 'إلغاء',
      quickNovelRatingsBtn: 'إدارة التقييمات',
    },
    footer: {
      brandQuote: 'منصة عربية للقصص التي تترك أثراً في الروح.',
      exploreTitle: 'استكشف',
      helpTitle: 'المساعدة',
      followTitle: 'تابع الحكاية',
      allRightsReserved: 'حَبْر. جميع الحقوق محفوظة.',
    },
  },
  en: {
    common: {
      brandName: 'HEBR',
      brandTagline: 'Story Platform',
      home: 'Home',
      browse: 'Browse Novels',
      store: 'Digital Books',
      plans: 'Reading Plans',
      library: 'My Library',
      admin: 'Admin Dashboard',
      cart: 'Cart',
      checkout: 'Checkout',
      account: 'My Account',
      login: 'Sign In',
      logout: 'Sign Out',
      search: 'Search a novel or author',
      searchPlaceholder: 'Search by title or author...',
      explore: 'Explore Novels',
      viewAll: 'View All',
      read: 'Read',
      startReading: 'Start Reading',
      continueReading: 'Continue Reading',
      currency: 'EGP',
      chapter: 'Chapter',
      chapters: 'Chapters',
      chaptersCount: 'chapters',
      author: 'Author',
      status: 'Status',
      genre: 'Genre',
      free: 'Free Access',
      locked: 'Locked',
      rating: 'Rating',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      empty: 'Empty',
      all: 'All',
      ongoing: 'Ongoing',
      completed: 'Completed',
      published: 'Published',
      draft: 'Draft',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      switchLanguage: 'العربية',
      drawerNote: 'A serene sanctuary for reading,\nand stories that deserve to be told.',
      unlockedForReading: 'Available to read now',
      requiresPurchaseOrSub: 'Requires novel purchase or subscription',
      addToCart: 'Add to Cart',
      addedToCart: 'Added to Cart',
      subtotal: 'Subtotal',
      discount: 'Discount',
      total: 'Grand Total',
      percentOff: '%',
      fixedOff: 'EGP',
      egp: 'EGP',
      siteBusy: 'The site is currently busy. Please try again shortly.',
      verifyEmailNotice: 'Please verify your email address to enable posting comments and completing orders.',
      verifyEmailResendBtn: 'Resend Verification Email',
      verifyEmailSentSuccess: 'Verification email has been sent to your inbox',
      verifiedCheckBtn: 'I have verified my email',
      verifiedCheckChecking: 'Checking...',
      verifiedCheckStillNot: 'Not verified yet. Open the link sent to your inbox, then try again.',
      verifiedCheckSuccess: 'Your email has been verified.',
      emailNotVerifiedComment: 'You must verify your email address before posting comments.',
      emailNotVerifiedOrder: 'You must verify your email address before completing your order.',
      loadMoreComments: 'Load more comments',
      showComments: 'Show comments',
      loadMoreUsers: 'Load more users',
    },
    genres: {
      'الكل': 'All',
      'رومانسية': 'Romance',
      'دراما': 'Drama',
      'فانتازيا': 'Fantasy',
      'أكشن': 'Action',
      'غموض': 'Mystery',
      'اجتماعية': 'Social Drama',
      'تشويق': 'Thriller',
      'تاريخي': 'Historical',
      'All': 'All',
      'Romance': 'Romance',
      'Drama': 'Drama',
      'Fantasy': 'Fantasy',
      'Action': 'Action',
      'Mystery': 'Mystery',
      'Social': 'Social Drama',
      'Thriller': 'Thriller',
      'Historical': 'Historical',
    },
    statusLabels: {
      'الكل': 'All Statuses',
      'مستمرة': 'Ongoing',
      'مكتملة': 'Completed',
      'All': 'All Statuses',
      'Ongoing': 'Ongoing',
      'Completed': 'Completed',
    },
    home: {
      heroEyebrow: 'Arabic Novel Platform',
      heroTitlePart1: 'Every story',
      heroTitlePart2: 'leaves a trace.',
      heroDesc: 'A serene sanctuary for stories that deserve to be savored slowly and cherished in memory.',
      heroStoreButton: 'Browse Digital Store',
      statNovels: 'Arabic Novels',
      statNovelsCount: '240+',
      statAuthors: 'Authors',
      statAuthorsCount: '36',
      statReaders: 'Active Readers',
      statReadersCount: '12k',
      heroArtCaption: 'Carefully curated stories',
      heroScrollNote: 'Scroll to discover more',
      curatedEyebrow: 'Hebr Selections',
      curatedTitle: 'Stories We Recommend',
      loadingCurated: 'Fetching curated selections...',
      emptyCuratedTitle: 'No published novels yet, check back soon.',
      emptyCuratedDesc: 'We are curating a distinguished collection of Arabic literary gems.',
      newShelfEyebrow: 'From the New Shelf',
      newShelfTitle: 'Recently Added',
      loadingNewShelf: 'Preparing the latest arrivals...',
      allInFeaturedNote: 'All current novels are showcased in the curated section above.',
      quoteText: 'Books do not change the world,',
      quoteEm: 'they change the people who do.',
      quoteAuthor: '— Paul Auster',
      plansEyebrow: 'Hebr Club',
      plansTitlePart1: 'Do not let the story',
      plansTitlePart2: 'stop here.',
      plansDesc: 'Choose a reading plan that fits your pace, and explore unlimited worlds every month.',
      plansButton: 'Explore Plans',
      circleRead: 'Read',
      circleDiscover: 'Discover',
      circleShare: 'Share',
    },
    browse: {
      pageTitle: 'The Story Library',
      pageMetaDesc: 'Browse exclusive Arabic novels across varied genres and celebrated authors.',
      eyebrow: 'Story Catalog',
      title: 'The Story Library',
      intro: 'Find your next captivating voice among carefully curated literary works.',
      asideTagline: 'Read what resonates',
      allStatuses: 'All Statuses',
      novelsCountSingle: 'novel',
      novelsCountPlural: 'novels',
      loadingMessage: 'Retrieving novels from the archives...',
      emptyTitle: 'No novels matched your search',
      emptyDesc: 'Try adjusting your search terms or clearing selected genre and status filters.',
      resetFilters: 'Reset Search & Filters',
    },
    novelDetail: {
      pageMetaDesc: 'Novel overview, details and chapters.',
      backToNovels: 'Back to Novels',
      byAuthor: 'by',
      freeChaptersStat: 'Free Chapters',
      ratingStat: 'Rating',
      addedNovelToast: 'Novel successfully added to cart!',
      addedBookToast: 'Digital edition (PDF/EPUB) added to cart!',
      acquireNovelBtn: 'Acquire Novel',
      acquireBookBtn: 'Acquire Digital Edition (PDF/EPUB)',
      ownedBookBadge: 'Full Digital Edition Owned',
      ownedNovelBadge: 'Novel Acquired',
      chaptersEyebrow: 'Novel Chapters',
      chaptersTitle: 'Read at Your Own Leisure',
      noChaptersYet: 'No chapters published for this novel yet.',
      availableNow: 'Available to read now',
      chapterNumberPrefix: 'Chapter',
      aboutAuthorEyebrow: 'About the Author',
      aboutAuthorBio: 'An evocative Arabic voice weaving the nuances of human memory with contemplative prose.',
      exploreMoreInHebr: 'Explore More on Hebr',
      notFoundTitle: 'Novel Not Found',
      notFoundDesc: 'This title may have been removed or unpublished.',
      downloadBookBtn: 'Download Digital Edition (PDF)',
      downloadBookMissing: 'Download link is currently unavailable. Please contact administration.',
      bookEpubBtn: 'Download EPUB',
      bookPdfBtn: 'Download PDF',
      bookPreparing: 'Preparing your book... {done} / {total} chapters',
      bookPreparingShort: 'Preparing your book...',
      bookPrepareFailed: 'Could not prepare the book right now. Please try again shortly.',
      bookPopupBlocked: 'Please allow pop-ups for this site, then press the PDF button again.',
      bookPartial: 'The book was prepared but {n} chapter(s) could not be loaded. Try again or contact support.',
      bookNoChapters: 'This novel has no published chapters yet.',
    },
    reader: {
      loadingMessage: 'Preparing chapter text and typography...',
      notFoundTitle: 'Requested Chapter Not Found',
      backToNovel: 'Back to Novel Overview',
      chapterOf: 'of',
      bookmarkTooltip: 'Save reading position',
      settingsTooltip: 'Customize font and appearance',
      fontSize: 'Font Size',
      theme: 'Theme',
      themeLight: 'Light',
      themeWarm: 'Warm',
      themeDark: 'Dark',
      contentWidth: 'Column Width',
      widthNarrow: 'Comfort',
      widthMedium: 'Balanced',
      widthWide: 'Wide',
      chapterEnded: 'End of Chapter',
      prevChapter: 'Previous Chapter',
      nextChapter: 'Next Chapter',
      endOfAvailableChapters: 'End of Available Chapters',
      lockedTitle: 'This Chapter is Locked',
      lockedDesc: 'To continue reading this narrative, acquire the novel or subscribe to the Hebr Reading Club for complete access.',
      optionOneEyebrow: 'Option 1',
      optionOneTitle: 'Acquire This Novel',
      optionOneDesc: 'Unlock all current and future chapters of this novel for life.',
      optionTwoEyebrow: 'Option 2',
      optionTwoTitle: 'Full Digital Edition',
      optionTwoDesc: 'Read online and download a pristine PDF & EPUB copy.',
      optionThreeEyebrow: 'Best Value',
      optionThreeTitle: 'Hebr Club Subscription',
      optionThreeDesc: 'Unlimited access to all novels, audio stories and chapters platform-wide.',
      optionThreePricePrefix: 'From',
      authorNoteTitle: "Author's Note",
      authorNoteBody: 'Reading is not merely consuming words; it is constructing a shared emotional landscape together with the author.',
      commentsTitle: 'Reader Impressions on this Chapter',
      commentPlaceholder: 'Share your perspective or thoughts on this scene...',
      sendComment: 'Post Impression',
      sendingComment: 'Posting...',
      loginToCommentPrompt: 'to leave your impressions and join the chapter dialogue.',
      loginLink: 'Sign in',
      noCommentsYet: 'Be the first to leave an impression on this chapter.',
      showPublic: 'Make visible',
      hidePublic: 'Hide',
      deleteComment: 'Delete comment',
      commentCooldown: 'Please wait 20 seconds between comments',
      commentTooLong: 'Comment must not exceed 500 characters',
      charCounter: 'chars',
    },
    store: {
      pageTitle: 'Digital Books',
      pageMetaDesc: 'High-quality digital books in PDF and EPUB formats ready for all your screens and e-readers.',
      eyebrow: 'Hebr Digital Store',
      title: 'Take the Story With You',
      subtitle: 'Digital editions formatted for tablets, ereaders, and offline reading anytime.',
      badgeStamp: 'PDF · EPUB',
      loadingMessage: 'Retrieving digital editions...',
      editionLabel: 'Complete Digital Edition',
      featuresDesc: 'Instant download in PDF & EPUB formats plus online reader access.',
      addedToast: 'Added ✓',
      addToCartBtn: 'Add to Cart',
      emptyTitle: 'No digital editions available yet',
      emptyDesc: 'New digital books can be configured from the admin panel.',
      browseNovelsBtn: 'Browse Novels',
    },
    plans: {
      pageTitle: 'Reading Plans',
      pageMetaDesc: 'Subscribe to Hebr Club plans for boundless reading access to all novels.',
      eyebrow: 'Hebr Club',
      title: 'Select Your Reading Shelf',
      subtitle: 'Simple plans, endless stories. Set your own reading rhythm.',
      monthly: 'Monthly',
      yearly: 'Yearly',
      saveTwoMonths: 'Save 2 months',
      loadingMessage: 'Loading subscription tiers...',
      mostChosenBadge: 'Most Popular',
      planPrefix: 'Tier',
      perMonth: 'EGP / month',
      perYear: 'EGP / year',
      includesAccessTo: 'Includes access to',
      selectPlanBtn: 'Select Plan',
      paymentNote: 'Easily pay via Vodafone Cash or InstaPay with swift account activation upon receipt review.',
    },
    library: {
      pageTitle: 'My Library',
      pageMetaDesc: 'Your personal shelf to continue reading, manage bookmarks, and access acquired titles.',
      eyebrow: 'Personal Reading Shelf',
      welcomePrefix: 'Welcome,',
      subtitle: 'Return to the stories that resonated with you and resume exactly where you paused.',
      subscribedBadge: 'Member of',
      activateSubBtn: 'Activate Membership',
      tabContinue: 'Continue Reading',
      tabPurchased: 'My Digital Books',
      tabBookmarks: 'Bookmarks',
      tabOrders: 'Order History',
      currentlyReading: 'Currently Reading',
      chapterOf: 'of',
      completedPercent: '% completed',
      continueReadingBtn: 'Resume Reading',
      noReadingStarted: 'You have not started reading any novels yet.',
      exploreNovelsNow: 'Explore Novels Now',
      recommendedTitle: 'Recommended by Hebr Curators',
      purchasedEmptyTitle: 'No acquired novels or digital books yet',
      purchasedEmptyDesc: 'Acquiring titles grants lifelong access to all chapters and downloadable files.',
      visitStoreBtn: 'Visit Digital Store',
      purchasedBookLabel: 'Digital Book Edition',
      purchasedNovelLabel: 'Acquired Novel',
      readChaptersBtn: 'Read Chapters',
      downloadPdfBtn: 'Download PDF',
      downloadPreparingAlert: 'Preparing your digital download file...',
      bookmarksEmptyTitle: 'Your bookmarks list is empty',
      bookmarksEmptyDesc: 'Click the bookmark icon on any novel to pin it to your shelf.',
      ordersEmptyTitle: 'No previous orders found',
      ordersEmptyDesc: 'Orders placed via Vodafone Cash or InstaPay will track their verification status here.',
      orderNumberPrefix: 'Order #',
      statusPending: 'Under Review',
      statusApproved: 'Approved & Active',
      statusRejected: 'Declined',
      paymentMethodLabel: 'Payment Method',
      couponLabel: 'Coupon',
      orderTotalLabel: 'Total',
      adminNotePrefix: 'Admin Note',
      viewReceiptBtn: 'View Receipt',
      loadingMessage: 'Arranging your library shelves...',
    },
    cart: {
      pageTitle: 'Reading Cart',
      pageMetaDesc: 'Review your selected novels, digital books, and memberships before checkout.',
      eyebrow: 'Your Next Step',
      title: 'Reading Cart',
      subtitle: 'Review your selection before submitting your order and payment receipt.',
      emptyTitle: 'Your cart is empty',
      emptyDesc: 'Add a novel, digital edition, or reading club plan from the Hebr catalog.',
      exploreNovelsBtn: 'Explore Novels',
      itemNovelLabel: 'Complete Novel',
      itemBookLabel: 'Digital Edition + PDF',
      itemPlanLabel: 'Club Membership',
      removeItemTooltip: 'Remove from cart',
      summaryEyebrow: 'Order Summary',
      couponPlaceholder: 'Discount code (e.g. HEBR20)',
      checkCouponBtn: 'Apply',
      checkingCoupon: 'Checking...',
      appliedCouponPrefix: 'Coupon applied:',
      removeCouponBtn: 'Remove',
      couponAppliedSuccess: 'Discount applied successfully',
      couponInvalidError: 'Invalid or expired coupon code',
      subtotalLabel: 'Subtotal',
      couponDiscountLabel: 'Discount',
      totalLabel: 'Grand Total',
      proceedCheckoutBtn: 'Proceed to Checkout',
      paymentMethodsHint: 'Direct payments supported via Vodafone Cash & InstaPay.',
    },
    checkout: {
      pageTitle: 'Confirm Payment & Order',
      metaDesc: 'Finalize payment and provide transfer details to complete your acquisition.',
      backToCart: 'Back to Cart',
      eyebrow: 'Order Finalization',
      title: 'Confirm Payment & Order',
      subtitle: 'Choose your preferred payment method and enter the transfer details to finalize.',
      step1Title: '1. Select Payment Method',
      step2Title: '2. Transfer Details & Amount',
      step3Title: '3. Transfer Details & Reference Code',
      vodafoneCashTitle: 'Vodafone Cash Wallet',
      instapayTitle: 'InstaPay Application',
      sendAmountPrompt: 'Exact amount to transfer:',
      recipientNumber: 'Recipient Wallet Number:',
      instapayHandle: 'Instant Payment Address (IPA):',
      attachReceiptLabel: 'Click to select receipt screenshot or drag & drop here',
      attachReceiptHint: 'Supported formats: JPG, PNG, WEBP (Max 5MB)',
      receiptPreviewLabel: 'Receipt selected successfully',
      changeFile: 'Change image',
      missingReceiptError: 'Please provide valid transfer details to complete the order.',
      submissionError: 'Unable to submit order right now. Please verify your connection and try again.',
      permissionError: 'The order could not be sent because your account is not authorized right now. Make sure your email is verified, then sign out, sign in again and retry. If it keeps happening, contact us.',
      confirmSubmitBtn: 'Submit Order for Review',
      processingBtn: 'Submitting order details...',
      orderSuccessTitle: 'Order Placed Successfully!',
      orderNumberLabel: 'Order ID:',
      orderSuccessDesc: 'Thank you! We have received your transfer details. It will be verified shortly to activate your access. You can track this in My Library.',
      statusUnderReview: 'Under Review',
      goToLibraryBtn: 'Go to My Library',
      continueBrowsingBtn: 'Continue Browsing',
      orderSummaryEyebrow: 'Items in Order',
      itemsCountLabel: 'items',
      senderPhoneLabel: 'Sender Phone Number (Vodafone Cash / InstaPay)',
      senderPhonePlaceholder: '01xxxxxxxxx',
      senderPhoneHint: 'Valid Egyptian mobile number (11 digits starting with 01)',
      transactionRefLabel: 'Transaction Reference / Transfer Code',
      transactionRefPlaceholder: 'e.g. TXN-123456 or in-app reference',
      transactionRefHint: '6 to 30 characters (letters, numbers, or hyphen)',
      noteLabel: 'Additional Notes (Optional)',
      notePlaceholder: 'Any notes regarding the transfer...',
      maxPendingOrdersError: 'You have 3 pending orders under review. Please wait for them to be processed first.',
      invalidSenderPhone: 'Invalid phone number. Must start with 01 and contain 11 digits.',
      invalidTransactionRef: 'Invalid reference code. Must be 6 to 30 characters (letters, numbers, hyphen).',
    },
    login: {
      pageTitle: 'Sign In & Join',
      pageMetaDesc: 'Sign in or create an account on Hebr to resume your reading journey.',
      badge: 'Readers Portal',
      tabSignIn: 'Sign In',
      tabSignUp: 'Create Account',
      titleSignIn: 'Welcome Back to Hebr',
      titleSignUp: 'Join the Story Companions',
      descSignIn: 'Sign in to access your library, bookmarks, and acquired works.',
      descSignUp: 'Create an account to save your reading progress across chapters.',
      nameLabel: 'Full Name',
      namePlaceholder: 'e.g. Layla Ahmed',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      submittingBtn: 'Processing...',
      signInBtn: 'Sign In',
      signUpBtn: 'Create Account',
      orDivider: 'or continue with',
      googleBtn: 'Continue with Google',
      errNameRequired: 'Please enter your full name.',
      errInvalidCreds: 'Incorrect email or password.',
      errEmailInUse: 'This email is already registered. Please sign in.',
      errWeakPassword: 'Password must be at least 6 characters.',
      errPopupClosed: 'Sign-in window closed.',
      errGeneric: 'An error occurred during authentication. Please retry.',
      errUnauthorizedDomain: 'Domain not authorized in Firebase settings.',
      errOperationNotAllowed: 'Google sign-in is currently disabled.',
      errPopupBlocked: 'Popup was blocked by your browser. Please allow popups.',
      errInvalidApiKey: 'Invalid Firebase API credentials.',
    },
    notFound: {
      pageTitle: 'Page Not Found',
      pageMetaDesc: 'The page you are looking for does not exist on Hebr.',
      errorCode: '404',
      heading: 'Page Not Found',
      desc: 'The page you are attempting to reach may have been moved or is no longer available.',
      backHomeBtn: 'Back to Home',
    },
    admin: {
      sidebarHeader: 'Control Panel',
      portalTitle: 'Hebr Administration Portal',
      viewAsReader: 'View Site as Reader',
      liveSystemLabel: 'Live System · Firestore',
      navOverview: 'Overview',
      navNovels: 'Novels',
      navChapters: 'Chapters & Content',
      navBooks: 'Digital Books',
      navOrders: 'Acquisition Orders',
      navUsers: 'Users & Access',
      navPlansCoupons: 'Plans & Coupons',
      navRatings: 'Novel Rating Management',
      navSettings: 'Platform Settings',
      statsTotalNovels: 'Active Novels',
      statsTotalNovelsNote: 'Published on platform',
      statsPendingOrders: 'Pending Orders',
      statsPendingOrdersNeedsReview: 'Requires receipt verification',
      statsPendingOrdersCleared: 'All orders processed',
      statsTotalSales: 'Confirmed Sales',
      statsTotalSalesNote: 'successful orders',
      statsTotalChapters: 'Total Chapters',
      statsTotalChaptersNote: 'registered chapters',
      recentPendingOrdersEyebrow: 'Financial Transactions',
      recentPendingOrdersTitle: 'Recent Orders Awaiting Review',
      viewAllOrdersBtn: 'View All Orders',
      noPendingOrders: 'No pending orders awaiting review at this time.',
      receiptLink: 'Receipt',
      approveBtn: 'Approve',
      rejectBtn: 'Reject',
      quickActionsEyebrow: 'Quick Actions',
      quickActionsTitle: 'Management Actions',
      addNewNovelLink: 'Add New Novel',
      editChaptersLink: 'Edit & Add Chapter Content',
      createCouponLink: 'Create New Discount Coupon',
      updatePaymentNumbersLink: 'Update Payment Details',
      registeredNovelsEyebrow: 'Catalog Content',
      registeredNovelsTitle: 'Registered Novels in Database',
      manageNovelsBtn: 'Manage Novels',
      colNovel: 'Novel',
      colAuthor: 'Author',
      colGenre: 'Genre',
      colStatus: 'Status',
      colChapters: 'Chapters',
      colNovelPrice: 'Novel Price',
      colBookPrice: 'Digital Book Price',
      colPublishing: 'Publishing',
      orderApprovedToast: 'Order approved and access granted for',
      orderRejectedToast: 'Order rejected',
      rebuildCatalogBtn: 'Rebuild Catalog & Summaries',
      rebuildingCatalogBtn: 'Rebuilding Catalog...',
      rebuildCatalogSuccess: 'Catalog and chapter summaries rebuilt successfully!',
      rebuildCatalogError: 'An error occurred while rebuilding the catalog',
    },
    adminNovels: {
      pageTitle: 'Manage Novels',
      pageSubtitle: 'Add, edit, delete novels and configure pricing and free preview chapters.',
      addNewBtn: 'Add New Novel',
      editNovelTitle: 'Edit Novel',
      newNovelTitle: 'Add New Novel',
      titleAr: 'Novel Title (Arabic)',
      titleEn: 'Novel Title (English - Optional)',
      authorAr: 'Author Name (Arabic)',
      authorEn: 'Author Name (English - Optional)',
      genre: 'Genre',
      status: 'Status',
      freeChapters: 'Free Preview Chapters Count',
      descAr: 'Novel Description (Arabic)',
      descEn: 'Novel Description (English - Optional)',
      novelPrice: 'Novel Online Price (EGP)',
      bookPrice: 'Digital Book Edition Price (EGP)',
      bookPricePlaceholder: 'Leave empty if no digital edition',
      colorPrimary: 'Primary Cover Color',
      colorAccent: 'Cover Accent Color',
      coverUrl: 'Cover Image URL (Optional)',
      save: 'Save Novel',
      saving: 'Saving...',
      cancel: 'Cancel',
      deleteConfirm: 'Are you sure you want to delete this novel and all its chapters?',
      published: 'Published',
      draft: 'Draft',
      colCoverTitle: 'Cover & Title',
      colAuthor: 'Author',
      colGenre: 'Genre',
      colNovelPrice: 'Novel Price',
      colBookPrice: 'Digital Book Price',
      colFreeChapters: 'Free Chapters',
      colStatus: 'Status',
      colPublishing: 'Publishing',
      colActions: 'Actions',
      firstNChaptersFree: 'First {n} chapters free',
      chaptersSuffix: 'chapters',
    },
    adminChapters: {
      pageTitle: 'Manage Chapters & Content',
      pageSubtitle: 'Add chapters, write content, and perform bulk text imports.',
      selectNovel: 'Select Novel to Manage Chapters:',
      addNewBtn: 'Add New Chapter',
      bulkImportBtn: 'Bulk Import Chapters',
      editModalTitle: 'Edit Chapter Content',
      newModalTitle: 'New Chapter',
      bulkModalTitle: 'Bulk Import Chapters from Text',
      bulkModalHelp: 'Paste novel text here. The system will automatically split chapters at lines starting with "Chapter" or "الفصل".',
      bulkStartBtn: 'Start Import & Splitting',
      colNumber: 'Chapter #',
      colTitle: 'Chapter Title',
      colAccess: 'Access Type',
      colPublished: 'Publish Status',
      colActions: 'Actions',
      freeBadge: 'Free for All',
      lockedBadge: 'Paid / Locked',
      chapterNumber: 'Chapter Number',
      chapterTitleAr: 'Chapter Title (Arabic)',
      chapterTitleEn: 'Chapter Title (English - Optional)',
      isFreeLabel: 'Available for free preview without subscription',
      publishLabel: 'Publish chapter immediately and make available to readers',
      bodyLabel: 'Literary Chapter Text (supports paragraphs and breaks)',
      noChapters: 'No chapters added to this novel yet.',
      deleteConfirm: 'Are you sure you want to delete this chapter?',
    },
    adminBooks: {
      pageTitle: 'Digital Books & Download Editions',
      pageSubtitle: 'Set full digital book pricing and attach secured PDF/EPUB download links for each novel.',
      hasBookBadge: 'Available as Digital Book',
      noBookBadge: 'No Digital Book Edition',
      priceLabel: 'Full Digital Edition Price (EGP):',
      fileUrlLabel: 'Download File URL (Google Drive / Storage):',
      fileAvailable: 'Available & Configured ✓',
      fileMissing: 'No file uploaded yet',
      saveBtn: 'Save Book Settings',
      editBtn: 'Edit Digital Book',
      successNotice: 'Digital book settings updated successfully!',
      downloadUrlLabel: 'Direct Digital Edition Download URL (HTTPS):',
      downloadUrlPlaceholder: 'https://example.com/books/novel.pdf',
      downloadUrlHint: 'Secure download link starting with https://, accessible only to verified buyers.',
    },
    adminOrders: {
      pageTitle: 'Acquisition Orders & Subscriptions',
      pageSubtitle: 'Review Vodafone Cash & InstaPay receipts, approve orders, and grant reading access.',
      filterAll: 'All Orders',
      filterPending: 'Pending Review',
      filterApproved: 'Approved & Active',
      filterRejected: 'Rejected',
      colOrderNum: 'Order #',
      colUser: 'User',
      colItems: 'Items Ordered',
      colTotal: 'Total',
      colMethod: 'Payment Method',
      colReceipt: 'Receipt',
      colStatus: 'Status',
      colActions: 'Actions',
      viewReceipt: 'View Receipt',
      noReceipt: 'No Receipt',
      approveBtn: 'Approve & Activate',
      rejectBtn: 'Reject Order',
      reviewModalTitle: 'Review Acquisition Order',
      adminNoteLabel: 'Admin Note for User (Optional):',
      confirmApprove: 'Confirm Approval & Grant Access',
      confirmReject: 'Confirm Rejection',
      receiptModalTitle: 'Receipt Screenshot Preview',
      noOrdersFound: 'No orders found matching this filter at this time.',
      colSenderPhone: 'Sender Phone',
      colTransactionRef: 'Transaction Ref',
      colNote: 'Transfer Note',
      duplicateRefWarning: '⚠️ Warning: Transaction reference duplicated in other orders!',
      copiedToast: 'Copied to clipboard!',
      copyBtn: 'Copy',
    },
    adminUsers: {
      pageTitle: 'Users & Access Permissions',
      pageSubtitle: 'Browse registered readers, grant manual subscriptions, and unlock novels.',
      searchPlaceholder: 'Search by email or name...',
      colUser: 'User',
      colEmail: 'Email',
      colSub: 'Subscription',
      colActions: 'Actions',
      activeUntil: 'Active until',
      noSub: 'No active subscription',
      manageAccess: 'Grant Subscription or Novel',
      modalTitle: 'Manage Reader Permissions',
      grantSubSection: 'Grant Time-Based Platform Subscription',
      durationMonths: 'Subscription Duration (Months):',
      grantSubBtn: 'Activate Subscription for User',
      grantNovelSection: 'Grant Specific Novel or Digital Book Access',
      selectNovel: 'Select Novel:',
      entType: 'Access Type:',
      typeNovel: 'Full Novel Chapters Reading Access',
      typeBook: 'Digital Book Edition + PDF Download',
      grantNovelBtn: 'Grant Access Now',
      grantSuccess: 'User permissions updated successfully!',
    },
    adminPlansCoupons: {
      pageTitle: 'Reading Plans & Discount Coupons',
      pageSubtitle: 'Manage Hebr Club subscription packages and create promotional discount coupons.',
      plansTitle: 'Current Platform Subscription Plans',
      couponsTitle: 'Promotional Discount Coupons',
      createCouponTitle: 'Create New Discount Coupon',
      codeLabel: 'Coupon Code:',
      typeLabel: 'Discount Type:',
      typePercent: 'Percentage (%)',
      typeFixed: 'Fixed Amount (EGP)',
      valueLabel: 'Discount Value:',
      maxUsesLabel: 'Max Usage Limit:',
      createCouponBtn: 'Create Coupon',
      colCode: 'Coupon Code',
      colDiscount: 'Discount',
      colUses: 'Usage Count',
      colStatus: 'Status',
      colActions: 'Actions',
      active: 'Active',
      inactive: 'Disabled',
      editPlanTitle: 'Edit Subscription Plan',
      addPlanTitle: 'Add New Plan',
      addNewPlanBtn: 'Add New Plan',
      mostChosen: 'Most Popular',
      perMonth: '/ month',
      perYear: '/ year',
      unlimited: 'Unlimited',
      confirmDeleteCoupon: 'Delete coupon {code}?',
      confirmDeletePlan: 'Delete plan {name}?',
      featuresLabel: 'Features (separated by commas)',
      featureCheckLabel: 'Mark plan as "Most Popular"',
      couponPlaceholder: 'e.g. SUMMER2024',
      planName: 'Plan Name',
      planDesc: 'Promotional Plan Description',
      priceMonthly: 'Monthly Price (EGP)',
      priceYearly: 'Yearly Price (EGP)',
      savePlan: 'Save Reading Plan',
    },
    adminSettings: {
      pageTitle: 'Platform Settings & Payment Details',
      pageSubtitle: 'Update Vodafone Cash numbers, InstaPay identifiers, and payment instructions shown at checkout.',
      paymentConfigTitle: 'Manual Transfer & Payment Settings',
      siteName: 'Platform Display Name',
      tagline: 'Platform Tagline',
      vodafoneCash: 'Vodafone Cash Wallet Number',
      instapayHandle: 'InstaPay Handle (IPA)',
      instructions: 'Transfer Instructions shown on Checkout Page',
      contactEmail: 'Contact & Support Email',
      saveBtn: 'Save Settings & Payment Info',
      saving: 'Saving...',
      successNotice: 'Platform settings updated successfully!',
    },
    novelReviews: {
      sectionTitle: 'Reader Ratings & Reviews',
      sectionEyebrow: 'Genuine Impressions',
      genuineVisitorAverage: 'Genuine Reader Average',
      basedOnRatings: 'Based on {count} genuine ratings',
      noRatingsYet: 'No ratings recorded yet',
      starsDistribution: 'Rating Distribution',
      editorialRatingBadge: 'Editorial Rating',
      editorialReviewTitle: 'Editorial Review & Note',
      writeReviewTitle: 'Share your genuine opinion and rating',
      editReviewTitle: 'Edit your rating and review',
      starSelectLabel: 'Select rating (1 to 5 stars):',
      reviewTextPlaceholder: 'Share your honest thoughts on the novel, whether praise or constructive criticism...',
      submitReviewBtn: 'Post Rating & Review',
      updateReviewBtn: 'Update Review',
      deleteReviewBtn: 'Delete My Review',
      confirmDeleteReview: 'Are you sure you want to delete your rating and review for this novel?',
      loginToReview: 'Please sign in to rate this novel and share your review.',
      accountRestrictedNotice: 'Your account is currently restricted from submitting reviews.',
      ratingsDisabledNotice: 'Ratings and reviews are currently closed for this novel.',
      filterAll: 'All Ratings',
      filterStars: '{n} Stars',
      loadMoreReviews: 'Load More Reviews',
      noReviewsYet: 'Be the first to write an honest review and leave your mark on this novel.',
      reportBtn: 'Report Violation',
      reportModalTitle: 'Report Review Violation',
      reportReasonSpam: 'Spam or Promotional Content',
      reportReasonHarassment: 'Harassment or Abuse',
      reportReasonUnlawful: 'Unlawful or Explicit Violation',
      reportReasonOther: 'Other Policy Violation',
      reportDetailsPlaceholder: 'Briefly explain why you are reporting this review...',
      submitReportBtn: 'Submit Report to Admins',
      reportSuccessToast: 'Report submitted successfully for moderation review.',
      reviewSubmittedSuccess: 'Your review has been published successfully!',
      reviewDeletedSuccess: 'Your review has been removed and aggregates updated.',
      yourReviewBadge: 'Your Review',
    },
    visitorManagement: {
      pageTitle: 'Visitor & Community Management',
      pageSubtitle: 'Comprehensive administration of registered readers, content moderation, and rating policies.',
      tabVisitors: 'Visitors & Users',
      tabModeration: 'Review Moderation',
      tabReports: 'Moderation Reports',
      tabSettingsAudit: 'Settings & Audit Log',
      totalVisitors: 'Total Registered Visitors',
      activeVisitors: 'Active Accounts',
      restrictedVisitors: 'Restricted Accounts',
      deactivatedVisitors: 'Deactivated Accounts',
      statusActive: 'Active',
      statusRestricted: 'Restricted',
      statusDeactivated: 'Deactivated',
      filterStatusAll: 'All Statuses',
      colJoinedAt: 'Joined Date',
      colStatus: 'Account Status',
      colActivity: 'Activity & Submissions',
      viewDetailsAndReviews: 'Details & Reviews',
      editStatusTitle: 'Modify Visitor Account Status',
      statusSelectLabel: 'New Status:',
      restrictionReasonLabel: 'Reason for restriction (visible to user):',
      saveStatusBtn: 'Save Status Change',
      deleteAccountBtn: 'Delete Account Safely',
      confirmDeleteAccount: 'Are you sure you want to permanently delete this user account?',
      deleteAccountWarning: 'Safe deletion will remove all user reviews, update novel rating averages automatically, and clean up entitlements.',
      userReviewsModalTitle: 'Reviews Submitted by User',
      noUserReviews: 'This user has not submitted any ratings or reviews yet.',
      ratingsCountLabel: 'reviews & ratings',
      entitlementsCountLabel: 'acquired novels',
      prevPage: 'Previous',
      nextPage: 'Next',
      pageInfo: 'Page {page} of {totalPages}',
      modPageTitle: 'Reader Review Moderation',
      modPageSubtitle: 'Review visitor opinions with a strict commitment never to suppress criticism or low star ratings unless violating conduct policies.',
      filterByNovel: 'All Novels',
      filterByRating: 'All Ratings',
      filterByStatus: 'Publication Status',
      statusPublished: 'Publicly Published',
      statusHidden: 'Hidden for Moderation',
      hideReviewBtn: 'Hide Review',
      publishReviewBtn: 'Publish Review',
      deleteReviewBtn: 'Permanent Delete',
      hideReviewModalTitle: 'Hide Review & Record Reason',
      moderationReasonLabel: 'Moderation Reason (Required):',
      moderationPolicyNotice: 'Notice: Reviews must NOT be hidden simply because they express criticism or 1 star. Moderation is strictly for spam, abuse, or unlawful content.',
      confirmHideReview: 'Confirm hiding review and excluding from rating average',
      confirmDeleteModReview: 'Are you sure you want to permanently delete this review?',
      reportsCount: 'Reports',
      reportsPageTitle: 'Content & Review Reports',
      reportsPageSubtitle: 'Review reports submitted by visitors and take appropriate action.',
      reporter: 'Reporter',
      reportedUser: 'Reviewer',
      reasonLabel: 'Report Reason',
      detailsLabel: 'Details',
      resolveBtn: 'Accept & Resolve',
      dismissBtn: 'Dismiss Report',
      statusPending: 'Pending Review',
      statusResolved: 'Resolved',
      statusDismissed: 'Dismissed',
      noReportsFound: 'No pending reports at this time.',
      ratingSettingsTitle: 'Rating & Review Platform Configuration',
      requireAuthLabel: 'Require Authentication for Rating',
      requireAuthHelp: 'When enabled, only signed-in verified users can rate novels.',
      globalEnableLabel: 'Enable Ratings Globally',
      globalEnableHelp: 'Allow visitors to submit new ratings and reviews across the site.',
      maxReviewsPerDayLabel: 'Max Reviews Per Day Per User',
      maxReviewsPerDayHelp: 'Protects the platform from spam reviews and automated flooding.',
      saveSettingsBtn: 'Save Rating Settings',
      auditLogTitle: 'Administrative Audit Log',
      colTimestamp: 'Timestamp',
      colAdmin: 'Administrator',
      colAction: 'Action Taken',
      colTarget: 'Target',
      colDetails: 'Details & Reason',
      settingsSavedSuccess: 'Rating settings saved successfully!',
      emptyAuditLogs: 'No administrative actions logged yet.',
    },
    ratingControls: {
      sectionTitle: 'Rating Controls & Display Mode',
      sectionSubtitle: 'Manage public rating visibility and separate genuine visitor averages from editorial appraisals.',
      displayModeLabel: 'Public Rating Display Mode:',
      modeVisitor: 'Visitor Mode (Reader Average)',
      modeVisitorDesc: 'Displays the honest calculated average of genuine visitor ratings.',
      modeEditorial: 'Editorial Mode',
      modeEditorialDesc: 'Displays a curated editorial rating explicitly labeled as an editorial appraisal.',
      modeCustom: 'Custom Display Mode',
      modeCustomDesc: 'Shows only a rating you set, without blending reader ratings.',
      modeCombined: 'Combined rating',
      modeBlended: 'Starter Rating + Reader Ratings',
      modeBlendedDesc: 'Blends your starter rating with genuine visitor votes using a configurable weight.',
      blendedWeightLabel: 'Starter rating weight (equivalent votes)',
      blendedPreviewLabel: 'Estimated blended rating:',
      genuineVisitorAvgLabel: 'Genuine Reader Average:',
      genuineVotesCount: 'Total genuine visitor ratings: {count}',
      editorialRatingInput: 'Editorial Rating (1.0 to 5.0):',
      editorialReviewInput: 'Editorial Review / Commentary (Optional):',
      customRatingInput: 'Custom Displayed Rating (1.0 to 5.0):',
      ratingsEnabledCheckbox: 'Allow visitors to submit ratings and reviews for this novel',
      ratingsEnabledHelp: 'You can independently pause new ratings for this novel.',
      editorialNotice: 'Starter ratings are not counted as genuine visitor votes. Blended mode displays a separate weighted average, and can be turned off later.',
    },
    adminRatingManagement: {
      pageTitle: 'Novel Rating Management',
      pageSubtitle: 'Manage independent administrative rating statistics, display modes, and star distributions per novel.',
      selectNovelPrompt: 'Select a novel to manage its rating statistics...',
      searchNovelPlaceholder: 'Search novels by title or author...',
      allNovels: 'All Novels',
      selectedNovel: 'Selected Novel',
      noNovelsFound: 'No novels match your search criteria.',
      readerStatsTitle: 'Genuine Reader Statistics',
      readerStatsDesc: 'Directly calculated from real reader reviews and ratings on the platform.',
      readerAverage: 'Reader Average',
      readerVotesCount: 'Reader Votes Count',
      readerPoints: 'Reader Rating Points',
      noReaderRatings: 'No reader ratings submitted yet.',
      recalculateReaderStatsBtn: 'Reconcile Reader Ratings',
      recalculating: 'Reconciling...',
      recalculateSuccess: 'Reader statistics reconciled and verified successfully from published reviews!',
      adminStatsTitle: 'Administrative Rating Statistics (Managed)',
      adminStatsDesc: 'Independent statistical values configured per star level. Does NOT create fake accounts or reviews.',
      enableAdminContribution: 'Enable administrative contribution in final displayed rating',
      enableAdminContributionHelp: 'When enabled with Combined Mode, these votes and points are calculated in the weighted formula.',
      star5Label: '5-Star Ratings (Excellent)',
      star4Label: '4-Star Ratings (Very Good)',
      star3Label: '3-Star Ratings (Average)',
      star2Label: '2-Star Ratings (Below Average)',
      star1Label: '1-Star Ratings (Poor)',
      adminCountAuto: 'Total Administrative Count (Auto-calculated)',
      adminAverageAuto: 'Administrative Average (Auto-calculated)',
      adminPointsAuto: 'Administrative Rating Points',
      modeSectionTitle: 'Public Rating Display Mode',
      modeVisitor: 'Visitor Mode (Readers Only)',
      modeVisitorDetail: 'Displays only genuine reader ratings and their honest average without any administrative contribution.',
      modeCombined: 'Combined Mode (Weighted)',
      modeCombinedDetail: 'Combines administrative statistics with reader ratings using the exact formula: (Admin Points + Reader Points) / (Admin Count + Reader Count).',
      modeEditorial: 'Editorial Mode',
      modeEditorialDetail: 'Displays curated editorial score and review commentary with an official editorial badge.',
      modeCustom: 'Custom Display Mode',
      modeCustomDetail: 'Displays a standalone curated score without blending reader ratings.',
      editorialRatingInput: 'Editorial Rating (1.0 to 5.0):',
      editorialReviewInput: 'Editorial Review / Commentary (Optional):',
      customRatingInput: 'Custom Displayed Rating (1.0 to 5.0):',
      ratingsEnabledCheckbox: 'Allow visitors to submit ratings and reviews for this novel',
      ratingsEnabledHelp: 'You can independently pause new ratings for this novel without affecting past ratings.',
      previewTitle: 'Live Final Rating Preview',
      previewCardHeader: 'Preview on Novel Cards & Catalog',
      previewDetailHeader: 'Preview on Novel Detail Page',
      combinedFormulaExplanation: 'Weighted Formula Breakdown:',
      saveChangesBtn: 'Save Rating Settings',
      saving: 'Saving...',
      savedSuccess: 'Rating settings saved successfully and catalog cards updated!',
      resetAdminStatsBtn: 'Reset Administrative Statistics',
      resetConfirmTitle: 'Confirm Resetting Administrative Statistics',
      resetConfirmDesc: 'This will reset administrative star counts for the selected novel to 0 and disable the administrative contribution. NO genuine reader ratings or reviews will be deleted.',
      confirmResetAction: 'Yes, Reset Administrative Statistics Only',
      cancel: 'Cancel',
      quickNovelRatingsBtn: 'Manage Ratings',
    },
    footer: {
      brandQuote: 'An Arabic literary platform for stories that leave an indelible mark.',
      exploreTitle: 'Explore',
      helpTitle: 'Help',
      followTitle: 'Follow the Story',
      allRightsReserved: 'Hebr. All rights reserved.',
    },
  },
};

// Helper to get localized novel field safely
export function getLocalizedNovelField(
  novel: { title: string; titleEn?: string; author?: string; authorEn?: string; description?: string; descriptionEn?: string; genre?: string; genreEn?: string },
  field: 'title' | 'author' | 'description' | 'genre',
  lang: Language
): string {
  if (lang === 'en') {
    if (field === 'title' && novel.titleEn?.trim()) return novel.titleEn;
    if (field === 'author' && novel.authorEn?.trim()) return novel.authorEn;
    if (field === 'description' && novel.descriptionEn?.trim()) return novel.descriptionEn;
    if (field === 'genre') {
      if (novel.genreEn?.trim()) return novel.genreEn;
      if (novel.genre && translations.en.genres[novel.genre]) return translations.en.genres[novel.genre];
    }
  }
  // Default Arabic or original fallback
  if (field === 'title') return novel.title || '';
  if (field === 'author') return novel.author || '';
  if (field === 'description') return novel.description || '';
  if (field === 'genre') {
    if (novel.genre && translations.ar.genres[novel.genre]) return translations.ar.genres[novel.genre];
    return novel.genre || '';
  }
  return '';
}

export function getLocalizedChapterTitle(
  chapter: { title: string; titleEn?: string; number: number },
  lang: Language
): string {
  if (lang === 'en' && chapter.titleEn?.trim()) {
    return chapter.titleEn;
  }
  return chapter.title || `${translations[lang].common.chapter} ${chapter.number}`;
}

export function getLocalizedPlan(
  plan: { id: string; name: string; description?: string; books?: string[] },
  lang: Language
): { name: string; description: string; books: string[] } {
  if (lang === 'en') {
    if (plan.id === 'plan_companion') {
      return {
        name: 'Companion',
        description: 'For passionate readers who love discovering a new story each week and reading ongoing serialized novels freely.',
        books: ['Harbors of Absence', 'The Ancient Map Seller', 'Exclusive Early Chapters'],
      };
    }
    if (plan.id === 'plan_salon') {
      return {
        name: 'The Salon',
        description: 'Unlimited access to all platform novels and every chapter with frequent weekly updates.',
        books: ['Harbors of Absence', 'The Ancient Map Seller', 'Full Current Hebr Library', 'Exclusive Audio Narrations'],
      };
    }
    if (plan.id === 'plan_library') {
      return {
        name: 'The Library',
        description: 'The definitive reading experience: comprehensive access, digital PDF/EPUB downloads, and book club perks.',
        books: ['Permanent Comprehensive Access', 'Digital PDF & EPUB Editions', 'Community & Reading Club Access'],
      };
    }
  }
  return {
    name: plan.name,
    description: plan.description || '',
    books: plan.books || [],
  };
}

