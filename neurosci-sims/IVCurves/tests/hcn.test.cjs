// Run: node tests/hcn.test.cjs
const assert=require('node:assert/strict');
const M=require('../model.js');
const near=(a,b,tol=1e-10)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
// Independent derivative from Fig. 2 (C0..C4, O0..O4), rather than matrix entries.
function derivative(s,v) {
 const a=.01406*Math.exp(-.9369*v/25.85)/1000,b=743.6*Math.exp(.9369*v/25.85)/1000;
 const g=2.289*Math.exp(-1.018*v/25.85)/1000,d=74.36*Math.exp(1.018*v/25.85)/1000,f=Math.sqrt(5);
 const out=Array(10).fill(0);
 for(let i=0;i<5;i++) {
  const flux=a*f**i*s[i]-b/f**i*s[i+5];out[i]-=flux;out[i+5]+=flux;
  if(i<4) for(const offset of [0,5]) {
   const forward=g*(offset?f:1),back=d/(offset?f:1);
   const flux=(4-i)*forward*s[offset+i]-(i+1)*back*s[offset+i+1];
   out[offset+i]-=flux;out[offset+i+1]+=flux;
  }
 }
 return out;
}
function rk4(s,v,duration,dt=.01) {
 const n=Math.ceil(duration/dt);dt=duration/n;
 for(let k=0;k<n;k++) {
  const a=derivative(s,v),b=derivative(s.map((x,i)=>x+dt*a[i]/2),v);
  const c=derivative(s.map((x,i)=>x+dt*b[i]/2),v),d=derivative(s.map((x,i)=>x+dt*c[i]),v);
  s=s.map((x,i)=>x+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6);
 }
 return s;
}
near(M.hcnRates(0).alpha,.01406/1000);
near(M.hcnRates(0).beta,743.6/1000);
for(const v of [-120,-100,-60,-35,0,100]) {
 const eq=M.hcnEquilibrium(v),q=M.hcnGenerator(v);
 near(eq.reduce((a,b)=>a+b),1);assert(eq.every(x=>x>=0));
 derivative(eq,v).forEach(x=>near(x,0));
 const r=M.hcnRates(v),K=r.delta/r.gamma,L=r.beta/r.alpha;
 // Appendix A13 independent closed-form open probability.
 near(M.hcnOpen(eq),1/(1+L*((1+1/K)/(1+1/(.2*K)))**4));
 const t=M.populationTransition(q,5000);
 t.forEach(row=>{near(row.reduce((a,b)=>a+b),1);assert(row.every(x=>x>=0));});
 const end=M.movePopulation(M.hcnEquilibrium(-35),t);
 end.forEach((x,i)=>near(x,eq[i],1e-8));
}
for(const [hold,v,t] of [[-35,-100,100],[-35,-60,300],[-120,-35,100]]) {
 const initial=M.hcnEquilibrium(hold);
 const actual=M.movePopulation(initial,M.populationTransition(M.hcnGenerator(v),t));
 const expected=rk4(initial,v,t);
 actual.forEach((x,i)=>near(x,expected[i],1e-8));
 const half=M.populationTransition(M.hcnGenerator(v),t/2);
 M.movePopulation(M.movePopulation(initial,half),half).forEach((x,i)=>near(x,actual[i]));
}
const p={hold:-35,duration:1000,measure:'end'},c={channel:'HCN',g:1,e:-30};
const sweep=M.sweep(p,c,-100);
assert(sweep.measured<-60);assert(sweep.values.every(Number.isFinite));
const start=sweep.time.findIndex((t,i)=>t===2&&sweep.voltage[i]===-100);
near(sweep.values[start],M.hcnOpen(M.hcnEquilibrium(-35))*(-70));
assert(Math.abs(sweep.values[start])<Math.abs(sweep.measured));
assert.equal(M.sweep(p,c,-30).measured,0);
near(M.sweep(p,{...c,g:2},-100).measured,sweep.measured*2);
const short=M.sweep({...p,duration:20},c,-100);
assert(Math.abs(short.measured)<Math.abs(sweep.measured));
const long=M.sweep({...p,duration:5000},{channel:'Na',g:120,e:50},-20);
near(long.measured,M.sweep({...p,duration:200},{channel:'Na',g:120,e:50},-20).measured,1e-6);
// nAChR constant-pulse propagation agrees with its previous RK4 implementation.
for(const ach of [.1,1,5]) {
 const exact=M.nachrPopulation([2,2.1,4,5],ach,2);
 let state=M.advanceNachr([1,0,0,0],.1,ach);near(exact[1],state[3],1e-6);
 state=M.advanceNachr(state,1.9,ach);near(exact[2],state[3],1e-6);
 state=M.advanceNachr(state,1,0);near(exact[3],state[3],1e-6);
}
console.log('HCN published rates, equilibrium, independent RK4 agreement, probability conservation, long sweeps and nAChR regression passed.');
