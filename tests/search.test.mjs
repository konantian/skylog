import {test} from 'node:test';
import ramp from './fixtures/ramp-photo.json' with {type:'json'};
import assert from 'node:assert/strict';
import data from '../data/catalog.json' with {type:'json'};
import flightData from '../data/flights.json' with {type:'json'};
import {filterCatalog,filterPhotos,filterFlights,initialFilters,airlinesForModel} from '../lib/filter.mjs';
const {aircraft,airlines,photos}=data;
const search=(query,extra={})=>({...initialFilters,query,...extra});
const models=query=>filterCatalog(aircraft,photos,search(query),'aircraft',aircraft,airlines).map(a=>a.name);

test('model searches do not match adjacent fields, photo numbers or other subjects in a photograph',()=>{
  assert.deepEqual(models('787').sort(),['Boeing 787-8','Boeing 787-9','Boeing 787-10'].sort());
  assert.ok(models('A330').every(name=>name.startsWith('Airbus A330')));
  assert.ok(models('777').every(name=>name.startsWith('Boeing 777')));
  assert.deepEqual(models('７８７－９'),['Boeing 787-9']);
  assert.deepEqual(models('777200LR'),['Boeing 777-200LR']);
});
test('photo model searches respect the same-aircraft model and airline filters',()=>{
  const results=filterPhotos(photos,search('787'),aircraft,airlines);
  assert.ok(results.length>0);
  assert.ok(results.every(p=>p.models.some(m=>m.startsWith('Boeing 787'))));
  assert.ok(!results.some(p=>p.id==='DSC07874'));
  assert.deepEqual(filterPhotos(photos,search('A330',{model:'Boeing 777-300ER'}),aircraft,airlines),[]);
  assert.deepEqual(filterPhotos([ramp],search('777',{airline:'SWISS'}),aircraft,airlines),[]);
  const rampAirlines=airlines.filter(a=>ramp.airlines.includes(a.name)).map(a=>({...a,photoIds:[ramp.id]}));
  const carriers=filterCatalog(rampAirlines,[ramp],search('A330'),'airlines',aircraft,airlines);
  assert.deepEqual(filterPhotos([ramp],search('C-FIUW'),aircraft,airlines),[ramp]);
  assert.ok(carriers.length>0);
  assert.ok(carriers.every(a=>ramp.models.some(m=>m.includes('A330')&&airlinesForModel(ramp,m).includes(a.name))));
});
test('explicit identifiers, translated categories and flight search remain available',()=>{
  assert.deepEqual(filterPhotos(photos,search('DSC07874'),aircraft,airlines).map(p=>p.id),['DSC07874']);
  assert.ok(filterPhotos(photos,search('C-FIVM'),aircraft,airlines).length>0);
  assert.ok(filterPhotos(photos,search('BA93'),aircraft,airlines).some(p=>p.id==='DSC01106'));
  assert.ok(models('Widebody airliner').length>0);
  const matches=filterFlights(flightData.flights,search('787'),aircraft,airlines);
  assert.ok(matches.length>0&&matches.every(f=>f.modelLabel.includes('787')));
  assert.ok(filterFlights(flightData.flights,search('F8608'),aircraft,airlines).length>0);
});
