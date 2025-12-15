(() => {
  const version = "v2.1.0";

  const consol = {
    log: (message, title="Core", colour="#FF6961") => { console.log(`%c(${title}) %c${message}`, `color:${colour};font-weight:bold`, "") },
    warn: (message, title="Core") => { console.warn(`%c(${title}) %c${message}`, `color:#FFD699;font-weight:bold`, "") },
    error: (message, title="Core") => { console.error(`%c(${title}) %c${message}`, `color:#FFB3B3;font-weight:bold`, "") }
  }
  
  document.addEventListener('mousedown', e => { if (e.button == 1) { e.preventDefault() } });

  function updateClock() {
    let now = new Date()
    document.getElementById("clock").innerText = `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()]}, ${now.getDate()}${(!(String(now.getDate())[0] == "1" && String(now.getDate()).length == 2)&&[1,2,3].includes(now.getDate() % 10))?['st','nd','rd'][(now.getDate() % 10)-1]:'th'} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][now.getMonth()]} ${now.getFullYear()}, ${[0,12].includes(now.getHours()) ? '12' : now.getHours() > 11 ? now.getHours()-12 : now.getHours()}:${now.getMinutes() < 10 ? "0"+now.getMinutes() : now.getMinutes()}:${now.getSeconds() < 10 ? "0"+now.getSeconds() : now.getSeconds()} ${now.getHours() > 11 ? 'PM' : 'AM'}`
    setTimeout(updateClock, 1000 - now.getMilliseconds());
  }
  updateClock();
  
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
    if (event.key === 'Escape') {
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
      searchOpen = false
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
        var pat = /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/;
        if (pat.test(searchTerm)) {
          closeSearchBar();
          window.open(searchTerm, '_blank');
        } else {
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
          closeSearchBar();
          window.open(searchUrl, '_blank');
        }
      }
    }
  });
  
  let pl = document.createElement('i');
  pl.classList.add('fa-solid', 'fa-cloud-arrow-down');
  document.body.appendChild(pl);
  setTimeout(() => {
    
  }, 100);
  pl.classList.remove('fa-solid','fa-cloud-arrow-down');
  pl.classList.add('fa-regular', 'fa-calendar-minus');
  pl.remove();
  let isOnline = true;
  
  window.addEventListener('online', () => {
    consol.log("Reconnected", "Network");
    isOnline = true;

    function internetAnim() {
      document.getElementById('no-internet').children[1].style.display = "block";
      document.getElementById('no-internet').children[0].style.animation = "none";
      document.getElementById('no-internet').children[0].style.opacity = "1";
      setTimeout(() => {
        document.getElementById('no-internet').children[0].style.opacity = "0";
        document.getElementById('no-internet').children[1].style.opacity = "1";
        document.getElementById('no-internet').children[1].style.transform = "scale(1)";
        setTimeout(() => {
          document.getElementById('no-internet').children[1].style.opacity = "0";
          setTimeout(() => {
            document.getElementById('no-internet').children[1].style.display = "";
            document.getElementById('no-internet').children[1].style.opacity = "";
            document.getElementById('no-internet').children[0].style.animation = "";
            document.getElementById('no-internet').children[0].style.opacity = "";
            document.getElementById('no-internet').children[1].style.transform = "";
            document.getElementById('no-internet').children[1].style.display = "";
            document.getElementById('no-internet').style.display = "";
          }, 1000);
        }, 3000);
      }, 100);
    }
    internetAnim();

    if (calActive) {
      document.getElementById("classSync").innerHTML = '<i class="fa-solid fa-magnifying-glass-arrows-rotate"></i><p style="font-size:8px;">Fetching...</p>';
      document.getElementById("classSync").parentElement.classList.add('cs-icon');
      document.getElementById('sp-nc').style.display = 'none';
      document.getElementById('sp-err').style.display = 'flex';
      document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-magnifying-glass-arrows-rotate"></i> Fetching class data...</div>`;
      document.querySelector('.sneakpeek-background').style.height = `calc(10vh + ${document.querySelector('.sneakpeek-content').clientHeight}px)`;
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
    document.getElementById('no-internet').style.display = 'flex';
    if (calActive) {
      document.getElementById("classSync").innerHTML = last_events.next ? `<i class="fa-solid fa-caret-right"></i> ${last_events.next.summary}${last_events.next.location ? `<p style="font-size:12px;margin: 5px 0 !important;"><i class="fa-solid fa-location-dot"></i> ${last_events.next.location}</p>` : ''}<p style="font-size:8px;">${last_events.next.start.slice(-2) == last_events.next.end.slice(-2) ? last_events.next.start.slice(0, -3) : last_events.next.start}-${last_events.next.end}${last_events.next.split ? ` (split at ${parseDate(last_events.next.splitTime)})` : ``}</p><p style="font-size:8px;margin-top:5px !important;color:#ff746c;"><i class="fa-solid fa-cloud-question"></i> ${parseDate(last_events.timeChecked)}</p>` : `<i class="fa-regular fa-calendar-minus"></i><p style="font-size:8px;margin-top:5px !important;color:#ff746c;"><i class="fa-solid fa-cloud-question"></i> ${parseDate(last_events.timeChecked)}</p>`;
      last_events.next ? document.getElementById("classSync").parentElement.classList.remove('cs-icon') : document.getElementById("classSync").parentElement.classList.add('cs-icon');
      document.getElementById('sp-err').style.display = 'flex';
      document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-cloud-question"></i> Network disconnected.</div><div class="spti">Class data last updated at ${parseDate(last_events.timeChecked)}.</div>`;
      document.getElementById('sp-nc').style.display = last_events.next ? 'none' : 'flex';
      document.getElementById('sp-nc').innerHTML = `<div class="spt"><i class="fa-solid fa-calendar-minus"></i> ${last_events.today.length ? `No more classes today` : `No classes today`}</div>`;
      document.querySelector('.sneakpeek-background').style.height = `calc(10vh + ${document.querySelector('.sneakpeek-content').clientHeight}px)`;
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
            localStorage.setItem('compass-cal', formatCalLink(inputText.value));
            document.getElementById("header-classSync").style.display = 'block';
            ClassSync();
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
    localStorage.removeItem('compass-cal');
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
      })
      return t
    },
    saveSessionOfType(type) {
      if (!type) return new Error('Missing information');
      let l = [];
      let tagged = []
      this._l.forEach(e=>{if (e.type == type) {l.push(e);tagged.push(e)}})
      tagged.forEach(e=>{this._l.splice(this._l.indexOf(e), 1)})
      if (!l.length) return;
      if (jsonCheck(localStorage.getItem("session-error"))) {
        s_e = JSON.parse(localStorage.getItem("session-error"));
        s_e.push({type, date: new Date().toLocaleString(), count: l.length, list: l, dateRaw: new Date()});
        localStorage.setItem("session-error", JSON.stringify(s_e));
      } else {
        localStorage.setItem("session-error", JSON.stringify([{type, date: new Date().toLocaleString(), count: l.length, list: l, dateRaw: new Date()}]));
      }
    },
    get count() {return this._t;},
    get list() {return this._l;},
  }

  addEventListener('beforeunload', function (event) {
    errors.saveSession();
  });

  function jsonCheck(json) {
    try {
      JSON.parse(json)
    } catch {
      return false
    }
    if (Object.is(JSON.parse(json), null)) {
      return false
    } else {
      return true
    }
  }

  let classSyncLock = false;

  function ClassSync() {
    if (classSyncLock) return;
    classSyncLock = true;
    if (!localStorage.getItem('compass-cal')) {
      document.getElementById("classSync").innerText = "";
      classSyncLock = false;
      return null;
    }
    if (!isOnline) {
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
      })
      tagged.forEach(e=>{
        events.joined.splice(events.joined.indexOf(e), 1);
      })

      if (events.next && events.next.startraw.getTime() <= new Date().getTime()) {
        let oldEvent = events.next;
        events.next = null;
        events.joined.forEach(e=>{
          if (events.next == null || ((events.next.startraw.getTime() <= new Date().getTime() || (e.startraw.getTime() > new Date().getTime() && e.startraw.getTime() < events.next.startraw.getTime())) && (oldEvent.endraw.getTime() < e.startraw.getTime()))) {
            e.next = true;
            events.next = e;
          } else {
            e.next = false;
          }
        })
        if (events.next.startraw.getTime() <= new Date().getTime()) {
          events.next = null;
        }
      }

      if (events.next && events.next.start && events.next.startraw.getTime() <= endTime.getTime()) {
        document.getElementById("classSync").innerHTML = last_events.next ? `<i class="fa-solid fa-caret-right"></i> ${last_events.next.summary}${last_events.next.location ? `<p style="font-size:12px;margin: 5px 0 !important;"><i class="fa-solid fa-location-dot"></i> ${last_events.next.location}</p>` : ''}<p style="font-size:8px;">${last_events.next.start.slice(-2) == last_events.next.end.slice(-2) ? last_events.next.start.slice(0, -3) : last_events.next.start}-${last_events.next.end}${last_events.next.split ? ` (split at ${parseDate(last_events.next.splitTime)})` : ``}</p><p style="font-size:8px;margin-top:5px !important;color:#ff746c;"><i class="fa-solid fa-cloud-question"></i> ${parseDate(last_events.timeChecked)}</p>` : `<i class="fa-regular fa-calendar-minus"></i><p style="font-size:8px;margin-top:5px !important;color:#ff746c;"><i class="fa-solid fa-cloud-question"></i> ${parseDate(last_events.timeChecked)}</p>`;
        last_events.next ? document.getElementById("classSync").parentElement.classList.remove('cs-icon') : document.getElementById("classSync").parentElement.classList.add('cs-icon');
        document.getElementById('sp-err').style.display = 'flex';
        document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-cloud-question"></i> Network disconnected.</div><div class="spti">Class data last updated at ${parseDate(last_events.timeChecked)}.</div>`;
        document.getElementById('sp-nc').style.display = last_events.next ? 'none' : 'flex';
        document.getElementById('sp-nc').innerHTML = `<div class="spt"><i class="fa-solid fa-calendar-minus"></i> ${last_events.today.length ? `No more classes today` : `No classes today`}</div>`;
        Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
          if (!['sp-nc','sp-err'].includes(c.id)) {
            c.remove()
          }
        })
        events.joined.forEach(e=>{
          var sp_class = document.createElement('div')
          sp_class.innerHTML = `<div class="spt">${e.now ? `<i class="fa-solid fa-chalkboard-user"></i>` : e.next ? `<i class="fa-solid fa-caret-right" style="margin-left: 14.39px;"></i>` : `<i style="margin-left: 24px;"></i>`} ${e.summary}</div><div class="sptl">${e.location?`<i class="fa-solid fa-location-dot"></i> ${e.location}`:''}</div><div class="spti"><i class="fa-solid fa-clock"></i> ${e.start.slice(-2) == e.end.slice(-2) ? e.start.slice(0, -3) : e.start}-${e.end}${e.split ? ` (split at ${parseDate(e.splitTime)})` : ``}</div>`;
          sp_class.classList.add('sneakpeek-card');
          document.getElementById('sp-c').appendChild(sp_class);
        })
        document.querySelector('.sneakpeek-background').style.height = `calc(10vh + ${document.querySelector('.sneakpeek-content').clientHeight}px)`;
      } else {
        document.getElementById("classSync").innerHTML = `<i class="fa-regular fa-calendar-minus"></i><p style="font-size:8px;margin-top:5px !important;color:#ff746c;"><i class="fa-solid fa-cloud-question"></i> ${parseDate(last_events.timeChecked)}</p>`;
        document.getElementById("classSync").parentElement.classList.add('cs-icon');
        document.getElementById('sp-err').style.display = 'flex';
        document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-cloud-question"></i> Network disconnected.</div><div class="spti">Class data last updated at ${parseDate(last_events.timeChecked)}.</div>`;
        document.getElementById('sp-nc').style.display = 'flex';
        document.getElementById('sp-nc').innerHTML = `<div class="spt"><i class="fa-solid fa-calendar-minus"></i> ${last_events.today.length ? `No more classes today` : `No classes today`}</div>`;
        Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
          if (!['sp-nc','sp-err'].includes(c.id)) {
            c.remove()
          }
        })
        document.querySelector('.sneakpeek-background').style.height = `calc(10vh + ${document.querySelector('.sneakpeek-content').clientHeight}px)`;
      }
      t = setTimeout(() => { classSyncLock = false; ClassSync(); }, (60 - new Date().getSeconds()) * 1000);
      return;
    };

    if (!formatCalLink(localStorage.getItem('compass-cal'), true).startsWith('viewbank-vic.compass.education/download/sharedCalendar.aspx')) {
      errors.new({error: "Link failed test", url: localStorage.getItem('compass-cal')}, "ClassSync");
      consol.error("Link failed test", "ClassSync");
      document.getElementById("classSync").innerHTML = `<i class="fa-solid fa-cloud-xmark"></i><p style="font-size:8px;">Link Error</p>`;
      document.getElementById("classSync").parentElement.classList.add('cs-icon');
      document.getElementById('sp-nc').style.display = 'none';
      document.getElementById('sp-err').style.display = 'flex';
      document.getElementById('sp-err').innerHTML = `<div class="spt"><i class="fa-solid fa-cloud-xmark"></i> The link provided did not work.<div class="spti">Please check your link and try again.</div>`;
      document.querySelector('.sneakpeek-background').style.height = `calc(10vh + ${document.querySelector('.sneakpeek-content').clientHeight}px)`;
      calActiveText.textContent = "⚠ Error";
      calActiveText.setAttribute("error", "");
      calActiveText.removeAttribute("active");
      classSyncLock = false;
      return null;
    }
    let sts = '';
    fetch(localStorage.getItem('compass-cal'))
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
              events.all.push(eventData)
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
          events.today.forEach(e=>{
            if (events.next == null || (e.startraw.getTime() < events.next.startraw.getTime() && e.startraw.getTime() > new Date().getTime())) {
              e.next = true;
              events.next = e;
            }
          })
        }

        function joinEvents() {
          let lastEvent = null;
          events.today.forEach(e=>{
            if (!lastEvent) {lastEvent = e;} else if (lastEvent.startraw.getTime() == e.startraw.getTime()) {events.joined.push(e)} else {
              if (!lastEvent.tagged) {
                if (lastEvent.endraw.getTime() == e.startraw.getTime() && lastEvent.summary == e.summary) {
                  if (e.location != lastEvent.location) {
                    lastEvent.location += ` <i class="fa-solid fa-arrow-right"></i> ${e.location}`
                  }
                  lastEvent.endraw = e.endraw;
                  lastEvent.end = parseDate(e.endraw);
                  lastEvent.endDate = e.endraw.toLocaleString();
                  e.tagged = true;
                  events.joined.push(lastEvent);
                } else if (lastEvent.startraw.getTime() == e.endraw.getTime() && lastEvent.summary == e.summary) {
                  if (e.location != lastEvent.location) {
                    lastEvent.location += ` <i class="fa-solid fa-arrow-right"></i> ${e.location}`
                  }
                  lastEvent.startraw = e.startraw;
                  lastEvent.start = parseDate(e.startraw);
                  lastEvent.endDate = e.startraw.toLocaleString();
                  e.tagged = true;
                  events.joined.push(lastEvent);
                } else if (lastEvent.endraw.getTime() == e.startraw.getTime()) {
                  if (lastEvent.startraw.getTime() < new Date().getTime() && e.startraw.getTime() < new Date().getTime()) {
                  } else if (e.location != lastEvent.location) {
                    lastEvent.summary = `${lastEvent.summary} and ${e.summary}`;
                    lastEvent.location = `${lastEvent.location} <i class="fa-solid fa-arrow-right"></i> ${e.location}`;
                  } else {
                    lastEvent.summary = `${lastEvent.summary} and ${e.summary}`;
                  }
                  lastEvent.endraw = e.endraw;
                  lastEvent.end = parseDate(e.endraw);
                  lastEvent.endDate = e.endraw.toLocaleString();
                  lastEvent.split = true;
                  lastEvent.splitTime = e.startraw;
                  e.tagged = true;
                  events.joined.push(lastEvent);
                } else if (lastEvent.startraw.getTime() == e.endraw.getTime()) {
                  if (e.location != lastEvent.location) {
                    lastEvent.summary = `${lastEvent.summary} and ${e.summary}`;
                    lastEvent.location = `${lastEvent.location} <i class="fa-solid fa-arrow-right"></i> ${e.location}`;
                  } else {
                    lastEvent.summary = `${lastEvent.summary} and ${e.summary}`;
                  }
                  lastEvent.startraw = e.startraw;
                  lastEvent.start = parseDate(e.startraw);
                  lastEvent.startDate = e.startraw.toLocaleString();
                  lastEvent.split = true;
                  lastEvent.splitTime = e.endraw;
                  e.tagged = true;
                  events.joined.push(lastEvent);
                }
              }
              !lastEvent.tagged && !e.tagged ? events.joined.push(lastEvent) : null;
              lastEvent = e;
            }
          })

          let tagged = [];
          events.joined.forEach(e=>{
            if (e.endraw.getTime() <= new Date().getTime()) {
              tagged.push(e);
            } else if (e.startraw.getTime() <= new Date().getTime() && e.endraw.getTime() > new Date().getTime()) {
              e.now = true;
            }
          })
          tagged.forEach(e=>{
            events.joined.splice(events.joined.indexOf(e), 1);
          })
        }

        getEvents()
        joinEvents()
        if (events.next && events.next.startraw.getTime() < new Date().getTime()) {
          let oldEvent = events.next;
          events.next = null;
          events.joined.forEach(e=>{
            if (events.next == null || ((events.next.startraw.getTime() <= new Date().getTime() || (e.startraw.getTime() > new Date().getTime() && e.startraw.getTime() < events.next.startraw.getTime())) && (oldEvent.endraw.getTime() < e.startraw.getTime()))) {
              e.next = true;
              events.next = e;
            } else {
              e.next = false;
            }
          })
          if (events.next && events.next.startraw.getTime() < new Date().getTime()) {
            events.next = null;
          }
        }
        
        if ((events.next && events.next.start && events.next.startraw.getTime() <= endTime.getTime())) {
          document.getElementById("classSync").innerHTML = `<i class="fa-solid fa-caret-right"></i> ${events.next.summary}${events.next.location ? `<p style="font-size:12px;margin: 5px 0 !important;"><i class="fa-solid fa-location-dot"></i> ${events.next.location}</p>` : ''}<p style="font-size:8px;">${events.next.start.slice(-2) == events.next.end.slice(-2) ? events.next.start.slice(0, -3) : events.next.start}-${events.next.end}${events.next.split ? ` (split at ${parseDate(events.next.splitTime)})` : ``}</p>`;
          document.getElementById("classSync").parentElement.classList.remove('cs-icon');
          document.getElementById('sp-err').style.display = 'none';
          document.getElementById('sp-nc').style.display = 'none';
          Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
            if (!['sp-nc','sp-err'].includes(c.id)) {
              c.remove()
            }
          })
          events.joined.forEach(e=>{
            var sp_class = document.createElement('div')
            sp_class.innerHTML = `<div class="spt">${e.now ? `<i class="fa-solid fa-chalkboard-user"></i>` : e.next ? `<i class="fa-solid fa-caret-right" style="margin-left: 14.39px;"></i>` : `<i style="margin-left: 24px;"></i>`} ${e.summary}</div><div class="sptl">${e.location?`<i class="fa-solid fa-location-dot"></i> ${e.location}`:''}</div><div class="spti"><i class="fa-solid fa-clock"></i> ${e.start.slice(-2) == e.end.slice(-2) ? e.start.slice(0, -3) : e.start}-${e.end}${e.split ? ` (split at ${parseDate(e.splitTime)})` : ``}</div>`;
            sp_class.classList.add('sneakpeek-card');
            document.getElementById('sp-c').appendChild(sp_class);
          })
          document.querySelector('.sneakpeek-background').style.height = `calc(10vh + ${document.querySelector('.sneakpeek-content').clientHeight}px)`;
        } else {
          document.getElementById("classSync").innerHTML = '<i class="fa-regular fa-calendar-minus"></i>';
          document.getElementById('classSync').parentElement.classList.add('cs-icon');
          document.getElementById('sp-err').style.display = 'none';
          document.getElementById('sp-nc').style.display = events.joined.find(e=>e.now) ? 'none' : 'flex';
          Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
            if (!['sp-nc','sp-err'].includes(c.id)) {
              c.remove()
            }
          })
          events.joined.forEach(e=>{
            var sp_class = document.createElement('div')
            sp_class.innerHTML = `<div class="spt">${e.now ? `<i class="fa-solid fa-chalkboard-user"></i>` : e.next ? `<i class="fa-solid fa-caret-right" style="margin-left: 14.39px;"></i>` : `<i style="margin-left: 24px;"></i>`} ${e.summary}</div><div class="sptl">${e.location?`<i class="fa-solid fa-location-dot"></i> ${e.location}`:''}</div><div class="spti"><i class="fa-solid fa-clock"></i> ${e.start.slice(-2) == e.end.slice(-2) ? e.start.slice(0, -3) : e.start}-${e.end}${e.split ? ` (split at ${parseDate(e.splitTime)})` : ``}</div>`;
            sp_class.classList.add('sneakpeek-card');
            document.getElementById('sp-c').appendChild(sp_class);
          })
          document.querySelector('.sneakpeek-background').style.height = `calc(10vh + ${document.querySelector('.sneakpeek-content').clientHeight}px)`;
          document.getElementById('sp-nc').innerHTML = events.joined.find(e=>e.now) ? '' : `<div class="spt"><i class="fa-regular fa-calendar-minus"></i> ${events.today.length ? 'No more classes for today' : 'No classes today'}</div>`;
        }
        last_events = events;
        errors.saveSessionOfType("ClassSync");
        t = setTimeout(() => { classSyncLock = false; ClassSync(); }, (60 - new Date().getSeconds()) * 1000);
      })
      .catch(error => {
        errors.new(JSON.stringify(error, Object.getOwnPropertyNames(error)), "ClassSync");
        consol.error(error, "ClassSync")
        document.getElementById("classSync").innerHTML = `<i class="fa-solid ${sts != 404 ? 'fa-cloud-exclamation' : 'fa-cloud-xmark'}"></i><p style="font-size:8px;">${sts != 404 ? `Retrying...` : `Link Error`}</p>`;
        document.getElementById("classSync").parentElement.classList.add('cs-icon');
        document.getElementById('sp-nc').style.display = 'none';
        document.getElementById('sp-err').style.display = 'flex';
        document.getElementById('sp-err').innerHTML = `<div class="spt">${sts != 404 ? `<i class="fa-solid fa-cloud-exclamation"></i> An error has occured` : `<i class="fa-solid fa-cloud-xmark"></i> Link did not work.`}</div><div class="spti">${sts != 404 ? `Retrying...` : `Please check your link and try again.`}</div>`;
        document.querySelector('.sneakpeek-background').style.height = `calc(10vh + ${document.querySelector('.sneakpeek-content').clientHeight}px)`;
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
      })
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
    document.getElementById('sp-err').style.display = 'flex';
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
  if (localStorage.getItem('compass-cal')) {
    calActive = true;
    calActiveText.textContent = "✓ Active";
    calActiveText.setAttribute("active", "");
    devButton.setAttribute("visible", "");
    subButton.setAttribute("hidden", "");
    inputText.setAttribute("hidden", "");
    document.getElementById("header-classSync").style.display = 'block';
    ClassSync();
  }
  function setupSP() {
    let spOpen = false;

    function openSP() {
      canSearch = false;
      document.querySelector('.sneakpeek-container').style.display = '';
      document.addEventListener('keydown', keyCloseSP);
      setTimeout(() => {
        document.querySelector('.sneakpeek-overlay').style.opacity = 1;
        document.querySelector('.sneakpeek-background').classList.add('active');
        document.querySelector('.sneakpeek-background').style.height = `calc(10vh + ${document.querySelector('.sneakpeek-content').clientHeight}px)`;
        contentDiv.classList.add('hide');
      }, 100);
      spOpen = true;
    }

    function closeSP() {
      if (!spOpen) return;
      document.querySelector('.sneakpeek-container').style.display = 'block';
      document.querySelector('.sneakpeek-overlay').style.opacity = 0;
      document.querySelector('.sneakpeek-background').classList.remove('active');
      contentDiv.classList.remove('hide');
      document.removeEventListener('keydown', keyCloseSP);
      setTimeout(() => {
        document.querySelector('.sneakpeek-container').style.display = 'none';
        spOpen = false;
        canSearch = true;
      }, 300);
    }
    function keyCloseSP(e) {
      if (e.key == "Escape" || e.key == "Enter") {
        closeSP()
      }
    }
    document.getElementById("header-classSync").addEventListener('click', (event) => {
      if (spOpen) {
        closeSP();
      } else {
        openSP(event);
      }
    });
    document.getElementById('sneakpeek-close').addEventListener('click', closeSP);
    document.querySelector('.sneakpeek-overlay').addEventListener('click', closeSP);
  }
  setupSP();
  
  const settingsContainer = document.querySelector('.settings-container');
  const settingsOverlay = document.querySelector('.settings-overlay');
  const settingsBackground = document.querySelector('.settings-background');
  const settingsButton = document.querySelector('.settings-button');
  let settingsOpen = false
  
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
    document.addEventListener('keydown', keyCloseSM);
    if (!settingsOpen) {
      canSearch = false;
      settingsContainer.style = ''
      setTimeout(() => {
        settingsBackground.classList.add('active');
        settingsOverlay.classList.add('active');
        contentDiv.classList.add('hide'); 
        settingsButton.classList.add('active');
        settingsOpen = true
      }, 1);
    }
  }
  
  function closeSettingsMenu(e) {
    document.removeEventListener('keydown', keyCloseSM);
    settingsOpen = false
    canSearch = true;
    settingsBackground.classList.remove('active');
    settingsOverlay.classList.remove('active');
    contentDiv.classList.remove('hide');
    settingsButton.classList.remove('active');
    setTimeout(() => {
      settingsContainer.style.display = 'none';
    }, 300);
  }
  
  function keyCloseSM(e) {
    if (e.key == "Escape") {
      closeSettingsMenu()
    }
  }
  
  document.getElementById("settings-close").addEventListener("click",closeSettingsMenu)
  document.getElementById("customise-page").addEventListener('click', (event) => {
    window.open("./customise", '_self');
  })

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
      document.getElementById("cards-error").innerHTML = "<h2>You don't have any buttons</h2><h3>Visit the <a href='/customise' style='cursor:pointer;color:#b53e3e;font-style:italic;'>customisation centre</a> to add some.</h3>";
      return;
    }
    document.querySelector('.cards').innerHTML = "";
    bl.buttons.forEach((v, i) => {v.id = i;});
    bl.buttons.forEach(v=>{
      var button = document.createElement('div');
      button.classList.add("card");
      button.innerHTML = `<img src="${v.icon}" alt="${v.name} Icon"><div class="overlay"><p>${v.name}${v.cid != undefined && typeof Number(v.cid) == "number" ? ` <i class="fa-solid fa-circle-user" style="color:#b5004b;"></i>` : ``}</p></div>`;
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
    })
  }
  var bl = {};
  var cbl = {};

  if (localStorage.getItem("buttonlayout")) {
    if (!jsonCheck(localStorage.getItem("buttonlayout"))) {
      consol.log("Failed to parse buttonlayout, resetting", "Buttons")
      alertSystem.callAlert("Button Layout Reset", "An error was detected in your button layout.\n It has been reset to the default configuration.")
      localStorage.setItem("old-buttonlayout", localStorage.getItem("buttonlayout"))
      localStorage.removeItem("buttonlayout")
      fetch("/def/def.json")
        .then(function(res) {
          return res.text()
        })
        .then(function(def) {
          let vdef = JSON.parse(def)
          vdef.defaultButtons = Array.isArray(vdef.buttons) ? vdef.buttons.map(x => (x.pid)) : [];
          vdef.buttons.forEach((v, i) => {v.id = i;});
          vdef.all = Array.isArray(vdef.all) ? vdef.all.map(x => (x.pid)) : [];
          localStorage.setItem("buttonlayout", JSON.stringify(vdef))
          bl = JSON.parse(localStorage.getItem("buttonlayout"))
          loadLS()
        })
        .catch(function(e) {
          consol.error("Failed to fetch buttons", "Buttons")
          alertSystem.callAlert("Failed to load buttons", "The server didn't respond.")
          document.getElementById("cards-error").innerHTML = "<h2>Failed to load your buttons</h2>";
        });
    } else {
      bl = JSON.parse(localStorage.getItem("buttonlayout"));
      fetch("./def/def.json")
        .then(function(res) {
          return res.text()
        })
        .then(function(defbl) {
          if (bl.v != JSON.parse(defbl).v) {
            let vdefbl = JSON.parse(defbl);
            vdefbl.defaultButtons = Array.isArray(vdefbl.buttons) ? vdefbl.buttons.map(x => (x.pid)) : [];
            vdefbl.buttons = bl.buttons;
            vdefbl.buttons.forEach((v, i) => {v.id = i;});
            vdefbl.all = Array.isArray(vdefbl.all) ? vdefbl.all.map(x => (x.pid)) : [];
            localStorage.setItem("buttonlayout", JSON.stringify(vdefbl));
            bl = JSON.parse(localStorage.getItem("buttonlayout"));
            if (jsonCheck(localStorage.getItem("custombuttonlist")) && localStorage.getItem("custombuttonlist")) {
              let preCBL = JSON.parse(localStorage.getItem("custombuttonlist"))
              preCBL.cButtons = preCBL.cButtons.filter(cButton => {
                return (typeof cButton.name === 'string' && cButton.name.length > 0 && cButton.name.length <= 15 && typeof cButton.icon === 'string' && cButton.icon.startsWith('data:image/') && typeof cButton.url === 'string' && isValidUrl(cButton.url));
              });
              cbl = preCBL;
            }
            loadLS();
          } else {
            let vdefbl = JSON.parse(defbl);
            if (!bl.defaultButtons) {
              bl.defaultButtons = Array.isArray(vdefbl.buttons) ? vdefbl.buttons.map(x => (x.pid)) : [];
              localStorage.setItem("buttonlayout", JSON.stringify(bl));
            }
            if (!bl.all) {
              bl.all = Array.isArray(vdefbl.all) ? vdefbl.all.map(x => (x.pid)) : [];
              localStorage.setItem("buttonlayout", JSON.stringify(bl));
            }
            if (jsonCheck(localStorage.getItem("custombuttonlist")) && localStorage.getItem("custombuttonlist")) {
              let preCBL = JSON.parse(localStorage.getItem("custombuttonlist"))
              preCBL.cButtons = preCBL.cButtons.filter(cButton => {
                return (typeof cButton.name === 'string' && cButton.name.length > 0 && cButton.name.length <= 15 && typeof cButton.icon === 'string' && cButton.icon.startsWith('data:image/') && typeof cButton.url === 'string' && isValidUrl(cButton.url));
              });
              cbl = preCBL;
            }
            
            let len = structuredClone(bl.buttons.length);
            bl.buttons.length = bl.buttons.length > 25 ? 25 : bl.buttons.length;
            Promise.all(bl.buttons.map((b)=> new Promise((resolve, reject)=>{
              let tasks = {a:'required'}
              if (!b.name || !b.icon || !b.url ) {b.tagged = true;resolve();};
              if (b.pid != undefined && typeof Number(b.pid) == "number" && vdefbl.all.filter(d=>d.pid==b.pid).length == 0) {b.tagged = true;resolve();} else if (b.pid != undefined && typeof Number(b.pid) == "number") {
                let li = vdefbl.all.filter(d=>d.pid==b.pid)[0];
                ['name', 'icon', 'url'].forEach(p => {
                  if (li[p] && (b[p] != li[p])) b[p] = li[p];
                });
                if (li.param && !b.param) b.param = li.param;
                else if (!li.param && b.param) delete b.param;
                else if (li.param && b.param && li.param !== b.param) b.param = li.param;
                if (li.popup && !b.popup) b.popup = structuredClone(li.popup);
                else if (!li.popup && b.popup) delete b.popup;
                else if (li.popup && b.popup && JSON.stringify(li.popup) !== JSON.stringify(b.popup)) b.popup = structuredClone(li.popup);
                tasks.a = true;
              } else if (b.cid != undefined && typeof Number(b.cid) == "number") {
                let li = cbl.cButtons.filter(d=>d.cid==b.cid)[0];
                if (!li) {b.tagged = true;resolve();};
                ['name', 'icon', 'url'].forEach(p => {
                  if (li[p] && (b[p] != li[p])) b[p] = li[p];
                });
                if (li.param && !b.param) b.param = li.param;
                else if (!li.param && b.param) delete b.param;
                else if (li.param && b.param && li.param !== b.param) b.param = li.param;
                if (li.popup && !b.popup) b.popup = structuredClone(li.popup);
                else if (!li.popup && b.popup) delete b.popup;
                else if (li.popup && b.popup && JSON.stringify(li.popup) !== JSON.stringify(b.popup)) b.popup = structuredClone(li.popup);
                tasks.a = true;
              };

              let c = true;
              for (const [k, v] of Object.entries(tasks)) {
                if (v == 'required') {
                  consol.warn(`Failed to fetch "${b.name}" button, task '${k}' failed.`, "Buttons");
                  b.tagged = true;
                } else if (v == 'res') {
                  c = false;
                } else if (!v) {
                  consol.warn(`Task ${k} for "${b.name}" button was incomplete.`, "Buttons");
                }
              }
              if (c) resolve();
            }))).then(()=>{
              let rm = 0;
              bl.buttons.filter(b=>b.tagged).forEach((b)=>{
                rm++;
                bl.buttons.splice(bl.buttons.indexOf(b), 1);
              })
              let errmsg = "";
              if (rm) {errmsg += `${rm == 1 ? 'A' : rm} button${rm > 1 ? 's were' : ' was'} removed.`};
              if (len > 25) {errmsg += `\nYou have reached the button limit, the first 25 were kept, the remaining ${len-25 == 1 ? 'button' : `${len-25} buttons`} ${len-25 == 1 ? 'was' : 'were'} removed.`};
              if (errmsg) alertSystem.callAlert("Button Layout Updated", errmsg, {});
              localStorage.setItem("buttonlayout", JSON.stringify(bl));
              loadLS();
            }).then(()=>{
              checkForNewDefaultButtons(defbl);
            });
          }
        })
        .catch(function(e) {
          consol.error(`Failed to fetch buttons, ${e}`, "Buttons")
          alertSystem.callAlert("Failed to load buttons", "The server didn't respond.")
          document.getElementById("cards-error").innerHTML = "<h2>Failed to load your buttons</h2>";
        });
    }
    
  } else {
    fetch("./def/def.json")
      .then(function(res) {
          return res.text()
      })
      .then(function(def) {
        let vdef = JSON.parse(def)
        vdef.defaultButtons = Array.isArray(vdef.buttons) ? vdef.buttons.map(x => (x.pid)) : [];
        vdef.all = Array.isArray(vdef.all) ? vdef.all.map(x => (x.pid)) : [];
        localStorage.setItem("buttonlayout", JSON.stringify(vdef));
        bl = JSON.parse(localStorage.getItem("buttonlayout"))
        loadLS()
      })
      .catch(function(err) {
        consol.error(err, "Buttons")
        alertSystem.callAlert("Failed to load buttons", "The server didn't respond.")
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
        document.removeEventListener('keydown', keyCloseA);
        alertOverlay.removeEventListener('click', resFalse);
        alertOk.removeEventListener('click', resTrue);
        showCancel ? alertCancel.removeEventListener('click', resFalse) : null;
        alertOverlay.style.opacity = 0;
        alertBackground.classList.remove('active');
        contentDiv.classList.remove('hide');
        setTimeout(() => {
          alertContainer.style.display = 'none';
          alertTitle.innerText = "Alert";
          alertMessage.innerText = "Message";
          alertOk.innerText = "OK";
          alertCancel.style.display = 'none'
          alertCancel.innerText = "Cancel";
        }, 300);
      }
      
      function keyCloseA(e) {if (e.key == "Escape") {closeAlert();resolve(false);}}
      function resTrue() {closeAlert();resolve(true);}
      function resFalse() {closeAlert();resolve(false);}
      
      alertOverlay.addEventListener('click', resFalse);
      alertOk.addEventListener('click', resTrue);
      showCancel ? alertCancel.addEventListener('click', resFalse) : null;
      document.addEventListener('keydown', keyCloseA);
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
          <img src="${button.icon}" alt="${button.name} Icon">
          <div class="overlay"><p>${button.name}</p></div>
        `;
        cardsContainer.appendChild(card);
      });

      if (options.added) {
        if (originalLength + newButtons.length <= 25) {
          message.innerHTML = `${newButtons.length==1?`This button has`:`These buttons have`} been added to your configuration. To remove ${newButtons.length==1?`it`:`them`}, please visit the <a href='/customise' style='cursor:pointer;font-style:italic;'>customisation centre</a>.`;
        } else if (originalLength < 25 && originalLength + newButtons.length > 25) {
          const excess = originalLength + newButtons.length - 25;
          message.innerHTML = `The first ${newButtons.length - excess == 1 ? `button has`:`${newButtons.length - excess} of these buttons have`} been added.<br>To add the rest, please remove some cards through the <a href='/customise' style='cursor:pointer;font-style:italic;'>customisation centre</a>.`;
        } else if (originalLength == 25) {
          message.innerHTML = `To add these buttons, please remove some cards through the <a href='/customise' style='cursor:pointer;font-style:italic;'>customisation centre</a>.`;
        }
      } else {
        message.innerHTML = `${newButtons.length==1?`This button is`:`These buttons are`} now available in the <a href='/customise' style='cursor:pointer;font-style:italic;'>customisation centre</a>. Visit it to add ${newButtons.length==1?`this button`:`them`} to your configuration.`;
      }

      container.style.display = '';
      setTimeout(() => {
        overlay.style.opacity = 1;
        background.classList.add('active');
        contentDiv.classList.add('hide');
      }, 100);

      function closeDialog() {
        document.removeEventListener('keydown', keyCloseDialog);
        overlay.style.opacity = 0;
        background.classList.remove('active');
        contentDiv.classList.remove('hide');
        setTimeout(() => {
          container.style.display = 'none';
        }, 300);
        resolve();
      }

      function keyCloseDialog(e) {
        if (e.key === "Escape" || e.key === "Enter") {
          closeDialog();
        }
      }

      okBtn.addEventListener('click', closeDialog, { once: true });
      overlay.addEventListener('click', closeDialog, { once: true });
      document.addEventListener('keydown', keyCloseDialog);
    });
  }
  
  function checkForNewDefaultButtons(defbl) {
    try {
      const vdefbl = JSON.parse(defbl);

      if (!bl.defaultButtons || !bl.all) return;
      // legacy support
      const defaultPids = Array.isArray(bl.defaultButtons) && bl.defaultButtons.every(b => typeof b === 'number') ? bl.defaultButtons : bl.defaultButtons.map(b => b.pid);
      const allPids = Array.isArray(bl.all) && bl.all.every(b => typeof b === 'number') ? bl.all : bl.all.map(b => b.pid);
      const originalLength = structuredClone(bl.buttons.length);

      const newInButtons = Array.isArray(vdefbl.buttons) ? vdefbl.buttons.filter(b => !defaultPids.includes(b.pid)) : [];
      const newInAll = Array.isArray(vdefbl.all) ? vdefbl.all.filter(b => !allPids.includes(b.pid)) : [];
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
      localStorage.setItem("buttonlayout", JSON.stringify(bl));
    } catch (error) {
      consol.error(`Error checking for new buttons: ${error}`, "Buttons");
    }
  }
  console.log(`                ,---,.   ,----..   \n       ,---.  ,'  .'  \\ /   /   \\  \n      /__./|,---.' .' ||   :     : \n ,---.;  ; ||   |  |: |.   |  ;. / \n/___/ \\  | |:   :  :  /.   ; /--\`  \n\\   ;  \\ ' |:   |    ; ;   | ;     \n \\   \\  \\: ||   :     \\|   : |     \n  ;   \\  ' .|   |   . |.   | '___  \n   \\   \\   ''   :  '; |'   ; : .'| \n    \\   \`  ;|   |  | ; '   | '/  : \n     :   \\ ||   :   /  |   :    /  \n      '---\" |   | ,'    \\   \\ .'   \n            \`----'       \`---\`     \nIntranet ${version}`)
})();