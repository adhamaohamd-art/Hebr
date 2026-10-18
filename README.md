# حَبْر (Hebr) — منصة الروايات والحكايات العربية

منصة قراءة واقتناء روايات عربية حقيقية متكاملة مبنية باستخدام React 18 و TypeScript و Tailwind CSS مع قاعدة بيانات وتوثيق حقيقي عبر **Firebase (Firestore, Authentication, Storage)**.

---

## 1. الهوية البصرية والتصميم (Visual Identity)
- **رموز الألوان الأساسية:**
  - الأخضر الداكن: `#23483f`
  - العميق: `#17372f`
  - لون الورق الهادئ: `#faf9f5`
  - لون الحبر: `#242522`
  - البرونزي والذهبي: `#a98a63` / `#c9a574`
- **الخطوط:**
  - `IBM Plex Sans Arabic` (واجهة المستخدم والقراءة المريحة)
  - `Playfair Display` (العناوين الأنيقة والجماليات الأدبية)
- **الاتجاه:** RTL باللغة العربية مع إمكانية التبديل إلى الإنجليزية عبر زر التبديل في الشريط العلوي.

---

## 2. هيكل البيانات في Firebase (Firestore Data Model)
1. **`novels/{novelId}`**:
   - بيانات الرواية: `title`, `author`, `genre`, `status` ('مستمرة' | 'مكتملة'), `description`, `coverUrl`, `color`, `accent`, `novelPrice` (بالجنيه المصري), `bookPrice` (سعر الكتاب الرقمي الكامل أو null), `freeChapters` (عدد الفصول المجانية الأولى), `chaptersCount`, `published`, `createdAt`.
2. **`novels/{novelId}/chapters/{chapterId}`**:
   - الفهرس العام المجرد من النص: `number`, `title`, `isFree` (bool), `published`, `publishAt`.
3. **`chapterContents/{chapterId}`**:
   - النص الكامل المحمي بقواعد أمان مشددة: `novelId`, `body`.
4. **`users/{uid}`**:
   - `name`, `email`, `createdAt`, `subscription: { planId, planName, expiresAt } | null`.
5. **`users/{uid}/entitlements/{novelId}`**:
   - تراخيص الملكية الدائمة: `type: 'novel' | 'book'`, `grantedAt`, `orderId`.
6. **`users/{uid}/library/{novelId}`**:
   - متابعة القراءة والإشارات المرجعية: `lastChapter`, `bookmarked`, `updatedAt`.
7. **`orders/{orderId}`**:
   - سجل الطلبات: `userId`, `userEmail`, `userName`, `items`, `total`, `couponCode`, `paymentMethod` ('vodafone_cash' | 'instapay'), `receiptUrl`, `status` ('pending' | 'approved' | 'rejected'), `createdAt`, `reviewedAt`, `adminNote`.
8. **`plans/{planId}`**:
   - باقات نادي حَبْر: `name`, `priceMonthly`, `priceYearly`, `description`, `active`, `books`.
9. **`coupons/{code}`**:
   - كوبونات الخصم: `type` ('percent' | 'fixed'), `value`, `active`, `expiresAt`, `maxUses`, `usedCount`.
10. **`comments/{commentId}`**:
    - انطباعات القراء على الفصول: `novelId`, `chapterId`, `userId`, `userName`, `text`, `createdAt`, `hidden`.
11. **`admins/{uid}`**:
    - صلاحيات مديري النظام.
12. **`settings/site`**:
    - بيانات الحسابات المالية: رقم فودافون كاش، معرف إنستاباي، تعليمات الدفع.

---

## 3. منطق فك القفل (Unlock Logic)
يستطيع القارئ فتح وقراءة أي فصل إذا تحقق **أيّ شرط من الشروط الآتية**:
1. الفصل مجاني صراحةً (`chapter.isFree == true`) أو رقمه يقع ضمن الفصول المجانية المحددة للرواية (`chapter.number <= novel.freeChapters`).
2. يمتلك القارئ ترخيص اقتناء للرواية في `users/{uid}/entitlements/{novelId}` (سواء اقتناء الرواية `novel` أو الكتاب الرقمي الكامل `book`).
3. يمتلك القارئ اشتراكاً نشطاً في نادي حَبْر (`users/{uid}.subscription.expiresAt > Date.now()`).
4. حساب القارئ مسجل كمسؤول (`isAdmin == true`).

*ملاحظة هامة للأمان:* لا يتم أبداً استدعاء أو تحميل نص الفصل المحمي من مجموعة `chapterContents` في المتصفح إذا كان الفصل مقفلاً.

---

## 4. خطوات إعداد Firebase (Firebase Setup Steps)

### أ) إعداد المشروع وقاعدة البيانات:
1. افتح [Firebase Console](https://console.firebase.google.com/) واختر مشروعك (`habr-328b3`).
2. في قسم **Authentication**:
   - فعّل موفّر **Google** (Google Sign-In).
   - فعّل موفّر **Email/Password**.
3. في قسم **Firestore Database**:
   - أنشئ قاعدة بيانات Firestore.
4. **Storage غير مطلوب**: المشروع يعمل على خطة Spark المجانية بدون Cloud Storage (الدفع يدوي برقم العملية، والأغلفة روابط). لا تفعّله ولا تنشر `storage.rules`.

### ب) إضافة المسؤول الأول (Making the First Admin):
1. قم بإنشاء حساب في المنصة عبر صفحة `/login` (سواء بحساب Google أو بالبريد وكلمة المرور).
2. انسخ معرّف المستخدم الخاص بك (`UID`) الظاهر في صفحة Authentication.
3. توجه إلى **Firestore Database** في Firebase Console وأنشئ مجموعة باسم:
   ```
   admins
   ```
4. أضف مستنداً جديداً بحيث يكون **معرّف المستند (Document ID)** هو معرّف `UID` الخاص بك:
   ```json
   {
     "active": true,
     "email": "your-email@example.com"
   }
   ```
5. بمجرد إضافة المستند في مجموعة `admins/{uid}`، قم بتسجيل الدخول في الموقع وستظهر لك أيقونة لوحة الإدارة في قائمة حسابك، كما ستتمكن من فتح الرابط `/admin`.
(ملاحظة أمنية: الزوار والمستخدمون غير المسؤولين لن يظهر لهم أي أثر لوجود لوحة الإدارة، وسيعرض لهم الرابط صفحة 404 العامة تلقائياً).

### ج) نشر قواعد الأمان (Deploying Rules):
قم بنشر ملفات القواعد المرفقة باستخدام Firebase CLI:
```bash
# تثبيت أدوات Firebase إن لم تكن مثبتة
npm install -g firebase-tools

# تسجيل الدخول واختيار المشروع
firebase login
firebase use habr-328b3

# نشر قواعد Firestore وفهارسها فقط
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 5. تهيئة البيانات التجريبية (Seeding Initial Data)
لتسهيل البدء الفوري، تحتوي لوحة الإدارة (`/admin`) على زر **"تهيئة بيانات أولية"** في أسفل القائمة الجانبية:
- ينشئ روايتين غنيتين بكافة تفاصيلهما:
  - **رواية "مرافئ الغياب"** (ليان السالم) — تحتوي على 4 فصول كاملة بنصوصها (الفصلان 1 و 2 مجانيان، والفصلان 3 و 4 مقفولان).
  - **رواية "بائع الخرائط القديمة"** (يوسف مراد) — تحتوي على 3 فصول بنصوصها (الفصل 1 مجاني، والفصلان 2 و 3 مقفولان).
- ينشئ خطط اشتراك نادي حَبْر الثلاثة (رفيق، الصالون، المكتبة).
- ينشئ كوبون خصم تجريبي `HEBR20` (خصم 20%).
- يضبط بيانات فودافون كاش وإنستاباي الافتراضية.

---

## 6. مسار الدفع اليدوي في مصر (Vodafone Cash & InstaPay)
1. يختار القارئ الرواية أو الكتاب أو الخطة ويضيفها إلى السلة (`/cart`).
2. يمكن إدخال كود خصم وتطبيقه لحظياً قبل الدفع.
3. عند الانتقال إلى الدفع (`/checkout`)، يعرض الموقع المبلغ الإجمالي بدقة بالجنيه المصري (ج.م) وبيانات المحفظة أو عنوان إنستاباي.
4. يرفع القارئ صورة إيصال التحويل، فيتم إنشاء طلب بحالة `pending` (قيد المراجعة).
5. يظهر الطلب فوراً في لوحة الإدارة (`/admin/orders`) وفي صفحة القارئ (`/library`).
6. بضغطة زر واحدة من المدير ("موافقة وتفعيل")، تنفذ العملية المجمعة (Batch Write) التي تُفعل ترخيص الرواية أو اشتراك النادي في حساب القارئ ويتمكن من القراءة الفورية!

---

## 7. فحص سلامة البناء (Build & Typecheck)
```bash
npm run typecheck
npm run build
```
المشروع مبني ومعالج بنسبة 100% بدون أي أخطاء برمجية أو تحذيرات نوعية.

## Traditional star ratings

The public rating display uses the normal 1–5 star average and the number of published reader ratings. A reader can submit one rating per novel and edit that rating later; editing does not create an extra rating. Hidden or deleted reviews are excluded from the public average.

### How the numbers are kept correct (and safe)
- **One review per reader per novel** is enforced by the rules: the review document id must be `{novelId}_{uid}`.
- **Incremental aggregates.** Submitting, editing or deleting a rating runs ONE transaction that writes the review and adjusts `novels/{id}` (`visitorRatingCount`, `ratingDistribution`, `visitorRatingAverage`, `rating`) by exactly that rating. It no longer re-reads every review, so the cost per rating is a handful of reads no matter how many reviews exist, and simultaneous ratings cannot overwrite each other.
- **Forgery protection.** `firestore.rules` re-check the arithmetic: a reader can only change the novel's counters by the effect of their own review written in the same transaction. Hand-edited counters from the browser console are rejected.
- **Verified email required** to rate (same as comments and orders).
- **No emails on reviews.** Reviews are publicly readable, so the reader's email is no longer stored on them.
- **Home/Browse cards** read `catalog/home`, which only admins can write. It is refreshed when an admin moderates a review or presses *"Sync all ratings to the home page"* in Admin → Ratings. (Fully automatic refresh needs a Cloud Function, which requires the Blaze plan.)

### Deploy
```bash
firebase deploy --only firestore:rules,firestore:indexes
```
This deploys Firestore rules and indexes only; it does not deploy website hosting. Wait until the new indexes finish building (Firebase Console → Firestore → Indexes) before testing.

### One-time steps after deploying (as admin, Admin → Ratings)
1. **Remove emails from old reviews** (cleans the field earlier versions stored).
2. **Sync all ratings to the home page** (rebuilds each novel's numbers from its published reviews and refreshes `catalog/home`).

### Before going live
The rules were written and statically checked but not run against the Firebase emulator. Test them in the Rules Playground or with `firebase emulators:exec` (rate a novel, change the rating, delete it, try to edit `visitorRatingCount` by hand, try a second review document id). Optionally enable App Check by setting `VITE_RECAPTCHA_SITE_KEY`.

### Tests
```bash
npx tsx tests/ratings.test.ts
```

## Multiple genres per novel

A novel can now carry up to 5 genres (e.g. Romance + Fantasy + Action).

- **Data:** `novels/{id}.genres` is an array of genre keys. `genre` / `genreEn` still hold the FIRST genre, so older code and older novels keep working. Novels that only have `genre` need no migration: they simply show one genre until you edit them.
- **Admin → Novels:** the genre dropdown is now a set of toggle chips (at least 1, at most 5). The first selected genre is the primary one.
- **Reader side:** cards show the first two genres, the novel page shows all of them, covers show the primary genre, and the Browse filter matches a novel if ANY of its genres is selected.
- **New genre "أكشن / Action"** was added. To add more genres, edit `GENRE_KEYS` in `src/lib/genres.ts` and add the labels under `genres` (ar + en) in `src/i18n/translations.ts`.
- **After deploying:** open each novel you want in Admin → Novels, pick its genres and save. Saving also refreshes `catalog/home`, so Home/Browse show the new genres. No rules or index changes are needed (only admins write novels).
- **Tests:** `npx tsx tests/genres.test.ts`

## Saving Firestore reads (free Spark plan: ~50K reads/day)

- **Comments on demand, 5 at a time.** Opening a chapter no longer reads comments. The reader presses "عرض التعليقات" (Show comments) to load the first 5, then "تحميل المزيد من التعليقات" for 5 more each time. Page size: `COMMENTS_PAGE_SIZE` in `src/services/commentService.ts`. Posting a comment before opening the list loads the list so the new comment appears.
- **Admin → Users is paged.** `visitorService.getVisitorsPage()` reads 50 users per request (`VISITORS_PAGE_SIZE`), with a "تحميل المزيد من المستخدمين" button. Search and the counters cover the users loaded so far.
- Rough reads for one reader opening one chapter: about 5 (was about 25).

## Digital edition (EPUB / PDF generated by the site)

Readers who bought the digital edition (`entitlements/{novelId}.type == 'book'`) see two buttons on the novel page and in Library → Purchased: **EPUB** and **PDF**. No file is stored anywhere (no Cloud Storage, no download link):

- `src/services/bookExportService.ts` loads the novel's published chapters (one Firestore read per chapter, once per download). Firestore rules still decide access, so a reader without an entitlement gets nothing.
- **EPUB** is built in the browser by `src/lib/ebook.ts` + `src/lib/zip.ts` (no dependency): EPUB 3 with an EPUB 2 NCX, right-to-left, table of contents, title page.
- **PDF** opens a print-styled page and the browser's print dialog; the reader chooses "Save as PDF" (this gives correct Arabic shaping; in-browser PDF libraries do not).
- The title page carries "licensed to <reader name or email>" as a light deterrent against sharing. Remove `licensedTo` in `BookDownloadButtons` usages to disable it.
- The old per-novel download link (Admin → Books, `bookFiles`) is no longer used by readers.
- To let readers who bought only the novel (`type: 'novel'`) export too, change the two `isBook` / `hasPurchasedBook` conditions in `LibraryPage.tsx` and `NovelDetailPage.tsx`.
- Not included: cover image inside the EPUB (cover URLs are external and browsers block fetching them).


---

## الروايات المجانية + حماية النص + حسابات الكتّاب

### 1) رواية مجانية بالكامل
- في **الأدمن ← الروايات ← تعديل** فعّل «رواية مجانية بالكامل» (`isFreeNovel`).
- كل فصولها الحالية والجديدة تُقرأ ببلاش، ويختفي زر الشراء، وتظهر كلمة «مجانية» على الكارت.
- نفس المنطق في الواجهة (`src/lib/freeChapters.ts`) وفي `firestore.rules` (قراءة `chapterContents`)، فلا يمكن تجاوزه ولا قفله بالخطأ.

### 2) منع نسخ النص
- نص الفصل في صفحة القراءة: لا تحديد، لا نسخ/قص، لا قائمة كليك يمين، لا سحب، لا طباعة (`.reading-body-protected` في `index.css`، ومعالجات الأحداث في `ReaderPage.tsx`).
- الأدمن مستثنى ليستطيع المراجعة.
- **هذه حماية ردع للقارئ العادي وليست DRM**: من يملك المحتوى على شاشته يستطيع تصويره أو استخراجه من أدوات المتصفح. القفل الحقيقي الوحيد هو عدم إرسال النص لمن لم يدفع (وهذا مطبّق في القواعد).

### 3) الكتّاب (Writers)
- **حد الكاتب = الأكبر بين:** ما يمنحه الأدمن للمستخدم (`users/{uid}.writerLimit` من **الأدمن ← المستخدمون ← إدارة الوصول**) وبين `writerNovelLimit` في باقته الفعّالة (**الأدمن ← الباقات**، مثال: باقة «فريق حبر» = 2).
- الكاتب يدخل **لوحة الكاتب** (`/writer`، أيقونة الريشة في الهيدر)، ينشئ رواياته ويضيف فصولها ويرسلها للمراجعة.
- الرواية تبدأ **مسودة خاصة**. بعد «إرسال للمراجعة» تظهر في الأدمن بعلامة «كاتب · بانتظار المراجعة»، وبزر ✓ يفتح نموذج التعديل لتحدد **السعر وعدد الفصول المجانية** (أو تجعلها مجانية) ثم تحفظ فتُنشر. زر ✗ يرفضها مع ملاحظة تظهر للكاتب.
- الكاتب **لا يستطيع** النشر المباشر ولا التسعير ولا لمس الفهرس العام ولا التقييمات؛ كل هذا مفروض في `firestore.rules` وليس في الواجهة فقط.
- العداد `writerStats/{uid}.novelCount` لا يتحرك إلا بمقدار +1/-1 مع إنشاء/حذف رواية يملكها نفس الكاتب في نفس الـ batch، وإنشاء الرواية يُرفض إن تجاوز الحد.
- انتهاء الاشتراك: لا يستطيع الكاتب إنشاء روايات جديدة، لكنه يعدّل ويحذف رواياته الحالية.
- حذف الأدمن لرواية كاتب يُرجع له مكانها في الحد.

### النشر بعد هذه التعديلات
```bash
firebase deploy --only firestore:rules   # ضروري: القواعد تغيّرت
npm run check                            # typecheck + lint + tests
npm run build
```
ثم: الأدمن ← الباقات ← عدّل الباقة المطلوبة وضع «عدد روايات الكاتب».

> لم تُختبر القواعد الجديدة على Firebase Emulator داخل هذه البيئة. جرّبها في **Rules Playground** أو بالـ emulator محليًا قبل الإطلاق (إنشاء رواية، تجاوز الحد، تعديل `published`، قراءة فصل مدفوع).


---

## حساب الكاتب: التسعير والنشر والأرباح والخصومات والباقات

### التسعير (الكاتب يتحكم في رواياته هو فقط)
- زر **«التسعير»** في لوحة الكاتب: سعر الرواية، سعر الكتاب الرقمي، عدد الفصول المجانية، أو «مجانية بالكامل». مفروض في `firestore.rules` (حدود 0–5000 ج.م).
- **الأدمن** يعدّل أي سعر من **الأدمن ← الكتّاب** (أو من صفحة الروايات)، ويستطيع **قفل السعر** (`priceLocked`) فلا يستطيع الكاتب تغييره حتى يفتحه الأدمن. الفصول المجانية تبقى بيد الكاتب.
- السعر الجديد يسري فورًا في صفحة الرواية والشراء. كروت الصفحة الرئيسية تقرأ `catalog/home` فتتحدّث بعد زر «إعادة بناء الفهرس».

### جدول نشر الفصول (حماية للمنصة)
- **أول 3 فصول لكل رواية بلا انتظار، ثم فصل واحد كل 3 أيام** (بلا تخزين: الانتظار الأطول لا يعطي فصولًا إضافية).
- مؤشر في «الفصول» يوضح الموعد القادم بالعدّ التنازلي. الفصل الجديد يُحفظ كمسودة تلقائيًا لو لم يحن الموعد.
- مفروض في القواعد: عدّادات `releaseCount` و`lastReleaseAt` على الرواية تتحرك +1 فقط بتوقيت الخادم وفي نفس الـ batch مع نشر الفصل. الأدمن غير مقيّد.
- التعديل على فصل منشور سابقًا لا يُحسب نشرًا جديدًا. إلغاء نشر فصل ثم إعادة نشره يُحسب نشرًا جديدًا.
- الثوابت في `src/lib/releaseSchedule.ts` (والرقم 3 مكرر يدويًا في القواعد داخل `writerReleaseOk`).

### الأرباح
- عند **موافقة الأدمن على طلب** يُسجَّل لكل سطر رواية/كتاب يملكه كاتب سجل في `sales` فيه نصيب الكاتب = **نسبته (الافتراضي 70%) من السعر بعد الخصم**. النسبة من **الأدمن ← الإعدادات** وتُخزَّن مع كل عملية (تغييرها لا يمس القديم).
- الكاتب يرى مبيعاته وأرباحه في لوحته. الأدمن يرى الإجمالي لكل كاتب ونصيب المنصة. **تحويل المبلغ للكاتب يدوي** (لا يوجد تتبع للمدفوع بعد).
- **الاشتراكات (الباقات) لا تدخل في أرباح الكاتب حاليًا.**

### خصومات الكاتب
- من لوحة الكاتب: كود خصم لرواية واحدة من رواياته (نسبة حتى 90% أو مبلغ ثابت). يخصم رواية الكاتب وكتابها فقط ولا يمس باقي السلة. الخصم يقع على نصيب الكاتب.
- كوبونات الأدمن العامة كما هي (تخصم كل السلة).

### طلب الانضمام للباقات
- الكاتب يطلب من لوحته إضافة رواية منشورة لباقة ← يظهر في **الأدمن ← الكتّاب** ← موافقة (تُضاف الرواية إلى `plan.novelIds`) أو رفض بسبب يراه الكاتب.

### تصحيح خطأ الباقة الوهمية
- الفصل المقفول كان يعرض كارت اشتراك بسعر ثابت «35 ج.م» لكل رواية. الآن يعرض فقط الباقات الفعّالة التي تشمل الرواية فعلًا (أو «كل الروايات») مع أقل سعر لها، ويختفي إن لم توجد باقة (`src/lib/planCoverage.ts`).

### صفحة الأدمن الجديدة «الكتّاب»
تعرض كل صاحب حساب كاتب (منحة من الأدمن، أو مشترك في باقة بها `writerNovelLimit`، أو له روايات) مع مصدر الحساب والحد وعدد الروايات والمبيعات والأرباح، وروايات كل كاتب بحالتها وسعرها ومؤشر النشر، وطلبات الباقات المعلقة.

### النشر بعد هذه التعديلات
```bash
firebase deploy --only firestore:rules   # ضروري
npm run check && npm run build
```
> القواعد لم تُجرَّب على Firebase Emulator. اختبرها في Rules Playground أو بالـ emulator (تسعير كاتب، تسعير على رواية مقفولة السعر، نشر الفصل الرابع مباشرة بعد الثالث، نشر بعد 3 أيام، كوبون على رواية ليست له، طلب باقة).
> روايات قديمة نشر كاتبها فصولًا قبل هذا التحديث يبدأ عدّادها من صفر، أي يحصل على 3 نشرات إضافية.
