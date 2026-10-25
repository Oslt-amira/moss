'use client';
import {useEffect,useRef} from 'react';
type Sample={x:number;y:number;angle:number;born:number;id:number;distance:number};
const hash=(n:number)=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);};
const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export default function GrowthTrail({paused,resetKey,reduced,onGrow}:{paused:boolean;resetKey:number;reduced:boolean;onGrow:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),samples=useRef<Sample[]>([]),clock=useRef(0),travel=useRef(0),serial=useRef(0),grow=useRef(onGrow);grow.current=onGrow;
 useEffect(()=>{samples.current=[];serial.current=0;travel.current=0;},[resetKey]);
 useEffect(()=>{
 const el=canvas.current!,ctx=el.getContext('2d')!;let w=0,h=0,frame=0,previous=performance.now(),lastMove=0,active=false,initialized=false,heading=0;
 let tip={x:0,y:0},target={x:0,y:0},anchor={x:0,y:0};const coarse=matchMedia('(pointer:coarse)').matches;
 const resize=()=>{w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,2);el.width=w*d;el.height=h*d;ctx.setTransform(d,0,0,d,0,0);};resize();
 const leave=()=>{active=false;initialized=false;};
 const move=(event:PointerEvent)=>{if(paused||reduced||(coarse&&event.buttons===0)||(event.target as HTMLElement).closest('button,a,input,.dock-area,.fossil-note,.fossil-discovery')){leave();return;}const x=event.clientX,y=event.clientY,now=performance.now();if(!initialized||now-lastMove>500||Math.hypot(x-target.x,y-target.y)>280){tip={x,y};anchor={x,y};heading=0;initialized=true;}target={x,y};active=true;lastMove=now;};
 function leaf(x:number,y:number,a:number,size:number,shade:number,opacity:number){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=`rgba(${48+shade},${71+shade},${24+shade*.4},${opacity})`;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-size*.65,-size*.6,-size*.4,-size*1.5,0,-size*1.85);ctx.bezierCurveTo(size*.5,-size*1.2,size*.65,-size*.45,0,0);ctx.fill();ctx.restore();}
 function branch(x:number,y:number,a:number,len:number,depth:number,seed:number,age:number,delay:number,opacity:number){
  const g=ease((age-delay)/650);if(g<=0||opacity<.018)return;
  const bend=(hash(seed+4)-.5)*.9,cx=x+Math.cos(a+bend)*len*.56,cy=y+Math.sin(a+bend)*len*.56,ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len;
  const point=(t:number)=>({x:(1-t)*(1-t)*x+2*(1-t)*t*cx+t*t*ex,y:(1-t)*(1-t)*y+2*(1-t)*t*cy+t*t*ey});
  const end=point(g);ctx.strokeStyle=`rgba(76,101,45,${opacity*.64})`;ctx.lineWidth=.3+depth*.15;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+(cx-x)*g,y+(cy-y)*g,end.x,end.y);ctx.stroke();
  for(let k=1;k<=4;k++){const q=k/5,lg=ease((g-q)*4);if(lg<=0)continue;const p=point(q),tangent=Math.atan2((1-q)*(cy-y)+q*(ey-cy),(1-q)*(cx-x)+q*(ex-cx)),size=(.65+depth*.45+hash(seed+k)*.6)*lg;leaf(p.x,p.y,tangent+.75,size,hash(seed+9)*25,opacity*.85);leaf(p.x,p.y,tangent-.75,size*.9,hash(seed+9)*25,opacity*.78);}
  if(depth>0)for(let child=0;child<2;child++){const q=child===0?.43:.78,p=point(q),side=child===0?-1:1,tangent=Math.atan2((1-q)*(cy-y)+q*(ey-cy),(1-q)*(cx-x)+q*(ex-cx));branch(p.x,p.y,tangent+side*(.55+hash(seed+child)*.38),len*(.48+hash(seed+12)*.13),depth-1,seed*3+child+11,age,delay+350+child*160,opacity*.94);}
 }
 const draw=(now:number)=>{
  if(now-previous<22){frame=requestAnimationFrame(draw);return;}
  const dt=Math.max(0,Math.min(now-previous,50));previous=now;if(!paused)clock.current+=dt;ctx.clearRect(0,0,w,h);
  if(active&&!paused&&!reduced&&now-lastMove<260){const dx=target.x-tip.x,dy=target.y-tip.y,dist=Math.hypot(dx,dy);if(dist>1.3){const a=Math.atan2(dy,dx);heading+=Math.atan2(Math.sin(a-heading),Math.cos(a-heading))*(1-Math.exp(-dt/75));const mix=1-Math.exp(-dt/68);tip.x+=dx*mix;tip.y+=dy*mix;const step=Math.hypot(tip.x-anchor.x,tip.y-anchor.y);if(step>=5){const count=Math.min(12,Math.floor(step/5));for(let i=1;i<=count;i++){const q=i/count;travel.current+=step/count;samples.current.push({x:anchor.x+(tip.x-anchor.x)*q,y:anchor.y+(tip.y-anchor.y)*q,angle:heading,born:clock.current,id:serial.current++,distance:travel.current});}anchor={...tip};grow.current();}}}
  if(samples.current.length>260)samples.current.splice(0,samples.current.length-260);samples.current=samples.current.filter(s=>clock.current-s.born<7100);ctx.font='8px "Courier New",monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=0;i<samples.current.length;i++){
   const s=samples.current[i],age=clock.current-s.born,fade=ease((7100-age)/4300)*Math.exp(-Math.max(0,travel.current-s.distance-140)/370);if(fade<.018)continue;const growth=ease((age-250)/1100),nx=-Math.sin(s.angle),ny=Math.cos(s.angle);
   // Two close, gently winding rows retain the path's width without the diffuse green carpet.
   for(const side of [-1,1]){const offset=side*4,x=s.x+nx*offset,y=s.y+ny*offset;
    if(s.id%2===0){ctx.fillStyle=`rgba(74,92,58,${(1-growth)*fade*.46})`;ctx.fillText(hash(s.id+side*17)>.5?'1':'0',x,y);}
    const prev=samples.current[i-1];if(prev&&Math.hypot(s.x-prev.x,s.y-prev.y)<24){ctx.strokeStyle=`rgba(87,110,52,${fade*growth*.27})`;ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(prev.x-Math.sin(prev.angle)*offset,prev.y+Math.cos(prev.angle)*offset);ctx.quadraticCurveTo(s.x-Math.cos(s.angle)*2+nx*offset,s.y-Math.sin(s.angle)*2+ny*offset,x,y);ctx.stroke();}
    if(s.id%4===0){leaf(x,y,s.angle+side*.7,1.6*growth,hash(s.id)*20,fade*growth*.58);}
   }
   if(s.id%10===0)for(let root=0;root<4;root++){const side=root%2?1:-1,a=s.angle+side*(.48+Math.floor(root/2)*.65+hash(s.id+root)*.24);branch(s.x+nx*side*3,s.y+ny*side*3,a,18+hash(s.id*7+root)*19,3,s.id*17+root*71,age,250+root*120,fade*.82);}
  }frame=requestAnimationFrame(draw);
 };
 frame=requestAnimationFrame(draw);window.addEventListener('pointermove',move);document.documentElement.addEventListener('pointerleave',leave);window.addEventListener('resize',resize);return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);document.documentElement.removeEventListener('pointerleave',leave);window.removeEventListener('resize',resize);};
 },[paused,reduced]);
 return <canvas ref={canvas} className="growth-trail" aria-hidden="true"/>;
}
