'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import type { Weather } from './Atmosphere';

export type SpecimenProps = { paused: boolean; exploded: boolean; wind: number; resetKey: number; reduced: boolean; onReady: () => void; weather: Weather; fossilFound:boolean; onDiscover:()=>void };
const perlin=new ImprovedNoise();
const noise=(x:number,y:number,z:number)=>perlin.noise(x+17.3,y+8.1,z-4.7)*.64+perlin.noise(x*2.1+31,y*2.1,z*2.1)*.26+perlin.noise(x*4.3,y*4.3,z*4.3)*.10;
function random(seed:number) { let a=seed; return () => { a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function surface(v:THREE.Vector3) {
 const n=noise(v.x*2.8,v.y*2.8,v.z*2.8),fracture=perlin.noise(v.x*18,v.y*23,v.z*18)*.035;
 const ridge=Math.abs(perlin.noise(v.x*4,v.y*13,v.z*4))*.09;
 const radial=1+n*.34+fracture+ridge;
 return new THREE.Vector3(v.x*radial*1.96+v.y*.12,v.y*radial*.81+n*.17,v.z*radial*1.26);
}


function Rock({ layer=0,weather }: { layer?:number;weather:Weather }) {
  const bump=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d')!;const pixels=ctx.createImageData(512,512);const rng=random(17);for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4;const grain=rng()*90;const veins=Math.sin(y*.17+Math.sin(x*.035)*8)*24;const n=90+grain+veins;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=n;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,2);return texture;},[]);
  const geo = useMemo(() => {
    const g=new THREE.SphereGeometry(1,layer===0?160:112,layer===0?112:80); const p=g.attributes.position; const colors=[]; const c=new THREE.Color();
    for(let i=0;i<p.count;i++) { const v=new THREE.Vector3().fromBufferAttribute(p,i).normalize(); const q=surface(v); if(layer) {q.y*=.30;q.x*=1-layer*.08;q.z*=1-layer*.08;} p.setXYZ(i,q.x,q.y,q.z); const n=noise(v.x*2,v.y*2,v.z*2); const veins=Math.abs(perlin.noise(v.x*22,v.y*46,v.z*22));const shade=.25+(n+.55)*.23+veins*.10+Math.max(v.y,0)*.035; c.setRGB(shade*.96,shade,shade*1.055,THREE.SRGBColorSpace); if(Math.sin(v.y*53+v.x*11+perlin.noise(v.x*9,v.y*5,v.z*9)*4)>.92)c.multiplyScalar(.69); colors.push(c.r,c.g,c.b); }
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); g.computeVertexNormals(); return g;
  },[layer]);
  useEffect(()=>()=>{geo.dispose();bump.dispose();},[geo,bump]);
  return <mesh geometry={geo} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={weather==='rain'?.66:.96} bumpMap={bump} bumpScale={.17} metalness={.025}/></mesh>;
}

function Moss({wind,paused,reduced}:{wind:number;paused:boolean;reduced:boolean}) {
  const ref=useRef<THREE.InstancedMesh>(null);
  const grass=useRef<THREE.InstancedMesh>(null);
  const uniforms=useRef({uMossTime:{value:0},uMossWind:{value:1}});
  const tuft=useMemo(()=>{const vertices:number[]=[];const triangle=(...v:number[])=>vertices.push(...v);triangle(-.035,0,0,.035,0,0,0,1,0);for(let ring=0;ring<4;ring++){const y=.18+ring*.2;for(let k=0;k<3;k++){const a=k/3*Math.PI*2+ring*.7,len=.36-ring*.055,dx=Math.cos(a),dz=Math.sin(a);const x=dx*len,z=dz*len;triangle(0,y,0,x-dz*.12,y+.13,z+dx*.12,x*1.45,y+.3,z*1.45);triangle(0,y,0,x*1.45,y+.3,z*1.45,x+dz*.12,y+.13,z-dx*.12);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return g;},[]);
  useEffect(()=>()=>tuft.dispose(),[tuft]);
  useFrame((_,dt)=>{if(!paused&&!reduced)uniforms.current.uMossTime.value+=Math.min(dt,.04);uniforms.current.uMossWind.value=reduced?0:wind;});
  useEffect(()=>{
    const rng=random(921); const m=new THREE.Object3D();const c=new THREE.Color();
    for(let i=0;i<18000;i++) {
      const theta=rng()*Math.PI*2, y=.12+rng()*.88, radius=Math.sqrt(1-y*y);
      const v=new THREE.Vector3(radius*Math.cos(theta),y,radius*Math.sin(theta)); const p=surface(v);
      const patch=noise(v.x*1.8,v.y*1.8,v.z*1.8);
      const cover=noise(v.x*3+11,v.y*3,v.z*3);const size=(.008+rng()*.022)*(cover<-.12?.05:cover<.02?.55:1.3);
      m.position.copy(p).addScaledVector(v,.018);m.scale.set(size*(1+rng()),size*(.6+rng()),size);m.rotation.set(rng()*3,rng()*3,rng()*3); m.updateMatrix();ref.current!.setMatrixAt(i,m.matrix);
      c.setHSL(.20+patch*.045+rng()*.025,.36+rng()*.24,.14+(patch+.7)*.095+rng()*.035,THREE.SRGBColorSpace); ref.current!.setColorAt(i,c);
    }
    ref.current!.instanceMatrix.needsUpdate=true;
    for(let i=0;i<7000;i++) {
      const theta=rng()*Math.PI*2,y=.35+rng()*.65,r=Math.sqrt(1-y*y);const v=new THREE.Vector3(r*Math.cos(theta),y,r*Math.sin(theta));
      m.position.copy(surface(v)).addScaledVector(v,.03);m.rotation.set((rng()-.5)*.7,rng()*6,(rng()-.5)*.7);const cover=noise(v.x*3+11,v.y*3,v.z*3);m.scale.setScalar(cover<-.1?.001:1);m.scale.multiply(new THREE.Vector3(.028+rng()*.025,.035+rng()*.055,.028+rng()*.025));m.updateMatrix();grass.current!.setMatrixAt(i,m.matrix);c.setHSL(.20+rng()*.06,.42,.19+rng()*.18,THREE.SRGBColorSpace);grass.current!.setColorAt(i,c);
    }
    grass.current!.instanceMatrix.needsUpdate=true;
  },[]);
  return <><instancedMesh ref={ref} args={[undefined,undefined,18000]} castShadow receiveShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#b0bf83" roughness={1}/></instancedMesh><instancedMesh ref={grass} args={[undefined,undefined,7000]} geometry={tuft}><meshStandardMaterial color="#acbb77" roughness={.92} side={THREE.DoubleSide} onBeforeCompile={shader=>{shader.uniforms.uMossTime=uniforms.current.uMossTime;shader.uniforms.uMossWind=uniforms.current.uMossWind;shader.vertexShader='uniform float uMossTime; uniform float uMossWind;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x += sin(uMossTime * 1.4 + instanceMatrix[3].x * 5.0 + instanceMatrix[3].z * 4.0) * position.y * position.y * 0.15 * uMossWind;');}}/></instancedMesh></>;
}

function Fern({position,scale=1,rotation=0,seed,wind,paused,reduced}:{position:[number,number,number];scale?:number;rotation?:number;seed:number;wind:number;paused:boolean;reduced:boolean}) {
  const group=useRef<THREE.Group>(null);const leaves=useRef<THREE.InstancedMesh>(null);const energy=useRef(0);const phase=useRef(seed);
  const { pointer }=useThree();
  const stem=useMemo(()=>new THREE.CatmullRomCurve3(Array.from({length:15},(_,i)=>{const t=i/14;return new THREE.Vector3(Math.sin(t*1.7)*t*.36,t*1.12,Math.sin(t*2)*.08);})),[]);
  useEffect(()=>{
    const rng=random(seed);const o=new THREE.Object3D();const c=new THREE.Color();
    for(let i=0;i<54;i++) { const row=Math.floor(i/2), side=i%2?1:-1,t=.12+row/27*.86;const p=stem.getPoint(t); const length=(Math.sin(Math.pow(t,.7)*Math.PI)*.19+.012)*(1+(rng()-.5)*.25);
      o.position.copy(p); o.position.x+=side*length*.43;o.position.y+=length*.2; o.rotation.set(.1+rng()*.3,side*.2,-side*(.75+t*.55));o.scale.set(length*.30,length,.012);o.updateMatrix(); leaves.current!.setMatrixAt(i,o.matrix);c.setHSL(.22+rng()*.05,.43,.19+rng()*.12,THREE.SRGBColorSpace);leaves.current!.setColorAt(i,c); }
    leaves.current!.instanceMatrix.needsUpdate=true;
  },[seed,stem]);
  useFrame((_,dt)=>{ if(paused||reduced||!group.current)return;phase.current+=dt;energy.current*=Math.pow(.07,dt);const sway=Math.sin(phase.current*1.6+seed)*.035*wind;group.current.rotation.z=rotation+sway+energy.current+pointer.x*.025*wind;group.current.rotation.x=Math.cos(phase.current+seed)*.025*wind; });
  return <group ref={group} position={position} scale={scale} rotation={[0,seed*.7,rotation]} onPointerMove={(e)=>{e.stopPropagation();energy.current=THREE.MathUtils.clamp(energy.current+e.delta*.002+.035,-.4,.4);}} onPointerDown={()=>{energy.current=.5;}}>
    <mesh><tubeGeometry args={[stem,18,.006,4,false]}/><meshStandardMaterial color="#657238" roughness={.9}/></mesh>
    <instancedMesh ref={leaves} args={[undefined,undefined,54]} castShadow><sphereGeometry args={[1,5,4]}/><meshStandardMaterial roughness={.84}/></instancedMesh>
    <mesh position={[.15,.5,0]} visible={false}><sphereGeometry args={[.5,8,8]}/><meshBasicMaterial transparent opacity={0}/></mesh>
  </group>;
}

function Flower({position,height,seed,paused,wind,reduced}:{position:[number,number,number];height:number;seed:number;paused:boolean;wind:number;reduced:boolean}) {
  const ref=useRef<THREE.Group>(null);const bend=useRef(0);const t=useRef(seed);
  const curve=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(.04,height*.5,0),new THREE.Vector3(-.05,height,.01)]),[height]);
  useFrame((_,dt)=>{if(paused||reduced||!ref.current)return;t.current+=dt;bend.current*=Math.pow(.03,dt);ref.current.rotation.z=Math.sin(t.current*1.4)*.035*wind+bend.current;});
  return <group ref={ref} position={position} onPointerOver={()=>{bend.current=.22;}} onPointerDown={()=>{bend.current=-.3;}}>
    <mesh><tubeGeometry args={[curve,12,.008,5,false]}/><meshStandardMaterial color="#73734d"/></mesh>
    <group position={[-.05,height,.01]} rotation={[.12,0,.2]}>
      <mesh scale={[.105,.045,.105]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#c8c49c" roughness={1}/></mesh>
      {Array.from({length:7},(_,i)=><mesh key={i} position={[Math.cos(i/7*6.28)*.055,.01,Math.sin(i/7*6.28)*.055]} rotation={[0,i/7*6.28,.2]} scale={[.045,.018,.08]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial color="#ece9cf" roughness={.9}/></mesh>)}
    </group>
  </group>;
}

function Fossil({found,onDiscover}:{found:boolean;onDiscover:()=>void}) {
 const [hover,setHover]=useState(false);
 const spiral=useMemo(()=>new THREE.CatmullRomCurve3(Array.from({length:180},(_,i)=>{const t=i/179,a=t*Math.PI*5.4,r=.025+Math.pow(t,1.8)*.39;return new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0);})),[]);
 const ribs=useMemo(()=>Array.from({length:42},(_,i)=>{const t=.25+i/42*.75,a=t*Math.PI*5.4,r=.025+Math.pow(t,1.8)*.39;return new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a)*r*.88,Math.sin(a)*r*.88,-.003),new THREE.Vector3(Math.cos(a+.045)*r,Math.sin(a+.045)*r,.017),new THREE.Vector3(Math.cos(a+.07)*r*1.14,Math.sin(a+.07)*r*1.14,-.003)]);}),[]);
 return <group position={[.24,.27,.34]} rotation={[-Math.PI/2,0,.3]} onPointerOver={e=>{e.stopPropagation();setHover(true);}} onPointerOut={()=>setHover(false)} onClick={e=>{e.stopPropagation();onDiscover();}}>
  <mesh><tubeGeometry args={[spiral,160,.025,7,false]}/><meshStandardMaterial color={hover||found?'#c9d2be':'#aab1ad'} roughness={.94} emissive={hover?'#4b553a':'#000000'} emissiveIntensity={.15}/></mesh>
  {ribs.map((curve,i)=><mesh key={i}><tubeGeometry args={[curve,5,.006,4,false]}/><meshStandardMaterial color="#737f80" roughness={1}/></mesh>)}
  <mesh visible={false}><sphereGeometry args={[.5,12,8]}/><meshBasicMaterial transparent opacity={0}/></mesh>
 </group>;
}

function World(props:SpecimenProps) {
  const root=useRef<THREE.Group>(null),top=useRef<THREE.Group>(null),mid=useRef<THREE.Group>(null),bottom=useRef<THREE.Group>(null);
  const dragging=useRef(false), last=useRef(0), rotation=useRef(-.35), smooth=useRef(-.35), time=useRef(0);const {pointer,gl}=useThree();
  const ferns=useMemo(()=> {const rng=random(44);return Array.from({length:12},(_,i)=>{const a=rng()*Math.PI*2,r=.35+rng()*.55; const p=surface(new THREE.Vector3(r*Math.cos(a),Math.sqrt(1-r*r),r*Math.sin(a)));return {position:p.toArray() as [number,number,number],scale:.21+rng()*.37,rotation:(rng()-.5)*.65,seed:i+1};});},[]);
  useEffect(()=>{ props.onReady(); },[props.onReady]);
  useEffect(()=>{rotation.current=-.35;},[props.resetKey]);
  useEffect(()=>{const el=gl.domElement; const down=(e:PointerEvent)=>{dragging.current=true;last.current=e.clientX;el.setPointerCapture(e.pointerId);};const move=(e:PointerEvent)=>{if(dragging.current){rotation.current+=(e.clientX-last.current)*.006;last.current=e.clientX;}}; const up=()=>{dragging.current=false;};el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);return()=>{el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);};},[gl]);
  useFrame((_,dt)=>{
    const d=Math.min(dt,.04); if(!props.paused&&!props.reduced)time.current+=d; const lerp=1-Math.exp(-d*3);
    if(root.current) {smooth.current+=(rotation.current+pointer.x*.055-smooth.current)*lerp;root.current.rotation.y=smooth.current;root.current.rotation.x=props.reduced?0:pointer.y*.035;root.current.position.y=Math.sin(time.current*.65)*.065-.1;}
    const e=props.exploded?1:0;if(top.current)top.current.position.y=THREE.MathUtils.lerp(top.current.position.y,e*.65,lerp);if(mid.current)mid.current.position.y=THREE.MathUtils.lerp(mid.current.position.y,-.46-e*.24,lerp);if(bottom.current)bottom.current.position.y=THREE.MathUtils.lerp(bottom.current.position.y,-.70-e*.72,lerp);
  });
  return <>
    <ambientLight intensity={props.weather==='night'?.25:props.weather==='rain'?.65:.8}/><hemisphereLight args={[props.weather==='night'?'#738fbd':'#ecf3ff',props.weather==='night'?'#101b1d':'#56626b',props.weather==='night'?.55:1.15]}/><directionalLight position={[-3,7,4]} intensity={props.weather==='night'?1.55:props.weather==='rain'?1.85:3.2} color={props.weather==='night'?'#b3c9ee':'#eff4ff'} castShadow shadow-mapSize={[2048,2048]}/><directionalLight position={[4,2,-3]} intensity={props.weather==='night'?1.9:1.1} color={props.weather==='night'?'#8ba6d4':'#dce5ef'}/>
    <group ref={root}>
      <group ref={top}>
        <Rock weather={props.weather}/><Moss wind={props.wind} paused={props.paused} reduced={props.reduced}/>
        {ferns.map((f,i)=><Fern key={i} {...f} wind={props.wind} paused={props.paused} reduced={props.reduced}/>)}
        <Flower position={[-.55,.65,-.13]} height={.85} seed={2} {...props}/><Flower position={[-.15,.76,-.28]} height={1.22} seed={3} {...props}/><Flower position={[.22,.76,-.24]} height={1.04} seed={4} {...props}/>
      </group>
      <group ref={mid} visible={props.exploded} position={[0,-.46,0]}><Rock layer={1} weather={props.weather}/><Fossil found={props.fossilFound} onDiscover={props.onDiscover}/></group><group ref={bottom} visible={props.exploded} position={[0,-.7,0]}><Rock layer={2} weather={props.weather}/></group>
    </group>
    <ContactShadows position={[0,-2.1,0]} opacity={.23} scale={8} blur={3.8} far={4} resolution={256} color={props.weather==='night'?'#070c12':'#535f67'}/>
  </>;
}

function ResponsiveCamera(){
 const {camera,size}=useThree();
 useEffect(()=>{const c=camera as THREE.PerspectiveCamera;const mobile=window.innerWidth<=700;c.fov=mobile?45:35;c.position.set(0,mobile?2.8:2.4,mobile?8.6:7.3);c.lookAt(0,.32,0);c.updateProjectionMatrix();},[camera,size.width,size.height]);
 return null;
}

export default function Specimen(props:SpecimenProps) {
  const [failed,setFailed]=useState(false);
  useEffect(()=>{try { const c=document.createElement('canvas');if(!c.getContext('webgl2'))setFailed(true);}catch{setFailed(true);}},[]);
  useEffect(()=>{if(failed)props.onReady();},[failed,props.onReady]);
  if(failed)return <div className="webgl-fallback"><img src="/moss-reference.png" alt="A living moss mound with delicate flowers"/><p>3D needs WebGL. You can still grow the cursor garden.</p></div>;
  return <Canvas camera={{position:[0,2.4,7.3],fov:35}} dpr={[1,1.75]} shadows gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({gl,camera})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.1;camera.lookAt(0,.32,0);}}><ResponsiveCamera/><World {...props}/></Canvas>;
}

