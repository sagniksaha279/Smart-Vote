//Starting download option
document.addEventListener("DOMContentLoaded", () => {
    const iconButton = document.getElementById("icon");
    const downloadOptions = document.getElementById("download-options");
    const closeButton = document.querySelector("[data-icon-close]");

    iconButton.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent click from being caught by document listener
        downloadOptions.classList.toggle("active");
    });

    closeButton.addEventListener("click", () => {
        downloadOptions.classList.remove("active");
    });

    // Close when clicking outside the download options
    document.addEventListener("click", (event) => {
        if (!downloadOptions.contains(event.target) && event.target !== iconButton) {
            downloadOptions.classList.remove("active");
        }
    });

    // Prevent closing when clicking inside the download options
    downloadOptions.addEventListener("click", (event) => {
        event.stopPropagation();
    });
});

//how it works portion
const openButton = document.querySelectorAll('[data-htw-target]')
const closeButton = document.querySelectorAll('[data-htw-close]')
const overlay = document.getElementById('overlay')

openButton.forEach( button =>{
    button.addEventListener('click', () =>{
        const content = document.querySelector(button.dataset.htwTarget)
        openContent(content)
    })
})

overlay.addEventListener('click', (event) => {
    if (event.target === overlay) { // Ensures click is directly on the overlay
        const contentsOverlay = document.querySelectorAll('.htw-content.active')
        contentsOverlay.forEach(content => {
            closeContent(content);
        });
    }
});

closeButton.forEach( button =>{
    button.addEventListener('click', () =>{
        const content = button.closest('.htw-content')
        closeContent(content)
    })
})

function openContent(content){
    if(content==null)
        return
    content.classList.add('active')
    overlay.classList.add('active')
}

function closeContent(content){
    if(content==null)
        return
    content.classList.remove('active')
    overlay.classList.remove('active')
}

//feedback
document.getElementById("feedbackForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const message = document.getElementById("feedback").value;

    fetch("http://localhost:3000/submit-feedback", { //change
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById("feedbackForm").reset();
    })
    .catch(error => console.error("Error:", error));
});
