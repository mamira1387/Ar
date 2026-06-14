# 🎮 Telegram Game Bot - بات بازی تلگرام

بات تلگرام حرفه‌ای برای بازی‌های شرط‌بندی با Mini App و سیستم پول پیشرفته

## ✨ ویژگی‌ها

### 🎯 بازی‌های موجود:
- 🎰 **Slots** - بازی اسلات با ضریب‌های مختلف
- 💥 **Crash** - بازی کرش با رشد ضریب
- 💣 **Bomb** - بازی بمب (Minesweeper)
- 🏟️ **Arena (PVP)** - بازی چند نفره با گردونه شانس

### 💰 سیستم پول:
- ⭐ **Telegram Stars** 
- 💎 **TON Blockchain**
- 🪙 **Coins** (درون‌بازی - بدون قیمت)
- 🎁 **NFT Gifts** (کلکسیونی - Telegram Collectibles)

### ⚙️ مدیریت ادمین:
- 📊 Dashboard کامل
- ⚡ تنظیم قیمت‌های بازی
- 🔐 حداقل مبلغ برداشت
- 📈 درصد مالیات 1% خودکار
- 🖥️ cPanel Integration

### 🎨 UI/UX:
- رابط کاربری حرفه‌ای و جذاب
- Telegram Mini App
- Dashboard مدیریت ادمین
- سپورت زبان فارسی

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها:
- Node.js >= 18
- npm یا yarn
- Telegram Bot Token
- TON Wallet (اختیاری)

### مراحل نصب:

```bash
git clone https://github.com/mamira1387/Ar.git
cd Ar
npm install
```

### تنظیم متغیرهای محیطی:

```bash
cp .env.example .env
```

ویرایش `.env` و تنظیم:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_MINI_APP_URL=https://yourdomain.com/mini-app
ADMIN_IDS=123456789,987654321
MIN_WITHDRAW=1000
TAX_PERCENT=1
DATABASE_URL=mongodb://...
```

### اجرا:

```bash
npm start
```

## 📋 قیمت‌های پیش‌فرض

| بازی | سطح | قیمت | جایزه |
|-----|------|------|-------|
| Slots | سطح 1 | 1,000 | 5x-100x |
| Crash | سطح 1 | 1,000 | 2x-50x |
| Bomb | سطح 1 | 1,000 | 2x-10x |
| Arena | سطح 1 | 1,000 | حسب تعداد |

## 🎮 نحوه بازی

### Slots:
1. شرط‌بندی کنید
2. گردونه را بچرخانید
3. جایزه دریافت کنید

### Crash:
1. شرط‌بندی کنید
2. کاش کردن را انتخاب کنید
3. جایزه = شرط × ضریب

### Bomb:
1. میدان را انتخاب کنید
2. بمب‌ها را پیدا نکنید
3. هرچه بیشتر امن باشید، جایزه بیشتر

### Arena (PVP):
1. 2 نفر شرط‌بندی کنند
2. 20 ثانیه بعد بازی شروع
3. گردونه می‌چرخد و برنده به‌صورت تصادفی انتخاب می‌شود
4. برنده تمام پول بانک را می‌برد

## 📱 API Endpoints

### بازی:
- `POST /api/games/slots/play` - بازی اسلات
- `POST /api/games/crash/play` - بازی کرش
- `POST /api/games/bomb/play` - بازی بمب
- `POST /api/games/arena/join` - پیوستن به Arena
- `POST /api/games/arena/spin` - چرخاندن گردونه

### کاربر:
- `GET /api/user/balance` - دریافت موجودی
- `POST /api/user/withdraw` - درخواست برداشت
- `GET /api/user/history` - تاریخچه بازی

### مدیریت:
- `GET /api/admin/stats` - آمار سایت
- `POST /api/admin/settings` - تنظیمات
- `GET /api/admin/users` - لیست کاربران

## 🔧 معماری پروژه

```
telegram-game-bot/
├── config/              # تنظیمات
├── models/              # مدل‌های Database
├── routes/              # مسیرهای API
├── games/               # منطق بازی‌ها
│   ├── slots.js
│   ├── crash.js
│   ├── bomb.js
│   └── arena.js
├── middleware/          # Middleware‌های سفارشی
├── public/              # فایل‌های استاتیک
│   └── mini-app/        # Mini App
├── admin/               # پنل ادمین
├── server.js            # فایل اصلی سرور
└── .env.example         # نمونه متغیرهای محیطی
```

## 📊 سیستم مالیات

- هر برداشت: 1% کسر می‌شود
- هر بازی: 1% به خزانه پروژه

## 🔐 امنیت

- توکن‌های JWT برای احراز هویت
- رمزگذاری Bcrypt برای رمزهای عبور
- Rate limiting برای جلوگیری از DDoS
- Telegram User ID Verification

## 📞 پشتیبانی

برای مسائل یا سؤالات:
- 📧 Email: support@example.com
- 🔗 GitHub Issues
- 💬 Telegram: @support_bot

## 📜 لایسنس

ISC

---

**ساخته شده با ❤️ برای جامعه Telegram**
