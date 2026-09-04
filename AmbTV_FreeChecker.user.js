// ==UserScript==
// @name        AmbTV FreeChecker
// @namespace        http://tampermonkey.net
// @version        0.2
// @description        登録した動画エピソードの「無料・有料」をチェックする
// @author        AbemaTV User
// @match        https://abema.tv/*
// @run-at        document-idle
// @grant        none
// @updateURL        https://github.com/personwritep/AmbTV_FreeChecker/raw/main/AmbTV_FreeChecker.user.js
// @downloadURL        https://github.com/personwritep/AmbTV_FreeChecker/raw/main/AmbTV_FreeChecker.user.js
// ==/UserScript==

(function() {
    'use strict';
    const KEY = 'ABEMA_Watchlist';
    let watchList = JSON.parse(localStorage.getItem(KEY)) || [];

    function checkStatus() {
        if (!window.location.pathname.includes('/video/episode/')) return null;
        const ovl = document.querySelector('.c-vod-EpisodePlayerContainer__appeal-plan-overlay');
        const btn = document.querySelector('[class*="appeal-plan"]', '[class*="Premium"]');
        const coin = document.querySelector('[class*="coin-ticket"]');
        return (ovl || btn || coin) ? '有料' : '無料';
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checker_mode') === 'auto') {
        setTimeout(() => {
            const curUrl = window.location.origin + window.location.pathname;
            const fresh = checkStatus();
            if (fresh) {
                let list = JSON.parse(localStorage.getItem(KEY)) || [];
                list = list.map(item => {
                    if (item.url === curUrl) {
                        item.status = fresh;
                        item.updatedAt = new Date().toLocaleTimeString();
                    }
                    return item;
                });
                localStorage.setItem(KEY, JSON.stringify(list));
            }
            const next = urlParams.get('next');
            if (next) {
                window.location.href = decodeURIComponent(next);
            } else {
                document.body.innerHTML =
                    '<div style="position:fixed; top:0; left:0; width:100%; height:100%; '+
                    'background:#000; color:#fff; z-index:100; font-size:24px; padding:50px; '+
                    'text-align:center;">チェック完了</div>';
                setTimeout(() => window.close(), 1500);
            }
        }, 2000);
        return;
    }

    const container = document.createElement('div');
    container.style =
        'position: fixed; top: 11px; right: 10px; z-index: 100; font-family: Meiryo; '+
        'text-align: right;';
    document.body.appendChild(container);

    const mainBtn = document.createElement('button');
    mainBtn.innerText = 'Free Checker';
    mainBtn.style =
        'position: fixed; top: 11px; right: 392px; padding: 11px 12px 9px; background: #222; '+
        'font: normal 16px Meiryo; color: #fff; border: 1px solid #444; border-radius: 4px; '+
        'cursor: pointer; ';
    container.appendChild(mainBtn);

    const menu = document.createElement('div');
    menu.style =
        'display: none; padding: 10px 12px; background: #181818; color: #fff; '+
        'border: 1px solid #444; border-radius: 4px; text-align: left; width: 380px; font-size: 16px;';
    container.appendChild(menu);

    mainBtn.onclick = () => {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        watchList = JSON.parse(localStorage.getItem(KEY)) || [];
        renderMenu();
    };

    function startAutoCheck() {
        if (watchList.length === 0) return alert('登録作品がありません。');
        let firstUrl = "";
        for (let i = watchList.length - 1; i >= 0; i--) {
            const base = watchList[i].url;
            if (i === watchList.length - 1) {
                firstUrl = `${base}?checker_mode=auto`;
            } else {
                firstUrl = `${base}?checker_mode=auto&next=${encodeURIComponent(firstUrl)}`;
            }
        }
        window.open(firstUrl, '_blank');
    }

    function renderMenu() {
        menu.innerHTML = '';
        const curUrl = window.location.origin + window.location.pathname;
        const isEp = window.location.pathname.includes('/video/episode/');
        const normUrl = curUrl.replace(/\/$/, "");
        const isReg = watchList.some(item => item.url.replace(/\/$/, "") === normUrl);

        const syncBtn = document.createElement('button');
        syncBtn.style =
            'width: 100%; padding: 9px 12px 5px; margin-bottom: 10px; border: none; '+
            'border-radius: 4px; cursor: pointer; font-weight: bold; background: #0077ff; color: #fff;';
        syncBtn.innerText = '登録リストの有料・無料をチェックする';
        syncBtn.onclick = startAutoCheck;
        menu.appendChild(syncBtn);

        if (isEp) {
            if (!isReg) {
                const addBtn = document.createElement('button');
                addBtn.style =
                    'width: 100%; padding: 9px 12px 5px; margin-bottom: 12px; border: none; '+
                    'border-radius: 4px; cursor: pointer; font-weight: bold; '+
                    'background: #47a85d; color: #fff;';
                addBtn.innerText = 'このページのエピソードをリストに登録';
                addBtn.onclick = () => {
                    const titleEl = document.querySelector('h1') || document.querySelector('[class*="Title"]');
                    const curTitle = titleEl ? titleEl.innerText : document.title;
                    const fresh = checkStatus() || '確認中';
                    watchList = JSON.parse(localStorage.getItem(KEY)) || [];
                    if (!watchList.some(item => item.url.replace(/\/$/, "") === normUrl)) {
                        watchList.push({
                            url: curUrl,
                            title: curTitle,
                            status: fresh,
                            updatedAt: new Date().toLocaleTimeString()
                        });
                        localStorage.setItem(KEY, JSON.stringify(watchList));
                    }
                    renderMenu();
                };
                menu.appendChild(addBtn);
            } else {
                const alreadyDiv = document.createElement('div');
                alreadyDiv.style =
                    'width: 100%; padding: 7px 30px 5px; margin-bottom: 12px; '+
                    'border: 1px solid #47a85d; border-radius: 4px; text-align: left; '+
                    'font-weight: bold; color: #47a85d; ';
                alreadyDiv.innerText = '✅ このエピソードは登録済みです';
                menu.appendChild(alreadyDiv);
            }
        }

        const listTitle = document.createElement('div');
        listTitle.innerText = `監視リスト (${watchList.length}件)`;
        listTitle.style = 'color: #ccc; font-weight: bold; margin-bottom: 8px; font-size: 12px;';
        menu.appendChild(listTitle);

        const listCont = document.createElement('div');
        listCont.style =
            'max-height: 220px; overflow-y: auto; margin-bottom: 5px; '+
            'border: 1px solid #252525; border-radius: 4px; background: #111; padding: 4px;';

        if (watchList.length === 0) {
            listCont.innerHTML =
                '<span style="color: #555; font-style: italic; display: block; padding: 6px;">'+
                '登録はありません</span>';
        } else {
            watchList.forEach((item, index) => {
                const itemRow = document.createElement('div');
                itemRow.style =
                    'display: flex; align-items: center; justify-content: space-between; '+
                    'padding: 6px 4px; border-bottom: 1px solid #222;';
                if (index === watchList.length - 1) itemRow.style.borderBottom = 'none';

                const link = document.createElement('a');
                link.href = item.url;
                link.innerText = `・${item.title}`;
                link.style =
                    'color: #ddd; text-decoration: none; white-space: nowrap; overflow: hidden; '+
                    'text-overflow: ellipsis; width: 260px; font-size: 13px;';
                link.title = `最終更新: ${item.updatedAt || '不明'}`;

                if (item.url.replace(/\/$/, "") === normUrl) {
                    link.style.color = '#38a169';
                    link.style.fontWeight = 'bold';
                }

                const statusAndDel = document.createElement('div');
                statusAndDel.style = 'display: flex; align-items: center; gap: 6px;';

                const statusSpan = document.createElement('span');
                statusSpan.style =
                    'font: normal 13px/16px Meiryo; padding: 5px 4px 3px; border-radius: 4px;';
                if (item.status === '無料') {
                    statusSpan.innerText = '無料';
                    statusSpan.style.background = '#0976cc';
                    statusSpan.style.color = '#fff';
                } else {
                    statusSpan.innerText = '有料';
                    statusSpan.style.background = '#333';
                    statusSpan.style.color = '#aaa';
                }

                const delBtn = document.createElement('button');
                delBtn.innerText = '✖';
                delBtn.style =
                    'background: none; border: none; cursor: pointer; font: normal 15px Meiryo; '+
                    'padding: 4px 0 0; color: red;';
                delBtn.onclick = () => {
                    if (confirm(`「${item.title}」を監視対象から外しますか？`)) {
                        watchList = watchList.filter(w => w.url !== item.url);
                        localStorage.setItem(KEY, JSON.stringify(watchList));
                        renderMenu();
                    }
                };

                statusAndDel.appendChild(statusSpan);
                statusAndDel.appendChild(delBtn);
                itemRow.appendChild(link);
                itemRow.appendChild(statusAndDel);
                listCont.appendChild(itemRow);
            });
        }
        menu.appendChild(listCont);
    }

    let lastPath = window.location.pathname;
    const observer = new MutationObserver(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            if (menu.style.display === 'block') {
                watchList = JSON.parse(localStorage.getItem(KEY)) || [];
                renderMenu();
            }
        }
    });
    observer.observe(document.head, { childList: true, subtree: true });
})();
