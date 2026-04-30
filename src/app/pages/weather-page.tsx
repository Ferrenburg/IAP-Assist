import { useState, useEffect } from 'react';
import { Cloud, HelpCircle, MapPin, RefreshCw, X, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

interface WeatherPeriod {
  name: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  isDaytime: boolean;
  icon: string;
}

interface WeatherAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  urgency: string;
  onset: string;
  expires: string;
}

export function WeatherPage() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'hourly' | 'extended' | 'alerts'>('current');
  const [weatherPoint, setWeatherPoint] = useState<WeatherPoint | null>(null);
  const [forecast, setForecast] = useState<WeatherPeriod[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<WeatherPeriod[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);

  // Load saved location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('weatherLocation');
    if (savedLocation) {
      try {
        const { latitude: lat, longitude: lon, locationName: name } = JSON.parse(savedLocation);
        setLatitude(lat || '');
        setLongitude(lon || '');
        setLocationName(name || '');
      } catch (error) {
        console.error('Failed to load saved location:', error);
      }
    }
  }, []);

  // Save location to localStorage whenever it changes
  useEffect(() => {
    if (latitude || longitude || locationName) {
      localStorage.setItem('weatherLocation', JSON.stringify({
        latitude,
        longitude,
        locationName,
      }));
    }
  }, [latitude, longitude, locationName]);

  const handleGetWeather = async () => {
    if (!latitude || !longitude) {
      toast.error('Please enter latitude and longitude');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Get the point metadata
      const pointResponse = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`, {
        headers: {
          'User-Agent': '(OpPeriod, contact@example.com)',
        },
      });

      if (!pointResponse.ok) {
        throw new Error('Failed to fetch weather point data');
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

      // Step 2: Get the forecast
      const forecastResponse = await fetch(point.forecast, {
        headers: {
          'User-Agent': '(OpPeriod, contact@example.com)',
        },
      });

      if (!forecastResponse.ok) {
        throw new Error('Failed to fetch forecast data');
      }

      const forecastData = await forecastResponse.json();
      setForecast(forecastData.properties.periods);

      // Step 3: Get hourly forecast
      const hourlyResponse = await fetch(point.forecastHourly, {
        headers: {
          'User-Agent': '(OpPeriod, contact@example.com)',
        },
      });

      if (!hourlyResponse.ok) {
        throw new Error('Failed to fetch hourly forecast');
      }

      const hourlyData = await hourlyResponse.json();
      setHourlyForecast(hourlyData.properties.periods);

      // Step 4: Get alerts for the point
      const alertsResponse = await fetch(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`, {
        headers: {
          'User-Agent': '(OpPeriod, contact@example.com)',
        },
      });

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.features.map((f: any) => ({
          id: f.id,
          event: f.properties.event,
          headline: f.properties.headline,
          description: f.properties.description,
          severity: f.properties.severity,
          urgency: f.properties.urgency,
          onset: f.properties.onset,
          expires: f.properties.expires,
        })));
      }

      setLastUpdated(new Date().toLocaleString());
      toast.success('Weather data loaded');
    } catch (error: any) {
      console.error('Weather fetch error:', error);
      toast.error(error.message || 'Failed to fetch weather data');
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
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.addPage([612, 792]); // Letter size
      const { width, height } = page.getSize();

      let yPosition = height - 50;

      // Title
      page.drawText('Weather Forecast Report', {
        x: 50,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      // Location info
      page.drawText(`Location: ${locationName || `${latitude}, ${longitude}`}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      if (weatherPoint) {
        page.drawText(`NWS Office: ${weatherPoint.gridId} (Grid ${weatherPoint.gridX}, ${weatherPoint.gridY})`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPosition -= 20;
      }

      page.drawText(`Generated: ${lastUpdated || new Date().toLocaleString()}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 40;

      // Track current page for multi-page support
      let currentPage = page;

      // Alerts section
      if (alerts.length > 0) {
        currentPage.drawText('ACTIVE WEATHER ALERTS', {
          x: 50,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0.8, 0, 0),
        });
        yPosition -= 25;

        for (const alert of alerts.slice(0, 3)) {
          currentPage.drawText(`${alert.event} - ${alert.severity}`, {
            x: 60,
            y: yPosition,
            size: 11,
            font: boldFont,
            color: rgb(0.6, 0, 0),
          });
          yPosition -= 15;

          const headlineLines = wrapText(alert.headline, font, 10, 500);
          for (const line of headlineLines) {
            currentPage.drawText(line, {
              x: 60,
              y: yPosition,
              size: 10,
              font: font,
              color: rgb(0, 0, 0),
            });
            yPosition -= 12;
          }
          yPosition -= 10;

          if (yPosition < 100) break;
        }
        yPosition -= 10;
      }

      // Extended Forecast
      currentPage.drawText('Extended Forecast', {
        x: 50,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;

      for (const period of forecast.slice(0, 14)) {
        if (yPosition < 100) {
          // Add new page if we run out of space
          currentPage = pdfDoc.addPage([612, 792]);
          yPosition = height - 50;
          currentPage.drawText('Weather Forecast Report (continued)', {
            x: 50,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= 30;
        }

        // Period name and temperature
        currentPage.drawText(`${period.name}: ${period.temperature}°${period.temperatureUnit}`, {
          x: 60,
          y: yPosition,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;

        // Wind info
        currentPage.drawText(`Wind: ${period.windSpeed} ${period.windDirection}`, {
          x: 60,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= 15;

        // Detailed forecast (wrapped)
        const forecastLines = wrapText(period.detailedForecast, font, 9, 500);
        for (const line of forecastLines.slice(0, 3)) {
          currentPage.drawText(line, {
            x: 60,
            y: yPosition,
            size: 9,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPosition -= 12;
        }
        yPosition -= 10;
      }

      // Generate and download PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `weather-forecast-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('PDF exported successfully');
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  // Helper function to wrap text
  function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Weather Forecast</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Tutorial
          </button>
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors">
            Templates
          </button>
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors">
            Help
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Location Coordinates */}
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Location Coordinates</h2>
          </div>
          <button
            onClick={() => setShowMapModal(true)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Pick on Map
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Latitude</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 38.8977"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Longitude</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. -77.0365"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location Name</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Auto-detected or manual"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <button
              onClick={handleGetWeather}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Get Weather'}
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className="mt-2 text-xs text-slate-400">
            <p>Last updated: {lastUpdated}</p>
            {weatherPoint && <p>NWS Office: {weatherPoint.gridId} (Grid {weatherPoint.gridX}, {weatherPoint.gridY})</p>}
          </div>
        )}
      </div>

      {/* Weather Data Area */}
      {forecast.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-16 text-center">
          <Cloud className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Weather Data</h3>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Enter latitude and longitude coordinates above, then click "Get Weather" to fetch the current forecast from the National Weather Service.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'current'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Current
              </span>
            </button>
            <button
              onClick={() => setActiveTab('hourly')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'hourly'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Hourly
            </button>
            <button
              onClick={() => setActiveTab('extended')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'extended'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Extended
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Alerts
              {alerts.length > 0 && (
                <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
              )}
            </button>
          </div>

          {/* Weather Content */}
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-8">
            {activeTab === 'current' && forecast[0] && (
              <div>
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-white mb-2">{forecast[0].temperature}°{forecast[0].temperatureUnit}</div>
                  <p className="text-slate-400 mb-2">{forecast[0].shortForecast}</p>
                  <p className="text-sm text-slate-500">{forecast[0].detailedForecast}</p>
                </div>
                <div className="grid grid-cols-6 gap-4">
                  {forecast.slice(0, 6).map((period, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-sm text-slate-400 mb-2">{period.name}</div>
                      <img src={period.icon} alt={period.shortForecast} className="w-12 h-12 mx-auto mb-2" />
                      <div className="text-sm text-white">{period.temperature}°</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'hourly' && (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {hourlyForecast.map((period, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400 w-32">{period.name}</span>
                      <img src={period.icon} alt={period.shortForecast} className="w-8 h-8" />
                      <span className="text-sm text-white">{period.shortForecast}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{period.temperature}°{period.temperatureUnit}</div>
                      <div className="text-xs text-slate-400">{period.windSpeed} {period.windDirection}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'extended' && (
              <div className="space-y-4">
                {forecast.map((period, idx) => (
                  <div key={idx} className="border-b border-slate-700 pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <img src={period.icon} alt={period.shortForecast} className="w-12 h-12" />
                        <div>
                          <h3 className="font-semibold text-white">{period.name}</h3>
                          <p className="text-sm text-slate-400">{period.shortForecast}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{period.temperature}°{period.temperatureUnit}</div>
                        <div className="text-xs text-slate-400">{period.windSpeed} {period.windDirection}</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{period.detailedForecast}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'alerts' && (
              alerts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Active Weather Alerts</h3>
                  <p className="text-slate-400 text-sm">
                    There are no current weather alerts for this location.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-400 mb-1">{alert.event}</h3>
                          <p className="text-sm text-slate-300 mb-2">{alert.headline}</p>
                          <p className="text-xs text-slate-400">
                            Severity: {alert.severity} | Urgency: {alert.urgency}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Expires: {new Date(alert.expires).toLocaleString()}
                          </p>
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

      {/* Map Modal */}
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
      // Use Nominatim (OpenStreetMap) geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'OpPeriod',
          },
        }
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
    } catch (error) {
      console.error('Geocoding error:', error);
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
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Pick Weather Location</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('coordinates')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'coordinates'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Coordinates
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Map Location
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search (e.g., Washington, DC)"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {activeTab === 'coordinates' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={tempLat}
                    onChange={(e) => setTempLat(e.target.value)}
                    placeholder="e.g., 38.8977"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={tempLon}
                    onChange={(e) => setTempLon(e.target.value)}
                    placeholder="e.g., -77.0365"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="bg-slate-100 rounded-lg p-4 h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 text-sm">Interactive map would appear here</p>
                <p className="text-xs text-slate-500 mt-1">
                  Selected: {markerLat.toFixed(4)}, {markerLon.toFixed(4)}
                </p>
                <p className="text-xs text-slate-400 mt-4">
                  © OpenStreetMap contributors
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
}
