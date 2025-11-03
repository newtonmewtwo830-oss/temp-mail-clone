const emailDisplay = document.getElementById("emailDisplay");
const inboxSelect = document.getElementById("inboxSelect");
const messagesList = document.getElementById("messagesList");
const newEmailBtn = document.getElementById("newEmail");
const copyBtn = document.getElementById("copyBtn");

let account = null;
let token = null;

// Generate a new temporary email account
async function generateEmail() {
  emailDisplay.textContent = "loading...";

  try {
    // Create a new account on mail.tm
    const domainRes = await fetch("https://api.mail.tm/domains");
    const domainData = await domainRes.json();
    const domain = domainData["hydra:member"][0].domain;

    const username = Math.random().toString(36).substring(2, 10);
    const password = Math.random().toString(36).substring(2, 15);
    const address = `${username}@${domain}`;

    const createRes = await fetch("https://api.mail.tm/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password })
    });

    if (!createRes.ok) throw new Error("Failed to create mailbox");

    // Login to get JWT token
    const tokenRes = await fetch("https://api.mail.tm/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password })
    });

    const tokenData = await tokenRes.json();
    token = tokenData.token;
    account = address;

    emailDisplay.textContent = address;
    fetchEmails();

  } catch (err) {
    console.error(err);
    emailDisplay.textContent = "Error generating email.";
  }
}

// Fetch latest emails
async function fetchEmails() {
  if (!token) return;

  messagesList.innerHTML = "<li>Loading messages...</li>";

  try {
    const res = await fetch("https://api.mail.tm/messages", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    const messages = data["hydra:member"];

    if (!messages.length) {
      messagesList.innerHTML = "<li>No messages yet.</li>";
      return;
    }

    messagesList.innerHTML = messages.map(msg => `
      <li>
        <strong>From:</strong> ${msg.from.address}<br>
        <strong>Subject:</strong> ${msg.subject}<br>
        <small>${new Date(msg.createdAt).toLocaleString()}</small>
      </li>
    `).join("");

  } catch (err) {
    console.error(err);
    messagesList.innerHTML = "<li>Failed to load emails.</li>";
  }
}

// Copy email to clipboard
function copyEmail() {
  if (!account) return;
  navigator.clipboard.writeText(account);
  alert("Email copied: " + account);
}

// Event listeners
newEmailBtn.addEventListener("click", generateEmail);
copyBtn.addEventListener("click", copyEmail);
inboxSelect.addEventListener("change", fetchEmails);

// Generate the first email automatically
generateEmail();
