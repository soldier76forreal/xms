// What changed, newest first — and the ONE place the app's version lives.
//
// APP_VERSION is read off the first entry, so the number on screen and the
// number in the history cannot disagree. To release: add an entry at the TOP,
// and bump "version" in api/package.json to match (the server reports its own).
//
// Write for the people who USE the app, not the people who build it: what they
// can now do, not which file changed. Each text is written in all three
// languages; a missing one falls back to English.
//
// The version numbers before 1.7.0 were assigned in hindsight, from the dates
// each group of work shipped — there was no versioning before this page.
//
// type: 'new' | 'improved' | 'fixed'
export const CHANGELOG = [
  {
    version: '1.7.1',
    date: '2026-10-17',
    changes: [
      {
        type: 'new',
        text: {
          en: 'Report & Info: edit a report you sent while it is still Open — change the text, add or remove files and voice notes — and delete reports you no longer need.',
          ar: 'الإبلاغ والمعلومات: عدّل بلاغًا أرسلته ما دام مفتوحًا — غيّر النص وأضف الملفات والمذكرات الصوتية أو أزلها — واحذف البلاغات التي لم تعد بحاجة إليها.',
          fa: 'گزارش و اطلاعات: گزارشی را که فرستاده‌اید تا وقتی «باز» است ویرایش کنید — متن را عوض کنید، فایل و پیام صوتی اضافه یا حذف کنید — و گزارش‌هایی را که دیگر لازم ندارید حذف کنید.',
        },
      },
      {
        type: 'new',
        text: {
          en: 'You are now notified when the status of your report changes or someone answers it, and the answer is shown on the report itself.',
          ar: 'يصلك الآن إشعار عند تغيّر حالة بلاغك أو عند الردّ عليه، ويظهر الردّ على البلاغ نفسه.',
          fa: 'اکنون وقتی وضعیت گزارش شما تغییر کند یا کسی به آن پاسخ دهد اعلان می‌گیرید و پاسخ روی خود گزارش دیده می‌شود.',
        },
      },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-10-17',
    changes: [
      {
        type: 'new',
        text: {
          en: 'Report & Info: see the app version, every section and what changed recently — and report a bug or suggest an idea with text, a voice note and files, then follow its status.',
          ar: 'الإبلاغ والمعلومات: اطّلع على إصدار التطبيق وكل الأقسام وآخر التغييرات، وأبلغ عن مشكلة أو اقترح فكرة بالنص أو بمذكرة صوتية أو بملفات، ثم تابع حالتها.',
          fa: 'گزارش و اطلاعات: نسخهٔ برنامه، همهٔ بخش‌ها و تازه‌ترین تغییرات را ببینید؛ مشکلی را گزارش دهید یا پیشنهادی بدهید (با متن، پیام صوتی و فایل) و وضعیتش را دنبال کنید.',
        },
      },
      {
        type: 'new',
        text: {
          en: 'Digital Marketing keeps an unsent draft of your upload form. If the page closes or crashes, pick up where you left off — and a Reset button clears the form.',
          ar: 'يحتفظ التسويق الرقمي بمسودة غير مُرسلة لنموذج الرفع. إن أُغلقت الصفحة أو تعطّلت فتابع من حيث توقفت، وزر «إعادة تعيين» يمسح النموذج.',
          fa: 'بازاریابی دیجیتال از فرم بارگذاری شما یک پیش‌نویس ارسال‌نشده نگه می‌دارد. اگر صفحه بسته شود یا خراب شود، از همان‌جا ادامه دهید؛ دکمهٔ «بازنشانی» هم فرم را پاک می‌کند.',
        },
      },
      {
        type: 'improved',
        text: {
          en: 'When an upload is refused, the message now says why — for example, that the file is larger than the server accepts.',
          ar: 'عند رفض أي رفع، توضّح الرسالة الآن السبب — مثلًا أن الملف أكبر مما يقبله الخادم.',
          fa: 'وقتی بارگذاری رد می‌شود، پیام اکنون دلیلش را می‌گوید؛ مثلاً اینکه فایل از حدِ پذیرش سرور بزرگ‌تر است.',
        },
      },
      {
        type: 'improved',
        text: {
          en: 'Pallet and stone-size fields are easier to read and type in, on phones and computers alike.',
          ar: 'أصبحت حقول المشاحنات وأبعاد الحجر أسهل في القراءة والكتابة على الهواتف وأجهزة الكمبيوتر.',
          fa: 'فیلدهای پالت و ابعاد سنگ هم روی گوشی و هم روی کامپیوتر خواناتر و راحت‌تر قابل تایپ شده‌اند.',
        },
      },
      {
        type: 'fixed',
        text: {
          en: 'Photos and videos now show up in Digital Marketing raw contents, and opening a draft that held a very large file no longer fails.',
          ar: 'تظهر الصور ومقاطع الفيديو الآن في المحتوى الخام بالتسويق الرقمي، ولم يعد فتح مسودة تحتوي على ملف كبير جدًا يفشل.',
          fa: 'عکس‌ها و ویدیوها اکنون در محتوای خام بازاریابی دیجیتال دیده می‌شوند و باز کردن پیش‌نویسی که فایل بسیار بزرگ دارد دیگر خطا نمی‌دهد.',
        },
      },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-10-14',
    changes: [
      {
        type: 'new',
        text: {
          en: 'A daily report form for each role. Salespeople get their own sheet — customers from the CRM, stone codes from Inventory, content from Digital Marketing — saved as you type and printable in Arabic, English or Farsi.',
          ar: 'نموذج تقرير يومي لكل دور. يحصل مندوبو المبيعات على ورقتهم الخاصة — العملاء من إدارة العملاء، وأكواد الحجر من المخزون، والمحتوى من التسويق الرقمي — تُحفظ أثناء الكتابة ويمكن طباعتها بالعربية أو الإنجليزية أو الفارسية.',
          fa: 'فرم گزارش روزانه برای هر نقش. فروشندگان برگهٔ مخصوص خودشان را دارند — مشتریان از بخش مشتریان، کد سنگ از انبار، محتوا از بازاریابی دیجیتال — که هنگام تایپ ذخیره می‌شود و به فارسی، عربی یا انگلیسی قابل چاپ است.',
        },
      },
      {
        type: 'fixed',
        text: {
          en: 'Customers added without a branch are visible again in the customer list.',
          ar: 'عاد ظهور العملاء الذين أُضيفوا دون فرع في قائمة العملاء.',
          fa: 'مشتریانی که بدون شعبه اضافه شده‌اند دوباره در فهرست مشتریان دیده می‌شوند.',
        },
      },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-10-07',
    changes: [
      {
        type: 'new',
        text: {
          en: 'Website price requests become expiring offers: priced in Invoices, e-mailed to the customer, accepted on the website, and turned into an invoice.',
          ar: 'أصبحت طلبات الأسعار من الموقع عروضًا ذات مدة محدودة: تُسعَّر في الفواتير، وتُرسل بالبريد إلى العميل، ويقبلها على الموقع، وتتحول إلى فاتورة.',
          fa: 'درخواست‌های قیمت از وب‌سایت به پیشنهادهای دارای مهلت تبدیل شد: در فاکتورها قیمت‌گذاری می‌شود، با ایمیل برای مشتری می‌رود، مشتری در وب‌سایت می‌پذیرد و به فاکتور تبدیل می‌شود.',
        },
      },
      {
        type: 'new',
        text: {
          en: 'Find a stone variety by its specification — quality, size, cut and finish — in invoices, stock requests, supply and packing lists.',
          ar: 'ابحث عن صنف الحجر بمواصفاته — الجودة والمقاس والقطع والتشطيب — في الفواتير وطلبات المخزون والتوريد وقوائم التعبئة.',
          fa: 'تنوع سنگ را با مشخصاتش — کیفیت، اندازه، برش و پرداخت — در فاکتورها، درخواست‌های انبار، تأمین و لیست‌های بسته‌بندی پیدا کنید.',
        },
      },
      {
        type: 'improved',
        text: {
          en: 'The product page editor shows the real website page as you type, with a proper image gallery manager.',
          ar: 'يعرض محرر صفحة المنتج صفحة الموقع الحقيقية أثناء الكتابة، مع مدير معرض صور متكامل.',
          fa: 'ویرایشگر صفحهٔ محصول هنگام تایپ، صفحهٔ واقعی وب‌سایت را نشان می‌دهد و مدیریت گالری تصاویر هم دارد.',
        },
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-10-03',
    changes: [
      {
        type: 'new',
        text: {
          en: 'Branches can share their inventory with other branches (read-only) and receive stock requests.',
          ar: 'يمكن للفروع مشاركة مخزونها مع فروع أخرى (للعرض فقط) واستقبال طلبات المخزون.',
          fa: 'شعبه‌ها می‌توانند انبار خود را (فقط برای مشاهده) با شعبه‌های دیگر به اشتراک بگذارند و درخواست موجودی دریافت کنند.',
        },
      },
      {
        type: 'new',
        text: {
          en: 'Accepting a quotation now reserves the stone, and paying an invoice takes it out of stock.',
          ar: 'قبول عرض السعر يحجز الحجر الآن، ودفع الفاتورة يخرجه من المخزون.',
          fa: 'پذیرفتن پیش‌فاکتور اکنون سنگ را رزرو می‌کند و پرداخت فاکتور آن را از انبار خارج می‌کند.',
        },
      },
      {
        type: 'improved',
        text: {
          en: 'Sign in with your phone number and password.',
          ar: 'سجّل الدخول برقم هاتفك وكلمة المرور.',
          fa: 'با شماره تلفن و رمز عبور وارد شوید.',
        },
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-09-26',
    changes: [
      {
        type: 'new',
        text: {
          en: 'Supply: follow a stone coupe from purchase, through processing, to finished product.',
          ar: 'التوريد: تابع كتلة الحجر من الشراء، مرورًا بالمعالجة، حتى المنتج النهائي.',
          fa: 'تأمین: یک قواره سنگ را از خرید، در طول فرآوری، تا محصول نهایی دنبال کنید.',
        },
      },
      {
        type: 'new',
        text: {
          en: 'Inter-branch quotations: one branch can quote against another branch’s inventory or supply.',
          ar: 'عروض أسعار بين الفروع: يمكن لفرع أن يُسعّر من مخزون فرع آخر أو من توريده.',
          fa: 'پیش‌فاکتور بین شعبه‌ها: یک شعبه می‌تواند بر اساس انبار یا تأمین شعبهٔ دیگر پیش‌فاکتور بدهد.',
        },
      },
      {
        type: 'new',
        text: {
          en: 'Packing lists are their own section now, with printable pallet labels.',
          ar: 'أصبحت قوائم التعبئة قسمًا مستقلًا، مع ملصقات مشاحنات قابلة للطباعة.',
          fa: 'لیست‌های بسته‌بندی اکنون بخش مستقل دارند و برچسب پالت قابل چاپ هم دارند.',
        },
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-08-28',
    changes: [
      {
        type: 'new',
        text: {
          en: 'Tutorials: short videos, images and steps for every part of the app, with a help button inside each section.',
          ar: 'الدروس التعليمية: مقاطع فيديو وصور وخطوات قصيرة لكل جزء من التطبيق، مع زر مساعدة داخل كل قسم.',
          fa: 'آموزش‌ها: ویدیو، تصویر و مراحل کوتاه برای هر بخش برنامه، با دکمهٔ راهنما در هر بخش.',
        },
      },
      {
        type: 'new',
        text: {
          en: 'Digital Marketing: link pages you can share with customers, and WhatsApp Share with messages in several languages and a history of what was sent.',
          ar: 'التسويق الرقمي: صفحات روابط يمكن مشاركتها مع العملاء، ومشاركة واتساب برسائل بعدة لغات وسجل بما أُرسل.',
          fa: 'بازاریابی دیجیتال: صفحات پیوند برای اشتراک با مشتریان، و اشتراک‌گذاری واتس‌اپ با پیام چندزبانه و تاریخچهٔ آنچه فرستاده شده.',
        },
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-07-24',
    changes: [
      {
        type: 'new',
        text: {
          en: 'The whole app in English, Farsi and Arabic — switch language from the side menu.',
          ar: 'التطبيق كاملًا بالعربية والإنجليزية والفارسية — بدّل اللغة من القائمة الجانبية.',
          fa: 'کل برنامه به فارسی، عربی و انگلیسی — زبان را از منوی کناری عوض کنید.',
        },
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-12',
    changes: [
      {
        type: 'new',
        text: {
          en: 'First release: Customers, Invoices, Inventory, Files, People and Digital Marketing.',
          ar: 'الإصدار الأول: العملاء والفواتير والمخزون والملفات والمستخدمون والتسويق الرقمي.',
          fa: 'نخستین نسخه: مشتریان، فاکتورها، انبار، فایل‌ها، کاربران و بازاریابی دیجیتال.',
        },
      },
    ],
  },
];

export const APP_VERSION = CHANGELOG[0].version;
export const APP_RELEASED = CHANGELOG[0].date;

// A change's text in the person's language, English if it was never written.
export const changeText = (change, language) => (change.text && (change.text[language] || change.text.en)) || '';
