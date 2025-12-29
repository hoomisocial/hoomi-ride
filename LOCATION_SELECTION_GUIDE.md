# Cara Memilih Lokasi di Map

## Fitur yang Perlu Ditambahkan

### 1. **Setup Mapbox Geocoding API**
Mapbox Geocoding API digunakan untuk convert koordinat → alamat (reverse geocoding)

```typescript
const getAddressFromCoords = async (lng: number, lat: number) => {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=id`
  );
  const data = await response.json();
  return data.features[0]?.place_name || "Lokasi tidak ditemukan";
};
```

### 2. **MapPlaceholder Perlu Update**
Tambahkan props untuk interactive mode dan callback saat map bergerak:

```typescript
interface MapPlaceholderProps {
  interactive?: boolean;  // Allow map dragging
  onCenterChange?: (center: [number, number]) => void;  // Callback when map moves
}
```

Di dalam MapPlaceholder component, tambahkan event listener:

```typescript
map.current.on('moveend', () => {
  const center = map.current.getCenter();
  onCenterChange?.([center.lng, center.lat]);
});
```

### 3. **Geolocation untuk "Lokasi Saat Ini"**
Gunakan browser Geolocation API:

```typescript
const handleCurrentLocation = () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = [position.coords.longitude, position.coords.latitude];
      // Update map center dan get address
    },
    (error) => {
      alert("Tidak dapat mengakses lokasi. Aktifkan GPS.");
    }
  );
};
```

## Flow Lengkap:

1. User buka LocationSelection page
2. Map tampil dengan center default (Jakarta)
3. User drag map → pin tetap di center
4. Saat map berhenti (`moveend` event) → ambil koordinat center → reverse geocoding → update input field
5. User klik tombol lokasi saat ini → get GPS coordinates → update map center
6. User klik "Lanjut" → simpan lokasi + koordinat
7. Ulangi untuk dropoff location
8. Klik "Konfirmasi" → navigate ke Transport/Delivery dengan data lokasi lengkap

## Yang Perlu Anda Lakukan:

1. **Update MapPlaceholder.tsx** - tambah prop `interactive` dan `onCenterChange`
2. **Update LocationSelection.tsx** - implementasi reverse geocoding
3. **Test dengan public Mapbox token** (pk.xxx bukan sk.xxx)

Apakah Anda ingin saya buatkan file lengkapnya?
