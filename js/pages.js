/* Isi semua halaman. Tiap halaman = fungsi di objek Pages */
const Pages={};
const MIN=m=>m>=60?Math.floor(m/60)+" j "+(m%60)+" m":m+" m";
const sum=a=>a.reduce((s,x)=>s+x.min,0);
const norm=s=>s.toLowerCase().replace(/[.!?]/g,"").replace(/\s+/g," ").trim();
const info=t=>`<section class="card"><p>${t}</p></section>`;

/* ---------- Dashboard ---------- */
Pages.dashboard=()=>{
  const A=Store.d&&Store.acts(),t=today(),goal=Store.d.goal,tm=sum(A.filter(x=>x.date===t));
  const gDone=GRAMMAR.filter(g=>(Store.d.grammar[g.id]||{}).status==="selesai").length;
  const hafal=Store.d.vocab.filter(v=>v.status==="sudah hafal").length;
  const sk=["reading","listening","writing","speaking"].map(k=>({k,n:A.filter(x=>x.skill===k).length,m:sum(A.filter(x=>x.skill===k))}));
  const mx=Math.max(1,...sk.map(s=>s.m)),nx=GRAMMAR.find(g=>(Store.d.grammar[g.id]||{}).status!=="selesai");
  $("#view").innerHTML=`<section class="hero"><div class="ring"><svg width="132" height="132"><circle cx="66" cy="66" r="56" fill="none" stroke="#ffffff22" stroke-width="12"/><circle cx="66" cy="66" r="56" fill="none" style="stroke:var(--hl)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${Math.min(1,tm/goal)*352} 352"/></svg><b>${Math.min(100,Math.round(tm/goal*100))}%</b></div>
    <div><h1>Belajar hari ini</h1><p>${tm} dari ${goal} menit${tm>=goal?" — target tercapai":""}</p>${nx?`<a class="btn pri" href="#/grammar/${nx.id}">Lanjut grammar: ${esc(nx.t)}</a>`:""}<br><label>Target harian (menit) <input id="goal" type="number" min="1" value="${goal}"></label></div></section>
  <div class="stats"><div class="stat"><b>${MIN(sum(A))}</b><span>Total waktu belajar</span></div>
    <div class="stat"><b>${Store.d.vocab.length}</b><span>Kosakata (${hafal} sudah hafal)</span></div>
    <div class="stat"><b>${gDone}/${GRAMMAR.length}</b><span>Grammar selesai</span></div>
    <div class="stat"><b>${A.filter(x=>!["vocab","grammar"].includes(x.skill)).length}</b><span>Sesi latihan tercatat</span></div>
  </div>
  <section class="card"><h3>Progress keterampilan</h3>${sk.map(s=>`<p style="margin:8px 0 2px">${LABEL[s.k]} <span class="mut">· ${s.n} sesi · ${MIN(s.m)}</span></p><div class="meter" style="--c:var(--c-${s.k})"><i style="width:${s.m/mx*100}%"></i></div>`).join("")}</section>
  <section class="card"><h3>Riwayat aktivitas terbaru</h3>${A.length?`<ul>${A.slice(0,10).map(x=>`<li>${x.date} · <b>${LABEL[x.skill]}</b> — ${esc(x.text)}${x.min?" ("+x.min+" m)":""}</li>`).join("")}</ul>`:'<p class="empty">Belum ada aktivitas. Mulai dari menu di samping.</p>'}</section>`;
  $("#goal").onchange=e=>{Store.d.goal=Math.max(1,+e.target.value||90);Store.save();Pages.dashboard()};
};

/* ---------- Vocabulary + quiz + flashcards ---------- */
Pages.vocab=()=>crud("vocab",{
  top:`<div class="acts"><button class="btn" id="qz">Latihan arti kata</button><button class="btn" id="fl">Flashcards</button></div>`,
  bind(){$("#qz").onclick=()=>study("quiz");$("#fl").onclick=()=>study("flash")}
});
function study(mode){
  let pool=Store.d.vocab.filter(x=>x.status!=="sudah hafal");
  if(!pool.length)pool=[...Store.d.vocab];
  if(!pool.length)return toast("Tambahkan kosakata dulu");
  pool.sort(()=>Math.random()-.5);
  let i=0,score=0;const d=$("#dlg");
  const close=()=>{d.close();Pages.vocab()};
  const show=()=>{
    if(i>=pool.length){
      d.innerHTML=`<h2>Selesai</h2>${mode==="quiz"?`<p>Skor: ${score} / ${pool.length}</p>`:"<p>Semua kartu sudah diulang.</p>"}<div class="end"><button class="btn pri" id="cx">Tutup</button></div>`;
      $("#cx",d).onclick=close;return;
    }
    const w=pool[i];
    if(mode==="quiz"){
      d.innerHTML=`<form><h2>Latihan arti kata (${i+1}/${pool.length})</h2><p class="big">${esc(w.word)}</p><p class="mut">${esc([w.pron,w.pos].filter(Boolean).join(" · "))}</p><label>Arti dalam bahasa Indonesia<input id="ans" autocomplete="off" autofocus></label><p id="res"></p><div class="end"><button type="button" class="btn" id="cx">Tutup</button><button class="btn pri" id="chk">Cek</button></div></form>`;
      let checked=false;
      $("form",d).onsubmit=e=>{
        e.preventDefault();
        if(checked){i++;return show()}
        const a=$("#ans").value.trim().toLowerCase(),ms=w.meaning.toLowerCase().split(/[,;\/]/).map(s=>s.trim()).filter(Boolean);
        const ok=a.length>1&&ms.some(m=>m.includes(a)||a.includes(m));
        if(ok)score++;checked=true;
        $("#res").innerHTML=`<b class="${ok?"okc":"badc"}">${ok?"Benar":"Belum tepat"}</b> — ${esc(w.meaning)}<br><i>${esc(w.example||"")}</i>`;
        $("#chk").textContent="Lanjut";
      };
    }else{
      const front=`<p class="big">${esc(w.word)}</p><p class="mut">${esc(w.pron||"")}</p>`;
      d.innerHTML=`<h2>Flashcards (${i+1}/${pool.length})</h2><div class="fc" id="fc">${front}</div><p class="mut">Klik kartu untuk melihat arti.</p><div class="end"><button class="btn" id="cx">Tutup</button><button class="btn" id="no">Belum hafal</button><button class="btn pri" id="yes">Hafal</button></div>`;
      let flip=false;
      $("#fc").onclick=()=>{flip=!flip;$("#fc").innerHTML=flip?`<p class="big">${esc(w.meaning)}</p><p>${esc(w.example||"")}</p><p class="mut">${esc(w.exampleId||"")}</p>`:front};
      const mark=s=>{w.status=s;Store.put("vocab",w);i++;show()};
      $("#no").onclick=()=>mark("sedang dipelajari");$("#yes").onclick=()=>mark("sudah hafal");
    }
    $("#cx",d).onclick=close;
  };
  if(!d.open)d.showModal();
  show();
}

/* ---------- Reading & Listening ---------- */
Pages.reading=()=>crud("reading",{top:info("<b>Metode:</b> 15 menit baca tanpa sering berhenti → catat kata yang belum dikenal → pelajari artinya, baca ulang 15 menit dengan suara lantang (perhatikan jeda dan intonasi).")});
Pages.listening=()=>crud("listening",{top:info("<b>Metode:</b> dengarkan tanpa subtitle 2× → catat yang terdengar → putar lagi dengan subtitle/transkrip 2× → cocokkan → catat bagian yang salah dengar.")});

/* ---------- Writing & Speaking ---------- */
const PR={lv:"B1",tp:""},T={s:1800,id:0,rec:null};
const pick=()=>{const a=TOPICS[PR.lv];PR.tp=a[Math.floor(Math.random()*a.length)]};
const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
function practiceTop(name){
  if(!PR.tp)pick();
  const timer=name==="speaking"?`<div class="timer"><span id="tm">${fmt(T.s)}</span><button class="btn sm" id="ts">${T.id?"Jeda":"Mulai"}</button><button class="btn sm" id="tr">Reset</button><button class="btn sm" id="rc">● Rekam</button><audio id="au" controls hidden></audio></div><p class="mut">Rekaman hanya untuk didengar ulang saat ini dan tidak disimpan permanen.</p>`:"";
  return `<section class="card"><div class="row"><label style="margin:0">Level <select id="lv" style="width:auto">${LV.map(l=>`<option${l===PR.lv?" selected":""}>${l}</option>`).join("")}</select></label><button class="btn sm" id="nt">Topik lain</button></div><p class="big" id="tp">${esc(PR.tp)}</p>${timer}<div class="acts"><button class="btn pri" id="go">${name==="writing"?"Mulai menulis":"Catat latihan"}</button></div></section>`;
}
function practiceBind(name){
  $("#lv").onchange=e=>{PR.lv=e.target.value;pick();Pages[name]()};
  $("#nt").onclick=()=>{pick();$("#tp").textContent=PR.tp};
  $("#go").onclick=()=>openForm(name,{level:PR.lv,topic:PR.tp,minutes:name==="speaking"?(Math.round((1800-T.s)/60)||""):""},()=>Pages[name]());
  if(name!=="speaking")return;
  const tick=()=>{T.s--;const e=$("#tm");e&&(e.textContent=fmt(T.s));if(T.s<=0){clearInterval(T.id);T.id=0;toast("Waktu 30 menit selesai")}};
  $("#ts").onclick=()=>{if(T.id){clearInterval(T.id);T.id=0}else T.id=setInterval(tick,1000);$("#ts").textContent=T.id?"Jeda":"Mulai"};
  $("#tr").onclick=()=>{clearInterval(T.id);T.id=0;T.s=1800;$("#tm").textContent=fmt(T.s);$("#ts").textContent="Mulai"};
  $("#rc").onclick=async()=>{
    if(T.rec&&T.rec.state==="recording"){T.rec.stop();return}
    try{
      const st=await navigator.mediaDevices.getUserMedia({audio:true}),ch=[];
      T.rec=new MediaRecorder(st);
      T.rec.ondataavailable=e=>ch.push(e.data);
      T.rec.onstop=()=>{st.getTracks().forEach(x=>x.stop());const a=$("#au");if(a){a.src=URL.createObjectURL(new Blob(ch,{type:T.rec.mimeType}));a.hidden=false}const b=$("#rc");b&&(b.textContent="● Rekam")};
      T.rec.start();$("#rc").textContent="■ Berhenti";
    }catch(e){toast("Perekaman tidak tersedia atau izin mikrofon ditolak")}
  };
}
["writing","speaking"].forEach(n=>Pages[n]=()=>crud(n,{top:practiceTop(n),bind:()=>practiceBind(n)}));

/* ---------- IELTS & TOEFL ---------- */
Pages.exam=()=>crud("exam",{top:info(`<b>Sumber resmi:</b> <a href="https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests" target="_blank" rel="noopener">IELTS British Council</a> · <a href="https://ielts.idp.com/about/ielts-practice-materials" target="_blank" rel="noopener">IELTS IDP</a> · <a href="https://www.ets.org/toefl/test-takers/ibt/prepare.html" target="_blank" rel="noopener">TOEFL iBT ETS</a> · <a href="https://www.ets.org/toefl/test-takers/ibt/prepare/toefl-testready.html" target="_blank" rel="noopener">TOEFL TestReady</a>`)});

/* ---------- Grammar ---------- */
Pages.grammar=id=>id?gDetail(id):gList();
const gst=id=>(Store.d.grammar[id]||{}).status||"belum dipelajari";
function gList(){
  const done=GRAMMAR.filter(g=>gst(g.id)==="selesai").length,next=GRAMMAR.find(g=>gst(g.id)!=="selesai");
  $("#view").innerHTML=`<header class="ph"><div><h1>Grammar Learning</h1><p class="mut">Urutan nomor mengikuti urutan belajar yang disarankan. Selesai ${done} dari ${GRAMMAR.length}.</p></div></header>
  ${next?`<p><a class="btn pri" href="#/grammar/${next.id}">Lanjut: ${esc(next.t)}</a></p>`:""}`+
  ["Present","Past","Future","Grammar Lainnya"].map(gr=>`<h2>${gr}</h2><div class="grid">${GRAMMAR.map((g,i)=>g.g===gr?`<a class="card lnk" href="#/grammar/${g.id}"><small class="mut">Urutan ${i+1}</small><h3>${esc(g.t)}</h3><span class="chip${gst(g.id)==="selesai"?" ok":""}">${gst(g.id)}</span></a>`:"").join("")}</div>`).join("");
}
function gDetail(id){
  const i=GRAMMAR.findIndex(g=>g.id===id);
  if(i<0){location.hash="#/grammar";return}
  const g=GRAMMAR[i],s=Store.d.grammar[id]||{status:"belum dipelajari",note:""};
  const li=x=>x.split(" / ").map(l=>`<li>${esc(l)}</li>`).join("");
  $("#view").innerHTML=`<p><a href="#/grammar">← Semua materi</a></p><h1>${esc(g.t)}</h1><p class="mut">Urutan ${i+1} dari ${GRAMMAR.length} · ${g.g}</p>
  <section class="card"><h3>Penjelasan</h3><p>${esc(g.exp)}</p><h3>Fungsi / kapan digunakan</h3><p>${esc(g.use)}</p><h3>Rumus</h3><p class="code">${esc(g.f)}</p></section>
  <section class="card"><h3>Contoh kalimat</h3><b>Positif</b><ul>${li(g.pos)}</ul><b>Negatif</b><ul>${li(g.neg)}</ul><b>Tanya</b><ul>${li(g.q)}</ul></section>
  <section class="card"><h3>Latihan soal</h3>${g.ex.map((e,k)=>`<p>${esc(e.split("|")[0])}<br><input data-k="${k}" placeholder="Jawabanmu" style="width:60%"> <button class="btn sm" data-ck="${k}">Cek</button> <span id="r${k}"></span></p>`).join("")}<p class="mut">Latihan mandiri: buat 10 kalimat positif, 10 negatif, dan 10 tanya, lalu tulis di catatan.</p></section>
  <section class="card"><h3>Status & catatan pribadi</h3><label>Status<select id="gs">${GSTAT.map(x=>`<option${x===s.status?" selected":""}>${x}</option>`).join("")}</select></label><label>Catatan<textarea id="gn" rows="5">${esc(s.note)}</textarea></label></section>
  <div class="row">${i>0?`<a class="btn" href="#/grammar/${GRAMMAR[i-1].id}">← Sebelumnya</a>`:"<span></span>"}${i<GRAMMAR.length-1?`<a class="btn pri" href="#/grammar/${GRAMMAR[i+1].id}">Berikutnya →</a>`:""}</div>`;
  $$("[data-ck]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.ck,raw=g.ex[k].split("|")[1],ok=raw.split("/").map(norm).includes(norm($(`[data-k="${k}"]`).value));
    $("#r"+k).innerHTML=ok?'<b class="okc">Benar</b>':`<b class="badc">Belum tepat</b> — jawaban: ${esc(raw.replace(/\//g," atau "))}`;
  });
  const save=()=>{
    const o=Store.d.grammar[id]||{},st=$("#gs").value;
    o.status=st;o.note=$("#gn").value;
    if(st==="selesai"){o.done=o.done||today()}else delete o.done;
    Store.d.grammar[id]=o;Store.save();
  };
  $("#gs").onchange=save;$("#gn").oninput=save;
}

/* ---------- Progress ---------- */
Pages._o=0;
Pages.progress=()=>{
  const A=Store.acts();
  const days=[...Array(14)].map((_,i)=>{const d=new Date(Date.now()-(13-i)*864e5).toLocaleDateString("sv-SE");return{d,m:sum(A.filter(x=>x.date===d))}});
  const mx=Math.max(1,...days.map(x=>x.m));
  const freq=["reading","listening","writing","speaking","exam","grammar","vocab"].map(k=>[k,A.filter(x=>x.skill===k).length]);
  const fm=Math.max(1,...freq.map(x=>x[1]));
  const v=Store.d.vocab,gDone=GRAMMAR.filter(g=>gst(g.id)==="selesai").length;
  const set=new Set(A.map(x=>x.date)),n0=new Date(),base=new Date(n0.getFullYear(),n0.getMonth()+Pages._o,1);
  const y=base.getFullYear(),m=base.getMonth(),n=new Date(y,m+1,0).getDate(),pad=(base.getDay()+6)%7;
  const cells=[...Array(pad).fill("<i></i>"),...Array.from({length:n},(_,i)=>{const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`;return `<b class="${set.has(ds)?"act":""}${ds===today()?" td":""}">${i+1}</b>`})].join("");
  const sp=EXAMS.map(t=>{
    const p=Store.d.exam.filter(e=>e.type===t&&e.score!==""&&!isNaN(parseFloat(e.score))).sort((a,b)=>(a.date||"").localeCompare(b.date||"")).map(e=>parseFloat(e.score));
    if(!p.length)return "";
    const lo=Math.min(...p),rg=Math.max(...p)-lo||1;
    const pts=p.map((s,i)=>`${p.length>1?1+i*118/(p.length-1):60},${28-(s-lo)/rg*24}`).join(" ");
    return `<div class="row"><span>${t}</span><svg width="120" height="32" style="color:var(--pri)"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2"/>${p.length===1?'<circle cx="60" cy="28" r="3" fill="currentColor"/>':""}</svg><b>${p.join(" → ")}</b></div>`;
  }).join("")||'<p class="empty">Belum ada skor yang tercatat.</p>';
  $("#view").innerHTML=`<header class="ph"><h1>Progress Tracker</h1></header>
  <div class="stats"><div class="stat"><b>${(sum(A)/60).toFixed(1)}</b><span>Total jam belajar</span></div>
    <div class="stat"><b>${v.length}</b><span>Kosakata (${v.filter(x=>x.status==="sudah hafal").length} hafal, ${v.filter(x=>x.status==="sedang dipelajari").length} dipelajari)</span></div>
    <div class="stat"><b>${gDone}/${GRAMMAR.length}</b><span>Grammar selesai</span></div>
  </div>
  <section class="card"><h3>Menit belajar 14 hari terakhir</h3><div class="bars">${days.map(x=>`<div title="${x.d}: ${x.m} menit"><i style="height:${x.m/mx*100}%"></i><small>${x.d.slice(8)}</small></div>`).join("")}</div></section>
  <section class="card"><h3>Frekuensi latihan per keterampilan</h3>${freq.map(([k,c])=>`<p style="margin:8px 0 2px">${LABEL[k]} <span class="mut">· ${c} kali</span></p><div class="meter" style="--c:var(--c-${k})"><i style="width:${c/fm*100}%"></i></div>`).join("")}</section>
  <section class="card"><h3>Perkembangan skor IELTS / TOEFL</h3>${sp}</section>
  <section class="card"><div class="row"><h3>Kalender aktivitas — ${base.toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</h3><span><button class="btn sm" id="pv">‹</button> <button class="btn sm" id="nx">›</button></span></div><div class="cal">${["Sen","Sel","Rab","Kam","Jum","Sab","Min"].map(x=>`<small class="mut">${x}</small>`).join("")}${cells}</div></section>`;
  $("#pv").onclick=()=>{Pages._o--;Pages.progress()};$("#nx").onclick=()=>{Pages._o++;Pages.progress()};
};

/* ---------- Backup ---------- */
Pages.data=()=>{
  $("#view").innerHTML=`<header class="ph"><h1>Backup & Data</h1></header>
  <section class="card"><h3>Tema warna</h3><div class="acts">${themeBtns("sw")}</div></section>
  <section class="card"><p>Data tersimpan permanen di browser ini (localStorage) dan tetap ada setelah ditutup. Ekspor cadangan secara berkala, terutama sebelum membersihkan data browser atau pindah perangkat.</p>
  <div class="acts"><button class="btn pri" id="ex">Ekspor backup (.json)</button><label class="btn" style="margin:0">Impor backup<input type="file" id="im" accept=".json" hidden></label><button class="btn bad" id="rs">Hapus semua data</button></div></section>`;
  $("#ex").onclick=()=>Store.exportJSON();
  $("#im").onchange=e=>{
    const file=e.target.files[0];if(!file)return;
    const r=new FileReader();
    r.onload=()=>{try{if(!confirm("Data saat ini akan diganti isi backup. Lanjut?"))return;Store.importJSON(r.result);toast("Backup dipulihkan");location.hash="#/dashboard";route()}catch(x){toast("File backup tidak valid")}};
    r.readAsText(file);
  };
  $("#rs").onclick=()=>{if(confirm("Hapus SEMUA data? Tindakan ini tidak bisa dibatalkan.")){localStorage.removeItem(Store.KEY);Store.load();toast("Data dihapus");Pages.dashboard()}};
};
