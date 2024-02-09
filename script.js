const version = "v1.6.0";

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

const subButton = document.getElementById("cal-submit");
const inputText = document.getElementById("cal-input");
const devButton = document.getElementById("cal-deactivate");
const incorrectText = document.getElementById("cal-incorrect");
const calActiveText = document.getElementById("classSyncActive");

subButton.addEventListener('click', (event) => {
  event.preventDefault();
  if (inputText.value.trim() != "") {
    fetch(checkLink(inputText.value))
      .then(response => {
        if (!response.ok) {
          incorrectText.textContent = "Did you input the correct link? Check the <b><a href='/ClassSync.pdf' style='color: #c94545;'>guide</a></b> for help.";
          throw new Error(`Failed to fetch the file. Status: ${response.status}`);
        } else {
          incorrectText.textContent = "";
          calActiveText.textContent = "✓ Active";
          calActiveText.setAttribute("active", "");
          devButton.setAttribute("visible", "");
          subButton.setAttribute("hidden", "");
          inputText.setAttribute("hidden", "");
          localStorage.setItem('compass-cal', checkLink(inputText.value));
          document.getElementById("header-classSync").style.display = 'block';
          writeNext();
        }
        return response.text();
      })
      .catch(error => {
        console.error('Error:', error);
        incorrectText.innerHTML = "Did you input the correct link? Click the <b><a href='/ClassSync.pdf' style='color: #c94545;'>guide</a></b> for help.";
      });
  } else {
    incorrectText.innerHTML = "Please enter a link. Check the <b><a href='/ClassSync.pdf' style='color: #c94545;'>guide</a></b> for help.";
  }
});

devButton.addEventListener('click', (event) => {
  event.preventDefault();
  localStorage.removeItem('compass-cal');
  calActiveText.textContent = "✗ Not Active";
  calActiveText.removeAttribute("active");
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
  fetch(localStorage.getItem('compass-cal'))
    .then(response => {
      if (!response.ok) {
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
            }
          } else if (line.startsWith('SUMMARY:')) {
            const summary = line.substring(8);
            eventData.summary = summary.trim();
          } else if (line.startsWith('DTSTART:')) {
            const startDateString = line.substring(8);
            const startDate = parseICSDateTimeString(startDateString);
            eventDate = startDate;
            eventData.start = startDate.toLocaleTimeString();
            eventData.startraw = startDate;
            eventData.startDate = startDate.toLocaleString();
          } else if (line.startsWith('DTEND:')) {
            const endDateString = line.substring(6);
            const endDate = parseICSDateTimeString(endDateString);
            eventData.end = endDate.toLocaleTimeString();
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
            nextEvent.end = e.endraw.toLocaleTimeString();
            nextEvent.endDate = e.endraw.toLocaleString();
          } else if (nextEvent.startraw.getTime() == e.endraw.getTime() && nextEvent.summary == e.summary) {
            if (e.location != nextEvent.location) {
              nextEvent.location += ` (B: ${e.location})`
            }
            nextEvent.startraw = e.startraw;
            nextEvent.start = e.startraw.toLocaleTimeString();
            nextEvent.endDate = e.startraw.toLocaleString();
          }
        })
      }
      getEvents()
      joinEvents()
      if (nextEvent != null && nextEvent.startraw.getTime() < new Date().getTime()) {
        console.log(nextEvent)
        nextEvent = null;
        getEvents()
      }
      
      var endTime = new Date();
      endTime.setHours(23, 59, 59, 0);
      if (nextEvent && nextEvent.start && nextEvent.startraw.getTime() <= endTime.getTime()) {
        if (nextEvent.location) {
          document.getElementById("classSync").innerHTML = `Next: ${nextEvent.summary} in ${nextEvent.location}. <p style="font-size:0.5em;">${nextEvent.start}-${nextEvent.end}</p>`
        } else {
          document.getElementById("classSync").innerHTML = `Next: ${nextEvent.summary}. <p style="font-size:0.5em;">${nextEvent.start}-${nextEvent.end}</p>`
        }
      } else {
        document.getElementById("classSync").innerText = 'No more events for today.'
      }
      let t = setTimeout(function() { writeNext() }, 60000);
    })
    .catch(error => {
      console.error(error)
      document.getElementById("classSync").innerHTML = 'Network Disconnected<p style="font-size:0.5em;">Retrying...</p>';
      writeNext()
    })
}

function checkLink(link) {
  if (link.startsWith('webcal://')) {
    return 'https://' + link.slice(9);
  }
  return link;
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

function closeSettingsMenu() {
  settingsOpen = false
  canSearch = true;
  settingsBackground.classList.remove('active');
  settingsOverlay.classList.remove('active');
  setTimeout(() => {
    settingsContainer.style.display = 'none';
  }, 300);
}
document.getElementById("customise-page").addEventListener('click', (event) => {
  window.open("/customise", '_self');
})
function loadLS() {
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

if (localStorage.getItem("buttonlayout")) {
  bl = JSON.parse(localStorage.getItem("buttonlayout"));
  fetch("/customise/def.json")
    .then(function(res) {
      return res.text()
    })
    .then(function(defbl) {
      if (bl.v != defbl.v) {
        localStorage.setItem("buttonlayout", defbl)
        bl = JSON.parse(localStorage.getItem("buttonlayout"))
        loadLS();
      } else {
        bl.buttons.forEach((b)=>{
          if (b.name != defbl.buttons[b.presetId].name) b.name = list[b.presetId].name
          if (b.icon != defbl.buttons[b.presetId].icon) b.icon = list[b.presetId].icon
          if (b.url != defbl.buttons[b.presetId].url) b.url = list[b.presetId].url
        })
        localStorage.setItem("buttonlayout", bl);
        loadLS();
      }
    });
} else {
  fetch("/customise/def.json")
    .then(function(res) {
        return res.text()
    })
    .then(function(def) {
      localStorage.setItem("buttonlayout", def)
      bl = JSON.parse(localStorage.getItem("buttonlayout"))
      loadLS()
    });
}

console.log("                ,---,.   ,----..   \n       ,---.  ,'  .'  \\ /   /   \\  \n      /__./|,---.' .' ||   :     : \n ,---.;  ; ||   |  |: |.   |  ;. / \n/___/ \\  | |:   :  :  /.   ; /--`  \n\\   ;  \\ ' |:   |    ; ;   | ;     \n \\   \\  \\: ||   :     \\|   : |     \n  ;   \\  ' .|   |   . |.   | '___  \n   \\   \\   ''   :  '; |'   ; : .'| \n    \\   `  ;|   |  | ; '   | '/  : \n     :   \\ ||   :   /  |   :    /  \n      '---\" |   | ,'    \\   \\ .'   \n            `----'       `---`     ")
console.log(`Intranet ${version}`)
