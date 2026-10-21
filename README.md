# 🍉 PuzzleCraft - Çok Oyunculu Canlı Puzzle Web Uygulaması

React 19 + TypeScript + Vite ile geliştirilmiş, **WatermelonUI & shadcn** tasarım felsefesine sahip, **Vercel** uyumlu ve tamamen gerçek zamanlı çok oyunculu puzzle platformu.

---

## ✨ Özellikler

### 1. 👥 Gerçek Zamanlı Çok Oyunculu Deneyim (Multiplayer)
* **Canlı İmleç Takibi (Remote Cursors)**:
  * Masadaki diğer tüm oyuncuların fare/dokunma hareketlerini, seçtikleri renk ve takma adlarıyla anlık (60fps) olarak izleyin.
  * Tahta koordinatları normalize edildiği için farklı ekran çözünürlükleri (PC, tablet, mobil) arasında imleçler birebir aynı noktayı gösterir.
  * Kimin hangi parçayı eline alıp taşıdığı parça üzerinde ve imleç rozetinde anlık olarak gösterilir.
* **Renk & Nickname Çakışma Önleme (Collision Prevention)**:
  * Her oyuncu 10 canlı renkten (Karpuz Kırmızısı, Nane Yeşili, Canlı Mango, Neon Menekşe vb.) birini ve bir takma ad seçer.
  * Odaya girerken veya profil değiştirirken, odadaki başka biri o rengi veya ismi zaten almışsa sistem anında sesli ve görsel uyarı verir; çakışan seçim kilitlenir.
* **Çift Katmanlı Ağ Mimarisi (PeerJS WebRTC + BroadcastChannel)**:
  * **BroadcastChannel**: Aynı bilgisayarda iki sekme/pencere açtığınızda internet bile gerekmeden anında sıfır gecikmeli senkronizasyon.
  * **PeerJS (WebRTC)**: Farklı cihazlar (telefon, tablet, arkadaşınızın bilgisayarı) arasında oda kodu veya davet linkiyle P2P doğrudan bağlantı.
  * Vercel üzerinde hiçbir WebSocket sunucusu veya arka uç maliyeti gerektirmez.

### 2. 🧩 Gerçekçi Jigsaw Puzzle Kesim Motoru
* Standart kareler yerine, **Bezier eğrileriyle matematiksel olarak hesaplanan gerçek interlocking tırnaklar ve oyuklar (tabs & blanks)**.
* Mıknatıslı yapışma (Magnetic snap): Parça doğru konumuna yaklaştığında tatmin edici tık sesiyle yerine kilitlenir.
* Web Audio API ile sıfır harici dosya gecikmesiyle üretilen net tık, snap ve zafer melodisi ses efektleri.

### 3. 🖼️ 10 Adet Seçkin Sanat & Doğa Başyapıtı
1. **Vincent van Gogh** - Yıldızlı Gece (1889)
2. **Leonardo da Vinci** - Mona Lisa (1503)
3. **Katsushika Hokusai** - Kanagawa Açıklarında Büyük Dalga (1831)
4. **Johannes Vermeer** - İnci Küpeli Kız (1665)
5. **Sandro Botticelli** - Venüs'ün Doğuşu (1485)
6. **İsviçre Alpleri** - Oeschinensee Zümrüt Dağ Gölü
7. **Amalfi Kıyıları** - Positano Akdeniz Evleri
8. **Kyoto, Japonya** - Kiraz Çiçekleri ve Fuji Dağı
9. **Hırvatistan** - Altın Sonbahar & Plitvice Şelalesi
10. **Venedik** - Büyük Kanal Gün Batımı

### 4. ➕ "Yeni Puzzle Ekle" Modülü
* Cihazınızdan istediğiniz görseli yükleyin (Sürükle & Bırak veya Dosya Seç).
* Doğrudan internetten bir görsel linki yapıştırın.
* Parça sayısını seçin:
  * **12 Parça** (3x4) - Hızlı & Kolay
  * **24 Parça** (4x6) - Dengeli & Keyifli
  * **48 Parça** (6x8) - Meydan Okuma
  * **96 Parça** (8x12) - Usta Seviye

### 5. 🎨 Canlı & Neşeli Arayüz (WatermelonUI)
* Karpuz kırmızısı, nane yeşili, canlı mango ve okyanus turkuazı tonları.
* Cam efekti (glassmorphism), yumuşak kartlar ve neşeli animasyonlar.
* İpucu (Hayalet Resim) modu, parça sayacı, canlı kronometre, konfeti kutlaması ve oyuncu liderlik tablosu.

---

## 🚀 Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın (http://localhost:3000)
npm run dev

# Üretim paketini derleyin
npm run build
```

---

## 🌐 Vercel Dağıtımı (Deployment)

Proje Vercel için tam optimize edilmiştir (`vercel.json` SPA yönlendirmeleri içerir):
1. Projeyi GitHub'a yükleyin.
2. Vercel paneline gidin ve projeyi import edin:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. "Deploy" butonuna basın. Uygulamanız anında yayında!
