'use client';
export default function GeologicalDiagram({found,onDiscover}:{found:boolean;onDiscover:()=>void}){
 return <div className="geological-diagram">
  <div className="diagram-mobile-labels" aria-hidden="true"><span><b>01</b> Living surface</span><span><b>02</b> Mineral memory</span><span><b>03</b> Parent rock</span></div><svg viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid meet" className="diagram-lines" aria-hidden="true">
   <g className="diagram-guide"><path d="M176 130v475m-7-475h14m-14 119h14m-14 119h14m-14 119h14m-14 118h14"/><path d="M275 625h730" strokeDasharray="2 7"/></g>
   <g className="diagram-callout"><circle cx="500" cy="270" r="3"/><path d="M497 270h-95l-48-60h-95"/><circle cx="790" cy="430" r="3"/><path d="M793 430h90l55-62h100"/><circle cx="730" cy="568" r="3"/><path d="M733 568h125l46 35h133"/></g>
   <g className="diagram-text"><text x="259" y="177" className="diagram-number">01 / THE LIVING SURFACE</text><text x="259" y="195">Bryophytes · roots · weathering</text><text x="940" y="337" className="diagram-number">02 / THE MEMORY LAYER</text><text x="940" y="355">Mineral strata · fossil impression</text><text x="907" y="573" className="diagram-number">03 / THE FOUNDATION</text><text x="907" y="591">Fractured parent rock</text><text x="160" y="650" className="diagram-caption">ILLUSTRATIVE CROSS-SECTION · NOT TO SCALE</text></g>
  </svg>
  <button className={`fossil-discovery ${found?'is-found':''}`} onClick={onDiscover} aria-label="Inspect the fossil in the middle rock layer"><span className="discovery-ring"/>{found?'Ammonite':'Something in the stone'}</button>
  {found&&<aside className="fossil-note glass-panel" aria-live="polite"><span className="fossil-note-index">A SMALL DISCOVERY / 001</span><h2>A spiral, kept in stone.</h2><p>An ammonite impression rests between the layers. A little echo of a world before this one.</p><span className="panel-caption">A sculpted fossil study</span></aside>}
 </div>;
}
