'use client';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {PlantedSeed} from './seeds';

const ease=(x:number)=>{const t=THREE.MathUtils.clamp(x,0,1);return t*t*(3-2*t);};
type Props={plant:PlantedSeed;wind:number;paused:boolean;reduced:boolean};

function Mushroom({index,seed,wind,paused,reduced}:{index:number;seed:number;wind:number;paused:boolean;reduced:boolean}){
 const root=useRef<THREE.Group>(null),stem=useRef<THREE.Group>(null),head=useRef<THREE.Group>(null),age=useRef(0),energy=useRef(0);
 const size=[1,.71,.55][index],height=.29*size,angle=seed*.83+index*2.4;
 const curve=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(.012,height*.5,0),new THREE.Vector3(.02,height,0)]),[height]);
 const cap=useMemo(()=>{
  const g=new THREE.LatheGeometry([new THREE.Vector2(0,.072),new THREE.Vector2(.035,.073),new THREE.Vector2(.085,.05),new THREE.Vector2(.13,.016),new THREE.Vector2(.151,-.018),new THREE.Vector2(.148,-.026),new THREE.Vector2(.1,-.024),new THREE.Vector2(0,-.021)],36);
  const colors=[],p=g.attributes.position,c=new THREE.Color();for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),grain=Math.sin(x*297+z*199+seed)*Math.cos(z*221+y*311)*.018;c.setHSL(.105+grain*.3,.21+grain,.40+y*1.1+grain,THREE.SRGBColorSpace);colors.push(c.r,c.g,c.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
 },[seed]);
 const gills=useMemo(()=>{const points=[];for(let i=0;i<24;i++){const a=i/24*Math.PI*2;points.push(Math.cos(a)*.024,-.024,Math.sin(a)*.024,Math.cos(a)*.14,-.024,Math.sin(a)*.14);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));return g;},[]);
 useEffect(()=>()=>{cap.dispose();gills.dispose();},[cap,gills]);
 useFrame((_,dt)=>{
  if(!root.current||!stem.current||!head.current)return;if(!paused)age.current+=Math.min(dt,.05);
  const t=reduced?12:age.current,indexDelay=index*.65,growth=ease((t-indexDelay)/7),opening=ease((t-indexDelay-2.4)/5.5);
  stem.current.scale.set(.3+.7*growth,Math.max(.001,growth),.3+.7*growth);
  head.current.scale.setScalar(Math.max(.001,size*(.15+.85*opening)));
  if(!paused&&!reduced){energy.current*=Math.exp(-dt*4);root.current.rotation.z=Math.sin(t+seed)*.014*wind+energy.current;}
 });
 return <group ref={root} position={index===0?[0,0,0]:[Math.cos(angle)*.13,0,Math.sin(angle)*.1]} rotation={[0,angle,0]} onPointerOver={()=>{energy.current=.065;}} onPointerDown={()=>{energy.current=-.1;}}>
  <group ref={stem} scale={.001}>
   <mesh castShadow><tubeGeometry args={[curve,14,.022*size,9,false]}/><meshStandardMaterial color="#d5cdb8" roughness={.93}/></mesh>
   <group ref={head} position={[.02,height,0]} scale={.001}>
    <mesh castShadow><primitive object={cap} attach="geometry"/><meshStandardMaterial vertexColors roughness={.89} side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,-.023,0]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.142,32]}/><meshStandardMaterial color="#d5cbb7" roughness={1}/></mesh>
    <lineSegments><primitive object={gills} attach="geometry"/><lineBasicMaterial color="#988975" transparent opacity={.45}/></lineSegments>
   </group>
  </group>
 </group>;
}

export default function PlantedMushroom({plant,wind,paused,reduced}:Props){
 return <group position={plant.position}>{[0,1,2].map(index=><Mushroom key={index} index={index} seed={plant.id} wind={wind} paused={paused} reduced={reduced}/>)}</group>;
}
