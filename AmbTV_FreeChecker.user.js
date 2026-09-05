// ==UserScript==
// @name        AmbTV FreeChecker
// @namespace        http://tampermonkey.net
// @version        0.3
// @description        登録した動画エピソードの「無料・有料」をチェックする
// @author        AbemaTV User
// @match        https://abema.tv/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=abema.tv
// @run-at        document-idle
// @grant        none
// @updateURL        https://github.com/personwritep/AmbTV_FreeChecker/raw/main/AmbTV_FreeChecker.user.js
// @downloadURL        https://github.com/personwritep/AmbTV_FreeChecker/raw/main/AmbTV_FreeChecker.user.js
// ==/UserScript==


let KEY='ABEMA_Watchlist';
let watchList=JSON.parse(localStorage.getItem(KEY)) || [];


function checkStatus(){
    if(!window.location.pathname.includes('/video/episode/')) return null;
    let ovl=document.querySelector('.c-vod-EpisodePlayerContainer__appeal-plan-overlay');
    return ovl ? '有料' : '無料';

} // checkStatus()


let urlParams=new URLSearchParams(window.location.search);
if(urlParams.get('checker_mode')==='auto'){
    setTimeout(()=>{
        let curUrl=window.location.origin + window.location.pathname;
        let fresh=checkStatus();
        if(fresh){
            let list=JSON.parse(localStorage.getItem(KEY)) || [];
            list=list.map(item=>{
                if(item.url===curUrl){
                    item.status=fresh;
                    item.updatedAt=new Date().toLocaleTimeString(); }
                return item; });

            localStorage.setItem(KEY, JSON.stringify(list)); }

        let next=urlParams.get('next');
        if(next){
            window.location.href=decodeURIComponent(next); }
        else{
            document.body.innerHTML=
                '<div style="position: fixed; top: 0; left: 0; z-index: 100; padding: 80px; '+
                'width: 100%; height: 100%; background: #000; color: #fff; font-size: 24px; '+
                'text-align: center;">チェック完了</div>';

            setTimeout(()=>window.close(), 1500); }

    }, 2000);

    return; }



let panel=
    '<div class="fc_container">'+
    '<button class="fc_mainBtn">Free Checker</button>'+
    '<div class="fc_menu">'+
    '<button class="fc_syncBtn">登録リストの有料・無料をチェックする</button>'+
    '<button class="fc_addBtn">このページのエピソードをリストに登録</button>'+
    '<div class="fc_alreadyDiv">✅ このエピソードは登録済みです</div>'+
    '<div class="fc_listTitle"></div>'+
    '<div class="fc_listCont"></div>'+
    '</div>'+
    '<style>'+
    '.fc_container { position: fixed; top: 11px; right: 10px; z-index: 100; font-family: Meiryo; '+
    'text-align: right; } '+
    '.fc_mainBtn { position: fixed; top: 11px; right: 392px; padding: 11px 12px 9px; '+
    'font: normal 16px Meiryo; background: #222; color: #fff; border: 1px solid #444; '+
    'border-radius: 4px; cursor: pointer; } '+
    '.fc_menu { display: none; padding: 10px 12px; background: #181818; color: #fff; '+
    'border: 1px solid #444; border-radius: 4px; text-align: left; width: 380px; font-size: 16px; } '+
    '.fc_syncBtn { width: 100%; padding: 9px 12px 5px; margin-bottom: 10px; border: none; '+
    'border-radius: 4px; cursor: pointer; font-weight: bold; background: #0077ff; color: #fff; } '+
    '.fc_addBtn { width: 100%; padding: 9px 12px 5px; margin-bottom: 12px; border: none; '+
    'border-radius: 4px; cursor: pointer; font-weight: bold; background: #47a85d; color: #fff; display: none; } '+
    '.fc_alreadyDiv { width: 100%; padding: 7px 30px 5px; margin-bottom: 12px; color: #47a85d; '+
    'border: 1px solid #47a85d; border-radius: 4px; text-align: left; font-weight: bold; display: none; } '+
    '.fc_listTitle { color: #ccc; font-weight: bold; margin-bottom: 8px; font-size: 12px; } '+
    '.fc_listCont { max-height: calc(100vh - 200px); overflow-y: auto; overscroll-behavior: contain; margin-bottom: 5px; '+
    'border: 1px solid #252525; border-radius: 4px; background: #111; padding: 4px; } '+
    '.fc_itemRow { display: flex; align-items: center; justify-content: space-between; '+
    'padding: 6px 4px; border-bottom: 1px solid #222; } '+
    '.fc_itemRow a.green { color: #38a169; font-weight: bold; } '+
    '.fc_itemRow a { color: #ddd; text-decoration: none; white-space: nowrap; overflow: hidden; '+
    'text-overflow: ellipsis; width: 260px; font-size: 13px; } '+
    '.fc_statusAndDel { display: flex; align-items: center; gap: 6px; } '+
    '.fc_status { font: normal 13px/16px Meiryo; padding: 5px 4px 3px; border-radius: 4px; } '+
    '.fc_delBtn { background: none; border: none; cursor: pointer; font: normal 15px Meiryo; '+
    'padding: 4px 0 0; color: red; } '+
    '</style>'+
    '</div>';

if(!document.querySelector('.fc_container')){
    document.body.insertAdjacentHTML('beforeend', panel); }



let mainBtn=document.querySelector('.fc_mainBtn');
let menu=document.querySelector('.fc_menu');
if(mainBtn && menu){
    mainBtn.onclick=()=>{
        if(menu.style.display!='block'){
            menu.style.display='block'; }
        else{
            menu.style.display='none'; }

        watchList=JSON.parse(localStorage.getItem(KEY)) || [];
        renderMenu(); }}



function startAutoCheck(){
    if(watchList.length===0) return alert('登録作品がありません');

    let firstUrl="";
    for(let i=watchList.length-1; i>=0; i--){
        let base=watchList[i].url;
        if(i===watchList.length-1){
            firstUrl=`${base}?checker_mode=auto`; }
        else{
            firstUrl=`${base}?checker_mode=auto&next=${encodeURIComponent(firstUrl)}`; }}

    window.open(firstUrl, '_blank');

} // startAutoCheck()



function renderMenu(){
    let curUrl=window.location.origin + window.location.pathname;
    let isEp=window.location.pathname.includes('/video/episode/');
    let normUrl=curUrl.replace(/\/$/, "");
    let isReg=watchList.some(item=>item.url.replace(/\/$/, "")===normUrl);


    let syncBtn=document.querySelector('.fc_syncBtn');
    if(syncBtn){
        syncBtn.onclick=()=>{ startAutoCheck(); }}

    let addBtn=document.querySelector('.fc_addBtn');
    let alreadyDiv=document.querySelector('.fc_alreadyDiv');

    if(isEp && addBtn && alreadyDiv){
        if(!isReg){
            addBtn.style.display='block';
            alreadyDiv.style.display='none';

            addBtn.onclick=()=>{
                let titleEl=document.querySelector('h1') || document.querySelector('[class*="Title"]');
                let curTitle=titleEl ? titleEl.innerText : document.title;
                let fresh=checkStatus() || '確認中';
                watchList=JSON.parse(localStorage.getItem(KEY)) || [];
                if(!watchList.some(item=>item.url.replace(/\/$/, "")=== normUrl)){
                    watchList.push({
                        url: curUrl,
                        title: curTitle,
                        status: fresh,
                        updatedAt: new Date().toLocaleTimeString() });

                    localStorage.setItem(KEY, JSON.stringify(watchList)); }

                renderMenu(); }} // if(!isReg)
        else{
            addBtn.style.display='none';
            alreadyDiv.style.display='block'; }

    } // if(isEp && addBtn && alreadyDiv)



    let listTitle=document.querySelector('.fc_listTitle');
    if(listTitle){
        listTitle.innerText=`監視リスト (${watchList.length}件)`; }



    let listCont=document.querySelector('.fc_listCont');
    if(listCont){
        listCont.innerHTML='';

        if(watchList.length===0){
            listCont.innerHTML=
                '<span style="color: #555; font-style: italic; display: block; padding: 6px;">'+
                '登録はありません</span>'; }

        else{
            watchList.forEach((item, index)=>{

                let title=`最終更新: ${item.updatedAt || '不明'}`;
                let green_class='';
                if(item.url.replace(/\/$/, "")===normUrl){
                    green_class=' green'; }
                let title_text=`・${item.title}`.replace(/\r?\n/g, '<br>');
                let statusSpan='';
                if(item.status==='無料'){
                    statusSpan=
                        '<span class="fc_status" style="color: #fff; background: #0976cc;">無料</span>'; }
                else{
                    statusSpan=
                        '<span class="fc_status" style="color: #333; background: #aaa;">有料</span>'; }

                let list_item=
                    '<div class="fc_itemRow">'+
                    '<a class="fc_itemlink'+ green_class +'" href="'+ item.url +'" title="'+ title +'">'+
                    title_text +'</a>'+
                    '<div class="fc_statusAndDel">'+ statusSpan +
                    '<button class="fc_delBtn">✖</button>'+
                    '</div></div>';

                listCont.insertAdjacentHTML('beforeend', list_item);

                let created=listCont.lastElementChild;
                if(created){
                    let delBtn=created.querySelector('.fc_delBtn')
                    if(delBtn){
                        delBtn.onclick=()=>{
                            if(confirm(`「${item.title}」を監視対象から外しますか？`)){
                                watchList=watchList.filter(w=>w.url !==item.url);
                                localStorage.setItem(KEY, JSON.stringify(watchList));
                                renderMenu(); }}; }}

            }); // watchList.forEach((item, index)

        } // else

    } // if(listCont)

} // renderMenu()



let lastPath=window.location.pathname;
let observer=new MutationObserver(()=>{
    if(window.location.pathname !==lastPath){
        lastPath=window.location.pathname;
        let menu=document.querySelector('.fc_menu');
        if(menu && menu.style.display==='block'){
            watchList=JSON.parse(localStorage.getItem(KEY)) || [];
            renderMenu(); }}});

observer.observe(document.head, { childList: true, subtree: true });
