(() => {
const version = "v1.6.1";

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

const cardinserts = document.querySelectorAll('.insert');
cardinserts.forEach(insert => {
  insert.addEventListener('mouseup', (e) => {
    var card = insert.parentElement;
    if (e.button == 1 || e.button == 0) {
      if (bl.buttons.length >= 25) {
        document.getElementById("preset-error").innerText = "You have reached the maximum amount of icons (25)"
        setTimeout(()=>{
          document.getElementById("preset-error").innerText = ""
        }, 3000)
        return
      }
      const href = card.getAttribute('data-href');
      if (card.getAttribute('data-style')) updateLS(true, 0, card.children[2].children[0].innerText, card.children[0].src, href, card.getAttribute('data-style')); else if (card.getAttribute('data-preset-id')) updateLS(true, 0, card.children[2].children[0].innerText, card.children[0].src, href, '', card.getAttribute('data-preset-id')); else updateLS(true, 0, card.children[2].children[0].innerText, card.children[0].src, href)
      
      loadLS()
      closeAddMenu();
    }
  });
});

const backBtn = document.querySelector('.backbtn');

backBtn.addEventListener('click', (event) => {
  window.open('/', '_self');
});

const buttonContainer = document.querySelector('.cards');
const addContainer = document.querySelector('.add-container');
const addOverlay = document.querySelector('.add-overlay');
const addBackground = document.querySelector('.add-background');
const addButton = document.querySelector('.plus');
let addOpen = false

addButton.addEventListener('click', () => {
  openAddMenu();
});

addOverlay.addEventListener('click', () => {
  closeAddMenu();
});

addBackground.addEventListener('click', (event) => {
  event.stopPropagation();
});

function openAddMenu() {
  if (!addOpen) {
    canSearch = false;
    addContainer.style = ''
    setTimeout(() => {
      addBackground.classList.add('active');
      addOverlay.classList.add('active');
      addOpen = true
    }, 1);
  }
}

function closeAddMenu() {
  addOpen = false
  canSearch = true;
  addBackground.classList.remove('active');
  addOverlay.classList.remove('active');
  setTimeout(() => {
    addContainer.style.display = 'none';
  }, 300);
}
document.getElementById("add-close").addEventListener("click",closeAddMenu);

function updateLS(a, id, name, icon, url, param, presetId) {
  if (a && name && icon && url && param && bl.buttons.length < 25) {
    bl.buttons.push({name:name,icon:icon,url:url,param:param,id:bl.buttons.length})
    localStorage.setItem("buttonlayout", JSON.stringify(bl))
  } else if (a && name && icon && url && presetId && bl.buttons.length < 25) {
    bl.buttons.push({name:name, icon:icon, url:url,id:bl.buttons.length,pid:presetId})
    localStorage.setItem("buttonlayout", JSON.stringify(bl))
  } else if (a && name && icon && url && bl.buttons.length < 25) {
    bl.buttons.push({name:name, icon:icon, url:url,id:bl.buttons.length})
    localStorage.setItem("buttonlayout", JSON.stringify(bl))
  } else if (!a) {
    bl.buttons.forEach(v=>{
      if (v.id == id) {
        bl.buttons.splice(bl.buttons.indexOf(v), 1)
        bl.buttons.forEach(v=>{
          if (v.id > id) {
            v.id--
          }
        })
        localStorage.setItem("buttonlayout", JSON.stringify(bl))
      }
    })
  }
}

function loadLS() {
  Array.from(document.querySelector('.cards').children).forEach(function(child) {
    if (!child.classList.contains('plus')) {
      document.querySelector('.cards').removeChild(child);
    }
  });
  bl.buttons.forEach(v=>{
      buttonContainer.innerHTML += `<div class="card" data-href="${v.url}" data-id="${v.id}"><img src="${v.icon}"><div class="remove">-</div><div class="cardname"><h3>${v.name}</h3></div></div>`
    setTimeout(()=>{
      document.querySelector(`[data-id="${v.id}"]`).children[1].addEventListener('mouseup', (e) => {
        if (e.button == 1 || e.button == 0) {
          const id = v.id;
          updateLS(false, id)
          loadLS()
        }
      });
    },500)
  })
}

(()=>{
  fetch("/customise/def.json")
    .then(function(res) {
      return res.text()
    })
    .then(function(defbl) {
      JSON.parse(defbl).all.forEach((b)=>{
        var a = document.createElement('div');
        a.classList.add("preset-card");
        a.setAttribute("data-href", b.url);
        a.setAttribute("data-preset-id", b.pid);
        a.innerHTML = `<img src="${b.icon}"><div class="insert">+</div><div class="preset-cardname"><h3>${b.name}</h3></div>`;
        document.getElementById("preset-cards").append(a);
      })
    })
    .then(function() {
      const presetInserts = document.querySelectorAll('.insert');
      presetInserts.forEach(insert => {
        insert.addEventListener('mouseup', (e) => {
          var card = insert.parentElement;
          if (e.button == 1 || e.button == 0) {
            if (bl.buttons.length >= 25) {
              document.getElementById("preset-error").innerText = "You have reached the maximum amount of icons (25)"
              setTimeout(()=>{
                document.getElementById("preset-error").innerText = ""
              }, 3000)
              return
            }
            const href = card.getAttribute('data-href');
            if (card.getAttribute('data-style')) updateLS(true, 0, card.children[2].children[0].innerText, card.children[0].src, href, card.getAttribute('data-style')); else if (card.getAttribute('data-preset-id')) updateLS(true, 0, card.children[2].children[0].innerText, card.children[0].src, href, '', card.getAttribute('data-preset-id')); else updateLS(true, 0, card.children[2].children[0].innerText, card.children[0].src, href)
            
            loadLS()
            closeAddMenu();
          }
        });
      });
    })
    .catch(function(e) {
      consol.error("Failed to fetch pesets", "Presets")
    });
})();
/*Array.from(document.querySelector('.cards').children).forEach(function(child) {
  if (!child.classList.contains('plus')) {
    document.querySelector('.cards').removeChild(child);
  }
});
loadLS()*/
function jsonCheck(json) {
  try {
    JSON.parse(json)
  } catch {
    return false
  }
  return true
}
var bl = {}
if (localStorage.getItem("buttonlayout")) {
  if (!jsonCheck(localStorage.getItem("buttonlayout"))) {
    consol.log("Failed to parse buttonlayout, resetting", "Buttons")
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
      });
  } else {
    bl = JSON.parse(localStorage.getItem("buttonlayout"))
    loadLS()
  }
} else {
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
    });
}

document.getElementById("reset").addEventListener("mouseup",()=>{
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
    });
})

document.getElementById("plus").addEventListener("mouseup",openAddMenu);

console.log(`                ,---,.   ,----..   \n       ,---.  ,'  .'  \\ /   /   \\  \n      /__./|,---.' .' ||   :     : \n ,---.;  ; ||   |  |: |.   |  ;. / \n/___/ \\  | |:   :  :  /.   ; /--\`  \n\\   ;  \\ ' |:   |    ; ;   | ;     \n \\   \\  \\: ||   :     \\|   : |     \n  ;   \\  ' .|   |   . |.   | '___  \n   \\   \\   ''   :  '; |'   ; : .'| \n    \\   \`  ;|   |  | ; '   | '/  : \n     :   \\ ||   :   /  |   :    /  \n      '---\" |   | ,'    \\   \\ .'   \n            \`----'       \`---\`     \nIntranet ${version}`)
})();
