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
4. في قسم **Storage**:
   - فعّل خدمة التخزين السحابي Cloud Storage لرفع إيصالات التحويل وأغلفة الكتب.

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

# نشر قواعد Firestore و Storage
firebase deploy --only firestore:rules,storage
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
