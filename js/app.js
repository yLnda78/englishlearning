/* Navigasi dan router berbasis hash (#/halaman/argumen) */
const NAV=[["dashboard","Dashboard"],["vocab","Vocabulary"],["grammar","Grammar"],["reading","Reading"],["listening","Listening"],["writing","Writing"],["speaking","Speaking"],["exam","IELTS & TOEFL"],["progress","Progress"],["data","Backup"]];

function route(){
  const [p,arg]=(location.hash.slice(2)||"dashboard").split("/");
  const pg=NAV.some(n=>n[0]===p)?p:"dashboard";
  $$("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.k===pg));
  Pages[pg](arg);
  window.scrollTo(0,0);
}

/* Tema warna: disimpan di browser, terpisah dari data belajar */
const THEMES=[["rose","Rose","#d6457b"],["matcha","Matcha","#4c8a3c"],["lavender","Lavender","#7c5cd6"],["peach","Peach","#e8743b"],["mocha","Mocha","#8a5a3c"],["ocean","Ocean","#0e8f7e"]];
const themeNow=()=>{try{return localStorage.getItem("elp-theme")||"rose"}catch(e){return"rose"}};
const themeBtns=cls=>THEMES.map(([k,l,c])=>`<button class="${cls||""}${k===themeNow()?" on":""}" data-th="${k}" title="${l}" aria-label="Tema ${l}" style="--sw:${c}"></button>`).join("");
function setTheme(k){
  if(k==="ocean")document.documentElement.removeAttribute("data-theme");else document.documentElement.dataset.theme=k;
  try{localStorage.setItem("elp-theme",k)}catch(e){}
  $$("[data-th]").forEach(b=>b.classList.toggle("on",b.dataset.th===k));
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-th]");b&&setTheme(b.dataset.th)});
setTheme(themeNow());
Store.load();
$("#nav").innerHTML="<b>English Learning</b><small>Catatan belajar pribadi</small>"+NAV.map(([k,l])=>`<a href="#/${k}" data-k="${k}" style="--c:var(--c-${k})"><i></i>${l}</a>`).join("")+`<small class="t">Warna tema</small><div id="themes">${themeBtns()}</div>`;
addEventListener("hashchange",route);
route();
