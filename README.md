# Roman Atölyesi v6 — Smooth Mechanics

v5 Ultra Kitap üzerine performans ve mikro-etkileşim revizyonu.

- Minimal, yumuşak buton basma geri bildirimi
- Kısa ve engellemeyen açılış animasyonları
- Görünüm ve sheet geçişleri yumuşatıldı
- Yeni bölüm toast yerine listede doğal biçimde oluşur
- Yeniden adlandırma satır içinde yapılır; silme satırı yumuşakça kapanır
- Ana sayfadaki uzun “Çift sayfa · Gerçekçi 3D · %...” metni sade rozetlere ayrıldı
- %70–130 sayfa ölçeği sayfa kapasitesini artık belirgin şekilde değiştirir
- Slider sırasında sayfalama debounce ile canlı güncellenir
- Yazarken bölüm listesini her tuşta yeniden çizme kaldırıldı
- Sayfa sürükleme geometri ölçümleri pointerdown anında cache edilir
- Flip CSS değişkenleri tüm document yerine kitap alt ağacında güncellenir
- Düşük kaynaklı telefonlarda adaptif performans modu
- roman_atolyesi_v1 verisi korunur


## v7 – 3D Kitap Odası
- Ayrı bir **3D Masa** modu eklendi.
- Varsayılan kamera açısı **60°**; 90° tam tepeden görünüm yerine belirgin perspektif verir.
- Tek parmakla kitabı döndürme / açı değiştirme.
- İki parmakla pinch zoom; iki parmak döndürme ile hafif roll.
- Açı, yön ve yakınlık ekrandaki slider'lardan da anlık ayarlanabilir.
- Kapak görseli 3D kitabın kapağına da uygulanır.
- Kitap kalınlığı sayfa sayısıyla birlikte 3D modelde büyür.
- Masada gelecekte çoklu kitap desteği için hafif dekoratif kitap objeleri eklendi.
- 3D sahne WebGL kütüphanesi kullanmaz; CSS 3D + requestAnimationFrame ile düşük gecikmeli ve mobil-dostudur.
- Normal Gerçekçi 3D okuma modu da hafif eğik perspektife alındı.
- Yazı boyutu alt sınırı **11 px** yapıldı.
