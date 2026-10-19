/* Export wrapper for the Wave Portrait Lab study. Renderer shader adapted from
   Cursor Compile New York; original rights retained. No new license is granted. */
function buildPortraitHTML(snapshot) {
  const payload = JSON.stringify(snapshot).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const script = '(' + portraitWidget.toString() + ')(' + payload + ');';
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wave portrait</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}body{display:grid;place-items:center}canvas{display:block;max-width:100%;max-height:100%;outline-offset:-4px}canvas:focus-visible{outline:2px solid currentColor}</style></head><body>\n<!-- Standalone wave portrait. No dependencies or network requests. Press R to replay.\nRendering shader adapted from Cursor Compile New York: https://cursor.com/compile/new-york . Original rights retained. -->\n<canvas tabindex="0" aria-label="Interactive wave portrait. Move over the portrait to focus the waves. Press R to replay the reveal."></canvas>\n<script>' + script + '</scr' + 'ipt>\n</body></html>';
}

function portraitWidget(config) {
  'use strict';
  // Color and interaction settings can be edited in the configuration below.
  // Wave structure is precomputed from the portrait and chosen adjustments.
  // The original source photo is not needed to render this exported portrait.
  const t = config.layout, data = new Uint8Array(t.textureData);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let canvas = document.querySelector('canvas'), gl = null, ctx = null, program, locations = {};
  let raf = 0, reveal = !reducedMotion.matches, start = performance.now();
  const mouse = { y: 0, strength: 0 }, target = { y: 0, strength: 0 };
  document.body.style.background = config.settings.paper;
  document.body.style.color = config.settings.ink;
  try {
    gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    const compile = (type, code) => {
      const shader = gl.createShader(type); gl.shaderSource(shader, code); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, config.shaders.vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, config.shaders.fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program); gl.bindVertexArray(gl.createVertexArray());
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
    for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, t.dataWidth, t.rowCount, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    for (const name of ['u_data','u_renderSize','u_rowCount','u_rowStep','u_startY','u_colStep','u_strokeWidth','u_maxAmp','u_dataWidth','u_colors','u_colorCount','u_ampScales','u_mousePos','u_mouseRadius','u_mouseStrength']) locations[name] = gl.getUniformLocation(program, name);
  } catch (error) {
    gl = null;
    const replacement = canvas.cloneNode(); canvas.replaceWith(replacement); canvas = replacement;
    ctx = canvas.getContext('2d');
  }
  canvas.width = t.rw; canvas.height = t.rh;
  if (!gl && !ctx) {
    canvas.replaceWith(document.createTextNode('This browser cannot render the portrait. Please use a browser with Canvas support.'));
    return;
  }
  if (gl) gl.viewport(0, 0, t.rw, t.rh);
  const clamp = value => Math.max(0, Math.min(1, value));
  function draw() {
    const scales = new Float32Array(256).fill(1);
    if (reveal) {
      const progress = (performance.now() - start) / 1500;
      for (let row = 0; row < t.rowCount; row++) {
        const x = clamp((progress - row / Math.max(1, t.rowCount - 1) * .5) / .5);
        scales[row] = x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3) / 2;
      }
      if (progress >= 1) reveal = false;
    }
    if (gl) {
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(program);
      gl.uniform1i(locations.u_data,0); gl.uniform2f(locations.u_renderSize,t.rw,t.rh);
      for (const [name,value] of Object.entries({u_rowCount:t.rowCount,u_rowStep:t.rowStep,u_startY:t.startY,u_colStep:t.colStep,u_strokeWidth:t.sw,u_maxAmp:t.maxAmp})) gl.uniform1f(locations[name],value);
      gl.uniform1i(locations.u_dataWidth,t.dataWidth);
      const ink = config.settings.ink;
      gl.uniform3fv(locations.u_colors,new Float32Array([parseInt(ink.slice(1,3),16)/255,parseInt(ink.slice(3,5),16)/255,parseInt(ink.slice(5,7),16)/255]));
      gl.uniform1i(locations.u_colorCount,1); gl.uniform1fv(locations.u_ampScales,scales);
      gl.uniform2f(locations.u_mousePos,0,mouse.y);
      gl.uniform1f(locations.u_mouseRadius,t.rh*config.settings.hoverRadius/100);
      gl.uniform1f(locations.u_mouseStrength,mouse.strength); gl.drawArrays(gl.TRIANGLES,0,3);
      return;
    }
    // Canvas fallback mirrors the studio's geometric approximation.
    ctx.clearRect(0,0,t.rw,t.rh); ctx.strokeStyle=config.settings.ink; ctx.lineJoin='round'; ctx.lineCap='round';
    for(let row=0;row<t.rowCount;row++) {
      const rowY=t.startY+row*t.rowStep, rowOffset=row%2?t.colStep*.5:0;
      const radius=t.rh*config.settings.hoverRadius/100, d=clamp(Math.abs(rowY-mouse.y)/radius);
      const hover=(1-d*d*(3-2*d))*mouse.strength;
      ctx.lineWidth=t.sw*(1+.5*hover); ctx.beginPath(); let pen=false;
      for(let x=0;x<=t.rw;x++) {
        const adj=x+rowOffset, cell=Math.min(t.dataWidth-1,Math.floor(adj/t.colStep)), fraction=clamp(adj/t.colStep-cell);
        const i=(row*t.dataWidth+cell)*4, waves=data[i+2];
        if(!waves){pen=false;continue;}
        const next=(row*t.dataWidth+Math.min(cell+1,t.dataWidth-1))*4;
        const signal=(data[i]*(1-fraction)+data[next]*fraction)/255, groupStart=cell-data[i+1];
        const phase=(x-(groupStart*t.colStep-rowOffset))/(data[i+3]*t.colStep)*waves*Math.PI*2;
        const amp=Math.pow(signal,1+.1*hover)*t.maxAmp*scales[row]*(1+.1*hover), y=rowY+Math.sin(phase)*amp;
        if(!pen){ctx.moveTo(x,y);pen=true;}else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
  }
  function tick(){
    raf=0;const ease=reducedMotion.matches?1:.15;
    mouse.y+=(target.y-mouse.y)*ease;mouse.strength+=(target.strength-mouse.strength)*ease;draw();
    if(reveal||Math.abs(mouse.y-target.y)>.5||Math.abs(mouse.strength-target.strength)>.005)wake();
  }
  function wake(){if(!raf)raf=requestAnimationFrame(tick);}
  function fit(){
    const width=document.documentElement.clientWidth, height=document.documentElement.clientHeight, ratio=t.rw/t.rh;
    const h=Math.min(height,width/ratio);canvas.style.width=h*ratio+'px';canvas.style.height=h+'px';
  }
  function focus(e){
    if(!config.settings.hoverEnabled)return;
    const rect=canvas.getBoundingClientRect();target.y=(e.clientY-rect.top)*t.rh/rect.height;target.strength=1;
    if(mouse.strength<.001)mouse.y=target.y;wake();
  }
  function leave(){target.strength=0;wake();}
  canvas.addEventListener('pointermove',focus);canvas.addEventListener('pointerdown',focus);
  canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointercancel',leave);
  canvas.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')leave();});
  document.addEventListener('keydown',e=>{if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.toLowerCase()==='r'){reveal=!reducedMotion.matches;start=performance.now();wake();}});
  new ResizeObserver(fit).observe(document.documentElement);
  fit();draw();wake();
}
