import { collection, doc, writeBatch, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Novel } from '../types';
import { novelService } from './novelService';

export const seedService = {
  async seedInitialData(): Promise<{ success: boolean; message: string }> {
    try {
      // Check if novels already exist
      const existing = await getDocs(collection(db, 'novels'));
      if (!existing.empty) {
        return { success: false, message: 'قاعدة البيانات تحتوي بالفعل على روايات.' };
      }

      const batch = writeBatch(db);

      // Novel 1: مرافئ الغياب
      const novel1Ref = doc(db, 'novels', 'novel_1');
      const novel1Data: Omit<Novel, 'id'> = {
        title: 'مرافئ الغياب',
        titleEn: 'Harbors of Absence',
        author: 'ليان السالم',
        authorEn: 'Layan Al-Salem',
        genre: 'رومانسية',
        genreEn: 'Romance',
        status: 'مستمرة',
        description: 'حين تعود إلى المدينة التي غادرتها، تكتشف أن بعض الحكايات لم تنتهِ بعد، وأن الذكريات كانت فقط تنتظر صوتاً يوقظها.',
        descriptionEn: 'Returning to the city she once fled, she discovers that some tales never truly ended, and that memories were only waiting for a voice to awaken them.',
        color: '#314f49',
        accent: '#d9bb91',
        novelPrice: 45,
        bookPrice: 65,
        freeChapters: 2, // Chapters 1 & 2 are free
        chaptersCount: 4,
        published: true,
        featured: true,
        visitorRatingAverage: 0,
        visitorRatingCount: 0,
        ratingDisplayMode: 'visitor',
        ratingsEnabled: true,
        createdAt: serverTimestamp(),
      };
      batch.set(novel1Ref, novel1Data);

      // Chapters for Novel 1
      const n1Chapters = [
        {
          id: 'chap_1_1',
          number: 1,
          title: 'البداية التي لم تحدث',
          titleEn: 'The Beginning That Never Happened',
          isFree: true,
          published: true,
          body: `لم يكن الصباح مختلفاً عن سائر الصباحات التي سبقت عودتها. الضوء نفسه يتسلل من بين ستائر الغرفة، والغبار نفسه يرقص في المسافة الضيقة بين النافذة والكرسي الخشبي العتيق.\n\nلكن شيئاً ما في الهواء كان يقول إن المدينة تعرفها. ربما كانت الأرصفة تحفظ وقع خطوتها، أو أن البحر، الذي لم يغادر مكانه يوماً، كان ينتظر أن يسمع صوتها من جديد بعد كل تلك السنين.\n\nوضعت حقيبتها إلى جوار الباب، وظلت واقفة للحظة أطول مما ينبغي. في الداخل، كانت الأشياء كما تركتها تماماً: ساعة توقفت عند الثالثة، صورة باهتة على الجدار، وكتاب مفتوح على صفحة لم تستطع قراءتها آنذاك. بعض الأماكن لا نعود إليها، بل نعود إلى النسخة التي تركناها فيها.`,
        },
        {
          id: 'chap_1_2',
          number: 2,
          title: 'أصوات بعيدة ورائحة المطر',
          titleEn: 'Distant Voices and the Scent of Rain',
          isFree: true,
          published: true,
          body: `حين هطل المطر الأول، انبعثت من الأزقة القديمة رائحة التراب المبلل. كانت تلك الرائحة تختصر طفولة كاملة عشتها هنا قبل أن تبتلعنا الطرقات السريعة.\n\nخرجت إلى الشرفة المغلقة بالزجاج المشروخ. كان الصيادون يلملمون شباكهم على الشاطئ، وصوت المذياع ينبعث من مقهى الحي المجاور بأغنية قديمة لأم كلثوم.\n\nتذكرت رسالته الأخيرة التي لم أجب عليها قط: "المدن لا تنسى من أحبوها بصدق، حتى وإن ظنوا أنهم أتقنوا فن الرحيل".`,
        },
        {
          id: 'chap_1_3',
          number: 3,
          title: 'نافذة في آخر الممر',
          titleEn: 'A Window at the End of the Hallway',
          isFree: false,
          published: true,
          body: `في الممر الضيق، كانت الظلال تتشكل مع كل هبة ريح تلامس المصباح المعلق. خطوت بحذر وكأنني أتسلل إلى حياة شخص آخر.\n\nخلف الباب الخشبي المقفل، وجدت الصندوق المعدني الصغير. لم يكن مقفلاً، بل كان مربوطاً بخيط حريري رفيع. في الداخل، دستة من الرسائل التي لم تُرسل أبداً، كل ظرف يحمل تاريخاً يطابق يوماً من أيام الشتاء القاسي الذي ودعنا فيه بعضنا.\n\nقرأت السطر الأول من الرسالة الأولى فاهتز كياني: "لو أنكِ التفتِ حينها خطوة واحدة فقط، لرأيتِ أنني لم أكن ألوّح مودعاً، بل كنت أطلب منكِ البقاء".`,
        },
        {
          id: 'chap_1_4',
          number: 4,
          title: 'رسالة مؤجلة وظلال على الجدار',
          titleEn: 'A Deferred Letter and Shadows on the Wall',
          isFree: false,
          published: true,
          body: `جلست على الأرض الباردة والرسائل مبعثرة حولي كأوراق خريفية لا تجد أرضاً تستقر عليها. كل سطر كان اعترافاً مؤجلاً، وكل كلمة كانت جرحاً التأم على عجل قبل أن يشفى تماماً.\n\nفجأة، طُرق الباب الخارجي ثلاث طرقات متأنية. الصوت نفسه الذي كنت أعرفه قبل سبع سنوات. تجمدت أنفاسي، وأدركت في تلك اللحظة أن الماضي لا يطرق الأبواب صدفة.`,
        },
      ];

      for (const ch of n1Chapters) {
        const chRef = doc(db, 'novels', 'novel_1', 'chapters', ch.id);
        batch.set(chRef, {
          novelId: 'novel_1',
          number: ch.number,
          title: ch.title,
          titleEn: ch.titleEn,
          isFree: ch.isFree,
          published: ch.published,
          createdAt: serverTimestamp(),
        });
        const contentRef = doc(db, 'chapterContents', ch.id);
        batch.set(contentRef, {
          novelId: 'novel_1',
          isFree: ch.isFree,
          body: ch.body,
        });
      }

      // Novel 2: بائع الخرائط القديمة
      const novel2Ref = doc(db, 'novels', 'novel_2');
      const novel2Data: Omit<Novel, 'id'> = {
        title: 'بائع الخرائط القديمة',
        titleEn: 'The Ancient Map Seller',
        author: 'يوسف مراد',
        authorEn: 'Youssef Murad',
        genre: 'غموض',
        genreEn: 'Mystery',
        status: 'مستمرة',
        description: 'خريطة واحدة غير مكتملة قادرة على تغيير مسار التاريخ، ورجل يقضي حياته باحثاً عن جزيرة لم ترسمها الأقمار الصناعية.',
        descriptionEn: 'A single unfinished map with the power to alter the course of history, and a man who spends his lifetime searching for an island no satellite has ever captured.',
        color: '#5b4a48',
        accent: '#c9a57d',
        novelPrice: 40,
        bookPrice: 55,
        freeChapters: 1, // Chapter 1 is free
        chaptersCount: 3,
        published: true,
        featured: true,
        visitorRatingAverage: 0,
        visitorRatingCount: 0,
        ratingDisplayMode: 'visitor',
        ratingsEnabled: true,
        createdAt: serverTimestamp(),
      };
      batch.set(novel2Ref, novel2Data);

      const n2Chapters = [
        {
          id: 'chap_2_1',
          number: 1,
          title: 'دكان في زقاق القناديل',
          titleEn: 'The Shop in Lantern Alley',
          isFree: true,
          published: true,
          body: `لم يكن دكان العم طاهر يبيع ما يحتاجه الناس، بل ما ضاع منهم. بين أكوام الجلد المصقول والملاقط النحاسية، كانت الخرائط تنام في أسطوانات الخيزران كأسرار قديمة.\n\nدخل الشاب الغريب مع غروب الشمس. كانت معطفه مبللاً برذاذ النهر، وعيناه تبحثان عن شيء لا يُقال بالكلمات.\n\nقال بصوت خافت: "أبحث عن خريطة مرسومة عام ١٨٤٢، لمدينة كانت هنا قبل أن تحرقها النيران". رفع العم طاهر نظارته ببطء وابتسم ابتسامة من يعرف أكثر مما ينبغي.`,
        },
        {
          id: 'chap_2_2',
          number: 2,
          title: 'الرمز المحفور في الجلد',
          titleEn: 'The Symbol Engraved in Leather',
          isFree: false,
          published: true,
          body: `أخرج العم طاهر من تحت الخزانة صندوقاً خشبياً محفوراً بنقوش أندلسية. فتحه برفق، فظهرت خريطة مرسومة بحبر أزرق داكن على رقعة جلد غزال.\n\nفي الركن الجنوبي للخريطة، كانت هناك علامة غريبة: بوصلة تشير إلى ثمانية اتجاهات، لكن الإبرة التاسعة كانت تشير نحو الأعلى مباشرة.\n\n"هذه الخريطة لم تُرسم للمسافرين على الأرض"، همس الشيخ. "هذه الخريطة تُرشد إلى ما دفنته العاصفة تحت مجرى النهر القديم".`,
        },
        {
          id: 'chap_2_3',
          number: 3,
          title: 'الرحلة قبل انبلاج الفجر',
          titleEn: 'The Journey Before Dawn',
          isFree: false,
          published: true,
          body: `مع ساعات الفجر الأولى، تحرك القارب الصغير في عتمة الضباب. لم يكن هناك ضوء سوى قنديل زيتي خافت يتأرجح على مقدمة الزورق.\n\nكلما اقتربوا من ملتقى النهرين، كانت مياه النهر تزداد هدوءاً بشكل مريب. أخرج الشاب الخريطة وتحسس الرمز المحفور، فشعر بحرارة تنبعث منه وكأن الحبر كائن حي ينبض بالحياة.`,
        },
      ];

      for (const ch of n2Chapters) {
        const chRef = doc(db, 'novels', 'novel_2', 'chapters', ch.id);
        batch.set(chRef, {
          novelId: 'novel_2',
          number: ch.number,
          title: ch.title,
          titleEn: ch.titleEn,
          isFree: ch.isFree,
          published: ch.published,
          createdAt: serverTimestamp(),
        });
        const contentRef = doc(db, 'chapterContents', ch.id);
        batch.set(contentRef, {
          novelId: 'novel_2',
          isFree: ch.isFree,
          body: ch.body,
        });
      }

      // Plans
      const plans = [
        {
          id: 'plan_companion',
          name: 'رفيق',
          priceMonthly: 35,
          priceYearly: 350,
          description: 'للقراء الشغوفين باكتشاف حكاية جديدة كل أسبوع وقراءة الروايات المستمرة بحرية.',
          active: true,
          featured: false,
          books: ['مرافئ الغياب', 'بائع الخرائط القديمة', 'فصول حصرية مبكرة'],
        },
        {
          id: 'plan_salon',
          name: 'الصالون',
          priceMonthly: 69,
          priceYearly: 690,
          description: 'الوصول غير المحدود لجميع روايات المنصة وقراءة كل الفصول مع تحديثات أسبوعية.',
          active: true,
          featured: true,
          books: ['مرافئ الغياب', 'بائع الخرائط القديمة', 'كل مكتبة حبر الحالية', 'قراءات صوتية حصرية'],
        },
        {
          id: 'plan_library',
          name: 'المكتبة',
          priceMonthly: 120,
          priceYearly: 990,
          description: 'تجربة القراءة الكاملة: وصول شامل لكل الروايات، خصومات على الكتب الرقمية وهدايا.',
          active: true,
          featured: false,
          books: ['وصول دائم وشامل', 'نسخ رقمية PDF و EPUB', 'مشاركة مجتمعية ونادي القراءة'],
        },
      ];

      for (const plan of plans) {
        batch.set(doc(db, 'plans', plan.id), plan);
      }

      // Sample Coupon
      const couponRef = doc(db, 'coupons', 'HEBR20');
      batch.set(couponRef, {
        code: 'HEBR20',
        type: 'percent',
        value: 20,
        active: true,
        expiresAt: null,
        maxUses: 100,
        usedCount: 0,
      });

      // Site settings
      const settingsRef = doc(db, 'settings', 'site');
      batch.set(settingsRef, {
        siteName: 'حَبْر',
        logoText: 'منصة الحكايات',
        vodafoneCashNumber: '01012345678',
        instapayHandle: 'habr@instapay',
        paymentInstructions: 'يرجى تحويل المبلغ المطلوب إلى رقم فودافون كاش أو عنوان إنستاباي الموضحين أعلاه، ثم إرفاق صورة واضحة من إيصال التحويل لإتمام تأكيد الطلب فوراً.',
        contactEmail: 'contact@habr-novels.com',
      });

      await batch.commit();

      // Automatically build catalog/home document and chaptersSummary
      await novelService.rebuildCatalogAndSummaries();

      return { success: true, message: 'تمت تهيئة الروايات والفصول والخطط وبناء الفهرس بنجاح!' };
    } catch (err: unknown) {
      console.error('Seed error:', err);
      const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
      return { success: false, message: `فشلت التهيئة: ${msg}` };
    }
  },
};
