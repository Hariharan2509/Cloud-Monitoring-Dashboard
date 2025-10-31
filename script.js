(function(){
  const energyChart = document.getElementById('energyChart');
  const carbonChart = document.getElementById('carbonChart');
  const ctxE = energyChart.getContext('2d');
  const ctxC = carbonChart.getContext('2d');

  let running = true;
  const samples = 40;
  const data = { energy:[], carbon:[], util:[], timestamps:[] };

  function pushSample(){
    const t = new Date();
    const lastE = data.energy.length ? data.energy[data.energy.length-1] : 120;
    const e = Math.max(30, Math.round(lastE + (Math.random()-0.4)*8));
    const c = Math.max(10, Math.round((e*0.45) + (Math.random()-0.5)*20));
    const u = Math.max(10, Math.round(50 + (Math.random()-0.5)*30));
    data.energy.push(e); data.carbon.push(c); data.util.push(u); data.timestamps.push(t.toLocaleTimeString());
    if(data.energy.length > samples){
      data.energy.shift(); data.carbon.shift(); data.util.shift(); data.timestamps.shift();
    }
  }

  function drawLine(ctx, arr, opts={}){
    const w = ctx.canvas.width; const h = ctx.canvas.height;
    ctx.clearRect(0,0,w,h);
    const max = Math.max(...arr)*1.15; const min = Math.min(...arr)*0.85;
    ctx.lineWidth = 2; ctx.beginPath();
    arr.forEach((v,i)=>{
      const x = (i/(arr.length-1||1))*(w-40)+20;
      const y = h - ((v-min)/(max-min||1))*(h-34) - 20;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.strokeStyle = opts.stroke || '#0ea5a4';
    ctx.stroke();
    arr.forEach((v,i)=>{
      const x = (i/(arr.length-1||1))*(w-40)+20;
      const y = h - ((v-min)/(max-min||1))*(h-34) - 20;
      ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2);
      ctx.fillStyle = opts.stroke || '#0ea5a4'; ctx.fill();
    });
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif';
    ctx.fillText(data.timestamps[0]||'', 6, h-6);
    ctx.fillText(data.timestamps[data.timestamps.length-1]||'', w-90, h-6);
  }

  function renderMetrics(){
    document.getElementById('energy').textContent = (data.energy.at(-1) || '--') + ' kWh';
    document.getElementById('carbon').textContent = (data.carbon.at(-1) || '--') + ' gCO₂eq';
    document.getElementById('util').textContent = (data.util[Math.floor(data.util.length/2)] || '--') + ' %';
    const s = document.getElementById('suggestion');
    const lastUtil = data.util.at(-1) || 0;
    if(lastUtil > 75) s.textContent = 'High utilization — consider scaling up based on demand to avoid spinning extra VMs.';
    else if(lastUtil < 35) s.textContent = 'Low utilization — investigate right-sizing and autosuspend for idle instances.';
    else s.textContent = 'Utilization looks healthy. Keep monitoring and set budgets for energy/carbon.';
  }

  function populateTable(){
    const tbody = document.querySelector('#consumersTable tbody');
    tbody.innerHTML = '';
    const names = ['compute-frontend','db-primary','batch-worker','analytics-1','cache','search'];
    for(let i=0;i<6;i++){
      const e = Math.round((data.energy.at(-1) || 100)*(1 - i*0.08) + Math.random()*30);
      const c = Math.round(e*0.42);
      const row = document.createElement('tr');
      row.innerHTML = `<td>${names[i]}</td><td>asia-south</td><td>${e}</td><td>${c}</td>`;
      tbody.appendChild(row);
    }
  }

  function exportCSV(){
    let csv = 'timestamp,energy_kwh,carbon_g,util_percent\\n';
    for(let i=0;i<data.timestamps.length;i++){
      csv += `${data.timestamps[i]},${data.energy[i]},${data.carbon[i]},${data.util[i]}\\n`;
    }
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'telemetry.csv';
    a.click(); URL.revokeObjectURL(url);
  }

  function tick(){
    if(running) pushSample();
    drawLine(ctxE, data.energy, {stroke:'#0ea5a4'});
    drawLine(ctxC, data.carbon, {stroke:'#38bdf8'});
    renderMetrics(); populateTable();
  }

  for(let i=0;i<18;i++) pushSample();
  tick();
  setInterval(tick, 2000);

  document.getElementById('toggleStream').addEventListener('click', ()=>{
    running = !running;
    document.getElementById('toggleStream').textContent = running? 'Pause' : 'Resume';
  });
  document.getElementById('exportCsv').addEventListener('click', exportCSV);

  document.getElementById('themeToggle').addEventListener('change', e=>{
    if(e.target.checked) document.documentElement.setAttribute('data-theme','dark');
    else document.documentElement.removeAttribute('data-theme');
  });

  function resizeCanvas(){
    [energyChart,carbonChart].forEach(c=>{
      const ratio = window.devicePixelRatio || 1;
      const w = c.clientWidth; const h = c.clientHeight;
      c.width = Math.floor(w * ratio); c.height = Math.floor(h * ratio);
      const ctx = c.getContext('2d');
      ctx.setTransform(ratio,0,0,ratio,0,0);
    });
    drawLine(ctxE, data.energy, {stroke:'#0ea5a4'});
    drawLine(ctxC, data.carbon, {stroke:'#38bdf8'});
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
})();
