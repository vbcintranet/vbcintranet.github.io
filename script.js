(() => {
const version = "v1.6.9";

const consol = {
  log: (message, title="Core", colour="#FF6961") => { console.log(`%c(${title}) %c${message}`, `color:${colour};font-weight:bold`, "") },
  warn: (message, title="Core") => { console.warn(`%c(${title}) %c${message}`, `color:#FFD699;font-weight:bold`, "") },
  error: (message, title="Core") => { console.error(`%c(${title}) %c${message}`, `color:#FFB3B3;font-weight:bold`, "") }
}

document.addEventListener('mousedown', e => { if (e.button == 1) { e.preventDefault() } });

function updateClock() {
  var dayarray = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
  var montharray = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")
  let now = new Date();
  let date = now.getDate();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDay();
  let datesuffix = "th"
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  let period = "AM";

  hours == 0 ? ()=>{hours=12; period="AM"} : hours == 12 ? period="PM" : hours > 11 ? hours-=12 : period="PM"

  if (!(String(date)[0] == "1" && String(date).length == 2)) {
    switch (date % 10) {
      case 1:
        datesuffix = "st"
        break;
      case 2:
        datesuffix = "nd"
        break;
      case 3:
        datesuffix = "rd"
        break;
    }
  }
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;
  document.getElementById("clock").innerText = dayarray[day] + ', ' + date + datesuffix + ' ' + montharray[month] + ' ' + year + ', ' + hours + ':' + minutes + ':' + seconds + ' ' + period;
  let t = setTimeout(function() { updateClock() }, 1000);
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
  document.getElementById("classSync").innerHTML = 'Network reconnected<p style="font-size:0.5em;">Fetching info...</p>';
  clearTimeout(t);
  writeNext();
  if (calActive) {
    calActiveText.textContent = "✓ Active";
    calActiveText.setAttribute("active", "");
    calActiveText.removeAttribute("error");
  }
});
window.addEventListener('offline', () => {
  consol.warn("Running on offline mode", "Network");
  isOnline = false;
  clearTimeout(t);
  document.getElementById("classSync").innerHTML = 'Network disconnected<p style="font-size:0.5em;">Please reconnect</p>';
  if (calActive) {
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
          writeNext();
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

function writeNext() {
  if (!localStorage.getItem('compass-cal')) {
    document.getElementById("classSync").innerText = "";
    return null;
  }
  if (!isOnline) return;
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
      const currentTime = new Date();
      const allEvents = [];

      let nextEvent = null;
      let nextEventDate = null;
      function getEvents() {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (line.startsWith('BEGIN:VEVENT')) {
            eventData = {};
          } else if (line.startsWith('END:VEVENT')) {
            allEvents.push(eventData)
            if (nextEventDate === null || (eventDate < nextEventDate && eventDate > currentTime)) {
              nextEvent = eventData;
              nextEventDate = eventDate;
              nextEvent.split = false;
            }
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
          } else if (line.startsWith('LOCATION:')) {
            const location = line.substring(9);
            eventData.location = location.trim();
          }
        }
      }
      
      function joinEvents() {
        allEvents.forEach(e=>{
          if (nextEvent.endraw.getTime() == e.startraw.getTime() && nextEvent.summary == e.summary) {
            if (e.location != nextEvent.location) {
              nextEvent.location += ` (B: ${e.location})`
            }
            nextEvent.endraw = e.endraw;
            nextEvent.end = parseDate(e.endraw);
            nextEvent.endDate = e.endraw.toLocaleString();
            return;
          } else if (nextEvent.startraw.getTime() == e.endraw.getTime() && nextEvent.summary == e.summary) {
            if (e.location != nextEvent.location) {
              nextEvent.location += ` (B: ${e.location})`
            }
            nextEvent.startraw = e.startraw;
            nextEvent.start = parseDate(e.startraw);
            nextEvent.endDate = e.startraw.toLocaleString();
            return;
          } else if (nextEvent.endraw.getTime() == e.startraw.getTime()) {
            if (nextEvent.startraw.getTime() < new Date().getTime() && e.startraw.getTime() < new Date().getTime()) {
              nextEvent = e;
              return;
            }
            if (e.location != nextEvent.location) {
              nextEvent.summary = `${nextEvent.summary} (in ${nextEvent.location}) and ${e.summary} (in ${e.location})`;
              nextEvent.location = "";
            } else {
              nextEvent.summary = `${nextEvent.summary} and ${e.summary}`;
            }
            nextEvent.endraw = e.endraw;
            nextEvent.end = parseDate(e.endraw);
            nextEvent.endDate = e.endraw.toLocaleString();
            nextEvent.split = true;
            nextEvent.splitTime = e.startraw;
            return;
          } else if (nextEvent.startraw.getTime() == e.endraw.getTime()) {
            if (e.location != nextEvent.location) {
              nextEvent.summary = `${nextEvent.summary} (in ${nextEvent.location}) and ${e.summary} (in ${e.location})`;
              nextEvent.location = "";
            } else {
              nextEvent.summary = `${nextEvent.summary} and ${e.summary}`;
            }
            nextEvent.startraw = e.startraw;
            nextEvent.start = parseDate(e.startraw);
            nextEvent.startDate = e.startraw.toLocaleString();
            nextEvent.split = true;
            nextEvent.splitTime = e.endraw;
            return;
          }
        })
      }
      getEvents()
      joinEvents()
      if (nextEvent != null && nextEvent.startraw.getTime() < new Date().getTime()) {
        let oldEvent = nextEvent;
        nextEvent = null;
        allEvents.forEach(e=>{
          if (nextEvent == null || ((nextEvent.startraw.getTime() < new Date().getTime() || (e.startraw.getTime() > new Date().getTime() && e.startraw.getTime() < nextEvent.startraw.getTime())) && (oldEvent.endraw.getTime() < e.startraw.getTime()))) {
            nextEvent = e;
          } else if (oldEvent.split && oldEvent.splitTime.getTime() == e.startraw.getTime()) {
            nextEvent = e;
          }
        })
        joinEvents()
      }
      
      var endTime = new Date();
      endTime.setHours(23, 59, 59, 0);
      if (nextEvent && nextEvent.start && nextEvent.startraw.getTime() <= endTime.getTime()) {
        document.getElementById("classSync").innerHTML = `Next: ${nextEvent.summary}${nextEvent.location ? ` in ${nextEvent.location}` : ''}. <p style="font-size:0.5em;">${nextEvent.start.slice(-2) == nextEvent.end.slice(-2) ? nextEvent.start.slice(0, -3) : nextEvent.start}-${nextEvent.end}${nextEvent.split ? ` (split at ${parseDate(nextEvent.splitTime)})` : ``}</p>`
      } else {
        document.getElementById("classSync").innerText = 'No more classes for today.'
      }
      t = setTimeout(writeNext, 60000);
    })
    .catch(error => {
      consol.error(error, "ClassSync")
      document.getElementById("classSync").innerHTML = `ClassSync Error<p style="font-size:0.5em;">${sts != 404 ? `An error occured...` : `The link you entered did not work. Please check it and try again.`}</p>`;
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
  return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}).startsWith('00') ? "12" + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}).substring(2) : date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}).replace(/^0+/, '');
}

function parseICSDateTimeString(dateTimeString) {
  const y = parseInt(dateTimeString.substring(0, 4), 10);
  const mo = parseInt(dateTimeString.substring(4, 6), 10) - 1;
  const d = parseInt(dateTimeString.substring(6, 8), 10);
  const h = parseInt(dateTimeString.substring(9, 11), 10) + 11;
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
  writeNext();
}
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
    document.querySelector(".cards").innerHTML += `<div class="card" data-href="${v.url}" data-id="${v.id}" ${v.param ? `data-style="self"` : ""}><img src="${v.icon}"><div class="overlay"><h3>${v.name}</h3></div></div>`
    setTimeout(()=>{
      document.querySelector(`[data-id="${v.id}"]`).addEventListener('mouseup', (e) => {
        if (e.button == 1 || e.button == 0) {
          const url = document.querySelector(`[data-id="${v.id}"]`).getAttribute('data-href');
          const style = document.querySelector(`[data-id="${v.id}"]`).getAttribute('data-style');
            document.querySelector(`[data-id="${v.id}"]`).classList.add('clicked');
          setTimeout(() => {
            window.open(url, style ? `_${style}` : '_blank');
              document.querySelector(`[data-id="${v.id}"]`).classList.remove('clicked');
          }, 200);
        }
      });
    },500)
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
    fetch("/customise/def.json")
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
    fetch("./customise/def.json")
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
            if (b.name != JSON.parse(defbl).all[b.pid].name) b.name = JSON.parse(defbl).all[b.pid].name
            if (b.icon != JSON.parse(defbl).all[b.pid].icon) b.icon = JSON.parse(defbl).all[b.pid].icon
            if (b.url != JSON.parse(defbl).all[b.pid].url) b.url = JSON.parse(defbl).all[b.pid].url
          })
          localStorage.setItem("buttonlayout", JSON.stringify(bl));
          loadLS();
        }
      })
      .catch(function(e) {
        consol.error("Failed to fetch buttons", "Buttons")
        showAlert("Failed to load buttons", "The server didn't respond.")
        document.getElementById("cards-error").innerHTML = "<h2>Failed to load your buttons</h2>";
      });
  }
  
} else {
  fetch("./customise/def.json")
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
  document.querySelector('.alert-background').style.transform = 'translate(-50%, -50%) scale(1)';
  function closeAlert(e) {
    document.removeEventListener('keydown', keyCloseA);
    document.querySelector('.alert-overlay').removeEventListener('click', closeAlert);
    document.getElementById('alert-ok').removeEventListener('click', closeAlert);
    document.querySelector('.alert-overlay').style.opacity = 0;
    document.querySelector('.alert-background').style.transform = 'translate(-50%, -50%) scale(0)';
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
