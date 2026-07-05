# BLIND

Mobil uyumlu, çok oyunculu BLIND kart oyunu prototipi.

## Teknolojiler

- Next.js 15
- TypeScript
- Firebase Firestore
- Tailwind CSS 4

## Kurulum

### 1. Bağımlılıkları yükle

```bash
cd C:\Users\ENKA\Desktop\BLIND
npm install
```

### 2. Firebase projesi oluştur

1. [Firebase Console](https://console.firebase.google.com/) üzerinden yeni proje açın
2. **Firestore Database** oluşturun (test modunda başlayabilirsiniz)
3. **Project settings > General** altından web uygulaması ekleyin
4. Yapılandırma değerlerini kopyalayın

### 3. Ortam değişkenleri

`.env.local.example` dosyasını `.env.local` olarak kopyalayın ve Firebase değerlerini doldurun:

```bash
copy .env.local.example .env.local
```

### 4. Firestore kuralları (prototip)

Firebase Console > Firestore > Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true;
      match /players/{playerId} {
        allow read, write: if true;
      }
    }
  }
}
```

> Prototip için açık kurallar kullanıldı. Canlıya almadan önce güvenlik kurallarını sıkılaştırın.

### 5. Geliştirme sunucusunu başlat

```bash
npm run dev
```

Tarayıcıda açın: [http://localhost:3000](http://localhost:3000)

Telefondan test için bilgisayarınızın yerel IP adresini kullanın: `http://192.168.x.x:3000`

## İnternete yayınla (telefondan her yerden oyna)

Şu an oyun sadece bilgisayarın açıkken ve aynı Wi‑Fi'deyken çalışır. **Her yerden** oynamak için siteyi internete yüklemen gerekir. Veritabanı (Firebase) zaten internette; sadece oyun arayüzünü yayınlıyorsun.

### En kolay yol: Vercel (ücretsiz)

1. **GitHub hesabı aç** — https://github.com
2. **Yeni repo oluştur** (ör. `blind-game`)
3. Bilgisayarda proje klasöründe terminal:

```powershell
cd C:\Users\ENKA\Desktop\BLIND
git init
git add .
git commit -m "BLIND oyun prototipi"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/blind-game.git
git push -u origin main
```

4. **https://vercel.com** → GitHub ile giriş → **Add New Project**
5. `blind-game` reposunu seç → **Import**
6. **Environment Variables** bölümüne `.env.local` dosyandaki 6 satırı ekle (aynı isimlerle)
7. **Deploy** de — 1–2 dakika sonra link verir: `https://blind-game-xxx.vercel.app`

8. **Firebase'de domain ekle:**
   - Firebase Console → ⚙️ Project settings → **Authorized domains**
   - **Add domain** → Vercel linkindeki adresi ekle (ör. `blind-game-xxx.vercel.app`)

9. Telefonda bu linki aç — **Wi‑Fi şart değil**, istediğin zaman oynarsın.

### Günlük kullanım

| Ne | Nasıl |
|----|--------|
| Oyna | Telefonda Vercel linkini aç |
| Bilgisayar kapalı | Sorun yok — site Vercel'de çalışır |
| Yerel test | İstersen hâlâ `npm.cmd run dev` kullanabilirsin |

> **Not:** Firebase test modu 30 gün sonra kapanır. Uzun süre kullanacaksan Firestore kurallarını güncellemen gerekir.


## Oyun Akışı

1. Ana ekranda adınızı girin
2. **Oda Kur** veya oda koduyla **Odaya Katıl**
3. Oda ekranında kodu paylaşın, kurucu **Oyunu Başlat** der
4. Sırası gelen oyuncu iddia verir (adet + rütbe) veya **Aç** der
5. Açılınca tüm kartlar görünür; sayıma göre kaybeden belirlenir
6. Kaybeden +1 kart alır; 6 kartta tekrar kaybederse **BLIND** olur
7. BLIND iken kaybederse elenir; tek oyuncu kalınca oyun biter

## Proje Yapısı

```
src/
  app/           # Sayfalar (ana, oda, oyun)
  components/    # UI bileşenleri
  lib/           # Firebase, oyun mantığı, tipler
```
