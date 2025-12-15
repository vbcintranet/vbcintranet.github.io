(() => {
  const version = "v2.1.0";

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

  const pageLayout = document.querySelector('.page-layout');
  const accept = document.getElementById('accept');

  document.addEventListener('DOMContentLoaded', () => {setTimeout(() => {pageLayout.classList.remove('hide');document.querySelector('.content-blur').classList.remove('show');setTimeout(() => {document.querySelector('.content-blur').remove();}, 500);}, 200)});

  accept.addEventListener('click', (event) => {
    window.open('/', '_self');
  });

  const drawerContainer = document.querySelector('.drawer-container');
  const cardsContainer = document.querySelector('.cards');
  const pulloutButton = document.getElementById('drawer-pullout');
  const trashZone = document.getElementById('trash-zone');
  const drawerBackground = document.querySelector('.drawer-background');
  const presetsContainer = document.getElementById('presets-container');
  const cButtonContainer = document.getElementById('custom-btns-container');
  let addOpen = false;

  pulloutButton.addEventListener('click', toggleDrawer);

  function openDrawer() {
    if (!addOpen) {
      document.addEventListener('keydown', keyCloseDrawer);
      addOpen = true;
      pulloutButton.classList.add('active');
      drawerContainer.classList.add('active');
    }
  }

  function closeDrawer() {
    document.removeEventListener('keydown', keyCloseDrawer);
    pulloutButton.classList.remove('active');
    drawerContainer.classList.remove('active');
    addOpen = false;
  }

  function toggleDrawer() {
    if (addOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  function keyCloseDrawer(e) {
    if (e.key == "Escape") {
      closeDrawer();
    }
  }

  var changes = []
  const $drag = {el: null, id: null, properties: {}, prev: null}

  function shatterCard(card, callfirst) {
    if (typeof callfirst === 'function') callfirst();
    try {
      const shards = 8 + Math.floor(Math.random() * 6);
      const duration = 850;
      const container = document.createElement('div');
      const rect = card.getBoundingClientRect();
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scale = 2;
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      ctx.scale(scale, scale);
      
      const cardStyle = window.getComputedStyle(card);
      const img = card.querySelector('img');
      const overlayText = card.querySelector('.overlay p');
      
      const cardRadius = cardStyle.borderRadius || '8px';
      
      const radiusValue = parseFloat(cardRadius);
      ctx.beginPath();
      ctx.roundRect(0, 0, rect.width, rect.height, radiusValue);
      ctx.clip();
      
      ctx.fillStyle = cardStyle.backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
      const bgImage = cardStyle.backgroundImage
      const bgSize = cardStyle.backgroundSize;

      const proceedAfterBG = () => {
        const overlayGradient = ctx.createLinearGradient(0, rect.height * 0.6, 0, rect.height);
        overlayGradient.addColorStop(0, 'rgba(0,0,0,0)');
        overlayGradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = overlayGradient;
        ctx.fillRect(0, rect.height * 0.6, rect.width, rect.height * 0.4);

        if (overlayText) {
          const textStyle = window.getComputedStyle(overlayText);
          const rawText = overlayText.textContent || '';
          ctx.font = `${textStyle.fontWeight || 'bold'} ${textStyle.fontSize || '18.72px'} ${textStyle.fontFamily || 'Varela Round'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const textX = rect.width / 2;
          let textY = rect.height * 0.8;
          textY = Math.max(0, Math.min(rect.height, textY));
          ctx.fillStyle = '#ffffff';
          const maxWidth = rect.width * 0.8;
          const fontSize = parseFloat(textStyle.fontSize || '18.72');
          const lineHeight = fontSize * 1.2;
          const words = rawText.split(' ');
          const lines = [];
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);
          
          let currentY = textY - (lines.length - 1) * lineHeight / 2;
          lines.forEach(line => {
            ctx.fillText(line, textX, currentY);
            currentY += lineHeight;
          });
        }

        const cardDataUrl = canvas.toDataURL('image/png');

        container.className = 'shatter-container';
        container.style.position = 'fixed';
        container.style.left = `${rect.left}px`;
        container.style.top = `${rect.top}px`;
        container.style.width = `${rect.width}px`;
        container.style.height = `${rect.height}px`;
        container.style.pointerEvents = 'none';
        container.style.overflow = 'visible';
        container.style.zIndex = 9999;
        document.body.appendChild(container);
        card.style.visibility = 'hidden';

        const cx = 50 + (Math.random() - 0.5) * 50;
        const cy = 50 + (Math.random() - 0.5) * 50;

        const degToRad = d => d * Math.PI / 180;
        for (let i = 0; i < shards; i++) {
          const angleA = (i / shards) * 360 + (Math.random() - 0.5) * 12;
          const angleB = ((i + 1) / shards) * 360 + (Math.random() - 0.5) * 12;

          const edgePoints = [];
          const steps = 3 + Math.floor(Math.random() * 3);
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const angle = angleA + (angleB - angleA) * t;
            const baseRadius = 60 + Math.random() * 50;
            const jitter = (Math.random() - 0.5) * 18;
            const radius = baseRadius + jitter;
            const rad = degToRad(angle);
            const x = cx + Math.cos(rad) * radius;
            const y = cy + Math.sin(rad) * radius * (rect.height / rect.width);
            edgePoints.push([x, y]);
          }

          const points = [[cx, cy], ...edgePoints];

          const shard = document.createElement('div');
          shard.className = 'shard';
          shard.style.position = 'absolute';
          shard.style.left = '0';
          shard.style.top = '0';
          shard.style.width = '100%';
          shard.style.height = '100%';
          shard.style.backgroundRepeat = 'no-repeat';
          shard.style.backgroundSize = `${rect.width}px ${rect.height}px`;
          shard.style.backgroundPosition = '0 0';
          if (cardDataUrl) shard.style.backgroundImage = `url(${cardDataUrl})`;

          const poly = points.map(p => `${p[0].toFixed(2)}% ${p[1].toFixed(2)}%`).join(', ');
          shard.style.clipPath = `polygon(${poly})`;
          shard.style.transition = `transform ${duration}ms cubic-bezier(.2,.8,.2,1), opacity ${duration}ms ease`;
          shard.style.transformOrigin = `${cx}% ${cy}%`;
          container.appendChild(shard);

          (function(s) {
            requestAnimationFrame(() => {
              setTimeout(() => {
                const force = 0.6 + Math.random() * 1.6;
                const dx = (Math.cos(degToRad((angleA + angleB) / 2)) * rect.width * force) * (0.6 + Math.random() * 0.8);
                const dy = (Math.sin(degToRad((angleA + angleB) / 2)) * rect.height * force) * (0.6 + Math.random() * 0.8) - (20 + Math.random() * 40);
                const rot = (Math.random() - 0.5) * 90;
                s.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
                s.style.opacity = '0';
              }, Math.random() * 80);
            });
          })(shard);
        }

        setTimeout(() => {
          try { container.remove(); } catch (e) { container.parentNode && container.parentNode.removeChild(container); }
          try { card.remove(); } catch (e) { card.parentNode && card.parentNode.removeChild(card); }
        }, duration + shards * 22 + 140);
      };

      if (bgImage && bgImage !== 'none' && !bgImage.includes('gradient')) {
        const urlMatch = bgImage.match(/url\(['"]?([^'"\)]+)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          const src = urlMatch[1];
          const bgImg = new Image();
          bgImg.src = src;
          bgImg.onload = () => {
            try {
              let tileW = bgImg.width;
              let tileH = bgImg.height;
              const sizeMatch = bgSize && bgSize.match(/(\d+)(px)\s+(\d+)(px)/);
              if (sizeMatch) {
                tileW = parseFloat(sizeMatch[1]);
                tileH = parseFloat(sizeMatch[3]);
              }
              const tileCanvas = document.createElement('canvas');
              tileCanvas.width = tileW;
              tileCanvas.height = tileH;
              const tctx = tileCanvas.getContext('2d');
              tctx.drawImage(bgImg, 0, 0, tileW, tileH);
              const pattern = ctx.createPattern(tileCanvas, 'repeat');
              ctx.filter = 'blur(6px)';
              ctx.fillStyle = pattern || ctx.fillStyle;
              ctx.fillRect(0, 0, rect.width, rect.height);
              ctx.filter = 'none';
              bgRendered = true;
            } catch (e) {
              consol.warn('Failed to render background pattern', 'Shatter');
            } finally {
              proceedAfterBG();
            }
          };
          bgImg.onerror = (e) => {
            consol.warn('Background image failed to load', 'Shatter');
            proceedAfterBG();
          };
        } else {
          proceedAfterBG();
        }
      } else {
        proceedAfterBG();
      }
      
      if (img && img.complete && img.naturalWidth > 0) {
          if (img && img.complete && img.naturalWidth > 0) {
            const imgRect = img.getBoundingClientRect();
            const imgX = imgRect.left - rect.left;
            const imgY = imgRect.top - rect.top;
            try {
              ctx.drawImage(img, imgX, imgY, imgRect.width, imgRect.height);
            } catch (e) {
              consol.warn('Failed to draw card image to canvas (CORS?)', 'Shatter');
            }
          } else {
            consol.log('Icon not ready or missing', 'Shatter');
          }
      }

      setTimeout(() => {
        try { container.remove(); } catch (e) { container.parentNode && container.parentNode.removeChild(container); }
        try { card.remove(); } catch (e) { card.parentNode && card.parentNode.removeChild(card); }
      }, duration + shards * 22 + 140);
    } catch (e) {
      consol.error('Effect failed', 'Shatter');
      try { card.remove(); } catch (err) { card.parentNode && card.parentNode.removeChild(card); }
    }
  }

  function updateLS(add, { id, name, icon, url, param, pid, from, cid, popup }, hide = false) {
    if (add && bl.buttons.length < 25) {
      let b = {}
      name && icon && url ? b = { name, icon, url } : console.error("Missing parameters", "Buttons");
      if (param) b.param = param;
      if (popup) b.popup = structuredClone(popup);
      if (pid != undefined && typeof Number(pid) == "number") b.pid = pid; else if (cid != undefined && typeof Number(cid) == "number") b.cid = cid;
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
      bl.buttons.sort((a, b) => a.id - b.id);
      localStorage.setItem("buttonlayout", JSON.stringify(bl));
      if (bl.buttons.length >= 25) {
        drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
          p.classList.add('locked');
        });
      } else {
        drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
          p.classList.remove('locked');
        });
      }
    } else if (!add) {
      bl.buttons.forEach(v => {
        if (v.id == id) {
          const rm = structuredClone(v);
          
          bl.buttons.splice(bl.buttons.indexOf(v), 1);
          
          bl.buttons.forEach(v => {if (v.id > id) v.id--;});
          
          rm.a = false;
          rm.from = from;
          !hide ? changes.push(rm) : null;
          
          bl.buttons.sort((a, b) => a.id - b.id);
          localStorage.setItem("buttonlayout", JSON.stringify(bl));
          if (bl.buttons.length >= 25) {
            drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
              p.classList.add('locked');
            });
          } else {
            drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
              p.classList.remove('locked');
            });
          }

          if (!hide) {
            const cardsContainer = document.querySelector('.cards');
            const cardToRemove = cardsContainer.querySelector(`.card[data-id="${id}"]`);

            if (cardToRemove) {
              shatterCard(cardToRemove, () => {
                let gapToRemove = null;
                const nextCard = cardToRemove.nextElementSibling;

                if (nextCard && nextCard.classList.contains('card-gap') && parseInt(nextCard.dataset.index) !== bl.buttons.length) {
                  gapToRemove = nextCard;
                } else {
                  const prevGap = cardToRemove.previousElementSibling;
                  if (prevGap && prevGap.classList.contains('card-gap') && parseInt(prevGap.dataset.index) !== 0) {
                    gapToRemove = prevGap;
                  }
                }
                
                if (gapToRemove) {
                  gapToRemove.remove();
                }

                const remainingCards = cardsContainer.querySelectorAll('.card');
                remainingCards.forEach((card, idx) => {
                  card.setAttribute('data-index', idx);
                });
                
                const remainingGaps = cardsContainer.querySelectorAll('.card-gap');
                remainingGaps.forEach((gap, idx) => {
                  gap.setAttribute('data-index', idx);
                });

                if (bl.buttons.length > 0) {
                  let lastGap = cardsContainer.querySelector(`.card-gap[data-index="${bl.buttons.length}"]`);
                  if (!lastGap) {
                    const newLastGap = document.createElement('div');
                    newLastGap.classList.add('card-gap');
                    newLastGap.setAttribute('data-index', bl.buttons.length);
                    cardsContainer.appendChild(newLastGap);
                  }
                }
              });
            }
          }
        }
      });
    }
  }

  function undoUpdate() {
    if (!changes.length) return;
    typeof changes[changes.length - 1].from == 'number' && changes[changes.length - 1].a ? (()=>{updateLS(false, { id: changes[changes.length - 1].id }, true); updateLS(true, {id: changes[changes.length - 1].from, name: changes[changes.length - 1].name, icon: changes[changes.length - 1].icon, url: changes[changes.length - 1].url, param: changes[changes.length - 1].param, pid: changes[changes.length - 1].pid, cid: changes[changes.length - 1].cid, popup: changes[changes.length - 1].popup}, true)})() : changes[changes.length - 1].a ? updateLS(false, { id: changes[changes.length - 1].id }, true) : updateLS(true, { id: changes[changes.length - 1].id, name: changes[changes.length - 1].name, icon: changes[changes.length - 1].icon, url: changes[changes.length - 1].url, param: changes[changes.length - 1].param, pid: changes[changes.length - 1].pid, cid: changes[changes.length - 1].cid, popup: changes[changes.length - 1].popup }, true);
    changes.length = changes.length - 1 < 0 ? 0 : changes.length - 1;
    loadLS();
  }
  
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
    let dragGhost = null;
    let activeGap = null;
    let vId = -1;
    
    bl.buttons.forEach((v, i) => {v.id = i;});
    fetch("/def/def.json")
      .then(function (res) {
        return res.text()
      })
      .then(defbl => {
        let vdefbl = JSON.parse(defbl);
        let len = structuredClone(bl.buttons.length);
        let refReq = false;
        bl.buttons.length = bl.buttons.length > 25 ? 25 : bl.buttons.length;
        Promise.all(bl.buttons.map((b)=> new Promise((resolve, reject)=>{
          let tasks = {a:'required'}
          if (!b.name || !b.icon || !b.url ) {b.tagged = true;resolve();};
          if (b.pid != undefined && typeof Number(b.pid) == "number" && vdefbl.all.filter(d=>d.pid==b.pid).length == 0) {b.tagged = true;resolve();} else if (b.pid != undefined && typeof Number(b.pid) == "number") {
            let li = vdefbl.all.filter(d=>d.pid==b.pid)[0];
            ['name', 'icon', 'url'].forEach(p => {
              if (li[p] && (b[p] != li[p])) {b[p] = li[p];refReq = true;};
            });
            if (li.param && !b.param) {b.param = li.param;refReq = true;}
            else if (!li.param && b.param) {delete b.param;refReq = true;}
            else if (li.param && b.param && li.param !== b.param) {b.param = li.param;refReq = true;}
            if (li.popup && !b.popup) {b.popup = structuredClone(li.popup);refReq = true;}
            else if (!li.popup && b.popup) {delete b.popup;refReq = true;}
            else if (li.popup && b.popup && JSON.stringify(li.popup) !== JSON.stringify(b.popup)) {b.popup = structuredClone(li.popup);refReq = true;}
            tasks.a = true;
          } else if (b.cid != undefined && typeof Number(b.cid) == "number") {
            let li = cbl.cButtons.filter(d=>d.cid==b.cid)[0];
            if (!li) {b.tagged = true;resolve();};
            ['name', 'icon', 'url'].forEach(p => {
              if (li[p] && (b[p] != li[p])) {b[p] = li[p];refReq = true;};
            });
            if (li.param && !b.param) {b.param = li.param;refReq = true;}
            else if (!li.param && b.param) {delete b.param;refReq = true;}
            else if (li.param && b.param && li.param !== b.param) {b.param = li.param;refReq = true;}
            if (li.popup && !b.popup) {b.popup = structuredClone(li.popup);refReq = true;}
            else if (!li.popup && b.popup) {delete b.popup;refReq = true;}
            else if (li.popup && b.popup && JSON.stringify(li.popup) !== JSON.stringify(b.popup)) {b.popup = structuredClone(li.popup);refReq = true;}
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
          if (rm) {errmsg += `${rm == 1 ? 'A' : rm} button${rm > 1 ? 's were' : ' was'} removed due to formatting errors.`};
          if (len > 25) {errmsg += `\nYou have reached the button limit, the first 25 were kept, the remaining ${len-25 == 1 ? 'button' : `${len-25} buttons`} ${len-25 == 1 ? 'was' : 'were'} removed.`};
          if (errmsg) alertSystem.callAlert("Button Layout Updated", errmsg, {});
          localStorage.setItem("buttonlayout", JSON.stringify(bl));
          if (rm > 0 || len > 25 || refReq) {
            loadLS();
          }
        }).catch(function (e) {
          consol.error("Failed to fetch buttons", "Buttons");
          console.error(e)
          alertSystem.callAlert("Failed to check buttons", "The server didn't respond.");
        });
      }).catch(function (e) {
        consol.error("Failed to fetch buttons", "Buttons");
        console.error(e)
        alertSystem.callAlert("Failed to check buttons", "The server didn't respond.");
      });
    


    function createCard(buttonData, index) {
      const button = document.createElement('div');
      button.classList.add("card");
      button.setAttribute("data-href", buttonData.url);
      button.setAttribute("data-id", buttonData.id);
      button.setAttribute("data-index", index);
      button.setAttribute("draggable", "true");
      button.innerHTML = `<img src="${buttonData.icon}" alt="${buttonData.name} Icon"><div class="overlay"><p>${buttonData.name}</p></div><div class="delete-overlay"><i class="fa-solid fa-trash"></i></div>`;
      button.fontSize = "";
      shrinkToFit(button.querySelector('.overlay p'), 14);
      let clickAllowed = true;
      button.addEventListener('mousedown', (e) => {
        if (e.button == 0) {
          clickAllowed = true;
        }
      });
      button.addEventListener('mouseup', (e) => {
        if (e.button == 0 && clickAllowed && !(button.dragging || button.classList.contains("dragging"))) {
          e.preventDefault();
          if (button.classList.contains('delete-mode')) {
            const id = buttonData.id;
            updateLS(false, { id });
            button.classList.add('card-removing');
            setTimeout(loadLS, 300);
          } else {
            document.querySelectorAll('.card.delete-mode').forEach(card => {
              card.classList.remove('delete-mode');
            });
            
            button.classList.add('delete-mode');
            setTimeout(() => {
              document.addEventListener('mousedown', removeDeleteMode);
            }, 0);
          }
        }
      });
      
      function removeDeleteMode(e) {
        if (!button.contains(e.target)) {
          button.classList.remove('delete-mode');
          document.removeEventListener('mousedown', removeDeleteMode);
        }
      }
      
      button.addEventListener('dragstart', (e) => {
        if (button.classList.contains('delete-mode')) {
          e.preventDefault();
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        clickAllowed = false;
        startDrag(e, button, index, buttonData);
      });

      return button;
    }

    function createGap(index) {
      const gap = document.createElement('div');
      gap.innerHTML = `<div><i class="fa-solid fa-plus"></i></div>`;
      gap.classList.add('card-gap');
      gap.setAttribute('data-index', index);
      return gap;
    }

    const existingCards = Array.from(cardsContainer.querySelectorAll('.card'));
    const existingGaps = Array.from(cardsContainer.querySelectorAll('.card-gap'));

    const cardsToKeep = new Set();
    const gapsToKeep = new Set();

    let needsRebuild = false;
    
    if (existingCards.length !== bl.buttons.length || existingCards.length === 0) {
      needsRebuild = true;
    }
    
    if (needsRebuild) {
      cardsContainer.innerHTML = '';
      
      if (bl.buttons.length == 0) {
        cardsContainer.appendChild(createGap(0));
      }
      
      bl.buttons.forEach((buttonData, index) => {
        cardsContainer.appendChild(createGap(index));
        
        const card = createCard(buttonData, index);
        cardsContainer.appendChild(card);
        card.querySelector('.overlay p').style.fontSize = "";
        shrinkToFit(card.querySelector('.overlay p'), 14);
      });

      if (bl.buttons.length > 0) {
        cardsContainer.appendChild(createGap(bl.buttons.length));
      }
    } else {
      const cardMap = new Map();
      const positionUpdates = [];

      existingCards.forEach(card => {
        const cardId = parseInt(card.dataset.id);
        cardMap.set(cardId, card);
      });

      bl.buttons.forEach((buttonData, index) => {
        const id = buttonData.id;
        const card = cardMap.get(id);
        
        if (card) {
          const currentIndex = parseInt(card.dataset.index);
          
          if (currentIndex !== index) {
            positionUpdates.push({ card, newIndex: index, data: buttonData });
          } else {
            const currentHref = card.dataset.href;
            const currentName = card.querySelector('.overlay p').textContent;
            const currentIcon = card.querySelector('img').src;
            
            if (currentHref !== buttonData.url || currentName !== buttonData.name || currentIcon !== buttonData.icon) {
              card.dataset.href = buttonData.url;
              card.querySelector('.overlay p').textContent = buttonData.name;
              card.querySelector('img').src = buttonData.icon;
              card.querySelector('img').alt = buttonData.name + ' Icon';
            }

            cardsToKeep.add(card);
          }
          card.querySelector('.overlay p').style.fontSize = "";
          shrinkToFit(card.querySelector('.overlay p'), 14);
        } else {
          needsRebuild = true;
        }
      });

      if (positionUpdates.length > 0 && !needsRebuild) {
        positionUpdates.sort((a, b) => {
          const aDist = Math.abs(parseInt(a.card.getAttribute('data-index')) - a.newIndex);
          const bDist = Math.abs(parseInt(b.card.getAttribute('data-index')) - b.newIndex);
          return bDist - aDist;
        });
        
        positionUpdates.forEach(update => {
          const { card, newIndex, data } = update;

          card.setAttribute('data-index', newIndex);

          const elements = Array.from(cardsContainer.children);
          let insertPosition = null;

          for (let i = 0; i < elements.length; i++) {
            const elem = elements[i];
            if (elem.classList.contains('card-gap') && parseInt(elem.getAttribute('data-index')) === newIndex) {
              insertPosition = elem;
              break;
            }
          }

          if (insertPosition && insertPosition.nextElementSibling !== card) {
            insertPosition.after(card);
          }
          
          cardsToKeep.add(card);
        });

        existingGaps.forEach(gap => {
          gapsToKeep.add(gap);
        });
      }

      if (needsRebuild) {
        cardsContainer.innerHTML = '';

        if (bl.buttons.length == 0) {
          cardsContainer.appendChild(createGap(0));
        }
        
        bl.buttons.forEach((buttonData, index) => {
          cardsContainer.appendChild(createGap(index));
          
          const card = createCard(buttonData, index);
          cardsContainer.appendChild(card);
          card.querySelector('.overlay p').style.fontSize = "";
          shrinkToFit(card.querySelector('.overlay p'), 14);
        });

        if (bl.buttons.length > 0) {
          cardsContainer.appendChild(createGap(bl.buttons.length));
        }
      }
    }
    
    if (!needsRebuild && bl.buttons.length > 0) {
      let lastGap = cardsContainer.querySelector(`.card-gap[data-index="${bl.buttons.length}"]`);
      if (!lastGap) {
        lastGap = createGap(bl.buttons.length);
        cardsContainer.appendChild(lastGap);
      }
    }
    
    let isDragging = false;
    
    function startDrag(e, button, index, itemData) {
      e.preventDefault();
      
      vId = index;
      
      cardsContainer.classList.add('dragging-active');
      
      dragGhost = button.cloneNode(true);
      dragGhost.classList.add('drag-ghost');
      dragGhost.style.width = `${button.offsetWidth}px`;
      dragGhost.style.height = `${button.offsetHeight}px`;
      document.body.appendChild(dragGhost);
      
      isDragging = true;
      document.querySelectorAll('.card-gap i').forEach(icon => {
        icon.className = 'fa-solid fa-arrows-up-down-left-right';
      });
      
      updateGhostPosition(e);
      
      button.classList.add('dragging');
      button.dragging = true;
      
      $drag.el = button;
      $drag.id = itemData.id;
      const properties = { name: itemData.name, icon: itemData.icon, url: itemData.url };
      itemData.param ? properties.param = itemData.param : null;
      itemData.popup ? properties.popup = structuredClone(itemData.popup) : null;
      itemData.pid != undefined && typeof Number(itemData.pid) == "number" ? properties.pid = itemData.pid : null;
      $drag.properties = properties;
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    function updateGhostPosition(e) {
      if (!dragGhost) return;
      dragGhost.style.left = `${e.clientX - 20}px`;
      dragGhost.style.top = `${e.clientY - 10}px`;
    }
    function onMouseMove(e) {
      e.preventDefault();
      
      if (isDragging) {
      updateGhostPosition(e);
      
      const elemBelow = document.elementFromPoint(e.clientX, e.clientY);

      if (elemBelow) {
        let target = elemBelow;
        while (target && !target.classList.contains('card-gap') && target !== cardsContainer && target !== trashZone) {
          target = target.parentElement;
        }
        
        if (target && target.classList.contains('card-gap')) {
          const gapIndex = parseInt(target.getAttribute('data-index'));
          
          if (gapIndex !== vId && gapIndex !== vId + 1) {
            if (activeGap && activeGap !== target) {
            activeGap.classList.remove('active');
            }

            target.classList.add('active');
            activeGap = target;
          }
        } else if (activeGap) {
          activeGap.classList.remove('active');
          activeGap = null;
        }

        if (target && target === trashZone) {
          trashZone.classList.add('active');
        } else {
          trashZone.classList.remove('active');
        }
      }

      if (e.clientY < 50) {
        window.scrollBy(0, -10);
      } else if (e.clientY > window.innerHeight - 50) {
        window.scrollBy(0, 10);
      }
    }
    }
    
    function onMouseUp(e) {
      if (!isDragging) return;
      
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (activeGap) {
        const target = parseInt(activeGap.getAttribute('data-index'));
        let b = structuredClone(bl.buttons[vId]);
        updateLS(false, { id: vId }, true);
        b.id = target > vId ? target - 1 : target;
        b.from = vId;
        updateLS(true, b);

        loadLS();
      } else if (trashZone.classList.contains('active')) {
        trashZone.classList.remove('active');
        const id = $drag.id;
        updateLS(false, { id });
        $drag.el.classList.add('card-removing');
        setTimeout(loadLS, 300);
      }
      
      cleanupDrag();
    }
    
    document.addEventListener('dragover', onMouseMove);
    document.addEventListener('drop', onMouseUp);
    document.addEventListener('dragend', cleanupDrag);
    
    function cleanupDrag() {
      if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
      }

      if (activeGap) {
        activeGap.classList.remove('active');
        activeGap = null;
      }
      
      document.querySelectorAll('.card.dragging').forEach(card => {
        card.classList.remove('dragging');
        card.dragging = false;
      });
      cardsContainer.classList.remove('dragging-active');
      
      vId = -1;
      $drag.el = null;
      $drag.id = null;
      $drag.properties = {};
      document.querySelectorAll('.card-gap i').forEach(icon => {
        icon.className = 'fa-solid fa-plus';
      });
      
      document.removeEventListener('dragover', onMouseMove);
      document.removeEventListener('drop', onMouseUp);
      document.removeEventListener('dragend', cleanupDrag);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  }

  (() => {
    let dragGhost = null;
    let activeGap = null;
    let isDragging = false;
    
    fetch("/def/def.json")
      .then(function (res) {
        return res.text()
      })
      .then(function (defbl) {
        const presets = JSON.parse(defbl).all;
        
        presetsContainer.innerHTML = '';
        
        presets.forEach((preset) => {
          const presetElem = document.createElement('div');
          presetElem.classList.add("drawer-card");
          presetElem.setAttribute("draggable", "true");
          bl.buttons.length >= 25 ? presetElem.classList.add('locked') : null;
          presetElem.dataset.href = preset.url;
          presetElem.dataset.pid = preset.pid;
          presetElem.innerHTML = `<img src="${preset.icon}" alt="${preset.name} Icon"><div class="overlay" style="padding: 5px;bottom: -8%;"><p>${preset.name}</p></div><div class="locked-overlay"><i class="fa-solid fa-lock"></i></div>`;
          let clickAllowed = true;

          const presetData = {
            name: preset.name,
            icon: preset.icon,
            url: preset.url,
            pid: preset.pid
          };
          if (preset.param != undefined) presetData.param = preset.param;
          if (preset.popup != undefined) presetData.popup = structuredClone(preset.popup);          

          presetElem.addEventListener('mousedown', (e) => {
            if (e.button == 0 || e.button == 1) {
              clickAllowed = true;
            }
          });
          presetElem.addEventListener('mouseup', (e) => {
            if ((e.button == 0 || e.button == 1) && clickAllowed) {
              if (bl.buttons.length >= 25) {
                drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
                  p.classList.add('locked');
                });

                alertSystem.callAlert("Button Limit Reached", "You have reached the maximum amount of buttons (25).\nPlease remove some before adding new ones.");
                return;
              }

              updateLS(true, presetData);

              if (bl.buttons.length >= 25) {
                drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
                  p.classList.add('locked');
                });
              }

              loadLS();
            }
          });

          
          presetElem.addEventListener('dragstart', (e) => {
            if (presetElem.classList.contains('locked')) {
              e.preventDefault();
              return;
            }
    
            e.preventDefault();
            e.stopPropagation();
            clickAllowed = false;
            startDrag(e, presetElem, presetData);
          });
          
          presetsContainer.appendChild(presetElem);
        });
      })
      .catch(function (e) {
        consol.error("Failed to fetch pesets", "Presets")
        alertSystem.callAlert("Failed to load presets", "The server didn't respond.")
        document.getElementById("preset-msg").innerHTML = "Presets failed to load. Please <a onclick='window.window.reloadPage()' style='color: #c94545;font-weight:bold;cursor:pointer;'>refresh</a> the page or try again later."
        document.getElementById("preset-msg").classList.add("error");
      });

    function startDrag(e, presetEl, presetData) {
      e.preventDefault();

      if (bl.buttons.length >= 25) {
        drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
          p.classList.add('locked');
        });
        return;
      }
      
      cardsContainer.classList.add('dragging-active');
      
      dragGhost = presetEl.cloneNode(true);
      dragGhost.classList.add('drag-ghost');
      dragGhost.style.width = `${presetEl.offsetWidth}px`;
      dragGhost.style.height = `${presetEl.offsetHeight}px`;
      document.body.appendChild(dragGhost);
      isDragging = true;
      
      updateGhostPosition(e);
      
      presetEl.classList.add('dragging');
      presetEl.dragging = true;
      
      $drag.el = presetEl;
      $drag.id = presetData.id;
      const properties = { name: presetData.name, icon: presetData.icon, url: presetData.url };
      presetData.param ? properties.param = presetData.param : null;
      presetData.popup ? properties.popup = structuredClone(presetData.popup) : null;
      presetData.pid != undefined && typeof Number(presetData.pid) == "number" ? properties.pid = presetData.pid : null;
      $drag.properties = properties;
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    function updateGhostPosition(e) {
      if (!dragGhost) return;
      dragGhost.style.left = `${e.clientX - 20}px`;
      dragGhost.style.top = `${e.clientY - 10}px`;
    }
    
    function onMouseMove(e) {
      e.preventDefault();
      
      if (isDragging) {
        updateGhostPosition(e);
        
        const elemBelow = document.elementFromPoint(e.clientX, e.clientY);

        if (elemBelow) {
          let target = elemBelow;
          while (target && !target.classList.contains('card-gap') && target !== cardsContainer && target !== trashZone) {
            target = target.parentElement;
          }
          
          if (target && target.classList.contains('card-gap')) {
            if (activeGap && activeGap !== target) {
              activeGap.classList.remove('active');
            }

            target.classList.add('active');
            activeGap = target;
          } else if (activeGap) {
            activeGap.classList.remove('active');
            activeGap = null;
          }

          if (target && target === trashZone) {
            trashZone.classList.add('active');
          } else {
            trashZone.classList.remove('active');
          }
        }

        if (e.clientY < 50) {
          window.scrollBy(0, -10);
        } else if (e.clientY > window.innerHeight - 50) {
          window.scrollBy(0, 10);
        }
      }
    }
    
    function onMouseUp(e) {
      if (!isDragging) return;
      
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (activeGap && bl.buttons.length < 25) {
        let target = parseInt(activeGap.getAttribute('data-index'));
        b = $drag.properties;
        b.id = target;
        updateLS(true, b);

        loadLS();
      } else if (trashZone.classList.contains('active')) {
        trashZone.classList.remove('active');
      }
      
      cleanupDrag();
    }
    
    document.addEventListener('dragover', onMouseMove);
    document.addEventListener('drop', onMouseUp);
    document.addEventListener('dragend', cleanupDrag);
    
    function cleanupDrag() {
      if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
      }

      if (activeGap) {
        activeGap.classList.remove('active');
        activeGap = null;
      }
      
      document.querySelectorAll('.drawer-card.dragging').forEach(card => {
        card.classList.remove('dragging');
        card.dragging = false;
      });
      cardsContainer.classList.remove('dragging-active');
      
      $drag.el = null;
      $drag.id = null;
      $drag.properties = {};
      
      document.removeEventListener('dragover', onMouseMove);
      document.removeEventListener('drop', onMouseUp);
      document.removeEventListener('dragend', cleanupDrag);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  })();
  function jsonCheck(json) {
    try {
      JSON.parse(json)
    } catch {
      return false
    }
    return true
  }
  var bl = {};
  var cbl = {cButtons: []};
  if (localStorage.getItem("buttonlayout")) {
    if (!jsonCheck(localStorage.getItem("buttonlayout"))) {
      consol.log("Failed to parse buttonlayout, resetting", "Buttons")
      alertSystem.callAlert("Button Layout Reset", "An error was detected in your button layout, causing it to be reset.")
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
          alertSystem.callAlert("Failed to load buttons", "The server didn't respond.")
          document.getElementById("cards-error").innerHTML = "<h2>Failed to load your buttons</h2>";
        });
    } else {
      bl = JSON.parse(localStorage.getItem("buttonlayout"))
      if (jsonCheck(localStorage.getItem("custombuttonlist")) && localStorage.getItem("custombuttonlist")) {
        let preCBL = JSON.parse(localStorage.getItem("custombuttonlist"))
        preCBL.cButtons = preCBL.cButtons.filter((cButton, index, self) => {
          return (typeof cButton.name === 'string' && cButton.name.length > 0 && cButton.name.length <= 15 && typeof cButton.icon === 'string' && cButton.icon.startsWith('data:image/') && typeof cButton.url === 'string' && isValidUrl(cButton.url) && self.findIndex(btn => btn.name === cButton.name || btn.url === cButton.url || btn.icon === cButton.icon || btn.cid === cButton.cid) === index);
        });
        cbl = preCBL;
      }
      loadLS();
      loadCLS();
    }
  } else {
    fetch("/def/def.json")
      .then(function (res) {
        return res.text()
      })
      .then(function (def) {
        let vdef = JSON.parse(def);
        delete vdef.all;
        localStorage.setItem("buttonlayout", JSON.stringify(vdef));
        bl = JSON.parse(localStorage.getItem("buttonlayout"));
        loadLS();
        loadCLS();
      })
      .catch(function (e) {
        consol.error("Failed to fetch buttons", "Buttons")
        alertSystem.callAlert("Failed to load buttons", "The server didn't respond.")
        document.getElementById("cards-error").innerHTML = "<h2>Failed to load your buttons</h2>";
      });
  }

  document.getElementById("reset").addEventListener("click", () => {
    alertSystem.callAlert("Reset Button Layout", "Are you sure you want to reset your button layout?\nThis cannot be undone.", {okBtn: "Yes", cancelBtn: "No"}, true).then((res) => {
      if (res) {
        fetch("/def/def.json")
          .then(function(res) {
            return res.text()
          })
          .then(function(def) {  
            let vdef = JSON.parse(def);
            delete vdef.all;
            localStorage.setItem("buttonlayout", JSON.stringify(vdef));
            bl = JSON.parse(localStorage.getItem("buttonlayout"));
            loadLS();
            changes.length = 0;
            if (bl.buttons.length >= 25) {
              drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
                p.classList.add('locked');
              });
            } else {
              drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
                p.classList.remove('locked');
              });
            }
          })
          .catch(function(e) {
            consol.error("Failed to fetch buttons", "Buttons")
            alertSystem.callAlert("Failed to load buttons", "The server didn't respond.")
            document.getElementById("cards-error").innerHTML = "<h2>Failed to load your buttons</h2>";
          });
      }
    });
  })
  document.getElementById("undo").addEventListener("click", undoUpdate);

  let alertSystem = {
    callAlert: function(title, message, {okBtn="OK", cancelBtn="Cancel"} = {okBtn: "OK", cancelBtn: "Cancel"}, showCancel=false) {
      return new Promise((resolve, reject) => {
        this._queue.push({ type: 1, title, message, okBtn, cancelBtn, showCancel, resolve, reject });
        !this._r?this._rq():null;
      });
    },
    _queue: [],
    _rq: async function() {
      if (this._queue.length > 0) {
        this._r = true;
        const item = this._queue.shift();
        if (item.type == 1) {
          let res = await showAlert(item.title, item.message, {okBtn: item.okBtn, cancelBtn: item.cancelBtn}, item.showCancel);
          if (res) {
            item.resolve(true);
          } else {
            item.resolve(false);
          }
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
      
      pageLayout.classList.add('hide');
      alertOverlay.style.opacity = 1;
      alertBackground.classList.add('active');
      
      function closeAlert() {
        document.removeEventListener('keydown', keyCloseA);
        alertOverlay.removeEventListener('click', resFalse);
        alertOk.removeEventListener('click', resTrue);
        showCancel ? alertCancel.removeEventListener('click', resFalse) : null;
        alertOverlay.style.opacity = 0;
        alertBackground.classList.remove('active');
        pageLayout.classList.remove('hide');
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

  const customButtonEditor = document.querySelector('.custom-button-editor');
  const editorBackground = document.querySelector('.editor-background');
  const editorOverlay = customButtonEditor.querySelector('.alert-overlay');
  const uploadButton = document.getElementById('upload-btn');
  const fileNameDisplay = document.getElementById('file-name');
  const fileInput = document.getElementById('button-icon-upload');
  const buttonTitleInput = document.getElementById('button-title');
  const buttonUrlInput = document.getElementById('button-url');
  const titleCharCount = document.getElementById('title-char-count');
  const previewImg = document.getElementById('preview-img');
  const previewTitle = document.getElementById('preview-title');
  const editorCreate = document.getElementById('editor-create');
  const editorCancel = document.getElementById('editor-cancel');
  const buttonContent = {image: "", title: "", url: ""};

  const addNewButton = document.querySelector('#custom-btns-container .drawer-custom-btn');
  
  addNewButton.addEventListener('click', () => {
    openCustomButtonEditor();
  });

  function openCustomButtonEditor() {
    if (cbl.cButtons.length >= 10) {
      alertSystem.callAlert("Button Limit Reached", "You have reached the maximum amount of custom buttons (10).\nPlease remove some before adding new ones.");
      return;
    }
    fileNameDisplay.textContent = 'No file chosen';
    buttonTitleInput.value = '';
    buttonUrlInput.value = '';
    titleCharCount.textContent = '0';
    previewImg.src = '/images/icons/VBCLogo.webp';
    previewTitle.textContent = 'Custom Button';
    editorCreate.disabled = true;
    
    customButtonEditor.style.display = '';
    setTimeout(() => {
      document.addEventListener('keydown', keyCloseEditor);
      editorBackground.classList.add('active');
      editorOverlay.style.opacity = '1';
      pageLayout.classList.add('hide');
    }, 10);
  }

  function closeCustomButtonEditor() {
    document.removeEventListener('keydown', keyCloseEditor);
    editorBackground.classList.remove('active');
    editorOverlay.style.opacity = '0';
    pageLayout.classList.remove('hide');
    
    setTimeout(() => {
      customButtonEditor.style.display = 'none';
    }, 500);
  }

  function keyCloseEditor(e) {
    if (e.key === "Escape") {
      closeCustomButtonEditor();
    }
  }

  uploadButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      fileNameDisplay.textContent = 'Invalid file type';
      return;
    }

    fileNameDisplay.textContent = file.name;

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let w = img.width;
        let h = img.height;

        if (w > 150 || h > 150) {
          if (w > h) {
            h *= 150 / w;
            w = 150;
          } else {
            w *= 150 / h;
            h = 150;
          }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const compressedDataUrl = canvas.toDataURL('image/png');
        previewImg.src = compressedDataUrl;
        buttonContent.image = compressedDataUrl;
        validateForm();
      };
      img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
  });

  buttonTitleInput.addEventListener('input', (e) => {
    let value = e.target.value;
    buttonTitleInput.value = value.substring(0, 15);
    value = buttonTitleInput.value;
    titleCharCount.textContent = value.length;
    buttonContent.title = value.trim();

    previewTitle.textContent = value || 'Custom Button';

    previewTitle.style.fontSize = "";
    shrinkToFit(previewTitle, 14);
    validateForm();
  });

  buttonUrlInput.addEventListener('input', () => {
    buttonContent.url = buttonUrlInput.value.trim();
    validateForm();
  });

  function validateForm() {
    const hasImage = buttonContent.image.length > 0 && buttonContent.image.startsWith('data:image/');
    const hasTitle = buttonContent.title.length > 0 && buttonContent.title.length <= 15;
    const hasValidUrl = isValidUrl(buttonContent.url);
    
    editorCreate.disabled = !(hasImage && hasTitle && hasValidUrl);
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

  editorCancel.addEventListener('click', closeCustomButtonEditor);

  editorCreate.addEventListener('click', () => {
    const hasImage = buttonContent.image.length > 0 && buttonContent.image.startsWith('data:image/');
    const hasTitle = buttonContent.title.length > 0 && buttonContent.title.length <= 15;
    const hasValidUrl = isValidUrl(buttonContent.url);
    if (editorCreate.disabled || !(hasImage && hasTitle && hasValidUrl)) return;
    const newButton = {
      name: buttonContent.title,
      icon: buttonContent.image,
      url: buttonContent.url
    };
    
    updateCLS(true, newButton);

    closeCustomButtonEditor();
  });

  function updateCLS(add, { cid, name, icon, url }) {
    if (!cbl.cButtons) cbl.cButtons = [];
    if (add) {
      if (!name || !icon || !url) return;
      if (cbl.cButtons.length >= 10) {
        alertSystem.callAlert("Button Limit Reached", "You have reached the maximum amount of custom buttons (10).\nPlease remove some before adding new ones.");
        return;
      }
      let nE = cbl.cButtons.some(cButton => cButton.name === name);
      let uE = cbl.cButtons.some(cButton => cButton.url === url);
      let iE = cbl.cButtons.some(cButton => cButton.icon === icon);
      if (nE || uE || iE) {
        let prop = nE ? "name" : uE ? "url" : "icon";
        alertSystem.callAlert(`Duplicate Button ${prop.charAt(0).toUpperCase()+prop.slice(1)}`, `A button with this ${prop} already exists.\nPlease choose a different ${prop}.`);
        return;
      }
      let buttonData = {
        name,
        icon,
        url,
        cid: cbl.cButtons.reduce((max, cButton) => Math.max(max, cButton.cid || 0), -1) + 1
      };

      cbl.cButtons.push(buttonData);
      localStorage.setItem("custombuttonlist", JSON.stringify(cbl));
      loadCLS();
    } else {
      if (cid == undefined || typeof Number(cid) != "number") return;
      cbl.cButtons = cbl.cButtons.filter(cButton => cButton.cid !== cid);
      changes = changes.filter(change => change.cid !== cid);
      localStorage.setItem("custombuttonlist", JSON.stringify(cbl));
      loadCLS();
      loadLS();
    }
  };

  function loadCLS() {
    if (!cbl || !cbl.cButtons) return;
    let cButtons = cbl.cButtons;
    if (cButtons.length >= 10) cButtons.length = 10;
    cButtons.forEach((cButton) => {
      if (typeof cButton.cid !== 'number' || typeof cButton.name !== 'string' || cButton.name.length === 0 || cButton.name.length > 15 || !isValidUrl(cButton.url) || !cButton.icon.startsWith('data:image/')) {
        cButton.tagged = true;
      }
    });
    cButtons = cButtons.filter(cButton => !cButton.tagged);
    cbl.cButtons = cButtons;
    localStorage.setItem("custombuttonlist", JSON.stringify(cbl));

    const customBtn = cButtonContainer.querySelector('.drawer-custom-btn');
    cButtonContainer.innerHTML = '';
    cButtonContainer.appendChild(customBtn);
    
    cButtons.forEach((cButton) => {
      const cBtnElem = document.createElement('div');
      cBtnElem.classList.add("drawer-card");
      cBtnElem.setAttribute("draggable", "true");
      bl.buttons.length >= 25 ? cBtnElem.classList.add('locked') : null;
      cBtnElem.dataset.href = cButton.url;
      cBtnElem.dataset.cid = cButton.cid;
      cBtnElem.innerHTML = `<img src="${cButton.icon}" alt="${cButton.name} Icon"><div class="overlay" style="padding: 5px;bottom: -8%;"><p>${cButton.name}</p></div><div class="locked-overlay"><i class="fa-solid fa-lock"></i></div>`;
      let clickAllowed = true;

      const presetData = {
        name: cButton.name,
        icon: cButton.icon,
        url: cButton.url,
        cid: cButton.cid
      };

      cBtnElem.addEventListener('mousedown', (e) => {
        if (e.button == 0 || e.button == 1) {
          clickAllowed = true;
        }
      });
      cBtnElem.addEventListener('mouseup', (e) => {
        if ((e.button == 0 || e.button == 1) && clickAllowed && !(cBtnElem.dragging || cBtnElem.classList.contains("dragging"))) {
          e.preventDefault();
          if (cBtnElem.classList.contains('delete-mode')) {
            const cid = cButton.cid;
            updateCLS(false, { cid });
            loadCLS();
          } else {
            document.querySelectorAll('.drawer-card.delete-mode').forEach(card => {
              card.classList.remove('delete-mode');
              setTimeout(() => {
                if (card.classList.contains("delete-mode")) return;
                card.querySelector('.locked-overlay i').classList.remove('fa-trash');
                card.querySelector('.locked-overlay i').classList.add('fa-lock');
              }, card.classList.contains("locked") ? 0 : 400);
            });
            
            cBtnElem.classList.add('delete-mode');
            cBtnElem.querySelector('.locked-overlay i').classList.add('fa-trash');
            cBtnElem.querySelector('.locked-overlay i').classList.remove('fa-lock');
            setTimeout(() => {
              document.addEventListener('mousedown', removeDeleteMode);
            }, 0);
          }
        }
      });

      function removeDeleteMode(e) {
        if (!cBtnElem.contains(e.target)) {
          cBtnElem.classList.remove('delete-mode');
          setTimeout(() => {
            if (cBtnElem.classList.contains("delete-mode")) return;
            cBtnElem.querySelector('.locked-overlay i').classList.remove('fa-trash');
            cBtnElem.querySelector('.locked-overlay i').classList.add('fa-lock');
          }, cBtnElem.classList.contains("locked") ? 0 : 400);
          document.removeEventListener('mousedown', removeDeleteMode);
        }
      }
      
      cBtnElem.addEventListener('dragstart', (e) => {
        if (cBtnElem.classList.contains('locked') || cBtnElem.classList.contains('delete-mode')) {
          e.preventDefault();
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        clickAllowed = false;
        startDrag(e, cBtnElem, presetData);
      });
      
      cButtonContainer.appendChild(cBtnElem);
    });

    cButtonContainer.appendChild(customBtn);

    let isDragging = false;
    let dragGhost = null;
    let activeGap = null;

    function startDrag(e, presetEl, presetData) {
      e.preventDefault();

      if (bl.buttons.length >= 25) {
        cButtonContainer.querySelectorAll('.drawer-card').forEach(p => {
          p.classList.add('locked');
        });
        return;
      }
      
      cardsContainer.classList.add('dragging-active');
      
      dragGhost = presetEl.cloneNode(true);
      dragGhost.classList.add('drag-ghost');
      dragGhost.style.width = `${presetEl.offsetWidth}px`;
      dragGhost.style.height = `${presetEl.offsetHeight}px`;
      document.body.appendChild(dragGhost);
      isDragging = true;
      
      updateGhostPosition(e);
      
      presetEl.classList.add('dragging');
      presetEl.dragging = true;
      
      $drag.el = presetEl;
      $drag.id = presetData.id;
      const properties = { name: presetData.name, icon: presetData.icon, url: presetData.url };
      presetData.param ? properties.param = presetData.param : null;
      presetData.popup ? properties.popup = structuredClone(presetData.popup) : null;
      presetData.cid != undefined && typeof Number(presetData.cid) == "number" ? properties.cid = presetData.cid : null;
      $drag.properties = properties;
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    function updateGhostPosition(e) {
      if (!dragGhost) return;
      dragGhost.style.left = `${e.clientX - 20}px`;
      dragGhost.style.top = `${e.clientY - 10}px`;
    }
    
    function onMouseMove(e) {
      e.preventDefault();
      
      if (isDragging) {
        updateGhostPosition(e);
        
        const elemBelow = document.elementFromPoint(e.clientX, e.clientY);

        if (elemBelow) {
          let target = elemBelow;
          while (target && !target.classList.contains('card-gap') && target !== cardsContainer && target !== trashZone) {
            target = target.parentElement;
          }
          
          if (target && target.classList.contains('card-gap')) {
            if (activeGap && activeGap !== target) {
              activeGap.classList.remove('active');
            }

            target.classList.add('active');
            activeGap = target;
          } else if (activeGap) {
            activeGap.classList.remove('active');
            activeGap = null;
          }

          if (target && target === trashZone) {
            trashZone.classList.add('active');
          } else {
            trashZone.classList.remove('active');
          }
        }

        if (e.clientY < 50) {
          window.scrollBy(0, -10);
        } else if (e.clientY > window.innerHeight - 50) {
          window.scrollBy(0, 10);
        }
      }
    }
    
    function onMouseUp(e) {
      if (!isDragging) return;
      
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (activeGap && bl.buttons.length < 25) {
        let target = parseInt(activeGap.getAttribute('data-index'));
        b = $drag.properties;
        b.id = target;
        updateLS(true, b);

        loadLS();
      } else if (trashZone.classList.contains('active')) {
        trashZone.classList.remove('active');
        updateCLS(false, { cid: $drag.properties.cid });
      }
      
      cleanupDrag();
    }
    
    document.addEventListener('dragover', onMouseMove);
    document.addEventListener('drop', onMouseUp);
    document.addEventListener('dragend', cleanupDrag);
    
    function cleanupDrag() {
      if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
      }

      if (activeGap) {
        activeGap.classList.remove('active');
        activeGap = null;
      }
      
      document.querySelectorAll('.drawer-card.dragging').forEach(card => {
        card.classList.remove('dragging');
        card.dragging = false;
      });
      cardsContainer.classList.remove('dragging-active');
      
      $drag.el = null;
      $drag.id = null;
      $drag.properties = {};
      
      document.removeEventListener('dragover', onMouseMove);
      document.removeEventListener('drop', onMouseUp);
      document.removeEventListener('dragend', cleanupDrag);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  }

  console.log(`                ,---,.   ,----..   \n       ,---.  ,'  .'  \\ /   /   \\  \n      /__./|,---.' .' ||   :     : \n ,---.;  ; ||   |  |: |.   |  ;. / \n/___/ \\  | |:   :  :  /.   ; /--\`  \n\\   ;  \\ ' |:   |    ; ;   | ;     \n \\   \\  \\: ||   :     \\|   : |     \n  ;   \\  ' .|   |   . |.   | '___  \n   \\   \\   ''   :  '; |'   ; : .'| \n    \\   \`  ;|   |  | ; '   | '/  : \n     :   \\ ||   :   /  |   :    /  \n      '---\" |   | ,'    \\   \\ .'   \n            \`----'       \`---\`     \nIntranet ${version}`)
})();