document.addEventListener("click", event => {
    let accountDetailsCategory = document.getElementById("category-account-details");
    let accountSecurityCategory = document.getElementById("category-account-security");

    if(event.target.id === "account-details") {
        accountSecurityCategory.style.display = "none";
        accountDetailsCategory.style.display = "flex";

    } else if(event.target.id === "account-security") {
        accountDetailsCategory.style.display = "none";
        accountSecurityCategory.style.display = "flex";

    }
});