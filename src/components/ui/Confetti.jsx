export function Confetti({ active }) {
  if (!active) return null;
  const ps = Array.from({length:30},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*0.5,color:["#fbbf24","#4ade80","#f87171","#818cf8","#22d3ee"][i%5],size:5+Math.random()*6}));
  return (
    <div className="confetti-layer">
      {ps.map(p=><div key={p.id} className="confetti-piece" style={{left:`${p.left}%`,width:p.size,height:p.size,backgroundColor:p.color,borderRadius:Math.random()>0.5?"50%":"2px",animation:`cf 2s ${p.delay}s ease-in forwards`}}/>)}
    </div>
  );
}
