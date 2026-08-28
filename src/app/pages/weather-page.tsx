'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Cloud, HelpCircle, MapPin, RefreshCw, X, Search, AlertTriangle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../utils/api-client';
import { generateWeatherPDF, WeatherPeriod, WeatherAlert } from '../../utils/ics-forms/generators/weather-pdf';

const LeafletMap = dynamic(
  () => import('../components/leaflet-map').then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Loading map…
      </div>
    ),
  }
);

interface WeatherPoint {
  gridId: string;
  gridX: number;
  gridY: number;
  forecast: string;
  forecastHourly: string;
  forecastGridData: string;
  observationStations: string;
  county: string;
  fireWeatherZone: string;
  timeZone: string;
  radarStation: string;
}

export function WeatherPage() {
  const { iapId, periodId } = useParams<{ iapId: string; periodId: string }>();

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'hourly' | 'extended' | 'alerts'>('current');
  const [weatherPoint, setWeatherPoint] = useState<WeatherPoint | null>(null);
  const [forecast, setForecast] = useState<WeatherPeriod[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<WeatherPeriod[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);

  // Load saved location + weather data on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('weatherLocation');
    if (savedLocation) {
      try {
        const { latitude: lat, longitude: lon, locationName: name } = JSON.parse(savedLocation);
        setLatitude(lat || '');
        setLongitude(lon || '');
        setLocationName(name || '');
      } catch {
        // ignore parse errors
      }
    }

    if (iapId && periodId) {
      loadSavedWeather();
    }
  }, [iapId, periodId]);

  // Persist location to localStorage whenever it changes
  useEffect(() => {
    if (latitude || longitude || locationName) {
      localStorage.setItem('weatherLocation', JSON.stringify({ latitude, longitude, locationName }));
    }
  }, [latitude, longitude, locationName]);

  const loadSavedWeather = async () => {
    if (!iapId || !periodId) return;
    try {
      const res = await apiClient.getData(iapId, `period-${periodId}-weather`);
      const saved = res?.data?.[0];
      if (!saved) return;
      if (saved.forecast?.length) setForecast(saved.forecast);
      if (saved.hourlyForecast?.length) setHourlyForecast(saved.hourlyForecast);
      if (saved.alerts) setAlerts(saved.alerts);
      if (saved.weatherPoint) setWeatherPoint(saved.weatherPoint);
      if (saved.lastUpdated) setLastUpdated(saved.lastUpdated);
      if (saved.locationName) setLocationName(saved.locationName);
      if (saved.latitude) setLatitude(saved.latitude);
      if (saved.longitude) setLongitude(saved.longitude);
    } catch (err) {
      console.error('Failed to load saved weather:', err);
    }
  };

  const saveWeatherToKV = async (payload: {
    forecast: WeatherPeriod[];
    hourlyForecast: WeatherPeriod[];
    alerts: WeatherAlert[];
    weatherPoint: WeatherPoint | null;
    locationName: string;
    latitude: string;
    longitude: string;
    lastUpdated: string;
  }) => {
    if (!iapId || !periodId) return;
    setSaving(true);
    try {
      const existing = await apiClient.getData(iapId, `period-${periodId}-weather`);
      if (existing?.data?.[0]?.id) {
        await apiClient.updateData(iapId, `period-${periodId}-weather`, existing.data[0].id, payload);
      } else {
        await apiClient.createData(iapId, `period-${periodId}-weather`, payload);
      }
    } catch (err) {
      console.error('Failed to save weather data:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGetWeather = async () => {
    if (!latitude || !longitude) {
      toast.error('Please enter latitude and longitude');
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      toast.error('Invalid coordinates. Please enter decimal numbers, e.g. Latitude: 38.8977 and Longitude: -77.0365');
      return;
    }
    if (lat < 24 || lat > 50 || lon < -125 || lon > -66) {
      toast.error('These coordinates are outside the United States. The National Weather Service only covers US locations. Try a location like Washington DC (38.8977, -77.0365).');
      return;
    }

    setLoading(true);

    try {
      const pointResponse = await fetch(
        `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
        { headers: { 'User-Agent': '(OpPeriod, contact@example.com)' } },
      );
      if (!pointResponse.ok) {
        if (pointResponse.status === 404) {
          throw new Error('These coordinates do not match a known NWS coverage area. Please verify your latitude and longitude and try again.');
        }
        if (pointResponse.status === 500 || pointResponse.status === 503) {
          throw new Error('The National Weather Service is temporarily unavailable. Please try again in a few minutes.');
        }
        throw new Error('Unable to retrieve weather data for these coordinates. Please check your location and try again.');
      }

      const pointData = await pointResponse.json();
      const point: WeatherPoint = {
        gridId: pointData.properties.gridId,
        gridX: pointData.properties.gridX,
        gridY: pointData.properties.gridY,
        forecast: pointData.properties.forecast,
        forecastHourly: pointData.properties.forecastHourly,
        forecastGridData: pointData.properties.forecastGridData,
        observationStations: pointData.properties.observationStations,
        county: pointData.properties.county,
        fireWeatherZone: pointData.properties.fireWeatherZone,
        timeZone: pointData.properties.timeZone,
        radarStation: pointData.properties.radarStation,
      };
      setWeatherPoint(point);

      const [forecastRes, hourlyRes, alertsRes] = await Promise.all([
        fetch(point.forecast, { headers: { 'User-Agent': '(OpPeriod, contact@example.com)' } }),
        fetch(point.forecastHourly, { headers: { 'User-Agent': '(OpPeriod, contact@example.com)' } }).catch(() => null),
        fetch(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`, {
          headers: { 'User-Agent': '(OpPeriod, contact@example.com)' },
        }),
      ]);

      if (!forecastRes.ok) throw new Error('Weather forecast data is currently unavailable for this location. Please try again shortly.');

      const forecastData = await forecastRes.json();
      const periods: WeatherPeriod[] = forecastData.properties.periods;
      const hourly: WeatherPeriod[] = (hourlyRes?.ok ? (await hourlyRes.json()).properties.periods : []);

      let fetchedAlerts: WeatherAlert[] = [];
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        fetchedAlerts = alertsData.features.map((f: any) => ({
          id: f.id,
          event: f.properties.event,
          headline: f.properties.headline,
          description: f.properties.description,
          severity: f.properties.severity,
          urgency: f.properties.urgency,
          onset: f.properties.onset,
          expires: f.properties.expires,
        }));
      }

      const updatedAt = new Date().toLocaleString();
      setForecast(periods);
      setHourlyForecast(hourly);
      setAlerts(fetchedAlerts);
      setLastUpdated(updatedAt);

      // Persist to KV so IAP Assembly can include it
      await saveWeatherToKV({
        forecast: periods,
        hourlyForecast: hourly,
        alerts: fetchedAlerts,
        weatherPoint: point,
        locationName,
        latitude,
        longitude,
        lastUpdated: updatedAt,
      });

      toast.success('Weather data loaded and saved');
    } catch (error: any) {
      console.error('Weather fetch error:', error);
      const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch';
      toast.error(
        isNetworkError
          ? 'Unable to connect to the National Weather Service. Please check your internet connection and try again.'
          : (error.message || 'Unable to load weather data. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (forecast.length === 0) {
      toast.error('No weather data to export. Please load weather data first.');
      return;
    }

    try {
      const pdfBytes = await generateWeatherPDF({
        locationName,
        latitude,
        longitude,
        weatherPoint: weatherPoint
          ? { gridId: weatherPoint.gridId, gridX: weatherPoint.gridX, gridY: weatherPoint.gridY }
          : null,
        forecast,
        alerts,
        generatedAt: lastUpdated || new Date().toLocaleString(),
      });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `weather-forecast-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);

      toast.success('PDF exported successfully');
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Weather Forecast</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Tutorial
          </button>
          <button className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors">
            Help
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-mustard hover:bg-mustard-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Location Coordinates */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Location Coordinates</h2>
          </div>
          <button
            onClick={() => setShowMapModal(true)}
            className="text-sage hover:text-sage-hover text-sm transition-colors flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Pick on Map
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Latitude</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 38.8977"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Longitude</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. -77.0365"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Location Name</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Washington, DC"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <button
              onClick={handleGetWeather}
              disabled={loading}
              className="w-full bg-sage hover:bg-sage-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Get Weather'}
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Last updated: {lastUpdated}
              {weatherPoint && `  |  NWS Office: ${weatherPoint.gridId} (Grid ${weatherPoint.gridX}, ${weatherPoint.gridY})`}
            </span>
            {saving && (
              <span className="flex items-center gap-1 text-mustard-hover">
                <Save className="w-3 h-3" />
                Saving…
              </span>
            )}
            {!saving && forecast.length > 0 && (
              <span className="flex items-center gap-1 text-green-400">
                <Save className="w-3 h-3" />
                Saved to IAP
              </span>
            )}
          </div>
        )}
      </div>

      {/* Weather Data Area */}
      {forecast.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-16 text-center">
          <Cloud className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Weather Data</h3>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Enter latitude and longitude coordinates above, then click "Get Weather" to fetch the current forecast from the National Weather Service. Weather data is automatically saved to this operational period so it can be included in the IAP export.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {(['current', 'hourly', 'extended', 'alerts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors capitalize flex items-center gap-2 ${
                  activeTab === tab
                    ? 'text-sage border-b-2 border-sage'
                    : 'text-muted-foreground hover:text-foreground/80'
                }`}
              >
                {tab === 'current' && <Cloud className="w-4 h-4" />}
                {tab}
                {tab === 'alerts' && alerts.length > 0 && (
                  <span className="ml-1 bg-coral text-white text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-lg border border-border p-8">
            {activeTab === 'current' && forecast[0] && (
              <div>
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-foreground mb-2">{forecast[0].temperature}°{forecast[0].temperatureUnit}</div>
                  <p className="text-muted-foreground mb-2">{forecast[0].shortForecast}</p>
                  <p className="text-sm text-muted-foreground">{forecast[0].detailedForecast}</p>
                </div>
                <div className="grid grid-cols-6 gap-4">
                  {forecast.slice(0, 6).map((period, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-sm text-muted-foreground mb-2">{period.name}</div>
                      <img src={period.icon} alt={period.shortForecast} className="w-12 h-12 mx-auto mb-2" />
                      <div className="text-sm text-foreground">{period.temperature}°</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'hourly' && (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-3">
                {hourlyForecast.map((period, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-sm text-muted-foreground w-32 shrink-0">{period.name}</span>
                      <img src={period.icon} alt={period.shortForecast} className="w-8 h-8 shrink-0" />
                      <span className="text-sm text-foreground truncate">{period.shortForecast}</span>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-lg font-semibold text-foreground">{period.temperature}°{period.temperatureUnit}</div>
                      <div className="text-xs text-muted-foreground">{period.windSpeed} {period.windDirection}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'extended' && (
              <div className="space-y-4">
                {forecast.map((period, idx) => (
                  <div key={idx} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <img src={period.icon} alt={period.shortForecast} className="w-12 h-12" />
                        <div>
                          <h3 className="font-semibold text-foreground">{period.name}</h3>
                          <p className="text-sm text-muted-foreground">{period.shortForecast}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">{period.temperature}°{period.temperatureUnit}</div>
                        <div className="text-xs text-muted-foreground">{period.windSpeed} {period.windDirection}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{period.detailedForecast}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'alerts' && (
              alerts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Active Weather Alerts</h3>
                  <p className="text-muted-foreground text-sm">There are no current weather alerts for this location.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="bg-coral/10 border border-coral/40 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-coral flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-coral mb-1">{alert.event}</h3>
                          <p className="text-sm text-foreground/80 mb-2">{alert.headline}</p>
                          <p className="text-xs text-muted-foreground">Severity: {alert.severity} | Urgency: {alert.urgency}</p>
                          <p className="text-xs text-muted-foreground mt-1">Expires: {new Date(alert.expires).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {showMapModal && (
        <MapPickerModal
          onClose={() => setShowMapModal(false)}
          onSelectLocation={(lat, lon, name) => {
            setLatitude(lat.toString());
            setLongitude(lon.toString());
            setLocationName(name);
            setShowMapModal(false);
          }}
        />
      )}
    </div>
  );
}

function MapPickerModal({
  onClose,
  onSelectLocation,
}: {
  onClose: () => void;
  onSelectLocation: (lat: number, lon: number, name: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'coordinates' | 'map'>('coordinates');
  const [searchQuery, setSearchQuery] = useState('');
  const [tempLat, setTempLat] = useState('');
  const [tempLon, setTempLon] = useState('');
  const [markerLat, setMarkerLat] = useState(38.8977);
  const [markerLon, setMarkerLon] = useState(-77.0365);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'User-Agent': 'OpPeriod' } },
      );
      const results = await response.json();
      if (results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        setMarkerLat(lat);
        setMarkerLon(lon);
        setTempLat(lat.toFixed(6));
        setTempLon(lon.toFixed(6));
        toast.success('Location found');
      } else {
        toast.error('Location not found');
      }
    } catch {
      toast.error('Failed to search location');
    }
  };

  const handleSave = () => {
    if (activeTab === 'coordinates' && tempLat && tempLon) {
      onSelectLocation(parseFloat(tempLat), parseFloat(tempLon), searchQuery || 'Manual Location');
    } else if (activeTab === 'map') {
      onSelectLocation(markerLat, markerLon, searchQuery || `${markerLat.toFixed(4)}, ${markerLon.toFixed(4)}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pick Weather Location</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-4">
            {(['coordinates', 'map'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  activeTab === tab ? 'bg-sage text-white' : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {tab === 'coordinates' ? 'Coordinates' : 'Map Location'}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search (e.g., Washington, DC)"
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {activeTab === 'coordinates' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Latitude</label>
                <input
                  type="text"
                  value={tempLat}
                  onChange={(e) => setTempLat(e.target.value)}
                  placeholder="e.g., 38.8977"
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Longitude</label>
                <input
                  type="text"
                  value={tempLon}
                  onChange={(e) => setTempLon(e.target.value)}
                  placeholder="e.g., -77.0365"
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="rounded-lg overflow-hidden h-96">
              <LeafletMap
                lat={markerLat}
                lon={markerLon}
                onLocationSelect={(lat, lon) => {
                  setMarkerLat(lat);
                  setMarkerLon(lon);
                  setTempLat(lat.toFixed(6));
                  setTempLon(lon.toFixed(6));
                }}
              />
            </div>
          )}
          {activeTab === 'map' && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Click on the map or drag the marker to set coordinates — {markerLat.toFixed(4)}, {markerLon.toFixed(4)}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-sage text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sage-hover transition-colors"
          >
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
}
