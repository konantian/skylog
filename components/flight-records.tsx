import {useMemo} from 'react';
import airports from '@/data/airports.json';
import {flightRecords} from '@/lib/insights.mjs';
import type {Flight} from '@/lib/types';
import {Icon} from './icons';

type RouteRecord={flight:Flight;km:number};
const city=(code:string)=>(airports as Record<string,{city:string}>)[code]?.city||code;
const distance=(km:number)=>Math.round(km).toLocaleString('en-CA');

export function FlightRecords({flights}:{flights:Flight[]}) {
  const records=useMemo(()=>flightRecords(flights,airports),[flights]);
  const routeCard=(label:string,record:RouteRecord|null)=> <div className="flight-record">
    <span className="record-label">{label}</span>
    <strong className="record-route">{record?<>{record.flight.origin}<Icon name="arrow" size={18}/>{record.flight.destination}</>:'暂无记录'}</strong>
    {record&&<><span className="record-distance">约 {distance(record.km)} km</span><span className="record-detail">{city(record.flight.origin)} → {city(record.flight.destination)}</span></>}
  </div>;
  return <section className="flight-records" aria-labelledby="flight-records-title">
    <div className="records-heading"><h4 id="flight-records-title">飞行里程与个人纪录</h4><span>全部 {flights.length} 段乘机记录</span></div>
    <div className="flight-record-grid">
      <div className="flight-record record-total"><span className="record-label"><Icon name="globe" size={14}/>累计飞行距离 · 估算</span><strong>{records.measured?distance(records.totalKm):'—'}<small> km</small></strong><span className="record-detail">每次乘坐分别计入，含重复航线与往返</span></div>
      {routeCard('最远航线',records.longest)}{routeCard('最短航线',records.shortest)}
      <div className="flight-record"><span className="record-label">飞行最多的一年{records.busiestYears.length>1?' · 并列':''}</span><strong className="record-year">{records.busiestYears.map((y:{name:string})=>y.name).join(' / ')||'—'}</strong>{records.busiestYears.length>0&&<span className="record-distance">{records.busiestYears[0].count} 段旅程</span>}<span className="record-detail">按乘机日期所在年份统计</span></div>
    </div>
    <p className="records-note">里程按机场间大圆距离估算，不代表实际飞行轨迹或航司奖励里程。个人纪录不随筛选变化。{records.measured<flights.length&&`另有 ${flights.length-records.measured} 段缺少机场坐标，未计入里程。`}</p>
  </section>;
}
