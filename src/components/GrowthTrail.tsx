'use client';
import { useEffect, useRef } from 'react';

type Sample={x:number;y:number;born:number;angle:number;width:number;id:number;start:boolean};
const fract=(n:number)=>n-Math.floor(n);
const hash=(n:number)=>fract(Math.sin(n*127.1+31.7)*43758.5453);
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};

// Pre-rendered, translucent micro-fronds keep the soft texture affordable to draw.
function mossTexture(variant:number){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
 const c=canvas.getContext('2d')!;c.scale(2,2);
 const hue=[77,91,107,65,120,83][variant%6];
 const floorTone=[11,17,9,23,12,26][variant%6];
 const base=c.createRadialGradient(32,32,0,32,32,29);
 base.addColorStop(0,`hsla(${hue},35%,${floorTone}%,.58)`);base.addColorStop(.5,`hsla(${hue},30%,${floorTone+5}%,.38)`);base.addColorStop(1,`hsla(${hue},30%,24%,0)`);
 c.fillStyle=base;c.fillRect(0,0,64,64);
 for(let j=0;j<180;j++){
  const r=Math.sqrt(hash(j+variant*53))*25,a=hash(j*3+variant*107)*Math.PI*2;
  const x=32+Math.cos(a)*r,y=32+Math.sin(a)*r*.86;
  const direction=hash(j*7+variant)*6.28,len=2.2+hash(j*11)*7.5;
  const tone=floorTone+7+hash(j*13+variant*83)*22;
  c.strokeStyle=`hsla(${hue+hash(j*17)*15},${30+hash(j)*24}%,${tone}%,${.25+hash(j*19)*.55})`;
  c.lineWidth=.28+hash(j*23)*.44;
  c.beginPath();c.moveTo(x,y);
  const ex=x+Math.cos(direction)*len,ey=y+Math.sin(direction)*len;
  c.quadraticCurveTo(x+Math.cos(direction+.4)*len*.5,y+Math.sin(direction+.4)*len*.5,ex,ey);c.stroke();
  for(let k=1;k<4;k++){
   const t=k/4,bx=x+(ex-x)*t,by=y+(ey-y)*t;
   const leaf=(1-t)*2.2+.5;
   for(const side of [-1,1]){const ang=direction+side*.8;
    c.strokeStyle=`hsla(${hue+8},${34+hash(j)*23}%,${tone+7}%,.72)`;
    c.beginPath();c.moveTo(bx,by);c.lineTo(bx+Math.cos(ang)*leaf,by+Math.sin(ang)*leaf);c.stroke();
   }
  }
  if(j%3===0){c.fillStyle=`hsla(${hue+5},48%,${tone+17}%,.54)`;c.beginPath();c.ellipse(ex,ey,.4,.65,direction,0,Math.PI*2);c.fill();}
 }
 return canvas;
}

export default function GrowthTrail({paused,resetKey,reduced,onGrow}:{paused:boolean;resetKey:number;reduced:boolean;onGrow:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),samples=useRef<Sample[]>([]),clock=useRef(0),serial=useRef(0),grow=useRef(onGrow);grow.current=onGrow;
 useEffect(()=>{samples.current=[];serial.current=0;},[resetKey]);
 useEffect(()=>{
  const el=canvas.current!,ctx=el.getContext('2d')!;const textures=Array.from({length:6},(_,i)=>mossTexture(i));
  let frame=0,w=0,h=0,previous=performance.now();let last:{x:number;y:number;time:number}|null=null;
  const coarse=matchMedia('(pointer:coarse)').matches;
  const resize=()=>{w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,2);el.width=w*d;el.height=h*d;ctx.setTransform(d,0,0,d,0,0);};resize();
  const leave=()=>{last=null;};
  const move=(event:PointerEvent)=>{
   if(paused||reduced||(coarse&&event.buttons===0))return;
   if((event.target as HTMLElement).closest('button,a,input,.dock-area')){last=null;return;}
   const x=event.clientX,y=event.clientY,now=performance.now();
   if(!last||now-last.time>220||Math.hypot(x-last.x,y-last.y)>240){last={x,y,time:now};samples.current.push({x,y,born:clock.current,angle:0,width:19,id:serial.current++,start:true});return;}
   const dx=x-last.x,dy=y-last.y,distance=Math.hypot(dx,dy);if(distance<6)return;
   const count=Math.floor(distance/6),angle=Math.atan2(dy,dx);
   const width=17+Math.min(11,distance/Math.max(8,now-last.time)*3);
   for(let i=1;i<=count;i++){const q=i*6/distance;samples.current.push({x:last.x+dx*q,y:last.y+dy*q,born:clock.current,angle,width,id:serial.current++,start:false});}
   const q=count*6/distance;last={x:last.x+dx*q,y:last.y+dy*q,time:now};
   if(samples.current.length>800)samples.current.splice(0,samples.current.length-800);grow.current();
  };
  function stamp(x:number,y:number,size:number,variant:number,alpha:number,angle:number){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(textures[variant%6],-size/2,-size/2,size,size);ctx.restore();}
  function ramify(sample:Sample,growth:number,opacity:number){
   if(sample.id%9!==0)return;
   const side=sample.id%2?1:-1;
   const startAngle=sample.angle+side*(.65+hash(sample.id)*.75);
   function twig(x:number,y:number,a:number,length:number,depth:number,progress:number){
    if(progress<=0)return;
    const g=ease(progress),ex=x+Math.cos(a)*length*g,ey=y+Math.sin(a)*length*g;
    ctx.strokeStyle=`rgba(77,99,43,${opacity*.34})`;ctx.lineWidth=.45+depth*.18;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.cos(a-.18)*length*g*.65,y+Math.sin(a-.18)*length*g*.65,ex,ey);ctx.stroke();
    for(let j=0;j<4;j++){const q=j/4,local=ease((progress-q*.45)*2);stamp(x+(ex-x)*q,y+(ey-y)*q,(6+depth*4)*local,sample.id+j,opacity*.72*local,a+j);}
    if(depth>0){const next=clamp((progress-.32)/.68);twig(ex,ey,a+side*.5,length*.62,depth-1,next);twig(x+(ex-x)*.7,y+(ey-y)*.7,a-side*.65,length*.48,depth-1,clamp((progress-.5)*2));}
   }
   twig(sample.x+Math.cos(sample.angle+Math.PI/2)*sample.width*side*.4,sample.y+Math.sin(sample.angle+Math.PI/2)*sample.width*side*.4,startAngle,13+hash(sample.id*7)*18,2,growth);
  }
  const draw=(now:number)=>{
   const dt=Math.min(now-previous,50);previous=now;if(!paused)clock.current+=dt;
   ctx.clearRect(0,0,w,h);samples.current=samples.current.filter(s=>clock.current-s.born<19000);
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='9px "Courier New",monospace';
   // One continuous, variable-width ribbon of binary cells. Growth consumes each cell locally.
   for(const s of samples.current){const age=clock.current-s.born,fade=ease((19000-age)/4000);const nx=-Math.sin(s.angle),ny=Math.cos(s.angle);
    for(let row=-2;row<=2;row++){
     const seed=s.id*19+row*173,r=hash(seed),g=ease((age-900-r*1200)/3000),offset=row*8.5;
     if(s.id%2===0&&Math.abs(offset)<s.width*.95){ctx.fillStyle=`rgba(65,79,54,${(1-g)*fade*(.32+r*.25)*ease(age/180)})`;ctx.fillText(r>.5?'1':'0',s.x+nx*offset,s.y+ny*offset);}
    }
   }
   for(const s of samples.current){const age=clock.current-s.born,fade=ease((19000-age)/4000);const nx=-Math.sin(s.angle),ny=Math.cos(s.angle);
    const broad=ease((age-1050)/4200);if(broad<=0)continue;
    // Overlapping cushions, soft shadows, and varied micro-leaves merge into an irregular living surface.
    for(let j=0;j<5;j++){
     const seed=s.id*19+j*173,r=hash(seed),g=ease((age-900-r*1200)/3000);if(g<=0)continue;
     const offset=(j-2)*s.width*.39+(r-.5)*7;
     const jitter=(hash(seed+3)-.5)*8;
     const x=s.x+nx*offset+Math.cos(s.angle)*jitter,y=s.y+ny*offset+Math.sin(s.angle)*jitter;
     const size=(17+hash(seed+4)*14)*(.25+.75*g);
     const biome=Math.floor(hash(Math.floor(s.id/17)+43)*6);
     stamp(x,y,size,biome,fade*g*.92,hash(seed+6)*6.28);
     if(j===0||j===4)stamp(x+nx*(r-.5)*12,y+ny*(r-.5)*12,size*.8,biome,fade*g*.42,s.angle);
    }
    ramify(s,ease((age-2200)/4200),fade);
   }
   frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);window.addEventListener('pointermove',move);document.documentElement.addEventListener('pointerleave',leave);window.addEventListener('resize',resize);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);document.documentElement.removeEventListener('pointerleave',leave);window.removeEventListener('resize',resize);};
 },[paused,reduced]);
 return <canvas ref={canvas} className="growth-trail" aria-hidden="true"/>;
}
