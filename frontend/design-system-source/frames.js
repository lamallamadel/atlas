// Device frame helpers — usage: AtlasFrames.devices({ ios:'<html>', android:'<html>', webMobile:'<html>', webDesktop:'<html>' })
window.AtlasFrames = (function(){
  function statusBar(dark){
    const c = dark? '#fff' : '#000';
    return `<div class="statusbar" style="color:${c};">
      <span>9:41</span><span></span>
      <span style="display:inline-flex; gap:5px; align-items:center;">
        <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="6.5" width="2.6" height="4.5" rx=".7" fill="${c}"/><rect x="4" y="4" width="2.6" height="7" rx=".7" fill="${c}"/><rect x="8" y="2" width="2.6" height="9" rx=".7" fill="${c}"/><rect x="12" y="0" width="2.6" height="11" rx=".7" fill="${c}"/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11"><rect x=".5" y=".5" width="18" height="10" rx="2.5" stroke="${c}" stroke-opacity=".4" fill="none"/><rect x="2" y="2" width="15" height="7" rx="1.4" fill="${c}"/></svg>
      </span>
    </div>`;
  }
  function ios(html, opts={}){
    return `<div class="frame-ios">
      <div class="frame-screen" data-platform="ios">
        ${statusBar(opts.darkChrome)}
        <div class="island"></div>
        <div class="frame-content">${html}</div>
        <div class="ios-home"></div>
      </div>
    </div>`;
  }
  function android(html, opts={}){
    return `<div class="frame-android">
      <div class="frame-screen" data-platform="android">
        ${statusBar(opts.darkChrome)}
        <div class="android-pill"></div>
        <div class="frame-content">${html}</div>
        <div class="android-nav"><span></span><span></span><span></span></div>
      </div>
    </div>`;
  }
  function webMobile(html){
    return `<div style="width:380px; height:800px; border-radius:18px; overflow:hidden; background:var(--bg); border:1px solid var(--divider); box-shadow:var(--shadow-md); position:relative;">
      <div style="height:32px; background:var(--surface); border-bottom:1px solid var(--divider); display:flex; align-items:center; gap:6px; padding:0 12px; font-size:11px; color:var(--text-muted);">
        <span style="width:8px;height:8px;border-radius:4px;background:#ed6a5e;"></span>
        <span style="width:8px;height:8px;border-radius:4px;background:#f5bf4f;"></span>
        <span style="width:8px;height:8px;border-radius:4px;background:#62c554;"></span>
        <span style="margin-left:14px;">atlasia.app</span>
      </div>
      <div style="height:calc(100% - 32px); overflow:auto;">${html}</div>
    </div>`;
  }
  function webDesktop(html){
    return `<div style="width:100%; max-width:1180px; height:760px; border-radius:14px; overflow:hidden; background:var(--bg); border:1px solid var(--divider); box-shadow:var(--shadow-md);">
      <div style="height:36px; background:var(--surface); border-bottom:1px solid var(--divider); display:flex; align-items:center; gap:8px; padding:0 14px; font-size:12px; color:var(--text-muted);">
        <span style="width:10px;height:10px;border-radius:5px;background:#ed6a5e;"></span>
        <span style="width:10px;height:10px;border-radius:5px;background:#f5bf4f;"></span>
        <span style="width:10px;height:10px;border-radius:5px;background:#62c554;"></span>
        <span style="margin-left:18px;">atlasia.app</span>
      </div>
      <div style="height:calc(100% - 36px); overflow:auto;">${html}</div>
    </div>`;
  }
  function devices({ios:i, android:a, webMobile:wm, webDesktop:wd, eyebrows={}}){
    const lab = (k, def) => `<div class="label-eyebrow" style="margin-bottom:8px;">${eyebrows[k] || def}</div>`;
    return `
      <div style="margin-bottom:32px;">
        ${lab('webDesktop','Web · desktop')}
        ${webDesktop(wd)}
      </div>
      <div style="display:flex; gap:32px; flex-wrap:wrap;">
        <div>${lab('ios','iOS')}${ios(i)}</div>
        <div>${lab('android','Android')}${android(a)}</div>
        <div>${lab('webMobile','Web · mobile')}${webMobile(wm)}</div>
      </div>
    `;
  }
  return { ios, android, webMobile, webDesktop, devices };
})();
