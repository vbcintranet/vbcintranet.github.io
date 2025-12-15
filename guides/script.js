(() => {
  const version = "v2.1.0";

  const consol = {
    log: (message, title="Core", colour="#FF6961") => { console.log(`%c(${title}) %c${message}`, `color:${colour};font-weight:bold`, "") },
    warn: (message, title="Core") => { console.warn(`%c(${title}) %c${message}`, `color:#FFD699;font-weight:bold`, "") },
    error: (message, title="Core") => { console.error(`%c(${title}) %c${message}`, `color:#FFB3B3;font-weight:bold`, "") }
  }

  function updateClock(){
    const el = document.getElementById('clock');
    if(!el) return;
    let now = new Date();
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const date = now.getDate();
    const daySuffix = (!(String(date)[0] == "1" && String(date).length == 2) && [1,2,3].includes(date % 10))?['st','nd','rd'][(date % 10)-1]:'th';
    const hour12 = [0,12].includes(now.getHours()) ? '12' : now.getHours() > 11 ? now.getHours()-12 : now.getHours();
    const minutes = now.getMinutes() < 10 ? "0"+now.getMinutes() : now.getMinutes();
    const seconds = now.getSeconds() < 10 ? "0"+now.getSeconds() : now.getSeconds();
    const ampm = now.getHours() > 11 ? 'PM' : 'AM';
    el.innerText = `${days[now.getDay()]}, ${date}${daySuffix} ${months[now.getMonth()]} ${now.getFullYear()}, ${hour12}:${minutes}:${seconds} ${ampm}`;
    setTimeout(updateClock, 1000 - now.getMilliseconds());
  }
  document.addEventListener('DOMContentLoaded', updateClock);

  console.log(`                ,---,.   ,----..   \n       ,---.  ,'  .'  \\ /   /   \\  \n      /__./|,---.' .' ||   :     : \n ,---.;  ; ||   |  |: |.   |  ;. / \n/___/ \\  | |:   :  :  /.   ; /--\`  \n\\   ;  \\ ' |:   |    ; ;   | ;     \n \\   \\  \\: ||   :     \\|   : |     \n  ;   \\  ' .|   |   . |.   | '___  \n   \\   \\   ''   :  '; |'   ; : .'| \n    \\   \`  ;|   |  | ; '   | '/  : \n     :   \\ ||   :   /  |   :    /  \n      '---\" |   | ,'    \\   \\ .'   \n            \`----'       \`---\`     \nIntranet ${version}`)
})();
