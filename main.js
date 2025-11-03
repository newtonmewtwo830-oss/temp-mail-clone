const INBOX_LIFETIME = 60*60*1000;
let inboxes = [];
let currentInboxId = "";
let emailsData = [];
let currentEmail = null;

const inboxSelect = document.getElementById('inboxSelect');
const emailSpan = document.getElementById('email');
const emailsUl = document.getElementById('emails');
const modal = document.getElementById('emailModal');
const modalFrom = document.getElementById('modalFrom');
const modalSubject = document.getElementById('modalSubject');
const modalBody = document.getElementById('modalBody');
const attachmentsDiv = document.getElementById('attachments');
const replyText = document.getElementById('replyText');
const closeModalBtn = modal.querySelector('.close');

document.getElementById('newInboxBtn').addEventListener('click', generateInbox);
document.getElementById('copyBtn').addEventListener('click', copyEmail);
closeModalBtn.addEventListener('click', ()=>modal.style.display="none");
document.getElementById('sendReplyBtn').addEventListener('click', sendReply);
inboxSelect.addEventListener('change', ()=>{
  currentInboxId = inboxSelect.value;
  const inbox = inboxes.find(i=>i.id===currentInboxId);
  emailSpan.textContent = inbox?.emailAddress || "No inbox";
  loadInbox();
});

async function generateInbox(){
  const res = await fetch(`/.netlify/functions/getInbox`);
  const data = await res.json();
  inboxes.push({id:data.id,emailAddress:data.emailAddress,createdAt:Date.now()});
  currentInboxId = data.id;
  updateInboxDropdown();
  loadInbox();
}

function updateInboxDropdown(){
  inboxSelect.innerHTML = inboxes.map(i=>`<option value="${i.id}">${i.emailAddress}</option>`).join('');
  inboxSelect.value = currentInboxId;
  emailSpan.textContent = inboxes.find(i=>i.id===currentInboxId)?.emailAddress || "No inbox";
}

async function loadInbox(){
  if(!currentInboxId) return;
  const res = await fetch(`/.netlify/functions/getEmails?inboxId=${currentInboxId}`);
  const emails = await res.json();
  emailsData = emails;
  emailsUl.innerHTML = '';
  emails.forEach((mail,index)=>{
    const li = document.createElement('li');
    li.className = mail.read?'':'unread';
    const avatar = `https://i.pravatar.cc/45?img=${index+1}`;
    li.innerHTML = `<img src="${avatar}" alt="Avatar">
      <div class="email-content">
        <span class="email-from">${mail.from||"Unknown Sender"}</span>
        <span class="email-subject">${mail.subject||"(No Subject)"}</span>
        <span class="email-body">${mail.body?mail.body.slice(0,50)+'...':"(No Content)"}</span>
      </div>`;
    li.addEventListener('click',()=>openModal(mail));
    emailsUl.appendChild(li);
  });
}

function openModal(mail){
  currentEmail = mail;
  modalFrom.textContent = mail.from||"Unknown Sender";
  modalSubject.textContent = mail.subject||"(No Subject)";
  modalBody.textContent = mail.body||"(No Content)";
  replyText.value = "";
  attachmentsDiv.innerHTML = '';
  if(mail.attachments?.length){
    mail.attachments.forEach(att=>{
      if(att.contentType.startsWith('image/')){
        attachmentsDiv.innerHTML+=`<a href="${att.url}" target="_blank"><img src="${att.url}" alt="${att.name}"></a>`;
      } else {
        attachmentsDiv.innerHTML+=`<a href="${att.url}" target="_blank">${att.name}</a>`;
      }
    });
  }
  modal.style.display="flex";
  markEmailRead(mail.id);
}

async function markEmailRead(emailId){
  await fetch(`/.netlify/functions/markRead`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({emailId})
  });
  loadInbox();
}

async function sendReply(){
  if(!currentEmail) return alert("No email selected");
  const text = replyText.value;
  if(!text) return alert("Type a reply!");
  await fetch(`/.netlify/functions/sendReply`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      inboxId:currentInboxId,
      to:currentEmail.from,
      subject:"Re: "+(currentEmail.subject||""),
      body:text
    })
  });
  alert("Reply sent!");
  replyText.value="";
  modal.style.display="none";
}

function copyEmail(){
  navigator.clipboard.writeText(emailSpan.textContent).then(()=>alert("Copied: "+emailSpan.textContent));
}

// Auto-delete expired inboxes
setInterval(async ()=>{
  const now = Date.now();
  for(let i=inboxes.length-1;i>=0;i--){
    if(now - inboxes[i].createdAt > INBOX_LIFETIME){
      await fetch(`/.netlify/functions/deleteInbox`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({inboxId: inboxes[i].id})
      });
      inboxes.splice(i,1);
      if(currentInboxId===inboxes[i]?.id)
