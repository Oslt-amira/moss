'use client';
import { useEffect, useRef } from 'react';

type Sample={x:number;y:number;born:number;angle:number;width:number;id:number;distance:number};
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
 const canvas=useRef<HTMLCanvasElement>(null),samples=useRef<Sample[]>([]),clock=useRef(0),serial=useRef(0),travel=useRef(0),grow=useRef(onGrow);grow.current=onGrow;
 useEffect(()=>{samples.current=[];serial.current=0;travel.current=0;},[resetKey]);
 useEffect(()=>{
  const el=canvas.current!,ctx=el.getContext('2d')!,textures=Array.from({length:6},(_,i)=>mossTexture(i));
  let frame=0,w=0,h=0,previous=performance.now(),active=false,lastMove=0;
  let target={x:0,y:0},tip={x:0,y:0},anchor={x:0,y:0},heading=0,initialized=false;
  const coarse=matchMedia('(pointer:coarse)').matches;
  const resize=()=>{w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,2);el.width=w*d;el.height=h*d;ctx.setTransform(d,0,0,d,0,0);};resize();
  const leave=()=>{active=false;initialized=false;};
  const move=(event:PointerEvent)=>{
   if(paused||reduced||(coarse&&event.buttons===0)||(event.target as HTMLElement).closest('button,a,input,.dock-area,.fossil-note,.fossil-discovery')){active=false;initialized=false;return;}
   const x=event.clientX,y=event.clientY,now=performance.now();
   if(!initialized||now-lastMove>500||Math.hypot(x-target.x,y-target.y)>280){tip={x,y};anchor={x,y};heading=0;initialized=true;}
   target={x,y};lastMove=now;active=true;
  };
  function stamp(x:number,y:number,size:number,variant:number,alpha:number,angle:number){if(alpha<.008||size<.1)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(textures[variant%6],-size/2,-size/2,size,size);ctx.restore();}
  // Inward-curling tendrils follow an organic spiral rather than rigid forks.
  function curl(s:Sample,growth:number,opacity:number){
   if(s.id%13!==0||growth<=0)return;
   const side=s.id%2?1:-1,radius=9+hash(s.id*7)*14;
   const a=s.angle+side*.7,nx=-Math.sin(s.angle),ny=Math.cos(s.angle);
   const ox=s.x+nx*s.width*side*.45,oy=s.y+ny*s.width*side*.45;
   const count=Math.floor(23*growth);let px=ox,py=oy;
   for(let j=0;j<=count;j++){
    const t=j/23,theta=a+side*t*Math.PI*2.25,r=radius*(1-t*.84);
    const x=ox+Math.cos(a)*radius-Math.cos(theta)*r,y=oy+Math.sin(a)*radius-Math.sin(theta)*r;
    ctx.strokeStyle=`rgba(83,109,51,${opacity*.19})`;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo((px+x)/2-side*(y-py)*.15,(py+y)/2+side*(x-px)*.15,x,y);ctx.stroke();
    stamp(x,y,(9-t*5)*ease(growth*2-t),Math.floor(hash(Math.floor(s.id/17)+43)*6),opacity*.54,theta);px=x;py=y;
   }
  }
  const draw=(now:number)=>{
   const dt=Math.max(0,Math.min(now-previous,50));previous=now;if(!paused)clock.current+=dt;
   ctx.clearRect(0,0,w,h);
   if(active&&!paused&&!reduced&&now-lastMove<260){
    const dx=target.x-tip.x,dy=target.y-tip.y,dist=Math.hypot(dx,dy);
    if(dist>1.3){
     const desired=Math.atan2(dy,dx);heading+=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading))*(1-Math.exp(-dt/75));
     const mix=1-Math.exp(-dt/68);tip.x+=dx*mix;tip.y+=dy*mix;
     const step=Math.hypot(tip.x-anchor.x,tip.y-anchor.y);
     if(step>=5){
      const count=Math.min(12,Math.floor(step/5));
      for(let i=1;i<=count;i++){
       const q=i/count,x=anchor.x+(tip.x-anchor.x)*q,y=anchor.y+(tip.y-anchor.y)*q;
       travel.current+=step/count;const wave=Math.sin(travel.current*.026)*2.8;
       samples.current.push({x:x-Math.sin(heading)*wave,y:y+Math.cos(heading)*wave,born:clock.current,angle:heading,width:11+Math.min(5,dist*.04),id:serial.current++,distance:travel.current});
      }
      anchor={...tip};grow.current();
     }
    }
   }
   if(samples.current.length>360)samples.current.splice(0,samples.current.length-360);
   samples.current=samples.current.filter(s=>clock.current-s.born<6200);
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='8px "Courier New",monospace';
   for(const s of samples.current){
    const age=clock.current-s.born,fade=ease((6200-age)/4500)*Math.exp(-Math.max(0,travel.current-s.distance-95)/240),nx=-Math.sin(s.angle),ny=Math.cos(s.angle);
    if(fade<.012)continue;
    for(let row=-1;row<=1;row++){
     const seed=s.id*19+row*173,r=hash(seed),g=ease((age-180-r*320)/1100),offset=row*7;
     if(s.id%2===0){ctx.fillStyle=`rgba(85,105,72,${(1-g)*fade*(.29+r*.19)*ease(age/90)})`;ctx.fillText(r>.5?'1':'0',s.x+nx*offset,s.y+ny*offset);}
    }
    for(let j=0;j<4;j++){
     const seed=s.id*19+j*173,r=hash(seed),g=ease((age-180-r*360)/1250);if(g<=0)continue;
     const offset=(j-1.5)*s.width*.40+(r-.5)*4,jitter=(hash(seed+3)-.5)*5;
     const x=s.x+nx*offset+Math.cos(s.angle)*jitter,y=s.y+ny*offset+Math.sin(s.angle)*jitter;
     const size=(15+hash(seed+4)*10)*(.3+.7*g),biome=Math.floor(hash(Math.floor(s.id/22)+43)*6);
     stamp(x,y,size,biome,fade*g*.65,hash(seed+6)*6.28);
    }
    curl(s,ease((age-650)/1800),fade);
   }
   frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);window.addEventListener('pointermove',move);document.documentElement.addEventListener('pointerleave',leave);window.addEventListener('resize',resize);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);document.documentElement.removeEventListener('pointerleave',leave);window.removeEventListener('resize',resize);};
 },[paused,reduced]);
 return <canvas ref={canvas} className="growth-trail" aria-hidden="true"/>;
}
