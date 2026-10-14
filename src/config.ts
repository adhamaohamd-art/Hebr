/**
 * Application feature toggles and global limits.
 * We are operating under the FREE Firebase Spark plan:
 * storageUploads is disabled (no Cloud Storage uploads/downloads).
 */
export const FEATURES = {
  storageUploads: false,
};

export const LIMITS = {
  // Anti-spam and input length limits
  displayNameMin: 2,
  displayNameMax: 60,
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 128,
  commentMax: 500,
  commentCooldownSeconds: 20,
  searchMax: 80,
  couponCodeMax: 24,
  senderPhoneRegex: /^01[0125][0-9]{8}$/,
  senderPhoneMax: 11,
  transactionRefRegex: /^[A-Za-z0-9-]{6,30}$/,
  transactionRefMax: 30,
  noteMax: 140,
  maxPendingOrdersPerUser: 3,

  // Admin limits
  novelTitleMax: 120,
  authorMax: 80,
  descriptionMax: 2000,
  chapterTitleMax: 150,
  chapterBodyMax: 200000,
  bookFileUrlMax: 500,
};
