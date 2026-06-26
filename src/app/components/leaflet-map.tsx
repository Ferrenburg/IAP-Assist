'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default icons are broken by webpack — point to CDN copies instead
const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapController({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom());
  }, [lat, lon, map]);
  return null;
}

function ClickHandler({ onSelect }: { onSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LeafletMap({
  lat,
  lon,
  onLocationSelect,
}: {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number) => void;
}) {
  return (
    <MapContainer center={[lat, lon]} zoom={10} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController lat={lat} lon={lon} />
      <ClickHandler onSelect={onLocationSelect} />
      <Marker
        position={[lat, lon]}
        icon={pinIcon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const pos = (e.target as L.Marker).getLatLng();
            onLocationSelect(pos.lat, pos.lng);
          },
        }}
      />
    </MapContainer>
  );
}
