/* Penyimpanan data (localStorage), backup, dan util dasar */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today=()=>new Date().toLocaleDateString("sv-SE");
const COLS=["vocab","reading","listening","writing","speaking","exam"];

const Store={
  KEY:"english-learning-v1",
  d:{},
  load(){
    try{this.d=JSON.parse(localStorage.getItem(this.KEY))||{}}catch(e){this.d={}}
    COLS.forEach(k=>this.d[k]=this.d[k]||[]);
    this.d.grammar=this.d.grammar||{};
    this.d.goal=this.d.goal||90;
  },
  save(){localStorage.setItem(this.KEY,JSON.stringify(this.d))},
  get(c,id){return this.d[c].find(x=>x.id===id)},
  put(c,o){
    if(o.id){const i=this.d[c].findIndex(x=>x.id===o.id);this.d[c][i]=o}
    else{o.id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);this.d[c].unshift(o)}
    this.save();return o;
  },
  del(c,id){this.d[c]=this.d[c].filter(x=>x.id!==id);this.save()},
  exportJSON(){
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(this.d,null,2)],{type:"application/json"}));
    a.download="english-learning-backup-"+today()+".json";a.click();
  },
  importJSON(text){
    const o=JSON.parse(text);
    if(!o||typeof o!=="object"||Array.isArray(o))throw new Error("format salah");
    this.d=o;this.load();this.save();
  },
  /* Semua aktivitas dihitung langsung dari data yang dicatat, jadi selalu konsisten */
  acts(){
    const d=this.d,a=[];
    d.vocab.forEach(x=>a.push({date:x.date,skill:"vocab",min:0,text:"Kosakata: "+x.word}));
    [["reading","title"],["listening","title"],["writing","topic"],["speaking","topic"],["exam","source"]]
      .forEach(([k,f])=>d[k].forEach(x=>a.push({date:x.date,skill:k,min:+x.minutes||0,text:x[f]||x.type||""})));
    GRAMMAR.forEach(g=>{const s=d.grammar[g.id];if(s&&s.status==="selesai")a.push({date:s.done||today(),skill:"grammar",min:0,text:"Selesai: "+g.t})});
    return a.filter(x=>x.date).sort((x,y)=>y.date.localeCompare(x.date));
  }
};
