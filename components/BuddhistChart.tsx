import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { ChartData, HistoricalEvent, EventType } from '../types';

interface BuddhistChartProps {
  data: ChartData;
  onNodeClick: (event: HistoricalEvent) => void;
  selectedId: string | null;
}

const MARGIN = { top: 90, right: 50, bottom: 50, left: 180 };
const ROW_HEIGHT = 100;

// Detailed SVG paths for country silhouettes
// Central Asia and Tibet paths extracted from provided SVGs
const COUNTRY_PATHS: Record<string, string> = {
  'central_asia': "m -10,50 c -0.53451,-2.90732 -3.22001,-3.79046 -5.65531,-4.95056 -2.18178,-1.50057 -4.5583,-0.4286 -6.54521,0.91151 -0.1933,-1.58851 -0.93464,-3.96303 -1.05611,-4.79828 0.37332,-0.92071 -2.144727,-0.54407 -1.0354,-2.22997 -0.0291,-1.62244 2.64026,1.39864 2.95009,-0.86703 -0.71858,-1.11388 -1.7317,-3.41196 -2.995076,-1.2076 -0.797796,0.93025 0.671546,-3.39538 -1.549265,-2.7736 -1.016225,-1.01316 -3.699844,-3.72318 -0.728687,-2.80915 -1.18871,-2.66909 5.978108,-1.6145 2.764528,0.52441 0.50551,-1.20015 4.27557,-1.55001 1.93482,-2.71575 -2.33989,1.31895 -0.89188,-3.08176 -3.399843,-2.29904 -2.082142,-1.23152 -4.559421,2.58598 -5.526522,0.31219 0.754423,-1.922 -5.327583,-2.22109 -2.955807,-5.19977 0.04521,-1.68401 1.145601,-2.60536 2.240316,-1.12687 1.634467,-0.0552 -0.05616,-2.05349 1.911363,-2.18612 1.927376,-1.70396 4.855263,-1.6836 7.009403,-0.65893 0.72844,0.96663 1.47497,1.50409 1.75532,0.87973 2.319,0.9856 5.10914,-1.86316 7.2345,0.53266 1.10021,-0.32314 3.87827,0.44917 3.33521,-1.68237 -1.53601,-0.34928 -2.75898,-1.3269 -0.54126,-2.07864 -1.70314,-1.34945 3.41179,-1.46117 0.49919,-1.82761 0.23853,-0.92077 -1.28017,-1.49996 0.45966,-1.82094 2.95601,0.32192 5.5721,-1.29588 8.45828,-1.60018 2.28535,-0.99147 6.43316,-2.8675 7.2039,0.92471 0.0888,0.73763 2.05038,-0.0502 2.47008,0.68827 0.91357,-0.46267 2.20383,0.55835 0.77424,0.97013 2.04888,1.23649 5.79528,-3.44808 5.72192,-0.74897 2.72399,1.32402 3.43925,5.50641 5.98531,6.30584 1.56043,-0.49849 2.6777,1.16746 4.42606,0.24565 2.08021,0.22616 3.25032,3.8842 5.92365,2.51775 1.92955,2.1426 -3.31201,2.76663 -2.19218,5.21551 -1.9531,0.576 -5.19423,-1.06351 -4.92442,2.44189 0.77504,2.45224 -4.86669,-0.14663 -3.50224,2.66327 1.72675,2.50793 -0.81928,5.07146 -3.14467,5.96332 -1.81532,0.23279 -2.82583,2.2954 -4.52816,1.99782 -1.82879,-0.86685 -5.13603,3.29228 -1.77758,4.38421 1.89439,1.4453 -0.20516,3.28187 -1.76807,1.95301 -1.23899,0.96803 -4.25861,2.35488 -3.1828,-0.61579 -0.31837,-2.27993 -2.14227,-0.8779 -2.49598,0.38194 -2.03186,1.58062 -4.06277,0.62019 -6.50152,0.31597 -2.55142,0.80231 -3.67175,3.9629 -6.22891,4.54627 -0.24247,0.33271 -0.68556,-0.69166 -0.82282,-0.47889 z m 26.14473,-14.44359 c 2.46842,-2.06416 -4.77482,-0.29227 -0.9848,0.0659 0.32674,0.0392 0.67172,0.061 0.9848,-0.0659 z",
  'tibet': "m 0,50 c -0.139339,-2.26015 -0.955755,-3.54282 -3.133736,-2.20376 -2.231698,0.85653 -4.193764,-0.79065 -6.155849,-0.45398 -0.26716,0.0231 -1.108586,0.39525 -1.574832,-0.87907 -1.270909,-0.53205 -2.234938,-0.34046 -2.562364,-1.71165 -2.367038,0.88554 -3.115609,-3.6204 -5.349436,-2.54248 -1.926056,-1.80531 -4.378979,-3.33476 -6.463629,-4.51309 -1.587756,0.42082 -1.452669,2.37111 -2.837398,0.45791 -2.200603,-1.77731 -4.7301154,-2.86774 -6.7297222,-4.56508 -1.2343244,-0.0252 -0.7880923,-3.3887 -1.8558279,-4.51391 0.9954124,-1.39207 2.6403195,1.88078 2.9486483,-0.78401 -0.5149935,-2.02484 -3.5200024,-5.17335 -0.499455,-6.60792 3.4234958,0.23432 3.1569728,-5.19932 6.2492838,-4.51455 2.177779,0.32965 4.234683,0.71344 5.652193,-1.37177 2.278828,0.42658 4.483197,2.23015 6.90457,0.64189 1.978333,-1.41096 4.702032,-0.39492 6.190822,-2.47933 1.836584,-1.76321 4.654314,-1.0651 6.958087,-1.65728 1.919248,-0.0958 4.927328,0.87744 4.888885,2.41327 1.329968,1.20936 -1.876027,3.60144 0.616346,4.71813 -0.464546,2.59733 0.152725,5.31812 2.795071,6.61257 1.577876,-0.27994 3.361259,-0.40911 4.622728,1.379 3.319311,0.64734 6.778783,1.94996 9.940894,1.37714 1.943379,1.28695 2.092496,3.72633 4.868586,3.59484 -0.519711,-2.10284 2.688297,0.88841 2.285646,-1.17854 1.548663,-0.99939 3.263735,-3.81098 4.926787,-1.01481 1.796861,2.10813 1.388808,3.95965 2.312462,6.13879 0.456689,2.26685 0.571317,5.13404 -0.48629,7.2332 -1.676936,-0.65631 -0.384791,4.32762 -2.533216,2.38948 -0.928675,0.83396 -2.579773,-2.02386 -3.005263,0.14487 -0.998654,-0.99251 -4.966448,0.19508 -2.621238,-2.11645 -0.485358,-0.97877 -1.680445,-0.68217 -1.107269,-1.96624 -1.937812,-0.75522 -2.829848,1.82446 -4.729935,0.35534 -2.433019,-0.19951 -3.026192,2.56366 -5.302587,2.68837 -1.533012,1.60636 -3.694455,4.35847 -6.152666,2.6936 -2.195705,-0.86038 -5.042359,-1.68578 -7.22574,-0.29049 -1.000161,0.49171 -1.452216,2.02337 -1.834556,2.52601 z",
  'mongolia': "M10,40 C20,35 40,30 80,40 C90,45 85,60 70,65 C50,70 30,70 15,60 Z",
};

// Fallback generator
const generateCountryShape = (seed: string): string => {
  if (COUNTRY_PATHS[seed.toLowerCase()]) return COUNTRY_PATHS[seed.toLowerCase()];
  // Simple fallback poly (square-ish)
  return "M10,10 L90,10 L90,90 L10,90 Z";
};

// Distinct color scheme per EventType
const getTypeColor = (type: EventType) => {
  switch (type) {
    case EventType.PERSON: return '#0284c7'; // Sky 600
    case EventType.TEXT: return '#059669';   // Emerald 600
    case EventType.SCHOOL: return '#7c3aed'; // Violet 600
    case EventType.EVENT: return '#d97706';  // Amber 600
    default: return '#57534e'; // Stone 600
  }
};

// Reduced size formula: smaller base and smaller multiplier
const getNodeSize = (importance: number) => (importance || 5) * 1.5 + 4;

const BuddhistChart: React.FC<BuddhistChartProps> = ({ data, onNodeClick, selectedId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Interaction State
  const [hoveredType, setHoveredType] = useState<EventType | null>(null);
  const [lockedType, setLockedType] = useState<EventType | null>(null);
  
  // Refs to track state inside D3 closures without stale values
  const activeType = lockedType || hoveredType;
  const activeTypeRef = useRef<EventType | null>(activeType);

  // Track specific node interaction internally to avoid heavy React re-renders on hover
  const interactionRef = useRef<{ hoveredId: string | null; selectedId: string | null }>({ 
    hoveredId: null, 
    selectedId: selectedId 
  });
  
  // Sync selectedId prop with internal ref and visuals
  useEffect(() => {
    interactionRef.current.selectedId = selectedId;
  }, [selectedId]);

  // Update ref whenever state changes
  useEffect(() => {
    activeTypeRef.current = activeType;
  }, [activeType]);

  const currentZoomRef = useRef<number>(0.85); // Default start zoom
  const onNodeClickRef = useRef(onNodeClick);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  const { minIndex, maxIndex, sortedEvents } = useMemo(() => {
    const indices = data.countries.map(c => c.yIndex);
    const sorted = [...data.events].sort((a, b) => a.year - b.year);
    return { 
        minIndex: Math.min(...indices), 
        maxIndex: Math.max(...indices),
        sortedEvents: sorted
    };
  }, [data.countries, data.events]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Visual Update Logic ---
  const updateVisuals = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const k = currentZoomRef.current;
    const type = activeTypeRef.current;
    const { hoveredId, selectedId } = interactionRef.current;
    const activeId = hoveredId || selectedId;
                             
    // Check if an item should be visible based on Zoom level
    const isZoomVisible = (d: any) => {
        const importance = d.importance || 5;
        if (k < 0.7) return importance >= 10;
        if (k < 1.1) return importance >= 8;
        if (k < 1.6) return importance >= 7;
        if (k < 2.2) return importance >= 6;
        return true;
    };

    // 1. Node Groups (Opacity + Highlights)
    svg.selectAll('.node-group')
       .style('opacity', (d: any) => (type && d.type !== type) ? 0.1 : 1)
       .each(function(d: any) {
           const g = d3.select(this);
           const isActive = d.id === activeId;
           const color = getTypeColor(d.type);
           const activeColor = '#1c1917'; // Black

           // Leader Line
           g.select('.leader-line')
            .attr('stroke', isActive ? activeColor : color)
            .attr('stroke-width', isActive ? 2 : 1)
            .style('opacity', isActive ? 1 : (isZoomVisible(d) ? 1 : 0));

           // Node Shapes
           if (d.type === EventType.SCHOOL) {
               g.select('.school-bg')
                .attr('stroke', isActive ? activeColor : color)
                .attr('stroke-opacity', isActive ? 1 : 0.5);
               g.select('.main-node')
                .attr('fill', isActive ? activeColor : color);
           } else {
               g.selectAll('.main-node')
                .attr('stroke', isActive ? activeColor : color)
                .attr('stroke-width', isActive ? 3 : 2);
           }
       });

    // 2. Links
    svg.selectAll('.link')
        .attr('stroke-width', (d: any) => {
            if (activeId && (d.sourceId === activeId || d.targetId === activeId)) return 3;
            return 1.5;
        })
        .attr('stroke-opacity', (d: any) => {
            if (activeId && (d.sourceId === activeId || d.targetId === activeId)) return 1;
            if (type) return 0.05;
            return d.type === 'influence' ? 0.6 : 0.7;
        });

    // 3. Labels
    svg.selectAll('.label-group')
       .each(function(d: any) {
           const g = d3.select(this);
           const isActive = d.id === activeId;
           const color = getTypeColor(d.type);
           const activeColor = '#1c1917';

           // Visibility
           let opacity = 1;
           let events = 'auto';

           if (isActive) {
               opacity = 1;
           } else {
               if (!isZoomVisible(d)) {
                   opacity = 0;
                   events = 'none';
               } else if (type && d.type !== type) {
                   opacity = 0.1;
               }
           }
           
           g.style('opacity', opacity).style('pointer-events', events);

           // Styling
           g.select('.label')
            .attr('fill', isActive ? activeColor : color)
            .style('font-weight', '600'); // Standard semi-bold

           g.select('.leader-dot')
            .attr('fill', isActive ? activeColor : color)
            .attr('r', isActive ? 2.5 : 1.5);
           
           if (isActive) g.raise();
       });

  }, []);

  // Trigger visual updates when filter changes (React driven)
  useEffect(() => {
    updateVisuals();
  }, [activeType, updateVisuals, selectedId]);

  // --- Main D3 Render Effect ---
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // --- Scales ---
    const totalRows = maxIndex - minIndex + 2;
    const initialChartHeight = totalRows * ROW_HEIGHT;
    
    const initialYScale = d3.scaleLinear()
      .domain([maxIndex + 0.8, minIndex - 0.8])
      .range([MARGIN.top, initialChartHeight + MARGIN.top]);

    const initialXScale = d3.scaleLinear()
      .domain([-600, 2000])
      .range([MARGIN.left, width * 2.5]);

    // --- Definitions ---
    const defs = svg.append('defs');
    defs.append('clipPath').attr('id', 'content-clip')
      .append('rect').attr('x', MARGIN.left).attr('y', MARGIN.top).attr('width', width - MARGIN.left).attr('height', height - MARGIN.top);

    defs.append('clipPath').attr('id', 'yaxis-clip')
        .append('rect').attr('x', 0).attr('y', MARGIN.top).attr('width', MARGIN.left).attr('height', height - MARGIN.top);

    // --- Layers ---
    const bgLayer = svg.append('rect')
        .attr('width', width).attr('height', height)
        .attr('fill', 'transparent')
        .on('click', () => {
            // Click elsewhere resets selection
            interactionRef.current.selectedId = null;
            updateVisuals();
        });

    const contentG = svg.append('g').attr('clip-path', 'url(#content-clip)');
    
    // Layer Order: Grid -> Links -> Leaders+Nodes -> Labels (Top)
    const gridG = contentG.append('g').attr('class', 'grid-layer');
    const linkG = contentG.append('g').attr('class', 'link-layer');
    const leaderNodeLayer = contentG.append('g').attr('class', 'leader-node-layer');
    const labelLayer = contentG.append('g').attr('class', 'label-layer');

    // Axes Backgrounds
    svg.append('rect').attr('class', 'y-axis-bg').attr('x', 0).attr('y', 0).attr('width', MARGIN.left).attr('height', height).attr('fill', '#f5f5f4').style('pointer-events', 'none');
    const yAxisG = svg.append('g').attr('clip-path', 'url(#yaxis-clip)');

    const xAxisBg = svg.append('rect')
       .attr('class', 'x-axis-bg').attr('x', 0).attr('y', 0).attr('width', width).attr('height', MARGIN.top)
       .attr('fill', '#f5f5f4').style('filter', 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))').style('pointer-events', 'none');
    svg.append('line').attr('x1', 0).attr('x2', width).attr('y1', MARGIN.top).attr('y2', MARGIN.top).attr('stroke', '#d6d3d1');
    const xAxisG = svg.append('g');

    // Corner Logo
    svg.append('rect').attr('width', MARGIN.left).attr('height', MARGIN.top).attr('fill', '#e7e5e4');
    svg.append('text').attr('x', MARGIN.left / 2).attr('y', MARGIN.top / 2).attr('dy', '0.35em').attr('text-anchor', 'middle')
        .attr('class', 'text-xs font-bold text-stone-600 uppercase tracking-widest').text('Timeline');

    // Helper functions for drawing shapes
    const drawNodeShapes = (selection: d3.Selection<SVGGElement, HistoricalEvent, any, any>) => {
      selection.each(function(d) {
        const el = d3.select(this);
        const size = getNodeSize(d.importance || 5);
        const color = getTypeColor(d.type);

        if (d.type === EventType.PERSON) {
            el.append('circle').attr('class', 'main-node').attr('r', size).attr('fill', '#fff').attr('stroke', color).attr('stroke-width', 2);
            el.append('text').text('👤').attr('class', 'icon-text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('y', 1).style('font-size', (size * 1.0)+'px').style('pointer-events','none');
        } else if (d.type === EventType.TEXT) {
            el.append('rect').attr('class', 'main-node').attr('x', -size).attr('y', -size*0.8).attr('width', size*2).attr('height', size*1.6).attr('rx', 3).attr('fill', '#fff').attr('stroke', color).attr('stroke-width', 2);
            el.append('text').text('📜').attr('class', 'icon-text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('y', 1).style('font-size', (size * 1.0)+'px').style('pointer-events','none');
        } else if (d.type === EventType.SCHOOL) {
            const w = 40; // Default base width
            el.append('rect').attr('class','school-bg').attr('x', 0).attr('y', -size/2).attr('width', w).attr('height', size).attr('rx', size/2).attr('fill', color).attr('fill-opacity', 0.15).attr('stroke', color).attr('stroke-opacity', 0.5);
            el.append('circle').attr('class', 'main-node').attr('r', 3).attr('fill', color);
        } else {
            el.append('circle').attr('class', 'main-node').attr('r', size * 0.7).attr('fill', '#fff').attr('stroke', color).attr('stroke-width', 2);
        }
      });
    };

    const drawLabelText = (selection: d3.Selection<SVGGElement, HistoricalEvent, any, any>) => {
      selection.each(function(d) {
        const el = d3.select(this);
        const color = getTypeColor(d.type);
        el.append('circle').attr('class', 'leader-dot').attr('r', 1.5).attr('fill', color);
        el.append('text').attr('class', 'label').attr('fill', color).text(d.name)
          .style('font-size', '14px').style('font-weight', '600')
          .style('stroke', 'rgba(255,255,255,0.8)').style('stroke-width', '2px')
          .style('stroke-linejoin', 'round').style('paint-order', 'stroke')
          .attr('dx', 4).attr('dy', '0.35em');
      });
    };

    // --- Render Elements Function ---
    const renderContent = (xSc: d3.ScaleLinear<number, number>, ySc: d3.ScaleLinear<number, number>) => {
      
      // 1. Grid (No Change)
      const xTicks = xSc.ticks(width / 150); 
      gridG.selectAll('.grid-x').data(xTicks).join('line').attr('class', 'grid-x').attr('stroke', '#e5e5e5').attr('stroke-dasharray', '4,4')
        .attr('x1', d => xSc(d)).attr('x2', d => xSc(d)).attr('y1', MARGIN.top).attr('y2', height);
      gridG.selectAll('.grid-y').data(data.countries).join('line').attr('class', 'grid-y').attr('stroke', '#f0f0f0')
        .attr('x1', MARGIN.left).attr('x2', width).attr('y1', d => ySc(d.yIndex)).attr('y2', d => ySc(d.yIndex));
      const indiaY = ySc(0);
      gridG.selectAll('.india-guide').data([0]).join('line').attr('class', 'india-guide')
        .attr('x1', MARGIN.left).attr('x2', width).attr('y1', indiaY).attr('y2', indiaY).attr('stroke', '#fbbf24').attr('stroke-opacity', 0.2).attr('stroke-width', 4);

      // 2. Links
      linkG.selectAll('.link').data(data.links).join('path').attr('class', 'link').attr('fill', 'none').attr('stroke-width', 1.5)
        .attr('d', d => {
            const s = data.events.find(e => e.id === d.sourceId);
            const t = data.events.find(e => e.id === d.targetId);
            if (!s || !t) return null;
            const sx = xSc(s.year);
            const sy = ySc(data.countries.find(c => c.id === s.countryId)?.yIndex || 0);
            const tx = xSc(t.year);
            const ty = ySc(data.countries.find(c => c.id === t.countryId)?.yIndex || 0);
            const midX = (sx + tx) / 2;
            return `M${sx},${sy} C${midX},${sy} ${midX},${ty} ${tx},${ty}`;
        })
        .attr('stroke', d => d.type === 'transmission' ? '#d97706' : '#78716c') 
        .attr('stroke-dasharray', d => d.type === 'influence' ? '4,2' : 'none');

      // Shared Handlers (Modified to use internal ref)
      const handleMouseOver = (event: any, d: HistoricalEvent) => {
          interactionRef.current.hoveredId = d.id;
          updateVisuals();
      };

      const handleMouseOut = (event: any, d: HistoricalEvent) => {
          interactionRef.current.hoveredId = null;
          updateVisuals();
      };

      const handleClick = (event: any, d: HistoricalEvent) => {
          event.stopPropagation();
          interactionRef.current.selectedId = d.id;
          updateVisuals();
          onNodeClickRef.current(d);
      };

      // Helper for positioning
      const getTransform = (d: HistoricalEvent) => {
          const country = data.countries.find(c => c.id === d.countryId);
          const x = xSc(d.year);
          const y = ySc(country?.yIndex || 0);
          return { x, y };
      };

      // 3. Leader + Node Layer (Combined Group)
      const nodeGroups = leaderNodeLayer.selectAll<SVGGElement, HistoricalEvent>('.node-group')
        .data(sortedEvents, d => d.id)
        .join(
           enter => {
               const g = enter.append('g').attr('class', 'node-group').attr('id', d => `node-${d.id}`)
                   .style('cursor', 'pointer')
                   .on('click', handleClick)
                   .on('mouseenter', handleMouseOver).on('mouseleave', handleMouseOut);
               
               // ORDER MATTERS: Leader first, then Node Shapes
               g.append('line').attr('class', 'leader-line').attr('stroke-width', 1).attr('stroke-opacity', 0.6);
               g.call(drawNodeShapes);
               return g;
           },
           update => update,
           exit => exit.remove()
        )
        .attr('transform', d => {
            const pos = getTransform(d);
            const k = currentZoomRef.current;
            const nodeScale = Math.min(Math.max(Math.sqrt(k), 0.5), 2.5);

            if (d.type === EventType.SCHOOL && d.endYear) {
                const w = xSc(d.endYear) - xSc(d.year);
                d3.select(`#node-${d.id} .school-bg`).attr('width', Math.max(w, 20));
                return `translate(${pos.x}, ${pos.y})`; 
            }
            return `translate(${pos.x}, ${pos.y}) scale(${nodeScale})`;
        });
      
      // Update Leader line geometry (local space within scaled group)
      nodeGroups.select('.leader-line')
        .attr('stroke', d => getTypeColor(d.type))
        .attr('x1', 0).attr('y1', 0) // Start at center of node
        .attr('x2', 0).attr('y2', d => {
             // Calculate how far up the leader goes relative to node size
             const size = getNodeSize(d.importance || 5);
             let baseOffset = -size * 0.7; 
             if (d.type === EventType.PERSON) baseOffset = -size;
             if (d.type === EventType.TEXT) baseOffset = -size * 0.8;
             if (d.type === EventType.SCHOOL) baseOffset = -size * 0.5;
             
             // Extend slightly beyond node
             return baseOffset - 35; 
        });

      // 4. Labels Layer (Top Level)
      const labelGroups = labelLayer.selectAll<SVGGElement, HistoricalEvent>('.label-group')
        .data(sortedEvents, d => d.id)
        .join(
            enter => {
                const g = enter.append('g').attr('class', 'label-group').attr('id', d => `label-${d.id}`)
                    .style('cursor', 'pointer')
                    .on('click', handleClick)
                    .on('mouseenter', handleMouseOver).on('mouseleave', handleMouseOut);
                g.call(drawLabelText);
                return g;
            },
            update => update,
            exit => exit.remove()
        )
        // Position label group at the node's origin
        .attr('transform', d => {
            const pos = getTransform(d);
            return `translate(${pos.x}, ${pos.y})`;
        });

      // Update Labels to sit at the tip of the scaled leader line
      labelGroups.each(function(d) {
          const k = currentZoomRef.current;
          const nodeScale = Math.min(Math.max(Math.sqrt(k), 0.5), 2.5);
          const size = getNodeSize(d.importance || 5);
          
          let baseOffset = -size * 0.7; 
          if (d.type === EventType.PERSON) baseOffset = -size;
          if (d.type === EventType.TEXT) baseOffset = -size * 0.8;
          if (d.type === EventType.SCHOOL) baseOffset = -size * 0.5;

          const localY = baseOffset - 35;
          
          // Apply scale to find visual position
          const scale = (d.type === EventType.SCHOOL && d.endYear) ? 1 : nodeScale;
          const pixelY = localY * scale;

          const labelEl = d3.select(this);
          labelEl.select('.leader-dot').attr('cx', 0).attr('cy', pixelY);
          labelEl.select('.label').attr('transform', `translate(0, ${pixelY}) rotate(-45)`);
      });

      // 5. Axes & Labels (Updated to use Images)
      xAxisG.attr('transform', `translate(0, ${MARGIN.top - 1})`).call(d3.axisTop(xSc).ticks(width/120).tickFormat(d => (d as number) < 0 ? `${Math.abs(d as number)} BCE` : `${d} CE`) as any);
      xAxisG.selectAll('text').attr('fill', '#44403c').style('font-weight', 'bold').style('font-size', '11px'); 
      xAxisG.selectAll('line').attr('stroke', '#a8a29e');
      xAxisG.select('.domain').remove(); 

      yAxisG.selectAll('.country-label').data(data.countries).join(enter => {
            const g = enter.append('g').attr('class', 'country-label');
            g.append('g').attr('class', 'icon-container'); 
            g.append('text').attr('class', 'country-name').attr('fill', '#1c1917').style('font-weight', 'bold').style('font-size', '12px'); 
            // Removed country-region text element
            return g;
        }).attr('transform', d => `translate(0, ${ySc(d.yIndex)})`).each(function(d) {
             const el = d3.select(this);
             const iconContainer = el.select('.icon-container');
             if (iconContainer.empty() || iconContainer.select('*').empty()) {
                 let iconHref = '';
                 
                 // Check external CDN code first
                 if (d.svgCode) {
                   iconHref = `https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/${d.svgCode}/vector.svg`;
                 } 
                 
                 if (iconHref) {
                   iconContainer.append('image')
                     .attr('href', iconHref)
                     .attr('width', 32)
                     .attr('height', 32)
                     .attr('transform', 'translate(30, -16)')
                     .style('filter', 'grayscale(100%) brightness(0.2)')
                     .attr('preserveAspectRatio', 'xMidYMid meet');
                 } else {
                   // Fallback path
                   iconContainer.append('path')
                     .attr('d', generateCountryShape(d.id))
                     .attr('fill', '#292524')
                     .attr('transform', 'translate(45, -12) scale(0.35)');
                 }
             }
             // Centered the country name vertically since region is gone
             el.select('.country-name').text(d.name).attr('x', 75).attr('y', 0).attr('dy', '0.35em');
        });
    };

    // --- Zoom Behavior ---
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .translateExtent([[-4000, -2000], [width * 10, height * 10]])
      .on('zoom', (event) => {
         currentZoomRef.current = event.transform.k;
         const newXScale = event.transform.rescaleX(initialXScale);
         const newYScale = event.transform.rescaleY(initialYScale);
         renderContent(newXScale, newYScale);
         updateVisuals();
      });

    svg.call(zoom);
    
    // Initial Render
    renderContent(initialXScale, initialYScale);
    updateVisuals();
    
    // Initial Position (Only if first load)
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.85));

  }, [data, dimensions, minIndex, maxIndex, sortedEvents, updateVisuals]); 

  // --- Legend Component ---
  const LegendItem = ({ type, color }: { type: EventType; color: string }) => {
    const isLocked = lockedType === type;
    const isHovered = hoveredType === type;
    
    let baseClasses = "flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded transition-all select-none ";
    if (isLocked) {
        baseClasses += "bg-stone-200 ring-2 ring-stone-400 font-bold shadow-sm";
    } else if (isHovered) {
        baseClasses += "bg-stone-100 ring-1 ring-stone-300";
    } else {
        baseClasses += "hover:bg-stone-50 text-stone-600";
    }

    const handleClick = () => {
        if (isLocked) {
            setLockedType(null); // Unlock
        } else {
            setLockedType(type); // Lock
        }
    };

    return (
        <div 
            className={baseClasses}
            onMouseEnter={() => setHoveredType(type)}
            onMouseLeave={() => setHoveredType(null)}
            onClick={handleClick}
            title="Click to lock filter"
        >
            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
            {type}
            {isLocked && <span className="text-[10px] ml-1 text-stone-500">✕</span>}
        </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-stone-50 select-none overflow-hidden">
      <svg ref={svgRef} width="100%" height="100%" style={{ cursor: 'grab' }} />
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-md text-xs font-medium text-stone-500 border border-stone-200 pointer-events-auto z-10 flex gap-4 items-center">
        <span className="pointer-events-none hidden sm:inline opacity-70">Scroll to Zoom • Drag to Pan</span>
        <div className="flex gap-2 border-l border-stone-300 pl-4">
            <LegendItem type={EventType.PERSON} color="#0284c7" />
            <LegendItem type={EventType.TEXT} color="#059669" />
            <LegendItem type={EventType.SCHOOL} color="#7c3aed" />
            <LegendItem type={EventType.EVENT} color="#d97706" />
        </div>
      </div>
    </div>
  );
};

export default BuddhistChart;