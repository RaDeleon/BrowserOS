const p=browser.page((await browser.pages.list()).find(p=>p.ownership==='mine'&&p.url==='http://127.0.0.1:8769/').pageId);
const samples=[];
for(let i=0;i<5;i++){
 const start=Date.now();
 const s=await p.snapshot();
 const captured=Date.now();
 const read=await p.read('#inventory');
 const name=s.refs.find(r=>r.role==='textbox'&&r.name==='Project name').ref;
 const button=s.refs.find(r=>r.role==='button'&&r.name==='Save project').ref;
 await p.fill(name,'RAD-'+i);
 await p.click(button);
 const wait=await p.waitForText('Saved: RAD-'+i);
 const result=await p.read('#result');
 samples.push({iteration:i,snapshotMs:captured-start,taskMs:Date.now()-start,snapshotChars:s.text.length,scopedReadChars:read.length,verified:wait.matched&&result.includes('Saved: RAD-'+i)&&read.includes('RAD-042')&&read.includes('17'),result});
}
return samples;
