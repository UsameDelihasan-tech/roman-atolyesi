# Roman Atölyesi v4 — Fiziksel Kitap Motoru

Bu sürüm v3 üzerindeki mevcut roman verisini ve `roman_atolyesi_v1` localStorage anahtarını korur.

## Yeni özellikler
- Parmağı takip eden gerçek zamanlı 3D sayfa sürükleme
- Tek sayfa ve çift sayfalı açık kitap düzeni
- Sayfa numarası her kağıdın altında
- Gerçekçi 3D, yumuşak 3D ve düşük maliyetli kaydırma animasyonu
- Fildişi, parşömen, gazete, eski kitap, gece mürekkebi ve temiz kağıt dokuları
- Hafif tekrar eden `paper-grain.png` ile fiziksel kağıt hissi
- Daktilo, kurşun kalem ve mürekkep/dolma kalem yazma sesleri
- Yazma sesi ve ambiyans için ayrı ses seviyeleri
- Gündüz/gece, font, boyut, atmosfer ayarları korunur
- Bölüm yeniden adlandırma korunur
- İnternetsiz çalışma korunur

## Performans yaklaşımı
- Harici animasyon kütüphanesi yok
- Aynı anda yalnızca görünen 1–2 sayfa ve tek bir çevirme katmanı DOM'da tutulur
- Sürükleme `requestAnimationFrame` ile CSS transform üzerinden yapılır
- Sayfa dokusu 96×96 küçük tekrar eden PNG'dir
- Sesler dosya oynatmak yerine WebAudio ile kısa süreli sentezlenir
- `prefers-reduced-motion` desteği vardır
- Kaydır animasyonu düşük güçlü cihazlar için en hafif moddur
