import records from '@/data/photo-settings.json';
import type {Photo} from '@/lib/types';
import {Icon} from './icons';
type Settings={date:string;shutter:string;focalLengthMm:number;aperture:number;iso:number;lens?:string;camera?:string;source:string};

export function PhotoSettings({photo}:{photo:Photo}) {
  const record=(records as Record<string,Settings>)[photo.id];
  if(!record||record.date!==photo.date)return <div className="shooting-settings"><h3>拍摄参数</h3><p>暂无可核对的原片 EXIF。</p></div>;
  return <section className="shooting-settings" aria-label="照片拍摄参数"><h3><Icon name="camera" size={16}/>拍摄参数 <span>IN THE FIELD</span></h3>
    <dl>{[[`${record.focalLengthMm} mm`,'焦距'],[record.shutter,'快门'],[`ƒ/${record.aperture}`,'光圈'],[String(record.iso),'ISO']].map(([value,label])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p className="shooting-gear">{record.camera&&<strong>{record.camera==='ILCE-7C'?'Sony α7C':record.camera}</strong>}{record.lens&&<span>{record.lens==='E 28-200mm F2.8-5.6 A071'?'Tamron 28–200mm F/2.8–5.6 (A071)':record.lens}</span>}</p><p className="shooting-source">原片 EXIF · 画面为后期成片，焦距不包含后期裁切。</p>
  </section>;
}
