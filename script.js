(() => {
  const version = "v2.4.1";

  const consol = {
    log: (message, title="Core", colour="#FF6961") => { console.log(`%c(${title}) %c${message}`, `color:${colour};font-weight:bold`, "") },
    warn: (message, title="Core") => { console.warn(`%c(${title}) %c${message}`, `color:#FFD699;font-weight:bold`, "") },
    error: (message, title="Core") => { console.error(`%c(${title}) %c${message}`, `color:#FFB3B3;font-weight:bold`, "") }
  }

  const iconDB = {
    dbName: 'vbcIntranet',
    storeName: 'customButtonIcons',
    db: null,
    initPromise: null,
    init: async function() {
      if (this.db) return this.db;
      if (this.initPromise) return this.initPromise;
      
      this.initPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(this.dbName, 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => { 
          this.db = req.result; 
          this.initPromise = null;
          resolve(this.db); 
        };
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'cid' });
          }
        };
      });
      
      try {
        await this.initPromise;
        return this.db;
      } catch (e) {
        this.initPromise = null;
        throw e;
      }
    },
    set: async function(cid, dataUrl) {
      try {
        const db = await this.init();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(this.storeName, 'readwrite');
          const store = tx.objectStore(this.storeName);
          const req = store.put({ cid, dataUrl, timestamp: Date.now() });
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve(req.result);
        });
      } catch (e) { 
        consol.error(`Failed to store icon ${cid}`, 'IndexedDB');
        throw e;
      }
    },
    get: async function(cid) {
      try {
        const db = await this.init();
        return new Promise((resolve) => {
          const tx = db.transaction(this.storeName, 'readonly');
          const store = tx.objectStore(this.storeName);
          const req = store.get(cid);
          req.onerror = () => resolve(null);
          req.onsuccess = () => resolve(req.result?.dataUrl || null);
        });
      } catch (e) { 
        consol.error(`Failed to retrieve icon ${cid}`, 'IndexedDB');
        return null;
      }
    },
    delete: async function(cid) {
      try {
        const db = await this.init();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(this.storeName, 'readwrite');
          const store = tx.objectStore(this.storeName);
          const req = store.delete(cid);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve();
        });
      } catch (e) { 
        consol.error(`Failed to delete icon ${cid}`, 'IndexedDB');
        throw e;
      }
    },
    deleteUnused: async function(usedCids) {
      try {
        const db = await this.init();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(this.storeName, 'readwrite');
          const store = tx.objectStore(this.storeName);
          const req = store.openCursor();
          req.onerror = () => reject(req.error);
          req.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
              if (!usedCids.includes(cursor.key)) {
                store.delete(cursor.key);
              }
              cursor.continue();
            } else {
              resolve();
            }
          };
        });
      } catch (e) { 
        consol.error(`Failed to delete unused icons`, 'IndexedDB');
        throw e;
      }
    }
  };
  
  document.addEventListener('mousedown', e => { if (e.button == 1) { e.preventDefault() } });

  function updateClock() {
    let now = new Date();
    document.getElementById("clock").innerText = `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()]}, ${now.getDate()}${(!(String(now.getDate())[0] == "1" && String(now.getDate()).length == 2)&&[1,2,3].includes(now.getDate() % 10))?['st','nd','rd'][(now.getDate() % 10)-1]:'th'} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][now.getMonth()]} ${now.getFullYear()}, ${[0,12].includes(now.getHours()) ? '12' : now.getHours() > 11 ? now.getHours()-12 : now.getHours()}:${now.getMinutes() < 10 ? "0"+now.getMinutes() : now.getMinutes()}:${now.getSeconds() < 10 ? "0"+now.getSeconds() : now.getSeconds()} ${now.getHours() > 11 ? 'PM' : 'AM'}`;
    setTimeout(updateClock, 1000 - now.getMilliseconds());
  }
  updateClock();
  
  const escapeStack = {
    items: [],
    push(name, closeFunc) {
      this.items.push({ name, closeFunc });
      this.updateListener();
    },
    pop(name) {
      this.items = this.items.filter(item => item.name !== name);
      this.updateListener();
    },
    updateListener() {
      document.removeEventListener('keydown', this.globalEscapeHandler);
      if (this.items.length > 0) {
        document.addEventListener('keydown', this.globalEscapeHandler);
      }
    },
    globalEscapeHandler: (e) => {
      if (e.key === 'Escape' && escapeStack.items.length > 0) {
        e.preventDefault();
        const topItem = escapeStack.items[escapeStack.items.length - 1];
        topItem.closeFunc();
      }
    }
  };
  
  const contentDiv = document.getElementById('content');
  const searchContainer = document.querySelector('.search-container');
  const searchOverlay = document.querySelector('.search-overlay');
  const searchBar = document.querySelector('.search-bar');
  const searchInput = searchBar.querySelector('#searchInput');
  let searchOpen = false;
  let canSearch = true;
  const searchEngines = {
    bing: 'b ',
    duckduckgo: 'd '
  };
  const searchQuery = {
    bing: 'search?q=',
    duckduckgo: '?q= '
  };
  
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !searchOpen) {
      return;
    } else if (event.key === 'Escape' && searchOpen) {
      closeSearchBar();
    } else if (/^[a-zA-Z0-9]$/.test(event.key) && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      openSearchBar(event.key);
    }
  });
  
  searchOverlay.addEventListener('click', () => {
    closeSearchBar();
  });
  
  searchBar.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  
  function openSearchBar(key) {
    if (!searchOpen && canSearch) {
      searchContainer.style = '';
      setTimeout(() => {
        searchBar.classList.add('active');
        contentDiv.classList.add('hide');
        searchOverlay.classList.add('active');
        searchBar.querySelector('input').focus();
        searchInput.value = key;
        searchOpen = true;
      }, 1);
    }
  }
  
  function closeSearchBar() {
    searchBar.classList.remove('active');
    contentDiv.classList.remove('hide');
    searchOverlay.classList.remove('active');
    searchBar.querySelector('input').blur();
    searchBar.querySelector('input').value = '';
    setTimeout(() => {
      searchContainer.style.display = 'none';
      searchOpen = false;
    }, 300);
  }
  
  searchInput.addEventListener('keydown', (event) => {
    if (event.code === 'Enter') {
      const searchTerm = searchInput.value.trim();
      const prefix = Object.entries(searchEngines).find(([_, value]) => searchTerm.startsWith(value));
      if (prefix) {
        const [engine, prefixLength] = prefix;
        const queryType = Object.entries(searchQuery).find(([key]) => key === engine) ? searchQuery[engine] : "search?q=";
        const searchTermWithoutPrefix = searchTerm.substr(prefixLength.length);
        closeSearchBar();
        const searchUrl = `https://www.${engine}.com/${queryType}${encodeURIComponent(searchTermWithoutPrefix)}`;
        window.open(searchUrl, '_blank');
      } else {
        var pat = /^((https?|ftp):\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/;
        if (pat.test(searchTerm)) {
          closeSearchBar();
          const url = /^https?:\/\//i.test(searchTerm) ? searchTerm : `https://${searchTerm}`;
          window.open(url, '_blank');
        } else {
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
          closeSearchBar();
          window.open(searchUrl, '_blank');
        }
      }
    }
  });
  
  let isOnline = navigator.onLine;
  const ni = document.getElementById('no-internet');
  function showOfflineIndicator() {
    ni.style.display = 'flex';
    setTimeout(() => ni.classList.add('visible'),10);
  }
  if (!isOnline) {
    consol.warn("Running in offline mode", "Network");
    showOfflineIndicator();
  }
  
  window.addEventListener('online', () => {
    consol.log("Reconnected", "Network");
    isOnline = true;

    ni.classList.add('reconnected');
    const steps = [[2000, () => ni.classList.add('hide')], [400, () => { ni.classList.remove('hide', 'reconnected', 'visible'); ni.style.display = ''; }]];
    steps.reduce((delay, [wait, fn]) => delay.then(() => new Promise(res => setTimeout(() => { fn(); res(); }, wait))), Promise.resolve());

    if (calActive) {
      document.getElementById("classSync").innerHTML = '<i class="fa-solid fa-magnifying-glass-arrows-rotate"></i><p style="font-size:8px;">Fetching...</p>';
      document.getElementById("classSync").parentElement.classList.add('cs-icon');
      document.getElementById('sp-nc').style.display = 'none';
      document.getElementById('sp-err').style.display = 'grid';
      document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-magnifying-glass-arrows-rotate"></i> Fetching class data...</div>`;
      clearTimeout(t);
      classSyncLock = false;
      ClassSync();
      calActiveText.textContent = "✓ Active";
      calActiveText.setAttribute("active", "");
      calActiveText.removeAttribute("error");
    }
  });
  window.addEventListener('offline', () => {
    consol.warn("Running in offline mode", "Network");
    isOnline = false;
    showOfflineIndicator();
    if (calActive) {
      document.getElementById("classSync").innerHTML = last_events.next ? `<i class="fa-solid fa-arrow-right-to-line"></i> ${last_events.next.summary}${last_events.next.location ? `<p style="font-size:12px;margin: 5px 0 !important;"><i class="fa-solid fa-location-dot"></i> ${last_events.next.location}</p>` : ''}<p style="font-size:8px;">${last_events.next.start.slice(-2) == last_events.next.end.slice(-2) ? last_events.next.start.slice(0, -3) : last_events.next.start}-${last_events.next.end}${last_events.next.split && !last_events.next.locationSplit ? ` (split at ${parseDate(last_events.next.splitTime)})` : ``}</p><p style="font-size:8px;margin-top:5px !important;color:#ff746c;"><i class="fa-solid fa-cloud-question"></i> ${parseDatetime(last_events.timeChecked)}</p>` : `<i class="fa-regular fa-calendar-minus"></i><p style="font-size:8px;margin-top:5px !important;color:#ff746c;"><i class="fa-solid fa-cloud-question"></i> ${parseDatetime(last_events.timeChecked)}</p>`;
      last_events.next ? document.getElementById("classSync").parentElement.classList.remove('cs-icon') : document.getElementById("classSync").parentElement.classList.add('cs-icon');
      document.getElementById('sp-err').style.display = 'grid';
      document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-cloud-question"></i> Network disconnected.</div><div class="spti">Class data last updated at ${parseDatetime(last_events.timeChecked)}.</div>`;
      document.getElementById('sp-nc').style.display = last_events.next ? 'none' : 'flex';
      document.getElementById('sp-nc').innerHTML = `<div class="spt"><i class="fa-regular fa-calendar-minus"></i> ${last_events.today.length ? `No more classes today` : `No classes today`}</div>`;
      calActiveText.textContent = "⚠ Network disconnected";
      calActiveText.setAttribute("error", "");
      calActiveText.removeAttribute("active");
    }
  });
  let calActive = false;
  
  const subButton = document.getElementById("cal-submit");
  const inputText = document.getElementById("cal-input");
  const devButton = document.getElementById("cal-deactivate");
  const incorrectText = document.getElementById("cal-incorrect");
  const calActiveText = document.getElementById("classSyncActive");
  
  subButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (!isOnline) {
      incorrectText.innerHTML = "Network disconnected. Please reconnect and try again.";
      return;
    }
    if (inputText.value.trim() != "") {
      if (!formatCalLink(inputText.value, true).startsWith('viewbank-vic.compass.education/download/sharedCalendar.aspx')) {
        errors.new({error: "Link failed test", url: inputText.value.trim()}, "ClassSync-Setup");
        consol.error("Link failed test", "ClassSync-Setup");
        incorrectText.innerHTML = "Did you input the correct link? Visit the guide for help <b><a href='/tutorials/ClassSync.pdf' target='_blank' style='color: #c94545;'>here</a></b>.";
        return;
      }
      fetch(formatCalLink(inputText.value))
        .then(response => {
          if (!response.ok) {
            incorrectText.textContent = "Did you input the correct link? Visit the guide for help <b><a href='/tutorials/ClassSync.pdf' target='_blank' style='color: #c94545;'>here</a></b>.";
            throw new Error(`Failed to fetch calendar. Status: ${response.status}`);
          } else {
            calActive = true;
            incorrectText.textContent = "";
            calActiveText.textContent = "✓ Active";
            calActiveText.setAttribute("active", "");
            calActiveText.removeAttribute("error");
            devButton.setAttribute("visible", "");
            subButton.setAttribute("hidden", "");
            inputText.setAttribute("hidden", "");
            const existing = jsonCheck(localStorage.getItem('ClassSync')) ? JSON.parse(localStorage.getItem('ClassSync')) : {};
            localStorage.setItem('ClassSync', JSON.stringify({...existing, cal: formatCalLink(inputText.value)}));
            document.getElementById("header-classSync").style.display = 'block';
            document.getElementById("classSync").innerHTML = '<i class="fa-solid fa-magnifying-glass-arrows-rotate"></i><p style="font-size:8px;">Fetching...</p>';
            document.getElementById("classSync").parentElement.classList.add('cs-icon');
            document.getElementById('sp-nc').style.display = 'none';
            document.getElementById('sp-err').style.display = 'grid';
            document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-magnifying-glass-arrows-rotate"></i> Fetching class data...</div>`;
            ClassSync();
            initSneakPeekMap();
          }
          return response.text();
        })
        .catch(error => {
          errors.new({error: JSON.stringify(error, Object.getOwnPropertyNames(error)), url: inputText.value.trim()}, "ClassSync-Setup");
          consol.error("Link error", "ClassSync-Setup");
          incorrectText.innerHTML = "Did you input the correct link? Visit the guide for help <b><a href='/tutorials/ClassSync.pdf' target='_blank' style='color: #c94545;'>here</a></b>.";
        });
    } else {
      incorrectText.innerHTML = "Please enter a link. Visit the guide for help <b><a href='/tutorials/ClassSync.pdf' target='_blank' style='color: #c94545;'>here</a></b>.";
    }
  });
  
  inputText.addEventListener("keydown", function (e) {
    if (e.code === "Enter") subButton.click();
  });
  
  devButton.addEventListener('click', (event) => {
    event.preventDefault();
    calActive = false;
    localStorage.removeItem('ClassSync');
    last_events = {};
    calActiveText.textContent = "✗ Not Active";
    calActiveText.removeAttribute("active");
    calActiveText.removeAttribute("error");
    devButton.removeAttribute("visible");
    subButton.removeAttribute("hidden");
    inputText.removeAttribute("hidden");
    document.getElementById("header-classSync").style.display = 'none';
  });
  
  let last_events = {};
  let errors = {
    _t: 0, _l: [],
    new(error, type) {
      if (!error || !type) return new Error('Missing information');
      this._t += 1;
      this._l.push({error: error, type: type, date: new Date().toLocaleString(), dateRaw: new Date()});
    },
    saveSession() {
      if (!this._l.length) return;
      if (jsonCheck(localStorage.getItem("session-error"))) {
        s_e = JSON.parse(localStorage.getItem("session-error"));
        s_e.push({type: "SESSION", date: new Date().toLocaleString(), count: this._t, list: this._l, dateRaw: new Date()});
        localStorage.setItem("session-error", JSON.stringify(s_e));
      } else {
        localStorage.setItem("session-error", JSON.stringify([{type: "SESSION", date: new Date().toLocaleString(), count: this._t, list: this._l, dateRaw: new Date()}]));
      }
      this._t = 0;
      this._l = [];
    },
    countOfType(type) {
      if (!type) return new Error('Missing information');
      let t = 0;
      this._l.forEach(e=>{
        if (e.type == type) t++;
      });
      return t;
    },
    saveSessionOfType(type) {
      if (!type) return new Error('Missing information');
      let l = [];
      let tagged = [];
      this._l.forEach(e=>{if (e.type == type) {l.push(e);tagged.push(e)}});
      tagged.forEach(e=>{this._l.splice(this._l.indexOf(e), 1)});
      if (!l.length) return;
      if (jsonCheck(localStorage.getItem("session-error"))) {
        s_e = JSON.parse(localStorage.getItem("session-error"));
        s_e.push({type, date: new Date().toLocaleString(), count: l.length, list: l, dateRaw: new Date()});
        localStorage.setItem("session-error", JSON.stringify(s_e));
      } else {
        localStorage.setItem("session-error", JSON.stringify([{type, date: new Date().toLocaleString(), count: l.length, list: l, dateRaw: new Date()}]));
      }
    },
    init() {
      if (!jsonCheck(localStorage.getItem("session-error"))) return;
      const sessions = JSON.parse(localStorage.getItem("session-error"));
      const now = Date.now();
      const filtered = sessions.filter(s => !s.dateRaw || (now - new Date(s.dateRaw).getTime()) < 7*24*60*60*1000);
      if (filtered.length !== sessions.length) {filtered.length ? localStorage.setItem("session-error", JSON.stringify(filtered)) : localStorage.removeItem("session-error");}
    },
    get count() {return this._t;},
    get list() {return this._l;},
  }

  addEventListener('beforeunload', function (event) {
    errors.saveSession();
  });

  errors.init();

  function jsonCheck(json) {
    try {
      JSON.parse(json);
    } catch {
      return false;
    }
    if (Object.is(JSON.parse(json), null)) {
      return false;
    } else {
      return true;
    }
  }

  let classSyncLock = false;

  function ClassSync() {
    if (classSyncLock) return;
    classSyncLock = true;
    if (!getCalUrl()) {
      document.getElementById("classSync").innerText = "";
      classSyncLock = false;
      return null;
    }
    if (!isOnline) {
      if (!last_events.joined) {
        document.getElementById("classSync").innerHTML = `<i class="fa-solid fa-cloud-slash"></i><p style="font-size:8px;">Offline</p>`;
        document.getElementById("classSync").parentElement.classList.add('cs-icon');
        document.getElementById('sp-err').style.display = 'grid';
        document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-cloud-slash"></i> Offline</div><div class="spti">No cached data available.</div>`;
        document.getElementById('sp-nc').style.display = 'none';
        calActiveText.textContent = "\u26A0 Network disconnected";
        calActiveText.setAttribute("error", "");
        calActiveText.removeAttribute("active");
        t = setTimeout(() => { classSyncLock = false; ClassSync(); }, (60 - new Date().getSeconds()) * 1000);
        return;
      }
      let events = last_events;
      let endTime = new Date();
      endTime.setHours(23, 59, 59, 0);
      let startTime = new Date();
      startTime.setHours(0, 0, 0, 0);
      let tagged = [];
      events.joined.forEach(e=>{
        if (e.endraw.getTime() <= new Date().getTime()) {
          tagged.push(e);
        } else if (e.startraw.getTime() <= new Date().getTime() && e.endraw.getTime() > new Date().getTime()) {
          e.now = true;
        }
      });
      tagged.forEach(e=>{
        events.joined.splice(events.joined.indexOf(e), 1);
      });

      events.joined.forEach(e => { e.next = false; });
      events.next = events.joined.find(e => e.startraw.getTime() > new Date().getTime()) ?? null;
      if (events.next) events.next.next = true;

      if (events.next && events.next.start && events.next.startraw.getTime() <= endTime.getTime()) {
        document.getElementById("classSync").innerHTML = last_events.next ? `<i class="fa-solid fa-arrow-right-to-line"></i> ${last_events.next.summary}${last_events.next.location ? `<p style="font-size:12px;margin: 5px 0 !important;"><i class="fa-solid fa-location-dot"></i> ${last_events.next.location}</p>` : ''}<p style="font-size:8px;">${last_events.next.start.slice(-2) == last_events.next.end.slice(-2) ? last_events.next.start.slice(0, -3) : last_events.next.start}-${last_events.next.end}${last_events.next.split && !last_events.next.locationSplit ? ` (split at ${parseDate(last_events.next.splitTime)})` : ``}</p><p style="font-size:8px;margin-top:5px !important;color:#ff746c;"><i class="fa-solid fa-cloud-question"></i> ${parseDatetime(last_events.timeChecked)}</p>` : `<i class="fa-regular fa-calendar-minus"></i><p style="font-size:8px;margin-top:5px !important;color:#ff746c;"><i class="fa-solid fa-cloud-question"></i> ${parseDatetime(last_events.timeChecked)}</p>`;
        last_events.next ? document.getElementById("classSync").parentElement.classList.remove('cs-icon') : document.getElementById("classSync").parentElement.classList.add('cs-icon');
        document.getElementById('sp-err').style.display = 'grid';
        document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-cloud-question"></i> Network disconnected.</div><div class="spti">Class data last updated at ${parseDatetime(last_events.timeChecked)}.</div>`;
        document.getElementById('sp-nc').style.display = last_events.next ? 'none' : 'flex';
        document.getElementById('sp-nc').innerHTML = `<div class="spt"><i class="fa-regular fa-calendar-minus"></i> ${last_events.today.length ? `No more classes today` : `No classes today`}</div>`;
        Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
          if (!['sp-nc','sp-err'].includes(c.id)) {
            c.remove();
          }
        });
        events.joined.forEach(e=>{
          document.getElementById('sp-c').appendChild(createSneakPeekCard(e));
        });
        reapplyCardSelection();
      } else {
        document.getElementById("classSync").innerHTML = `<i class="fa-regular fa-calendar-minus"></i><p style="font-size:8px;margin-top:5px !important;color:#ff746c;"><i class="fa-solid fa-cloud-question"></i> ${parseDatetime(last_events.timeChecked)}</p>`;
        document.getElementById("classSync").parentElement.classList.add('cs-icon');
        document.getElementById('sp-err').style.display = 'grid';
        document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-cloud-question"></i> Network disconnected.</div><div class="spti">Class data last updated at ${parseDatetime(last_events.timeChecked)}.</div>`;
        document.getElementById('sp-nc').style.display = 'flex';
        document.getElementById('sp-nc').innerHTML = `<div class="spt"><i class="fa-regular fa-calendar-minus"></i> ${last_events.today.length ? `No more classes today` : `No classes today`}</div>`;
        Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
          if (!['sp-nc','sp-err'].includes(c.id)) {
            c.remove();
          }
        });
      }
      t = setTimeout(() => { classSyncLock = false; ClassSync(); }, (60 - new Date().getSeconds()) * 1000);
      return;
    };
    if (!formatCalLink(getCalUrl(), true).startsWith('viewbank-vic.compass.education/download/sharedCalendar.aspx')) {
      errors.new({error: "Link failed test", url: getCalUrl()}, "ClassSync");
      consol.error("Link failed test", "ClassSync");
      document.getElementById("classSync").innerHTML = `<i class="fa-solid fa-cloud-xmark"></i><p style="font-size:8px;">Link Error</p>`;
      document.getElementById("classSync").parentElement.classList.add('cs-icon');
      document.getElementById('sp-nc').style.display = 'none';
      document.getElementById('sp-err').style.display = 'grid';
      document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-cloud-xmark"></i> The link provided did not work.</div><div class="spti">Please check your link and try again.</div>`;
      calActiveText.textContent = "⚠ Error";
      calActiveText.setAttribute("error", "");
      calActiveText.removeAttribute("active");
      classSyncLock = false;
      return null;
    }
    let sts = '';
    fetch(getCalUrl())
      .then(response => {
        if (!response.ok) {
          sts = response.status;
          throw new Error(`Failed to fetch calendar. Status: ${response.status}`);
        }
        return response.text();
      })
      .then(fileContents => {
        calActiveText.textContent = "✓ Active";
        calActiveText.setAttribute("active", "");
        calActiveText.removeAttribute("error");
        const lines = fileContents.split('\n');
        var endTime = new Date();
        endTime.setHours(23, 59, 59, 0);
        var startTime = new Date();
        startTime.setHours(0, 0, 0, 0);
        let events = {next: null, all: [], today: [], joined: [], timeChecked: new Date()};

        function getEvents() {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
  
            if (line.startsWith('BEGIN:VEVENT')) {
              eventData = {};
            } else if (line.startsWith('END:VEVENT')) {
              events.all.push(eventData);
              if (eventData.startraw.getTime() >= startTime.getTime() && eventData.startraw.getTime() <= endTime.getTime()) events.today.push(eventData);
            } else if (line.startsWith('SUMMARY:')) {
              const summary = line.substring(8);
              eventData.summary = summary.trim();
            } else if (line.startsWith('DTSTART:')) {
              const startDateString = line.substring(8);
              const startDate = parseICSDateTimeString(startDateString);
              eventDate = startDate;
              eventData.start = parseDate(startDate);
              eventData.startraw = startDate;
              eventData.startDate = startDate.toLocaleString();
            } else if (line.startsWith('DTEND:')) {
              const endDateString = line.substring(6);
              const endDate = parseICSDateTimeString(endDateString);
              eventData.end = parseDate(endDate);
              eventData.endraw = endDate;
              eventData.endDate = endDate.toLocaleString();
              eventData.split = false;
            } else if (line.startsWith('LOCATION:')) {
              const location = line.substring(9);
              eventData.location = location.trim();
            }
          }
          events.today.sort((a, b) => a.startraw - b.startraw);
        }

        function joinEvents() {
          let working = [];
          events.today.forEach(e=>{
            let matched = false;
            for (let i = working.length - 1; i >= 0; i--) {
              const prev = working[i];
              if (prev.combined) continue;
              if (prev.endraw.getTime() == e.startraw.getTime() && prev.summary == e.summary) {
                if (e.location != prev.location) {
                  prev.locationA = prev.location;
                  prev.locationB = e.location;
                  prev.splitTime = e.startraw;
                  prev.split = true;
                  prev.locationSplit = true;
                  prev.location += ` <i class="fa-solid fa-arrow-right"></i> ${e.location}`;
                }
                prev.endraw = e.endraw;
                prev.end = parseDate(e.endraw);
                prev.endDate = e.endraw.toLocaleString();
                prev.combined = true;
                e.tagged = true;
                matched = true;
                break;
              } else if (prev.startraw.getTime() == e.endraw.getTime() && prev.summary == e.summary) {
                if (e.location != prev.location) {
                  prev.locationA = e.location;
                  prev.locationB = prev.location;
                  prev.splitTime = e.endraw;
                  prev.split = true;
                  prev.locationSplit = true;
                  prev.location += ` <i class="fa-solid fa-arrow-right"></i> ${e.location}`;
                }
                prev.startraw = e.startraw;
                prev.start = parseDate(e.startraw);
                prev.startDate = e.startraw.toLocaleString();
                prev.combined = true;
                e.tagged = true;
                matched = true;
                break;
              } else if (prev.endraw.getTime() == e.startraw.getTime()) {
                if (!(prev.startraw.getTime() < new Date().getTime() && e.startraw.getTime() < new Date().getTime())) {
                  if (e.location != prev.location) {
                    prev.summaryA = prev.summary;
                    prev.summaryB = e.summary;
                    prev.summary = `${prev.summary} and ${e.summary}`;
                    prev.locationA = prev.location;
                    prev.locationB = e.location;
                    prev.location = `${prev.location} <i class="fa-solid fa-arrow-right"></i> ${e.location}`;
                  } else {
                    prev.summary = `${prev.summary} and ${e.summary}`;
                  }
                  prev.endraw = e.endraw;
                  prev.end = parseDate(e.endraw);
                  prev.endDate = e.endraw.toLocaleString();
                  prev.split = true;
                  prev.splitTime = e.startraw;
                  prev.combined = true;
                  e.tagged = true;
                  matched = true;
                }
                break;
              } else if (prev.startraw.getTime() == e.endraw.getTime()) {
                if (e.location != prev.location) {
                  prev.summaryA = e.summary;
                  prev.summaryB = prev.summary;
                  prev.summary = `${prev.summary} and ${e.summary}`;
                  prev.locationA = e.location;
                  prev.locationB = prev.location;
                  prev.location = `${prev.location} <i class="fa-solid fa-arrow-right"></i> ${e.location}`;
                } else {
                  prev.summary = `${prev.summary} and ${e.summary}`;
                }
                prev.startraw = e.startraw;
                prev.start = parseDate(e.startraw);
                prev.startDate = e.startraw.toLocaleString();
                prev.split = true;
                prev.splitTime = e.endraw;
                prev.combined = true;
                e.tagged = true;
                matched = true;
                break;
              }
            }
            if (!matched) working.push(e);
          });
          working.forEach(e => events.joined.push(e));

          let tagged = [];
          events.joined.forEach(e=>{
            if (e.endraw.getTime() <= new Date().getTime()) {
              tagged.push(e);
            } else if (e.startraw.getTime() <= new Date().getTime() && e.endraw.getTime() > new Date().getTime()) {
              e.now = true;
            }
          });
          tagged.forEach(e=>{
            events.joined.splice(events.joined.indexOf(e), 1);
          });
        }

        getEvents();
        joinEvents();
        events.joined.forEach(e => { e.next = false; });
        events.next = events.joined.find(e => e.startraw.getTime() > new Date().getTime()) ?? null;
        if (events.next) events.next.next = true;
        
        if ((events.next && events.next.start && events.next.startraw.getTime() <= endTime.getTime())) {
          document.getElementById("classSync").innerHTML = `<i class="fa-solid fa-arrow-right-to-line"></i> ${events.next.summary}${events.next.location ? `<p style="font-size:12px;margin: 5px 0 !important;"><i class="fa-solid fa-location-dot"></i> ${events.next.location}</p>` : ''}<p style="font-size:8px;">${events.next.start.slice(-2) == events.next.end.slice(-2) ? events.next.start.slice(0, -3) : events.next.start}-${events.next.end}${events.next.split && !events.next.locationSplit ? ` (split at ${parseDate(events.next.splitTime)})` : ``}</p>`;
          document.getElementById("classSync").parentElement.classList.remove('cs-icon');
          document.getElementById('sp-err').style.display = 'none';
          document.getElementById('sp-nc').style.display = 'none';
          Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
            if (!['sp-nc','sp-err'].includes(c.id)) {
              c.remove();
            }
          });
          events.joined.forEach(e=>{
            document.getElementById('sp-c').appendChild(createSneakPeekCard(e));
          });
          reapplyCardSelection();
        } else {
          document.getElementById("classSync").innerHTML = '<i class="fa-regular fa-calendar-minus"></i>';
          document.getElementById('classSync').parentElement.classList.add('cs-icon');
          document.getElementById('sp-err').style.display = 'none';
          document.getElementById('sp-nc').style.display = events.joined.find(e=>e.now) ? 'none' : 'flex';
          Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
            if (!['sp-nc','sp-err'].includes(c.id)) {
              c.remove();
            }
          });
          events.joined.forEach(e=>{
            document.getElementById('sp-c').appendChild(createSneakPeekCard(e));
          });
          reapplyCardSelection();
          document.getElementById('sp-nc').innerHTML = events.joined.find(e=>e.now) ? '' : `<div class="spt"><i class="fa-regular fa-calendar-minus"></i> ${events.today.length ? 'No more classes for today' : 'No classes today'}</div>`;
        }
        last_events = events;
        saveClassSyncData(events);
        updateRoomClasses(events.joined);
        errors.saveSessionOfType("ClassSync");
        t = setTimeout(() => { classSyncLock = false; ClassSync(); }, (60 - new Date().getSeconds()) * 1000);
      })
      .catch(error => {
        errors.new(JSON.stringify(error, Object.getOwnPropertyNames(error)), "ClassSync");
        consol.error(error, "ClassSync");
        document.getElementById("classSync").innerHTML = `<i class="fa-solid ${sts != 404 ? 'fa-cloud-exclamation' : 'fa-cloud-xmark'}"></i><p style="font-size:8px;">${sts != 404 ? `Retrying...` : `Link Error`}</p>`;
        document.getElementById("classSync").parentElement.classList.add('cs-icon');
        document.getElementById('sp-nc').style.display = 'none';
        document.getElementById('sp-err').style.display = 'grid';
        document.getElementById('sp-err').innerHTML = `<div class="spt">${sts != 404 ? `<i class="fa-solid fa-cloud-exclamation"></i> An error has occured` : `<i class="fa-solid fa-cloud-xmark"></i> Link did not work.`}</div><div class="spti">${sts != 404 ? `Retrying...` : `Please check your link and try again.`}</div>`;
        calActiveText.textContent = "⚠ Error";
        calActiveText.setAttribute("error", "");
        calActiveText.removeAttribute("active");
        if (errors.countOfType("ClassSync") < 5) {
          consol.error("ClassSync running again", "ClassSync");
          setTimeout(() => { classSyncLock = false; ClassSync(); }, 100);
        } else {
          consol.error("ClassSync running again next cycle", "ClassSync");
          updateErrorTimer(60 - new Date().getSeconds());
          t = setTimeout(() => { classSyncLock = false; ClassSync(); }, (60 - new Date().getSeconds()) * 1000);
        }
      });
  }
  let etThread = 0;
  let etActive = false;
  
  function updateErrorTimer(time, ft = true, thread = -1, ts = false) {
    if (etActive && thread !== etThread) return;
    if (!ft && document.getElementById("classSync").innerHTML != `<i class="fa-solid fa-cloud-exclamation"></i><p style="font-size:8px;">Retry: ${time + 1}s</p>`) {
      etThread++;
      etActive = false;
      return;
    }
    thread = ts ? thread : etThread;
    ts, etActive = true;
    document.getElementById("classSync").innerHTML = `<i class="fa-solid fa-cloud-exclamation"></i><p style="font-size:8px;">Retry: ${time}s</p>`;
    document.getElementById("classSync").parentElement.classList.add('cs-icon');
    document.getElementById('sp-err').style.display = 'grid';
    document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-cloud-exclamation"></i> An error occured.</div><div class="spti">Retrying in ${time}s...</div>`;
    document.getElementById('sp-nc').style.display = 'none';

    if (time > 0) {
      ut = setTimeout(() => {
        updateErrorTimer(time - 1, false, thread, ts);
      }, 1000 - new Date().getMilliseconds());
    } else {
      etThread++;
      etActive = false;
    }
  }
  let ut, t = setTimeout(function() {return}, 60000);
  clearTimeout(ut);
  clearTimeout(t);

  function formatCalLink(link, noscheme = false) {
    if (link.startsWith('webcal://')) {
      return (noscheme ? '' : 'https://') + link.slice(9);
    } else if (link.startsWith('http://')) {
      return (noscheme ? '' : 'https://') + link.slice(7);
    } else if (link.startsWith('https://') && noscheme) {
      return link.slice(8);
    }
    return link;
  }
  
  function parseDate(date) {
    if (!(date instanceof Date)) throw new Error('Invalid date, received ' + typeof date);
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}).startsWith('00') ? "12" + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}).substring(2) : date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}).replace(/^0+/, '');
  }

  function parseDatetime(date) {
    if (!(date instanceof Date)) throw new Error('Invalid date, received ' + typeof date);
    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
    const time = parseDate(date);
    if (sameDay) return time;
    const d = date.getDate();
    const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][date.getMonth()];
    return `${d} ${mon}, ${time}`;
  }
  
  function parseICSDateTimeString(dateTimeString) {
    if (typeof dateTimeString != 'string') throw new Error('Invalid date string, received ' + dateTimeString);
    const y = parseInt(dateTimeString.substring(0, 4), 10);
    const mo = parseInt(dateTimeString.substring(4, 6), 10) - 1;
    const d = parseInt(dateTimeString.substring(6, 8), 10);
    const h = parseInt(dateTimeString.substring(9, 11), 10) + ((new Date().getTimezoneOffset()*-1)/60);
    const mi = parseInt(dateTimeString.substring(11, 13), 10);
    
    const date = new Date(y, mo, d, h, mi);
    return date;
  }

  function serializeCSEvents(events) {
    function ser(e) {
      const s = {...e};
      if (s.startraw instanceof Date) s.startraw = s.startraw.toISOString();
      if (s.endraw instanceof Date) s.endraw = s.endraw.toISOString();
      if (s.splitTime instanceof Date) s.splitTime = s.splitTime.toISOString();
      return s;
    }
    return {
      joined: (events.joined || []).map(ser),
      today: (events.today || []).map(ser),
      timeChecked: events.timeChecked instanceof Date ? events.timeChecked.toISOString() : null
    };
  }

  function deserializeCSEvents(data) {
    function deser(e) {
      const d = {...e};
      if (typeof d.startraw === 'string') d.startraw = new Date(d.startraw);
      if (typeof d.endraw === 'string') d.endraw = new Date(d.endraw);
      if (typeof d.splitTime === 'string') d.splitTime = new Date(d.splitTime);
      return d;
    }
    return {
      next: null,
      all: [],
      joined: (data.joined || []).map(deser),
      today: (data.today || []).map(deser),
      timeChecked: data.timeChecked ? new Date(data.timeChecked) : new Date()
    };
  }

  function saveClassSyncData(events) {
    const cal = getCalUrl();
    if (!cal) return;
    try {
      localStorage.setItem('ClassSync', JSON.stringify({cal, data: serializeCSEvents(events)}));
    } catch(e) {
      consol.error('Failed to save ClassSync cache', 'ClassSync');
    }
  }

  function loadClassSyncData() {
    if (!jsonCheck(localStorage.getItem('ClassSync'))) return null;
    try {
      const saved = JSON.parse(localStorage.getItem('ClassSync'));
      if (!saved.data || !saved.data.timeChecked) return null;
      const savedDate = new Date(saved.data.timeChecked);
      const today = new Date();
      if (savedDate.getFullYear() !== today.getFullYear() ||
          savedDate.getMonth() !== today.getMonth() ||
          savedDate.getDate() !== today.getDate()) return null;
      return deserializeCSEvents(saved.data);
    } catch(e) {
      return null;
    }
  }

  function getCalUrl() {
    if (!jsonCheck(localStorage.getItem('ClassSync'))) return null;
    return JSON.parse(localStorage.getItem('ClassSync')).cal ?? null;
  }

  // legacy
  if (localStorage.getItem('compass-cal')) {
    const legacyUrl = localStorage.getItem('compass-cal');
    const existing = jsonCheck(localStorage.getItem('ClassSync')) ? JSON.parse(localStorage.getItem('ClassSync')) : {};
    localStorage.setItem('ClassSync', JSON.stringify({...existing, cal: legacyUrl}));
    localStorage.removeItem('compass-cal');
  }
  
  let spMapReady = false;
  let spActiveRoom = null;
  let spPopoverOpen = false;
  let spPopoverDisabled = false;
  let spFilterActive = false;
  let spHighlightedRooms = new Set();
  let spRoomToClasses = {};
  let spMapReset = null;
  const spKnownRooms = ['LIB', 'WBC', 'VCEC', 'GYM', 'A09', 'A08', 'A07', 'A05', 'A04', 'A03', 'A02', 'A01', 'C07', 'C06', 'C05', 'C04', 'C03', 'C02', 'C01', 'G13', 'G12', 'G11', 'G10', 'G09', 'G08', 'G07', 'G06', 'G05', 'G04', 'G03', 'G02', 'G01', 'GM7', 'GM6', 'GM5', 'GM4', 'GM3', 'GM2', 'GM1', 'J12', 'J11', 'J10', 'J09', 'J08', 'J07', 'J06', 'J05', 'J04', 'J03', 'J02', 'J01', 'PAC', 'MPR', 'THT', 'R26', 'R25', 'R24', 'R23', 'R22', 'R21', 'R20', 'R19', 'R18', 'R17', 'R16', 'R15', 'R14', 'R13', 'R12', 'R11', 'R10', 'R09', 'R08', 'R07', 'R06', 'R05', 'R04', 'R03', 'R02', 'R01'];
  const spBlockAccentRgb = {
    A: '3, 253, 72',
    C: '130, 214, 180',
    R: '251, 236, 13',
    GYM: '217, 168, 136',
    CENTRAL: '137, 139, 216',
    PAC: '138, 201, 218',
    GM: '255, 142, 102',
    G: '1, 197, 245',
    J: '218, 137, 213'
  };

  function getBlockKeyForRoom(roomId) {
    if (!roomId) return null;
    const normalized = String(roomId).trim().toUpperCase();
    if (normalized.startsWith('GYM')) return 'GYM';
    if (normalized.startsWith('PAC') || normalized.startsWith('MPR') || normalized.startsWith('THT')) return 'PAC';
    if (normalized === 'VCEC' || normalized === 'WBC' || normalized === 'LIB') return 'CENTRAL';
    if (normalized.startsWith('GM')) return 'GM';
    if (normalized.startsWith('A')) return 'A';
    if (normalized.startsWith('C')) return 'C';
    if (normalized.startsWith('R')) return 'R';
    if (normalized.startsWith('G')) return 'G';
    if (normalized.startsWith('J')) return 'J';
    return null;
  }

  function getAccentForRoomIds(roomIds = []) {
    const ids = Array.isArray(roomIds) ? roomIds : [roomIds];
    for (const id of ids) {
      const blockKey = getBlockKeyForRoom(id);
      if (blockKey && spBlockAccentRgb[blockKey]) return spBlockAccentRgb[blockKey];
    }
    return '100, 200, 255';
  }

  function getAccentPairForRoomIds(roomIds = []) {
    const ids = Array.isArray(roomIds) ? roomIds : [roomIds];
    const accents = [];
    for (const id of ids) {
      const blockKey = getBlockKeyForRoom(id);
      const accent = blockKey ? spBlockAccentRgb[blockKey] : null;
      if (accent && !accents.includes(accent)) accents.push(accent);
      if (accents.length === 2) break;
    }
    if (accents.length === 0) accents.push('100, 200, 255');
    if (accents.length === 1) accents.push(accents[0]);
    return accents;
  }
  
  if (getCalUrl()) {
    calActive = true;
    calActiveText.textContent = "✓ Active";
    calActiveText.setAttribute("active", "");
    devButton.setAttribute("visible", "");
    subButton.setAttribute("hidden", "");
    inputText.setAttribute("hidden", "");
    document.getElementById("header-classSync").style.display = 'block';
    document.getElementById("classSync").innerHTML = '<i class="fa-solid fa-magnifying-glass-arrows-rotate"></i><p style="font-size:8px;">Fetching...</p>';
    document.getElementById("classSync").parentElement.classList.add('cs-icon');
    document.getElementById('sp-nc').style.display = 'none';
    document.getElementById('sp-err').style.display = 'grid';
    document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-magnifying-glass-arrows-rotate"></i> Fetching class data...</div>`;
    const cachedEvents = loadClassSyncData();
    if (cachedEvents) last_events = cachedEvents;
    ClassSync();
    initSneakPeekMap();
  }
  function setupSP() {
    let spOpen = false, spCloseTimeout = null;
    const spEls = { ct: document.querySelector('.sneakpeek-container'), ov: document.querySelector('.sneakpeek-overlay'), bg: document.querySelector('.sneakpeek-background'), mp: document.querySelector('.sneakpeek-map-panel') };
    
    const openSP = () => {
      if (spOpen) return;
      spOpen = true, canSearch = false;
      spCloseTimeout && (clearTimeout(spCloseTimeout), spCloseTimeout = null);
      spEls.ct.style.display = '';
      setTimeout(() => {
        spEls.ov.style.opacity = 1, spEls.bg.classList.add('active'), spEls.mp?.classList.add('active'), contentDiv.classList.add('hide');
        escapeStack.push('sneakpeek', closeSP);
      }, 1);
    };
    
    const closeSP = () => {
      if (!spOpen) return;
      spOpen = false, clearRoomFilter();
      spEls.ct.style.display = 'block', spEls.ov.style.opacity = 0, spEls.bg.classList.remove('active'), spEls.mp?.classList.remove('active'), closeRoomPopover();
      contentDiv.classList.remove('hide'), escapeStack.pop('sneakpeek');
      spMapReset?.();
      spCloseTimeout && clearTimeout(spCloseTimeout);
      spCloseTimeout = setTimeout(() => {
        spEls.ct.style.display = 'none', canSearch = true, spCloseTimeout = null;
      }, 300);
    };
    
    document.getElementById("header-classSync").addEventListener('click', () => spOpen ? closeSP() : openSP());
    document.getElementById('sneakpeek-close').addEventListener('click', closeSP);
    spEls.ov.addEventListener('click', closeSP);
  }
  setupSP();

  function extractRoomId(location) {
    if (!location) return null;
    location = String(location).trim().toUpperCase();
    const aliasMap = {
      VCEM: 'VCEC',
      GYM1: 'GYM',
      GYM2: 'GYM',
      GYM3: 'GYM',
      GYM4: 'GYM',
      GYM5: 'GYM',
      LIBREAD: 'LIB',
      LIBSTUDY: 'LIB',
      LIBVCE: 'LIB',
      LIBVET: 'LIB',
      VETLIB: 'LIB',
      '1012LIBSP': 'LIB',
      '1112LIBSP': 'LIB',
      '7/8/9/10LIBSP': 'LIB',
      '8/9LIBSP': 'LIB'
    };
    if (aliasMap[location]) {
      return aliasMap[location];
    }
    for (const room of spKnownRooms) {
      if (location.includes(room)) {
        return room;
      }
    }
    return null;
  }

  function clearRoomFilter() {
    if (!spFilterActive && spHighlightedRooms.size === 0) return;
    spFilterActive = false, spHighlightedRooms.clear();
    const filterBtn = document.getElementById('sp-filter-btn');
    filterBtn && filterBtn.classList.remove('active');
    document.querySelectorAll('.sp-room').forEach(r => r.classList.remove('sp-dimmed', 'sp-highlighted'));
    document.querySelectorAll('.sp-location').forEach(l => l.classList.remove('sp-dimmed'));
    document.querySelectorAll('.sneakpeek-map [id^="W_"]').forEach(el => el.classList.remove('sp-dimmed'));
    document.querySelectorAll('.sneakpeek-map [id^="STAFF_"]').forEach(el => el.classList.remove('sp-dimmed'));
    document.querySelectorAll('.sneakpeek-card[data-room]').forEach(c => c.classList.remove('sp-selected'));
  }

  function applyRoomFilter() {
    document.querySelectorAll('.sp-room').forEach(r => {
      const hi = spHighlightedRooms.has(r.id.replace('CLASS_', ''));
      r.classList.toggle('sp-highlighted', hi), r.classList.toggle('sp-dimmed', !hi);
    });
    document.querySelectorAll('.sp-location, .sneakpeek-map [id^="W_"], .sneakpeek-map [id^="STAFF_"]').forEach(el => el.classList.add('sp-dimmed'));
  }

  function toggleTodayFilter() {
    const activeCount = Object.values(spRoomToClasses).filter(c => c.length > 0).length;
    if (spFilterActive && spHighlightedRooms.size === activeCount) return clearRoomFilter();
    spFilterActive = true, spHighlightedRooms.clear();
    Object.entries(spRoomToClasses).forEach(([id, c]) => c.length > 0 && spHighlightedRooms.add(id));
    const filterBtn = document.getElementById('sp-filter-btn');
    filterBtn && filterBtn.classList.add('active');
    document.querySelectorAll('.sneakpeek-card[data-room]').forEach(c => {
      const cardRooms = c.dataset.rooms ? c.dataset.rooms.split(',') : [c.dataset.room];
      c.classList.toggle('sp-selected', cardRooms.some(id => spHighlightedRooms.has(id)));
    });
    applyRoomFilter();
  }

  function highlightClassRoom(roomIds) {
    if (!Array.isArray(roomIds)) roomIds = [roomIds];
    if (spFilterActive && roomIds.length === spHighlightedRooms.size && roomIds.every(id => spHighlightedRooms.has(id))) return clearRoomFilter();
    spFilterActive = true, spHighlightedRooms.clear();
    roomIds.forEach(id => spHighlightedRooms.add(id));
    const filterBtn = document.getElementById('sp-filter-btn');
    filterBtn && filterBtn.classList.remove('active');
    document.querySelectorAll('.sneakpeek-card[data-room]').forEach(c => {
      const cardRooms = c.dataset.rooms ? c.dataset.rooms.split(',') : [c.dataset.room];
      c.classList.toggle('sp-selected', cardRooms.some(id => roomIds.includes(id)));
    });
    applyRoomFilter();
  }

  function reapplyCardSelection() {
    if (!spFilterActive || spHighlightedRooms.size === 0) return;
    const upcomingRooms = new Set();
    document.querySelectorAll('.sneakpeek-card[data-room]').forEach(c => {
      const cardRooms = c.dataset.rooms ? c.dataset.rooms.split(',') : [c.dataset.room];
      cardRooms.forEach(id => upcomingRooms.add(id));
      c.classList.toggle('sp-selected', cardRooms.some(id => spHighlightedRooms.has(id)));
    });
    spHighlightedRooms.forEach(id => { if (!upcomingRooms.has(id)) spHighlightedRooms.delete(id); });
    if (spHighlightedRooms.size === 0) clearRoomFilter();
    else applyRoomFilter();
  }

  function updateRoomClasses(events = []) {
    spRoomToClasses = {};
    events.forEach(e => {
      if (e.locationA && e.locationB && e.splitTime) {
        const roomA = extractRoomId(e.locationA);
        const roomB = extractRoomId(e.locationB);
        const splitTimeStr = parseDate(e.splitTime);
        const titleA = e.summaryA || e.summary;
        const titleB = e.summaryB || e.summary;
        if (roomA) {
          if (!spRoomToClasses[roomA]) spRoomToClasses[roomA] = [];
          spRoomToClasses[roomA].push({
            title: titleA,
            time: `${e.start}-${splitTimeStr}`,
            status: e.now ? 'now' : e.next ? 'next' : 'later',
            splitInfo: roomB ? `then ${titleA != titleB ? `${titleB} in` : ''} ${roomB} ${splitTimeStr}-${e.end}` : null
          });
        }
        if (roomB) {
          if (!spRoomToClasses[roomB]) spRoomToClasses[roomB] = [];
          spRoomToClasses[roomB].push({
            title: titleB,
            time: `${splitTimeStr}-${e.end}`,
            status: e.now ? 'now' : e.next ? 'next' : 'later',
            splitInfo: roomA ? `from ${titleA != titleB ? `${titleA} in` : ''} ${roomA} ${e.start}-${splitTimeStr}` : null
          });
        }
      } else {
        const roomId = extractRoomId(e.location);
        if (roomId) {
          if (!spRoomToClasses[roomId]) spRoomToClasses[roomId] = [];
          spRoomToClasses[roomId].push({
            title: e.summary,
            time: `${e.start}-${e.end}`,
            status: e.now ? 'now' : e.next ? 'next' : 'later'
          });
        }
      }
    });
    updateFilterButton();
  }

  function updateFilterButton() {
    const filterBtn = document.getElementById('sp-filter-btn');
    const hasClasses = Object.values(spRoomToClasses).some(classes => classes.length > 0);
    if (filterBtn) {
      filterBtn.style.display = hasClasses ? '' : 'none';
    }
  }

  function createSneakPeekCard(eventData) {
    const roomIds = [];
    if (eventData.locationA && eventData.locationB) {
      const roomA = extractRoomId(eventData.locationA);
      const roomB = extractRoomId(eventData.locationB);
      if (roomA) roomIds.push(roomA);
      if (roomB && roomB !== roomA) roomIds.push(roomB);
    } else {
      const roomId = extractRoomId(eventData.location);
      if (roomId) roomIds.push(roomId);
    }
    const ico = eventData.now ? 'fa-chalkboard-user' : eventData.next ? 'fa-arrow-right-to-line' : 'fa-arrow-right-to-dotted-line';
    const el = document.createElement('div');
    el.className = 'sneakpeek-card';
    const splitAtHtml = eventData.split && !eventData.locationSplit ? `<div class="sptsplit"><i class="fa-solid fa-split"></i> split at ${parseDate(eventData.splitTime)}</div>` : '';
    if (splitAtHtml) el.classList.add('has-split');
    el.innerHTML = `<div class="spt"><i class="fa-solid ${ico}"></i> ${eventData.summary}</div><div class="sptl" title="${eventData.locationSplit ? `${eventData.locationA} -> ${eventData.locationB}` : eventData.location}">${eventData.location?`<i class="fa-solid fa-location-dot"></i> ${eventData.location}`:''}</div><div class="spti"><i class="fa-solid fa-clock"></i> ${eventData.start.slice(-2) == eventData.end.slice(-2) ? eventData.start.slice(0, -3) : eventData.start}-${eventData.end}</div>${splitAtHtml}`;
    if (roomIds.length > 0) {
      el.dataset.room = roomIds[0];
      el.dataset.rooms = roomIds.join(',');
      const [accentA, accentB] = getAccentPairForRoomIds(roomIds);
      el.style.setProperty('--sp-accent-rgb', accentA);
      el.style.setProperty('--sp-accent-rgb-2', accentB);
      el.addEventListener('click', () => highlightClassRoom(roomIds));
    }
    return el;
  }

  function setRoomClasses(classes = []) {
    const classesEl = document.getElementById('sp-room-classes');
    if (!classesEl) return;
    classesEl.innerHTML = classes.length ? '' : '<div class="room-empty">No classes</div>';
    classes.forEach(c => {
      const card = document.createElement('div');
      card.className = 'room-class-card';
      const title = document.createElement('div');
      title.className = 'room-class-title', title.textContent = c.title || 'Class';
      const time = document.createElement('div');
      time.className = 'room-class-time', time.textContent = c.time || '';
      card.appendChild(title), card.appendChild(time);
      if (c.splitInfo) {
        const split = document.createElement('div');
        split.className = 'room-class-split', split.textContent = c.splitInfo;
        card.appendChild(split);
      }
      classesEl.appendChild(card);
    });
  }

  function setRoomTitle(roomId) {
    const titleEl = document.getElementById('sp-room-title');
    if (!titleEl) return;
    titleEl.textContent = String(roomId).trim().toUpperCase();
  }

  function closeRoomPopover() {
    if (!spPopoverOpen) return;
    spActiveRoom && spActiveRoom.classList.remove('is-active'), spActiveRoom = null;
    setRoomPopoverOpen(false);
  }

  function setRoomPopoverOpen(open) {
    const popover = document.getElementById('sp-room-popover');
    if (!popover) return;
    popover.dataset.open = open ? 'true' : 'false';
    (open && !spPopoverOpen) ? (spPopoverOpen = true, escapeStack.push('sp-popover', closeRoomPopover)) : (!open && spPopoverOpen) ? (spPopoverOpen = false, escapeStack.pop('sp-popover')) : null;
  }

  function getRoomCenterScreen(group) {
    const svg = group.ownerSVGElement;
    if (!svg) return null;
    const bbox = group.getBBox();
    const point = svg.createSVGPoint();
    point.x = bbox.x + bbox.width / 2;
    point.y = bbox.y + bbox.height / 2;
    const matrix = group.getScreenCTM();
    if (!matrix) return null;
    return point.matrixTransform(matrix);
  }

  function positionRoomPopover(x, y) {
    const popover = document.getElementById('sp-room-popover');
    const panel = document.querySelector('.sneakpeek-map-panel');
    if (!popover || !panel) return;
    const panelRect = panel.getBoundingClientRect();
    const targetX = x - panelRect.left;
    const targetY = y - panelRect.top;
    const pad = 16;
    const pw = popover.offsetWidth;
    const ph = popover.offsetHeight;
    const halfWidth = pw / 2;
    const goDown = targetY - ph - pad < 0;
    popover.dataset.direction = goDown ? 'down' : 'up';
    const left = Math.max(pad + halfWidth, Math.min(panelRect.width - pad - halfWidth, targetX));
    const top = goDown
      ? Math.min(panelRect.height - ph - pad, targetY) + 6
      : Math.max(ph + pad, Math.min(panelRect.height - pad, targetY));
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    const arrowOffset = Math.max(12, Math.min(pw - 12, targetX - (left - (popover.offsetWidth/2))));
    popover.style.setProperty('--arrow-left', `${arrowOffset}px`);
    setRoomPopoverOpen(true);
  }

  function bindRoomGroup(group) {
    const roomId = group.id.replace('CLASS_', '');
    group.classList.add('sp-room');
    group.addEventListener('mouseenter', () => group.classList.add('is-hovered'));
    group.addEventListener('mouseleave', () => group.classList.remove('is-hovered'));
    group.addEventListener('click', (e) => {
      e.stopPropagation();
      if (spPopoverDisabled) return;
      if (spActiveRoom === group) return closeRoomPopover();
      spActiveRoom && spActiveRoom.classList.remove('is-active'), spActiveRoom = group;
      group.classList.add('is-active'), setRoomTitle(roomId), setRoomClasses(spRoomToClasses[roomId] || []);
      const center = getRoomCenterScreen(group);
      positionRoomPopover(center ? center.x : e.clientX, (center ? center.y : e.clientY) - 5);
    });
  }

  async function initSneakPeekMap() {
    if (spMapReady) return;
    const mapContainer = document.getElementById('sp-map');
    if (!mapContainer) return;
    spMapReady = true;
    
    const state = { zoom: 1, panX: 0, panY: 0, panning: false, panStart: {}, svg: null, baseSize: {}, pendingPan: false, rafId: null, touches: [], lastTouchDistance: null };
    const ZOOM = { MIN: 1, MAX: 3, STEP: 0.2 };
    
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    
    function constrainPan() {
      if (!state.svg || state.zoom === ZOOM.MIN) { state.panX = 0; state.panY = 0; return; }
      const { clientWidth: w, clientHeight: h } = mapContainer;
      const bw = state.baseSize.width || w;
      const bh = state.baseSize.height || h;
      const [sw, sh] = [bw * state.zoom, bh * state.zoom];
      state.panX = clamp(state.panX, w - sw, 0);
      state.panY = clamp(state.panY, h - sh, 0);
    }
    
    const updateMap = (smooth = false) => {
      if (state.svg) {
        state.svg.classList.toggle('smooth', smooth);
        state.svg.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
        state.svg.style.transformOrigin = '0 0';
      }
    };
    
    const reset = () => {
      state.zoom = 1; state.panX = 0; state.panY = 0;
      updateMap(true);
      setTimeout(() => state.svg?.classList.remove('smooth'), 300);
    };
    spMapReset = reset;
    
    function handleZoom(e, dir) {
      e.preventDefault();
      closeRoomPopover();
      const oldZoom = state.zoom;
      const { left, top } = mapContainer.getBoundingClientRect();
      const [mx, my] = [e.clientX - left, e.clientY - top];
      state.zoom = clamp(state.zoom + (dir * ZOOM.STEP), ZOOM.MIN, ZOOM.MAX);
      if (oldZoom !== state.zoom) {
        const [pmx, pmy] = [(mx - state.panX) / oldZoom, (my - state.panY) / oldZoom];
        state.panX = mx - pmx * state.zoom;
        state.panY = my - pmy * state.zoom;
        constrainPan();
        updateMap(false);
      }
    }
    
    try {
      const res = await fetch('./def/map.svg');
      if (!res.ok) throw new Error('Map failed to load');
      mapContainer.innerHTML = (await res.text()).replace(/<\?xml[^>]*\?>\s*/i, '');
      const svg = state.svg = mapContainer.querySelector('svg');
      if (!svg) throw new Error('Invalid SVG');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      
      const origTransform = svg.style.transform;
      svg.style.transform = 'none';
      const rect = svg.getBoundingClientRect();
      state.baseSize.width = rect.width || mapContainer.clientWidth;
      state.baseSize.height = rect.height || mapContainer.clientHeight;
      svg.style.transform = origTransform;
      
      updateMap();
      
      svg.querySelectorAll('g[id^="CLASS_"]').forEach(bindRoomGroup);
      svg.querySelectorAll('g[id^="LOC_"]').forEach(g => g.classList.add('sp-location'));
      
      mapContainer.addEventListener('wheel', e => handleZoom(e, e.deltaY > 0 ? -1 : 1), { passive: false });

      mapContainer.addEventListener('mousedown', e => {
        if (e.button !== 0 || state.pendingPan) return;
        state.pendingPan = true;
        Object.assign(state.panStart, { x: e.clientX, y: e.clientY, px: state.panX, py: state.panY });
      });
      
      const updatePan = () => {
        constrainPan();
        updateMap();
        state.rafId = null;
      };
      
      document.addEventListener('mousemove', e => {
        if (state.pendingPan) {
          if (Math.hypot(e.clientX - state.panStart.x, e.clientY - state.panStart.y) > 5) {
            closeRoomPopover();
            state.pendingPan = false;
            state.panning = true;
            spPopoverDisabled = true;
            mapContainer.style.cursor = 'grabbing';
          }
        }
        if (!state.panning) return;
        state.panX = state.panStart.px + (e.clientX - state.panStart.x);
        state.panY = state.panStart.py + (e.clientY - state.panStart.y);
        if (!state.rafId) {
          state.rafId = requestAnimationFrame(updatePan);
        }
      });
      
      document.addEventListener('mouseup', () => {
        if (state.pendingPan) state.pendingPan = false;
        if (state.panning) {
          state.panning = false; 
          mapContainer.style.cursor = 'grab';
          if (state.rafId) cancelAnimationFrame(state.rafId);
          updatePan();
          setTimeout(() => { if(!state.panning) spPopoverDisabled = false; }, 100);
        }
      });
      
      mapContainer.addEventListener('touchstart', e => {
        state.touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
        
        if (state.touches.length === 1) {
          state.pendingPan = true;
          Object.assign(state.panStart, { x: state.touches[0].x, y: state.touches[0].y, px: state.panX, py: state.panY });
        } else if (state.touches.length === 2) {
          e.preventDefault();
          closeRoomPopover();
          const dx = state.touches[1].x - state.touches[0].x;
          const dy = state.touches[1].y - state.touches[0].y;
          state.lastTouchDistance = Math.hypot(dx, dy);
          const centerX = (state.touches[0].x + state.touches[1].x) / 2;
          const centerY = (state.touches[0].y + state.touches[1].y) / 2;
          const rect = mapContainer.getBoundingClientRect();
          state.pinchCenter = { x: centerX - rect.left, y: centerY - rect.top };
        }
      }, { passive: false });
      
      mapContainer.addEventListener('touchmove', e => {
        state.touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
        
        if (state.touches.length === 1) {
          if (state.pendingPan) {
            if (Math.hypot(state.touches[0].x - state.panStart.x, state.touches[0].y - state.panStart.y) > 5) {
              closeRoomPopover();
              state.pendingPan = false;
              state.panning = true;
              spPopoverDisabled = true;
            }
          }
          
          if (state.panning) {
            e.preventDefault();
            state.panX = state.panStart.px + (state.touches[0].x - state.panStart.x);
            state.panY = state.panStart.py + (state.touches[0].y - state.panStart.y);
            if (!state.rafId) {
              state.rafId = requestAnimationFrame(updatePan);
            }
          }
        } else if (state.touches.length === 2 && state.lastTouchDistance !== null) {
          e.preventDefault();
          const dx = state.touches[1].x - state.touches[0].x;
          const dy = state.touches[1].y - state.touches[0].y;
          const distance = Math.hypot(dx, dy);
          const scale = distance / state.lastTouchDistance;
          
          const oldZoom = state.zoom;
          state.zoom = clamp(state.zoom * scale, ZOOM.MIN, ZOOM.MAX);
          
          if (oldZoom !== state.zoom && state.pinchCenter) {
            const { x: mx, y: my } = state.pinchCenter;
            const [pmx, pmy] = [(mx - state.panX) / oldZoom, (my - state.panY) / oldZoom];
            state.panX = mx - pmx * state.zoom;
            state.panY = my - pmy * state.zoom;
            constrainPan();
            updateMap(false);
          }
          
          state.lastTouchDistance = distance;
        }
      }, { passive: false });
      
      mapContainer.addEventListener('touchend', e => {
        if (e.touches.length === 0) {
          if (state.pendingPan) state.pendingPan = false;
          if (state.panning) {
            state.panning = false;
            if (state.rafId) cancelAnimationFrame(state.rafId);
            updatePan();
            setTimeout(() => { if (!state.panning) spPopoverDisabled = false; }, 100);
          }
          state.lastTouchDistance = null;
          state.pinchCenter = null;
        } else if (e.touches.length === 1) {
          state.lastTouchDistance = null;
          state.pinchCenter = null;
          const touch = Array.from(e.touches)[0];
          state.pendingPan = true;
          Object.assign(state.panStart, { x: touch.clientX, y: touch.clientY, px: state.panX, py: state.panY });
        }
        state.touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
      }, { passive: false });
      
      document.addEventListener('click', e => {
        if (!e.target.closest('g[id^="CLASS_"]') && !e.target.closest('.room-popover')) closeRoomPopover();
      });
      
      const mkBtn = (icon, title, fn) => {
        const btn = document.createElement('button');
        btn.className = `sp-map-btn sp-${title.toLowerCase()}`, btn.innerHTML = `<i class="fa-solid fa-${icon}"></i>`, btn.title = title;
        btn.addEventListener('click', fn);
        return btn;
      };
      
      const getCenter = () => ({ clientX: mapContainer.getBoundingClientRect().left + mapContainer.clientWidth/2, clientY: mapContainer.getBoundingClientRect().top + mapContainer.clientHeight/2, preventDefault: () => {} });
      const ctrl = document.createElement('div');
      ctrl.className = 'sp-map-controls';
      ctrl.append(
        mkBtn('plus', 'Zoom In', () => handleZoom(getCenter(), 1)),
        mkBtn('minus', 'Zoom Out', () => handleZoom(getCenter(), -1)),
        mkBtn('arrow-rotate-right', 'Reset View', reset)
      );
      mapContainer.parentElement.appendChild(ctrl);
      
      if (last_events.joined) {
        updateRoomClasses(last_events.joined);
      }
    } catch (err) {
      mapContainer.innerHTML = '<div class="map-error">Map unavailable</div>';
      console.warn('Unable to load map', err);
    }
  }

  const filterBtn = document.getElementById('sp-filter-btn');
  if (filterBtn) {
    filterBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleTodayFilter();
    });
  }
  
  const settingsContainer = document.querySelector('.settings-container');
  const settingsOverlay = document.querySelector('.settings-overlay');
  const settingsBackground = document.querySelector('.settings-background');
  const settingsButton = document.querySelector('.settings-button');
  let settingsOpen = false;
  let settingsCloseTimeout = null;
  
  settingsButton.addEventListener('click', (event) => {
    openSettingsMenu();
  });
  
  settingsOverlay.addEventListener('click', () => {
    closeSettingsMenu();
  });
  
  settingsBackground.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  
  function openSettingsMenu() {
    if (settingsOpen) return;
    settingsOpen = true;
    canSearch = false;
    if (settingsCloseTimeout) {
      clearTimeout(settingsCloseTimeout);
      settingsCloseTimeout = null;
    }
    settingsContainer.style = '';
    setTimeout(() => {
      settingsBackground.classList.add('active');
      settingsOverlay.classList.add('active');
      contentDiv.classList.add('hide'); 
      settingsButton.classList.add('active');
      escapeStack.push('settings', closeSettingsMenu);
    }, 1);
  }
  
  function closeSettingsMenu(e) {
    if (!settingsOpen) return;
    settingsOpen = false;
    canSearch = true;
    settingsBackground.classList.remove('active');
    settingsOverlay.classList.remove('active');
    contentDiv.classList.remove('hide');
    settingsButton.classList.remove('active');
    escapeStack.pop('settings');
    if (settingsCloseTimeout) clearTimeout(settingsCloseTimeout);
    settingsCloseTimeout = setTimeout(() => {
      settingsContainer.style.display = 'none';
      settingsCloseTimeout = null;
    }, 300);
  }
  
  document.getElementById("settings-close").addEventListener("click",closeSettingsMenu);
  document.getElementById("customise-page").addEventListener('click', (event) => {
    window.open("./customise/#anim", '_self');
  });

  function shrinkToFit(el, minSize = 10) {
    el.style.wordWrap = '';el.style.width = '';
    const parentWidth = el.parentNode.clientWidth - 
      parseFloat(getComputedStyle(el.parentNode).paddingLeft) -
      parseFloat(getComputedStyle(el.parentNode).paddingRight);
    let fs = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > parentWidth && fs > minSize) {
      fs = fs - 1;
      fs < 16 ? (()=>{el.style.wordWrap = 'break-word';el.style.width = '110px';})() : null;
      el.style.fontSize = `${fs}px`;
    }
  }

  function loadLS() {
    if (bl.buttons.length == 0) {
      document.getElementById("cards-error").innerHTML = "<h2>You don't have any buttons</h2><h3>Visit the <a href='/customise/#anim' style='cursor:pointer;color:#b53e3e;font-style:italic;'>customisation centre</a> to add some.</h3>";
      return;
    }
    document.querySelector('.cards').innerHTML = "";
    bl.buttons.forEach((v, i) => {v.id = i;});
    bl.buttons.forEach(v=>{
      var button = document.createElement('div');
      button.classList.add("card");
      let resolvedIcon = v.icon;
      if (v.icon && (v.icon.startsWith('idb:') && v.icon.slice(4) == v.cid)) {
        resolvedIcon = '/images/icons/Unknown.webp';
      }
      button.innerHTML = `<img src="${resolvedIcon}" alt="${v.name} Icon" onerror="this.src='/images/icons/Unknown.webp'"><div class="overlay"><p>${v.name}${v.cid != undefined && typeof Number(v.cid) == "number" ? ` <i class="fa-solid fa-circle-user" style="color:#b5004b;"></i>` : ``}</p></div>`;
      if (v.icon && (v.icon.startsWith('idb:') && v.icon.slice(4) == v.cid)) {
        const cid = parseInt(v.icon.split(':')[1], 10);
        iconDB.get(cid).then(idbIcon => {
          if (idbIcon) {
            try {
              const imgEl = button.querySelector('img');
              if (imgEl) imgEl.src = idbIcon;
            } catch (e) {}
          }
        }).catch(() => {});
      }
      button.addEventListener('click', (e) => {
        if (e.button == 1 || e.button == 0) {
            button.classList.add('clicked');
          setTimeout(async () => {
            try {
              const popup = v.popup || null;
              const shouldShowPopup = popup && (popup.show === true || popup.show === "true");
              if (shouldShowPopup) {
                const title = popup.title || "Notice";
                const message = popup.msg || "";
                if (await alertSystem.callAlert(title, message, {okBtn: "Continue", cancelBtn: "Cancel"}, true)) {
                  window.open(v.url, v.param ? `_self` : '_blank');
                }
              } else {
                window.open(v.url, v.param ? `_self` : '_blank');
              }
            } catch (err) {
              window.open(v.url, v.param ? `_self` : '_blank');
            } finally {
              button.classList.remove('clicked');
            }
          }, 200);
        }
      });
      document.querySelector('.cards').appendChild(button);
      shrinkToFit(button.querySelector('p'),12);
    });
  }

  function updateCBL() {
    let preCBL = JSON.parse(localStorage.getItem("custombuttonlist"));
    (async () => {
      const removed = [];
      const migrated = [];
      cbl.cButtons = Array.isArray(preCBL.cButtons) ? [...preCBL.cButtons] : [];
      const tasks = cbl.cButtons.map(async (cb) => {
        try {
          if (!cb || typeof cb.cid !== 'number' || typeof cb.name !== 'string' || !cb.name || !isValidUrl(cb.url)) {
            removed.push(cb?.name || 'Custom Button');
            return null;
          }
          if (typeof cb.icon !== 'string') {
            removed.push(cb.name);
            return null;
          }
          if (cb.icon.startsWith('idb:') && cb.icon.slice(4) == cb.cid) {
            return cb;
          }
          if (cb.icon.startsWith('data:image/')) {
            const dataUrl = await (async () => {
              return await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                  let w = img.width, h = img.height;
                  const minDim = 150, maxDim = 512;
                  if (w > maxDim || h > maxDim) {
                    const scale = Math.min(maxDim / w, maxDim / h);
                    w = Math.floor(w * scale); h = Math.floor(h * scale);
                  }
                  if (w < minDim || h < minDim) {
                    const scale = Math.max(minDim / w, minDim / h);
                    w = Math.floor(w * scale); h = Math.floor(h * scale);
                  }
                  const canvas = document.createElement('canvas');
                  canvas.width = w; canvas.height = h;
                  const ctx = canvas.getContext('2d');
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';
                  ctx.drawImage(img, 0, 0, w, h);
                  try { resolve(canvas.toDataURL('image/webp')); } catch { resolve(canvas.toDataURL('image/png')); }
                };
                img.onerror = () => reject(new Error('Image load failed'));
                img.src = cb.icon;
              });
            })();
            await iconDB.set(cb.cid, dataUrl);
            cb.icon = `idb:${cb.cid}`;
            migrated.push(cb.name);
            return cb;
          }
          if (isImageUrl(cb.icon)) {
            try {
              await new Promise((resolve, reject) => {
                const img = new Image();
                let settled = false;
                const timeout = setTimeout(() => {
                  if (settled) return;
                  settled = true;
                  reject(new Error('Image load timeout'));
                }, 4000);
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                  if (settled) return;
                  settled = true;
                  clearTimeout(timeout);
                  resolve();
                };
                img.onerror = () => {
                  if (settled) return;
                  settled = true;
                  clearTimeout(timeout);
                  reject(new Error('Image failed to load'));
                };
                img.src = cb.icon;
              });

              await iconDB.set(cb.cid, cb.icon);
              cb.icon = `idb:${cb.cid}`;
              migrated.push(cb.name);
              return cb;
            } catch (err) {
              removed.push(cb.name);
              return null;
            }
          }
          removed.push(cb.name);
          return null;
        } catch {
          removed.push(cb?.name || 'Custom Button');
          return null;
        }
      });
      const results = await Promise.all(tasks);
      cbl.cButtons = results.filter(Boolean).sort((a,b)=> (a.cid||0) - (b.cid||0));
      const usedCids = cbl.cButtons.map(cb => cb.cid);
      await iconDB.deleteUnused(usedCids);
      localStorageQueue.add("custombuttonlist", JSON.stringify(cbl));
    })();
  }

  function deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (typeof a === 'object' && typeof b === 'object') {
      const ak = Object.keys(a), bk = Object.keys(b);
      if (ak.length !== bk.length) return false;
      for (const k of ak) {
        if (!bk.includes(k) || !deepEqual(a[k], b[k])) return false;
      }
      return true;
    }
    return false;
  }

  const localStorageQueue = {
    queue: [],
    processing: false,
    add: function(key, value) {
      this.queue.push({ key, value });
      this.process();
    },
    process: async function() {
      if (this.processing || this.queue.length === 0) return;
      this.processing = true;
      
      while (this.queue.length > 0) {
        const { key, value } = this.queue.shift();
        try {
          localStorage.setItem(key, value);
        } catch (e) {
          consol.error(`Failed to update localStorage for ${key}`, 'Storage');
        }
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      this.processing = false;
    }
  };

  var bl = {};
  var cbl = {cButtons:[]};

  if (localStorage.getItem("buttonlayout")) {
    if (!jsonCheck(localStorage.getItem("buttonlayout"))) {
      consol.log("Failed to parse buttonlayout, resetting", "Buttons");
      alertSystem.callAlert("Button Layout Reset", "An error was detected in your button layout.\n It has been reset to the default configuration.");
      localStorageQueue.add("old-buttonlayout", localStorage.getItem("buttonlayout"));
      localStorage.removeItem("buttonlayout");
      fetch("/def/def.json")
        .then(function(res) {
          return res.text();
        })
        .then(function(def) {
          let vdef = JSON.parse(def);
          vdef.defaultButtons = Array.isArray(vdef.buttons) ? vdef.buttons.map(x => (x.pid)) : [];
          vdef.buttons.forEach((v, i) => {v.id = i;});
          vdef.all = Array.isArray(vdef.all) ? vdef.all.map(x => (x.pid)) : [];
          localStorageQueue.add("buttonlayout", JSON.stringify(vdef));
          bl = JSON.parse(JSON.stringify(vdef));
          loadLS();
        })
        .catch(function(e) {
          consol.error("Failed to fetch buttons", "Buttons");
          alertSystem.callAlert("Failed to load buttons", "The server didn't respond.");
          document.getElementById("cards-error").innerHTML = "<h2>Failed to load your buttons</h2>";
        });
    } else {
      bl = JSON.parse(localStorage.getItem("buttonlayout"));
      fetch("./def/def.json")
        .then(function(res) {
          return res.text();
        })
        .then(function(defbl) {
          if (bl.v != JSON.parse(defbl).v) {
            let vdefbl = JSON.parse(defbl);
            vdefbl.defaultButtons = Array.isArray(vdefbl.buttons) ? vdefbl.buttons.map(x => (x.pid)) : [];
            vdefbl.buttons = bl.buttons;
            vdefbl.buttons.forEach((v, i) => {v.id = i;});
            vdefbl.all = Array.isArray(vdefbl.all) ? vdefbl.all.map(x => (x.pid)) : [];
            localStorageQueue.add("buttonlayout", JSON.stringify(vdefbl));
            bl = JSON.parse(JSON.stringify(vdefbl));
            if (jsonCheck(localStorage.getItem("custombuttonlist")) && localStorage.getItem("custombuttonlist")) {
              updateCBL();
            }
            loadLS();
          } else {
            let vdefbl = JSON.parse(defbl);
            if (!bl.defaultButtons) {
              bl.defaultButtons = Array.isArray(vdefbl.buttons) ? vdefbl.buttons.map(x => (x.pid)) : [];
              localStorageQueue.add("buttonlayout", JSON.stringify(bl));
            }
            if (!bl.all) {
              bl.all = Array.isArray(vdefbl.all) ? vdefbl.all.map(x => (x.pid)) : [];
              localStorageQueue.add("buttonlayout", JSON.stringify(bl));
            }
            if (jsonCheck(localStorage.getItem("custombuttonlist")) && localStorage.getItem("custombuttonlist")) {
              updateCBL();
            }
            
            let len = structuredClone(bl.buttons.length);
            bl.buttons.length = bl.buttons.length > 25 ? 25 : bl.buttons.length;
            Promise.all(bl.buttons.map((b)=> new Promise((resolve, reject)=>{
              let tasks = {a:'required'}
              let li = null;
              if (!b.name || !b.icon || !b.url ) {b.tagged = true;resolve();};
              if (b.pid != undefined && typeof Number(b.pid) == "number" && vdefbl.all.filter(d=>d.pid==b.pid).length == 0) {b.tagged = true;resolve();}
              else if (b.pid != undefined && typeof Number(b.pid) == "number") {li = vdefbl.all.filter(d=>d.pid==b.pid)[0];}
              else if (b.cid != undefined && typeof Number(b.cid) == "number") {li = cbl.cButtons.filter(d=>d.cid==b.cid)[0];};
              if (!li) {b.tagged = true;resolve();};
              ['name', 'icon', 'url', 'param', 'popup'].forEach(p => {
                if (!!li[p] && !deepEqual(b[p], li[p])) b[p] = structuredClone(li[p]);
              });
              tasks.a = true;

              let c = true;
              for (const [k, v] of Object.entries(tasks)) {
                if (v == 'required') {
                  consol.warn(`Failed to fetch "${b.name}" button, task '${k}' failed.`, "Buttons");
                  b.tagged = true;
                } else if (v == 'res') {
                  c = false;
                } else if (!v) {
                  consol.warn(`Task ${k} for "${b.name}" (${bl.buttons.indexOf(b)}) button was incomplete.`, "Buttons");
                }
              }
              if (c) resolve();
            }))).then(()=>{
              let rm = 0;
              bl.buttons.filter(b=>b.tagged).forEach((b)=>{
                rm++;
                bl.buttons.splice(bl.buttons.indexOf(b), 1);
              });
              let errmsg = "";
              if (rm) {errmsg += `${rm == 1 ? 'A' : rm} button${rm > 1 ? 's were' : ' was'} removed.`};
              if (len > 25) {errmsg += `\nYou have reached the button limit, the first 25 were kept, the remaining ${len-25 == 1 ? 'button' : `${len-25} buttons`} ${len-25 == 1 ? 'was' : 'were'} removed.`};
              if (errmsg) alertSystem.callAlert("Button Layout Updated", errmsg, {});
              localStorageQueue.add("buttonlayout", JSON.stringify(bl));
              loadLS();
            }).then(()=>{
              checkForNewDefaultButtons(defbl);
            });
          }
        })
        .catch(function(e) {
          consol.error(`Failed to fetch buttons, ${e}`, "Buttons");
          alertSystem.callAlert("Failed to load buttons", "The server didn't respond.");
          document.getElementById("cards-error").innerHTML = "<h2>Failed to load your buttons</h2>";
        });
    }
    
  } else {
    fetch("./def/def.json")
      .then(function(res) {
          return res.text();
      })
      .then(function(def) {
        let vdef = JSON.parse(def);
        vdef.defaultButtons = Array.isArray(vdef.buttons) ? vdef.buttons.map(x => (x.pid)) : [];
        vdef.all = Array.isArray(vdef.all) ? vdef.all.map(x => (x.pid)) : [];
        localStorageQueue.add("buttonlayout", JSON.stringify(vdef));
        bl = JSON.parse(JSON.stringify(vdef));
        loadLS();
      })
      .catch(function(err) {
        consol.error(err, "Buttons");
        alertSystem.callAlert("Failed to load buttons", "The server didn't respond.");
      });
  }

  function isValidUrl(url) {
    try {
      url = url.trim();
      if (!url) return false;

      if (url.startsWith('/')) return true;

      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  function isImageUrl(url) {
    const urlPath = url.split('?')[0];
    return(urlPath.match(/\.(jpeg|jpg|png|svg|webp|bmp|tiff|ico|avif)$/i) != null) && isValidUrl(url);
  }

  let alertSystem = {
    callAlert: function(title, message, {okBtn="OK", cancelBtn="Cancel"} = {okBtn: "OK", cancelBtn: "Cancel"}, showCancel=false) {
      return new Promise((resolve) => {
        this._queue.push({ type: 1, title, message, okBtn, cancelBtn, showCancel, resolve });
        !this._r?this._rq():null;
      });
    },
    callNewButtonsDialog: function(title, newButtons, originalLength, options = {added: true}) {
      return new Promise((resolve) => {
        this._queue.push({ type: 2, title, newButtons, originalLength, options, resolve });
        !this._r?this._rq():null;
      });
    },
    _queue: [],
    _rq: async function() {
      if (this._queue.length > 0) {
        this._r = true;
        const item = this._queue.shift();
        if (item.type == 1) {
          const result = await showAlert(item.title, item.message, {okBtn: item.okBtn, cancelBtn: item.cancelBtn}, item.showCancel);
          item.resolve(result);
        } else if (item.type == 2) {
          await showNewButtonsDialog(item.title, item.newButtons, item.originalLength, item.options || {added: true});
          item.resolve();
        }
        setTimeout(()=>{this._rq()}, 300);
      } else this._r = false;
    },
    _r: false,
  }

  const alertTitle = document.getElementById('alert-title');
  const alertMessage = document.getElementById('alert-message');
  const alertOk = document.getElementById('alert-ok');
  const alertCancel = document.getElementById('alert-cancel');
  const alertContainer = document.querySelector('.alert-container');
  const alertOverlay = document.querySelector('.alert-overlay');
  const alertBackground = document.querySelector('.alert-background');

  function showAlert(title, message, {okBtn="OK", cancelBtn="Cancel"} = {okBtn: "OK", cancelBtn: "Cancel"}, showCancel=false) {
    return new Promise((resolve) => {
      alertContainer.style.display = '';
      setTimeout(() => {
        alertTitle.innerText = title;
      alertMessage.innerText = message;
      alertOk.innerText = okBtn;
      showCancel ? alertCancel.innerText = cancelBtn : null;
      
      contentDiv.classList.add('hide');
      alertOverlay.style.opacity = 1;
      alertBackground.classList.add('active');
      
      function closeAlert() {
        alertOverlay.removeEventListener('click', resFalse);
        alertOk.removeEventListener('click', resTrue);
        showCancel ? alertCancel.removeEventListener('click', resFalse) : null;
        alertOverlay.style.opacity = 0;
        alertBackground.classList.remove('active');
        contentDiv.classList.remove('hide');
        escapeStack.pop('alert');
        setTimeout(() => {
          alertContainer.style.display = 'none';
          alertTitle.innerText = "Alert";
          alertMessage.innerText = "Message";
          alertOk.innerText = "OK";
          alertCancel.style.display = 'none';
          alertCancel.innerText = "Cancel";
        }, 300);
      }
      
      function resTrue() {closeAlert();resolve(true);}
      function resFalse() {closeAlert();resolve(false);}
      
      alertOverlay.addEventListener('click', resFalse);
      alertOk.addEventListener('click', resTrue);
      showCancel ? alertCancel.addEventListener('click', resFalse) : null;
      escapeStack.push('alert', resFalse);
      showCancel ? alertCancel.style.display = '' : alertCancel.style.display = 'none';
      }, 10);
    });
  }
  
  function showNewButtonsDialog(title, newButtons, originalLength, options = {added: true}) {
    if (newButtons.length == 0) return;
    return new Promise((resolve) => {
      const container = document.querySelector('.nb-container');
      const overlay = document.querySelector('.nb-overlay');
      const background = document.querySelector('.nb-background');
      const cardsContainer = document.querySelector('.nb-cards');
      const message = document.getElementById('nb-message');
      const titleElem = document.getElementById('nb-title');
      const okBtn = document.getElementById('nb-ok');

      titleElem.textContent = title;
      cardsContainer.innerHTML = '';

      newButtons.forEach(button => {
        const card = document.createElement('div');
        card.classList.add('newcard');
        card.innerHTML = `
          <img src="${button.icon}" alt="${button.name} Icon" onerror="this.src='/images/icons/Unknown.webp'">
          <div class="overlay"><p>${button.name}</p></div>
        `;
        cardsContainer.appendChild(card);
      });

      if (options.added) {
        if (originalLength + newButtons.length <= 25) {
          message.innerHTML = `${newButtons.length==1?`This button has`:`These buttons have`} been added to your configuration. To remove ${newButtons.length==1?`it`:`them`}, please visit the <a href='/customise/#anim' style='cursor:pointer;font-style:italic;'>customisation centre</a>.`;
        } else if (originalLength < 25 && originalLength + newButtons.length > 25) {
          const excess = originalLength + newButtons.length - 25;
          message.innerHTML = `The first ${newButtons.length - excess == 1 ? `button has`:`${newButtons.length - excess} of these buttons have`} been added.<br>To add the rest, please remove some cards through the <a href='/customise/#anim' style='cursor:pointer;font-style:italic;'>customisation centre</a>.`;
        } else if (originalLength == 25) {
          message.innerHTML = `To add these buttons, please remove some cards through the <a href='/customise/#anim' style='cursor:pointer;font-style:italic;'>customisation centre</a>.`;
        }
      } else {
        message.innerHTML = `${newButtons.length==1?`This button is`:`These buttons are`} now available in the <a href='/customise/#anim' style='cursor:pointer;font-style:italic;'>customisation centre</a>. Visit it to add ${newButtons.length==1?`this button`:`them`} to your configuration.`;
      }

      container.style.display = '';
      setTimeout(() => {
        overlay.style.opacity = 1;
        background.classList.add('active');
        contentDiv.classList.add('hide');
      }, 100);

      function closeDialog() {
        overlay.style.opacity = 0;
        background.classList.remove('active');
        contentDiv.classList.remove('hide');
        escapeStack.pop('dialog');
        document.removeEventListener('keydown', handleDialogKeydown);
        setTimeout(() => {
          container.style.display = 'none';
        }, 300);
        resolve();
      }

      function handleDialogKeydown(e) {
        if (e.key === "Enter") {
          closeDialog();
        }
      }

      okBtn.addEventListener('click', closeDialog, { once: true });
      overlay.addEventListener('click', closeDialog, { once: true });
      document.addEventListener('keydown', handleDialogKeydown);
      escapeStack.push('dialog', closeDialog);
    });
  }
  
  function checkForNewDefaultButtons(defbl) {
    try {
      const vdefbl = JSON.parse(defbl);

      if (!bl.defaultButtons || !bl.all) return;
      // legacy support
      const defaultPids = Array.isArray(bl.defaultButtons) && bl.defaultButtons.every(b => typeof b === 'number') ? bl.defaultButtons : bl.defaultButtons.map(b => b.pid);
      const allPids = Array.isArray(bl.all) && bl.all.every(b => typeof b === 'number') ? bl.all : bl.all.map(b => b.pid);
      const blPids = Array.isArray(bl.buttons) ? bl.buttons.map(b => b.pid).filter(pid => pid !== undefined) : [];
      const originalLength = structuredClone(bl.buttons.length);

      const newInButtons = Array.isArray(vdefbl.buttons) ? vdefbl.buttons.filter(b => !defaultPids.includes(b.pid) && !blPids.includes(b.pid)) : [];
      const newInAll = Array.isArray(vdefbl.all) ? vdefbl.all.filter(b => !allPids.includes(b.pid) && !blPids.includes(b.pid)) : [];
      const newAllExclusive = newInAll.filter(a => !newInButtons.some(nb => nb.pid === a.pid));

      if (newInButtons.length > 0) {
        const spaceLeft = Math.max(0, 25 - bl.buttons.length);
        const toAdd = newInButtons.slice(0, spaceLeft);

        if (toAdd.length > 0) {
          toAdd.forEach(button => {
            if (bl.buttons.length >= 25) return;
            const newButton = {
              name: button.name,
              icon: button.icon,
              url: button.url,
              pid: button.pid
            };
            if (button.param) newButton.param = button.param;
            if (button.popup) newButton.popup = structuredClone(button.popup);
            bl.buttons.push(newButton);
          });

          bl.buttons.forEach((v, i) => { v.id = i; });
          loadLS();
        }

        alertSystem.callNewButtonsDialog(`New Button${newInButtons.length === 1 ? "" : "s"}`, toAdd, originalLength, {added: true});
      }

      if (newAllExclusive.length > 0) {
        alertSystem.callNewButtonsDialog(`New Button${newAllExclusive.length === 1 ? "" : "s"} Available in Customisation Centre`, newAllExclusive, originalLength, {added: false});
      }

      bl.defaultButtons = Array.isArray(vdefbl.buttons) ? vdefbl.buttons.map(x => (x.pid)) : [];
      bl.all = Array.isArray(vdefbl.all) ? vdefbl.all.map(x => (x.pid)) : [];
      localStorageQueue.add("buttonlayout", JSON.stringify(bl));
    } catch (error) {
      consol.error(`Error checking for new buttons: ${error}`, "Buttons");
    }
  }
  console.log(`                ,---,.   ,----..   \n       ,---.  ,'  .'  \\ /   /   \\  \n      /__./|,---.' .' ||   :     : \n ,---.;  ; ||   |  |: |.   |  ;. / \n/___/ \\  | |:   :  :  /.   ; /--\`  \n\\   ;  \\ ' |:   |    ; ;   | ;     \n \\   \\  \\: ||   :     \\|   : |     \n  ;   \\  ' .|   |   . |.   | '___  \n   \\   \\   ''   :  '; |'   ; : .'| \n    \\   \`  ;|   |  | ; '   | '/  : \n     :   \\ ||   :   /  |   :    /  \n      '---\" |   | ,'    \\   \\ .'   \n            \`----'       \`---\`     \nIntranet ${version}`);
})();