
(function(){
  var K='bp_v2';
  function load(){try{return JSON.parse(localStorage.getItem(K)||'{"cap":300000,"items":[]}');}catch(e){return{cap:300000,items:[]};}}
  function save(s){localStorage.setItem(K,JSON.stringify(s));}
  var s=load();
  var root=document.getElementById('app');
  function spent(){return s.items.reduce(function(a,b){return a+(+b.amt||0);},0);}
  function render(){
    var sp=spent(), left=s.cap-sp, pct=s.cap?Math.min(100,Math.round(sp/s.cap*100)):0;
    root.innerHTML='<div class="card"><div class="row" style="justify-content:space-between"><span class="chip">한도 <b>'+s.cap.toLocaleString()+'</b></span><span class="chip">사용 <b>'+pct+'%</b></span></div>'
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
    document.getElementById('add').onclick=function(){
      var n=document.getElementById('name').value||'지출', a=+document.getElementById('amt').value||0;
      if(!a)return; s.items.push({name:n,amt:a,t:Date.now()}); save(s); render(); track('add',{a:a});
    };
  }
  function track(e,d){try{if(window.legionTrack)legionTrack(e,d||{});}catch(x){}}
  track('session_start'); render();
})();
