const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('client/src/components/VideoPlayer/guestPlayback.js','utf8').replace('export function','function')+'\nreturn bindGuestPlayback;';
function setup() {
  const timers = new Map(); let n=0;
  const bind = new Function('setTimeout','clearTimeout',source)((fn)=>{timers.set(++n,fn);return n;},id=>timers.delete(id));
  const video = new EventTarget(); video.paused=true; video.readyState=0;
  return {bind,video,timers};
}
test('blocked autoplay can be started by a direct user gesture',async()=>{
 const {bind,video}=setup(); const states=[]; let allow=false;
 video.play=()=>allow ? (video.paused=false,video.readyState=4,Promise.resolve()) : Promise.reject(Object.assign(new Error(),{name:'NotAllowedError'}));
 const player=bind(video,{},s=>states.push(s));
 await new Promise(r=>setImmediate(r)); assert.equal(states.at(-1),'blocked');
 allow=true; await player.play(); assert.equal(states.at(-1),'playing'); player.dispose();
});
test('early playing event is observed and canplay retries an interrupted initial attempt',async()=>{
 const {bind,video}=setup(); const states=[];let calls=0;
 Object.defineProperty(video,'srcObject',{set(){video.dispatchEvent(new Event('playing'));},get(){return null;}});
 video.play=()=>{calls++;return Promise.reject(Object.assign(new Error(),{name:'AbortError'}));};
 const player=bind(video,{},s=>states.push(s)); assert.ok(states.includes('playing'));
 video.dispatchEvent(new Event('canplay')); assert.equal(calls,2);
 player.dispose(); const count=states.length;
 video.dispatchEvent(new Event('playing')); await new Promise(r=>setImmediate(r));assert.equal(states.length,count);
});
test('pending media reports waiting and late results cannot affect a disposed stream',async()=>{
 const {bind,video,timers}=setup(); const states=[];let resolve;
 video.play=()=>new Promise(r=>resolve=r);
 const player=bind(video,{},s=>states.push(s)); timers.values().next().value();assert.equal(states.at(-1),'waiting');
 player.dispose();video.paused=false;video.readyState=4; resolve();await Promise.resolve();assert.equal(states.at(-1),'waiting');
});
