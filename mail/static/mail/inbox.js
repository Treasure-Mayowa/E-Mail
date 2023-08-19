window.onpopstate = function(event) {
  console.log(event.state.section);
  showSection(event.state.section);
}

document.addEventListener('DOMContentLoaded', function() {
  // By default, load the inbox
  load_mailbox('inbox');

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // send mail after compose-form is submitted
  document.querySelector('#compose-form').addEventListener('submit', send_email);
});


function compose_email() {

  history.pushState({section: "compose"}, "", `#compose`);

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  history.pushState({section: mailbox}, "", `#${mailbox}`);

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the content of the specified mailbox
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);
    emails.forEach((email) => {
      let main = document.createElement("div")
      main.className = email["read"] === true? "card text-white bg-secondary mb-3" : "card bg-light mb-3";
      main.innerHTML = `<div class="card-header">From: ${email["sender"]}</div><div class="card-body"><h6 class="card-title">${email["subject"]}</h6><p class="card-text">${email["timestamp"]}</p></div><br><br>`

      // Adding a click eventlistener
      main.addEventListener("click", () => open_email(email["id"]))

      // Append email to the emails-view
      document.querySelector('#emails-view').appendChild(main)
    })
});
}


function send_email(event) {

  // Prevent default form action
  event.preventDefault()

  // Make POST request to server
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      if (result.error) {
        let messagediv = document.createElement("div")
        messagediv.innerHTML = `<h5 style="color:red;">${result.error}</h5>`;
        setTimeout(() => {
          messagediv.innerHTML = "";
          load_mailbox('sent');
        }, 5000);
      }
      else if (result.message) {
        let messagediv = document.createElement("div")
        messagediv.innerHTML = `<h5 style="color:green;">${result.message}</h5>`
        document.querySelector('#compose-view').innerHTML += messagediv
        setTimeout(() => {
          messagediv.innerHTML = "";
          load_mailbox('sent');
        }, 5000);
      };
  });
}


function open_email(id) {

  // Get email information
  fetch('/emails/' + id)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-view').style.display = 'block';

      // Displaying email
      document.querySelector('#email-view').innerHTML = `
        <h5>${email.subject}<h5><hr><h6>From: ${email.sender}<h6>
        <h6>To: ${email.recipients.join(", ")}</h6>
        <p>${email.body}</p>
        <button id="reply" class="btn btn-sm btn-outline-info">Reply</button>`;

      // Event after reply button clicked
      document.querySelector("#reply").addEventListener("click", () => {
        reply_mail(email)
      })

  });

  fetch('/emails/' + id, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

// Reply mail function
function reply_mail(email) {
  compose_email()

  // Prefilling compose form
  document.querySelector('#compose-recipients').value = email.sender;
  if (!email.subject.includes("Re: ")) {
    document.querySelector('#compose-subject').value = "Re: " + email.subject;
  }
  else {
    document.querySelector('#compose-subject').value = email.subject;
  }
  document.querySelector('#compose-body').value = `\n On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;
}