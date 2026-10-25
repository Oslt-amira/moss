'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
export type Weather='clear'|'rain'|'night';
type Params={weather:Weather;sound:boolean;paused:boolean;volume:number;wind:number;rainLevel:number;nightLevel:number};
type Key='breeze'|'windy'|'storm'|'drizzle'|'rain'|'rainstorm'|'crickets'|'fire'|'wolf'|'thunder';
type Track={audio:HTMLAudioElement;source:MediaElementAudioSourceNode;gain:GainNode;target:number;idleSince:number};
type Rig={context:AudioContext;master:GainNode;tracks:Map<Key,Track>;bank:HTMLDivElement;nextWolf:number;nextThunder:number;disposed:boolean};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function blend(level:number):[number,number,number]{const t=clamp(level)*2;if(t<=1)return [Math.cos(t*Math.PI/2),Math.sin(t*Math.PI/2),0];return [0,Math.cos((t-1)*Math.PI/2),Math.sin((t-1)*Math.PI/2)];}
export function useAmbientAudio(params:Params){
 const [audioError,setError]=useState(''),[audioLoading,setLoading]=useState(false);
 const rig=useRef<Rig|null>(null),desired=useRef(params);desired.current=params;
 const ensureTrack=useCallback((r:Rig,key:Key)=>{
  const existing=r.tracks.get(key);if(existing)return existing;
  const audio=document.createElement('audio');audio.src=`/audio/${key}.mp3`;audio.preload='none';audio.loop=key!=='wolf'&&key!=='thunder';audio.dataset.recording=key;
  const source=r.context.createMediaElementSource(audio),gain=r.context.createGain();gain.gain.value=0;source.connect(gain);gain.connect(r.master);r.bank.appendChild(audio);
  audio.addEventListener('waiting',()=>{if(!r.disposed)setLoading(true);});audio.addEventListener('playing',()=>{if(!r.disposed)setLoading(false);});audio.addEventListener('error',()=>{if(!r.disposed){setLoading(false);setError('A recording could not load. Tap sound to retry.');}});
  const track={audio,source,gain,target:0,idleSince:0};r.tracks.set(key,track);return track;
 },[]);
 const play=useCallback((r:Rig,track:Track)=>{if(!track.audio.paused)return;void track.audio.play().catch(error=>{if(r.disposed||error.name==='AbortError')return;setLoading(false);setError('Tap sound to start the recordings.');});},[]);
 const sync=useCallback(()=>{
  const r=rig.current;if(!r)return;const p=desired.current,t=r.context.currentTime,enabled=p.sound&&!p.paused;
  r.master.gain.setTargetAtTime(enabled?p.volume:0,t,.35);
  if(!enabled){r.tracks.forEach(track=>{track.audio.pause();});return;}
  const wind=blend(clamp((p.wind-.55)/1.95)),rain=blend(p.rainLevel);
  const weights:Partial<Record<Key,number>>={breeze:wind[0]*.65*clamp(p.wind/.6),windy:wind[1]*.60,storm:wind[2]*.63};
  if(p.weather==='rain'){weights.drizzle=rain[0]*.65;weights.rain=rain[1]*.66;weights.rainstorm=rain[2]*.70;}
  if(p.weather==='night'){weights.crickets=.67;weights.fire=clamp((p.nightLevel-.30)/.37)*.54;}
  for(const key of Object.keys(weights) as Key[]){if((weights[key]??0)>.001)ensureTrack(r,key);}
  r.tracks.forEach((track,key)=>{
   if(key==='wolf'||key==='thunder')return;
   const target=weights[key]??0;track.target=target;track.gain.gain.setTargetAtTime(target,t,.65);
   if(target>.001){track.idleSince=0;play(r,track);}else if(!track.idleSince)track.idleSince=t;
  });
  if(p.weather!=='night'||p.nightLevel<.72){const wolf=r.tracks.get('wolf');wolf?.gain.gain.setTargetAtTime(0,t,.4);wolf?.audio.pause();r.nextWolf=0;}
  if(p.weather!=='rain'||p.rainLevel<.72){const thunder=r.tracks.get('thunder');thunder?.gain.gain.setTargetAtTime(0,t,.4);thunder?.audio.pause();r.nextThunder=0;}
 },[ensureTrack,play]);
 useEffect(sync,[params.weather,params.sound,params.paused,params.volume,params.wind,params.rainLevel,params.nightLevel,sync]);
 useEffect(()=>{const timer=setInterval(()=>{
  const r=rig.current,p=desired.current;if(!r||!p.sound||p.paused||r.context.state!=='running')return;const now=r.context.currentTime;
  r.tracks.forEach((track,key)=>{if(key!=='wolf'&&key!=='thunder'&&track.target<.001&&track.idleSince&&now-track.idleSince>2.5)track.audio.pause();});
  if(p.weather==='night'&&p.nightLevel>=.72){if(!r.nextWolf)r.nextWolf=now+8+Math.random()*8;if(now>=r.nextWolf){const wolf=ensureTrack(r,'wolf');wolf.audio.currentTime=0;wolf.gain.gain.setTargetAtTime(.22+clamp((p.nightLevel-.72)/.28)*.13,now,.4);play(r,wolf);r.nextWolf=now+110+Math.random()*65;}}
  if(p.weather==='rain'&&p.rainLevel>=.72){if(!r.nextThunder)r.nextThunder=now+12+Math.random()*12;if(now>=r.nextThunder){const thunder=ensureTrack(r,'thunder');thunder.audio.currentTime=0;thunder.gain.gain.setTargetAtTime(.23,now,.5);play(r,thunder);r.nextThunder=now+100+Math.random()*60;}}
 },500);return()=>clearInterval(timer);},[ensureTrack,play]);
 useEffect(()=>()=>{const r=rig.current;if(!r)return;r.disposed=true;r.tracks.forEach(track=>{track.audio.pause();track.audio.removeAttribute('src');track.audio.load();track.source.disconnect();track.gain.disconnect();});r.bank.remove();void r.context.close();rig.current=null;},[]);
 const startAudio=useCallback(async()=>{
  setError('');if(!rig.current){const context=new AudioContext(),master=context.createGain();master.gain.value=0;master.connect(context.destination);const bank=document.createElement('div');bank.hidden=true;bank.dataset.fieldRecordings='true';document.body.appendChild(bank);rig.current={context,master,tracks:new Map(),bank,nextWolf:0,nextThunder:0,disposed:false};}
  await rig.current.context.resume();sync();
 },[sync]);
 return {startAudio,audioError,audioLoading};
}
