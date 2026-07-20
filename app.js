
(function(){
  var K='bp_v2';
  var SHARE_BASE='https://hosuman08-netizen.github.io/budget-pulse/';
  function load(){try{return JSON.parse(localStorage.getItem(K)||'{"cap":300000,"items":[]}');}catch(e){return{cap:300000,items:[]};}}
  function save(s){localStorage.setItem(K,JSON.stringify(s));}
  function dayKey(off){
    var d=new Date(); d.setDate(d.getDate()+(off||0));
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function kId(){
    try{
      var id=localStorage.getItem('bp_k_id');
      if(!id){id='b'+Math.random().toString(36).slice(2,8);localStorage.setItem('bp_k_id',id);}
      return id;
    }catch(e){return 'share';}
  }
  function shareUrl(){return SHARE_BASE+'?utm_source=share&utm_medium=app&ref='+encodeURIComponent(kId());}
  function bumpStreak(){
    try{
      var st=JSON.parse(localStorage.getItem('bp_streak')||'{}');
      if(!st||typeof st!=='object')st={last:null,count:0};
      var t=dayKey(0);
      if(st.last===t) return st;
      var y=dayKey(-1),y2=dayKey(-2),froze=false;
      if(st.last && st.last!==y && st.last===y2 && (st.count||0)>=3){
        var ready=!st.shieldLast||((new Date(t)-new Date(st.shieldLast))/86400000)>=7;
        if(ready){st.shieldLast=t;st.last=y;froze=true;try{legionTrack('streak_freeze',{count:st.count})}catch(e){}}
      }
      st.count=(st.last===y)?(st.count||0)+1:1;
      st.last=t;
      localStorage.setItem('bp_streak',JSON.stringify(st));
      try{legionTrack('streak',{count:st.count,froze:froze})}catch(e){}
      return st;
    }catch(e){return {count:0};}
  }
  var s=load();
  var root=document.getElementById('app');
  function spent(){return s.items.reduce(function(a,b){return a+(+b.amt||0);},0);}
  function fomoLeft(){
    var end=new Date(); end.setHours(24,0,0,0);
    var ms=Math.max(0,end-Date.now());
    var h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
    return (h?h+'h ':'')+m+'m';
  }
  function render(){
    var st=JSON.parse(localStorage.getItem('bp_streak')||'{}');
    var sc=st.count||0;
    var ready=!st.shieldLast||((new Date(dayKey(0))-new Date(st.shieldLast))/86400000)>=7;
    var sp=spent(), left=s.cap-sp, pct=s.cap?Math.min(100,Math.round(sp/s.cap*100)):0;
    root.innerHTML='<div class="card field1Finance" style="font-size:11px;color:#67e8f9">분야1위 · 투명 예산 · 정진 · 투자권유 아님</div>'
      +'<div class="card"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px">'
      +'<span class="chip">한도 <b>'+s.cap.toLocaleString()+'</b></span>'
      +'<span class="chip">사용 <b>'+pct+'%</b></span>'
      +'<span class="chip">🔥 '+sc+'일'+(sc>=3&&ready?' · 🛡️':'')+'</span>'
      +'<span class="chip">리셋 '+fomoLeft()+'</span></div>'
      +'<div class="bar"><i style="width:'+pct+'%;background:'+(pct>90?'var(--bad)':pct>70?'#fbbf24':'var(--ok)')+'"></i></div>'
      +'<div>남음 <b style="color:var(--gold)">'+(left).toLocaleString()+'</b>원</div></div>'
      +'<div class="card"><label class="sub">주간 한도 수정</label><input id="cap" type="number" value="'+s.cap+'"/><button id="setCap">한도 저장</button></div>'
      +'<div class="card"><label class="sub">지출 추가</label><input id="name" placeholder="항목 (커피, 교통…)"/><input id="amt" type="number" placeholder="금액"/><button id="add">추가</button></div>'
      +'<div class="card"><b>이번 주 기록</b><div id="list"></div></div>'
      +'<div class="card" id="moneyPipe" style="text-align:center;font-size:12px">'
      +'<div style="color:#67e8f9;font-weight:700;margin-bottom:6px">💎 투명 금융 루프</div>'
      +'<p class="sub" style="margin:0 0 8px">로컬 계산만 · 투자권유 아님 · 엔터 앱과 트랙 분리</p>'
      +'<a style="color:#ece8f1;margin:0 6px" href="https://hosuman08-netizen.github.io/side-hustle/?utm_source=budget&utm_medium=pipe">📒 Side Hustle</a>'
      +'<a style="color:#ece8f1;margin:0 6px" href="https://hosuman08-netizen.github.io/cost-basis/?utm_source=budget&utm_medium=pipe">🧮 Cost Basis</a>'
      +'<a style="color:#e0b552;margin:0 6px" href="https://hosuman08-netizen.github.io/legion-hub/?utm_source=budget&utm_medium=pipe">🎮 Arcade</a>'
      +'</div>'
      +'<button id="sh" style="width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#1c1826;color:#ece8f1;font-weight:700">주간 보드 공유</button>'
      +'<button id="resetWeek" style="width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#1c1826;color:#ece8f1">주간 기록 초기화</button>';
    var list=document.getElementById('list');
    if(!s.items.length){
      list.innerHTML='<div class="sub" style="padding:8px 0">아직 없음 — 첫 지출을 기록하면 한도 바가 움직입니다.<br><button id="emptyAdd" style="margin-top:8px">예시 +커피 4500</button></div>';
      var eb=document.getElementById('emptyAdd');
      if(eb) eb.onclick=function(){s.items.push({name:'커피',amt:4500,t:Date.now()});save(s);bumpStreak();render();track('add',{a:4500,sample:1});};
    }else{
      list.innerHTML=s.items.slice().reverse().slice(0,20).map(function(it){
        return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2a2438"><span>'+it.name+'</span><b>'+(+it.amt).toLocaleString()+'</b></div>';
      }).join('');
    }
    document.getElementById('setCap').onclick=function(){s.cap=+document.getElementById('cap').value||0;save(s);render();track('cap');};
    document.getElementById('resetWeek').onclick=function(){if(confirm('이번 주 기록 지울까?')){s.items=[];save(s);render();}};
    document.getElementById('sh').onclick=function(){
      var sp2=spent();
      var text='Budget Pulse '+sp2.toLocaleString()+'/'+s.cap.toLocaleString()+' · 투명 예산(로컬)\n'+shareUrl();
      if(navigator.share) navigator.share({text:text,url:shareUrl()}).catch(function(){});
      else if(navigator.clipboard){navigator.clipboard.writeText(text); alert('복사됨');}
      try{legionTrack('share_peak',{})}catch(e){}
    };
    document.getElementById('add').onclick=function(){
      var n=document.getElementById('name').value||'지출', a=+document.getElementById('amt').value||0;
      if(!a)return; s.items.push({name:n,amt:a,t:Date.now()}); save(s); bumpStreak(); render(); track('add',{a:a});
      try{legionTrack('money_pipe_shown',{app:'budget'})}catch(e){}
    };
  }
  function track(e,d){try{if(window.legionTrack)legionTrack(e,d||{});}catch(x){}}
  try{
    var q=new URLSearchParams(location.search||'');
    var ref=q.get('ref');
    if(ref && ref!=='share' && ref!==kId() && !localStorage.getItem('bp_k_from')){
      localStorage.setItem('bp_k_from',ref);
      track('k_link',{from:ref});
    }
  }catch(e){}
  track('session_start');
  render();
})();
