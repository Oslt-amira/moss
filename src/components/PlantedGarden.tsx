'use client';
import {useEffect, useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {PlantedSeed} from './seeds';
import PlantedMushroom from './PlantedMushroom';

const hash=(n:number)=>{const x=Math.sin(n*127.1+9.3)*43758.5453;return x-Math.floor(x);};
const ease=(x:number)=>{const t=THREE.MathUtils.clamp(x,0,1);return t*t*(3-2*t);};
type Props={plant:PlantedSeed;wind:number;paused:boolean;reduced:boolean};

export default function PlantedGarden(props:Props){return props.plant.kind==='mushroom'?<PlantedMushroom {...props}/>:<PlantedFlower {...props}/>;}

function PlantedFlower({plant,wind,paused,reduced}:Props){
 const root=useRef<THREE.Group>(null),growth=useRef<THREE.Group>(null),bloom=useRef<THREE.Group>(null),seed=useRef<THREE.Mesh>(null);
 const leaves=useRef<THREE.InstancedMesh>(null),flowers=useRef<THREE.InstancedMesh>(null),age=useRef(0),energy=useRef(0);
 const variation=hash(plant.id+7),height=(plant.kind==='clover'?.26:plant.kind==='bluebell'?.53:.45)*(1+variation*.35);
 const leafCount=plant.kind==='clover'?9:6,flowerCount=plant.kind==='clover'?19:plant.kind==='bluebell'?4:11;
 const duration=plant.kind==='clover'?7.5:plant.kind==='bluebell'?11:9;
 const curve=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(.025,height*.4,0),new THREE.Vector3(-.025,height*.8,.01),new THREE.Vector3(.01,height,.015)]),[height]);
 const flowerGeometry=useMemo(()=>plant.kind==='bluebell'?new THREE.LatheGeometry([new THREE.Vector2(.004,.022),new THREE.Vector2(.025,.014),new THREE.Vector2(.034,-.012),new THREE.Vector2(.049,-.061),new THREE.Vector2(.055,-.073)],12):new THREE.SphereGeometry(1,8,6),[plant.kind]);
 const leafGeometry=useMemo(()=>{
  if(plant.kind!=='clover')return new THREE.SphereGeometry(1,8,5);
  const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(-.09,.03,-.08,.14,-.026,.125);s.bezierCurveTo(0,.125,0,.105,0,.105);s.bezierCurveTo(0,.105,0,.125,.026,.125);s.bezierCurveTo(.08,.14,.09,.03,0,0);return new THREE.ShapeGeometry(s,10);
 },[plant.kind]);
 useEffect(()=>()=>{flowerGeometry.dispose();leafGeometry.dispose();},[flowerGeometry,leafGeometry]);
 useEffect(()=>{
  const o=new THREE.Object3D(),c=new THREE.Color();
  for(let i=0;i<leafCount;i++){
   if(plant.kind==='clover'){
    const row=Math.floor(i/3),a=i%3*Math.PI*2/3+row*.9,p=curve.getPoint(.32+row*.23);
    o.position.copy(p);o.rotation.set(-Math.PI/2+.15,0,a);o.scale.setScalar(.68+row*.12);
   }else{
    const side=i%2?1:-1,t=.16+Math.floor(i/2)*.21,p=curve.getPoint(t);
    o.position.copy(p);o.position.x+=side*.027;o.rotation.set(.2,side*.35,-side*.75);o.scale.set(.022,.085*(1-t*.45),.009);
   }
   o.updateMatrix();leaves.current!.setMatrixAt(i,o.matrix);c.setHSL(.23+hash(i+plant.id)*.025,.32,.23+hash(i*7+plant.id)*.05,THREE.SRGBColorSpace);leaves.current!.setColorAt(i,c);
  }
  leaves.current!.instanceMatrix.needsUpdate=true;
  for(let i=0;i<flowerCount;i++){
   if(plant.kind==='daisy'){
    const a=i/flowerCount*Math.PI*2;o.position.set(Math.cos(a)*.056,0,Math.sin(a)*.056);o.rotation.set(.05,a+Math.PI/2,.04);o.scale.set(.025,.009,.067);
   }else if(plant.kind==='clover'){
    const a=i*2.399,r=.035*Math.sqrt(i/flowerCount);o.position.set(Math.cos(a)*r,.026*(1-i/flowerCount),Math.sin(a)*r);o.rotation.set(0,a,0);o.scale.set(.011,.022,.011);
   }else{
    const a=i*2.1;o.position.set(Math.cos(a)*.055,-i*.066,Math.sin(a)*.055);o.rotation.set(.15*Math.cos(a),a,.15*Math.sin(a));o.scale.setScalar(.66+i*.035);
   }
   o.updateMatrix();flowers.current!.setMatrixAt(i,o.matrix);
  }
  flowers.current!.instanceMatrix.needsUpdate=true;
 },[curve,leafCount,flowerCount,plant.id,plant.kind]);
 useFrame((_,dt)=>{
  if(!root.current||!growth.current||!bloom.current||!seed.current)return;
  if(!paused)age.current+=Math.min(dt,.05);
  const seconds=reduced?duration+1:age.current,g=ease((seconds-.3)/duration),flower=ease((seconds-duration*.56)/(duration*.44));
  growth.current.scale.set(.2+.8*g,Math.max(.001,g),.2+.8*g);bloom.current.scale.setScalar(Math.max(.001,flower));
  seed.current.scale.setScalar(.025*(1-ease((seconds-1)/3)));seed.current.visible=seconds<4;
  if(!paused&&!reduced){energy.current*=Math.exp(-dt*3);const t=age.current;
   root.current.rotation.z=Math.sin(t*1.5+plant.id)*.035*wind+energy.current;root.current.rotation.x=Math.cos(t*1.1+plant.id)*.025*wind;
  }
 });
 return <group position={plant.position} rotation={[0,variation*Math.PI*2,0]}>
  <mesh ref={seed} scale={.025}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#817451" roughness={1}/></mesh>
  <group ref={root} onPointerOver={()=>{energy.current=.12;}} onPointerDown={()=>{energy.current=-.18;}}>
   <group ref={growth} scale={.001}>
    <mesh castShadow><tubeGeometry args={[curve,16,.0045,5,false]}/><meshStandardMaterial color="#6b804c" roughness={.9}/></mesh>
    <instancedMesh ref={leaves} args={[leafGeometry,undefined,leafCount]} castShadow><meshStandardMaterial roughness={.92} side={THREE.DoubleSide}/></instancedMesh>
    <group ref={bloom} position={[.01,height,.015]} scale={.001}>
     <instancedMesh ref={flowers} args={[flowerGeometry,undefined,flowerCount]} castShadow><meshStandardMaterial color={plant.kind==='daisy'?'#f3eedc':plant.kind==='clover'?'#e0d6d2':'#98a7c2'} side={THREE.DoubleSide} roughness={.87}/></instancedMesh>
     {plant.kind==='daisy'&&<mesh scale={[.027,.016,.027]}><sphereGeometry args={[1,10,7]}/><meshStandardMaterial color="#c4aa58" roughness={1}/></mesh>}
    </group>
   </group>
  </group>
 </group>;
}
