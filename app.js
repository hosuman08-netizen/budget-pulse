(function(){
  var el=document.getElementById('tool');
  el.innerHTML='<label class="sub">이번 주 한도</label><input id="cap" type="number" placeholder="예: 100000"/><label class="sub">이번 주 쓴 돈</label><input id="spent" type="number" placeholder="예: 42000"/><button id="go">맥박 보기</button><div id="out" style="margin-top:10px"></div>';
  document.getElementById('go').onclick=function(){
    var c=+document.getElementById('cap').value||0, s=+document.getElementById('spent').value||0;
    var left=c-s, pct=c?Math.round(s/c*100):0;
    document.getElementById('out').innerHTML='사용 '+pct+'% · 남음 '+left.toLocaleString()+(left<0?' ⚠️ 초과':'');
    try{localStorage.setItem('bp',JSON.stringify({c,s,t:Date.now()}));legionTrack('activate',{pct:pct})}catch(e){}
  };
  try{legionTrack('session_start',{})}catch(e){}
})();
