
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
  var catFilter=localStorage.getItem('bp_cat_filter')||'';
  function spent(){return s.items.reduce(function(a,b){return a+(+b.amt||0);},0);}
  function weekLabel(){var d=new Date(); return (d.getMonth()+1)+'월 W'+Math.ceil(d.getDate()/7);}
  function weekSpend(){
    var cut=Date.now()-7*864e5;
    return s.items.reduce(function(a,it){return a+((it.t||0)>=cut?(+it.amt||0):0);},0);
  }
  function prevWeekSpend(){
    var cut0=Date.now()-14*864e5, cut1=Date.now()-7*864e5;
    return s.items.reduce(function(a,it){var t=it.t||0; return a+(t>=cut0&&t<cut1?(+it.amt||0):0);},0);
  }
  function catTotals(){
    var m={};
    s.items.forEach(function(it){
      var n=(it.name||'기타').trim()||'기타';
      m[n]=(m[n]||0)+(+it.amt||0);
    });
    return Object.keys(m).map(function(k){return {n:k,a:m[k]};}).sort(function(a,b){return b.a-a.a;});
  }
  function exportJSON(){
    var payload={cap:s.cap,items:s.items,exportedAt:new Date().toISOString(),app:'budget-pulse'};
    var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='budget-pulse-'+dayKey(0)+'.json'; a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);},1500);
    try{legionTrack('export',{n:s.items.length})}catch(e){}
  }
  function importJSON(file){
    if(!file)return;
    var r=new FileReader();
    r.onload=function(){
      try{
        var p=JSON.parse(r.result);
        if(!p||typeof p!=='object') throw new Error('bad');
        if(typeof p.cap==='number'&&p.cap>0)s.cap=p.cap;
        if(Array.isArray(p.items))s.items=p.items.filter(function(it){return it&&(+it.amt||0)>0;}).slice(0,500);
        save(s); render(); track('import',{n:s.items.length});
      }catch(e){alert('JSON 형식을 확인해 주세요 (export 파일 권장)');}
    };
    r.readAsText(file);
  }
  function weekDays(){
    var out=[];
    for(var i=6;i>=0;i--){
      var k=dayKey(-i), sum=0;
      s.items.forEach(function(it){
        var d=new Date(it.t||0);
        var dk=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
        if(dk===k) sum+=(+it.amt||0);
      });
      out.push({k:k.slice(5),a:sum});
    }
    return out;
  }
  function monthPace(){
    var now=new Date();
    var y=now.getFullYear(), m=now.getMonth();
    var dim=new Date(y,m+1,0).getDate();
    var dom=now.getDate();
    var rem=Math.max(1,dim-dom+1);
    var mSpend=0;
    s.items.forEach(function(it){
      var d=new Date(it.t||0);
      if(d.getFullYear()===y && d.getMonth()===m) mSpend+=(+it.amt||0);
    });
    var mtdPace=Math.round(mSpend/dom);
    var proj=mtdPace*dim;
    return {dim:dim,dom:dom,rem:rem,mSpend:mSpend,mtdPace:mtdPace,proj:proj};
  }
  function recentNames(){
    var seen={}, out=[];
    for(var i=s.items.length-1;i>=0 && out.length<4;i--){
      var n=(s.items[i].name||'').trim();
      if(!n||seen[n]) continue;
      seen[n]=1; out.push({n:n,a:+s.items[i].amt||0});
    }
    return out;
  }
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
    var day=new Date().getDay()||7; var remDays=Math.max(1,8-day); var paceTarget=Math.round(left/remDays);
    var softDaily=+(localStorage.getItem('bp_soft_daily')||Math.round((s.cap||300000)/7)); var wSpend=weekSpend(); var pSpend=prevWeekSpend(); var wDelta=wSpend-pSpend; var wLeft=s.cap-wSpend;
    var today=dayKey(0); var todaySp=s.items.filter(function(it){var d=new Date(it.t||0);return dayKey(0)===(function(x){var d=new Date(x);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})(it.t||0);}).reduce(function(a,b){return a+(+b.amt||0);},0);
    var softPct=softDaily?Math.min(100,Math.round(todaySp/softDaily*100)):0;
    var wd=weekDays(); var maxD=Math.max.apply(null,wd.map(function(x){return x.a;}).concat([1]));
    var spark=wd.map(function(d){
      var h=Math.max(4,Math.round(28*(d.a/maxD)));
      return '<div style="flex:1;text-align:center"><div title="'+d.a.toLocaleString()+'" style="height:28px;display:flex;align-items:flex-end;justify-content:center"><i style="display:block;width:70%;height:'+h+'px;border-radius:3px 3px 0 0;background:'+(d.a?'#67e8f9':'#2a2438')+'"></i></div><div style="font-size:9px;opacity:.6;margin-top:2px">'+d.k.slice(3)+'</div></div>';
    }).join('');
    root.innerHTML='<div class="card field1Finance" style="font-size:11px;line-height:1.5;border-color:#67e8f955;background:#0e1620">'
      +'<b style="color:#67e8f9">투명 금융 트랙 · dual-track</b><br>'
      +'로컬 전용 기록 도구입니다. 투자 권유·수익률 약속· ent 가챠 없음. 엔터테인먼트 앱과 트랙 분리.'
      +'</div>'
      +'<div class="card"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px">'
      +'<span class="chip">'+weekLabel()+'</span>'
      +'<span class="chip">한도 <b>'+s.cap.toLocaleString()+'</b></span>'
      +'<span class="chip">사용 <b>'+pct+'%</b></span> <span class="chip">일페이스 <b>'+paceTarget.toLocaleString()+'</b></span>'
      +'<span class="chip">🔥 '+sc+'일'+(sc>=3&&ready?' · 🛡️':'')+'</span>'
      +'<span class="chip">오늘 <b>'+todaySp.toLocaleString()+'</b></span>'+'<span class="chip">일일soft <b>'+softDaily.toLocaleString()+'</b></span>'+'<span class="chip">7일 <b>'+wSpend.toLocaleString()+'</b></span>'+'<span class="chip">일평균 <b>'+Math.round(wSpend/7).toLocaleString()+'</b></span>'+'<span class="chip">전주대비 <b style="color:'+(wDelta>0?'#f87171':'#67e8f9')+'">'+(wDelta>0?'+':'')+wDelta.toLocaleString()+'</b></span>'+'<span class="chip">주잔여 <b style="color:'+(wLeft<0?'#f87171':'var(--gold)')+'">'+wLeft.toLocaleString()+'</b></span>'+(todaySp>softDaily?'<span class="chip" style="color:#f87171">⚠초과</span>':'<span class="chip">일일OK</span>')+'<span class="chip">자정 리셋 '+fomoLeft()+'</span></div>'
      +'<div class="bar"><i style="width:'+pct+'%;background:'+(pct>90?'var(--bad)':pct>70?'#fbbf24':'var(--ok)')+'"></i></div>'
      +'<div class="sub" style="margin-top:6px">일일 soft 소진 '+softPct+'%</div>'
      +'<div class="bar" style="height:5px;margin-top:4px"><i style="width:'+softPct+'%;background:'+(softPct>100?'#f87171':softPct>80?'#fbbf24':'#67e8f9')+'"></i></div>'
      +'<div>남음 <b style="color:'+(left<0?'#f87171':'var(--gold)')+'">'+(left).toLocaleString()+'</b>원 · 항목 '+s.items.length+'</div>'
      +'<div style="margin-top:10px"><div class="sub" style="margin-bottom:4px">7일 일별 지출</div><div class="row" style="align-items:flex-end;gap:2px">'+spark+'</div></div></div>'
      +'<div class="card"><label class="sub">주간 한도 수정</label><input id="cap" type="number" value="'+s.cap+'"/><button id="setCap">한도 저장</button><label class="sub">일일 소프트 한도</label><input id="soft" type="number" value="'+softDaily+'"/><button class="sec" id="setSoft">일일 저장</button></div>'
      +'<div class="card"><label class="sub">지출 추가</label><div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">'+'<button class="sec" data-q="커피|4500">커피 4.5k</button>'+'<button class="sec" data-q="교통|1500">교통 1.5k</button>'+'<button class="sec" data-q="식사|12000">식사 12k</button>'+'<button class="sec" data-q="구독|9900">구독 9.9k</button>'+(s.items.length?'<button class="sec" id="repeatLast">↩ 직전 재추가</button>':'')+recentNames().map(function(r){return '<button class="sec" data-q="'+r.n+'|'+r.a+'">↻ '+r.n+'</button>';}).join('')+'</div>'+'<input id="name" placeholder="항목 (커피, 교통…)"/><input id="amt" type="number" placeholder="금액"/><button id="add">추가</button></div>'
      +'<div class="card"><b>이번 주 기록</b>'+(catFilter?' <span class="chip" id="clrCat">필터: '+catFilter+' ×</span>':'')+' <button class="sec" id="undoLast" style="float:right;padding:6px 10px;font-size:12px">↩ 직전 취소</button><div id="list"></div>'
      +'<p class="sub" id="paceTip" style="margin-top:8px"></p><p class="sub" id="monthTip" style="margin-top:4px"></p></div>'
      +'<div class="card" id="moneyPipe" style="text-align:center;font-size:12px">'
      +'<div style="color:#67e8f9;font-weight:700;margin-bottom:6px">💎 투명 금융 루프</div>'
      +'<p class="sub" style="margin:0 0 8px">로컬 계산만 · 투자권유 아님 · 엔터 앱과 트랙 분리</p>'
      +'<a style="color:#ece8f1;margin:0 6px" href="https://hosuman08-netizen.github.io/side-hustle/?utm_source=budget&utm_medium=pipe">📒 Side Hustle</a>'
      +'<a style="color:#ece8f1;margin:0 6px" href="https://hosuman08-netizen.github.io/cost-basis/?utm_source=budget&utm_medium=pipe">🧮 Cost Basis</a>'
      +'<a style="color:#e0b552;margin:0 6px" href="https://hosuman08-netizen.github.io/legion-hub/?utm_source=budget&utm_medium=pipe">🎮 Arcade</a>'
      +'</div>'
      +'<div class="card" id="catBox"><b>카테고리 TOP</b><div id="cats" class="sub" style="margin-top:6px"></div></div>'
      +'<button id="sh" style="width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#1c1826;color:#ece8f1;font-weight:700">주간 보드 공유</button>'
      +'<button id="exportJson" style="width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#1c1826;color:#ece8f1">⬇ JSON 백업</button>'
      +'<label id="importLbl" style="display:block;width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#1c1826;color:#ece8f1;text-align:center;cursor:pointer;font-weight:600">⬆ JSON 복원<input id="importJson" type="file" accept="application/json,.json" style="display:none"/></label>'
      +'<button id="resetWeek" style="width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#1c1826;color:#ece8f1">주간 기록 초기화</button>';
    var list=document.getElementById('list');
    if(!s.items.length){
      list.innerHTML='<div class="sub" style="padding:8px 0">아직 없음 — 첫 지출을 기록하면 한도 바가 움직입니다.<br><button id="emptyAdd" style="margin-top:8px">예시 +커피 4500</button></div>';
      var eb=document.getElementById('emptyAdd');
      if(eb) eb.onclick=function(){s.items.push({name:'커피',amt:4500,t:Date.now()});save(s);bumpStreak();render();track('add',{a:4500,sample:1});};
    }else{
      var rows=s.items.map(function(it,i){return {it:it,i:i};}).reverse();
      if(catFilter) rows=rows.filter(function(r){return (r.it.name||'')===catFilter;});
      list.innerHTML=rows.slice(0,20).map(function(r){
        return '<div data-del="'+r.i+'" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2a2438;cursor:pointer"><span>'+r.it.name+' <small style="opacity:.5">탭삭제</small></span><b>'+(+r.it.amt).toLocaleString()+'</b></div>';
      }).join('')||'<div class="sub">이 카테고리 항목 없음</div>';
      Array.prototype.forEach.call(list.querySelectorAll('[data-del]'),function(row){
        row.onclick=function(){var i=+row.getAttribute('data-del');s.items.splice(i,1);save(s);render();track('del');};
      });
    }
    var ub=document.getElementById('undoLast');
    if(ub) ub.onclick=function(){if(!s.items.length)return;s.items.pop();save(s);render();track('undo');};
    var clr=document.getElementById('clrCat');
    if(clr) clr.onclick=function(){catFilter=''; localStorage.removeItem('bp_cat_filter'); render();};
    var cats=document.getElementById('cats');
    if(cats){
      var tops=catTotals().slice(0,5);
      cats.innerHTML=tops.length?tops.map(function(c){
        var p=sp?Math.round(c.a/sp*100):0;
        var on=catFilter===c.n;
        return '<div data-cat="'+c.n+'" style="display:flex;justify-content:space-between;padding:4px 0;cursor:pointer;border-radius:6px'+(on?';background:#67e8f922':'')+'"><span>'+c.n+(on?' ✓':'')+'</span><b>'+c.a.toLocaleString()+' ('+p+'%)</b></div>';
      }).join('')+'<p class="sub" style="margin-top:4px">탭하면 해당 카테고리만 필터</p>':'항목 추가 시 자동 집계';
      Array.prototype.forEach.call(cats.querySelectorAll('[data-cat]'),function(row){
        row.onclick=function(){
          var n=row.getAttribute('data-cat');
          catFilter=(catFilter===n)?'':n;
          if(catFilter) localStorage.setItem('bp_cat_filter',catFilter); else localStorage.removeItem('bp_cat_filter');
          render(); track('cat_filter',{n:catFilter||'all'});
        };
      });
    }
    var pt=document.getElementById('paceTip');
    if(pt){
      var day=new Date().getDay()||7; // 1-7 Mon-Sun-ish
      var leftDays=Math.max(1,8-day);
      var pace=Math.round(Math.max(0,left)/leftDays);
      var dayPace=Math.round(s.cap/7);
      var over=todaySp>dayPace;
      var weekAvg=Math.round(wd.reduce(function(a,b){return a+b.a;},0)/7);
      var tops=catTotals();
      var top1=tops.length?tops[0]:null;
      var vs=weekAvg?(todaySp>weekAvg?' · 오늘>7일평균':' · 오늘≤7일평균'):'';
      pt.textContent='남은 일수 기준 일일 여유 ≈ '+pace.toLocaleString()+'원 · 오늘 '+todaySp.toLocaleString()+'원 · 7일 평균 '+weekAvg.toLocaleString()+'원'+vs+(over?' · ⚠ 일평균('+dayPace.toLocaleString()+') 초과':' · 일평균 페이스 OK')+(top1?' · 최대항목 '+top1.n+' '+top1.a.toLocaleString()+'원':'');
    }
    var mt=document.getElementById('monthTip');
    if(mt){
      var mp=monthPace();
      mt.textContent='월누적 '+mp.mSpend.toLocaleString()+'원 · 일평균 '+mp.mtdPace.toLocaleString()+' · 월말 추정 '+mp.proj.toLocaleString()+'원 · 남은 '+mp.rem+'일 · 한도 대비 월추정 '+(s.cap?Math.round(mp.proj/s.cap*100):0)+'%';
    }
    var ej=document.getElementById('exportJson');
    if(ej) ej.onclick=exportJSON;
    var ij=document.getElementById('importJson');
    if(ij) ij.onchange=function(){if(ij.files&&ij.files[0])importJSON(ij.files[0]); ij.value='';};
    document.getElementById('setCap').onclick=function(){s.cap=+document.getElementById('cap').value||0;save(s);render();track('cap');};
    var ss=document.getElementById('setSoft');
    if(ss) ss.onclick=function(){var v=+document.getElementById('soft').value||0;localStorage.setItem('bp_soft_daily',String(v));render();track('soft',{v:v});};
    var rl=document.getElementById('repeatLast');
    if(rl) rl.onclick=function(){
      if(!s.items.length)return;
      var last=s.items[s.items.length-1];
      s.items.push({name:last.name,amt:+last.amt||0,t:Date.now()});
      save(s); bumpStreak(); render(); track('add',{a:+last.amt||0,repeat:1});
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-q]'),function(b){
      b.onclick=function(){var p=b.getAttribute('data-q').split('|');s.items.push({name:p[0],amt:+p[1],t:Date.now()});save(s);bumpStreak();render();track('add',{a:+p[1],quick:1});};
    });

    document.getElementById('resetWeek').onclick=function(){if(confirm('이번 주 기록 지울까?')){s.items=[];save(s);render();}};
    document.getElementById('sh').onclick=function(){
      var sp2=spent();
      var wd2=weekDays();
      var weekAvg2=Math.round(wd2.reduce(function(a,b){return a+b.a;},0)/7);
      var tops2=catTotals();
      var topN=tops2.length?tops2[0].n+' '+tops2[0].a.toLocaleString()+'원':'—';
      var text='Budget Pulse '+sp2.toLocaleString()+'/'+s.cap.toLocaleString()
        +' · 7일평균 '+weekAvg2.toLocaleString()+'원 · TOP '+topN
        +'\n투명 금융(로컬 전용 · 투자권유 아님)\n'+shareUrl();
      if(navigator.share) navigator.share({text:text,url:shareUrl()}).catch(function(){});
      else if(navigator.clipboard){navigator.clipboard.writeText(text); alert('복사됨');}
      try{legionTrack('share_peak',{top:tops2.length?tops2[0].n:''})}catch(e){}
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

/* LEGION_WAVE_33_share_counter */
document.addEventListener('click',function(ev){try{var el=ev.target;if(!el)return;var tx=(el.textContent||'')+(el.id||'');if(/share|copy/i.test(tx)||/\uacf5\uc720|\ubcf5\uc0ac/.test(tx)){localStorage.setItem('lw_p39_budget_p_share_counter',String((+(localStorage.getItem('lw_p39_budget_p_share_counter')||0))+1));}}catch(e){}},true);
})();
/* LEGION_WAVE_78_pipe_ensure */ /* pipe already present wave 78 */
