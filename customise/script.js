(() => {
  const version = "v1.7.7";

  const consol = {
    log: (message, title = "Core", colour = "#FF6961") => { console.log(`%c(${title}) %c${message}`, `color:${colour};font-weight:bold`, "") },
    warn: (message, title = "Core") => { console.warn(`%c(${title}) %c${message}`, `color:#FFD699;font-weight:bold`, "") },
    error: (message, title = "Core") => { console.error(`%c(${title}) %c${message}`, `color:#FFB3B3;font-weight:bold`, "") }
  }

  document.addEventListener('mousedown', e => { if (e.button == 1) { e.preventDefault() } });

  function updateClock() {
    let now = new Date()
    document.getElementById("clock").innerText = `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()]}, ${now.getDate()}${(!(String(now.getDate())[0] == "1" && String(now.getDate()).length == 2) && [1, 2, 3].includes(now.getDate() % 10)) ? ['st', 'nd', 'rd'][(now.getDate() % 10) - 1] : 'th'} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][now.getMonth()]} ${now.getFullYear()}, ${[0, 12].includes(now.getHours()) ? '12' : now.getHours() > 11 ? now.getHours() - 12 : now.getHours()}:${now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes()}:${now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds()} ${now.getHours() > 11 ? 'PM' : 'AM'}`
    setTimeout(updateClock, 1000);
  }
  updateClock();

  const cardinserts = document.querySelectorAll('.insert');
  cardinserts.forEach(insert => {
    insert.addEventListener('mouseup', (e) => {
      var card = insert.parentElement;
      if (e.button == 1 || e.button == 0) {
        if (bl.buttons.length >= 25) {
          document.getElementById("preset-msg").innerText = "You have reached the maximum amount of icons (25)";
          document.getElementById("preset-msg").classList.add("error");
          setTimeout(() => {
            document.getElementById("preset-msg").innerText = "";
            document.getElementById("preset-msg").classList.remove("error");
          }, 3000)
          return
        }
        let b = {name: card.children[2].children[0].innerText, icon: card.children[0].src, url: card.getAttribute('data-href')};
        if (card.getAttribute('data-style')) b.param = card.getAttribute('data-style');
        if (card.getAttribute('data-preset-id')) b.presetId = card.getAttribute('data-preset-id');
        updateLS(true, b);
        loadLS()
        closeAddMenu();
      }
    });
  });

  const accept = document.getElementById('accept');

  accept.addEventListener('click', (event) => {
    window.open('/', '_self');
  });

  const addContainer = document.querySelector('.add-container');
  const addOverlay = document.querySelector('.add-overlay');
  const addBackground = document.querySelector('.add-background');
  const addButton = document.getElementById('add');
  let addOpen = false

  addButton.addEventListener('click', openAddMenu);

  addOverlay.addEventListener('click', () => {
    closeAddMenu();
  });

  addBackground.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  function openAddMenu() {
    if (!addOpen) {
      document.addEventListener('keydown', keyCloseAM);
      addOpen = true;
      addContainer.style = ''
      setTimeout(() => {
        addBackground.classList.add('active');
        addOverlay.classList.add('active');
      }, 1);
    }
  }

  function closeAddMenu() {
    document.removeEventListener('keydown', keyCloseAM);
    addBackground.classList.remove('active');
    addOverlay.classList.remove('active');
    document.getElementById("preset-msg").innerText = "";
    setTimeout(() => {
      addBackground.classList.remove('active');
      addOverlay.classList.remove('active');
      addContainer.style.display = 'none';
      addOpen = false;
    }, 300);
  }
  document.getElementById("add-close").addEventListener("click", closeAddMenu);

  function keyCloseAM(e) {
    if (e.key == "Escape") {
      closeAddMenu()
    }
  }

  var changes = []
  const $drag = {el: null, id: null, properties: {}, prev: null}

  function updateLS(add, { id, name, icon, url, param, presetId, from }, hide = false) {
    if (add && bl.buttons.length < 25) {
      let b = {}
      name && icon && url ? b = { name, icon, url } : console.error("Missing parameters", "Buttons");
      if (param) b.param = param;
      if (presetId) b.pid = presetId;
      let f = bl.buttons.some(button => button.id === id)
      if (typeof id == 'number' && f) {
        bl.buttons.forEach(v => {
          if (v.id >= id) {
            v.id++;
          }
        });
        b.id = id;
      } else if (typeof id == 'number') b.id = id; else b.id = bl.buttons.length;
      bl.buttons.push(b);
      f ? bl.buttons.sort((a, b) => a.id - b.id) : null;
      let v = structuredClone(b)
      v.a = true;
      v.from = from;
      !hide ? changes.push(v) : null;
      localStorage.setItem("buttonlayout", JSON.stringify(bl));
    } else if (!add) {
      bl.buttons.forEach(v => {
        if (v.id == id) {
          bl.buttons.splice(bl.buttons.indexOf(v), 1)
          bl.buttons.forEach(v => {
            if (v.id > id) {
              v.id--
            }
          })
          v.a = false;
          v.from = from;
          !hide ? changes.push(v) : null
          localStorage.setItem("buttonlayout", JSON.stringify(bl))
        }
      })
    }
  }

  function undoUpdate() {
    if (!changes.length) return;
    typeof changes[changes.length - 1].from == 'number' && changes[changes.length - 1].a ? (()=>{updateLS(false, { id: changes[changes.length - 1].id }, true); updateLS(true, {id: changes[changes.length - 1].from, name: changes[changes.length - 1].name, icon: changes[changes.length - 1].icon, url: changes[changes.length - 1].url, param: changes[changes.length - 1].param, presetId: changes[changes.length - 1].pid}, true)})() : changes[changes.length - 1].a ? updateLS(false, { id: changes[changes.length - 1].id }, true) : updateLS(true, { id: changes[changes.length - 1].id, name: changes[changes.length - 1].name, icon: changes[changes.length - 1].icon, url: changes[changes.length - 1].url, param: changes[changes.length - 1].param, presetId: changes[changes.length - 1].pid }, true);
    changes.length = changes.length - 1 < 0 ? 0 : changes.length - 1;
    loadLS();
  }
  
  function loadLS() {
    Array.from(document.querySelector('.cards').children).forEach(function (child) {
      document.querySelector('.cards').removeChild(child);
    });
    bl.buttons.forEach(v => {
      var button = document.createElement('div')
      button.classList.add("card")
      button.setAttribute("data-href", v.url)
      button.setAttribute("data-id", v.id)
      button.setAttribute("draggable", "true")
      button.innerHTML = `<img src="${v.icon}" alt="${v.name} Icon"><div class="remove">-</div><div class="cardname"><p>${v.name}</p></div>`;
      button.children[1].addEventListener('mouseup', (e) => {
        if (e.button == 1 || e.button == 0) {
          const id = v.id;
          updateLS(false, {id})
          loadLS()
        }
      });
      
      button.addEventListener('dragstart', (e) => {
        $drag.prev = button.cloneNode(true);
        $drag.prev.childNodes[1].remove();
        $drag.prev.style.position = "absolute";
        $drag.prev.style.top = "-1000px";
        $drag.prev.style.border = "3px dashed #888";
        document.body.appendChild($drag.prev);
        e.dataTransfer.setDragImage($drag.prev, 0, 0);
        button.style.opacity = '0.4';
        button.style.border = '3px dashed transparent';
        $drag.el = button;
        $drag.id = v.id;
        const properties = { name: v.name, icon: v.icon, url: v.url };
        v.param ? properties.param = v.param : null;
        v.pid ? properties.presetId = v.pid : null;
        $drag.properties = properties;
      });
      button.addEventListener('dragend', () => {button.style.opacity = ''; button.style.border = ''; $drag.el = null; $drag.id = null; $drag.properties = {}; $drag.prev.remove();});
      button.addEventListener('dragover', (e) => {e.preventDefault();});
      button.addEventListener('dragenter', (e) => {e.preventDefault();if ($drag.el !== e.target && $drag.id !== v.id && e.target.className == 'card') {e.target.style.border = '3px dashed #45c947';}});
      button.addEventListener('dragleave', (e) => {e.preventDefault();if ($drag.el !== e.target && $drag.id !== v.id && e.target.className == 'card') {e.target.style.border = '';}});
      button.addEventListener('drop', () => {
        let b = structuredClone($drag.properties)
        b.id = v.id;
        b.from = $drag.id;
        updateLS(false, {id: $drag.id}, true)
        updateLS(true, b)
        loadLS()
        $drag.el = null;
        $drag.id = null;
        $drag.properties = {};
        $drag.prev.remove();
        button.style.border = '';
        button.style.border = '';
      });
      document.querySelector('.cards').appendChild(button)
    });
  }

  (() => {
    fetch("/def/def.json")
      .then(function (res) {
        return res.text()
      })
      .then(function (defbl) {
        JSON.parse(defbl).all.forEach((b) => {
          var a = document.createElement('div');
          a.classList.add("preset-card");
          a.setAttribute("data-href", b.url);
          a.setAttribute("data-preset-id", b.pid);
          a.innerHTML = `<img src="${b.icon}"><div class="insert">+</div><div class="preset-cardname"><h3>${b.name}</h3></div>`;
          document.getElementById("preset-cards").append(a);
        })
      })
      .then(function () {
        const presetInserts = document.querySelectorAll('.insert');
        presetInserts.forEach(insert => {
          insert.addEventListener('mouseup', (e) => {
            var card = insert.parentElement;
            if (e.button == 1 || e.button == 0) {
              if (bl.buttons.length >= 25) {
                document.getElementById("preset-msg").innerText = "You have reached the maximum amount of icons (25)";
                document.getElementById("preset-msg").classList.add("error");
                setTimeout(() => {
                  document.getElementById("preset-msg").innerText = ""
                  document.getElementById("preset-msg").classList.remove("error");
                }, 3000)
                return
              }
              let b = {name: card.children[2].children[0].innerText, icon: card.children[0].src, url: card.getAttribute('data-href')};
              if (card.getAttribute('data-style')) b.param = card.getAttribute('data-style');
              if (card.getAttribute('data-preset-id')) b.presetId = card.getAttribute('data-preset-id');
              updateLS(true, b);
              document.getElementById("preset-msg").innerText = `Added '${card.children[2].children[0].innerText}' preset to your layout`;
              loadLS();
            }
          });
        });
      })
      .catch(function (e) {
        consol.error("Failed to fetch pesets", "Presets")
        showAlert("Failed to load presets", "The server didn't respond.")
        document.getElementById("preset-msg").innerHTML = "Presets failed to load. Please <a onclick='window.window.reloadPage()' style='color: #c94545;font-weight:bold;cursor:pointer;'>refresh</a> the page or try again later."
        document.getElementById("preset-msg").classList.add("error");
      });
  })();
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
      showAlert("Button Layout Reset", "An error was detected in your button layout, causing it to be reset.")
      localStorage.setItem("old-buttonlayout", localStorage.getItem("buttonlayout"))
      localStorage.removeItem("buttonlayout")
      fetch("/def/def.json")
        .then(function (res) {
          return res.text()
        })
        .then(function (def) {
          let vdef = JSON.parse(def)
          delete vdef.all;
          localStorage.setItem("buttonlayout", JSON.stringify(vdef))
          bl = JSON.parse(localStorage.getItem("buttonlayout"))
          loadLS()
        })
        .catch(function (e) {
          consol.error("Failed to fetch buttons", "Buttons")
          showAlert("Failed to load buttons", "The server didn't respond.")
          document.getElementById("cards-error").innerHTML = "<h2>Failed to load your buttons</h2>";
        });
    } else {
      bl = JSON.parse(localStorage.getItem("buttonlayout"))
      loadLS()
    }
  } else {
    fetch("/def/def.json")
      .then(function (res) {
        return res.text()
      })
      .then(function (def) {
        let vdef = JSON.parse(def)
        delete vdef.all;
        localStorage.setItem("buttonlayout", JSON.stringify(vdef))
        bl = JSON.parse(localStorage.getItem("buttonlayout"))
        loadLS()
      })
      .catch(function (e) {
        consol.error("Failed to fetch buttons", "Buttons")
        showAlert("Failed to load buttons", "The server didn't respond.")
        document.getElementById("cards-error").innerHTML = "<h2>Failed to load your buttons</h2>";
      });
  }

  document.getElementById("reset").addEventListener("mouseup", () => {
    showAlert("Reset Button Layout", "Are you sure you want to reset your button layout?", {okBtn: "Yes", cancelBtn: "No"}, true).then((res) => {
      if (res) {
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
      }
    });
  })
  document.getElementById("undo").addEventListener("mouseup", undoUpdate);

  function showAlert(title, message, {okBtn="OK", cancelBtn="Cancel" }, showCancel=false) {
    return new Promise((resolve) => {
      document.getElementById('alert-title').innerText = title;
      document.getElementById('alert-message').innerText = message;
      document.getElementById('alert-ok').innerText = okBtn;
      showCancel ? document.getElementById('alert-cancel').innerText = cancelBtn : null;
      document.querySelector('.alert-container').style.display = '';
      setTimeout(() => {
        document.querySelector('.alert-overlay').style.opacity = 1;
        document.querySelector('.alert-background').classList.add('active');
      }, 100);
      
      function closeAlert() {
        document.removeEventListener('keydown', keyCloseA);
        document.querySelector('.alert-overlay').removeEventListener('click', resFalse);
        document.getElementById('alert-ok').removeEventListener('click', resTrue);
        showCancel ? document.getElementById('alert-cancel').removeEventListener('click', resFalse) : null;
        document.querySelector('.alert-overlay').style.opacity = 0;
        document.querySelector('.alert-background').classList.remove('active');
        setTimeout(() => {
          document.querySelector('.alert-container').style.display = 'none';
          document.getElementById('alert-title').innerText = "Alert";
          document.getElementById('alert-message').innerText = "Message";
          document.getElementById('alert-ok').innerText = "OK";
          document.getElementById('alert-cancel').style.display = 'none'
          document.getElementById('alert-cancel').innerText = "Cancel";
        }, 300);
      }
      
      function keyCloseA(e) {if (e.key == "Escape") {closeAlert();resolve(false);}}
      function resTrue() {closeAlert();resolve(true);}
      function resFalse() {closeAlert();resolve(false);}
      
      document.querySelector('.alert-overlay').addEventListener('click', resFalse);
      document.getElementById('alert-ok').addEventListener('click', resTrue);
      showCancel ? document.getElementById('alert-cancel').addEventListener('click', resFalse) : null;
      document.addEventListener('keydown', keyCloseA);
      showCancel ? document.getElementById('alert-cancel').style.display = '' : document.getElementById('alert-cancel').style.display = 'none';
    });
  }

  console.log(`                ,---,.   ,----..   \n       ,---.  ,'  .'  \\ /   /   \\  \n      /__./|,---.' .' ||   :     : \n ,---.;  ; ||   |  |: |.   |  ;. / \n/___/ \\  | |:   :  :  /.   ; /--\`  \n\\   ;  \\ ' |:   |    ; ;   | ;     \n \\   \\  \\: ||   :     \\|   : |     \n  ;   \\  ' .|   |   . |.   | '___  \n   \\   \\   ''   :  '; |'   ; : .'| \n    \\   \`  ;|   |  | ; '   | '/  : \n     :   \\ ||   :   /  |   :    /  \n      '---\" |   | ,'    \\   \\ .'   \n            \`----'       \`---\`     \nIntranet ${version}`)
})();
