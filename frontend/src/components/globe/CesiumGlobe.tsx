import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { GlobalEvent } from '../../types';
import { LayerState } from './LayerControl';
import { Globe, Map, Crosshair } from 'lucide-react';

interface CesiumGlobeProps {
  events: GlobalEvent[];
  layers: LayerState;
  selectedSeverity: string;
  onSelectEvent: (event: GlobalEvent) => void;
  selectedEventId?: number;
  latestEventId?: number;
}

export const CesiumGlobe: React.FC<CesiumGlobeProps> = ({
  events,
  layers,
  selectedSeverity,
  onSelectEvent,
  selectedEventId,
  latestEventId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [hoveredEvent, setHoveredEvent] = useState<GlobalEvent | null>(null);

  // Filter events according to active layer toggles and severity
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedSeverity && ev.severity !== selectedSeverity) {
        return false;
      }
      const layer = ev.metadata_json?.layer || 'cyber';
      if (layer === 'cyber' && !layers.cyber) return false;
      if (layer === 'infrastructure' && !layers.infrastructure) return false;
      if (layer === 'earthquakes' && !layers.earthquakes) return false;
      if (layer === 'weather' && !layers.weather) return false;
      if (layer === 'maritime' && !layers.maritime) return false;
      if (layer === 'threat' && !layers.threat) return false;
      return true;
    });
  }, [events, layers, selectedSeverity]);

  // Color mapper for tactical matte palette
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL': return '#dc2626'; // Matte Crimson
      case 'HIGH': return '#d97706';     // Warm Amber
      case 'MEDIUM': return '#3b82f6';   // Steel Blue
      case 'LOW': return '#16a34a';      // Forest Green
      default: return '#64748b';         // Slate
    }
  };

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    let viewer: Cesium.Viewer | null = null;

    try {
      // Disable default Cesium Ion requirement to prevent token errors
      Cesium.Ion.defaultAccessToken = '';

      viewer = new Cesium.Viewer(containerRef.current, {
        baseLayer: false, // Prevents default Cesium Ion imagery provider crash
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        timeline: false,
        animation: false,
        selectionIndicator: false,
        fullscreenButton: false,
        skyBox: false,
        skyAtmosphere: false,
        scene3DOnly: true,
        requestRenderMode: false,
      });

      // Matte dark command center background
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0b0d13');
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#12151f');
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.showGroundAtmosphere = false;

      // Add ESRI World Dark Gray Canvas tiles (unwatermarked, free, high-res dark defense palette)
      try {
        const darkImagery = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          credit: 'ESRI, DeLorme, NAVTEQ',
          maximumLevel: 16,
        });
        viewer.imageryLayers.addImageryProvider(darkImagery);
      } catch (imgErr) {
        console.warn('ESRI imagery fallback to baseColor:', imgErr);
      }

      // Click handler for event pins
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement: any) => {
        if (!viewer) return;
        const pickedObject = viewer.scene.pick(movement.position);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          if (pickedObject.id.eventData) {
            onSelectEvent(pickedObject.id.eventData);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      viewerRef.current = viewer;
      setLoading(false);

      // Default camera view over central geopolitical corridor
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(15.0, 35.0, 17000000.0),
      });

      return () => {
        handler.destroy();
        if (viewer && !viewer.isDestroyed()) {
          viewer.destroy();
        }
      };
    } catch (err) {
      console.warn('Cesium initialization warning (switching to 2D tactical fallback):', err);
      setWebglSupported(false);
      setViewMode('2d');
      setLoading(false);
    }
  }, [onSelectEvent]);

  // Update Entities / Markers on 3D Globe when filteredEvents change
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !Cesium.defined(viewer.entities)) return;

    viewer.entities.removeAll();

    // Render Event Markers
    filteredEvents.forEach((ev) => {
      const isSelected = ev.id === selectedEventId;
      const isLatest = ev.id === latestEventId;
      const hexColor = getSeverityColor(ev.severity);
      const color = Cesium.Color.fromCssColorString(hexColor);

      // Primary Point Marker
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(ev.longitude, ev.latitude),
        point: {
          pixelSize: isSelected ? 16 : isLatest ? 14 : (ev.severity === 'CRITICAL' ? 12 : 9),
          color: color,
          outlineColor: Cesium.Color.fromCssColorString('#f8fafc'),
          outlineWidth: isSelected || isLatest ? 2 : 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        eventData: ev,
      } as any);

      // Tactical perimeter ring for critical, selected, or newly arrived events
      if (ev.severity === 'CRITICAL' || isSelected || isLatest) {
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(ev.longitude, ev.latitude),
          ellipse: {
            semiMinorAxis: isLatest ? 260000.0 : 180000.0,
            semiMajorAxis: isLatest ? 260000.0 : 180000.0,
            material: color.withAlpha(isLatest ? 0.35 : 0.2),
            outline: true,
            outlineColor: color.withAlpha(0.85),
            height: 0,
          },
        });
      }

      // Attack Trajectory Arcs (Origin -> Target)
      if (ev.metadata_json?.origin_lat && ev.metadata_json?.origin_lon) {
        const origin = Cesium.Cartesian3.fromDegrees(ev.metadata_json.origin_lon, ev.metadata_json.origin_lat);
        const target = Cesium.Cartesian3.fromDegrees(ev.longitude, ev.latitude);

        viewer.entities.add({
          polyline: {
            positions: [origin, target],
            width: isLatest ? 2.5 : 1.8,
            arcType: Cesium.ArcType.GEODESIC,
            material: new Cesium.ColorMaterialProperty(color.withAlpha(isLatest ? 0.9 : 0.75)),
          },
        });

        // Origin sensor anchor
        viewer.entities.add({
          position: origin,
          point: {
            pixelSize: 5,
            color: Cesium.Color.fromCssColorString('#64748b'),
            outlineColor: color,
            outlineWidth: 1,
          },
        });
      }
    });
  }, [filteredEvents, selectedEventId, latestEventId]);

  return (
    <div className="relative w-full h-full bg-[#0b0d13] overflow-hidden select-none">
      {/* 3D Cesium Container */}
      <div 
        ref={containerRef} 
        className={`w-full h-full ${viewMode === '3d' && webglSupported ? 'block' : 'hidden'}`} 
      />

      {/* 2D Planar Tactical Projection Map */}
      {(viewMode === '2d' || !webglSupported) && (
        <div className="w-full h-full relative bg-[#0a0c12] p-4 flex flex-col justify-between overflow-hidden">
          {/* Header readout */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2 z-10">
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-slate-200 uppercase tracking-wider">Tactical Planar Surface Projection</span>
              <span className="text-[10px] text-slate-500">EPSG:4326 Equirectangular</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Synced Events: <strong className="text-slate-200 font-semibold">{filteredEvents.length}</strong></span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="flex-1 relative flex items-center justify-center py-2">
            <svg 
              className="w-full h-full max-h-[580px] bg-[#0c0e16] rounded border border-slate-800/80" 
              viewBox="0 0 1000 500"
            >
              <defs>
                {/* Grid Pattern */}
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#161a26" strokeWidth="0.8" />
                </pattern>
              </defs>

              <rect width="1000" height="500" fill="url(#grid)" />

              {/* Equirectangular Latitude Lines */}
              <line x1="0" y1="250" x2="1000" y2="250" stroke="#1e2436" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="125" x2="1000" y2="125" stroke="#141824" strokeWidth="0.8" />
              <line x1="0" y1="375" x2="1000" y2="375" stroke="#141824" strokeWidth="0.8" />
              
              {/* Longitude Prime Meridian & Axis */}
              <line x1="500" y1="0" x2="500" y2="500" stroke="#1e2436" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="250" y1="0" x2="250" y2="500" stroke="#141824" strokeWidth="0.8" />
              <line x1="750" y1="0" x2="750" y2="500" stroke="#141824" strokeWidth="0.8" />

              {/* Schematic World Outlines for Geographic Context */}
              <g fill="#141824" stroke="#22293d" strokeWidth="0.8" opacity="0.85">
                {/* North America */}
                <path d="M 120 70 L 260 65 L 300 130 L 250 200 L 200 240 L 160 170 L 120 140 Z" />
                {/* South America */}
                <path d="M 270 260 L 340 270 L 330 380 L 290 440 L 250 360 L 260 290 Z" />
                {/* Eurasia */}
                <path d="M 460 70 L 850 60 L 890 140 L 800 240 L 680 230 L 590 190 L 510 120 L 460 110 Z" />
                {/* Africa */}
                <path d="M 460 180 L 570 190 L 560 330 L 510 390 L 460 320 L 440 240 Z" />
                {/* Australia */}
                <path d="M 780 300 L 880 310 L 870 380 L 800 390 L 760 340 Z" />
              </g>

              {/* Attack Vector Lines */}
              {filteredEvents.map((ev) => {
                if (!ev.metadata_json?.origin_lat || !ev.metadata_json?.origin_lon) return null;
                const ox = ((ev.metadata_json.origin_lon + 180) / 360) * 1000;
                const oy = ((90 - ev.metadata_json.origin_lat) / 180) * 500;
                const tx = ((ev.longitude + 180) / 360) * 1000;
                const ty = ((90 - ev.latitude) / 180) * 500;
                const color = getSeverityColor(ev.severity);
                const isLatest = ev.id === latestEventId;

                return (
                  <g key={`arc-${ev.id}`}>
                    <line 
                      x1={ox} y1={oy} x2={tx} y2={ty} 
                      stroke={color} 
                      strokeWidth={isLatest ? "2" : "1.2"} 
                      strokeDasharray="4 4" 
                      opacity={isLatest ? "0.9" : "0.6"} 
                    />
                    <circle cx={ox} cy={oy} r="2.5" fill="#475569" stroke={color} strokeWidth="0.8" />
                  </g>
                );
              })}

              {/* Event Pins */}
              {filteredEvents.map((ev) => {
                const x = ((ev.longitude + 180) / 360) * 1000;
                const y = ((90 - ev.latitude) / 180) * 500;
                const color = getSeverityColor(ev.severity);
                const isSelected = ev.id === selectedEventId;
                const isLatest = ev.id === latestEventId;
                const isHovered = hoveredEvent?.id === ev.id;

                return (
                  <g 
                    key={`pin-${ev.id}`} 
                    className="cursor-pointer transition-transform"
                    onClick={() => onSelectEvent(ev)}
                    onMouseEnter={() => setHoveredEvent(ev)}
                    onMouseLeave={() => setHoveredEvent(null)}
                  >
                    {/* Live arrival ripple ring */}
                    {isLatest && (
                      <circle 
                        cx={x} cy={y} r="16" 
                        fill="none" stroke={color} strokeWidth="1.5" opacity="0.8"
                      />
                    )}

                    {/* Selected or critical perimeter indicator */}
                    {(isSelected || ev.severity === 'CRITICAL' || isLatest) && (
                      <circle 
                        cx={x} cy={y} r={isSelected ? 10 : 8} 
                        fill="none" stroke={color} strokeWidth="1" opacity="0.6" 
                      />
                    )}

                    {/* Core pinpoint */}
                    <circle 
                      cx={x} cy={y} 
                      r={isSelected ? 5.5 : (isHovered || isLatest ? 4.5 : 3.5)} 
                      fill={color} 
                      stroke="#f8fafc" 
                      strokeWidth={isSelected || isLatest ? 1.5 : 0.8} 
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip in 2D View */}
            {hoveredEvent && (
              <div 
                className="absolute pointer-events-none matte-panel px-2.5 py-1.5 rounded shadow-lg text-[11px] font-mono z-30"
                style={{
                  left: `${Math.min(Math.max(((hoveredEvent.longitude + 180) / 360) * 100, 10), 90)}%`,
                  top: `${Math.min(Math.max(((90 - hoveredEvent.latitude) / 180) * 100, 15), 85)}%`,
                  transform: 'translate(-50%, -120%)'
                }}
              >
                <div className="font-semibold text-slate-100">{hoveredEvent.title}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span style={{ color: getSeverityColor(hoveredEvent.severity) }} className="font-bold">
                    {hoveredEvent.severity}
                  </span>
                  <span>{hoveredEvent.latitude.toFixed(2)}°, {hoveredEvent.longitude.toFixed(2)}°</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && viewMode === '3d' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b0d13]/90 z-20">
          <div className="text-center font-mono space-y-3">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <div className="text-xs text-slate-400 tracking-wider uppercase">Loading ESRI Dark Gray Telemetry Base...</div>
          </div>
        </div>
      )}

      {/* Top Right View Mode Toggle (3D Globe vs 2D Planar) */}
      <div className="absolute top-4 right-4 z-20 flex items-center bg-[#10131d] border border-slate-800 rounded p-0.5 shadow-md">
        <button
          onClick={() => setViewMode('3d')}
          disabled={!webglSupported}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
            viewMode === '3d' && webglSupported
              ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="3D Orthographic Globe Projection"
        >
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>3D Globe</span>
        </button>
        <button
          onClick={() => setViewMode('2d')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
            viewMode === '2d' || !webglSupported
              ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="2D Equirectangular Planar Map"
        >
          <Map className="w-3.5 h-3.5 text-slate-300" />
          <span>2D Map</span>
        </button>
      </div>

      {/* Bottom Map Status Readout */}
      <div className="absolute bottom-3 left-4 z-10 font-mono text-[10px] text-slate-400 bg-[#0e111a]/95 px-2.5 py-1 rounded border border-slate-800/90 flex items-center gap-3">
        <span className="text-slate-500">PROJECTION: {viewMode === '3d' && webglSupported ? 'WGS84 3D SPHERE (ESRI CAN)' : 'EPSG:4326 PLANAR'}</span>
        <span>ACTIVE SENSORS: <strong className="text-slate-200">{filteredEvents.length}</strong></span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          STREAM: LIVE
        </span>
      </div>
    </div>
  );
};
