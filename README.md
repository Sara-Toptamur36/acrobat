# Acrobat – Music Catalog Manager

Müzik kataloğu yönetim uygulaması. Sanatçı, albüm, şarkı, tür, çalma listesi, favori, puanlama/yorum, sosyal takip ve raporlama özellikleri sunar; yönetici paneli içerir.

- **Backend:** Flask 3, SQLAlchemy, JWT (Flask-JWT-Extended), Flask-Migrate
- **Frontend:** React 18, Vite, Tailwind CSS, React Router
- **Veritabanı:** MySQL 8 (şema, trigger, procedure ve view dosyaları `db/` altında)
- **Test:** pytest + Hypothesis (property-based testler)
- **CI:** GitHub Actions (`.github/workflows/ci.yml`)

## Klasör yapısı

```
backend/    Flask API (app/, migrations/, tests/, config.py)
frontend/   React uygulaması (src/)
db/         schema.sql, triggers.sql, procedures.sql, views.sql, seed.sql
docker-compose.yml        MySQL + backend + frontend
docker-compose.test.yml   Test veritabanı
*.ps1                     Windows yardımcı scriptleri (başlatma, tanılama)
```

## Hızlı başlangıç (Docker)

Gereksinim: Docker Desktop.

```bash
docker compose up --build
```

| Servis   | Adres                         |
|----------|-------------------------------|
| Frontend | http://localhost:3001         |
| Backend  | http://localhost:5000/api     |
| MySQL    | localhost:3307 (`music_library`) |

İlk açılışta şema ve örnek veri (`db/seed.sql`) otomatik yüklenir.
Docker ortamında varsayılan yönetici hesabı `admin@local` / `Admin123!` olarak oluşturulur. **Sadece geliştirme içindir, canlıda mutlaka değiştirin.**

## Elle kurulum (Docker olmadan)

### 1. Veritabanı

MySQL 8'de bir veritabanı ve kullanıcı oluşturun, ardından `db/` altındaki dosyaları sırayla yükleyin:

```bash
mysql -u <kullanici> -p <veritabani> < db/schema.sql
mysql -u <kullanici> -p <veritabani> < db/triggers.sql
mysql -u <kullanici> -p <veritabani> < db/procedures.sql
mysql -u <kullanici> -p <veritabani> < db/views.sql
mysql -u <kullanici> -p <veritabani> < db/seed.sql   # isteğe bağlı örnek veri
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
```

`backend/.env` dosyasını düzenleyin:

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | `mysql+pymysql://kullanici:sifre@127.0.0.1:3306/veritabani` |
| `TEST_DATABASE_URL` | Testler için ayrı bir veritabanı (gerçek verinizi kullanmayın) |
| `JWT_SECRET_KEY` | Uzun, rastgele bir değer |
| `CORS_ORIGINS` | Frontend adresi, örn. `http://localhost:3001` |
| `CREATE_ADMIN_USER` | `True` ise ilk açılışta yönetici hesabı oluşturur |
| `ADMIN_EMAIL` / `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Yönetici bilgileri |

```bash
python app.py                   # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env          # VITE_API_BASE_URL değerini backend adresine göre ayarlayın
npm run dev
```

Windows'ta `start-backend.ps1`, `start-frontend.ps1` ve `start-all.ps1` scriptleri bu adımları otomatikleştirir.

## Testler

```bash
cd backend
python -m pytest tests/ -v
python -m pytest tests/ -m property      # sadece property-based testler
python -m pytest tests/ -m integration   # sadece entegrasyon testleri
```

`TEST_DATABASE_URL` tanımlı olmalıdır (yerelde `backend/.env`, CI'da workflow ortam değişkenleri).

## FMA veri seti (isteğe bağlı)

Katalog, [Free Music Archive](https://github.com/mdeff/fma) veri setinden doldurulabilir. Veri dosyaları çok büyük olduğu için (GB'larca) bu repoda **yoktur**; gerekirse `backend/` klasöründe şu sırayla indirilir:

```bash
cd backend
python setup_fma.py     # fma_metadata.zip indirir, tracks/genres/features CSV'lerini çıkarır
# fma_small.zip (~7 GB, ses dosyaları) için https://github.com/mdeff/fma adresinden indirip backend/ içine koyun
python setup_audio.py   # fma_small.zip'i açar
python import_fma.py    # ilk 500 şarkıyı veritabanına aktarır
```

`backend/static/uploads/` altındaki yüklenen görseller ve ses dosyaları da repoya dahil değildir; uygulama çalışırken oluşur.

## Güvenlik notları

- `.env` dosyaları repoya eklenmez; yalnızca `.env.example` şablonları vardır.
- Canlı ortamda `JWT_SECRET_KEY`, `SECRET_KEY`, veritabanı ve yönetici şifrelerini mutlaka değiştirin.
- Canlıda `CORS_ORIGINS` değerini `*` yapmayın.
