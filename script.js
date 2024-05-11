(() => {
  const version = "v1.7.4";
  
  const consol = {
    log: (message, title="Core", colour="#FF6961") => { console.log(`%c(${title}) %c${message}`, `color:${colour};font-weight:bold`, "") },
    warn: (message, title="Core") => { console.warn(`%c(${title}) %c${message}`, `color:#FFD699;font-weight:bold`, "") },
    error: (message, title="Core") => { console.error(`%c(${title}) %c${message}`, `color:#FFB3B3;font-weight:bold`, "") }
  }
  
  document.addEventListener('mousedown', e => { if (e.button == 1) { e.preventDefault() } });
  
  function updateClock() {
    let now = new Date()
    document.getElementById("clock").innerText = `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()]}, ${now.getDate()}${(!(String(now.getDate())[0] == "1" && String(now.getDate()).length == 2)&&[1,2,3].includes(now.getDate() % 10))?['st','nd','rd'][(now.getDate() % 10)-1]:'th'} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][now.getMonth()]} ${now.getFullYear()}, ${[0,12].includes(now.getHours()) ? '12' : now.getHours() > 11 ? now.getHours()-12 : now.getHours()}:${now.getMinutes() < 10 ? "0"+now.getMinutes() : now.getMinutes()}:${now.getSeconds() < 10 ? "0"+now.getSeconds() : now.getSeconds()} ${now.getHours() > 11 ? 'PM' : 'AM'}`
    setTimeout(updateClock, 1000);
  }
  updateClock();
  
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
        searchOverlay.classList.add('active');
        searchBar.querySelector('input').focus();
        searchInput.value = key;
        searchOpen = true;
      }, 1);
    }
  }
  
  function closeSearchBar() {
    searchOpen = false
    searchBar.classList.remove('active');
    searchOverlay.classList.remove('active');
    searchBar.querySelector('input').blur();
    searchBar.querySelector('input').value = '';
    setTimeout(() => {
      searchContainer.style.display = 'none';
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
        // var pat2=/^!((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/;
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
  
  let isOnline = true;
  window.addEventListener('online', () => {
    consol.log("Reconnected", "Network");
    isOnline = true;

    function internetAnim() {
      document.getElementById('no-internet').children[1].style.display = "block";
      document.getElementById('no-internet').children[0].style.animation = "none";
      document.getElementById('no-internet').children[0].style.opacity = "1";
      setTimeout(() => {
        document.getElementById('no-internet').children[0].style.transition = "opacity 1s ease";
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
      document.getElementById("classSync").innerHTML = 'Network reconnected<p style="font-size:8px;">Fetching info...</p>';
      document.getElementById('sp-nc').style.display = 'none';
      document.getElementById('sp-nc').innerText = last_events.today.length ? 'No more classes for today' : 'No classes today';
      clearTimeout(t);
      ClassSync();
      calActiveText.textContent = "✓ Active";
      calActiveText.setAttribute("active", "");
      calActiveText.removeAttribute("error");
    }
  });
  window.addEventListener('offline', () => {
    consol.warn("Running on offline mode", "Network");
    isOnline = false;
    document.getElementById('no-internet').style.display = 'block';
    if (calActive) {
      document.getElementById("classSync").innerHTML = last_events.next ? `Next: ${last_events.next.summary}${last_events.next.location ? ` in ${last_events.next.location}` : ''}. <p style="font-size:8px;">${last_events.next.start.slice(-2) == last_events.next.end.slice(-2) ? last_events.next.start.slice(0, -3) : last_events.next.start}-${last_events.next.end}${last_events.next.split ? ` (split at ${parseDate(last_events.next.splitTime)})` : ``} (Warning: Last updated at ${parseDate(last_events.timeChecked)})</p>` : last_events.today.length ? `No more classes for today.<p style="font-size:8px;">Last updated at ${parseDate(last_events.timeChecked)}</p>` : `No classes today.<p style="font-size:8px;">Last updated at ${parseDate(last_events.timeChecked)}</p>`;
      document.getElementById('sp-nc').style.display = 'block';
      document.getElementById('sp-nc').innerText = last_events.next ? `Warning: Network disconnected. Class data last updated at ${parseDate(last_events.timeChecked)}.` : `Warning: Network disconnected. Class data last updated at ${parseDate(last_events.timeChecked)}.\n${last_events.today.length ? `No more classes for today` : `No classes today`}`;
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
        consol.error("Link failed test", "ClassSync-Setup");
        incorrectText.innerHTML = "Did you input the correct link? Visit the guide for help <b><a href='/tutorials/ClassSync.pdf' target='_blank' style='color: #c94545;'>here</a></b>.";
        return;
      }
      fetch(formatCalLink(inputText.value))
        .then(response => {
          if (!response.ok) {
            incorrectText.textContent = "Did you input the correct link? Visit the guide for help <b><a href='/tutorials/ClassSync.pdf' target='_blank' style='color: #c94545;'>here</a></b>.";
            throw new Error(`Failed to fetch the file. Status: ${response.status}`);
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

  function ClassSync() {
    if (!localStorage.getItem('compass-cal')) {
      document.getElementById("classSync").innerText = "";
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
        if (e.endraw.getTime() < new Date().getTime()) {
          tagged.push(e);
        } else if (e.startraw.getTime() <= new Date().getTime() && e.endraw.getTime() > new Date().getTime() && !e.summary.startsWith("Now:")) {
          e.summary = `Now: ${e.summary}`;
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
            events.next = e;
          }
        })
        if (events.next.startraw.getTime() <= new Date().getTime()) {
          events.next = null;
        }
      }

      if (events.next && events.next.start && events.next.startraw.getTime() <= endTime.getTime()) {
        document.getElementById("classSync").innerHTML = `Next: ${events.next.summary}${events.next.location ? ` in ${events.next.location}` : ''}. <p style="font-size:8px;">${events.next.start.slice(-2) == events.next.end.slice(-2) ? events.next.start.slice(0, -3) : events.next.start}-${events.next.end}${events.next.split ? ` (split at ${parseDate(events.next.splitTime)})` : ``} (Warning: Last updated at ${parseDate(events.timeChecked)})</p>`
        document.getElementById('sp-nc').style.display = 'block';
        document.getElementById('sp-nc').innerText = `Warning: Network disconnected. Class data last updated at ${parseDate(events.timeChecked)}.`;
        Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
          if (c.id != 'sp-nc') {
            c.remove()
          }
        })
        events.joined.forEach(e=>{
          var sp_class = document.createElement('div')
          sp_class.innerHTML = `<div class="spt">${e.summary} ${e.location ? ` in ${e.location}` : ''}</div><div class="spti">${e.start.slice(-2) == e.end.slice(-2) ? e.start.slice(0, -3) : e.start}-${e.end}${e.split ? ` (split at ${parseDate(e.splitTime)})` : ``}</div>`
          sp_class.classList.add('sneakpeek-card')
          document.getElementById('sp-c').appendChild(sp_class)
        })
      } else {
        document.getElementById("classSync").innerText = `${events.today.length ? `No more classes for today` : `No classes today`}<p style="font-size:8px;">Class Data last updated at ${parseDate(events.timeChecked)}</p>`
        document.getElementById('sp-nc').style.display = 'block';
        document.getElementById('sp-nc').innerText = `Warning: Network disconnected. Class data last updated at ' + parseDate(events.timeChecked) + '.\n${events.today.length ? `No more classes for today` : `No classes today`}`;
        Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
          if (c.id != 'sp-nc') {
            c.remove()
          }
        })
      }
      t = setTimeout(ClassSync, (60 - new Date().getSeconds()) * 1000);
      return;
    };
    calActiveText.textContent = "✓ Active";
    calActiveText.setAttribute("active", "");
    calActiveText.removeAttribute("error");
    let sts = '';
    fetch(localStorage.getItem('compass-cal'))
      .then(response => {
        if (!response.ok) {
          sts = response.status;
          throw new Error(`Failed to fetch the file. Status: ${response.status}`);
        }
        return response.text();
      })
      .then(fileContents => {
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
              events.next = e;
            }
          })
        }

        function joinEvents() {
          let lastEvent = null;
          events.today.forEach(e=>{
            if (!lastEvent) {lastEvent = e;} else if (lastEvent.startraw.getTime() == e.startraw.getTime()) {events.joined.push(e)} else {
              if (lastEvent.endraw.getTime() == e.startraw.getTime() && lastEvent.summary == e.summary) {
                if (e.location != lastEvent.location) {
                  lastEvent.location += ` (B: ${e.location})`
                }
                lastEvent.endraw = e.endraw;
                lastEvent.end = parseDate(e.endraw);
                lastEvent.endDate = e.endraw.toLocaleString();
                e.tagged = true;
                events.joined.push(lastEvent);
              } else if (lastEvent.startraw.getTime() == e.endraw.getTime() && lastEvent.summary == e.summary) {
                if (e.location != lastEvent.location) {
                  lastEvent.location += ` (B: ${e.location})`
                }
                lastEvent.startraw = e.startraw;
                lastEvent.start = parseDate(e.startraw);
                lastEvent.endDate = e.startraw.toLocaleString();
                e.tagged = true;
                events.joined.push(lastEvent);
              } else if (lastEvent.endraw.getTime() == e.startraw.getTime()) {
                if (lastEvent.startraw.getTime() < new Date().getTime() && e.startraw.getTime() < new Date().getTime()) {
                } else if (e.location != lastEvent.location) {
                  lastEvent.summary = `${lastEvent.summary} (in ${lastEvent.location}) and ${e.summary} (in ${e.location})`;
                  lastEvent.location = "";
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
                  lastEvent.summary = `${lastEvent.summary} (in ${lastEvent.location}) and ${e.summary} (in ${e.location})`;
                  lastEvent.location = "";
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
              !lastEvent.tagged && !e.tagged ? events.joined.push(lastEvent) : null;
              lastEvent = e;
            }
          })

          let tagged = [];
          events.joined.forEach(e=>{
            if (e.endraw.getTime() < new Date().getTime()) {
              tagged.push(e);
            } else if (e.startraw.getTime() <= new Date().getTime() && e.endraw.getTime() > new Date().getTime()) {
              e.summary = `Now: ${e.summary}`;
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
              events.next = e;
            }
          })
          if (events.next && events.next.startraw.getTime() < new Date().getTime()) {
            events.next = null;
          }
        }
        
        if (events.next && events.next.start && events.next.startraw.getTime() <= endTime.getTime()) {
          document.getElementById("classSync").innerHTML = `Next: ${events.next.summary}${events.next.location ? ` in ${events.next.location}` : ''}. <p style="font-size:8px;">${events.next.start.slice(-2) == events.next.end.slice(-2) ? events.next.start.slice(0, -3) : events.next.start}-${events.next.end}${events.next.split ? ` (split at ${parseDate(events.next.splitTime)})` : ``}</p>`
          document.getElementById('sp-nc').style.display = 'none';
          Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
            if (c.id != 'sp-nc') {
              c.remove()
            }
          })
          events.joined.forEach(e=>{
            var sp_class = document.createElement('div')
            sp_class.innerHTML = `<div class="spt">${e.summary} ${e.location ? ` in ${e.location}` : ''}</div><div class="spti">${e.start.slice(-2) == e.end.slice(-2) ? e.start.slice(0, -3) : e.start}-${e.end}${e.split ? ` (split at ${parseDate(e.splitTime)})` : ``}</div>`
            sp_class.classList.add('sneakpeek-card')
            document.getElementById('sp-c').appendChild(sp_class)
          })
        } else {
          document.getElementById("classSync").innerText = events.today.length ? 'No more classes for today' : 'No classes today';
          document.getElementById('sp-nc').style.display = 'block';
          document.getElementById('sp-nc').innerText = events.today.length ? 'No more classes for today' : 'No classes today';
          Array.prototype.slice.call(document.getElementById('sp-c').children).forEach(c=>{
            if (c.id != 'sp-nc') {
              c.remove()
            }
          })
        }
        last_events = events;
        t = setTimeout(ClassSync, (60 - new Date().getSeconds()) * 1000);
      })
      .catch(error => {
        consol.error(error, "ClassSync")
        document.getElementById("classSync").innerHTML = `ClassSync Error<p style="font-size:8px;">${sts != 404 ? `An error occured...` : `The link you entered did not work. Please check it and try again.`}</p>`;
        document.getElementById('sp-nc').style.display = 'block';
        document.getElementById('sp-nc').innerText = sts != 404 ? `An error occured...` : `The link you entered did not work. Please check it and try again.`;
        calActiveText.textContent = "⚠ Error";
        calActiveText.setAttribute("error", "");
        calActiveText.removeAttribute("active");
      })
  }
  let t = setTimeout(function() {return}, 60000);
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
    let last = {x:0,y:0};
    function openSP(e) {
      last.x = e.clientX;
      last.y = e.clientY;
      document.querySelector('.sneakpeek-background').style.transform = 'translate(-50%,-50%) scale(.0000001)';
      document.querySelector('.sneakpeek-background').style.left = e.clientX+"px";
      document.querySelector('.sneakpeek-background').style.top = e.clientY+"px";
      document.querySelector('.sneakpeek-container').style.display = '';
      document.addEventListener('keydown', keyCloseSP);
      setTimeout(() => {
        document.querySelector('.sneakpeek-overlay').style.opacity = 1;
        document.querySelector('.sneakpeek-background').style.transform = 'scale(1)';
        document.querySelector('.sneakpeek-background').style.left = `64vw`;
        document.querySelector('.sneakpeek-background').style.top = `5vh`;
      }, 100);
      spOpen = true;
    }
    function closeSP() {
      document.querySelector('.sneakpeek-container').style.display = 'block';
      document.querySelector('.sneakpeek-overlay').style.opacity = 0;
      document.querySelector('.sneakpeek-background').style.transform = 'translate(-50%,-50%) scale(.0000001)';
      document.querySelector('.sneakpeek-background').style.left = last.x+"px";
      document.querySelector('.sneakpeek-background').style.top = last.y+"px";
      document.removeEventListener('keydown', keyCloseSP);
      setTimeout(() => {
        document.querySelector('.sneakpeek-container').style.display = 'none';
      }, 300);
      spOpen = false;
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
  function loadLS() {
    if (bl.buttons.length == 0) {
      document.getElementById("cards-error").innerHTML = "<h2>You don't have any buttons</h2><h3>Visit the <a href='/customise' style='cursor:pointer;font-weight:bold;color:#b53e3e;'>customisation centre</a> to add some.</h3>";
      return;
    }
    bl.buttons.forEach(v=>{
      var button = document.createElement('div');
      button.classList.add("card");
      button.setAttribute("data-href", v.url);
      button.setAttribute("data-id", v.id);
      v.param ? button.setAttribute("data-style", "self") : null;
      button.innerHTML = `<img src="${v.icon}" alt="${v.name} Icon"><div class="overlay"><p>${v.name}</p></div>`;
      button.addEventListener('click', (e) => {
        if (e.button == 1 || e.button == 0) {
          const url = document.querySelector(`[data-id="${v.id}"]`).getAttribute('data-href');
          const style = document.querySelector(`[data-id="${v.id}"]`).getAttribute('data-style');
            document.querySelector(`[data-id="${v.id}"]`).classList.add('clicked');
          setTimeout(() => {
            window.open(url, style ? `_${style}` : '_blank');
              document.querySelector(`[data-id="${v.id}"]`).classList.remove('clicked');
          }, 200);
        }
      })
      document.querySelector('.cards').appendChild(button)
    })
  }
  function jsonCheck(json) {
    try {
      JSON.parse(json)
    } catch {
      return false
    }
    return true
  }
  if (localStorage.getItem("buttonlayout")) {
    if (!jsonCheck(localStorage.getItem("buttonlayout"))) {
      consol.log("Failed to parse buttonlayout, resetting", "Buttons")
      showAlert("Button Layout Reset", "An error was detected in your button layout, causing it to be reset.")
      localStorage.setItem("old-buttonlayout", localStorage.getItem("buttonlayout"))
      localStorage.removeItem("buttonlayout")
      fetch("/def/def.json")
        .then(function(res) {
          return res.text()
        })
        .then(function(def) {
          let vdef = JSON.parse(def)
          delete vdef.all;
          localStorage.setItem("buttonlayout", JSON.stringify(vdef))
          bl = JSON.parse(localStorage.getItem("buttonlayout"))
          loadLS()
        })
        .catch(function(e) {
          consol.error("Failed to fetch buttons", "Buttons")
          showAlert("Failed to load buttons", "The server didn't respond.")
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
            let vdefbl = JSON.parse(def)
            delete vdefbl.all;
            localStorage.setItem("buttonlayout", JSON.stringify(vdefbl));
            bl = JSON.parse(localStorage.getItem("buttonlayout"));
            loadLS();
          } else {
            bl.buttons.forEach((b)=>{
              if (!b.name || !b.icon || !b.url || (!b.id&&b.id!==0) ) {b.tagged = true;return;};
              if (b.pid && !JSON.parse(defbl).all[b.pid]) {b.tagged = true;return;} else {
                if (b.name != JSON.parse(defbl).all[b.pid].name) b.name = JSON.parse(defbl).all[b.pid].name
                if (b.icon != JSON.parse(defbl).all[b.pid].icon) b.icon = JSON.parse(defbl).all[b.pid].icon
                if (b.url != JSON.parse(defbl).all[b.pid].url) b.url = JSON.parse(defbl).all[b.pid].url
              };
            })
            let rm = 0;
            bl.buttons.filter(b=>b.tagged).forEach((b)=>{
              rm++;
              bl.buttons.splice(bl.buttons.indexOf(b), 1);
            })
            if (rm) {showAlert(`Button Error`, `${rm == 1 ? 'A' : rm} button${rm > 1 ? 's were' : ' was'} removed due to formatting errors.`)}
            localStorage.setItem("buttonlayout", JSON.stringify(bl));
            loadLS();
          }
        })
        .catch(function(e) {
          consol.error(`Failed to fetch buttons, ${e}`, "Buttons")
          showAlert("Failed to load buttons", "The server didn't respond.")
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
        delete vdef.all;
        localStorage.setItem("buttonlayout", JSON.stringify(vdef));
        bl = JSON.parse(localStorage.getItem("buttonlayout"))
        loadLS()
      })
      .catch(function(err) {
        consol.error(err, "Buttons")
        showAlert("Failed to load buttons", "The server didn't respond.")
      });
  }
  
  function showAlert(title, message) {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    document.querySelector('.alert-container').style.display = '';
    document.querySelector('.alert-overlay').style.opacity = 1;
    document.querySelector('.alert-background').classList.add('active');
    function closeAlert(e) {
      document.removeEventListener('keydown', keyCloseA);
      document.querySelector('.alert-overlay').removeEventListener('click', closeAlert);
      document.getElementById('alert-ok').removeEventListener('click', closeAlert);
      document.querySelector('.alert-overlay').style.opacity = 0;
      document.querySelector('.alert-background').classList.remove('active');
      setTimeout(() => {
        document.querySelector('.alert-container').style.display = 'none';
        document.getElementById('alert-title').innerText = "Alert";
        document.getElementById('alert-message').innerText = "Message";
      }, 300);
    }
    function keyCloseA(e) {
      if (e.key == "Escape" || e.key == "Enter") {
        closeAlert()
      }
    }
    document.querySelector('.alert-overlay').addEventListener('click', closeAlert);
    document.getElementById('alert-ok').addEventListener('click', closeAlert);
    document.addEventListener('keydown', keyCloseA);
  }
  
  console.log(`                ,---,.   ,----..   \n       ,---.  ,'  .'  \\ /   /   \\  \n      /__./|,---.' .' ||   :     : \n ,---.;  ; ||   |  |: |.   |  ;. / \n/___/ \\  | |:   :  :  /.   ; /--\`  \n\\   ;  \\ ' |:   |    ; ;   | ;     \n \\   \\  \\: ||   :     \\|   : |     \n  ;   \\  ' .|   |   . |.   | '___  \n   \\   \\   ''   :  '; |'   ; : .'| \n    \\   \`  ;|   |  | ; '   | '/  : \n     :   \\ ||   :   /  |   :    /  \n      '---\" |   | ,'    \\   \\ .'   \n            \`----'       \`---\`     \nIntranet ${version}`)
})();
