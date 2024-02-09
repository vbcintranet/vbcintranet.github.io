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
      if (card.getAttribute('data-style')) updateLS(true, 0, card.children[2].children[0].innerText, card.children[0].src, href, card.getAttribute('data-style')); else updateLS(true, 0, card.children[2].children[0].innerText, card.children[0].src, href)
      
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

function updateLS(a, id, name, icon, url, param) {
  if (a && name && icon && url && param && bl.buttons.length < 25) {
    bl.buttons.push({name:name,icon:icon,url:url,param:param,id:bl.buttons.length})
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
/*Array.from(document.querySelector('.cards').children).forEach(function(child) {
  if (!child.classList.contains('plus')) {
    document.querySelector('.cards').removeChild(child);
  }
});
loadLS()*/
var bl = {}
if (localStorage.getItem("buttonlayout")) {
  bl = JSON.parse(localStorage.getItem("buttonlayout"))
  loadLS()
} else {
  localStorage.setItem("buttonlayout", JSON.stringify({buttons:[
    {name:"Compass",icon:"/images/Compass.png",url:"http://viewbank-vic.compass.education/",id:0},
    {name:"Mail",icon:"/images/Outlook.png",url:"https://outlook.office.com/mail/",id:1},
    {name:"Trello",icon:"/images/Trello.png",url:"https://trello.com/login?returnUrl=%2F/",id:2},
    {name:"VBC Site",icon:"/images/VBCLogo.png",url:"http://www.viewbank.vic.edu.au/",id:3},
    {name:"Library",icon:"/images/LibrarySearch.png",url:"http://library.viewbank.vic.edu.au/oliver/home/news/",id:4},
    {name:"Stile",icon:"/images/Stile.png",url:"https://stileapp.com/",id:5},
    {name:"Hotmaths",icon:"/images/Hotmaths.png",url:"https://www.cambridge.org/go/resources/",id:6},
    {name:"Careers",icon:"/images/VBCCareers.png",url:"http://www.viewbankcollegecareers.com/",id:7},
    {name:"ACER Testing",icon:"/images/ACERLogo.png",url:"https://oars.acer.edu.au/viewbank-college/",id:8},
    {name:"Helpdesk",icon:"/images/HelpDesk.png",url:"https://viewbank.on.spiceworks.com/portal/",id:9},
    {name:"Mail Helpdesk",icon:"/images/HelpDeskMail.png",url:"mailto:helpdesk@viewbank.vic.edu.au",id:10},
    {name:"OneDrive",icon:"/images/OneDrive.png",url:"https://viewbankcollege-my.sharepoint.com/",id:11},
    {name:"On Demand Testing",icon:"/images/OnDemand.png",url:"http://10.166.65.23/",id:12},
    {name:"Printer Balance",icon:"/images/PaperCut.png",url:"http://papercut.viewbank.vic.edu.au:9191/",id:13},
    {name:"Teams",icon:"/images/MicrosoftTeams.png",url:"msteams://open", param:"self",id:14},
    {name:"Add Printers",icon:"/images/AddPrinters.png",url:"/AddPrinters",id:15},
  ]}))
  bl = JSON.parse(localStorage.getItem("buttonlayout"))
  loadLS()
}

document.getElementById("reset").addEventListener("mouseup",()=>{
  localStorage.setItem("buttonlayout", JSON.stringify({buttons:[
    {name:"Compass",icon:"/images/Compass.png",url:"http://viewbank-vic.compass.education/",id:0},
    {name:"Mail",icon:"/images/Outlook.png",url:"https://outlook.office.com/mail/",id:1},
    {name:"Trello",icon:"/images/Trello.png",url:"https://trello.com/login?returnUrl=%2F/",id:2},
    {name:"VBC Site",icon:"/images/VBCLogo.png",url:"http://www.viewbank.vic.edu.au/",id:3},
    {name:"Library",icon:"/images/LibrarySearch.png",url:"http://library.viewbank.vic.edu.au/oliver/home/news/",id:4},
    {name:"Stile",icon:"/images/Stile.png",url:"https://stileapp.com/",id:5},
    {name:"Hotmaths",icon:"/images/Hotmaths.png",url:"https://www.cambridge.org/go/resources/",id:6},
    {name:"Careers",icon:"/images/VBCCareers.png",url:"http://www.viewbankcollegecareers.com/",id:7},
    {name:"ACER Testing",icon:"/images/ACERLogo.png",url:"https://oars.acer.edu.au/viewbank-college/",id:8},
    {name:"Helpdesk",icon:"/images/HelpDesk.png",url:"https://viewbank.on.spiceworks.com/portal/",id:9},
    {name:"Mail Helpdesk",icon:"/images/HelpDeskMail.png",url:"mailto:helpdesk@viewbank.vic.edu.au",id:10},
    {name:"OneDrive",icon:"/images/OneDrive.png",url:"https://viewbankcollege-my.sharepoint.com/",id:11},
    {name:"On Demand Testing",icon:"/images/OnDemand.png",url:"http://10.166.65.23/",id:12},
    {name:"Printer Balance",icon:"/images/PaperCut.png",url:"http://papercut.viewbank.vic.edu.au:9191/",id:13},
    {name:"Teams",icon:"/images/MicrosoftTeams.png",url:"msteams://open", param:"self",id:14},
    {name:"Add Printers",icon:"/images/AddPrinters.png",url:"/AddPrinters",id:15},
  ]}))
  bl = JSON.parse(localStorage.getItem("buttonlayout"))
  loadLS()
})

console.log("                ,---,.   ,----..   \n       ,---.  ,'  .'  \\ /   /   \\  \n      /__./|,---.' .' ||   :     : \n ,---.;  ; ||   |  |: |.   |  ;. / \n/___/ \\  | |:   :  :  /.   ; /--`  \n\\   ;  \\ ' |:   |    ; ;   | ;     \n \\   \\  \\: ||   :     \\|   : |     \n  ;   \\  ' .|   |   . |.   | '___  \n   \\   \\   ''   :  '; |'   ; : .'| \n    \\   `  ;|   |  | ; '   | '/  : \n     :   \\ ||   :   /  |   :    /  \n      '---\" |   | ,'    \\   \\ .'   \n            `----'       `---`     ")
console.log(`Intranet ${version}`)
