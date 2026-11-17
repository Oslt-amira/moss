'use client';
import {useLayoutEffect,useRef,type RefObject} from 'react';

type Point={x:number;y:number};
export type DiagramProjection=(points:readonly Point[])=>void;
const labels=[[354,210,259],[938,368,1038],[904,603,1037]];

export default function GeologicalDiagram({found,onDiscover,projection}:{found:boolean;onDiscover:()=>void;projection:RefObject<DiagramProjection|null>}){
 const overlay=useRef<HTMLDivElement>(null),lines=useRef<SVGGElement>(null),marker=useRef<HTMLButtonElement>(null);
 useLayoutEffect(()=>{
  const element=overlay.current!, paths=lines.current!, button=marker.current!;
  const dots=paths.querySelectorAll('circle'), leaders=paths.querySelectorAll('path');
  projection.current=points=>{
   const rect=element.getBoundingClientRect(), scale=Math.min(rect.width/1280,rect.height/800);
   if(!scale)return;
   const dx=(rect.width-1280*scale)/2,dy=(rect.height-800*scale)/2;
   for(let i=0;i<labels.length;i++){
    const x=(points[i].x-rect.left-dx)/scale,y=(points[i].y-rect.top-dy)/scale;
    const [endX,endY,labelX]=labels[i], elbow=(x+endX)/2;
    dots[i].setAttribute('cx',x.toFixed(2));dots[i].setAttribute('cy',y.toFixed(2));
    leaders[i].setAttribute('d',`M${x} ${y}H${elbow}L${endX} ${endY}H${labelX}`);
   }
   const fossil=points[3], left=Math.max(8,Math.min(fossil.x-rect.left+10,rect.width-button.offsetWidth-8));
   button.style.left=`${left}px`;button.style.top=`${fossil.y-rect.top}px`;
   element.dataset.projected='true';
  };
  return ()=>{projection.current=null;};
 },[projection]);
 return <div className="geological-diagram" ref={overlay}>
  <div className="diagram-mobile-labels" aria-hidden="true"><span><b>01</b> Living surface</span><span><b>02</b> Mineral memory</span><span><b>03</b> Parent rock</span></div><svg viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid meet" className="diagram-lines" aria-hidden="true">
   <g className="diagram-guide"><path d="M176 130v475m-7-475h14m-14 119h14m-14 119h14m-14 119h14m-14 118h14"/><path d="M275 625h730" strokeDasharray="2 7"/></g>
   <g ref={lines} className="diagram-callout projected-callouts"><circle r="3"/><path/><circle r="3"/><path/><circle r="3"/><path/></g>
   <g className="diagram-text"><text x="259" y="177" className="diagram-number">01 / THE LIVING SURFACE</text><text x="259" y="195">Bryophytes · roots · weathering</text><text x="940" y="337" className="diagram-number">02 / THE MEMORY LAYER</text><text x="940" y="355">Mineral strata · fossil impression</text><text x="907" y="573" className="diagram-number">03 / THE FOUNDATION</text><text x="907" y="591">Fractured parent rock</text><text x="160" y="650" className="diagram-caption">ILLUSTRATIVE CROSS-SECTION · NOT TO SCALE</text></g>
  </svg>
  <button ref={marker} className={`fossil-discovery ${found?'is-found':''}`} onClick={onDiscover} aria-label="Inspect the fossil in the middle rock layer"><span className="discovery-ring"/>{found?'Ammonite':'Something in the stone'}</button>
  {found&&<aside className="fossil-note glass-panel" aria-live="polite"><span className="fossil-note-index">A SMALL DISCOVERY / 001</span><h2>A spiral, kept in stone.</h2><p>An ammonite impression rests between the layers. A little echo of a world before this one.</p><span className="panel-caption">A sculpted fossil study</span></aside>}
 </div>;
}
