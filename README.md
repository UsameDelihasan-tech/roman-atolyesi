# Roman Atölyesi v8 — Birleşik 3D Fiziksel Kitap

Bu sürüm v7 üzerindeki 3D kitap modelini yeniden kurar.

## v8 değişiklikleri
- 3D kapak, sayfa bloğu ve sırt tek bir merkezli koordinat sisteminde çalışır.
- Döndürme sırasında sayfa bloğunun / kapağın ayrılıp uzağa fırlaması düzeltildi.
- Kapak görseli yalnızca kapak yüzeyine kırpılır; sayfa kenarlarına taşmaz.
- Kitaba dokunarak 3D ortamda açma / kapatma.
- Açık 3D kitapta gerçek roman sayfalarını okuma.
- Sayfayı tek parmakla canlı sürükleyerek çevirme; dönüş parmağı takip eder.
- Açık kitapta arka planı sürüklemek kamerayı döndürür.
- İki parmak pinch zoom ve iki parmak dönüşü korunur.
- 3D modunda “3D'de yaz” paneli ile mevcut bölüm canlı düzenlenebilir.
- Yazılan metin kısa bir debounce sonrası açık kitaba yeniden sayfalanır.
- Sayfa sayısı arttıkça kapalı 3D kitabın fiziksel derinliği 9–56 px aralığında artar.
- Açık kitapta sol / sağ sayfa yığını mevcut konuma göre görsel olarak değişir.
- 11 px minimum yazı boyutu korunur.
- Tüm v5/v6 ses, texture, kapak, gündüz/gece, PWA ve offline özellikleri korunur.
- roman_atolyesi_v1 localStorage anahtarı korunur; mevcut roman verileri silinmez.

## Performans
3D sahne WebGL motoru kullanmaz. CSS 3D transform + requestAnimationFrame ile çalışır.
Sürükleme sırasında yalnızca kitap rig'i veya tek page-turn katmanı güncellenir.
