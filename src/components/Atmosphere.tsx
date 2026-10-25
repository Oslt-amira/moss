'use client';
import { useCallback, useEffect, useRef } from 'react';
export type Weather = 'clear' | 'rain' | 'night';
type AudioRig={context:AudioContext; wind:GainNode; rain:GainNode; crickets:GainNode; master:GainNode; sources:AudioBufferSourceNode[]};

function createRig():AudioRig {
 const context=new AudioContext(),master=context.createGain();master.gain.value=0;master.connect(context.destination);
 const sources:AudioBufferSourceNode[]=[];
 function channel(kind:'wind'|'rain'|'crickets'){
  const length=context.sampleRate*12,buffer=context.createBuffer(2,length,context.sampleRate);
  for(let ch=0;ch<2;ch++){
   const data=buffer.getChannelData(ch);let brown=0;
   for(let i=0;i<length;i++){
    const t=i/context.sampleRate,white=Math.random()*2-1; brown=(brown+white*.024)/1.024;
    const seam=Math.min(1,t/.04,(12-t)/.04);
    if(kind==='wind')data[i]=brown*3.2*(.7+.3*Math.sin(t*.8))*seam;
    else if(kind==='rain')data[i]=(white*.48+brown*.9)*(1+.08*Math.sin(t*2.3+ch))*seam;
    else {
     const cycle=(t+ch*.23)%1.12,train=cycle<.38?Math.pow(Math.max(0,Math.sin(cycle*Math.PI*2*24)),5)*Math.sin(cycle/.38*Math.PI):0;
     const distant=(t+.43)%1.7<.22?Math.pow(Math.max(0,Math.sin(t*2*Math.PI*28)),7)*.25:0;
     data[i]=(Math.sin(2*Math.PI*4530*t+Math.sin(t*82)*.8)*train*.5+Math.sin(2*Math.PI*6170*t)*distant)*seam;
    }
   }
  }
  const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
  const filter=context.createBiquadFilter();filter.type=kind==='wind'?'lowpass':kind==='rain'?'lowpass':'highpass';filter.frequency.value=kind==='wind'?550:kind==='rain'?7600:3100;
  const gain=context.createGain();gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(master);source.start();sources.push(source);return gain;
 }
 return {context,master,sources,wind:channel('wind'),rain:channel('rain'),crickets:channel('crickets')};
}
export function useAmbientAudio({weather,sound,paused,volume,wind}:{weather:Weather;sound:boolean;paused:boolean;volume:number;wind:number}) {
 const rig=useRef<AudioRig|null>(null),desired=useRef({weather,sound,paused,volume,wind});desired.current={weather,sound,paused,volume,wind};
 const sync=useCallback(()=>{const r=rig.current;if(!r)return;const p=desired.current,t=r.context.currentTime;r.master.gain.setTargetAtTime(p.sound&&!p.paused?p.volume:0,t,.45);r.wind.gain.setTargetAtTime(p.weather==='clear'?.065*(.35+p.wind*.5):.018,t,.9);r.rain.gain.setTargetAtTime(p.weather==='rain'?.22:0,t,.8);r.crickets.gain.setTargetAtTime(p.weather==='night'?.16:0,t,.8);},[]);
 useEffect(sync,[weather,sound,paused,volume,wind,sync]);
 useEffect(()=>()=>{rig.current?.sources.forEach(source=>source.stop());void rig.current?.context.close();},[]);
 return useCallback(async()=>{if(!rig.current)rig.current=createRig();await rig.current.context.resume();sync();},[sync]);
}

export default function Atmosphere({weather,paused,reduced}:{weather:Weather;paused:boolean;reduced:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=canvas.current!,ctx=el.getContext('2d')!;let w=0,h=0,frame=0,time=0,last=performance.now();const pointer={x:-1000,y:-1000};
  const resize=()=>{w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,1.75);el.width=w*d;el.height=h*d;ctx.setTransform(d,0,0,d,0,0);};resize();
  const drops=Array.from({length:230},(_,i)=>({x:Math.random(),y:Math.random(),depth:.25+Math.random()*.75,seed:i}));
  const flies=Array.from({length:29},(_,i)=>({x:.08+Math.random()*.84,y:.15+Math.random()*.66,phase:i*2.399,size:.7+Math.random()*1.1}));
  const move=(event:PointerEvent)=>{pointer.x=event.clientX;pointer.y=event.clientY;};
  const draw=(now:number)=>{
   const dt=Math.max(0,Math.min((now-last)/1000,.04));last=now;const active=!paused&&!reduced;if(active)time+=dt;ctx.clearRect(0,0,w,h);
   if(weather==='rain'){
    for(const drop of drops){if(active){drop.y+=dt*(.55+drop.depth*.65);drop.x-=dt*(.035+drop.depth*.025);if(drop.y>1.08){drop.y=-.08;drop.x=Math.random();}if(drop.x<-.05)drop.x=1.05;}
     const x=drop.x*w,y=drop.y*h,len=9+drop.depth*22;ctx.lineWidth=.45+drop.depth*.8;ctx.strokeStyle=`rgba(184,202,211,${.10+drop.depth*.27})`;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-len*.23,y+len);ctx.stroke();
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
