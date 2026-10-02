/* GroupMate v2 — browser-only working prototype.
   Data is stored in localStorage; uploaded files are stored in IndexedDB.
   This makes the site actually usable on the same browser/device without a server. */

const DB_NAME="GroupMateFilesDB", STORE="files";
let currentUser=null, currentTaskId=null, previousScreen="dashboard";

const seedTasks=[
 {id:"t1",groupId:"g1",name:"Research",desc:"ค้นคว้าข้อมูลสำหรับโครงงาน",assignee:"แพท",deadline:"2026-09-30",status:"todo",progress:0,files:[],comments:[{name:"แพท",text:"เริ่มรวบรวมข้อมูลแล้วค่ะ",time:"30 ก.ย. 2569 10:30"}]},
 {id:"t2",groupId:"g1",name:"ทำ Presentation",desc:"จัดทำสไลด์นำเสนอโปรเจกต์",assignee:"นาส",deadline:"2026-10-01",status:"doing",progress:70,files:[],comments:[{name:"นาส",text:"กำลังหน้า 10 แล้วครับ",time:"29 ก.ย. 2569 14:20"},{name:"มิเกล",text:"ถ้าต้องการรูปเพิ่มบอกได้เลย",time:"29 ก.ย. 2569 15:05"}]},
 {id:"t3",groupId:"g1",name:"ทำรายงาน",desc:"เขียนรายงานฉบับสมบูรณ์",assignee:"วิว",deadline:"2026-10-02",status:"todo",progress:10,files:[],comments:[]},
 {id:"t4",groupId:"g1",name:"ออกแบบสื่อ",desc:"ออกแบบสื่อประกอบการนำเสนอ",assignee:"มิเกล",deadline:"2026-09-26",status:"doing",progress:60,files:[],comments:[]},
 {id:"t5",groupId:"g1",name:"รวบรวมข้อมูล",desc:"รวบรวมข้อมูลจากสมาชิกในกลุ่ม",assignee:"อนันต์",deadline:"2026-09-29",status:"doing",progress:80,files:[],comments:[]},
 {id:"t6",groupId:"g1",name:"ออกแบบโลโก้",desc:"ออกแบบโลโก้กลุ่ม",assignee:"ต้น",deadline:"2026-09-26",status:"done",progress:100,files:[],comments:[{name:"ต้น",text:"เสร็จเรียบร้อยครับ",time:"26 ก.ย. 2569 17:10"}]}
];
const seedGroups=[{id:"g1",name:"Multimedia Project",desc:"โครงงานมัลติมีเดีย",members:["นักริชา","มิเกล","แพท","นาส","วิว","อนันต์","ต้น"]},{id:"g2",name:"UX/UI Design",desc:"ออกแบบประสบการณ์ผู้ใช้",members:["นักริชา","มิเกล","แพท","นาส"]}];

function dbOpen(){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open(DB_NAME,1);
  r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:"id"});
  r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
 });
}
async function dbPut(fileObj){const db=await dbOpen();return new Promise((res,rej)=>{const r=db.transaction(STORE,"readwrite").objectStore(STORE).put(fileObj);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
async function dbGet(id){const db=await dbOpen();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}

function getUsers(){return JSON.parse(localStorage.getItem("gm_users")||"[]")}
function saveUsers(v){localStorage.setItem("gm_users",JSON.stringify(v))}
function getTasks(){return JSON.parse(localStorage.getItem("gm_tasks")||"null")||seedTasks}
function saveTasks(v){localStorage.setItem("gm_tasks",JSON.stringify(v))}
function getGroups(){return JSON.parse(localStorage.getItem("gm_groups")||"null")||seedGroups}
function saveGroups(v){localStorage.setItem("gm_groups",JSON.stringify(v))}
function getNotifs(){return JSON.parse(localStorage.getItem("gm_notifs")||"[]")}
function saveNotifs(v){localStorage.setItem("gm_notifs",JSON.stringify(v))}
function uid(prefix="id"){return prefix+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)}
function nowText(){return new Date().toLocaleString("th-TH",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}

function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove("show"),2400)}
function switchAuth(mode){
 document.getElementById("loginForm").classList.toggle("hidden",mode!=="login");
 document.getElementById("registerForm").classList.toggle("hidden",mode!=="register");
 document.getElementById("loginTab").classList.toggle("active",mode==="login");
 document.getElementById("registerTab").classList.toggle("active",mode==="register");
}
function showReset(){openModal("resetModal")}
function openModal(id){document.getElementById("modalOverlay").classList.remove("hidden");document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));document.getElementById(id).classList.remove("hidden")}
function closeModal(id){document.getElementById(id).classList.add("hidden");if([...document.querySelectorAll(".modal")].every(m=>m.classList.contains("hidden")))document.getElementById("modalOverlay").classList.add("hidden")}
function closeModalOnOverlay(e){if(e.target.id==="modalOverlay")document.getElementById("modalOverlay").classList.add("hidden")}

document.getElementById("registerForm").addEventListener("submit",e=>{
 e.preventDefault();
 const name=regName.value.trim(),email=regEmail.value.trim().toLowerCase(),p=regPassword.value,p2=regPassword2.value;
 if(p!==p2)return toast("รหัสผ่านไม่ตรงกัน");
 const users=getUsers();if(users.some(u=>u.email===email))return toast("อีเมลนี้มีบัญชีอยู่แล้ว");
 users.push({id:uid("u"),name,email,password:p,avatar:"",createdAt:Date.now()});saveUsers(users);
 document.getElementById("loginEmail").value=email;document.getElementById("loginPassword").value=p;
 switchAuth("login");toast("สมัครสมาชิกสำเร็จ! สามารถเข้าสู่ระบบได้แล้ว");
});
document.getElementById("loginForm").addEventListener("submit",e=>{
 e.preventDefault();const email=loginEmail.value.trim().toLowerCase(),p=loginPassword.value;
 const user=getUsers().find(u=>u.email===email&&u.password===p);
 if(!user)return toast("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
 currentUser=user;localStorage.setItem("gm_current",user.id);showApp();
});
document.getElementById("resetForm").addEventListener("submit",e=>{
 e.preventDefault();const email=resetEmail.value.trim().toLowerCase(),np=resetPassword.value,users=getUsers(),i=users.findIndex(u=>u.email===email);
 if(i<0)return toast("ไม่พบบัญชีนี้");
 users[i].password=np;saveUsers(users);closeModal("resetModal");toast("เปลี่ยนรหัสผ่านแล้ว");
});

function showApp(){document.getElementById("authPage").classList.add("hidden");document.getElementById("appPage").classList.remove("hidden");renderAll();navigate("dashboard")}
function logout(){currentUser=null;localStorage.removeItem("gm_current");document.getElementById("appPage").classList.add("hidden");document.getElementById("authPage").classList.remove("hidden");switchAuth("login");toast("ออกจากระบบแล้ว")}
function navigate(id){
 previousScreen=document.querySelector(".screen:not(.hidden)")?.id||"dashboard";
 document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("hidden",s.id!==id));
 document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));
 if(id==="dashboard")renderDashboard();if(id==="groups")renderGroups();if(id==="tasks")renderTasks();if(id==="board")renderBoard();if(id==="detail")renderDetail();if(id==="notifications")renderNotifications();if(id==="profile")renderProfile();
 window.scrollTo({top:0,behavior:"smooth"});
}
function renderAll(){renderDashboard();renderGroups();renderTasks();renderNotifications();renderProfile();updateTop()}
function updateTop(){
 if(!currentUser)return;
 welcomeName.textContent=currentUser.name;profileName.textContent=currentUser.name;profileEmail.textContent=currentUser.email;profileName2.textContent=currentUser.name;profileEmail2.textContent=currentUser.email;
 const av=currentUser.avatar?`<img src="${currentUser.avatar}">`:"👤";topAvatar.innerHTML=av;profileAvatar.innerHTML=av;
 const unread=getNotifs().filter(n=>!n.read).length;notifBadge.style.display=unread?"block":"none";topBadge.style.display=unread?"block":"none";
}
function groupTasks(gid){return getTasks().filter(t=>t.groupId===gid)}
function percent(gid){const a=groupTasks(gid);return a.length?Math.round(a.reduce((s,t)=>s+t.progress,0)/a.length):0}
function renderDashboard(){
 const gs=getGroups();dashboardGroups.innerHTML=gs.map(g=>`<div class="group-card" onclick="openBoard('${g.id}')"><h4>${esc(g.name)}</h4><div class="ring" style="--p:${percent(g.id)}%"><b>${percent(g.id)}%</b></div><small>${g.members.length} สมาชิก · ${groupTasks(g.id).length} งาน</small></div>`).join("");
 const list=getTasks().filter(t=>t.status!=="done").sort((a,b)=>a.deadline.localeCompare(b.deadline)).slice(0,5);
 deadlines.innerHTML=list.length?list.map(t=>`<div class="deadline" onclick="openDetail('${t.id}')"><span class="ico">📋</span><strong>${esc(t.name)}</strong><span class="${t.deadline<"2026-10-01"?"red":""}">${formatDate(t.deadline)}</span></div>`).join(""):`<div class="deadline">🎉 ไม่มีงานใกล้กำหนด</div>`;
}
function renderGroups(){
 groupsGrid.innerHTML=getGroups().map(g=>`<div class="big-group"><span class="pill doing">กำลังดำเนินการ</span><h3>${esc(g.name)}</h3><p>${esc(g.desc)} · ${g.members.length} คน · ${groupTasks(g.id).length} งาน</p><div class="bar"><span style="width:${percent(g.id)}%"></span></div><b>${percent(g.id)}%</b><button class="primary wide" onclick="openBoard('${g.id}')">เปิดกลุ่ม</button></div>`).join("");
}
function renderTasks(){
 const a=getTasks();
 taskTable.innerHTML=`<div class="task-row header"><span>ชื่องาน</span><span>กลุ่ม</span><span>กำหนดส่ง</span><span>สถานะ</span><span>ความคืบหน้า</span></div>`+
 a.map(t=>{const g=getGroups().find(x=>x.id===t.groupId);return `<div class="task-row" onclick="openDetail('${t.id}')"><strong>${esc(t.name)}</strong><span>${esc(g?.name||"-")}</span><span>${formatDate(t.deadline)}</span><span class="status ${t.status}">${statusText(t.status)}</span><span>${t.progress}%</span></div>`}).join("");
}
function openBoard(gid="g1"){localStorage.setItem("gm_current_group",gid);navigate("board")}
function renderBoard(){
 const gid=localStorage.getItem("gm_current_group")||"g1",g=getGroups().find(x=>x.id===gid)||getGroups()[0];if(!g)return;
 boardTitle.textContent=g.name;boardSub.textContent=`${g.members.length} สมาชิก · ${groupTasks(g.id).length} งาน · ความคืบหน้า ${percent(g.id)}%`;
 const a=groupTasks(g.id),cols=[["todo","To Do"],["doing","Doing"],["done","Done"]];
 kanban.innerHTML=cols.map(([st,label])=>`<div class="column ${st}"><div class="column-title">${label} (${a.filter(t=>t.status===st).length})</div>${a.filter(t=>t.status===st).map(t=>`<div class="kcard" onclick="openDetail('${t.id}')"><h4>${esc(t.name)}</h4><small>👤 ${esc(t.assignee)}</small><b class="${t.deadline<"2026-10-01"?"red":""}">${formatDate(t.deadline)}</b><div class="bar"><span style="width:${t.progress}%"></span></div><small>${t.progress}% · ${t.files.length} ไฟล์ · ${t.comments.length} ความคิดเห็น</small></div>`).join("")}</div>`).join("");
}
function openDetail(id){currentTaskId=id;previousScreen=document.querySelector(".screen:not(.hidden)")?.id||"board";navigate("detail")}
function goBackFromDetail(){navigate(previousScreen==="detail"?"board":previousScreen)}
function goBackFromCreate(){navigate(previousScreen==="create"?"board":previousScreen)}
function renderDetail(){
 const t=getTasks().find(x=>x.id===currentTaskId);if(!t)return navigate("tasks");
 const comments=t.comments||[],files=t.files||[];
 detailContent.innerHTML=`<div class="detail-head"><div><h2>${esc(t.name)}</h2><p>${esc(t.desc||"ไม่มีรายละเอียด")}</p></div><span class="detail-status">${statusText(t.status)}</span></div>
 <div class="info-list"><div><span class="info-icon">♟</span><b>ผู้รับผิดชอบ : ${esc(t.assignee)}</b></div><div><span class="info-icon">▣</span><b>Deadline : ${formatDate(t.deadline)}</b></div></div>
 <div class="detail-section"><h3>ความคืบหน้า</h3><div class="progress-line"><span style="width:${t.progress}%"></span></div><b>${t.progress}%</b></div>
 <div class="detail-section"><h3>ไฟล์แนบ (${files.length})</h3>${files.length?files.map(f=>`<div class="file-card"><span class="pdf">${fileExt(f.name)}</span><div class="file-name"><b>${esc(f.name)}</b><small>${sizeText(f.size)}</small></div><button class="download" onclick="downloadFile('${f.id}','${escAttr(f.name)}')">☁</button></div>`).join(""):`<p class="muted">ยังไม่มีไฟล์แนบ</p>`}</div>
 <div class="detail-section"><h3>ความคิดเห็น (${comments.length})</h3>${comments.length?comments.map(c=>`<div class="comment"><span class="comment-avatar">👤</span><div><b>${esc(c.name)}</b><small>${esc(c.time)}</small><p>${esc(c.text)}</p></div></div>`).join(""):`<p class="muted">ยังไม่มีความคิดเห็น</p>`}
 <div class="comment-input"><input id="commentText" placeholder="พิมพ์ความคิดเห็น..."><button onclick="addComment()">➤</button></div></div>
 <div class="detail-section"><h3>อัปเดตงาน</h3><div class="actions"><select id="statusSelect"><option value="todo" ${t.status==="todo"?"selected":""}>To Do</option><option value="doing" ${t.status==="doing"?"selected":""}>Doing</option><option value="done" ${t.status==="done"?"selected":""}>Done</option></select><input id="progressInput" type="number" min="0" max="100" value="${t.progress}" style="width:90px;padding:10px;border:0;border-radius:8px"><button class="primary" onclick="updateTaskStatus()">บันทึกสถานะ</button></div></div>
 <div class="detail-actions"><label class="outline" style="cursor:pointer">📎 เพิ่มไฟล์<input id="detailFiles" type="file" multiple hidden></label><button class="primary" onclick="submitTask()">ส่งงาน / ทำงานเสร็จ</button></div>`;
 document.getElementById("detailFiles").addEventListener("change",e=>attachFiles(currentTaskId,e.target.files));
}
async function attachFiles(taskId,fileList){
 if(!fileList?.length)return;const t=getTasks().find(x=>x.id===taskId);if(!t)return;
 for(const f of fileList){const id=uid("file");await dbPut({id,name:f.name,size:f.size,type:f.type,blob:f});t.files.push({id,name:f.name,size:f.size,type:f.type});}
 saveTasks(getTasks());addNotif(`แนบไฟล์ ${fileList.length} ไฟล์ในงาน "${t.name}"`);toast("เพิ่มไฟล์สำเร็จ");renderDetail();renderTasks();
}
async function downloadFile(id,name){const f=await dbGet(id);if(!f)return toast("ไม่พบไฟล์");const url=URL.createObjectURL(f.blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function submitTask(){const a=getTasks(),i=a.findIndex(t=>t.id===currentTaskId);if(i<0)return;a[i].status="done";a[i].progress=100;saveTasks(a);addNotif(`ส่งงาน "${a[i].name}" เรียบร้อยแล้ว`);toast("ส่งงานสำเร็จ และเปลี่ยนสถานะเป็น Done");renderDetail();renderBoard();renderDashboard();renderTasks()}
function updateTaskStatus(){const a=getTasks(),i=a.findIndex(t=>t.id===currentTaskId);if(i<0)return;let st=statusSelect.value,p=Math.max(0,Math.min(100,Number(progressInput.value)||0));if(st==="done")p=100;a[i].status=st;a[i].progress=p;saveTasks(a);addNotif(`อัปเดต "${a[i].name}" เป็น ${statusText(st)} (${p}%)`);toast("อัปเดตสถานะแล้ว");renderDetail();renderBoard();renderDashboard();renderTasks()}
function addComment(){const input=document.getElementById("commentText"),text=input.value.trim();if(!text)return;const a=getTasks(),i=a.findIndex(t=>t.id===currentTaskId);a[i].comments.push({name:currentUser.name,text,time:nowText()});saveTasks(a);addNotif(`${currentUser.name} แสดงความคิดเห็นในงาน "${a[i].name}"`);input.value="";renderDetail();toast("ส่งความคิดเห็นแล้ว")}
function openCreateTask(){previousScreen=document.querySelector(".screen:not(.hidden)")?.id||"board";const opts=getGroups().flatMap(g=>g.members).filter((x,i,a)=>a.indexOf(x)===i);assignee.innerHTML=`<option value="">เลือกสมาชิก</option>`+opts.map(x=>`<option>${esc(x)}</option>`).join("");navigate("create")}
document.getElementById("taskDesc").addEventListener("input",e=>counter.textContent=e.target.value.length);
document.getElementById("taskFiles").addEventListener("change",e=>{selectedFiles.innerHTML=[...e.target.files].map(f=>`<div class="selected-file">📎 ${esc(f.name)} — ${sizeText(f.size)}</div>`).join("")});
document.getElementById("createTaskForm").addEventListener("submit",async e=>{
 e.preventDefault();const t={id:uid("t"),groupId:localStorage.getItem("gm_current_group")||"g1",name:taskName.value.trim(),desc:taskDesc.value.trim(),assignee:assignee.value,deadline:deadline.value,status:"todo",progress:0,files:[],comments:[]};const fs=[...taskFiles.files];for(const f of fs){const id=uid("file");await dbPut({id,name:f.name,size:f.size,type:f.type,blob:f});t.files.push({id,name:f.name,size:f.size,type:f.type})}const a=getTasks();a.push(t);saveTasks(a);addNotif(`สร้างงานใหม่ "${t.name}" และมอบหมายให้ ${t.assignee}`);e.target.reset();selectedFiles.innerHTML="";counter.textContent="0";toast("สร้างและมอบหมายงานสำเร็จ");openDetail(t.id);
});
function openProfileEdit(){editName.value=currentUser.name;editEmail.value=currentUser.email;openModal("profileModal")}
document.getElementById("profileForm").addEventListener("submit",e=>{
 e.preventDefault();const users=getUsers(),i=users.findIndex(u=>u.id===currentUser.id),email=editEmail.value.trim().toLowerCase();if(users.some((u,j)=>j!==i&&u.email===email))return toast("อีเมลนี้ถูกใช้งานแล้ว");users[i].name=editName.value.trim();users[i].email=email;const f=avatarFile.files[0];if(f){const reader=new FileReader();reader.onload=()=>{users[i].avatar=reader.result;saveUsers(users);currentUser=users[i];closeModal("profileModal");updateTop();renderProfile();toast("บันทึกโปรไฟล์แล้ว")};reader.readAsDataURL(f)}else{saveUsers(users);currentUser=users[i];closeModal("profileModal");updateTop();renderProfile();toast("บันทึกโปรไฟล์แล้ว")}
});
function renderProfile(){if(!currentUser)return;profileName.textContent=currentUser.name;profileEmail.textContent=currentUser.email;profileName2.textContent=currentUser.name;profileEmail2.textContent=currentUser.email;profileTaskCount.textContent=getTasks().length+" งาน";profileAvatar.innerHTML=currentUser.avatar?`<img src="${currentUser.avatar}">`:"👤"}
document.getElementById("groupForm").addEventListener("submit",e=>{e.preventDefault();const g={id:uid("g"),name:groupName.value.trim(),desc:groupDesc.value.trim(),members:[currentUser.name]};const a=getGroups();a.push(g);saveGroups(a);closeModal("groupModal");groupName.value="";groupDesc.value="";renderGroups();renderDashboard();toast("สร้างกลุ่มสำเร็จ")});
function addNotif(text){const a=getNotifs();a.unshift({id:uid("n"),text,time:nowText(),read:false});saveNotifs(a);updateTop()}
function renderNotifications(){const a=getNotifs();notificationList.innerHTML=a.length?a.map(n=>`<div class="notification ${n.read?"":"unread"}"><span>🔔</span><div>${esc(n.text)}<small>${esc(n.time)}</small></div></div>`).join(""):`<div class="notification">✨ ยังไม่มีการแจ้งเตือน</div>`}
function markNotificationsRead(){const a=getNotifs().map(n=>({...n,read:true}));saveNotifs(a);renderNotifications();updateTop();toast("อ่านการแจ้งเตือนทั้งหมดแล้ว")}
function statusText(s){return s==="done"?"Done":s==="doing"?"Doing":"To Do"}
function formatDate(d){if(!d)return"-";const [y,m,day]=d.split("-");return`${day}/${m}/${Number(y)+543}`}
function fileExt(n){const x=n.split(".").pop().toUpperCase();return x.length>4?"FILE":x}
function sizeText(n){if(n<1024)return n+" B";if(n<1024**2)return(n/1024).toFixed(1)+" KB";return(n/1024**2).toFixed(1)+" MB"}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escAttr(s){return esc(s)}
if(document.getElementById("deadline"))deadline.min=new Date().toISOString().slice(0,10);

(function boot(){const id=localStorage.getItem("gm_current"),u=getUsers().find(x=>x.id===id);if(u){currentUser=u;showApp()}})();
