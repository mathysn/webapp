document.addEventListener('DOMContentLoaded', (e) => {
    const input = document.getElementById("edit-pfp-choose-file");
    const label = document.getElementById("edit-pfp-choose-file-label");
    const image = document.getElementById("profile-picture");
    const errMsgContainer = document.getElementById("error-message-container");
    const errMsg = document.getElementById("error-message");
    const maxFileSize = 10000 * 10000; // 512 * 512

    let labelValue = label.innerHTML;

    input.addEventListener('change', function(e) {
        if(input.files[0].size > maxFileSize) {
            errMsgContainer.style.display = "block";
            errMsg.innerHTML = `Error: File too big`;
        } else {
            errMsgContainer.style.display = "none";
            errMsg.innerHTML = "";
            let filename = input.value.split( "\\" ).pop();

            if(filename) {
                label.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> ${filename}`;
            } else {
                label.innerHTML = labelValue;
            }
            // TODO: add a cropping system to dynamicly adjust the image
            image.src = input.files[0]; // FIXME: update the image
        }
    });
});

