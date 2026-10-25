'use client';
import {useEffect,useRef} from 'react';
import type {Weather} from './RecordedAudio';
export {useAmbientAudio} from './RecordedAudio';
export type {Weather} from './RecordedAudio';
export default function Atmosphere({weather,paused,reduced,rainLevel,wind}:{weather:Weather;paused:boolean;reduced:boolean;rainLevel:number;wind:number}){
 const canvas=useRef<HTMLCanvasElement>(null),levels=useRef({rainLevel,wind});levels.current={rainLevel,wind};
 useEffect(()=>{
  const el=canvas.current!,ctx=el.getContext('2d')!;let w=0,h=0,frame=0,time=0,last=performance.now();const pointer={x:-1000,y:-1000};
  const resize=()=>{w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,1.75);el.width=w*d;el.height=h*d;ctx.setTransform(d,0,0,d,0,0);};resize();
  const drops=Array.from({length:380},(_,i)=>({x:Math.random(),y:Math.random(),depth:.25+Math.random()*.75,seed:i}));
  const flies=Array.from({length:29},(_,i)=>({x:.08+Math.random()*.84,y:.15+Math.random()*.66,phase:i*2.399,size:.7+Math.random()*1.1}));
  const move=(event:PointerEvent)=>{pointer.x=event.clientX;pointer.y=event.clientY;};
  const draw=(now:number)=>{
   const dt=Math.max(0,Math.min((now-last)/1000,.04));last=now;const active=!paused&&!reduced;if(active)time+=dt;ctx.clearRect(0,0,w,h);
   if(weather==='rain'){
    const level=levels.current.rainLevel;
    for(const drop of drops.slice(0,Math.round(30+level*350))){if(active){drop.y+=dt*(.20+level*.8+drop.depth*.45);drop.x-=dt*(.015+levels.current.wind*.018+level*.025);if(drop.y>1.08){drop.y=-.08;drop.x=Math.random();}if(drop.x<-.05)drop.x=1.05;}
     const x=drop.x*w,y=drop.y*h,len=4+level*12+drop.depth*18;ctx.lineWidth=.45+drop.depth*.8;ctx.strokeStyle=`rgba(184,202,211,${.10+drop.depth*.27})`;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-len*.23,y+len);ctx.stroke();
     if(drop.seed%12===0){const q=((time*.7+drop.seed*.13)%1+1)%1;ctx.strokeStyle=`rgba(198,217,221,${(1-q)*.11})`;ctx.lineWidth=.6;ctx.beginPath();ctx.ellipse(((drop.seed*.173)%1)*w,h*(.72+(drop.seed%4)*.065),q*17,q*3,0,0,Math.PI*2);ctx.stroke();}
    }
   }else if(weather==='night'){
    for(const fly of flies){const t=time*.22+fly.phase;let x=fly.x*w+Math.sin(t*1.7)*44+Math.cos(t*.9)*22,y=fly.y*h+Math.sin(t*1.2)*30+Math.cos(t*2.1)*12;const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy);if(d<110){x+=dx/(d+1)*(110-d)*.4;y+=dy/(d+1)*(110-d)*.4;}const pulse=reduced?.65:.25+.75*Math.pow(.5+.5*Math.sin(time*1.4+fly.phase),2);const glow=ctx.createRadialGradient(x,y,0,x,y,fly.size*14);glow.addColorStop(0,`rgba(244,238,137,${pulse*.7})`);glow.addColorStop(.13,`rgba(210,223,88,${pulse*.2})`);glow.addColorStop(1,'rgba(190,210,67,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,fly.size*14,0,Math.PI*2);ctx.fill();ctx.fillStyle=`rgba(255,249,168,${pulse})`;ctx.beginPath();ctx.arc(x,y,fly.size*.65,0,Math.PI*2);ctx.fill();}
   }
   frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);window.addEventListener('resize',resize);window.addEventListener('pointermove',move);return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move);};
 },[weather,paused,reduced]);
 return <><div className="weather-haze" aria-hidden="true"/><canvas ref={canvas} className="atmosphere-canvas" aria-hidden="true"/></>;
}
