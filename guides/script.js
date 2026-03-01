(() => {
  const version = "v2.4.3";

  const consol = {
    log: (message, title="Core", colour="#FF6961") => { console.log(`%c(${title}) %c${message}`, `color:${colour};font-weight:bold`, "") },
    warn: (message, title="Core") => { console.warn(`%c(${title}) %c${message}`, `color:#FFD699;font-weight:bold`, "") },
    error: (message, title="Core") => { console.error(`%c(${title}) %c${message}`, `color:#FFB3B3;font-weight:bold`, "") }
  }

  function updateClock() {
    let now = new Date()
    document.getElementById("clock").innerText = `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()]}, ${now.getDate()}${(!(String(now.getDate())[0] == "1" && String(now.getDate()).length == 2)&&[1,2,3].includes(now.getDate() % 10))?['st','nd','rd'][(now.getDate() % 10)-1]:'th'} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][now.getMonth()]} ${now.getFullYear()}, ${[0,12].includes(now.getHours()) ? '12' : now.getHours() > 11 ? now.getHours()-12 : now.getHours()}:${now.getMinutes() < 10 ? "0"+now.getMinutes() : now.getMinutes()}:${now.getSeconds() < 10 ? "0"+now.getSeconds() : now.getSeconds()} ${now.getHours() > 11 ? 'PM' : 'AM'}`
    setTimeout(updateClock, 1000 - now.getMilliseconds());
  }
  updateClock();

  console.log(`                ,---,.   ,----..   \n       ,---.  ,'  .'  \\ /   /   \\  \n      /__./|,---.' .' ||   :     : \n ,---.;  ; ||   |  |: |.   |  ;. / \n/___/ \\  | |:   :  :  /.   ; /--\`  \n\\   ;  \\ ' |:   |    ; ;   | ;     \n \\   \\  \\: ||   :     \\|   : |     \n  ;   \\  ' .|   |   . |.   | '___  \n   \\   \\   ''   :  '; |'   ; : .'| \n    \\   \`  ;|   |  | ; '   | '/  : \n     :   \\ ||   :   /  |   :    /  \n      '---\" |   | ,'    \\   \\ .'   \n            \`----'       \`---\`     \nIntranet ${version}`)
})();
