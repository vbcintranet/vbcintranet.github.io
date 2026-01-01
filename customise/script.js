(() => {
  const version = "v2.2.0";

  const consol = {
    log: (message, title = "Core", colour = "#FF6961") => { console.log(`%c(${title}) %c${message}`, `color:${colour};font-weight:bold`, "") },
    warn: (message, title = "Core") => { console.warn(`%c(${title}) %c${message}`, `color:#FFD699;font-weight:bold`, "") },
    error: (message, title = "Core") => { console.error(`%c(${title}) %c${message}`, `color:#FFB3B3;font-weight:bold`, "") }
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
          req.onerror = () => resolve('/images/icons/Unknown.webp');
          req.onsuccess = () => resolve(req.result?.dataUrl || '/images/icons/Unknown.webp');
        });
      } catch (e) { 
        consol.error(`Failed to retrieve icon ${cid}`, 'IndexedDB');
        return '/images/icons/Unknown.webp';
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
    move: async function(oldCid, newCid) {
      try {
        if (oldCid === newCid) return;
        const db = await this.init();
        const existing = await this.get(oldCid);
        if (!existing || existing === '/images/icons/Unknown.webp') return;
        await new Promise((resolve, reject) => {
          const tx = db.transaction(this.storeName, 'readwrite');
          const store = tx.objectStore(this.storeName);
          const req = store.put({ cid: newCid, dataUrl: existing, timestamp: Date.now() });
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve();
        });
        await this.delete(oldCid);
      } catch (e) { 
        consol.error(`Failed to move icon ${oldCid} -> ${newCid}`, 'IndexedDB');
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
    let now = new Date()
    document.getElementById("clock").innerText = `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()]}, ${now.getDate()}${(!(String(now.getDate())[0] == "1" && String(now.getDate()).length == 2)&&[1,2,3].includes(now.getDate() % 10))?['st','nd','rd'][(now.getDate() % 10)-1]:'th'} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][now.getMonth()]} ${now.getFullYear()}, ${[0,12].includes(now.getHours()) ? '12' : now.getHours() > 11 ? now.getHours()-12 : now.getHours()}:${now.getMinutes() < 10 ? "0"+now.getMinutes() : now.getMinutes()}:${now.getSeconds() < 10 ? "0"+now.getSeconds() : now.getSeconds()} ${now.getHours() > 11 ? 'PM' : 'AM'}`
    setTimeout(updateClock, 1000 - now.getMilliseconds());
  }
  updateClock();

  const pageLayout = document.querySelector('.page-layout');
  const accept = document.getElementById('accept');
  const advancedSection = document.querySelector('.advanced-section');
  const advancedToggle = document.querySelector('.advanced-toggle');

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      pageLayout.classList.remove('hide');
      document.querySelector('.content-blur').classList.remove('show');
      setTimeout(() => { document.querySelector('.content-blur').remove(); }, 500);
      try {
        const isMac = /Mac/i.test(navigator.platform) || /Mac/i.test(navigator.userAgent);
        const hotkeyEl = document.getElementById('edit-hotkey');
        if (hotkeyEl) hotkeyEl.textContent = isMac ? '⌘' : 'CTRL';
      } catch {}
      if (advancedSection) advancedSection.classList.remove('open');
      if (advancedToggle && advancedSection) {
        advancedToggle.addEventListener('click', () => {
          advancedSection.classList.toggle('open');
        });
      }
    }, 200)
  });

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
      addOpen = true;
      pulloutButton.classList.add('active');
      drawerContainer.classList.add('active');
      escapeStack.push('drawer', closeDrawer);
    }
  }

  function closeDrawer() {
    pulloutButton.classList.remove('active');
    drawerContainer.classList.remove('active');
    addOpen = false;
    escapeStack.pop('drawer');
  }

  function toggleDrawer() {
    if (addOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

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

  var changes = []
  const $drag = {el: null, id: null, properties: {}, prev: null}
  const $mouseclick = {el: null, x: 0, y: 0}
  let lastMovedIndex = null;
  
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

  function shatterCard(card, callfirst) {
    if (typeof callfirst === 'function') callfirst();
    
    const img = card.querySelector('img');
    const needsCORS = img && img.src && !img.src.startsWith('data:') && !img.src.includes(window.location.hostname);
    
    if (needsCORS && (!img.crossOrigin || img.crossOrigin !== 'anonymous')) {
      consol.log('external image detected, attempting CORS reload', 'Shatter');
      const corsImg = new Image();
      corsImg.crossOrigin = 'anonymous';
      
      let corsTimeout = setTimeout(() => {
        consol.warn('CORS load timeout, using fallback', 'Shatter');
        shatterCardInternal(card);
      }, 2000);
      
      corsImg.onload = () => {
        clearTimeout(corsTimeout);
        consol.log('CORS image loaded successfully', 'Shatter');
        img.crossOrigin = 'anonymous';
        img.src = corsImg.src;
        setTimeout(() => shatterCardInternal(card), 50);
      };
      
      corsImg.onerror = () => {
        clearTimeout(corsTimeout);
        consol.warn('CORS not supported by server, using fallback', 'Shatter');
        img.src = '/images/icons/Unknown.webp';
        setTimeout(() => shatterCardInternal(card), 50);
      };
      
      corsImg.src = img.src;
      return;
    }
    
    shatterCardInternal(card);
  }
  
  function shatterCardInternal(card) {
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

        let cardDataUrl;
        try {
          cardDataUrl = canvas.toDataURL('image/png');
          consol.log(`Captured dataURL length=${cardDataUrl.length}`, 'Shatter');
        } catch (e) {
          consol.warn('Failed to export canvas (still CORS tainted). Using fallback.', 'Shatter');
          card.classList.add('card-removing');
          setTimeout(() => {
            try { card.remove(); } catch (err) { card.parentNode && card.parentNode.removeChild(card); }
          }, 300);
          return;
        }

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

        const cx = $mouseclick.x ? Math.max(0, Math.min(100, ((($mouseclick.x - rect.left) / rect.width) * 100))) : 50 + (Math.random() - 0.5) * 50;
        const cy = $mouseclick.y ? Math.max(0, Math.min(100, ((($mouseclick.y - rect.top) / rect.height) * 100))) : 50 + (Math.random() - 0.5) * 50;

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
      !hide ? lastMovedIndex = b.id : null;
      bl.buttons.sort((a, b) => a.id - b.id);
      localStorageQueue.add("buttonlayout", JSON.stringify(bl));
      updateDrawerLockState();
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
          localStorageQueue.add("buttonlayout", JSON.stringify(bl));
          updateDrawerLockState();

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

  async function undoUpdate() {
    if (!changes.length) return;
    const lastChange = changes[changes.length - 1];
    const label = lastChange && lastChange.name ? lastChange.name : 'Button';
    const idxText = typeof lastChange?.from === 'number' ? ` position ${(lastChange.from ?? 0) + 1}` : typeof lastChange?.id === 'number' ? ` position ${(lastChange.id ?? 0) + 1}` : '';
    let desc = 'The last change has been undone.';

    if (lastChange) {
      if (lastChange.cbl) {
        const count = Array.isArray(lastChange.removedLayout) ? lastChange.removedLayout.length : 0;
        desc = count > 0
          ? `Restored custom button "${label}" and ${count} layout instance${count>1?'s':''}.`
          : `Restored custom button "${label}".`;
      } else if (lastChange.a && typeof lastChange.from === 'number') {
        desc = `Moved "${label}" back to${idxText || ' its previous spot'}.`;
      } else if (lastChange.a) {
        desc = `Removed "${label}" at${idxText || ''}.`;
      } else {
        desc = `Restored "${label}" to${idxText || ' the layout'}.`;
      }
    }

    if (lastChange.cbl && lastChange.created) {
      const confirmed = await alertSystem.callAlert(
        'Undo Custom Button Creation',
        `Are you sure you want to undo the creation of custom button "${label}"?`,
        { okBtn: 'Yes', cancelBtn: 'No' },
        true
      );
      if (confirmed) {
        await updateCLS(false, { cid: lastChange.cid }, true);
        changes.length = changes.length - 1 < 0 ? 0 : changes.length - 1;
        loadLS();
        toastSystem.notify('Action Undone', `Creation of "${label}" has been undone.`, { type: 'success' });
      }
      return;
    }
    if (lastChange.cbl) {
      const targetCid = lastChange.cid;
      const affectedUp = cbl.cButtons.filter(cb => cb.cid >= targetCid).sort((a,b)=> b.cid - a.cid);

      for (const cb of affectedUp) {
        const oldCid = cb.cid;
        const newCid = oldCid + 1;
        cb.cid = newCid;
        if (typeof cb.icon === 'string' && cb.icon.startsWith('idb:')) {
          cb.icon = `idb:${newCid}`;
        }
        try { await iconDB.move(oldCid, newCid); } catch {}
      }

      bl.buttons.forEach(btn => {
        if (typeof btn.cid === 'number' && btn.cid >= targetCid) {
          btn.cid = btn.cid + 1;
          if (typeof btn.icon === 'string' && btn.icon.startsWith('idb:')) {
            try {
              const oldCid = parseInt(btn.icon.slice(4), 10);
              if (!Number.isNaN(oldCid) && oldCid >= targetCid) btn.icon = `idb:${oldCid + 1}`;
            } catch {}
          }
        }
      });

      const restored = { name: lastChange.name, icon: lastChange.icon, url: lastChange.url, cid: targetCid };
      if (lastChange.param === 'self') restored.param = 'self';
      if (typeof restored.icon === 'string' && restored.icon.startsWith('idb:') && lastChange.idbIcon) {
        try { await iconDB.set(targetCid, lastChange.idbIcon); } catch {}
        restored.icon = `idb:${targetCid}`;
      }
      cbl.cButtons.push(restored);
      cbl.cButtons.sort((a,b)=> (a.cid||0) - (b.cid||0));
      localStorageQueue.add("custombuttonlist", JSON.stringify(cbl));
      localStorageQueue.add("buttonlayout", JSON.stringify(bl));
      loadCLS();
      
      if (Array.isArray(lastChange.removedLayout) && lastChange.removedLayout.length) {
        const items = [...lastChange.removedLayout].sort((a,b)=> (a.id ?? 0) - (b.id ?? 0));
        items.forEach(item => {
          updateLS(true, {id: item.id, name: item.name, icon: item.icon, url: item.url, param: item.param, pid: item.pid, cid: item.cid, popup: item.popup}, true);
        });
      }
    } else if (typeof lastChange.from == 'number' && lastChange.a) {
      (()=>{updateLS(false, { id: lastChange.id }, true); updateLS(true, {id: lastChange.from, name: lastChange.name, icon: lastChange.icon, url: lastChange.url, param: lastChange.param, pid: lastChange.pid, cid: lastChange.cid, popup: lastChange.popup}, true)})()
    } else if (lastChange.a) {
      updateLS(false, { id: lastChange.id }, true)
    } else {
      updateLS(true, { id: lastChange.id, name: lastChange.name, icon: lastChange.icon, url: lastChange.url, param: lastChange.param, pid: lastChange.pid, cid: lastChange.cid, popup: lastChange.popup }, true)
    }
    changes.length = changes.length - 1 < 0 ? 0 : changes.length - 1;
    loadLS();
    toastSystem.notify("Action Undone", desc, { type: 'success' });
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
          let li = null;
          if (!b.name || !b.icon || !b.url ) {b.tagged = true;resolve();};
          if (b.pid != undefined && typeof Number(b.pid) == "number" && vdefbl.all.filter(d=>d.pid==b.pid).length == 0) {b.tagged = true;resolve();}
          else if (b.pid != undefined && typeof Number(b.pid) == "number") {li = vdefbl.all.filter(d=>d.pid==b.pid)[0];}
          else if (b.cid != undefined && typeof Number(b.cid) == "number") {li = cbl.cButtons.filter(d=>d.cid==b.cid)[0];};
          if (!li) {b.tagged = true;resolve();};

          ['name', 'icon', 'url', 'param', 'popup'].forEach(p => {
            if (!!li[p] && !deepEqual(b[p], li[p])) {b[p] = structuredClone(li[p]);refReq = true;};
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
          localStorageQueue.add("buttonlayout", JSON.stringify(bl));
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
      let resolvedIcon = buttonData.icon;
      if (buttonData.icon && buttonData.icon.startsWith('idb:')) {
        resolvedIcon = '/images/icons/Unknown.webp';
      }
      button.innerHTML = `<img src="${resolvedIcon}" alt="${buttonData.name} Icon" onerror="this.src='/images/icons/Unknown.webp'"><div class="overlay"><p>${buttonData.name}</p></div><div class="delete-overlay"><i class="fa-solid fa-trash"></i></div>`;
      if (buttonData.icon && buttonData.icon.startsWith('idb:')) {
        iconDB.get(buttonData.cid).then(idbIcon => {
          if (idbIcon) {
            try {
              const imgEl = button.querySelector('img');
              if (imgEl) imgEl.src = idbIcon;
            } catch (e) {}
          }
        }).catch(() => {});
      }
      button.fontSize = "";
      shrinkToFit(button.querySelector('.overlay p'), 14);
      let clickAllowed = true;
      button.addEventListener('mousedown', (e) => {
        if (e.button == 0) {
          clickAllowed = true;
        }
        $mouseclick.el = button;
        $mouseclick.x = e.clientX;
        $mouseclick.y = e.clientY;
      });
      button.addEventListener('mouseup', (e) => {
        if (e.button == 0 && clickAllowed && !(button.dragging || button.classList.contains("dragging")) && !$drag.el && (Math.abs(e.clientX - $mouseclick.x) < 5 && Math.abs(e.clientY - $mouseclick.y) < 5)) {
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
      gap.innerHTML = `<div><i class="fa-solid fa-plus"></i><i class="fa-solid fa-arrows-up-down-left-right"></i></div>`;
      gap.classList.add('card-gap');
      gap.setAttribute('data-index', index);
      return gap;
    }
    
    cardsContainer.innerHTML = '';

    if (bl.buttons.length === 0) {
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

    if (lastMovedIndex !== null) {
      const movedCard = cardsContainer.querySelector(`.card[data-index="${lastMovedIndex}"]`);
      if (movedCard) {
        movedCard.classList.remove('moved');
        void movedCard.offsetWidth;
        movedCard.classList.add('moved');
        const handleAnimationEnd = () => {
          movedCard.classList.remove('moved');
          movedCard.removeEventListener('animationend', handleAnimationEnd);
        };
        movedCard.addEventListener('animationend', handleAnimationEnd);
      }
      lastMovedIndex = null;
    }
    
    let isDragging = false;
    
    function startDrag(e, button, index, itemData) {
      e.preventDefault();
      
      vId = index;
      
      cardsContainer.classList.add('dragging-active', 'move');
      
      dragGhost = button.cloneNode(true);
      dragGhost.classList.add('drag-ghost');
      dragGhost.style.width = `${button.offsetWidth}px`;
      dragGhost.style.height = `${button.offsetHeight}px`;
      document.body.appendChild(dragGhost);
      
      isDragging = true;
      
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
      cardsContainer.classList.remove('dragging-active', 'move');
      
      vId = -1;
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
          presetElem.innerHTML = `<img src="${preset.icon}" alt="${preset.name} Icon" onerror="this.src='/images/icons/Unknown.webp'"><div class="overlay" style="padding: 5px;bottom: -8%;"><p>${preset.name}</p></div><div class="locked-overlay"><i class="fa-solid fa-lock"></i></div>`;
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
            $mouseclick.el = presetElem;
            $mouseclick.x = e.clientX;
            $mouseclick.y = e.clientY;
          });
          presetElem.addEventListener('mouseup', (e) => {
            if ((e.button == 0 || e.button == 1) && clickAllowed && !(presetElem.dragging || presetElem.classList.contains("dragging")) && !$drag.el && (Math.abs(e.clientX - $mouseclick.x) < 5 && Math.abs(e.clientY - $mouseclick.y) < 5)) {
              if (bl.buttons.length >= 25) {
                drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
                  p.classList.add('locked');
                });

                alertSystem.callAlert("Button Limit Reached", "You have reached the maximum amount of buttons (25).\nPlease remove some before adding new ones.");
                return;
              }

              updateLS(true, presetData);

              updateDrawerLockState();

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
      
      cardsContainer.classList.add('dragging-active', 'insert');
      
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
      cardsContainer.classList.remove('dragging-active', 'insert');
      
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
      localStorageQueue.add("old-buttonlayout", localStorage.getItem("buttonlayout"))
      localStorage.removeItem("buttonlayout")
      fetch("/def/def.json")
        .then(function (res) {
          return res.text()
        })
        .then(function (def) {
          let vdef = JSON.parse(def)
          delete vdef.all;
          localStorageQueue.add("buttonlayout", JSON.stringify(vdef))
          bl = JSON.parse(JSON.stringify(vdef))
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

          loadLS();
          loadCLS();
        })();
      } else {
        loadLS();
      }
    }
  } else {
    fetch("/def/def.json")
      .then(function (res) {
        return res.text()
      })
      .then(function (def) {
        let vdef = JSON.parse(def);
        delete vdef.all;
        localStorageQueue.add("buttonlayout", JSON.stringify(vdef));
        bl = JSON.parse(JSON.stringify(vdef));
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
            localStorageQueue.add("buttonlayout", JSON.stringify(vdef));
            bl = JSON.parse(JSON.stringify(vdef));
            loadLS();
            changes.length = 0;
            updateDrawerLockState();
            toastSystem.notify("Button Layout Reset", "Your button layout has been reset to default.", { type: 'success' });
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
  let toastContainer = document.querySelector('.toast-container');
  function startToastTimer(toastData) {
    if (!toastData) return;
    const fill = toastData.progressFill;
    toastData.start = Date.now();
    fill.style.transition = 'none';
    fill.style.width = `${(toastData.remaining / toastData.timeout) * 100}%`;
    void fill.offsetWidth;
    fill.style.transition = `width ${toastData.remaining}ms linear`;
    fill.style.width = '0%';
    toastData.timer = setTimeout(() => removeToast(toastData.el), toastData.remaining);
  }

  function pauseToast(toastData) {
    if (!toastData) return;
    if (toastData.timer) {
      clearTimeout(toastData.timer);
      toastData.timer = null;
      const elapsed = Date.now() - (toastData.start || Date.now());
      toastData.remaining = Math.max(0, toastData.remaining - elapsed);
    }
    const fill = toastData.progressFill;
    const trackWidth = fill.parentElement ? fill.parentElement.clientWidth || 1 : 1;
    const currentWidth = parseFloat(getComputedStyle(fill).width) || (toastData.remaining / toastData.timeout) * trackWidth;
    const percent = Math.max(0, Math.min(100, (currentWidth / trackWidth) * 100));
    fill.style.transition = 'none';
    fill.style.width = `${percent}%`;
  }

  function resumeToast(toastData) {
    if (!toastData) return;
    if (toastData.remaining <= 25) {
      removeToast(toastData.el);
      return;
    }
    startToastTimer(toastData);
  }

  function removeToast(el) {
    if (!el) return;
    const idx = toastSystem.activeToasts.findIndex(t => t.el === el);
    const data = idx !== -1 ? toastSystem.activeToasts[idx] : null;
    if (data && data.timer) {
      clearTimeout(data.timer);
      data.timer = null;
    }
    el.classList.add('exit-up');
    el.addEventListener('animationend', () => {
      const removeIdx = toastSystem.activeToasts.findIndex(t => t.el === el);
      if (removeIdx !== -1) toastSystem.activeToasts.splice(removeIdx, 1);
      try { el.remove(); } catch {}
    }, { once: true });
  }

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
        alertOverlay.removeEventListener('click', resFalse);
        alertOk.removeEventListener('click', resTrue);
        showCancel ? alertCancel.removeEventListener('click', resFalse) : null;
        alertOverlay.style.opacity = 0;
        alertBackground.classList.remove('active');
        pageLayout.classList.remove('hide');
        escapeStack.pop('alert');
        setTimeout(() => {
          alertContainer.style.display = 'none';
          alertTitle.innerText = "Alert";
          alertMessage.innerText = "Message";
          alertOk.innerText = "OK";
          alertCancel.style.display = 'none'
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

  const toastSystem = {
    notify: function(title, message, { timeout = 3500, type = 'info' } = {}) {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.setAttribute('role', 'status');
      const titleEl = document.createElement('div');
      titleEl.className = 'toast-title';
      titleEl.textContent = title || 'Notification';
      const msgEl = document.createElement('div');
      msgEl.className = 'toast-message';
      msgEl.textContent = message || '';
      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeToast(toast);
      });
      const progress = document.createElement('div');
      progress.className = 'toast-progress';
      const progressFill = document.createElement('div');
      progressFill.className = 'fill';
      progress.appendChild(progressFill);

      toast.appendChild(titleEl);
      toast.appendChild(msgEl);
      toast.appendChild(progress);
      toast.appendChild(closeBtn);

      toastContainer.appendChild(toast);
      const dismissMs = Math.max(1500, timeout);
      const toastData = { el: toast, timer: null, start: Date.now(), remaining: dismissMs, timeout: dismissMs, progressFill };
      toastSystem.activeToasts.push(toastData);

      toast.addEventListener('mouseenter', () => pauseToast(toastData));
      toast.addEventListener('mouseleave', () => resumeToast(toastData));

      startToastTimer(toastData);
    },
    activeToasts: []
  };

  const customButtonEditor = document.querySelector('.custom-button-editor');
  const editorBackground = document.querySelector('.editor-background');
  const editorOverlay = customButtonEditor.querySelector('.alert-overlay');
  const editorTitle = document.getElementById('editor-title');
  const uploadButton = document.getElementById('upload-btn');
  const clearImageBtn = document.getElementById('clear-image-btn');
  const fileNameDisplay = document.getElementById('file-name');
  const fileInput = document.getElementById('button-icon-upload');
  const urlInput = document.getElementById('button-image-url');
  const imageToggle = document.querySelector('.image-input-toggle');
  const buttonTitleInput = document.getElementById('button-title');
  const buttonUrlInput = document.getElementById('button-url');
  const titleCharCount = document.getElementById('title-char-count');
  const titleMessage = document.getElementById('title-message');
  const urlMessage = document.getElementById('url-message');
  const previewImg = document.getElementById('preview-img');
  const previewTitle = document.getElementById('preview-title');
  const editorApply = document.getElementById('editor-apply');
  const editorCancel = document.getElementById('editor-cancel');
  const editorDelete = document.getElementById('editor-delete');
  const sameTabCheckbox = document.getElementById('same-tab');
  const buttonContent = {image: "", title: "", url: "", param: undefined};
  let originalContent = {image: "", title: "", url: "", param: undefined};
  let imageValidated = false;
  let urlValidated = false;
  let editingCid = null;
  let deleteConfirmMode = false;

  function setImageToggle(mode) {
    const isUpload = mode === 'upload';
    const isUrl = mode === 'url';
    imageToggle.classList.toggle('expanded-upload', isUpload);
    imageToggle.classList.toggle('expanded-url', isUrl);
    uploadButton.innerText = (isUpload || isUrl) ? 'Change Image' : 'Upload Image';
    clearImageBtn.classList.toggle('hide', mode === 'none');
  }

  function applyStatus(el, state) {
    if (!el) return;
    el.classList.remove('valid', 'error', 'warning');
    if (state === 'valid') el.classList.add('valid');
    else if (state === 'error') el.classList.add('error');
    else if (state === 'warning') el.classList.add('warning');
  }

  function updateDrawerLockState() {
    const lock = bl && bl.buttons && bl.buttons.length >= 25;
    drawerBackground.querySelectorAll('.drawer-card').forEach(p => {
      lock ? p.classList.add('locked') : p.classList.remove('locked');
    });
  }

  const addNewButton = document.querySelector('#custom-btns-container .drawer-custom-btn');
  
  addNewButton.addEventListener('click', () => {
    openCBE();
  });

  function openCBE(cButton) {
    const isEdit = !!cButton;

    if (!isEdit && cbl.cButtons.length >= 10) {
      alertSystem.callAlert(
        "Button Limit Reached",
        "You have reached the maximum amount of custom buttons (10).\nPlease remove some before adding new ones."
      );
      return;
    }

    editingCid = isEdit ? cButton.cid : null;
    deleteConfirmMode = false;
    editorTitle.textContent = isEdit ? 'Edit Custom Button' : 'Create Custom Button';
    editorDelete.style.display = isEdit ? '' : 'none';
    editorDelete.classList.remove('delete-mode');
    editorApply.textContent = isEdit ? 'Apply' : 'Create';

    fileInput.value = '';
    buttonTitleInput.value = isEdit ? cButton.name : '';
    buttonUrlInput.value = isEdit ? cButton.url : '';
    titleCharCount.textContent = isEdit ? cButton.name.length : '0';

    titleMessage.textContent = isEdit ? '✓ Valid title' : 'No title';
    applyStatus(titleMessage, isEdit ? 'valid' : 'none');

    urlMessage.textContent = isEdit ? '✓ Valid URL' : 'No URL';
    applyStatus(urlMessage, isEdit ? 'valid' : 'none');

    (async () => {
      let resolvedIcon = isEdit ? cButton.icon : '';
      if (isEdit && cButton.icon.startsWith('idb:')) {
        const idbIcon = await iconDB.get(cButton.cid);
        if (idbIcon) resolvedIcon = idbIcon;
      }

      const isDataImg = isEdit ? resolvedIcon.startsWith('data:image/') : false;
      fileNameDisplay.textContent = isEdit ? (isDataImg ? '✓ Image loaded' : '✓ Image loaded from URL') : 'No file chosen';
      applyStatus(fileNameDisplay, isEdit ? 'valid' : 'none');
      setImageToggle(isEdit ? (isDataImg ? 'upload' : 'url') : 'none');

      urlInput.value = isEdit && !isDataImg ? resolvedIcon : '';

      previewImg.src = isEdit ? resolvedIcon : '/images/icons/Unknown.webp';
      previewTitle.textContent = isEdit ? cButton.name : 'Custom Button';
      editorApply.disabled = true;

      imageValidated = !!isEdit;
      urlValidated = !!isEdit;
      buttonContent.image = isEdit ? resolvedIcon : '';
      buttonContent.title = isEdit ? cButton.name : '';
      buttonContent.url = isEdit ? cButton.url : '';
      buttonContent.param = isEdit && cButton.param === 'self' ? 'self' : undefined;
      originalContent = isEdit
        ? { image: resolvedIcon, title: cButton.name, url: cButton.url, param: cButton.param === 'self' ? 'self' : undefined }
        : { image: "", title: "", url: "", param: undefined };

      if (sameTabCheckbox) sameTabCheckbox.checked = isEdit ? cButton.param === 'self' : false;
      if (advancedSection) advancedSection.classList.remove('open');

      customButtonEditor.style.display = '';
      setTimeout(() => {
        editorBackground.classList.add('active');
        editorOverlay.style.opacity = '1';
        pageLayout.classList.add('hide');
        escapeStack.push('editor', closeCBE);
      }, 10);
    })();
  }

  function closeCBE() {
    editorBackground.classList.remove('active');
    editorOverlay.style.opacity = '0';
    pageLayout.classList.remove('hide');
    escapeStack.pop('editor');
    
    setTimeout(() => {
      customButtonEditor.style.display = 'none';
    }, 500);
  }

  uploadButton.addEventListener('click', () => {
    fileInput.click();
  });

  clearImageBtn.addEventListener('click', () => {
    fileInput.value = '';
    urlInput.value = '';
    previewImg.src = '/images/icons/Unknown.webp';
    fileNameDisplay.textContent = 'No file chosen';
    applyStatus(fileNameDisplay, 'none');
    setImageToggle('none');
    buttonContent.image = "";
    imageValidated = false;
    validateForm();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      fileNameDisplay.textContent = 'Error: Invalid file type. Please upload an image.';
      applyStatus(fileNameDisplay, 'error');
      imageValidated = false;
      buttonContent.image = "";
      imageToggle.classList.remove('expanded-upload', 'expanded-url');
      uploadButton.innerText = 'Upload Image';
      clearImageBtn.classList.add('hide');
      validateForm();
      return;
    }

    if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
      fileNameDisplay.textContent = 'Error: Animated images (GIFs) are not allowed.';
      applyStatus(fileNameDisplay, 'error');
      imageValidated = false;
      buttonContent.image = "";
      imageToggle.classList.remove('expanded-upload', 'expanded-url');
      uploadButton.innerText = 'Upload Image';
      clearImageBtn.classList.add('hide');
      validateForm();
      return;
    }

    fileNameDisplay.textContent = file.name;
    applyStatus(fileNameDisplay, 'none');
    setImageToggle('upload');

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let w = img.width;
        let h = img.height;

        const minDim = 150;
        const maxDim = 512;
        if (w > maxDim || h > maxDim) {
          const scale = Math.min(maxDim / w, maxDim / h);
          w = Math.floor(w * scale);
          h = Math.floor(h * scale);
        }
        if (w < minDim || h < minDim) {
          const scale = Math.max(minDim / w, minDim / h);
          w = Math.floor(w * scale);
          h = Math.floor(h * scale);
        }

        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL('image/webp');
        previewImg.src = dataUrl;
        buttonContent.image = dataUrl;
        imageValidated = true;
        fileNameDisplay.textContent = `✓ ${file.name}`;
        applyStatus(fileNameDisplay, 'valid');
        validateForm();
      };
      img.onerror = function() {
        fileNameDisplay.textContent = 'Error: Unable to load image. Please try a different file.';
        applyStatus(fileNameDisplay, 'error');
        imageValidated = false;
        buttonContent.image = "";
        setImageToggle('none');
        validateForm();
      };
      img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
  });

  urlInput.addEventListener('input', () => {
    if (!urlInput.value.trim()) {
      previewImg.src = '/images/icons/Unknown.webp';
      fileNameDisplay.textContent = 'No file chosen';
      applyStatus(fileNameDisplay, 'none');
      imageToggle.classList.remove('expanded-url');
      clearImageBtn.classList.add('hide');
    } else {
      imageToggle.classList.add('expanded-url');
      imageToggle.classList.remove('expanded-upload');
    }
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      urlInput.blur();
    }
  });

  urlInput.addEventListener('blur', async () => {
    const url = urlInput.value.trim();
    imageValidated = false;
    validateForm();
    if (!url) {
      if (!buttonContent.image) {
        imageToggle.classList.remove('expanded-url');
      }
      previewImg.src = '/images/icons/Unknown.webp';
      fileNameDisplay.textContent = 'No file chosen';
      fileNameDisplay.classList.remove('error', 'valid');
      return;
    }

    setImageToggle('url');

    if (!isValidUrl(url)) {
      fileNameDisplay.textContent = 'Error: Invalid URL format.';
      applyStatus(fileNameDisplay, 'error');
      previewImg.src = '/images/icons/Unknown.webp';
      buttonContent.image = "";
      return;
    }

    fileNameDisplay.textContent = 'Validating image...';
    applyStatus(fileNameDisplay, 'none');

    const isImage = await isImageUrlCT(url);
    if (!isImage) {
      fileNameDisplay.textContent = 'Error: URL does not point to a valid image.';
      applyStatus(fileNameDisplay, 'error');
      previewImg.src = '/images/icons/Unknown.webp';
      buttonContent.image = "";
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      previewImg.src = url;
      buttonContent.image = url;
      imageValidated = true;
      fileNameDisplay.textContent = '✓ Image loaded from URL';
      applyStatus(fileNameDisplay, 'valid');
      validateForm();
    };
    img.onerror = function() {
      fileNameDisplay.textContent = 'Error: Unable to load image from URL. Check image availability. Otherwise, save it and try uploading the image directly.';
      applyStatus(fileNameDisplay, 'error');
      imageValidated = false;
      previewImg.src = '/images/icons/Unknown.webp';
      buttonContent.image = "";
      validateForm();
    };
    img.src = url;
  });

  buttonTitleInput.addEventListener('input', (e) => {
    let value = e.target.value;
    buttonTitleInput.value = value.substring(0, 15);
    value = buttonTitleInput.value;
    titleCharCount.textContent = value.length;
    buttonContent.title = value.trim();

    if (value.trim().length > 0 && value.trim().length <= 15) {
      const isDuplicate = cbl.cButtons.some(cButton => 
        cButton.cid !== editingCid && cButton.name === value.trim()
      );
      if (isDuplicate) {
        titleMessage.textContent = '✗ Name already used';
        applyStatus(titleMessage, 'error');
      } else {
        titleMessage.textContent = '✓ Valid title';
        applyStatus(titleMessage, 'valid');
      }
    } else {
      titleMessage.textContent = 'No title';
      applyStatus(titleMessage, 'none');
    }

    previewTitle.textContent = value || 'Custom Button';

    previewTitle.style.fontSize = "";
    shrinkToFit(previewTitle, 14);
    validateForm();
  });

  buttonUrlInput.addEventListener('input', () => {
    buttonContent.url = buttonUrlInput.value.trim();
    
    if (!buttonContent.url) {
      urlMessage.textContent = 'No URL';
      applyStatus(urlMessage, 'none');
    } else {
      const isDuplicate = cbl.cButtons.some(cButton => 
        cButton.cid !== editingCid && cButton.url === buttonContent.url
      );
      if (isDuplicate) {
        urlMessage.textContent = '✗ URL already used';
        applyStatus(urlMessage, 'error');
      }
    }
    urlValidated = false;
    validateForm();
  });

  buttonUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buttonUrlInput.blur();
    }
  });

  buttonUrlInput.addEventListener('blur', async () => {
    urlValidated = false;
    const url = buttonUrlInput.value.trim();
    validateForm();

    if (!url) {
      urlMessage.textContent = 'No URL';
      applyStatus(urlMessage, 'none');
      return;
    }

    const isDuplicate = cbl.cButtons.some(cButton => 
      cButton.cid !== editingCid && cButton.url === url
    );
    if (isDuplicate) {
      urlMessage.textContent = '✗ URL already used';
      applyStatus(urlMessage, 'error');
      return;
    }

    if (!isValidUrl(url)) {
      urlMessage.textContent = '✗ Invalid URL';
      applyStatus(urlMessage, 'error');
      return;
    }

    urlMessage.textContent = 'Checking URL...';
    applyStatus(urlMessage, 'none');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeout);
      urlMessage.textContent = '✓ Valid URL';
      applyStatus(urlMessage, 'valid');
      urlValidated = true;
    } catch (error) {
      urlMessage.textContent = '⚠ URL unreachable';
      applyStatus(urlMessage, 'warning');
      urlValidated = true;
    }
    
    validateForm();
  });

  sameTabCheckbox && sameTabCheckbox.addEventListener('change', () => {
    buttonContent.param = sameTabCheckbox.checked ? 'self' : undefined;
    validateForm();
  });

  async function validateForm() {
    const hasImage = imageValidated && buttonContent.image.length > 0 && (buttonContent.image.startsWith('data:image/') || await isImageUrlCT(buttonContent.image));
    const hasTitle = buttonContent.title.length > 0 && buttonContent.title.length <= 15;
    const hasValidUrl = urlValidated && buttonContent.url.length > 0;
    
    const hasDuplicateName = cbl.cButtons.some(cButton => 
      cButton.cid !== editingCid && cButton.name === buttonContent.title
    );
    const hasDuplicateUrl = cbl.cButtons.some(cButton => 
      cButton.cid !== editingCid && cButton.url === buttonContent.url
    );
    
    let hasChanges = true;
    if (editingCid !== null) {hasChanges = buttonContent.image !== originalContent.image || buttonContent.title !== originalContent.title || buttonContent.url !== originalContent.url || buttonContent.param !== originalContent.param;}
    
    editorApply.disabled = !(hasImage && hasTitle && hasValidUrl && hasChanges && !hasDuplicateName && !hasDuplicateUrl);
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

  async function isImageUrlCT(url) {
    if (!isValidUrl(url)) return false;
    if (url.startsWith('data:image/')) {return !url.startsWith('data:image/gif');}
    if (url.startsWith('/')) {return isImageUrl(url);}
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      if (!contentType) {return isImageUrl(url);}
      return contentType.startsWith('image/') && !contentType.startsWith('image/gif');
    } catch (error) {
      return isImageUrl(url);
    }
  }

  editorCancel.addEventListener('click', closeCBE);

  editorDelete.addEventListener('click', () => {
    if (!deleteConfirmMode) {
      deleteConfirmMode = true;
      editorDelete.classList.add('delete-mode');
      setTimeout(() => {
        document.addEventListener('mousedown', cancelDelete);
      }, 0);
    } else {
      deleteConfirmMode = false;
      updateCLS(false, { cid: editingCid });
      closeCBE();
    }
  });

  function cancelDelete(e) {
    if (!editorDelete.contains(e.target)) {
      deleteConfirmMode = false;
      editorDelete.classList.remove('delete-mode');
      document.removeEventListener('mousedown', cancelDelete);
    }
  }

  editorApply.addEventListener('click', async () => {
    const hasImage = imageValidated && buttonContent.image.length > 0 && (buttonContent.image.startsWith('data:image/') || await isImageUrlCT(buttonContent.image));
    const hasTitle = buttonContent.title.length > 0 && buttonContent.title.length <= 15;
    const hasValidUrl = isValidUrl(buttonContent.url);
    if (editorApply.disabled || !(hasImage && hasTitle && hasValidUrl)) {
      if (!imageValidated) {
        fileNameDisplay.textContent = 'Error: Please upload an image or provide a valid image URL.';
        fileNameDisplay.classList.add('error');
      }
      return;
    }

    if (editingCid !== null) {
      const updatedButton = {
        cid: editingCid,
        name: buttonContent.title,
        icon: buttonContent.image,
        url: buttonContent.url,
        param: buttonContent.param
      };
      updateCLS('update', updatedButton);
    } else {
      const newButton = {
        name: buttonContent.title,
        icon: buttonContent.image,
        url: buttonContent.url,
        param: buttonContent.param
      };
      updateCLS(true, newButton);
    }

    closeCBE();
  });

  async function updateCLS(add, { cid, name, icon, url, param }, silent = false) {
    if (!cbl.cButtons) cbl.cButtons = [];
    if (add === 'update') {
      if (cid == undefined || typeof Number(cid) != "number") return;
      if (!name || !icon || !url) return;
      const idx = cbl.cButtons.findIndex(cButton => cButton.cid === cid);
      if (idx === -1) return;

      const nE = cbl.cButtons.some(cButton => cButton.cid !== cid && cButton.name === name);
      const uE = cbl.cButtons.some(cButton => cButton.cid !== cid && cButton.url === url);
      const iE = cbl.cButtons.some(cButton => cButton.cid !== cid && cButton.icon === icon);
      if (nE || uE || iE) {
        const prop = nE ? "name" : uE ? "url" : "icon";
        alertSystem.callAlert(`Duplicate Button ${prop.charAt(0).toUpperCase()+prop.slice(1)}`, `A button with this ${prop} already exists.\nPlease choose a different ${prop}.`);
        return;
      }

      const updated = { ...cbl.cButtons[idx], name, icon, url };
      if (param === 'self') updated.param = 'self'; else delete updated.param;
      cbl.cButtons[idx] = updated;
      
      if (icon.startsWith('data:image/') || await isImageUrlCT(icon)) {
        iconDB.set(cid, icon);
        updated.icon = `idb:${cid}`;
      }
      
      localStorageQueue.add("custombuttonlist", JSON.stringify(cbl));

      loadCLS();
      loadLS();
      if (!silent) toastSystem.notify('Custom Button Updated', `Changes to "${name}" have been applied.`, { type: 'success', timeout: 2500 });
    } else if (add) {
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
      
      const newCid = cbl.cButtons.reduce((max, cButton) => Math.max(max, cButton.cid || 0), -1) + 1;
      let buttonData = {
        name,
        icon,
        url,
        cid: newCid
      };
      if (param === 'self') buttonData.param = 'self';

      if (icon.startsWith('data:image/') || await isImageUrlCT(icon)) {
        iconDB.set(newCid, icon);
        buttonData.icon = `idb:${newCid}`;
      }

      cbl.cButtons.push(buttonData);
      localStorageQueue.add("custombuttonlist", JSON.stringify(cbl));

      try {
        const changeRecord = { cbl: true, created: true, cid: newCid, name, icon: buttonData.icon, url, param: buttonData.param };
        changes.push(changeRecord);
      } catch {}

      loadCLS();
      if (!silent) toastSystem.notify('Custom Button Created', `A new custom button "${name}" has been added.`, { type: 'success', timeout: 2500 });
    } else {
      if (cid == undefined || typeof Number(cid) != "number") return;
      const deletedDef = cbl.cButtons.find(cButton => cButton.cid === cid);
      const removedFromLayout = [];
      const toRemoveDetailed = bl.buttons
        .filter(btn => btn.cid === cid)
        .map(btn => ({ id: btn.id, name: btn.name, icon: btn.icon, url: btn.url, param: btn.param, pid: btn.pid, cid: btn.cid, popup: btn.popup }))
        .sort((a, b) => b.id - a.id);
      toRemoveDetailed.forEach(item => {
        removedFromLayout.push(item.name || "Custom Button");
        updateLS(false, { id: item.id }, true);
      });

      let idbIcon = null;
      if (deletedDef && typeof deletedDef.icon === 'string' && deletedDef.icon.startsWith('idb:')) {
        try { idbIcon = await iconDB.get(cid); } catch {}
      }
      cbl.cButtons = cbl.cButtons.filter(cButton => cButton.cid !== cid);

      const affected = cbl.cButtons.filter(cb => cb.cid > cid).sort((a,b)=> a.cid - b.cid);
      for (const cb of affected) {
        const oldCid = cb.cid;
        const newCid = oldCid - 1;
        cb.cid = newCid;
        if (typeof cb.icon === 'string' && cb.icon.startsWith('idb:')) {
          cb.icon = `idb:${newCid}`;
        }
        try { await iconDB.move(oldCid, newCid); } catch {}
      }

      bl.buttons.forEach(btn => {
        if (typeof btn.cid === 'number' && btn.cid > cid) {
          btn.cid = btn.cid - 1;
          if (typeof btn.icon === 'string' && btn.icon.startsWith('idb:')) {
            try {
              const oldCid = parseInt(btn.icon.slice(4), 10);
              if (!Number.isNaN(oldCid) && oldCid > cid) btn.icon = `idb:${oldCid - 1}`;
            } catch {}
          }
        }
      });
      localStorageQueue.add("custombuttonlist", JSON.stringify(cbl));
      localStorageQueue.add("buttonlayout", JSON.stringify(bl));

      if (!silent && deletedDef) {
        const changeRecord = { cbl: true, a: false, cid: deletedDef.cid, name: deletedDef.name, icon: deletedDef.icon, url: deletedDef.url, param: deletedDef.param, removedLayout: toRemoveDetailed.map(r=>({ ...r })) };
        if (idbIcon) changeRecord.idbIcon = idbIcon;
        changes.push(changeRecord);
      }
      localStorageQueue.add("custombuttonlist", JSON.stringify(cbl));

      if (removedFromLayout.length) {
        const uniqueNames = [...new Set(removedFromLayout)].slice(0, 3);
        const more = removedFromLayout.length - uniqueNames.length;
        const listText = uniqueNames.join(', ') + (more > 0 ? ` +${more} more` : '');
        toastSystem.notify(
          'Buttons Removed from Layout',
          `A custom button was removed. ${removedFromLayout.length === 1 ? 'Its layout instance has' : `${removedFromLayout.length} layout instances (${listText}) have`} been removed.`,
          { type: 'warning', timeout: 5000 }
        );
      }

      loadCLS();
      loadLS();
      if (!silent) toastSystem.notify('Custom Button Removed', `The custom button "${deletedDef.name}" has been removed.`, { type: 'success', timeout: 2500 });
    }
  };

  async function loadCLS() {
    if (!cbl || !cbl.cButtons) return;
    let cButtons = cbl.cButtons;
    if (cButtons.length >= 10) cButtons.length = 10;
    await Promise.all(cButtons.map(async (cButton) => {
      const isValidIcon = (cButton.icon.startsWith('idb:') && cButton.icon.slice(4) == cButton.cid) || cButton.icon.startsWith('data:image/') || await isImageUrlCT(cButton.icon);
      if (typeof cButton.cid !== 'number' || typeof cButton.name !== 'string' || cButton.name.length === 0 || cButton.name.length > 15 || !isValidUrl(cButton.url) || !isValidIcon) {
        cButton.tagged = true;
      }
    }));
    cButtons = cButtons.filter(cButton => !cButton.tagged);
    const usedCids = cButtons.map(cb => cb.cid);
    iconDB.deleteUnused(usedCids);
    cbl.cButtons = cButtons;
    localStorageQueue.add("custombuttonlist", JSON.stringify(cbl));

    const customBtn = cButtonContainer.querySelector('.drawer-custom-btn');
    cButtonContainer.innerHTML = '';
    cButtonContainer.appendChild(customBtn);
    Promise.all(cButtons.map((cButton)=> new Promise(async (resolve, reject)=>{
      const cBtnElem = document.createElement('div');
      cBtnElem.classList.add("drawer-card");
      cBtnElem.setAttribute("draggable", "true");
      bl.buttons.length >= 25 ? cBtnElem.classList.add('locked') : null;
      cBtnElem.dataset.href = cButton.url;
      cBtnElem.dataset.cid = cButton.cid;

      let resolvedIcon = cButton.icon;
      if (cButton.icon.startsWith('idb:')) {
        const idbIcon = await iconDB.get(cButton.cid);
        if (idbIcon) resolvedIcon = idbIcon;
      }
      
      cBtnElem.innerHTML = `<img src="${resolvedIcon}" alt="${cButton.name} Icon" onerror="this.src='/images/icons/Unknown.webp'"><div class="overlay" style="padding: 5px;bottom: -8%;"><p>${cButton.name}</p></div><div class="locked-overlay"><i class="fa-solid fa-lock"></i></div>`;
      let clickAllowed = true;

      const presetData = {
        name: cButton.name,
        icon: cButton.icon,
        url: cButton.url,
        cid: cButton.cid
      };
      if (cButton.param != undefined) presetData.param = cButton.param;

      cBtnElem.addEventListener('mousedown', (e) => {
        if (e.button == 0 || e.button == 1) {
          clickAllowed = true;
        }
      });
      cBtnElem.addEventListener('mouseup', (e) => {
        if ((e.button == 0 || e.button == 1) && clickAllowed && !(cBtnElem.dragging || cBtnElem.classList.contains("dragging"))) {
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            e.stopPropagation();
            openCBE(cButton);
            return false;
          }
          if (bl.buttons.length >= 25) {
            alertSystem.callAlert("Button Limit Reached", "You have reached the maximum amount of buttons (25).\nPlease remove some before adding new ones.");
            return;
          }
          updateLS(true, presetData);
          
          loadLS();
        }
      });
      
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
      resolve();
    }))).then(() => {
      cButtonContainer.appendChild(customBtn);
    });

    

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
      
      cardsContainer.classList.add('dragging-active', 'insert');
      
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
      cardsContainer.classList.remove('dragging-active', 'insert');
      
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