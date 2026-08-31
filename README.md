# Rayan Logistics

نظام ويب متكامل لإدارة الأصول والموظفين والعهد والجرد والصيانة داخل المؤسسات والمنظمات، مبني على PostgreSQL وReact وNode.js.

> المشروع في مرحلة تطوير نشطة. فرع `main` يحتوي الأساس المستقر، بينما يجري تطوير معالج الإعداد الأول في الفرع `feature/first-run-setup`.

## نظرة عامة

يوفر Rayan Logistics منصة موحدة لتنظيم دورة حياة الأصول، من تسجيل الأصل واستلامه وحتى تسليمه لموظف، نقله، جرده، صيانته أو التصرف به.

أهم الوظائف الحالية:

- إدارة الأصول وتصنيفاتها وأرقامها التسلسلية.
- إدارة الموظفين وربط العهد بكل موظف.
- تسجيل تسليم الأصول واستردادها ونقلها.
- إدارة جلسات الجرد ونتائج المطابقة.
- متابعة طلبات الصيانة والإصلاح.
- إدارة المكاتب والأقسام والمواقع.
- تسجيل المانحين ومراكز التكلفة.
- استيراد بيانات الأصول والموظفين من Excel.
- نظام مستخدمين وأدوار وصلاحيات.
- سجل تدقيق للعمليات الحساسة.
- لوحة مؤشرات تشغيلية.
- حذف آمن للبيانات التشغيلية مع إبقاء حساب المدير وبنية النظام.

## التقنيات المستخدمة

### الواجهة الأمامية

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Hook Form
- Zod
- Lucide React

### الخادم

- Node.js
- Express
- TypeScript
- JWT
- bcryptjs
- Helmet
- CORS
- Rate Limiting

### قاعدة البيانات

- PostgreSQL
- مكتبة `pg`
- SQL migrations مستقلة
- UUID للمفاتيح الأساسية التشغيلية
- معاملات وقواعد تكامل وفهارس PostgreSQL

## متطلبات التشغيل

- Node.js 20 أو أحدث
- npm
- PostgreSQL 17 أو أحدث
- Git، اختياري للتطوير والتحديث

## تشغيل المشروع حاليًا

### 1. تنزيل المشروع

```powershell
git clone https://github.com/bader913/rayan-logistics.git
cd rayan-logistics
```

للاطلاع على معالج الإعداد الجاري تطويره:

```powershell
git switch feature/first-run-setup
```

### 2. تثبيت الاعتماديات

```powershell
npm install
```

### 3. إعداد متغيرات البيئة

انسخ ملف المثال:

```powershell
Copy-Item .env.example .env
```

ثم عدل `.env` وفق إعداد PostgreSQL المحلي:

```dotenv
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

DATABASE_URL=
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rayan_logistics
DB_USER=postgres
DB_PASSWORD=CHANGE_ME
DB_SSL=false
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT_MS=30000

JWT_SECRET=CHANGE_TO_A_LONG_RANDOM_VALUE
JWT_EXPIRES_IN=7d
COOKIE_SECRET=CHANGE_TO_ANOTHER_RANDOM_VALUE

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.local
ADMIN_PASSWORD=CHANGE_TO_A_STRONG_PASSWORD
```

لا تضف ملف `.env` إلى Git.

### 4. إنشاء قاعدة البيانات

يمكن إنشاء قاعدة البيانات باستخدام PostgreSQL:

```sql
CREATE DATABASE rayan_logistics
  WITH
  OWNER = postgres
  ENCODING = 'UTF8'
  TEMPLATE = template0;
```

### 5. تنفيذ ملفات الترحيل

لعرض الحالة:

```powershell
npm run migrate:status
```

لتنفيذ الملفات الجديدة:

```powershell
npm run migrate
```

### 6. تثبيت الأدوار الأساسية

```powershell
npm run seed
```

الـ Seed الحالي آمن للإنتاج. يثبت أدوار النظام فقط ولا يضيف أصولًا أو موظفين أو مستخدمين تجريبيين.

### 7. إنشاء حساب المدير

```powershell
npm run create:admin
```

يقرأ الأمر معلومات المدير من متغيرات البيئة:

- `ADMIN_USERNAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### 8. تشغيل النظام

```powershell
npm run dev
```

ثم افتح:

```text
http://localhost:3000
```

## معالج الإعداد الأول

يجري تطوير معالج إعداد موجه للمستخدم غير التقني في الفرع:

```text
feature/first-run-setup
```

يهدف المعالج إلى تنفيذ الخطوات التالية من واجهة رسومية:

1. إدخال عنوان PostgreSQL والمنفذ واسم المستخدم وكلمة المرور.
2. اختبار الاتصال برسائل مبسطة.
3. إنشاء قاعدة البيانات إذا لم تكن موجودة.
4. تنفيذ migrations بالترتيب.
5. إنشاء أول حساب مدير عام.
6. حفظ إعداد الاتصال محليًا على الخادم.
7. الانتقال إلى شاشة تسجيل الدخول.

تخزن إعدادات الخادم المحلية في:

```text
data/server-config.json
```

المجلد `data/` مستثنى من Git.

> حتى اكتمال دمج المعالج واختباره، استخدم خطوات الإعداد اليدوي الموضحة أعلاه للتشغيل المستقر.

## نظام Migrations

ملفات الترحيل موجودة في:

```text
database/migrations/
```

التسلسل الحالي يصل إلى:

```text
020_add_employees_soft_delete.sql
```

### القاعدة الأساسية

بعد تنفيذ أي migration على قاعدة بيانات، يمنع تعديل الملف القديم. أي تعديل جديد يجب أن يضاف في ملف جديد، مثل:

```text
021_add_new_feature.sql
022_update_asset_rules.sql
```

محرك الترحيل يدعم:

- ترتيب الملفات رقميًا.
- تسجيل الملفات المنفذة في `schema_migrations`.
- حساب SHA-256 لكل ملف.
- اكتشاف تعديل migration قديمة.
- PostgreSQL advisory lock.
- Transaction مستقلة لكل migration.
- عرض الملفات المنفذة والمتبقية.

## أوامر المشروع

```powershell
npm run dev
npm run build
npm start
npm run lint
npm run test
npm run migrate
npm run migrate:status
npm run seed
npm run create:admin
npm run package:zip
```

### وصف الأوامر

- `npm run dev`: تشغيل الخادم وواجهة Vite في وضع التطوير.
- `npm run build`: بناء الواجهة والخادم للإنتاج.
- `npm start`: تشغيل النسخة المبنية من `dist/server.js`.
- `npm run lint`: فحص TypeScript دون إنشاء ملفات.
- `npm run test`: تشغيل الاختبارات الآلية.
- `npm run migrate`: تنفيذ migrations غير المنفذة.
- `npm run migrate:status`: عرض حالة migrations.
- `npm run seed`: تثبيت الأدوار الأساسية فقط.
- `npm run create:admin`: إنشاء أو تحديث حساب المدير من البيئة.

## البناء للإنتاج

```powershell
npm run build
$env:NODE_ENV = "production"
npm start
```

ناتج الخادم:

```text
dist/server.js
```

يتم بناء الخادم بصيغة ESM بما يتوافق مع إعداد المشروع واستخدام `import.meta.url`.

## بنية المشروع

```text
rayan-logistics/
├── database/
│   └── migrations/
├── scripts/
├── server/
│   ├── config/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── setup/
│   └── utils/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   └── types/
├── data/                  # إعداد محلي، غير متتبع في Git
├── public/
├── server.ts
├── package.json
└── README.md
```

## أهم جداول قاعدة البيانات

- `roles`
- `users`
- `offices`
- `departments`
- `locations`
- `employees`
- `donors`
- `cost_centers`
- `asset_categories`
- `asset_subcategories`
- `assets`
- `asset_assignments`
- `asset_movements`
- `inventory_sessions`
- `inventory_items`
- `maintenance_requests`
- `asset_disposals`
- `asset_documents`
- `audit_logs`
- `import_batches`
- `import_issues`
- `schema_migrations`

## استيراد Excel

النظام مهيأ لاستقبال ملفات تحتوي أوراقًا باسم:

```text
Assets
EMP
```

تدفق الاستيراد المقترح:

1. رفع الملف.
2. المعاينة والتحقق.
3. مراجعة التحذيرات والأخطاء.
4. تثبيت الاستيراد.
5. مراجعة نتائج `import_batches` و`import_issues`.

لا ترفع ملفات Excel الحقيقية أو المستندات الداخلية إلى GitHub.

## مسح البيانات التشغيلية

يوفر النظام صفحة إدارية لمسح البيانات التشغيلية مع إبقاء:

- حساب المدير الحالي.
- الأدوار.
- الجداول والفهارس.
- سجل migrations.

تتطلب العملية:

- دور `ADMIN`.
- كلمة مرور المدير الحالية.
- كتابة عبارة التأكيد:

```text
DELETE ALL DATA
```

تنفذ عملية الحذف داخل Transaction وبترتيب يحترم علاقات المفاتيح الخارجية.

## الاختبارات

شغل:

```powershell
npm run test
```

تشمل الاختبارات الحالية:

- توحيد أرقام الأصول.
- توحيد حالات الأصل.
- تحويل تواريخ Excel.
- ترتيب ملفات migration.
- تطابق حالة migrations مع الملفات.
- الاتصال بقاعدة البيانات.
- قابلية جداول الأدوار والأصول للاستعلام حتى عندما تكون قاعدة البيانات التشغيلية فارغة.

## الأمان

- الاستعلامات تستخدم معاملات Parameters.
- كلمات المرور تخزن كـ bcrypt hashes.
- واجهات API محمية بالمصادقة والصلاحيات.
- العمليات الحساسة تسجل في `audit_logs`.
- ملفات البيئة وإعداد الخادم المحلي غير متتبعة في Git.
- لا تستخدم كلمات المرور الافتراضية الموجودة في ملفات الأمثلة للتشغيل الحقيقي.
- لا ترفع المرفقات أو ملفات Excel أو النسخ الاحتياطية إلى المستودع.

## سير عمل Git

المستودع الأساسي:

```text
https://github.com/bader913/rayan-logistics.git
```

الفروع المهمة:

```text
main
feature/first-run-setup
```

نقطة الرجوع قبل معالج الإعداد:

```text
before-first-run-setup
```

للتحديث:

```powershell
git pull origin main
```

أو أثناء تطوير المعالج:

```powershell
git pull origin feature/first-run-setup
```

## استكشاف الأخطاء

### PostgreSQL غير متصل

تحقق من الخدمة:

```powershell
Get-Service *postgres*
```

واختبر الجاهزية:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" -h localhost -p 5432
```

### عرض حالة migrations

```powershell
npm run migrate:status
```

### فشل تسجيل الدخول بعد تغيير كلمة المرور

حدّث حساب المدير:

```powershell
npm run create:admin
```

### فشل البناء

```powershell
npm run lint
npm run test
npm run build
```

## الترخيص والخصوصية

المشروع مخصص حاليًا للاستخدام الخاص. يجب حماية بيانات الموظفين والأصول والمستندات، وعدم نشر ملفات البيانات أو أسرار الاتصال في مستودعات عامة.
