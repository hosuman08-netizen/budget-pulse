
(function(){
  var K='bp_v2';
  function load(){try{return JSON.parse(localStorage.getItem(K)||'{"cap":300000,"items":[]}');}catch(e){return{cap:300000,items:[]};}}
  function save(s){localStorage.setItem(K,JSON.stringify(s));}
  var s=load();
  var root=document.getElementById('app');
  function spent(){return s.items.reduce(function(a,b){return a+(+b.amt||0);},0);}
  function render(){
    var sp=spent(), left=s.cap-sp, pct=s.cap?Math.min(100,Math.round(sp/s.cap*100)):0;
    root.innerHTML='<div class="card field1Finance" style="font-size:11px;color:#67e8f9">분야1위 목표 · 투명 예산 · 투자권유 아님</div><div class="card"><div class="row" style="justify-content:space-between"><span class="chip">한도 <b>'+s.cap.toLocaleString()+'</b></span><span class="chip">사용 <b>'+pct+'%</b></span></div>'
      +'<div class="bar"><i style="width:'+pct+'%;background:'+(pct>90?'var(--bad)':pct>70?'#fbbf24':'var(--ok)')+'"></i></div>'
      +'<div>남음 <b style="color:var(--gold)">'+(left).toLocaleString()+'</b>원</div></div>'
      +'<div class="card"><label class="sub">주간 한도 수정</label><input id="cap" type="number" value="'+s.cap+'"/><button id="setCap">한도 저장</button></div>'
      +'<div class="card"><label class="sub">지출 추가</label><input id="name" placeholder="항목 (커피, 교통…)"/><input id="amt" type="number" placeholder="금액"/><button id="add">추가</button></div>'
      +'<div class="card"><b>이번 주 기록</b><div id="list"></div></div>';
    var list=document.getElementById('list');
    list.innerHTML=s.items.slice().reverse().slice(0,20).map(function(it){
      return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2a2438"><span>'+it.name+'</span><b>'+(+it.amt).toLocaleString()+'</b></div>';
    }).join('')||'<span class="sub">아직 없음</span>';
    document.getElementById('setCap').onclick=function(){s.cap=+document.getElementById('cap').value||0;save(s);render();track('cap');};
    if(!document.getElementById('resetWeek')){
      var rb=document.createElement('button'); rb.id='resetWeek'; rb.textContent='주간 기록 초기화';
      rb.style.cssText='width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#1c1826;color:#ece8f1';
      rb.onclick=function(){if(confirm('이번 주 기록 지울까?')){s.items=[];save(s);render();}};
      root.appendChild(rb);
    }
    if(!document.getElementById('sh')){
      var b=document.createElement('button'); b.id='sh'; b.style.cssText='width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#1c1826;color:#ece8f1;font-weight:700'; b.style.width='100%'; b.style.marginTop='8px'; b.textContent='주간 보드 공유';
      b.onclick=function(){var sp=spent(); var text='Budget Pulse '+sp.toLocaleString()+'/'+s.cap.toLocaleString()+' · https://hosuman08-netizen.github.io/budget-pulse/';
        if(navigator.clipboard)navigator.clipboard.writeText(text); try{legionTrack('share_peak',{})}catch(e){}; alert('복사됨');};
      root.appendChild(b);
    }
    document.getElementById('add').onclick=function(){
      var n=document.getElementById('name').value||'지출', a=+document.getElementById('amt').value||0;
      if(!a)return; s.items.push({name:n,amt:a,t:Date.now()}); save(s); render(); track('add',{a:a});
    };
  }
  function track(e,d){try{if(window.legionTrack)legionTrack(e,d||{});}catch(x){}}
  track('session_start'); render();
  // share
  var bar=document.createElement('div'); bar.className='card';
  bar.innerHTML='<button id="sh" class="sec" style="width:100%">주간 보드 공유 문구</button>';
  document.getElementById('app').parentNode && null;

})();
