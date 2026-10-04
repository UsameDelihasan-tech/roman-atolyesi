# Roman Atölyesi v2

Telefon için kurulabilir PWA roman yazma uygulaması.

## v2 ile gelenler
- Android ana ekranına uygulama olarak kurulabilme
- 192x192 ve 512x512 uygulama ikonları
- Android için maskable/adaptive ikon
- Uygulama içinden “Uygulamayı kur” düğmesi
- GitHub'daki yeni sürümleri yeniden APK kurmadan alma
- Çevrimdışı açılabilme
- Mevcut roman verilerini aynı localStorage anahtarıyla koruma

## Güncelleme mantığı
Kod GitHub Pages'a yeni sürüm olarak yüklendiğinde uygulama çevrimiçiyken
en yeni dosyaları alır. Yazılan roman metinleri GitHub'a gönderilmez; cihazda tutulur.

Önemli: Tarayıcı/uygulama verileri tamamen silinirse yerel roman verileri de silinebilir.
Bu nedenle düzenli olarak TXT dışa aktarımıyla yedek alın.
