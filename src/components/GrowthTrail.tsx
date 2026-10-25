'use client';
import { useEffect, useRef } from 'react';

type Seed={x:number;y:number;born:number;angle:number;id:number};
export default function GrowthTrail({paused,resetKey,reduced,onGrow}:{paused:boolean;resetKey:number;reduced:boolean;onGrow:()=>void}) {
  const canvas=useRef<HTMLCanvasElement>(null);const seeds=useRef<Seed[]>([]); const grow=useRef(onGrow);grow.current=onGrow;
  useEffect(()=>{seeds.current=[];},[resetKey]);
  useEffect(()=>{
    const el=canvas.current!;const ctx=el.getContext('2d')!;let frame=0,w=0,h=0,t=0,prev=performance.now();let last={x:-100,y:-100};let id=0;const mobile=matchMedia('(pointer: coarse)').matches;
    const resize=()=>{w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,2);el.width=w*d;el.height=h*d;ctx.setTransform(d,0,0,d,0,0);};resize();
    const move=(e:PointerEvent)=>{
      if(paused||reduced||(mobile&&e.buttons===0)||((e.target as HTMLElement).closest('button,a,input,[role="dialog"]')))return;
      if(last.x===-100){last={x:e.clientX,y:e.clientY};seeds.current.push({x:e.clientX,y:e.clientY,born:t,angle:0,id:id++});grow.current();return;}
      const dist=Math.hypot(e.clientX-last.x,e.clientY-last.y);if(dist<22)return;
      const count=Math.min(4,Math.floor(dist/22));const angle=Math.atan2(e.clientY-last.y,e.clientX-last.x);
      for(let i=1;i<=count;i++) {seeds.current.push({x:count===1?e.clientX:last.x+(e.clientX-last.x)*i/count,y:count===1?e.clientY:last.y+(e.clientY-last.y)*i/count,born:t,angle,id:id++});}
      if(seeds.current.length>220)seeds.current.splice(0,seeds.current.length-220);last={x:e.clientX,y:e.clientY};grow.current();
    };
    const leaf=(x:number,y:number,a:number,size:number,shade:number,alpha:number)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=`rgba(${46+shade},${65+shade},${21+shade*.35},${alpha})`;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-size*.7,-size*.7,-size*.45,-size*1.5,0,-size*1.8);ctx.bezierCurveTo(size*.5,-size*1.2,size*.7,-size*.5,0,0);ctx.fill();ctx.restore();};
    const draw=(now:number)=>{
      const dt=Math.min(now-prev,50);prev=now;if(!paused)t+=dt;ctx.clearRect(0,0,w,h);
      seeds.current=seeds.current.filter(s=>t-s.born<14000);
      for(const s of seeds.current){const age=t-s.born;const fade=Math.min(1,(14000-age)/2400);const growth=Math.max(0,Math.min(1,(age-500)/2200));const n=Math.sin(s.id*127.1)*43758.5453;const rand=n-Math.floor(n);
        if(age<2500){ctx.font='10px monospace';ctx.fillStyle=`rgba(65,72,47,${Math.min(1,age/100)*(1-growth)*.7*fade})`;ctx.fillText(s.id%3===0?'01':s.id%3===1?'10':'{ }',s.x-7,s.y+4);}
        if(growth>0){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle+Math.PI*.5); const branches=3+(s.id%3);
          for(let b=0;b<branches;b++){const delay=b*.14;const g=Math.max(0,Math.min(1,(growth-delay)/(1-delay)));if(!g)continue;const dir=(b%2?1:-1);const a=dir*(.45+b*.35);const len=(14+rand*20+b*3)*g;const ex=Math.sin(a)*len,ey=-Math.cos(a)*len;
            ctx.strokeStyle=`rgba(78,91,42,${.65*fade*g})`;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(0,4);ctx.quadraticCurveTo(ex*.2,ey*.75,ex,ey);ctx.stroke();
            for(let k=1;k<5;k++){const lg=Math.max(0,Math.min(1,(g-k*.12)*2));if(!lg)continue;const q=k/5;const lx=ex*q*q,ly=ey*q;leaf(lx,ly,a+dir*.8,(2.1+rand*2)*lg,rand*42,fade*.8);leaf(lx,ly,a-dir*.7,(1.9+rand*2)*lg,rand*30,fade*.8);}
          }
          // Fine moss spores fill the base as the code disappears.
          for(let j=0;j<9;j++){const a=j*2.399+s.id;const radius=(2+j*.7)*growth;ctx.fillStyle=`rgba(99,112,48,${growth*.30*fade})`;ctx.beginPath();ctx.arc(Math.cos(a)*radius,Math.sin(a)*radius,1.2+rand,0,Math.PI*2);ctx.fill();}ctx.restore();
        }
      }frame=requestAnimationFrame(draw);
    };frame=requestAnimationFrame(draw);window.addEventListener('pointermove',move);window.addEventListener('resize',resize);return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);window.removeEventListener('resize',resize);};
  },[paused,reduced]);
  return <canvas className="growth-trail" ref={canvas} aria-hidden="true"/>;
}
