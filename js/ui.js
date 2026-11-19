/* Komponen UI umum: skema form, CRUD generik, dialog, salin, toast */
const f=(k,l,t="text",o,r)=>({k,l,t,o,r});
const SUB=r=>[r.date,r.minutes&&r.minutes+" menit"].filter(Boolean).join(" · ");
const DUR=f("minutes","Durasi (menit)","number");
const DATE=f("date","Tanggal","date");

const SCHEMA={
  vocab:{label:"Vocabulary Notes",intro:"Catat kosakata, cari, filter, lalu ulangi dengan quiz atau flashcards.",filters:["cat","status"],def:{status:"belum hafal"},
    head:r=>r.word+" — "+r.meaning,chip:r=>r.status,
    sub:r=>[r.pos,r.pron,r.cat,r.date].filter(Boolean).join(" · "),
    f:[f("word","English word","text",0,1),f("meaning","Arti (Indonesia)","text",0,1),f("pos","Part of speech","select",["noun","verb","adjective","adverb","pronoun","preposition","conjunction","interjection","phrase"]),f("pron","Pelafalan"),f("example","Contoh kalimat (Inggris)"),f("exampleId","Terjemahan contoh kalimat"),f("cat","Kategori / topik"),f("date","Tanggal ditambahkan","date"),f("status","Status","select",STATUS)]},
  reading:{label:"Reading Tracker",head:r=>r.title,sub:SUB,
    f:[f("title","Judul bacaan","text",0,1),f("source","Sumber bacaan"),DATE,DUR,f("newWords","Kosakata baru","textarea"),f("notes","Catatan pemahaman","textarea")]},
  listening:{label:"Listening Tracker",head:r=>r.title,sub:SUB,
    f:[f("title","Judul video / audio","text",0,1),f("link","Link sumber","url"),DATE,DUR,f("heard","Transkrip / catatan hasil pendengaran","textarea"),f("compare","Perbandingan dengan subtitle (bagian yang salah dengar)","textarea"),f("newWords","Kosakata baru","textarea")]},
  writing:{label:"Writing Practice",filters:["level"],head:r=>r.topic,chip:r=>r.level,sub:SUB,
    copy:r=>`Tolong koreksi tulisan bahasa Inggris saya (level ${r.level}).\nTopik: ${r.topic}\n\n${r.text||""}\n\nKoreksi grammar, pilihan kata, struktur kalimat, koherensi, dan kejelasan argumen. Jelaskan alasan setiap koreksi, lalu berikan versi revisi sebagai contoh.`,
    f:[f("level","Level","select",LV,1),f("topic","Topik","text",0,1),DATE,DUR,f("text","Tulisan saya (sebelum revisi)","textarea"),f("aiNotes","Catatan koreksi dari AI","textarea"),f("revised","Versi setelah revisi","textarea")]},
  speaking:{label:"Speaking Practice",filters:["level"],head:r=>r.topic,chip:r=>r.level,sub:SUB,
    copy:r=>`Tolong evaluasi jawaban speaking saya (level ${r.level}).\nPertanyaan: ${r.topic}\n\nCatatan/transkrip jawaban saya:\n${r.notes||""}\n\nBeri masukan tentang grammar, kosakata, kelancaran, pengucapan, dan pengembangan ide.`,
    f:[f("level","Level","select",LV,1),f("topic","Pertanyaan / topik","text",0,1),DATE,DUR,f("notes","Catatan jawaban","textarea"),f("evaluation","Catatan evaluasi","textarea")]},
  exam:{label:"IELTS & TOEFL Practice",filters:["type"],head:r=>r.type+(r.source?" — "+r.source:""),chip:r=>r.score?"Skor "+r.score:"",sub:SUB,
    f:[f("type","Jenis latihan","select",EXAMS,1),f("source","Sumber latihan"),f("link","Link soal / materi","url"),DATE,DUR,f("score","Skor"),f("errors","Kesalahan yang ditemukan","textarea"),f("notes","Catatan evaluasi","textarea")]}
};

function toast(m){
  let t=$("#toast");
  if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t)}
  t.textContent=m;t.className="show";clearTimeout(t._t);t._t=setTimeout(()=>t.className="",1800);
}
function copy(text){
  const fallback=()=>{const t=document.createElement("textarea");t.value=text;document.body.appendChild(t);t.select();document.execCommand("copy");t.remove();toast("Disalin ke clipboard")};
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(()=>toast("Disalin ke clipboard"),fallback);
  else fallback();
}

function fieldHTML(x,v=""){
  const req=x.r?" required":"";let el;
  if(x.t==="select")el=`<select name="${x.k}"${req}><option value="">-</option>${x.o.map(o=>`<option${o===v?" selected":""}>${esc(o)}</option>`).join("")}</select>`;
  else if(x.t==="textarea")el=`<textarea name="${x.k}" rows="5">${esc(v)}</textarea>`;
  else el=`<input name="${x.k}" type="${x.t}" value="${esc(v)}"${req}${x.t==="number"?' min="0"':""}>`;
  return `<label>${x.l}${x.r?" *":""}${el}</label>`;
}

function openForm(name,rec,after){
  const S=SCHEMA[name],r={date:today(),...S.def,...rec},d=$("#dlg");
  d.innerHTML=`<form><h2>${rec&&rec.id?"Edit":"Tambah"} — ${S.label}</h2>${S.f.map(x=>fieldHTML(x,r[x.k])).join("")}<div class="end"><button type="button" class="btn" id="cx">Batal</button><button class="btn pri">Simpan</button></div></form>`;
  d.showModal();
  $("#cx",d).onclick=()=>d.close();
  $("form",d).onsubmit=e=>{
    e.preventDefault();
    Store.put(name,{...rec,...Object.fromEntries(new FormData(e.target))});
    d.close();toast("Tersimpan");after&&after();
  };
}

/* Halaman CRUD generik: cari, filter, tambah, edit, hapus */
const ST={};
function crud(name,o={}){
  const S=SCHEMA[name],st=ST[name]=ST[name]||{q:"",f:{}};
  const opts=k=>{const x=S.f.find(y=>y.k===k);return x.o||[...new Set(Store.d[name].map(r=>r[k]).filter(Boolean))].sort()};
  const again=()=>crud(name,o);
  $("#view").innerHTML=`<header class="ph"><div><h1>${S.label}</h1><p class="mut">${S.intro||""}</p></div><button class="btn pri" id="add">+ Tambah</button></header>${o.top||""}
  <div class="bar"><input id="q" type="search" placeholder="Cari..." value="${esc(st.q)}">${(S.filters||[]).map(k=>`<select data-f="${k}"><option value="">Semua ${S.f.find(y=>y.k===k).l.toLowerCase()}</option>${opts(k).map(x=>`<option${st.f[k]===x?" selected":""}>${esc(x)}</option>`).join("")}</select>`).join("")}</div><div id="list"></div>`;
  const draw=()=>{
    const q=st.q.toLowerCase();
    const rows=Store.d[name].filter(r=>(!q||Object.values(r).join(" ").toLowerCase().includes(q))&&(S.filters||[]).every(k=>!st.f[k]||r[k]===st.f[k]))
      .sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    $("#list").innerHTML=rows.length?rows.map(r=>`<article class="card" data-s="${name}" data-id="${r.id}"><div class="row"><h3>${esc(S.head(r))}</h3>${S.chip&&S.chip(r)?`<span class="chip">${esc(S.chip(r))}</span>`:""}</div><p class="mut">${esc((S.sub||SUB)(r))}</p><details><summary>Detail</summary><dl>${S.f.filter(x=>r[x.k]).map(x=>`<dt>${x.l}</dt><dd>${x.t==="url"&&/^https?:\/\//i.test(r[x.k])?`<a href="${esc(r[x.k])}" target="_blank" rel="noopener">${esc(r[x.k])}</a>`:esc(r[x.k])}</dd>`).join("")}</dl></details><div class="acts">${S.copy?'<button class="btn sm" data-a="copy">Salin untuk AI</button>':""}<button class="btn sm" data-a="edit">Edit</button><button class="btn sm bad" data-a="del">Hapus</button></div></article>`).join(""):`<p class="empty">Belum ada data. Klik "+ Tambah" untuk mulai.</p>`;
  };
  $("#add").onclick=()=>openForm(name,{},again);
  $("#q").oninput=e=>{st.q=e.target.value;draw()};
  $$("[data-f]").forEach(s=>s.onchange=()=>{st.f[s.dataset.f]=s.value;draw()});
  $("#list").onclick=e=>{
    const b=e.target.closest("[data-a]");if(!b)return;
    const id=b.closest(".card").dataset.id,r=Store.get(name,id);
    if(b.dataset.a==="edit")openForm(name,r,again);
    if(b.dataset.a==="del"&&confirm("Hapus data ini?")){Store.del(name,id);again()}
    if(b.dataset.a==="copy")copy(S.copy(r));
  };
  draw();o.bind&&o.bind();
}
