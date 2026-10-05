# Roman Atölyesi v5 — Fiziksel Kitap Motoru

Telefon için çevrimdışı çalışan PWA roman yazma ve okuma uygulaması.

## v5 yenilikleri
- Parmağın başlangıç köşesini ve çapraz hareketini izleyen gerçek zamanlı 3D sayfa dönüşü
- Sayfa dönüşünde yumuşak kağıt / yeni kağıt / parşömen / kumaş sesleri
- Düşük yoruculuklu yeni WebAudio motoru ve limiter/compressor
- 12 farklı yazma sesi: daktilo, keçe tuş, kalem, dolma kalem, tüy kalem, fırça, bubble, damla, soft tap, cam tık, tebeşir ve sessiz
- 16 ambiyans: iki yağmur, şömine, kütüphane, kafe, orman, gece, okyanus, tren, rüzgar, plak, saat, brown/pink noise, kar ve sessiz
- Yazma, sayfa ve ambiyans sesleri açılır sembollü listeler halinde
- Kitap sayfası yoğunluğu %70–130 arasında her yüzde ayarlanabilir
- 15 kağıt/yüzey dokusu; kırışık kağıt, kar, kadife, kilim, keten, kraft, mermer, deri ve pirinç kağıdı dahil
- Cihaza özel kapak görseli ekleme; IndexedDB'de çevrimdışı saklanır
- Sayfa sayısı arttıkça kapak ve kitap gövdesi görsel olarak kalınlaşır
- Tek sayfa ve çift sayfa kitap düzenleri korunur
- Roman verileri yine `roman_atolyesi_v1` anahtarında tutulur; mevcut metinler korunur
- PWA önbelleği v5'e yükseltildi ve tüm doku dosyaları çevrimdışı önbelleğe alınır

## Performans
Sayfa sürükleme sırasında yalnızca görünen sayfalar ve tek bir dönüş katmanı güncellenir. Animasyonlar `requestAnimationFrame` + GPU dostu `transform` kullanır. Ağır WebGL sahnesi kullanılmaz.
