export function recentTopics(updates) {
 const seen=new Set();
 return updates.filter(update=>{
  const key=update.title?update.url.split('#')[0]:`${update.actor}:${update.action}`;
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
export function activityBars(updates,referenceDate) {
 const end=new Date(referenceDate).toISOString().slice(0,10);
 const start=new Date(`${end}T00:00:00Z`).getTime()-29*86400000;
 const days=Array.from({length:30},(_,index)=>({date:new Date(start+index*86400000).toISOString().slice(0,10),count:0}));
 const lookup=new Map(days.map(day=>[day.date,day]));
 updates.forEach(update=>{const day=lookup.get(update.date.slice(0,10));if(day)day.count++;});
 return days;
}
